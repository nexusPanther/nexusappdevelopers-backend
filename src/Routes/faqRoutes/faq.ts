import express from "express";
import { createFaq, getFaqs, upsertFaq, deleteFaq } from "../../controller/faqController/faq";

const router = express.Router();

// GET list with pagination/search
router.get("/", getFaqs as any);

// CREATE
router.post("/add", createFaq as any);

// UPDATE or DELETE (POST {}) to delete for frontend compatibility
router.post("/:id", upsertFaq as any);

// Explicit delete route (optional / RESTful)
router.delete("/:id", deleteFaq as any);

export default router;
