import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { AboutSection } from "../../models/About/aboutModal";
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
    if (!pathname.startsWith("/uploads/about")) return;
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

// Create about section
export const createAbout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const file = ((req as any).file as Express.Multer.File | undefined) ||
      (((req as any).files as Express.Multer.File[] | undefined)?.[0]);
    const { heading, highlightedHeading, paragraph, image, isActive } = normalizeFields(req.body);

    if (!heading) return sendErrorResponse(res, 400, "heading is required");

    const baseUrl = buildBaseUrl(req);
    const uploadedRelative = file ? path.posix.join("/uploads/about", file.filename) : undefined;
    const finalImage = ensureFullUrl(uploadedRelative ?? image, baseUrl);

    const doc = new AboutSection({ heading, highlightedHeading, paragraph, image: finalImage, isActive });
    await doc.save();
    return sendSuccessResponse(res, doc, "About section created successfully");
  } catch (error: any) {
    console.error("createAbout error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get all about sections
export const getAbouts = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const abouts = await AboutSection.find().sort({ createdAt: -1 });
    return sendSuccessResponse(res, abouts, "About sections fetched");
  } catch (error: any) {
    console.error("getAbouts error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get single about section
export const getAboutById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const about = await AboutSection.findById(id);
    if (!about) return sendErrorResponse(res, 404, "About section not found");
    return sendSuccessResponse(res, about, "About section fetched");
  } catch (error: any) {
    console.error("getAboutById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update about section
export const updateAbout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await AboutSection.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "About section not found");

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
      const uploadedRelative = path.posix.join("/uploads/about", file.filename);
      update.image = ensureFullUrl(uploadedRelative, baseUrl);
      deleteLocalUploadIfExists(existing.image as string | undefined);
    } else if (image !== undefined) {
      update.image = ensureFullUrl(image, baseUrl);
    }

    const updated = await AboutSection.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    return sendSuccessResponse(res, updated, "About section updated");
  } catch (error: any) {
    console.error("updateAbout error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete about section
export const deleteAbout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await AboutSection.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "About section not found");
    deleteLocalUploadIfExists((deleted as any).image as string | undefined);
    return sendSuccessWithoutResponse(res, "About section deleted successfully");
  } catch (error: any) {
    console.error("deleteAbout error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
export const toggleAboutStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const about = await AboutSection.findById(id);
    if (!about) return sendErrorResponse(res, 404, "About section not found");
    about.isActive = Boolean(isActive);
    await about.save();
    return sendSuccessResponse(res, about, "About section status updated");
  } catch (error: any) {
    console.error("toggleAboutStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
