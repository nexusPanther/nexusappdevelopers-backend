import { Request, Response } from "express";
import validator from "validator";
import { Contact } from "../../models/ContactModal/contactModal";
import { sendEmailToFounders, sendThankYouEmail, sendReplyEmail } from "../../utils/emailService";
import {
  sendErrorResponse,
  sendSuccessResponse,
  sendSuccessWithoutResponse,
} from "../../utils/responseFun";

const addContact = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, phone, phoneCode, projectType, message } = req.body;

    if (!name || !email || !phone || !phoneCode || !projectType) {
      return sendErrorResponse(res, 400, "All fields are required");
    }

    const contact = new Contact({
      name,
      email,
      phone,
      phoneCode,
      projectType,
      message,
    });
    await contact.save();

    // Send emails asynchronously without blocking the response
    sendEmailToFounders({ name, email, phone, phoneCode, projectType, message });
    sendThankYouEmail(email, name);

    return sendSuccessWithoutResponse(
      res,
      "Thank you for contacting us. We'll get back to you soon."
    );
  } catch (error: any) {
    console.error("addContact error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

const getContacts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find().sort({ _id: -1 }).skip(skip).limit(limit),
      Contact.countDocuments(),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      status: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        count: contacts.length,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: "Contacts fetched",
    });
  } catch (error: any) {
    console.error("getContacts error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

const updateContactStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const status = (req.body?.status as string | undefined)?.trim() || "resolved";
    const allowedStatuses = ["pending", "resolved"];

    if (!allowedStatuses.includes(status)) {
      return sendErrorResponse(res, 400, "Invalid status value");
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return sendErrorResponse(res, 404, "Contact not found");
    }

    return sendSuccessResponse(res, updated, "Contact status updated successfully");
  } catch (error: any) {
    console.error("updateContactStatus error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

const deleteContact = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return sendErrorResponse(res, 404, "Contact not found");
    }
    return sendSuccessWithoutResponse(res, "Contact deleted successfully");
  } catch (error: any) {
    console.error("deleteContact error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export const replyToContact = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return sendErrorResponse(res, 400, "Email, subject, and message are required.");
    }

    if (!validator.isEmail(email)) {
      return sendErrorResponse(res, 400, "Invalid email");
    }
    if (!subject || subject.length > 200) {
      return sendErrorResponse(res, 400, "Subject too long");
    }
    if (!message || message.length > 5000) {
      return sendErrorResponse(res, 400, "Message too long");
    }

    // Send the email
    await sendReplyEmail(email, subject, message);

    return sendSuccessWithoutResponse(res, "Reply sent successfully.");
  } catch (error: any) {
    console.error("Error sending reply email:", error?.message || error);
    return sendErrorResponse(res, 500, "An error occurred while sending the email.");
  }
};

export { addContact, getContacts, updateContactStatus, deleteContact };
