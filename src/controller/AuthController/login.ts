import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Admin } from "../../models/AdminModal/AdminModal";
import sanitize from "mongo-sanitize";
import { getToken } from "../../utils/helperFun";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

const buildBaseUrl = (req: Request) => {
  const envBase = process.env.BASE_URL?.trim().replace(/\/?$/, "");
  if (envBase) return envBase;
  return `${req.protocol}://${req.get("host")}`;
};

const ensureFullUrl = (maybePath: string | undefined, baseUrl: string): string | undefined => {
  if (!maybePath) return undefined;
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) return maybePath;
  const normalized = maybePath.startsWith("/") ? maybePath : `/${maybePath}`;
  return `${baseUrl}${normalized}`;
};

const Login = async (req: Request, res: Response): Promise<Response> => {
  try {
    let { email, password } = req.body;
    email = sanitize(email);
    password = sanitize(password);
    
    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required");
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, (admin as any).password);
    if (!isMatch) {
      return sendErrorResponse(res, 400, "Invalid credentials");
    }

    const token = await getToken(admin as any);
    const baseUrl = buildBaseUrl(req);
    const payload = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      avatar: ensureFullUrl((admin as any).avatar, baseUrl),
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    };

    return sendSuccessResponse(res, { user: payload, token }, "Login successful");
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export default Login;
