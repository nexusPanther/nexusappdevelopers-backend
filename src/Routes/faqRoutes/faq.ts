import express from "express";
import passport from "passport";
import { createFaq, getFaqs, upsertFaq, deleteFaq } from "../../controller/faqController/faq";

const router = express.Router();

// GET list with pagination/search (publicly readable for website)
router.get("/", getFaqs as any);

// CREATE
router.post("/add", passport.authenticate("jwt", { session: false }), createFaq as any);

// UPDATE or DELETE (POST {}) to delete for frontend compatibility
router.post("/:id", passport.authenticate("jwt", { session: false }), upsertFaq as any);

// Explicit delete route (optional / RESTful)
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteFaq as any);

export default router;
