import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Testimonial } from "../../models/Testimonial/testimonialModal";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

const buildBaseUrl = (req: Request): string => {
  const envBase = process.env.BASE_URL?.trim().replace(/\/?$/, "");
  if (envBase) return envBase;
  return `${req.protocol}://${req.get("host")}`;
};

export const ensureFullUrl = (maybePath: string | undefined, baseUrl: string): string | undefined => {
  if (!maybePath) return undefined;

  // Handle comma-separated URLs (cleanup duplicates if any)
  if (maybePath.includes(",")) {
    const urls = maybePath
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u);
    maybePath = urls[0];
  }

  // Already absolute URL
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) {
    return maybePath;
  }

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
    } catch (_) {
      // ignore URL parse errors
    }

    if (
      !pathname.startsWith("/uploads/testimonials") &&
      !pathname.startsWith("/static/img/testimonials") &&
      !pathname.startsWith("/static/videos")
    ) {
      return;
    }

    // Try relative to process.cwd() or process.cwd()/public
    const absDirect = path.join(process.cwd(), pathname.replace(/^\/+/, ""));
    const absPublic = path.join(process.cwd(), "public", pathname.replace(/^\/+/, ""));

    if (fs.existsSync(absDirect)) {
      fs.unlinkSync(absDirect);
    } else if (fs.existsSync(absPublic)) {
      fs.unlinkSync(absPublic);
    }
  } catch (err) {
    console.error("deleteLocalUploadIfExists error:", (err as any)?.message || err);
  }
};

// Normalize multipart/form-data fields into properly typed values
const normalizeFields = (body: any) => {
  const bool = (val: any) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "boolean") return val;
    const v = String(val).toLowerCase().trim();
    return v === "true" || v === "1";
  };

  const clean = (val: any) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  };

  const num = (val: any) => {
    if (val === undefined || val === null) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  };

  // Support description or testimonial
  const description = clean(body.description) || clean(body.testimonial);

  return {
    name: clean(body.name),
    designation: clean(body.designation),
    description,
    profileImageUrl: clean(body.profileImageUrl),
    rating: num(body.rating),
    isVideo: bool(body.isVideo),
    videoUrl: clean(body.videoUrl),
    videoThumbnail: clean(body.videoThumbnail),
    videoDuration: clean(body.videoDuration),
    isFeatured: bool(body.isFeatured),
    orderIndex: num(body.orderIndex),
    status: clean(body.status) as "active" | "inactive" | undefined,
    isActive: bool(body.isActive),
  };
};

// Extract uploaded files from Multer
const extractFiles = (req: Request) => {
  let profileFile: Express.Multer.File | undefined;
  let videoFile: Express.Multer.File | undefined;
  let thumbnailFile: Express.Multer.File | undefined;

  // Case 1: multer.fields() or dictionary of files
  if (req.files && !Array.isArray(req.files)) {
    const filesDict = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (filesDict.profileFile?.[0]) profileFile = filesDict.profileFile[0];
    else if (filesDict.profileImage?.[0]) profileFile = filesDict.profileImage[0];
    else if (filesDict.image?.[0]) profileFile = filesDict.image[0];
    else if (filesDict.file?.[0]) profileFile = filesDict.file[0];

    if (filesDict.videoFile?.[0]) videoFile = filesDict.videoFile[0];
    else if (filesDict.video?.[0]) videoFile = filesDict.video[0];

    if (filesDict.videoThumbnail?.[0]) thumbnailFile = filesDict.videoThumbnail[0];
    else if (filesDict.thumbnail?.[0]) thumbnailFile = filesDict.thumbnail[0];
  }
  // Case 2: multer.any() array
  else if (Array.isArray(req.files)) {
    const filesArr = req.files as Express.Multer.File[];
    profileFile = filesArr.find((f) =>
      ["profileFile", "profileImage", "image", "file", "profileImageUrl"].includes(f.fieldname)
    );
    videoFile = filesArr.find((f) => ["videoFile", "video"].includes(f.fieldname));
    thumbnailFile = filesArr.find((f) => ["videoThumbnail", "thumbnail"].includes(f.fieldname));
  }
  // Case 3: single file on req.file
  else if ((req as any).file) {
    const single = (req as any).file as Express.Multer.File;
    if (["videoFile", "video"].includes(single.fieldname)) {
      videoFile = single;
    } else {
      profileFile = single;
    }
  }

  return { profileFile, videoFile, thumbnailFile };
};

