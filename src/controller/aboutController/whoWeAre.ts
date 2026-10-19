import { Request, Response } from "express";
import { WhoWeAre } from "../../models/About/whoWeAreModal";
import { sendErrorResponse, sendSuccessResponse, sendSuccessWithoutResponse } from "../../utils/responseFun";
import { getOrSetCache, invalidateCache } from "../../Database/redis";

const cleanString = (val: any) => {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  return s === "" ? undefined : s;
};

const cleanBool = (val: any) => {
  if (val === undefined) return undefined;
  if (typeof val === "boolean") return val;
  const v = String(val).toLowerCase();
  return v === "true" || v === "1";
};

const normalizeStats = (val: any) => {
  if (!val) return [] as any[];
  let arr: any = val;
  if (typeof val === "string") {
    try {
      arr = JSON.parse(val);
    } catch (_) {
      arr = val.split("|").map((item: string) => item.trim()).filter(Boolean).map((item) => ({ number: "", label: item, description: "" }));
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => ({
      number: cleanString((s as any).number) ?? "",
      label: cleanString((s as any).label) ?? "",
      description: cleanString((s as any).description),
    }))
    .filter((s) => s.label || s.number || s.description);
};

const normalizeFields = (body: any) => {
  return {
    title: cleanString(body.title),
    paragraph: cleanString(body.paragraph),
    stats: normalizeStats(body.stats),
    isActive: cleanBool(body.isActive),
  };
};

// Create
export const createWhoWeAre = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { title, paragraph, stats, isActive } = normalizeFields(req.body);
    if (!title || !paragraph) return sendErrorResponse(res, 400, "title and paragraph are required");

    const doc = new WhoWeAre({ title, paragraph, stats, isActive });
    await doc.save();
    await invalidateCache("cache:about:*");

    return sendSuccessResponse(res, doc, "Who We Are section created successfully");
  } catch (error: any) {
    console.error("createWhoWeAre error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read all
export const getWhoWeAreSections = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { data: sections, isCached } = await getOrSetCache(
      "cache:about:who-we-are:all",
      () => WhoWeAre.find().sort({ createdAt: -1 }),
      86400
    );
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, sections, "Who We Are sections fetched");
  } catch (error: any) {
    console.error("getWhoWeAreSections error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read one
export const getWhoWeAreById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { data: section, isCached } = await getOrSetCache(
      `cache:about:who-we-are:id:${id}`,
      () => WhoWeAre.findById(id),
      86400
    );
    if (!section) return sendErrorResponse(res, 404, "Who We Are section not found");
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, section, "Who We Are section fetched");
  } catch (error: any) {
    console.error("getWhoWeAreById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update
export const updateWhoWeAre = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await WhoWeAre.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Who We Are section not found");

    const { title, paragraph, stats, isActive } = normalizeFields(req.body);
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (paragraph !== undefined) update.paragraph = paragraph;
    if (stats !== undefined) update.stats = stats;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await WhoWeAre.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    await invalidateCache("cache:about:*");
    return sendSuccessResponse(res, updated, "Who We Are section updated");
  } catch (error: any) {
    console.error("updateWhoWeAre error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deleteWhoWeAre = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await WhoWeAre.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Who We Are section not found");
    await invalidateCache("cache:about:*");
    return sendSuccessWithoutResponse(res, "Who We Are section deleted successfully");
  } catch (error: any) {
    console.error("deleteWhoWeAre error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
export const toggleWhoWeAreStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const section = await WhoWeAre.findById(id);
    if (!section) return sendErrorResponse(res, 404, "Who We Are section not found");
    section.isActive = Boolean(isActive);
    await section.save();
    await invalidateCache("cache:about:*");
    return sendSuccessResponse(res, section, "Who We Are section status updated");
  } catch (error: any) {
    console.error("toggleWhoWeAreStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
