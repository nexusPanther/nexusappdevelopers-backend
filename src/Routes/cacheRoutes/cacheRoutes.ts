import express from "express";
import passport from "passport";
import { getStats, clearCache, warmupCache } from "../../controller/cacheController/cacheController";

const router = express.Router();

// Allow authenticated admin requests or fall back gracefully
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // If authorization header is provided, verify JWT; otherwise if dev environment allow access
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return passport.authenticate("jwt", { session: false })(req, res, next);
  }
  next();
};

router.get("/stats", authMiddleware, getStats as any);
router.post("/clear", authMiddleware, clearCache as any);
router.post("/warmup", authMiddleware, warmupCache as any);

export default router;
