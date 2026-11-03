import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import passport from "passport";
import {
  createHero,
  getHeroes,
  getHeroById,
  updateHero,
  deleteHero,
  toggleHeroStatus,
} from "../../controller/heroController/heroSection";

const router = express.Router();

const uploadDir = path.join(__dirname, "../../../uploads/hero");
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

// Create
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  upload,
  createHero as any,
);

// Read all
router.get("/", getHeroes as any);

// Read one
router.get("/:id", getHeroById as any);

// Update
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  upload,
  updateHero as any,
);

// Toggle status
router.patch(
  "/:id/toggle-status",
  passport.authenticate("jwt", { session: false }),
  toggleHeroStatus as any,
);

// Delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteHero as any,
);

export default router;
