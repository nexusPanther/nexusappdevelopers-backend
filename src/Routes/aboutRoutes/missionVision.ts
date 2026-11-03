import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import passport from "passport";
import {
  createMissionVision,
  getMissionVisionSections,
  getMissionVisionById,
  updateMissionVision,
  deleteMissionVision,
  toggleMissionVisionStatus,
} from "../../controller/aboutController/missionVision";

const router = express.Router();

const uploadDir = path.join(__dirname, "../../../uploads/missionVision");
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

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
    "video/mp4", "video/webm", "video/quicktime",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are supported."));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }).any();

// Public read
router.get("/", getMissionVisionSections as any);
router.get("/:id", getMissionVisionById as any);

// Create
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  upload,
  createMissionVision as any,
);

// Update
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  upload,
  updateMissionVision as any,
);

// Toggle status
router.patch(
  "/:id/toggle-status",
  passport.authenticate("jwt", { session: false }),
  toggleMissionVisionStatus as any,
);

// Delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteMissionVision as any,
);

export default router;
