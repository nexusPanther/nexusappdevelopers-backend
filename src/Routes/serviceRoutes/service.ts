import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
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

// Accept any file field name to avoid Unexpected field errors
const upload = multer({ storage }).any();

// Routes
router.get("/", getServices as any);
router.get("/:id", getServiceById as any);
router.post("/", upload, createService as any);
router.patch("/:id", upload, updateService as any);
router.delete("/:id", deleteService as any);

export default router;
