import express from "express";
import { getDashboardStats } from "../../controller/dashboardController/dashboard";

const router = express.Router();

router.get("/", getDashboardStats as any);

export default router;
