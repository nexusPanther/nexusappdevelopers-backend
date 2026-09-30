import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import passport from "passport";
import {
  createAbout,
  getAbouts,
  getAboutById,
  updateAbout,
  deleteAbout,
  toggleAboutStatus,
} from "../../controller/aboutController/about";

const router = express.Router();

const uploadDir = path.join(__dirname, "../../../uploads/about");
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

const upload = multer({ storage }).any();

// Public read
router.get("/", getAbouts as any);
router.get("/:id", getAboutById as any);

// Create
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  upload,
  createAbout as any,
);

// Update
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  upload,
  updateAbout as any,
);

// Toggle status
router.patch(
  "/:id/toggle-status",
  passport.authenticate("jwt", { session: false }),
  toggleAboutStatus as any,
);

// Delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteAbout as any,
);

export default router;
