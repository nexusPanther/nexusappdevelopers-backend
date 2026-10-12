import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  createTestimonial,
  getTestimonials,
  upsertTestimonial,
  deleteTestimonial,
} from "../../controller/testimonialController/testimonial";

const router = express.Router();

// Configure multer for image uploads
const uploadDir = path.join(__dirname, "../../../uploads/testimonials");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}_${safeName}`);
  },
});

// Allow any single file field (common frontend names: profileImageUrl, profileImage, image, file)
const upload = multer({ storage }).any();

import passport from "passport";

// List with pagination/search (publicly readable for website)
router.get("/", getTestimonials as any);

// Create (supports multipart/form-data; any single file field)
router.post("/add", passport.authenticate("jwt", { session: false }), upload, createTestimonial as any);

// Update or delete (POST {} to delete) for frontend compatibility; accepts optional file
router.post("/:id", passport.authenticate("jwt", { session: false }), upload, upsertTestimonial as any);

// Explicit delete
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteTestimonial as any);

export default router;
