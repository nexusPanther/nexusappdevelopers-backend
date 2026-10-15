import { Request, Response } from "express";
import { FestivePopup, NormalPopup } from "../../models/PopupModal/popupModal";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

/**
 * 1. Get Live Status of all popups (Public & Admin)
 * Returns { normalEnabled, festiveEnabled, animationType }
 */
export const getPopupStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const [festive, normal] = await Promise.all([
      FestivePopup.findOne(),
      NormalPopup.findOne(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        normalEnabled: normal ? normal.isEnabled : true,
        festiveEnabled: festive ? festive.isEnabled : false,
        animationType: festive ? festive.animationType : "snow",
      },
    });
  } catch (error: any) {
    console.error("getPopupStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * 2. Toggle Popup Status (Admin)
 * Supports type: 'festive' | 'thanksgiving' | 'normal'
 */
export const updatePopupStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { type } = req.params;
    const { isEnabled } = req.body;
    const isBool = Boolean(isEnabled);

    if (type === "festive" || type === "thanksgiving") {
      const updated = await FestivePopup.findOneAndUpdate(
        {},
        { isEnabled: isBool },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({
        success: true,
        message: `Festive popup status successfully updated to ${isBool ? "enabled" : "paused"}`,
        data: {
          type: "festive",
          isEnabled: isBool,
          popup: updated,
        },
      });
    } else if (type === "normal") {
      const updated = await NormalPopup.findOneAndUpdate(
        {},
        { isEnabled: isBool },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({
        success: true,
        message: `Normal exit-intent popup status successfully updated to ${isBool ? "enabled" : "paused"}`,
        data: {
          type: "normal",
          isEnabled: isBool,
          popup: updated,
        },
      });
    } else {
      return sendErrorResponse(res, 400, "Invalid popup type. Must be 'festive' or 'normal'");
    }
  } catch (error: any) {
    console.error("updatePopupStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * 3. Get Festive Campaign Content (Public & Admin)
 */
export const getFestivePopupContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    let festive = await FestivePopup.findOne();
    if (!festive) {
      festive = await FestivePopup.create({});
    }

    return res.status(200).json({
      success: true,
      data: festive,
    });
  } catch (error: any) {
    console.error("getFestivePopupContent error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * 4. Update Festive Campaign Content (Admin)
 */
export const updateFestivePopupContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const updateData = { ...req.body };
    // Remove mongo immutable or auto-managed properties if sent
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updated = await FestivePopup.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("updateFestivePopupContent error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

/**
 * 5. Reset Festive Campaign Content to Defaults (Admin)
 */
export const resetFestivePopupContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    await FestivePopup.deleteMany({});
    const defaultDoc = await FestivePopup.create({});

    return res.status(200).json({
      success: true,
      message: "Festive campaign content reset to defaults successfully",
      data: defaultDoc,
    });
  } catch (error: any) {
    console.error("resetFestivePopupContent error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
