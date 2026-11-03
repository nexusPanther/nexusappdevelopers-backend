import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import passport from "passport";
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from "../../controller/serviceController/service";

const router = express.Router();

// Multer setup
const uploadDir = path.join(__dirname, "../../../uploads/services");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

// Only allow image uploads; enforce 20 MB limit
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images (JPG, PNG, WebP, GIF, SVG) are allowed."));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }).any();

const requireAdmin = passport.authenticate("jwt", { session: false });

// Public read routes
router.get("/", getServices as any);
router.get("/:id", getServiceById as any);

// Protected write routes
router.post("/", requireAdmin, upload, createService as any);
router.patch("/:id", requireAdmin, upload, updateService as any);
router.delete("/:id", requireAdmin, deleteService as any);

export default router;
