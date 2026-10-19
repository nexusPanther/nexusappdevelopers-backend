import { Request, Response } from "express";
import { HeroSection } from "../../models/HeroSection/heroSectionModal";
import {
  sendErrorResponse,
  sendSuccessResponse,
  sendSuccessWithoutResponse,
} from "../../utils/responseFun";
import path from "path";
import fs from "fs";
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
    if (!pathname.startsWith("/uploads/hero")) return;
    const abs = path.join(process.cwd(), pathname.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error("deleteLocalUploadIfExists error:", (err as any)?.message || err);
  }
};

const normalizeFields = (body: any) => {
  const clean = (val: any) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  };
  const bool = (val: any) => {
    if (val === undefined) return undefined;
    if (typeof val === "boolean") return val;
    const v = String(val).toLowerCase();
    return v === "true" || v === "1";
  };
  return {
    heading: clean(body.heading),
    highlightedHeading: clean(body.highlightedHeading),
    paragraph: clean(body.paragraph),
    image: clean(body.image),
    isActive: bool(body.isActive),
  };
};

// Create a new hero section
const createHero = async (req: Request, res: Response): Promise<Response> => {
  try {
    const file = ((req as any).file as Express.Multer.File | undefined) ||
      (((req as any).files as Express.Multer.File[] | undefined)?.[0]);
    const { heading, highlightedHeading, paragraph, image, isActive } = normalizeFields(req.body);

    if (!heading) {
      return sendErrorResponse(res, 400, "heading is required");
    }

    const baseUrl = buildBaseUrl(req);
    const uploadedRelative = file ? path.posix.join("/uploads/hero", file.filename) : undefined;
    const finalImage = ensureFullUrl(uploadedRelative ?? image, baseUrl);

    const hero = new HeroSection({ heading, highlightedHeading, paragraph, image: finalImage, isActive });
    await hero.save();
    await invalidateCache("cache:hero:*");

    return sendSuccessResponse(res, hero, "Hero section created successfully");
  } catch (error: any) {
    console.error("createHero error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get list of hero sections
const getHeroes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { data: heroes, isCached } = await getOrSetCache(
      "cache:hero:all",
      () => HeroSection.find().sort({ createdAt: -1 }),
      86400
    );
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, heroes, "Hero sections fetched");
  } catch (error: any) {
    console.error("getHeroes error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get single hero by id
const getHeroById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { data: hero, isCached } = await getOrSetCache(
      `cache:hero:id:${id}`,
      () => HeroSection.findById(id),
      86400
    );
    if (!hero) return sendErrorResponse(res, 404, "Hero section not found");
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, hero, "Hero section fetched");
  } catch (error: any) {
    console.error("getHeroById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update hero by id
const updateHero = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await HeroSection.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Hero section not found");

    const file = ((req as any).file as Express.Multer.File | undefined) ||
      (((req as any).files as Express.Multer.File[] | undefined)?.[0]);
    const { heading, highlightedHeading, paragraph, image, isActive } = normalizeFields(req.body);

    const update: any = {};
    if (heading !== undefined) update.heading = heading;
    if (highlightedHeading !== undefined) update.highlightedHeading = highlightedHeading;
    if (paragraph !== undefined) update.paragraph = paragraph;
    if (isActive !== undefined) update.isActive = isActive;

    const baseUrl = buildBaseUrl(req);
    if (file) {
      const uploadedRelative = path.posix.join("/uploads/hero", file.filename);
      update.image = ensureFullUrl(uploadedRelative, baseUrl);
      deleteLocalUploadIfExists(existing.image as string | undefined);
    } else if (image !== undefined) {
      update.image = ensureFullUrl(image, baseUrl);
    }

    const hero = await HeroSection.findByIdAndUpdate(id, update, { new: true });
    await invalidateCache("cache:hero:*");
    return sendSuccessResponse(res, hero, "Hero section updated");
  } catch (error: any) {
    console.error("updateHero error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete hero by id
const deleteHero = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const hero = await HeroSection.findByIdAndDelete(id);
    if (!hero) return sendErrorResponse(res, 404, "Hero section not found");
    deleteLocalUploadIfExists((hero as any).image as string | undefined);
    await invalidateCache("cache:hero:*");
    return sendSuccessWithoutResponse(res, "Hero section deleted successfully");
  } catch (error: any) {
    console.error("deleteHero error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
const toggleHeroStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const hero = await HeroSection.findById(id);
    if (!hero) return sendErrorResponse(res, 404, "Hero section not found");
    hero.isActive = Boolean(isActive);
    await hero.save();
    await invalidateCache("cache:hero:*");
    return sendSuccessResponse(res, hero, "Hero section status updated");
  } catch (error: any) {
    console.error("toggleHeroStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export { createHero, getHeroes, getHeroById, updateHero, deleteHero, toggleHeroStatus };
