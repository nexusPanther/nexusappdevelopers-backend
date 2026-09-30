import { Request, Response } from "express";
import { Service } from "../../models/Service/serviceModal";
import { Testimonial } from "../../models/Testimonial/testimonialModal";
import { Contact } from "../../models/ContactModal/contactModal";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

const monthLabel = (date: Date) =>
  date.toLocaleString("en-US", { month: "short" });

const buildLastNMonths = (n = 6) => {
  const now = new Date();
  const buckets: { label: string; year: number; month: number; start: Date; end: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    buckets.push({
      label: monthLabel(d),
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      start,
      end,
    });
  }
  return buckets;
};

const mapSeries = (
  buckets: ReturnType<typeof buildLastNMonths>,
  aggregates: { _id: { year: number; month: number }; count: number }[]
) => {
  return buckets.map((b) => {
    const hit = aggregates.find((a) => a._id.year === b.year && a._id.month === b.month);
    return hit ? hit.count : 0;
  });
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const buckets = buildLastNMonths(6);
    const startWindow = buckets[0].start;

    const [servicesCount, testimonialsCount, contactsCount, projectAgg, contactAgg] = await Promise.all([
      Service.countDocuments(),
      Testimonial.countDocuments(),
      Contact.countDocuments(),
      Service.aggregate([
        { $match: { createdAt: { $gte: startWindow } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      Contact.aggregate([
        { $match: { createdAt: { $gte: startWindow } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const projectSeries = mapSeries(buckets, projectAgg as any);
    const contactSeries = mapSeries(buckets, contactAgg as any);

    return sendSuccessResponse(
      res,
      {
        summary: {
          services: servicesCount,
          testimonials: testimonialsCount,
          projects: servicesCount, // using services as projects count
          contacts: contactsCount,
        },
        charts: {
          labels: buckets.map((b) => b.label),
          projects: projectSeries,
          contacts: contactSeries,
        },
      },
      "Dashboard stats fetched"
    );
  } catch (error: any) {
    console.error("getDashboardStats error:", error?.message || error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

export default getDashboardStats;