// Format file path to public URL path
const resolveUploadedUrlPath = (file: Express.Multer.File): string => {
  // If stored under public/static/... return /static/...
  const normalizedPath = file.path.replace(/\\/g, "/");
  if (normalizedPath.includes("public/static/")) {
    const parts = normalizedPath.split("public/static/");
    return `/static/${parts[1]}`;
  }
  if (normalizedPath.includes("uploads/")) {
    const parts = normalizedPath.split("uploads/");
    return `/uploads/${parts[1]}`;
  }
  return `/static/img/testimonials/${file.filename}`;
};

// ==========================================
// 1. CREATE TESTIMONIAL (Admin Only)
// ==========================================
export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const fields = normalizeFields(req.body);
    const { profileFile, videoFile, thumbnailFile } = extractFiles(req);

    if (!fields.name) {
      return sendErrorResponse(res, 400, "Client name is required");
    }
    if (!fields.description) {
      return sendErrorResponse(res, 400, "Testimonial quote/description is required");
    }

    const baseUrl = buildBaseUrl(req);

    // Profile Image URL
    let finalProfileImageUrl = fields.profileImageUrl;
    if (profileFile) {
      finalProfileImageUrl = ensureFullUrl(resolveUploadedUrlPath(profileFile), baseUrl);
    } else if (finalProfileImageUrl) {
      finalProfileImageUrl = ensureFullUrl(finalProfileImageUrl, baseUrl);
    } else {
      finalProfileImageUrl = ensureFullUrl("/static/img/profile-img.png", baseUrl);
    }

    // Video URL
    let finalVideoUrl = fields.videoUrl || "";
    if (videoFile) {
      finalVideoUrl = ensureFullUrl(resolveUploadedUrlPath(videoFile), baseUrl) || "";
    } else if (finalVideoUrl) {
      finalVideoUrl = ensureFullUrl(finalVideoUrl, baseUrl) || "";
    }

    // Video Thumbnail
    let finalVideoThumbnail = fields.videoThumbnail || "";
    if (thumbnailFile) {
      finalVideoThumbnail = ensureFullUrl(resolveUploadedUrlPath(thumbnailFile), baseUrl) || "";
    } else if (finalVideoThumbnail) {
      finalVideoThumbnail = ensureFullUrl(finalVideoThumbnail, baseUrl) || "";
    }

    // If a video file or videoUrl is supplied, auto-mark isVideo to true if not explicitly false
    const isVideo = fields.isVideo !== undefined ? fields.isVideo : Boolean(finalVideoUrl);

    const doc = new Testimonial({
      name: fields.name,
      designation: fields.designation || "",
      description: fields.description,
      profileImageUrl: finalProfileImageUrl,
      rating: fields.rating !== undefined ? fields.rating : 5,
      isVideo,
      videoUrl: finalVideoUrl,
      videoThumbnail: finalVideoThumbnail,
      videoDuration: fields.videoDuration || "",
      isFeatured: fields.isFeatured !== undefined ? fields.isFeatured : false,
      orderIndex: fields.orderIndex !== undefined ? fields.orderIndex : 0,
      status: fields.status || (fields.isActive === false ? "inactive" : "active"),
      isActive: fields.isActive !== undefined ? fields.isActive : fields.status !== "inactive",
    });
    await doc.save();

    return res.status(201).json({
      success: true,
      status: true,
      message: "Testimonial created successfully",
      data: doc,
    });
  } catch (error: any) {
    console.error("createTestimonial error:", error?.message || error);
    return sendErrorResponse(res, 500, error?.message || "Internal server error");
  }
};

