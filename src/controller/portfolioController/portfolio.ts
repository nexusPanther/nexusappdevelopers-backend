import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Portfolio } from "../../models/Portfolio/portfolioModal";
import {
  sendErrorResponse,
  sendSuccessResponse,
  sendSuccessWithoutResponse,
} from "../../utils/responseFun";

const buildBaseUrl = (req: Request) => {
  const envBase = process.env.BASE_URL?.trim().replace(/\/?$/, "");
  if (envBase) return envBase;
  return `${req.protocol}://${req.get("host")}`;
};

const ensureFullUrl = (
  maybePath: string | undefined,
  baseUrl: string,
): string | undefined => {
  if (!maybePath) return undefined;
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://"))
    return maybePath;
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
    if (!pathname.startsWith("/uploads/portfolio")) return;
    const abs = path.join(process.cwd(), pathname.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error(
      "deleteLocalUploadIfExists error:",
      (err as any)?.message || err,
    );
  }
};

const getFileByField = (
  req: Request,
  field: string,
): Express.Multer.File | undefined => {
  const files = (req as any).files as Express.Multer.File[] | undefined;

  if (!Array.isArray(files)) return undefined;

  return files.find((f) => f.fieldname === field);
};

// Helper to convert image fields to full URLs
const mapToFullUrls = (item: any, baseUrl: string) => {
  if (!item) return item;
  const result = item.toObject ? item.toObject() : { ...item };
  result.listImage = ensureFullUrl(result.listImage, baseUrl);
  result.featuredImage = ensureFullUrl(result.featuredImage, baseUrl);
  result.productImage = ensureFullUrl(result.productImage, baseUrl);
  return result;
};

