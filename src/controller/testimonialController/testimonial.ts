import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Testimonial } from "../../models/Testimonial/testimonialModal";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseFun";

const buildBaseUrl = (req: Request) => {
  const envBase = process.env.BASE_URL?.trim().replace(/\/?$/, "");
  if (envBase) return envBase;
  return `${req.protocol}://${req.get("host")}`;
};

const ensureFullUrl = (maybePath: string | undefined, baseUrl: string): string | undefined => {
  if (!maybePath) return undefined;
  
  // Handle comma-separated URLs (cleanup duplicates)
  if (maybePath.includes(",")) {
    const urls = maybePath.split(",").map(u => u.trim()).filter(u => u);
    // Remove duplicates and take the first one
    const uniqueUrls = [...new Set(urls)];
    maybePath = uniqueUrls[0];
  }
  
  // Already absolute
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) return maybePath;
  // Ensure it starts with /
  const normalized = maybePath.startsWith("/") ? maybePath : `/${maybePath}`;
  return `${baseUrl}${normalized}`;
};

const deleteLocalUploadIfExists = (url?: string) => {
  try {
    if (!url) return;
    // Extract pathname if absolute URL
    let pathname = url;
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        pathname = new URL(url).pathname;
      }
    } catch (_) {
      // ignore URL parse errors
    }
    if (!pathname.startsWith("/uploads/testimonials")) return;
    const abs = path.join(process.cwd(), pathname.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
  } catch (err) {
    console.error("deleteLocalUploadIfExists error:", (err as any)?.message || err);
  }
};

const calculateFileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
};

const areFilesIdentical = (file1Path: string, file2Path: string): boolean => {
  try {
    if (!fs.existsSync(file1Path) || !fs.existsSync(file2Path)) return false;
    const stats1 = fs.statSync(file1Path);
    const stats2 = fs.statSync(file2Path);
    
    // Quick size check
    if (stats1.size !== stats2.size) return false;
    
    // Hash comparison for content
    return calculateFileHash(file1Path) === calculateFileHash(file2Path);
  } catch (err) {
    console.error("areFilesIdentical error:", (err as any)?.message || err);
    return false;
  }
};

// Normalize multipart/form-data fields (strings) into typed values
const normalizeFields = (body: any) => {
  const bool = (val: any) => {
    if (val === undefined) return undefined;
    if (typeof val === "boolean") return val;
    const v = String(val).toLowerCase();
    return v === "true" || v === "1";
  };

  const clean = (val: any) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  };

  return {
    name: clean(body.name),
    description: clean(body.description),
    profileImageUrl: clean(body.profileImageUrl),
    designation: clean(body.designation),
    testimonial: clean(body.testimonial),
    isActive: bool(body.isActive),
  };
};

// Create testimonial
export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, description, designation, isActive } = normalizeFields(req.body);
    const file = ((req as any).file as Express.Multer.File | undefined) ||
      (((req as any).files as Express.Multer.File[] | undefined)?.[0]);

    if (!name ) {
      return sendErrorResponse(res, 400, "name and testimonial are required");
    }

    const baseUrl = buildBaseUrl(req);
    const uploadedRelative = file ? path.posix.join("/uploads/testimonials", file.filename) : undefined;
    const finalProfileImageUrl = ensureFullUrl(uploadedRelative, baseUrl);

    const doc = new Testimonial({ name, description, profileImageUrl: finalProfileImageUrl, designation, isActive });
    await doc.save();

    return sendSuccessResponse(res, doc, "Testimonial created successfully");
  } catch (error: any) {
    console.error("createTestimonial error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// List testimonials with pagination/search/sort
export const getTestimonials = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const search = (req.query.search as string) || "";

    const filter: any = {};
    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { description: regex },
        { designation: regex },
        { testimonial: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      Testimonial.find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit),
      Testimonial.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return sendSuccessResponse(
      res,
      {
        testimonials: items,
        totalTestimonials: totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      "Testimonials fetched successfully"
    );
  } catch (error: any) {
    console.error("getTestimonials error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update or delete via POST /:id (delete when body is empty)
export const upsertTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const hasBody = req.body && Object.keys(req.body).length > 0;

    const file = ((req as any).file as Express.Multer.File | undefined) ||
      (((req as any).files as Express.Multer.File[] | undefined)?.[0]);

    if (!hasBody) {
      const deleted = await Testimonial.findByIdAndDelete(id);
      if (!deleted) return sendErrorResponse(res, 404, "Testimonial not found");
      return sendSuccessResponse(res, { testimonial: deleted }, "Testimonial deleted successfully");
    }

    const existing = await Testimonial.findById(id);
    if (!existing) return sendErrorResponse(res, 404, "Testimonial not found");

    // Clean up existing profileImageUrl if it has duplicates
    if (existing.profileImageUrl && existing.profileImageUrl.includes(",")) {
      const cleanedUrl = ensureFullUrl(existing.profileImageUrl, buildBaseUrl(req));
      if (cleanedUrl && cleanedUrl !== existing.profileImageUrl) {
        await Testimonial.findByIdAndUpdate(id, { profileImageUrl: cleanedUrl });
        existing.profileImageUrl = cleanedUrl;
      }
    }

    const { name, description, profileImageUrl, designation, testimonial, isActive } = normalizeFields(req.body);
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (designation !== undefined) update.designation = designation;
    if (isActive !== undefined) update.isActive = isActive;

    const baseUrl = buildBaseUrl(req);
    if (file) {
      const uploadedRelative = path.posix.join("/uploads/testimonials", file.filename);
      const newFilePath = path.join(process.cwd(), uploadedRelative.replace(/^\/+/, ""));
      
      // Check if existing file has the same content
      let shouldUpdateImage = true;
      if (existing.profileImageUrl) {
        let existingPath = existing.profileImageUrl;
        try {
          if (existing.profileImageUrl.startsWith("http://") || existing.profileImageUrl.startsWith("https://")) {
            existingPath = new URL(existing.profileImageUrl).pathname;
          }
          if (existingPath.startsWith("/uploads/testimonials")) {
            const existingFilePath = path.join(process.cwd(), existingPath.replace(/^\/+/, ""));
            if (areFilesIdentical(newFilePath, existingFilePath)) {
              // Files are identical, keep existing URL and delete new upload
              shouldUpdateImage = false;
              fs.unlinkSync(newFilePath);
              console.log("Image content unchanged, keeping existing file");
            }
          }
        } catch (_) {
          // If comparison fails, proceed with update
        }
      }
      
      if (shouldUpdateImage) {
        update.profileImageUrl = ensureFullUrl(uploadedRelative, baseUrl);
        deleteLocalUploadIfExists(existing.profileImageUrl as string | undefined);
      }
    } else if (profileImageUrl !== undefined) {
      // Only update profileImageUrl from body if no file was uploaded
      update.profileImageUrl = ensureFullUrl(profileImageUrl, baseUrl);
    }

    const updated = await Testimonial.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) return sendErrorResponse(res, 404, "Testimonial not found");

    return sendSuccessResponse(res, updated, "Testimonial updated successfully");
  } catch (error: any) {
    console.error("upsertTestimonial error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Explicit delete via DELETE /:id
export const deleteTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "Testimonial not found");
    return sendSuccessResponse(res, { testimonial: deleted }, "Testimonial deleted successfully");
  } catch (error: any) {
    console.error("deleteTestimonial error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
