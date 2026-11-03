import express from "express";
import passport from "passport";
import { getStats, clearCache, warmupCache } from "../../controller/cacheController/cacheController";

const router = express.Router();

// All cache management endpoints require authentication
const requireAdmin = passport.authenticate("jwt", { session: false });

router.get("/stats", requireAdmin, getStats as any);
router.post("/clear", requireAdmin, clearCache as any);
router.post("/warmup", requireAdmin, warmupCache as any);

export default router;
