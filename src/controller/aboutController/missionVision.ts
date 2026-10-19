import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { MissionVision } from "../../models/About/missionVisionModal";
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
    if (!pathname.startsWith("/uploads/missionVision")) return;
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
    missionParagraph: clean(body.missionParagraph),
    missionImage: clean(body.missionImage),
    visionParagraph: clean(body.visionParagraph),
    visionImage: clean(body.visionImage),
    isActive: bool(body.isActive),
  };
};

const getFileByField = (req: Request, field: string): Express.Multer.File | undefined => {
  const files = (req as any).files as Express.Multer.File[] | undefined;
  if (!Array.isArray(files)) return undefined;
  return files.find((f) => f.fieldname === field);
};

// Create
export const createMissionVision = async (req: Request, res: Response): Promise<Response> => {
  try {
    const missionFile = getFileByField(req, "missionImage");
    const visionFile = getFileByField(req, "visionImage");
    const { missionParagraph, missionImage, visionParagraph, visionImage, isActive } = normalizeFields(req.body);

    if (!missionParagraph || !visionParagraph) {
      return sendErrorResponse(res, 400, "missionParagraph and visionParagraph are required");
    }

    const baseUrl = buildBaseUrl(req);
    const missionRel = missionFile ? path.posix.join("/uploads/missionVision", missionFile.filename) : undefined;
    const visionRel = visionFile ? path.posix.join("/uploads/missionVision", visionFile.filename) : undefined;

    const doc = new MissionVision({
      missionParagraph,
      visionParagraph,
      missionImage: ensureFullUrl(missionRel ?? missionImage, baseUrl),
      visionImage: ensureFullUrl(visionRel ?? visionImage, baseUrl),
      isActive,
    });
    await doc.save();
    await invalidateCache("cache:about:*");

    return sendSuccessResponse(res, doc, "Mission/Vision section created successfully");
  } catch (error: any) {
    console.error("createMissionVision error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read all
export const getMissionVisionSections = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { data: sections, isCached } = await getOrSetCache(
      "cache:about:mission-vision:all",
      () => MissionVision.find().sort({ createdAt: -1 }),
      86400
    );
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, sections, "Mission/Vision sections fetched");
  } catch (error: any) {
    console.error("getMissionVisionSections error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read one
export const getMissionVisionById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { data: section, isCached } = await getOrSetCache(
      `cache:about:mission-vision:id:${id}`,
      () => MissionVision.findById(id),
      86400
    );
    if (!section) return sendErrorResponse(res, 404, "Mission/Vision section not found");
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, section, "Mission/Vision section fetched");
  } catch (error: any) {
    console.error("getMissionVisionById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update
export const updateMissionVision = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await MissionVision.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Mission/Vision section not found");

    const missionFile = getFileByField(req, "missionImage");
    const visionFile = getFileByField(req, "visionImage");
    const { missionParagraph, missionImage, visionParagraph, visionImage, isActive } = normalizeFields(req.body);

    const update: any = {};
    if (missionParagraph !== undefined) update.missionParagraph = missionParagraph;
    if (visionParagraph !== undefined) update.visionParagraph = visionParagraph;
    if (isActive !== undefined) update.isActive = isActive;

    const baseUrl = buildBaseUrl(req);
    if (missionFile) {
      const rel = path.posix.join("/uploads/missionVision", missionFile.filename);
      update.missionImage = ensureFullUrl(rel, baseUrl);
      deleteLocalUploadIfExists(existing.missionImage as string | undefined);
    } else if (missionImage !== undefined) {
      update.missionImage = ensureFullUrl(missionImage, baseUrl);
    }

    if (visionFile) {
      const rel = path.posix.join("/uploads/missionVision", visionFile.filename);
      update.visionImage = ensureFullUrl(rel, baseUrl);
      deleteLocalUploadIfExists(existing.visionImage as string | undefined);
    } else if (visionImage !== undefined) {
      update.visionImage = ensureFullUrl(visionImage, baseUrl);
    }

    const updated = await MissionVision.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    await invalidateCache("cache:about:*");
    return sendSuccessResponse(res, updated, "Mission/Vision section updated");
  } catch (error: any) {
    console.error("updateMissionVision error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deleteMissionVision = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await MissionVision.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Mission/Vision section not found");
    deleteLocalUploadIfExists((deleted as any).missionImage as string | undefined);
    deleteLocalUploadIfExists((deleted as any).visionImage as string | undefined);
    await invalidateCache("cache:about:*");
    return sendSuccessWithoutResponse(res, "Mission/Vision section deleted successfully");
  } catch (error: any) {
    console.error("deleteMissionVision error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
export const toggleMissionVisionStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const section = await MissionVision.findById(id);
    if (!section) return sendErrorResponse(res, 404, "Mission/Vision section not found");
    section.isActive = Boolean(isActive);
    await section.save();
    await invalidateCache("cache:about:*");
    return sendSuccessResponse(res, section, "Mission/Vision section status updated");
  } catch (error: any) {
    console.error("toggleMissionVisionStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
