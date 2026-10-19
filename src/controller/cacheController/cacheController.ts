import { Request, Response } from "express";
import {
  getRedisStats,
  flushAllCache,
  invalidateCache,
  redisDel,
  redisSet,
  isRedisReady,
} from "../../Database/redis";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";
import { Service } from "../../models/Service/serviceModal";
import { Portfolio } from "../../models/Portfolio/portfolioModal";
import { Blog } from "../../models/Blog/blogModal";
import { FestivePopup, NormalPopup } from "../../models/PopupModal/popupModal";
import { MetaTag } from "../../models/MetaTag/metaTagModal";
import { DEFAULT_META_TAGS } from "../metaTagController/defaultMetaTags";

/**
 * GET /api/admin/cache/stats
 * Retrieve live Redis status, memory usage, key count, and category breakdown
 */
export const getStats = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const stats = await getRedisStats();
    return sendSuccessResponse(res, stats, "Redis cache stats fetched");
  } catch (error: any) {
    console.error("getStats error:", error?.message || error);
    return sendErrorResponse(res, 500, "Failed to retrieve Redis statistics");
  }
};

/**
 * POST /api/admin/cache/clear
 * Clear all cache, or target specific module/pattern/key
 */
export const clearCache = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { target, pattern, key } = req.body || {};

    if (!isRedisReady()) {
      return sendErrorResponse(res, 503, "Redis is not connected or ready");
    }

    if (key && typeof key === "string") {
      await redisDel(key.trim());
      const updatedStats = await getRedisStats();
      return sendSuccessResponse(
        res,
        { cleared: [key.trim()], stats: updatedStats },
        `Cache key "${key}" cleared successfully`
      );
    }

    if (pattern && typeof pattern === "string") {
      await invalidateCache(pattern.trim());
      const updatedStats = await getRedisStats();
      return sendSuccessResponse(
        res,
        { clearedPattern: pattern.trim(), stats: updatedStats },
        `Cache matching "${pattern}" cleared successfully`
      );
    }

    const t = String(target || "all").toLowerCase().trim();

    switch (t) {
      case "all":
        await flushAllCache();
        break;
      case "services":
        await invalidateCache("cache:services:*");
        break;
      case "portfolio":
        await invalidateCache("cache:portfolio:*");
        break;
      case "blogs":
        await invalidateCache("cache:blogs:*");
        break;
      case "testimonials":
        await invalidateCache("cache:testimonials:*");
        break;
      case "faqs":
      case "faq":
        await invalidateCache("cache:faqs:*");
        break;
      case "metatags":
      case "meta-tags":
      case "seo":
        await invalidateCache("meta_tags:*");
        break;
      case "popups":
        await invalidateCache("cache:popups:*");
        break;
      case "dashboard":
        await invalidateCache("cache:dashboard:*");
        break;
      case "hero":
        await invalidateCache("cache:hero:*");
        break;
      case "about":
        await invalidateCache("cache:about:*");
        break;
      case "contacts":
        await invalidateCache("cache:contacts:*");
        break;
      case "legal":
        await invalidateCache("cache:legal:*");
        break;
      default:
        return sendErrorResponse(res, 400, `Unknown cache target: "${target}"`);
    }

    const updatedStats = await getRedisStats();
    return sendSuccessResponse(
      res,
      { target: t, stats: updatedStats },
      t === "all"
        ? "All Redis cache flushed successfully!"
        : `Cache for "${t}" cleared successfully!`
    );
  } catch (error: any) {
    console.error("clearCache error:", error?.message || error);
    return sendErrorResponse(res, 500, "Failed to clear Redis cache");
  }
};

/**
 * POST /api/admin/cache/warmup
 * Pre-populate commonly requested pages into Redis
 */
export const warmupCache = async (_req: Request, res: Response): Promise<Response> => {
  try {
    if (!isRedisReady()) {
      return sendErrorResponse(res, 503, "Redis is not connected or ready");
    }

    let warmedCount = 0;

    // 1. Services
    const services = await Service.find().sort({ createdAt: -1 });
    await redisSet("cache:services:all", services, 86400);
    warmedCount++;

    // 2. Portfolio
    const portfolio = await Portfolio.find().sort({ createdAt: -1 });
    await redisSet("cache:portfolio:all", portfolio, 86400);
    warmedCount++;

    // 3. Blogs
    const blogs = await Blog.find().sort({ createdAt: -1 });
    await redisSet("cache:blogs:all", blogs, 86400);
    warmedCount++;

    // 4. Popups
    const [festive, normal] = await Promise.all([
      FestivePopup.findOne(),
      NormalPopup.findOne(),
    ]);
    await redisSet("cache:popups:status", {
      normalEnabled: normal ? normal.isEnabled : true,
      festiveEnabled: festive ? festive.isEnabled : false,
      animationType: festive ? festive.animationType : "snow",
    }, 86400);
    warmedCount++;

    // 5. Meta tags
    const dbTags = await MetaTag.find();
    const tagMap: Record<string, any> = {};
    for (const def of DEFAULT_META_TAGS) {
      tagMap[def.route] = def;
    }
    for (const tag of dbTags) {
      tagMap[tag.route] = tag.toObject ? tag.toObject() : tag;
    }
    await redisSet("meta_tags:map", tagMap, 86400);
    await redisSet("meta_tags:all", Object.values(tagMap), 86400);
    warmedCount += 2;

    const stats = await getRedisStats();
    return sendSuccessResponse(
      res,
      { warmedModules: warmedCount, stats },
      `Cache successfully warmed up with ${warmedCount} critical modules!`
    );
  } catch (error: any) {
    console.error("warmupCache error:", error?.message || error);
    return sendErrorResponse(res, 500, "Failed to warm up cache");
  }
};