// List all portfolio items
export const getPortfolioItems = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const baseUrl = buildBaseUrl(req);
    const items = await Portfolio.find().sort({ createdAt: -1 });
    const mapped = items.map((item) => mapToFullUrls(item, baseUrl));
    return sendSuccessResponse(res, mapped, "Portfolio items fetched");
  } catch (error: any) {
    console.error("getPortfolioItems error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get single by id
export const getPortfolioById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const baseUrl = buildBaseUrl(req);
    const { id } = req.params;
    const item = await Portfolio.findById(id);
    if (!item) return sendErrorResponse(res, 404, "Portfolio item not found");
    const mapped = mapToFullUrls(item, baseUrl);
    return sendSuccessResponse(res, mapped, "Portfolio item fetched");
  } catch (error: any) {
    console.error("getPortfolioById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Create new portfolio item (multipart/form-data expected)
export const createPortfolio = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    let payload: any = {};

    // Parse incoming data
    if (req.body && req.body.data) {
      try {
        payload = JSON.parse(req.body.data);
      } catch {
        payload = req.body.data;
      }
    } else {
      payload = req.body || {};
    }

    const getSingleValue = (val: any) => Array.isArray(val) ? val[0] : val;
    ["title", "subtitle", "mainTitle", "description", "challengeTitle", "challengeContent", "solutionTitle", "solutionContent", "listCategory", "listDescription", "year", "slug", "metaTitle", "metaDescription", "metaKeywords"].forEach(k => {
      if (payload[k] !== undefined) payload[k] = getSingleValue(payload[k]);
    });

    // ✅ Parse availableOn
    if (payload.availableOn && typeof payload.availableOn === "string") {
      try {
        payload.availableOn = JSON.parse(payload.availableOn);
      } catch {
        payload.availableOn = { website: "", android: "", ios: "" };
      }
    }

    // ✅ Default availableOn
    payload.availableOn = payload.availableOn || {
      website: "",
      android: "",
      ios: "",
    };

    // Files
    const listFile = getFileByField(req, "listImage");
    const featuredFile = getFileByField(req, "featuredImage");
    const productFile = getFileByField(req, "productImage");

    const uploadDir = path.posix.join("/uploads/portfolio");
    const baseUrl = buildBaseUrl(req);

    if (listFile)
      payload.listImage = path.posix.join(uploadDir, listFile.filename);
    if (featuredFile)
      payload.featuredImage = path.posix.join(uploadDir, featuredFile.filename);
    if (productFile)
      payload.productImage = path.posix.join(uploadDir, productFile.filename);

    // ✅ Ensure arrays
    payload.categories = payload.categories || [];
    payload.specs = payload.specs || [];
    payload.features = payload.features || [];
    payload.challenges = payload.challenges || [];
    payload.solutions = payload.solutions || [];
    payload.timeline = payload.timeline || [];
    payload.stats = payload.stats || [];
    payload.relatedProjects = payload.relatedProjects || [];

    const doc = new Portfolio(payload);
    await doc.save();

    const result = mapToFullUrls(doc, baseUrl);

    return sendSuccessResponse(res, result, "Portfolio item created");
  } catch (error: any) {
    console.error("createPortfolio error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update existing portfolio item
export const updatePortfolio = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) return sendErrorResponse(res, 400, "Portfolio id required");

    let payload: any = {};

    // Parse incoming data
    if (req.body && req.body.data) {
      try {
        payload = JSON.parse(req.body.data);
      } catch {
        payload = req.body.data;
      }
    } else {
      payload = req.body || {};
    }

    const getSingleValue = (val: any) => Array.isArray(val) ? val[0] : val;
    ["title", "subtitle", "mainTitle", "description", "challengeTitle", "challengeContent", "solutionTitle", "solutionContent", "listCategory", "listDescription", "year", "slug", "metaTitle", "metaDescription", "metaKeywords"].forEach(k => {
      if (payload[k] !== undefined) payload[k] = getSingleValue(payload[k]);
    });

    // ✅ Parse availableOn
    if (payload.availableOn && typeof payload.availableOn === "string") {
      try {
        payload.availableOn = JSON.parse(payload.availableOn);
      } catch {
        payload.availableOn = { website: "", android: "", ios: "" };
      }
    }

    const existing = await Portfolio.findById(id);
    if (!existing)
      return sendErrorResponse(res, 404, "Portfolio item not found");

    const listFile = getFileByField(req, "listImage");
    const featuredFile = getFileByField(req, "featuredImage");
    const productFile = getFileByField(req, "productImage");

    const uploadDir = path.posix.join("/uploads/portfolio");
    const baseUrl = buildBaseUrl(req);

    const update: any = {};

    // ✅ Allowed fields
    const allowed = [
      "title",
      "subtitle",
      "categories",
      "mainTitle",
      "description",
      "challengeTitle",
      "challengeContent",
      "solutionTitle",
      "solutionContent",
      "specs",
      "features",
      "challenges",
      "solutions",
      "timeline",
      "stats",
      "relatedProjects",
      "listCategory",
      "listDescription",
      "year",
      "availableOn", // ✅ added
      "slug",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
    ];

    for (const k of allowed) {
      if (payload[k] !== undefined) update[k] = payload[k];
    }

    // Images
    if (listFile) {
      const rel = path.posix.join(uploadDir, listFile.filename);
      update.listImage = rel;
      deleteLocalUploadIfExists(existing.listImage as any);
    } else if (payload.listImage !== undefined) {
      update.listImage = payload.listImage;
    }

    if (featuredFile) {
      const rel = path.posix.join(uploadDir, featuredFile.filename);
      update.featuredImage = rel;
      deleteLocalUploadIfExists(existing.featuredImage as any);
    } else if (payload.featuredImage !== undefined) {
      update.featuredImage = payload.featuredImage;
    }

    if (productFile) {
      const rel = path.posix.join(uploadDir, productFile.filename);
      update.productImage = rel;
      deleteLocalUploadIfExists(existing.productImage as any);
    } else if (payload.productImage !== undefined) {
      update.productImage = payload.productImage;
    }

    const updated = await Portfolio.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return sendErrorResponse(res, 404, "Portfolio item not found");

    const result = mapToFullUrls(updated, baseUrl);

    return sendSuccessResponse(res, result, "Portfolio item updated");
  } catch (error: any) {
    console.error("updatePortfolio error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Delete
export const deletePortfolio = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Portfolio.findByIdAndDelete(id);
    if (!deleted)
      return sendErrorResponse(res, 404, "Portfolio item not found");
    deleteLocalUploadIfExists((deleted as any).listImage as string | undefined);
    deleteLocalUploadIfExists(
      (deleted as any).featuredImage as string | undefined,
    );
    deleteLocalUploadIfExists(
      (deleted as any).productImage as string | undefined,
    );
    return sendSuccessWithoutResponse(
      res,
      "Portfolio item deleted successfully",
    );
  } catch (error: any) {
    console.error("deletePortfolio error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export default getPortfolioItems;
