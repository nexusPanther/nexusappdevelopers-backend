import { Request, Response } from "express";
import { Faq } from "../../models/Faq/faqModal";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseFun";
import { getOrSetCache, invalidateCache } from "../../Database/redis";

// Create FAQ
export const createFaq = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return sendErrorResponse(res, 400, "question and answer are required");
    }

    const faq = new Faq({ question, answer, category });
    await faq.save();
    await invalidateCache("cache:faqs:*", "cache:dashboard:*");

    return sendSuccessResponse(res, faq, "FAQ created successfully");
  } catch (error: any) {
    console.error("createFaq error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Get FAQs with pagination, search, sort
export const getFaqs = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const search = (req.query.search as string) || "";

    const cacheKey = `cache:faqs:${page}:${limit}:${sortOrder}:${search.trim()}`;

    const { data: result, isCached } = await getOrSetCache(
      cacheKey,
      async () => {
        const filter: any = {};
        if (search.trim()) {
          const regex = new RegExp(search.trim(), "i");
          filter.$or = [{ question: regex }, { answer: regex }, { category: regex }];
        }

        const skip = (page - 1) * limit;

        const [faqs, totalFaqs] = await Promise.all([
          Faq.find(filter)
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(limit),
          Faq.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalFaqs / limit) || 1;

        return {
          faqs,
          totalFaqs,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        };
      },
      86400
    );

    if (isCached) res.setHeader("X-Cache", "HIT-REDIS");
    else res.setHeader("X-Cache", "MISS-DATABASE");

    return sendSuccessResponse(res, result, "FAQs fetched successfully");
  } catch (error: any) {
    console.error("getFaqs error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Update or delete FAQ via POST /:id
export const upsertFaq = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const hasBody = req.body && Object.keys(req.body).length > 0;

    // Delete when body is empty (matches frontend delete thunk using POST {})
    if (!hasBody) {
      const deleted = await Faq.findByIdAndDelete(id);
      if (!deleted) return sendErrorResponse(res, 404, "FAQ not found");
      await invalidateCache("cache:faqs:*", "cache:dashboard:*");
      return sendSuccessResponse(res, { faq: deleted }, "FAQ deleted successfully");
    }

    const { question, answer, category } = req.body;
    const update: any = {};
    if (question !== undefined) update.question = question;
    if (answer !== undefined) update.answer = answer;
    if (category !== undefined) update.category = category;

    const updated = await Faq.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) return sendErrorResponse(res, 404, "FAQ not found");

    await invalidateCache("cache:faqs:*", "cache:dashboard:*");
    return sendSuccessResponse(res, updated, "FAQ updated successfully");
  } catch (error: any) {
    console.error("upsertFaq error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Optional explicit delete via DELETE /:id
export const deleteFaq = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await Faq.findByIdAndDelete(id);
    if (!deleted) return sendErrorResponse(res, 404, "FAQ not found");
    await invalidateCache("cache:faqs:*", "cache:dashboard:*");
    return sendSuccessResponse(res, { faq: deleted }, "FAQ deleted successfully");
  } catch (error: any) {
    console.error("deleteFaq error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};
