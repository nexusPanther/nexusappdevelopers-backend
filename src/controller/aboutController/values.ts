import { Request, Response } from "express";
import { Values } from "../../models/About/valuesModal";
import { sendErrorResponse, sendSuccessResponse, sendSuccessWithoutResponse } from "../../utils/responseFun";

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

const normalizeValues = (val: any) => {
  if (!val) return [] as any[];
  let arr: any = val;
  if (typeof val === "string") {
    try {
      arr = JSON.parse(val);
    } catch (_) {
      arr = val.split("|").map((item: string) => item.trim()).filter(Boolean).map((item) => ({ title: item, description: "" }));
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => ({
      title: cleanString((v as any).title) ?? "",
      description: cleanString((v as any).description) ?? "",
      borderColor: cleanString((v as any).borderColor),
    }))
    .filter((v) => v.title || v.description || v.borderColor)
    .slice(0, 4);
};

const normalizeFields = (body: any) => ({
  mainTitle: cleanString(body.mainTitle),
  subtitle: cleanString(body.subtitle),
  values: normalizeValues(body.values),
  isActive: cleanBool(body.isActive),
});

// Create
export const createValues = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { mainTitle, subtitle, values, isActive } = normalizeFields(req.body);
    if (!mainTitle || !subtitle) return sendErrorResponse(res, 400, "mainTitle and subtitle are required");

    if (values.length > 4) {
      return sendErrorResponse(res, 400, "Only up to 4 values are allowed");
    }

    const doc = new Values({ mainTitle, subtitle, values, isActive });
    await doc.save();
    return sendSuccessResponse(res, doc, "Values section created successfully");
  } catch (error: any) {
    console.error("createValues error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read all
export const getValuesSections = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const sections = await Values.find().sort({ createdAt: -1 });
    return sendSuccessResponse(res, sections, "Values sections fetched");
  } catch (error: any) {
    console.error("getValuesSections error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Read one
export const getValuesById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const section = await Values.findById(id);
    if (!section) return sendErrorResponse(res, 404, "Values section not found");
    return sendSuccessResponse(res, section, "Values section fetched");
  } catch (error: any) {
    console.error("getValuesById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update
export const updateValues = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const existing = await Values.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Values section not found");

    const { mainTitle, subtitle, values, isActive } = normalizeFields(req.body);
    const update: any = {};
    if (mainTitle !== undefined) update.mainTitle = mainTitle;
    if (subtitle !== undefined) update.subtitle = subtitle;
    if (values !== undefined) {
      if (values.length > 4) {
        return sendErrorResponse(res, 400, "Only up to 4 values are allowed");
      }
      update.values = values;
    }
    if (isActive !== undefined) update.isActive = isActive;

    const updated = await Values.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    return sendSuccessResponse(res, updated, "Values section updated");
  } catch (error: any) {
    console.error("updateValues error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deleteValues = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Values.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Values section not found");
    return sendSuccessWithoutResponse(res, "Values section deleted successfully");
  } catch (error: any) {
    console.error("deleteValues error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Toggle status
export const toggleValuesStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const section = await Values.findById(id);
    if (!section) return sendErrorResponse(res, 404, "Values section not found");
    section.isActive = Boolean(isActive);
    await section.save();
    return sendSuccessResponse(res, section, "Values section status updated");
  } catch (error: any) {
    console.error("toggleValuesStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
