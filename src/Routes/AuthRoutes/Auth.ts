import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import Signup from "../../controller/AuthController/signup";
import Login from "../../controller/AuthController/login";
import { changeAdminPassword, updateAdminProfile } from "../../controller/AuthController/profile";
import passport from "passport";

const router = express.Router();

// Multer setup for avatar uploads
const avatarDir = path.join(process.cwd(), "uploads/admin");
if (!fs.existsSync(avatarDir)) {
	fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (_req, _file, cb) {
		cb(null, avatarDir);
	},
	filename: function (_req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});
const upload = multer({ storage });

router.post("/signup", Signup as any);
router.post("/login", Login as any);
router.post("/logout", (req, res) => {
	res.clearCookie("nexus_session", { path: "/" });
	return res.status(200).json({ status: true, message: "Logged out successfully" });
});
router.patch("/update-profile", upload.single("avatar"), passport.authenticate("jwt", { session: false }), updateAdminProfile as any);
router.post("/change-password", passport.authenticate("jwt", { session: false }),changeAdminPassword as any);

export default router;
