import express from "express";
import passport from "passport";
import {
  getAllMetaTags,
  getMetaTagByRoute,
  createOrUpdateMetaTag,
  updateMetaTagById,
  deleteMetaTag,
  seedDefaultMetaTags,
} from "../../controller/metaTagController/metaTag";

const router = express.Router();

// Public routes for website to fetch meta tags
router.get("/", getAllMetaTags as any);
router.get("/by-route", getMetaTagByRoute as any);

// Protected routes for Admin
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createOrUpdateMetaTag as any
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  updateMetaTagById as any
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteMetaTag as any
);

router.post(
  "/seed",
  passport.authenticate("jwt", { session: false }),
  seedDefaultMetaTags as any
);

export default router;
