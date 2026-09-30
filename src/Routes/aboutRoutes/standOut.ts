import express from "express";
import passport from "passport";
import {
  createStandOut,
  getStandOutSections,
  getStandOutById,
  updateStandOut,
  deleteStandOut,
  toggleStandOutStatus,
} from "../../controller/aboutController/standOut";

const router = express.Router();

// Public read
router.get("/", getStandOutSections as any);
router.get("/:id", getStandOutById as any);

// Create
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createStandOut as any,
);

// Update
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  updateStandOut as any,
);

// Toggle status
router.patch(
  "/:id/toggle-status",
  passport.authenticate("jwt", { session: false }),
  toggleStandOutStatus as any,
);

// Delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteStandOut as any,
);

export default router;