// ==========================================
// 2. GET TESTIMONIALS LIST (Public & Admin)
// ==========================================
export const getTestimonials = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 8);
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === "asc" ? 1 : -1;
    const search = ((req.query.search as string) || "").trim();

    const filter: any = {};

    // Filter by isVideo if specified
    if (req.query.isVideo !== undefined) {
      const isVideoVal = String(req.query.isVideo).toLowerCase();
      if (isVideoVal === "true" || isVideoVal === "1") {
        filter.isVideo = true;
      } else if (isVideoVal === "false" || isVideoVal === "0") {
        filter.isVideo = false;
      }
    }

    // Filter by status if specified (e.g., status=active)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Full-text / Regex search
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { designation: regex },
        { description: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      Testimonial.find(filter)
        .sort({ orderIndex: 1, createdAt: sortOrder })
        .skip(skip)
        .limit(limit),
      Testimonial.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      success: true,
      status: true,
      message: "Testimonials fetched successfully",
      data: items,
      pagination: {
        total: totalItems,
        totalTestimonials: totalItems,
        page,
        limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      // Backwards compatibility payload for existing frontend views
      testimonials: items,
      totalTestimonials: totalItems,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error: any) {
    console.error("getTestimonials error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// ==========================================
// 3. GET SINGLE TESTIMONIAL (Public & Admin)
// ==========================================
export const getTestimonialById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const item = await Testimonial.findById(id);
    if (!item) {
      return sendErrorResponse(res, 404, "Testimonial not found");
    }
    return sendSuccessResponse(res, item, "Testimonial fetched successfully");
  } catch (error: any) {
    console.error("getTestimonialById error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// ==========================================
// 4. UPDATE TESTIMONIAL (Admin Only)
// Handles both PUT /:id and legacy POST /:id (with fallback delete if empty body)
// ==========================================
export const upsertTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const hasBody = req.body && Object.keys(req.body).length > 0;
    const { profileFile, videoFile, thumbnailFile } = extractFiles(req);
    const hasFiles = Boolean(profileFile || videoFile || thumbnailFile);

    // Support legacy frontend behavior: POST /:id with empty body means DELETE
    if (req.method === "POST" && !hasBody && !hasFiles) {
      const deleted = await Testimonial.findByIdAndDelete(id);
      if (!deleted) return sendErrorResponse(res, 404, "Testimonial not found");
      deleteLocalUploadIfExists(deleted.profileImageUrl);
      deleteLocalUploadIfExists(deleted.videoUrl);
      deleteLocalUploadIfExists(deleted.videoThumbnail);
      return sendSuccessResponse(res, { testimonial: deleted }, "Testimonial deleted successfully");
    }

    const existing = await Testimonial.findById(id);
    if (!existing) {
      return sendErrorResponse(res, 404, "Testimonial not found");
    }

    const fields = normalizeFields(req.body);
    const update: any = {};

    if (fields.name !== undefined) update.name = fields.name;
    if (fields.designation !== undefined) update.designation = fields.designation;
    if (fields.description !== undefined) update.description = fields.description;
    if (fields.rating !== undefined) update.rating = fields.rating;
    if (fields.isVideo !== undefined) update.isVideo = fields.isVideo;
    if (fields.videoDuration !== undefined) update.videoDuration = fields.videoDuration;
    if (fields.isFeatured !== undefined) update.isFeatured = fields.isFeatured;
    if (fields.orderIndex !== undefined) update.orderIndex = fields.orderIndex;
    if (fields.status !== undefined) {
      update.status = fields.status;
      update.isActive = fields.status === "active";
    }
    if (fields.isActive !== undefined) {
      update.isActive = fields.isActive;
      if (fields.status === undefined) {
        update.status = fields.isActive ? "active" : "inactive";
      }
    }

    const baseUrl = buildBaseUrl(req);

    // Profile Image update
    if (profileFile) {
      const newUrl = ensureFullUrl(resolveUploadedUrlPath(profileFile), baseUrl);
      update.profileImageUrl = newUrl;
      deleteLocalUploadIfExists(existing.profileImageUrl);
    } else if (fields.profileImageUrl !== undefined) {
      update.profileImageUrl = ensureFullUrl(fields.profileImageUrl, baseUrl);
    }

    // Video File update
    if (videoFile) {
      const newVideoUrl = ensureFullUrl(resolveUploadedUrlPath(videoFile), baseUrl);
      update.videoUrl = newVideoUrl;
      update.isVideo = true;
      deleteLocalUploadIfExists(existing.videoUrl);
    } else if (fields.videoUrl !== undefined) {
      update.videoUrl = ensureFullUrl(fields.videoUrl, baseUrl);
      if (fields.isVideo === undefined && fields.videoUrl) {
        update.isVideo = true;
      }
    }

    // Video Thumbnail update
    if (thumbnailFile) {
      const newThumbnailUrl = ensureFullUrl(resolveUploadedUrlPath(thumbnailFile), baseUrl);
      update.videoThumbnail = newThumbnailUrl;
      deleteLocalUploadIfExists(existing.videoThumbnail);
    } else if (fields.videoThumbnail !== undefined) {
      update.videoThumbnail = ensureFullUrl(fields.videoThumbnail, baseUrl);
    }

    const updated = await Testimonial.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      status: true,
      message: "Testimonial updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("upsertTestimonial error:", error?.message || error);
    return sendErrorResponse(res, 500, error?.message || "Internal server error");
  }
};

// ==========================================
// 5. DELETE TESTIMONIAL (Admin Only)
// ==========================================
export const deleteTestimonial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) {
      return sendErrorResponse(res, 404, "Testimonial not found");
    }

    deleteLocalUploadIfExists(deleted.profileImageUrl);
    deleteLocalUploadIfExists(deleted.videoUrl);
    deleteLocalUploadIfExists(deleted.videoThumbnail);

    return res.status(200).json({
      success: true,
      status: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error: any) {
    console.error("deleteTestimonial error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
