import express from "express";
import passport from "passport";
import {
  createValues,
  getValuesSections,
  getValuesById,
  updateValues,
  deleteValues,
  toggleValuesStatus,
} from "../../controller/aboutController/values";

const router = express.Router();

// Public read
router.get("/", getValuesSections as any);
router.get("/:id", getValuesById as any);

// Create
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createValues as any,
);

// Update
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  updateValues as any,
);

// Toggle status
router.patch(
  "/:id/toggle-status",
  passport.authenticate("jwt", { session: false }),
  toggleValuesStatus as any,
);

// Delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteValues as any,
);

export default router;
