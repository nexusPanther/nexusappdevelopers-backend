import express from "express";
import passport from "passport";
import { getLegalDocument, createLegalDocument, updateLegalDocument } from "../../controller/legalController/legal";

const router = express.Router();

const requireAdmin = passport.authenticate("jwt", { session: false });

// GET /api/legal/:type (type = terms | privacy) — Public read
router.get("/:type", getLegalDocument as any);

// POST /api/legal — Admin only: create new
router.post("/", requireAdmin, createLegalDocument as any);

// PATCH /api/legal/:id — Admin only: update by id
router.patch("/:id", requireAdmin, updateLegalDocument as any);

export default router;
