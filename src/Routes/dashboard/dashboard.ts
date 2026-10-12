import express from "express";
import passport from "passport";
import { getDashboardStats } from "../../controller/dashboardController/dashboard";

const router = express.Router();

router.get("/", passport.authenticate("jwt", { session: false }), getDashboardStats as any);

export default router;
