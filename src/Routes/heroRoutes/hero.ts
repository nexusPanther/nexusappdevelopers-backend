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

const upload = multer({ storage }).any();

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
