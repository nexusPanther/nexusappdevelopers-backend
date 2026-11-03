import express from "express";
import passport from "passport";
import {
  getPopupStatus,
  updatePopupStatus,
  getFestivePopupContent,
  updateFestivePopupContent,
  resetFestivePopupContent,
} from "../../controller/popupController/popup";

const router = express.Router();

const requireAdmin = passport.authenticate("jwt", { session: false });

// ── Public Routes ──────────────────────────
// 1. Get visibility status of popups
router.get("/status", getPopupStatus as any);

// 2. Get festive popup campaign content
router.get("/festive", getFestivePopupContent as any);

// ── Admin Routes ───────────────────────────
// 3. Toggle popup enabled / paused status
router.patch("/:type/status", requireAdmin, updatePopupStatus as any);
router.post("/:type/status", requireAdmin, updatePopupStatus as any);

// 4. Update festive popup campaign content
router.put("/festive", requireAdmin, updateFestivePopupContent as any);
router.post("/festive", requireAdmin, updateFestivePopupContent as any);
router.post("/thanksgiving", requireAdmin, updateFestivePopupContent as any); // Backward compatibility fallback

// 5. Reset festive popup campaign content to default presets
router.post("/festive/reset", requireAdmin, resetFestivePopupContent as any);

export default router;
