import express from "express";
import { getLegalDocument, createLegalDocument, updateLegalDocument } from "../../controller/legalController/legal";

const router = express.Router();

// GET /api/legal/:type (type = terms | privacy)
router.get("/:type", getLegalDocument as any);
// POST /api/legal (create new)
router.post("/", createLegalDocument as any);
// PATCH /api/legal/:id (update by id)
router.patch("/:id", updateLegalDocument as any);

export default router;
