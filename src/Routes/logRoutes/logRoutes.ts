import express from "express";
import passport from "passport";
import { getLogs, clearLogs, emitTestLog } from "../../controller/logController/logController";

const router = express.Router();

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return passport.authenticate("jwt", { session: false })(req, res, next);
  }
  next();
};

router.get("/", authMiddleware, getLogs as any);
router.post("/clear", authMiddleware, clearLogs as any);
router.post("/test", authMiddleware, emitTestLog as any);

export default router;

