import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import passport from "passport";
import {
  createPortfolio,
  getPortfolioItems,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
} from "../../controller/portfolioController/portfolio";

const router = express.Router();

// Multer setup
const uploadDir = path.join(__dirname, "../../../uploads/portfolio");
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
router.get("/", getPortfolioItems as any);
router.get("/:id", getPortfolioById as any);

// Protected write routes
router.post("/", requireAdmin, upload, createPortfolio as any);
router.patch("/:id", requireAdmin, upload, updatePortfolio as any);
router.delete("/:id", requireAdmin, deletePortfolio as any);

export default router;
