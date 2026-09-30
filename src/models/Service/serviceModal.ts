import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    higlihlightTitle: { type: String, required: false, trim: true },
    description: { type: String, required: true, trim: true },
    bulletPoints: { type: [String], default: [] },
    image: { type: String, required: false, trim: true },
    mainImage: { type: String, required: false, trim: true },
    icon: { type: String, required: false, trim: true },
    tools: { type: [String], default: [] },
    serviceType: { type: String, required: false, trim: true },
    slug: { type: String, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Service = mongoose.model("Service", ServiceSchema);
