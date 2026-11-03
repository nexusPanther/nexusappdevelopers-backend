import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import Signup from "../../controller/AuthController/signup";
import Login from "../../controller/AuthController/login";
import { changeAdminPassword, updateAdminProfile } from "../../controller/AuthController/profile";
import passport from "passport";
import { revokeToken } from "../../Database/redis";

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
		const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(safe));
	},
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	if (allowed.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed."));
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/signup", Signup as any);
router.post("/login", Login as any);
router.post("/logout", async (req, res) => {
	try {
		const token =
			req.cookies?.nexus_session ||
			(req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: null);
		if (token) {
			await revokeToken(token);
		}
	} catch (_) {}
	res.clearCookie("nexus_session", { path: "/" });
	return res.status(200).json({ status: true, message: "Logged out successfully" });
});
router.patch("/update-profile", upload.single("avatar"), passport.authenticate("jwt", { session: false }), updateAdminProfile as any);
router.post("/change-password", passport.authenticate("jwt", { session: false }),changeAdminPassword as any);

export default router;
