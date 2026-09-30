import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { AboutHero } from "../../models/About/aboutHeroModal";
import { sendErrorResponse, sendSuccessResponse, sendSuccessWithoutResponse } from "../../utils/responseFun";

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
    if (!pathname.startsWith("/uploads/aboutHero")) return;
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

// Create
export const createAboutHero = async (req: Request, res: Response): Promise<Response> => {
  try {
    const file = ((req as any).file as Express.Multer.File | undefined) ||
      (((req as any).files as Express.Multer.File[] | undefined)?.[0]);
    const { heading, highlightedHeading, paragraph, image, isActive } = normalizeFields(req.body);

    if (!heading) return sendErrorResponse(res, 400, "heading is required");

    const baseUrl = buildBaseUrl(req);
    const uploadedRelative = file ? path.posix.join("/uploads/aboutHero", file.filename) : undefined;
    const finalImage = ensureFullUrl(uploadedRelative ?? image, baseUrl);

    const doc = new AboutHero({ heading, highlightedHeading, paragraph, image: finalImage, isActive });
    await doc.save();
    return sendSuccessResponse(res, doc, "About hero section created successfully");
  } catch (error: any) {
    console.error("createAboutHero error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read all
export const getAboutHeroSections = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const sections = await AboutHero.find().sort({ createdAt: -1 });
    return sendSuccessResponse(res, sections, "About hero sections fetched");
  } catch (error: any) {
    console.error("getAboutHeroSections error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read one
export const getAboutHeroById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const section = await AboutHero.findById(id);
    if (!section) return sendErrorResponse(res, 404, "About hero section not found");
    return sendSuccessResponse(res, section, "About hero section fetched");
  } catch (error: any) {
    console.error("getAboutHeroById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update
export const updateAboutHero = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await AboutHero.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "About hero section not found");

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
      const uploadedRelative = path.posix.join("/uploads/aboutHero", file.filename);
      update.image = ensureFullUrl(uploadedRelative, baseUrl);
      deleteLocalUploadIfExists(existing.image as string | undefined);
    } else if (image !== undefined) {
      update.image = ensureFullUrl(image, baseUrl);
    }

    const updated = await AboutHero.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    return sendSuccessResponse(res, updated, "About hero section updated");
  } catch (error: any) {
    console.error("updateAboutHero error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deleteAboutHero = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await AboutHero.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "About hero section not found");
    deleteLocalUploadIfExists((deleted as any).image as string | undefined);
    return sendSuccessWithoutResponse(res, "About hero section deleted successfully");
  } catch (error: any) {
    console.error("deleteAboutHero error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
export const toggleAboutHeroStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const section = await AboutHero.findById(id);
    if (!section) return sendErrorResponse(res, 404, "About hero section not found");
    section.isActive = Boolean(isActive);
    await section.save();
    return sendSuccessResponse(res, section, "About hero section status updated");
  } catch (error: any) {
    console.error("toggleAboutHeroStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
