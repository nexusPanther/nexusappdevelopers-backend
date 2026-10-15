import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import passport from "passport";
import {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  upsertTestimonial,
  deleteTestimonial,
} from "../../controller/testimonialController/testimonial";

const router = express.Router();

// Ensure upload directories exist
const imageUploadDir = path.join(process.cwd(), "public/static/img/testimonials");
const videoUploadDir = path.join(process.cwd(), "public/static/videos");

if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "videoFile" || file.fieldname === "video") {
      cb(null, videoUploadDir);
    } else {
      cb(null, imageUploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(safeName)}`);
  },
});

// File validation filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === "videoFile" || file.fieldname === "video") {
    const allowedVideoMimes = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowedVideoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid video format. Only MP4, WebM, and MOV are supported."));
    }
  } else {
    const allowedImageMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/jpg",
    ];
    if (allowedImageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image format. Only JPG, PNG, WebP, and SVG are supported."));
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80 MB limit
  },
}).fields([
  { name: "profileFile", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "videoFile", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "videoThumbnail", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

// Auth middleware helper
const requireAdmin = passport.authenticate("jwt", { session: false });

// 1. GET list with pagination / search / isVideo filter (Public)
router.get("/", getTestimonials as any);

// 2. GET single testimonial (Public)
router.get("/:id", getTestimonialById as any);

// 3. CREATE testimonial (Admin Only)
// Standard RESTful route POST / or POST /add (for backwards compatibility)
router.post("/", requireAdmin, upload, createTestimonial as any);
router.post("/add", requireAdmin, upload, createTestimonial as any);

// 4. UPDATE testimonial (Admin Only)
// Standard RESTful route PUT /:id or legacy POST /:id
router.put("/:id", requireAdmin, upload, upsertTestimonial as any);
router.post("/:id", requireAdmin, upload, upsertTestimonial as any);

// 5. DELETE testimonial (Admin Only)
router.delete("/:id", requireAdmin, deleteTestimonial as any);

export default router;
