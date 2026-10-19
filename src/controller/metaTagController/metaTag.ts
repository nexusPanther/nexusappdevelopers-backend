import { Request, Response } from "express";
import { MetaTag } from "../../models/MetaTag/metaTagModal";
import { Service } from "../../models/Service/serviceModal";
import { DEFAULT_META_TAGS } from "./defaultMetaTags";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";
import {
  redisGet,
  redisSet,
  redisDel,
  redisDelByPattern,
} from "../../Database/redis";

// Redis Cache Keys
const CACHE_KEY_ALL = "meta_tags:all";
const CACHE_KEY_MAP = "meta_tags:map";
const CACHE_KEY_ROUTE = (route: string) => `meta_tags:route:${route}`;
const CACHE_TTL = Number(process.env.REDIS_TTL) || 86400; // 24 hours

/**
 * Invalidate all meta tag cache keys in Redis
 */
export const invalidateMetaTagsCache = async () => {
  try {
    await redisDel(CACHE_KEY_ALL, CACHE_KEY_MAP);
    await redisDelByPattern("meta_tags:route:*");
  } catch (err: any) {
    console.warn("Error invalidating meta tags Redis cache:", err?.message || err);
  }
};

/**
 * Normalizes a route string:
 * - Ensures leading slash '/'
 * - Strips trailing slash unless root '/'
 * - Trims whitespace
 */
export const normalizeRoute = (rawRoute?: string): string => {
  if (!rawRoute) return "/";
  let r = rawRoute.trim();
  if (!r.startsWith("/")) r = `/${r}`;
  if (r.length > 1 && r.endsWith("/")) r = r.slice(0, -1);
  return r;
};

/**
 * Auto-seeds default meta tags into MongoDB if missing
 */
export const initMetaTagsSeed = async () => {
  try {
    for (const item of DEFAULT_META_TAGS) {
      const normalized = normalizeRoute(item.route);
      const existing = await MetaTag.findOne({ route: normalized });
      if (!existing) {
        await MetaTag.create({
          ...item,
          route: normalized,
        });
      }
    }
    await invalidateMetaTagsCache();
  } catch (err: any) {
    console.error("initMetaTagsSeed error:", err?.message || err);
  }
};

/**
 * GET /api/meta-tags
 * Fetch all meta tags (public or admin). Supports Redis caching, ?format=map and ?search=
 */
