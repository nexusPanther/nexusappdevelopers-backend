import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Admin } from "../../models/AdminModal/AdminModal";
import { getToken } from "../../utils/helperFun";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

const Signup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required");
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

    return sendSuccessResponse(res, { user: payload, token }, "Signup successful");
  } catch (error: any) {
    console.error("Signup error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export default Signup;
