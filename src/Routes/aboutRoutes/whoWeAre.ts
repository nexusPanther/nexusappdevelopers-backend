import express from "express";
import passport from "passport";
import {
  createWhoWeAre,
  getWhoWeAreSections,
  getWhoWeAreById,
  updateWhoWeAre,
  deleteWhoWeAre,
  toggleWhoWeAreStatus,
} from "../../controller/aboutController/whoWeAre";

const router = express.Router();

// Public read
router.get("/", getWhoWeAreSections as any);
router.get("/:id", getWhoWeAreById as any);

// Create
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createWhoWeAre as any,
);

// Update
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  updateWhoWeAre as any,
);

// Toggle status
router.patch(
  "/:id/toggle-status",
  passport.authenticate("jwt", { session: false }),
  toggleWhoWeAreStatus as any,
);

// Delete
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteWhoWeAre as any,
);

export default router;