export const getAllMetaTags = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { format, search } = req.query;
    const isSearching = search && typeof search === "string" && search.trim() !== "";

    // If no search filter, attempt Redis cache lookup
    if (!isSearching) {
      const cacheKey = format === "map" ? CACHE_KEY_MAP : CACHE_KEY_ALL;
      const cachedData = await redisGet(cacheKey);
      if (cachedData) {
        res.setHeader("X-Cache", "HIT-REDIS");
        return sendSuccessResponse(res, cachedData, "Meta tags fetched successfully (from Redis cache)");
      }
    }

    const count = await MetaTag.countDocuments();
    if (count === 0) {
      await initMetaTagsSeed();
    }

    const filter: any = {};
    if (isSearching) {
      const q = (search as string).trim();
      filter.$or = [
        { route: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { focusKeyword: { $regex: q, $options: "i" } },
        { pageTitle: { $regex: q, $options: "i" } },
      ];
    }

    const list = await MetaTag.find(filter).sort({ route: 1 });

    if (format === "map") {
      const map: Record<string, any> = {};
      list.forEach((item) => {
        map[item.route] = item;
      });

      if (!isSearching) {
        await redisSet(CACHE_KEY_MAP, map, CACHE_TTL);
      }
      res.setHeader("X-Cache", "MISS-DATABASE");
      return sendSuccessResponse(res, map, "Meta tags map fetched successfully");
    }

    if (!isSearching) {
      await redisSet(CACHE_KEY_ALL, list, CACHE_TTL);
    }

    res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, list, "Meta tags fetched successfully");
  } catch (error: any) {
    console.error("getAllMetaTags error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * GET /api/meta-tags/by-route?route=/about-us
 * Lookup a single meta tag by its URL route with Redis cache
 */
export const getMetaTagByRoute = async (req: Request, res: Response): Promise<Response> => {
  try {
    const rawRoute = (req.query.route as string) || "/";
    const route = normalizeRoute(rawRoute);
    const cacheKey = CACHE_KEY_ROUTE(route);

    // 1. Try Redis cache
    const cachedItem = await redisGet(cacheKey);
    if (cachedItem) {
      res.setHeader("X-Cache", "HIT-REDIS");
      return sendSuccessResponse(res, cachedItem, "Meta tag fetched successfully (from Redis cache)");
    }

    // 2. Query MongoDB
    let doc = await MetaTag.findOne({ route });
    if (!doc) {
      // Check if it's one of the defaults
      const foundDefault = DEFAULT_META_TAGS.find(
        (d) => normalizeRoute(d.route) === route
      );
      if (foundDefault) {
        doc = await MetaTag.create({
          ...foundDefault,
          route,
        });
        await invalidateMetaTagsCache();
      }
    }

    if (!doc) {
      return sendErrorResponse(res, 404, `No meta tags found for route: ${route}`);
    }

    // 3. Store in Redis
    await redisSet(cacheKey, doc, CACHE_TTL);

    res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, doc, "Meta tag fetched successfully");
  } catch (error: any) {
    console.error("getMetaTagByRoute error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * POST /api/admin/meta-tags
 * Create or Upsert a meta tag by route (invalidates Redis cache)
 */
export const createOrUpdateMetaTag = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      route: rawRoute,
      pageTitle,
      focusKeyword,
      title,
      description,
      keywords,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterCard,
    } = req.body;

    if (!rawRoute || !title || !description) {
      return sendErrorResponse(res, 400, "route, title, and description are required");
    }

    const route = normalizeRoute(rawRoute);

    const updateData: any = {
      route,
      pageTitle: pageTitle ? String(pageTitle).trim() : "",
      focusKeyword: focusKeyword ? String(focusKeyword).trim() : "",
      title: String(title).trim(),
      description: String(description).trim(),
      keywords: keywords ? String(keywords).trim() : focusKeyword ? String(focusKeyword).trim() : "",
      canonical: canonical ? String(canonical).trim() : "",
      ogTitle: ogTitle ? String(ogTitle).trim() : String(title).trim(),
      ogDescription: ogDescription ? String(ogDescription).trim() : String(description).trim(),
      ogImage: ogImage ? String(ogImage).trim() : "/static/img/logo.png",
      twitterTitle: twitterTitle ? String(twitterTitle).trim() : String(title).trim(),
      twitterDescription: twitterDescription ? String(twitterDescription).trim() : String(description).trim(),
      twitterCard: twitterCard ? String(twitterCard).trim() : "summary_large_image",
    };

    const doc = await MetaTag.findOneAndUpdate(
      { route },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    // If this route belongs to a service (/services/:slug), keep Service model in sync
    if (route.startsWith("/services/")) {
      const slug = route.replace("/services/", "");
      if (slug) {
        await Service.updateMany(
          {
            $or: [
              { slug },
              { title: new RegExp(`^${slug.replace(/-/g, " ")}$`, "i") },
            ],
          },
          {
            $set: {
              metaTitle: updateData.title,
              metaDescription: updateData.description,
              metaKeywords: updateData.keywords || updateData.focusKeyword,
            },
          }
        ).catch(() => {});
      }
    }

    // Invalidate and update Redis cache
    await invalidateMetaTagsCache();
    await redisSet(CACHE_KEY_ROUTE(route), doc, CACHE_TTL);

    return sendSuccessResponse(res, doc, "Meta tag saved successfully");
  } catch (error: any) {
    console.error("createOrUpdateMetaTag error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * PUT /api/admin/meta-tags/:id
 * Update meta tag by _id (invalidates Redis cache)
 */
export const updateMetaTagById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await MetaTag.findById(id);
    if (!existing) {
      return sendErrorResponse(res, 404, "Meta tag record not found");
    }

    const {
      route: rawRoute,
      pageTitle,
      focusKeyword,
      title,
      description,
      keywords,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterCard,
    } = req.body;

    const route = rawRoute ? normalizeRoute(rawRoute) : existing.route;

    const updateData: any = {};
    if (rawRoute !== undefined) updateData.route = route;
    if (pageTitle !== undefined) updateData.pageTitle = String(pageTitle).trim();
    if (focusKeyword !== undefined) updateData.focusKeyword = String(focusKeyword).trim();
    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (keywords !== undefined) updateData.keywords = String(keywords).trim();
    if (canonical !== undefined) updateData.canonical = String(canonical).trim();
    if (ogTitle !== undefined) updateData.ogTitle = String(ogTitle).trim();
    if (ogDescription !== undefined) updateData.ogDescription = String(ogDescription).trim();
    if (ogImage !== undefined) updateData.ogImage = String(ogImage).trim();
    if (twitterTitle !== undefined) updateData.twitterTitle = String(twitterTitle).trim();
    if (twitterDescription !== undefined) updateData.twitterDescription = String(twitterDescription).trim();
    if (twitterCard !== undefined) updateData.twitterCard = String(twitterCard).trim();

    const doc = await MetaTag.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Sync with Service if applicable
    if (route.startsWith("/services/")) {
      const slug = route.replace("/services/", "");
      if (slug && doc) {
        await Service.updateMany(
          {
            $or: [
              { slug },
              { title: new RegExp(`^${slug.replace(/-/g, " ")}$`, "i") },
            ],
          },
          {
            $set: {
              metaTitle: doc.title,
              metaDescription: doc.description,
              metaKeywords: doc.keywords || doc.focusKeyword,
            },
          }
        ).catch(() => {});
      }
    }

    // Invalidate Redis cache
    await invalidateMetaTagsCache();
    if (doc) {
      await redisSet(CACHE_KEY_ROUTE(route), doc, CACHE_TTL);
    }

    return sendSuccessResponse(res, doc, "Meta tag updated successfully");
  } catch (error: any) {
    console.error("updateMetaTagById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * DELETE /api/admin/meta-tags/:id
 * Delete a custom meta tag (invalidates Redis cache)
 */
export const deleteMetaTag = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const doc = await MetaTag.findByIdAndDelete(id);
    if (!doc) {
      return sendErrorResponse(res, 404, "Meta tag not found");
    }

    // Invalidate Redis cache
    await invalidateMetaTagsCache();

    return sendSuccessResponse(res, { metaTag: doc }, "Meta tag deleted successfully");
  } catch (error: any) {
    console.error("deleteMetaTag error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * POST /api/admin/meta-tags/seed
 * Force reset or seed defaults (invalidates Redis cache)
 */
export const seedDefaultMetaTags = async (_req: Request, res: Response): Promise<Response> => {
  try {
    await initMetaTagsSeed();
    const list = await MetaTag.find().sort({ route: 1 });
    await invalidateMetaTagsCache();
    await redisSet(CACHE_KEY_ALL, list, CACHE_TTL);
    return sendSuccessResponse(res, list, "Default meta tags seeded and cached in Redis successfully");
  } catch (error: any) {
    console.error("seedDefaultMetaTags error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
