import { Request, Response } from "express";
import { StandOut } from "../../models/About/standOutModal";
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

const normalizeItems = (val: any) => {
  if (val === undefined || val === null) return [] as string[];
  if (Array.isArray(val)) return val.map((v) => cleanString(v) ?? "").filter(Boolean);
  const s = String(val).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((v) => cleanString(v) ?? "").filter(Boolean);
  } catch (_) {}
  return s.split("|").map((v) => v.trim()).filter(Boolean);
};

const normalizeCard = (val: any) => {
  if (!val) return undefined;
  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch (_) {}
  }
  return {
    title: cleanString(val?.title),
    items: normalizeItems(val?.items),
    borderColor: cleanString(val?.borderColor),
  };
};

const normalizeFields = (body: any) => {
  return {
    mainTitle: cleanString(body.mainTitle),
    subtitle: cleanString(body.subtitle),
    manualWork: normalizeCard(body.manualWork),
    nexusAutomation: normalizeCard(body.nexusAutomation),
    isActive: cleanBool(body.isActive),
  };
};

// Create
export const createStandOut = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { mainTitle, subtitle, manualWork, nexusAutomation, isActive } = normalizeFields(req.body);
    if (!mainTitle || !subtitle) return sendErrorResponse(res, 400, "mainTitle and subtitle are required");
    if (!manualWork?.title || !nexusAutomation?.title) {
      return sendErrorResponse(res, 400, "manualWork.title and nexusAutomation.title are required");
    }

    const doc = new StandOut({
      mainTitle,
      subtitle,
      manualWork,
      nexusAutomation,
      isActive,
    });
    await doc.save();
    await invalidateCache("cache:about:*");

    return sendSuccessResponse(res, doc, "Stand Out section created successfully");
  } catch (error: any) {
    console.error("createStandOut error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read all
export const getStandOutSections = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { data: sections, isCached } = await getOrSetCache(
      "cache:about:stand-out:all",
      () => StandOut.find().sort({ createdAt: -1 }),
      86400
    );
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, sections, "Stand Out sections fetched");
  } catch (error: any) {
    console.error("getStandOutSections error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read one
export const getStandOutById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { data: section, isCached } = await getOrSetCache(
      `cache:about:stand-out:id:${id}`,
      () => StandOut.findById(id),
      86400
    );
    if (!section) return sendErrorResponse(res, 404, "Stand Out section not found");
    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");
    return sendSuccessResponse(res, section, "Stand Out section fetched");
  } catch (error: any) {
    console.error("getStandOutById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update
export const updateStandOut = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await StandOut.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Stand Out section not found");

    const { mainTitle, subtitle, manualWork, nexusAutomation, isActive } = normalizeFields(req.body);
    const update: any = {};
    if (mainTitle !== undefined) update.mainTitle = mainTitle;
    if (subtitle !== undefined) update.subtitle = subtitle;
    if (manualWork !== undefined) update.manualWork = manualWork;
    if (nexusAutomation !== undefined) update.nexusAutomation = nexusAutomation;
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await StandOut.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    await invalidateCache("cache:about:*");
    return sendSuccessResponse(res, updated, "Stand Out section updated");
  } catch (error: any) {
    console.error("updateStandOut error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deleteStandOut = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await StandOut.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Stand Out section not found");
    await invalidateCache("cache:about:*");
    return sendSuccessWithoutResponse(res, "Stand Out section deleted successfully");
  } catch (error: any) {
    console.error("deleteStandOut error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
export const toggleStandOutStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const section = await StandOut.findById(id);
    if (!section) return sendErrorResponse(res, 404, "Stand Out section not found");
    section.isActive = Boolean(isActive);
    await section.save();
    await invalidateCache("cache:about:*");
    return sendSuccessResponse(res, section, "Stand Out section status updated");
  } catch (error: any) {
    console.error("toggleStandOutStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
