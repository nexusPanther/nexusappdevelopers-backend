import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Blog } from "../../models/Blog/blogModal";
import { sendErrorResponse, sendSuccessResponse, sendSuccessWithoutResponse } from "../../utils/responseFun";
import { getOrSetCache, invalidateCache } from "../../Database/redis";

const buildBaseUrl = (req: Request) => {
  const envBase = process.env.BASE_URL?.trim().replace(/\/?$/, "");
  if (envBase) return envBase;
  return `${req.protocol}://${req.get("host")}`;
};

const ensureFullUrl = (maybePath: string | undefined, baseUrl: string): string | undefined => {
  if (!maybePath) return undefined;
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) return maybePath;
  const normalized = maybePath.startsWith("/") ? maybePath : `/${maybePath}`;
  return `${baseUrl}${normalized}`;
};

const deleteLocalUploadIfExists = (url?: string) => {
  try {
    if (!url) return;
    let pathname = url;
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        pathname = new URL(url).pathname;
      }
    } catch (_) {}
    if (!pathname.startsWith("/uploads/blog")) return;
    const abs = path.join(process.cwd(), pathname.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error("deleteLocalUploadIfExists error:", (err as any)?.message || err);
  }
};

const getFileByField = (req: Request, field: string): Express.Multer.File | undefined => {
  const files = (req as any).files as Express.Multer.File[] | undefined;
  if (!Array.isArray(files)) return undefined;
  return files.find((f) => f.fieldname === field) || files[0];
};

const mapToFullUrls = (item: any, baseUrl: string) => {
  if (!item) return item;
  const result = item.toObject ? item.toObject() : { ...item };
  result.image = ensureFullUrl(result.image, baseUrl);
  return result;
};

// List all blog items
export const getBlogItems = async (req: Request, res: Response): Promise<Response> => {
  try {
    const baseUrl = buildBaseUrl(req);
    const { data: mapped, isCached } = await getOrSetCache(
      "cache:blogs:all",
      async () => {
        const items = await Blog.find().sort({ createdAt: -1 });
        return items.map((item) => mapToFullUrls(item, baseUrl));
      },
      86400
    );
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, mapped, "Blog items fetched");
  } catch (error: any) {
    console.error("getBlogItems error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get single by id
export const getBlogById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const baseUrl = buildBaseUrl(req);
    const { id } = req.params;
    const { data: mapped, isCached } = await getOrSetCache(
      `cache:blogs:id:${id}`,
      async () => {
        const item = await Blog.findById(id);
        if (!item) return null;
        return mapToFullUrls(item, baseUrl);
      },
      86400
    );
    if (!mapped) return sendErrorResponse(res, 404, "Blog item not found");
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, mapped, "Blog item fetched");
  } catch (error: any) {
    console.error("getBlogById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Create new blog item
export const createBlog = async (req: Request, res: Response): Promise<Response> => {
  try {
    const imageFile = getFileByField(req, "image");
    let { title, subtitle, description, date, readTime, author, category, featured, tags, content, slug, metaTitle, metaDescription, metaKeywords } = req.body;

    const getSingleValue = (val: any) => Array.isArray(val) ? val[0] : val;
    title = getSingleValue(title);
    subtitle = getSingleValue(subtitle);
    description = getSingleValue(description);
    date = getSingleValue(date);
    readTime = getSingleValue(readTime);
    author = getSingleValue(author);
    category = getSingleValue(category);
    slug = getSingleValue(slug);
    metaTitle = getSingleValue(metaTitle);
    metaDescription = getSingleValue(metaDescription);
    metaKeywords = getSingleValue(metaKeywords);

    if (!title || !description) {
      return sendErrorResponse(res, 400, "title and description are required");
    }

    const baseUrl = buildBaseUrl(req);
    const uploadDir = path.posix.join("/uploads/blog");

    let payload: any = {
      title,
      subtitle: subtitle || "",
      description,
      date: date || "",
      readTime: readTime || "",
      author: author || "",
      category: category || "",
      featured: featured === "true" || featured === true,
      tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
      content: content ? (typeof content === "string" ? JSON.parse(content) : content) : [],
      slug: slug || "",
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      metaKeywords: metaKeywords || "",
    };

    if (imageFile) {
      payload.image = path.posix.join(uploadDir, imageFile.filename);
    }

    const doc = new Blog(payload);
    await doc.save();
    await invalidateCache("cache:blogs:*", "cache:dashboard:*");

    const result = mapToFullUrls(doc, baseUrl);
    return sendSuccessResponse(res, result, "Blog item created");
  } catch (error: any) {
    console.error("createBlog error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update existing blog item
export const updateBlog = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) return sendErrorResponse(res, 400, "Blog id required");

    const existing = await Blog.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Blog item not found");

    const imageFile = getFileByField(req, "image");
    let { title, subtitle, description, date, readTime, author, category, featured, tags, content, image, slug, metaTitle, metaDescription, metaKeywords } = req.body;

    const getSingleValue = (val: any) => Array.isArray(val) ? val[0] : val;
    title = getSingleValue(title);
    subtitle = getSingleValue(subtitle);
    description = getSingleValue(description);
    date = getSingleValue(date);
    readTime = getSingleValue(readTime);
    author = getSingleValue(author);
    category = getSingleValue(category);
    slug = getSingleValue(slug);
    metaTitle = getSingleValue(metaTitle);
    metaDescription = getSingleValue(metaDescription);
    metaKeywords = getSingleValue(metaKeywords);

    const baseUrl = buildBaseUrl(req);
    const uploadDir = path.posix.join("/uploads/blog");

    const update: any = {};

    if (title !== undefined) update.title = title;
    if (subtitle !== undefined) update.subtitle = subtitle;
    if (description !== undefined) update.description = description;
    if (date !== undefined) update.date = date;
    if (readTime !== undefined) update.readTime = readTime;
    if (author !== undefined) update.author = author;
    if (category !== undefined) update.category = category;
    if (featured !== undefined) update.featured = featured === "true" || featured === true;
    if (tags !== undefined) update.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
    if (content !== undefined) update.content = typeof content === "string" ? JSON.parse(content) : content;
    if (slug !== undefined) update.slug = slug;
    if (metaTitle !== undefined) update.metaTitle = metaTitle;
    if (metaDescription !== undefined) update.metaDescription = metaDescription;
    if (metaKeywords !== undefined) update.metaKeywords = metaKeywords;

    if (imageFile) {
      const rel = path.posix.join(uploadDir, imageFile.filename);
      update.image = rel;
      deleteLocalUploadIfExists(existing.image as any);
    } else if (image !== undefined) {
      update.image = image;
    }

    const updated = await Blog.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) return sendErrorResponse(res, 404, "Blog item not found");

    await invalidateCache("cache:blogs:*", "cache:dashboard:*");
    const result = mapToFullUrls(updated, baseUrl);
    return sendSuccessResponse(res, result, "Blog item updated");
  } catch (error: any) {
    console.error("updateBlog error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deleteBlog = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Blog item not found");
    deleteLocalUploadIfExists((deleted as any).image as string | undefined);
    await invalidateCache("cache:blogs:*", "cache:dashboard:*");
    return sendSuccessWithoutResponse(res, "Blog item deleted successfully");
  } catch (error: any) {
    console.error("deleteBlog error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export default getBlogItems;
