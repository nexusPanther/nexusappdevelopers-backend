import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Service } from "../../models/Service/serviceModal";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";
import { getOrSetCache, invalidateCache } from "../../Database/redis";

// Helpers
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
    if (!pathname.startsWith("/uploads/services")) return;
    const abs = path.join(process.cwd(), pathname.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error("deleteLocalUploadIfExists error:", (err as any)?.message || err);
  }
};

const normalizeArray = (val: any): string[] => {
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  if (val === undefined || val === null) return [];
  const s = String(val).trim();
  if (!s) return [];
  // Try JSON parse first
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
  } catch (_) {}
  // Fallback: comma-separated
  return s.split(",").map((v) => v.trim()).filter(Boolean);
};

const normalizeFields = (body: any) => {
  const clean = (val: any) => {
    if (Array.isArray(val)) val = val[0];
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  };

  return {
    title: clean(body.title),
    description: clean(body.description),
    bulletPoints: normalizeArray(body.bulletPoints),
    icon: clean(body.icon),
    tools: normalizeArray(body.tools),
    image: clean(body.image),
    serviceType: clean(body.serviceType),
    higlihlightTitle: clean(body.higlihlightTitle),
    slug: clean(body.slug),
    metaTitle: clean(body.metaTitle),
    metaDescription: clean(body.metaDescription),
    metaKeywords: clean(body.metaKeywords),
  };
};

const getFileByField = (req: Request, field: string): Express.Multer.File | undefined => {
  const files = (req as any).files as Express.Multer.File[] | undefined;
  if (!Array.isArray(files)) return undefined;
  return files.find((f) => f.fieldname === field);
};

// Create service
export const createService = async (req: Request, res: Response): Promise<Response> => {
  try {
    const imageFile = getFileByField(req, "image");
    const iconFile = getFileByField(req, "icon");
    const mainImageFile = getFileByField(req, "mainImage");
    const { title, description, bulletPoints, tools, image, icon, serviceType, higlihlightTitle, slug, metaTitle, metaDescription, metaKeywords } = normalizeFields(req.body);

    if (!title || !description) {
      return sendErrorResponse(res, 400, "title and description are required");
    }

    const baseUrl = buildBaseUrl(req);
    const uploadedImage = imageFile ? path.posix.join("/uploads/services", imageFile.filename) : undefined;
    const uploadedIcon = iconFile ? path.posix.join("/uploads/services", iconFile.filename) : undefined;
    const uploadedMainImage = mainImageFile ? path.posix.join("/uploads/services", mainImageFile.filename) : undefined;
    const finalImage = ensureFullUrl(uploadedImage ?? image, baseUrl);
    const finalIcon = ensureFullUrl(uploadedIcon ?? icon, baseUrl);
    const finalMainImage = ensureFullUrl(uploadedMainImage ?? undefined, baseUrl);
    const doc = new Service({ title, description, bulletPoints, tools, image: finalImage, icon: finalIcon, serviceType, mainImage: finalMainImage, higlihlightTitle, slug, metaTitle, metaDescription, metaKeywords });
    await doc.save();
    await invalidateCache("cache:services:*", "cache:dashboard:*");
    return sendSuccessResponse(res, doc, "Service created successfully");
  } catch (error: any) {
    console.error("createService error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get all services
export const getServices = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { data: services, isCached } = await getOrSetCache(
      "cache:services:all",
      () => Service.find().sort({ createdAt: -1 }),
      86400
    );
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, services, "Services fetched successfully");
  } catch (error: any) {
    console.error("getServices error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get service by id
export const getServiceById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { data: service, isCached } = await getOrSetCache(
      `cache:services:id:${id}`,
      () => Service.findById(id),
      86400
    );
    if (!service) return sendErrorResponse(res, 404, "Service not found");
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, service, "Service fetched successfully");
  } catch (error: any) {
    console.error("getServiceById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update service
export const updateService = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await Service.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Service not found");

    const imageFile = getFileByField(req, "image");
    const iconFile = getFileByField(req, "icon");
    const mainImageFile = getFileByField(req, "mainImage");

    const { title, description, bulletPoints, tools, image, icon, serviceType, higlihlightTitle, slug, metaTitle, metaDescription, metaKeywords } = normalizeFields(req.body);
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (bulletPoints !== undefined) update.bulletPoints = bulletPoints;
    if (tools !== undefined) update.tools = tools;
    if (serviceType !== undefined) update.serviceType = serviceType;
    if (higlihlightTitle !== undefined) update.higlihlightTitle = higlihlightTitle;
    if (slug !== undefined) update.slug = slug;
    if (metaTitle !== undefined) update.metaTitle = metaTitle;
    if (metaDescription !== undefined) update.metaDescription = metaDescription;
    if (metaKeywords !== undefined) update.metaKeywords = metaKeywords;

    const baseUrl = buildBaseUrl(req);
    if (imageFile) {
      const uploadedRelative = path.posix.join("/uploads/services", imageFile.filename);
      update.image = ensureFullUrl(uploadedRelative, baseUrl);
      deleteLocalUploadIfExists(existing.image as string | undefined);
    } else if (image !== undefined) {
      update.image = ensureFullUrl(image, baseUrl);
    }

    if (iconFile) {
      const uploadedIcon = path.posix.join("/uploads/services", iconFile.filename);
      update.icon = ensureFullUrl(uploadedIcon, baseUrl);
      deleteLocalUploadIfExists((existing as any).icon as string | undefined);
    } else if (icon !== undefined) {
      update.icon = ensureFullUrl(icon, baseUrl);
    }

    if (mainImageFile) {
      const uploadedMainImage = path.posix.join("/uploads/services", mainImageFile.filename);
      update.mainImage = ensureFullUrl(uploadedMainImage, baseUrl);
      deleteLocalUploadIfExists((existing as any).mainImage as string | undefined);
    }

    const updated = await Service.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    await invalidateCache("cache:services:*", "cache:dashboard:*");
    return sendSuccessResponse(res, updated, "Service updated successfully");
  } catch (error: any) {
    console.error("updateService error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete service
export const deleteService = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Service not found");
    deleteLocalUploadIfExists((deleted as any).image as string | undefined);
    deleteLocalUploadIfExists((deleted as any).icon as string | undefined);
    deleteLocalUploadIfExists((deleted as any).mainImage as string | undefined);
    await invalidateCache("cache:services:*", "cache:dashboard:*");
    return sendSuccessResponse(res, { service: deleted }, "Service deleted successfully");
  } catch (error: any) {
    console.error("deleteService error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
