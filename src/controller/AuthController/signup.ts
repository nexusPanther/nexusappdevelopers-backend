import { Request, Response } from "express";
import bcrypt from "bcrypt";
import sanitize from "mongo-sanitize";
import { Admin } from "../../models/AdminModal/AdminModal";
import { getToken } from "../../utils/helperFun";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

const Signup = async (req: Request, res: Response): Promise<Response> => {
  try {
    let { email, password } = req.body;
    email = sanitize(email);
    password = sanitize(password);

    if (process.env.ADMIN_REGISTRATION_SECRET) {
      const secret = req.body?.adminSecret || req.headers["x-admin-secret"];
      if (secret !== process.env.ADMIN_REGISTRATION_SECRET) {
        return sendErrorResponse(res, 403, "Invalid administrative registration secret");
      }
    }

    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required");
    }

    // Basic format checks — reject clearly invalid input early
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, "Invalid email format");
    }
    if (String(password).length < 8) {
      return sendErrorResponse(res, 400, "Password must be at least 8 characters");
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return sendErrorResponse(res, 400, "User with this email already exists");
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const admin = new Admin({ email, password: hashed });
    await admin.save();

    const token = await getToken(admin as any);

    const payload = { id: admin._id, email: admin.email };

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("nexus_session", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return sendSuccessResponse(res, { user: payload, token }, "Signup successful");
  } catch (error: any) {
    console.error("Signup error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export default Signup;
