import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
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

// accept any fields
const upload = multer({ storage }).any();

router.get("/", getPortfolioItems as any);
router.get("/:id", getPortfolioById as any);
router.post("/", upload, createPortfolio as any);
router.patch("/:id", upload, updatePortfolio as any);
router.delete("/:id", deletePortfolio as any);

export default router;
