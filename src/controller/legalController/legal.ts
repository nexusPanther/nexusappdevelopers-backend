import { Request, Response } from "express";
import { LegalDocument } from "../../models/Legal/legalDocumentModal";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";
import { getOrSetCache, invalidateCache } from "../../Database/redis";

// Fetch a legal document by type
export const getLegalDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const type = req.params.type as "terms" | "privacy";
    if (!type || !["terms", "privacy"].includes(type)) {
      return sendErrorResponse(res, 400, "Invalid document type");
    }

    const { data: doc, isCached } = await getOrSetCache(
      `cache:legal:${type}`,
      () => LegalDocument.findOne({ type }),
      86400
    );

    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");

    if (!doc) return sendSuccessResponse(res, null, "No document found");
    return sendSuccessResponse(res, doc, "Document fetched");
  } catch (error: any) {
    console.error("getLegalDocument error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Create a new legal document
export const createLegalDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { type, sections } = req.body;
    if (!type || !["terms", "privacy"].includes(type)) {
      return sendErrorResponse(res, 400, "Invalid document type");
    }
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return sendErrorResponse(res, 400, "Sections are required");
    }
    const existing = await LegalDocument.findOne({ type });
    if (existing) {
      return sendErrorResponse(res, 400, "Document already exists. Use update instead.");
    }
    const doc = new LegalDocument({ type, sections, lastUpdated: new Date() });
    await doc.save();
    await invalidateCache("cache:legal:*");

    return sendSuccessResponse(res, doc, "Document created");
  } catch (error: any) {
    console.error("createLegalDocument error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update an existing legal document
export const updateLegalDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { sections } = req.body;
    if (!id) return sendErrorResponse(res, 400, "Document ID required");
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return sendErrorResponse(res, 400, "Sections are required");
    }
    const doc = await LegalDocument.findByIdAndUpdate(
      id,
      { sections, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );
    if (!doc) return sendErrorResponse(res, 404, "Document not found");

    await invalidateCache("cache:legal:*");
    return sendSuccessResponse(res, doc, "Document updated");
  } catch (error: any) {
    console.error("updateLegalDocument error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
