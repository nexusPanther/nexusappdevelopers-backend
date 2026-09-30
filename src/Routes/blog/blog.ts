import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  createBlog,
  getBlogItems,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../../controller/blogController/blog";

const router = express.Router();

// Multer setup
const uploadDir = path.join(__dirname, "../../../uploads/blog");
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

router.get("/", getBlogItems as any);
router.get("/:id", getBlogById as any);
router.post("/", upload, createBlog as any);
router.patch("/:id", upload, updateBlog as any);
router.delete("/:id", deleteBlog as any);

export default router;
