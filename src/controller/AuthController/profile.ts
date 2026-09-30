import { Request, Response } from "express";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { Admin } from "../../models/AdminModal/AdminModal";
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

const resolveAdminId = (req: Request): string | undefined => {
  const maybeUser: any = (req as any).user;
  return (
    maybeUser?.identifier ||
    maybeUser?._id ||
    (req.body && (req.body.adminId || req.body.id))
  );
};

const removeOldAvatarIfLocal = (avatar?: string) => {
  try {
    if (!avatar) return;
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return;
    const normalized = avatar.startsWith("/") ? avatar.slice(1) : avatar;
    const absolute = path.join(process.cwd(), normalized);
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  } catch (err) {
    console.error("removeOldAvatarIfLocal error:", (err as any)?.message || err);
  }
};

export const updateAdminProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const adminId = resolveAdminId(req);
    const { name, email } = req.body;
    const avatarFile = (req as any).file as Express.Multer.File | undefined;

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (email !== undefined) update.email = String(email).trim();
    if (avatarFile) {
      update.avatar = path.posix.join("/uploads/admin", avatarFile.filename);
    }

    if (update.email) {
      const existing = await Admin.findOne({ email: update.email, _id: { $ne: adminId } });
      if (existing) {
        return sendErrorResponse(res, 400, "Email already in use");
      }
    }

    const admin = adminId ? await Admin.findById(adminId) : await Admin.findOne();
    if (!admin) return sendErrorResponse(res, 404, "Admin not found");

    if (update.avatar && admin.avatar && admin.avatar !== update.avatar) {
      removeOldAvatarIfLocal(admin.avatar as any);
    }

    Object.assign(admin, update);
    await admin.save();

    const baseUrl = buildBaseUrl(req);
    const payload = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      avatar: ensureFullUrl(admin.avatar as any, baseUrl),
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    };

    return sendSuccessResponse(res, payload, "Profile updated successfully");
  } catch (error: any) {
    console.error("updateAdminProfile error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export const changeAdminPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const adminId = resolveAdminId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendErrorResponse(res, 400, "Current password and new password are required");
    }

    const admin = adminId ? await Admin.findById(adminId) : await Admin.findOne();
    if (!admin) return sendErrorResponse(res, 404, "Admin not found");

    const isMatch = await bcrypt.compare(currentPassword, (admin as any).password);
    if (!isMatch) return sendErrorResponse(res, 400, "Current password is incorrect");

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    admin.password = await bcrypt.hash(newPassword, saltRounds);
    await admin.save();

    return sendSuccessResponse(res, { id: admin._id }, "Password changed successfully");
  } catch (error: any) {
    console.error("changeAdminPassword error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
