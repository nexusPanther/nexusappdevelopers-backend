import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    categories: { type: [String], default: [] },
    featuredImage: { type: String, trim: true },
    mainTitle: { type: String, trim: true },
    productImage: { type: String, trim: true },
    description: { type: String, trim: true },
    challengeTitle: { type: String, trim: true },
    challengeContent: { type: String, trim: true },
    solutionTitle: { type: String, trim: true },
    solutionContent: { type: String, trim: true },
    specs: { type: [mongoose.Schema.Types.Mixed], default: [] },
    features: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    solutions: { type: [String], default: [] },
    timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
    stats: { type: [mongoose.Schema.Types.Mixed], default: [] },
    relatedProjects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    listCategory: { type: String, trim: true },
    listImage: { type: String, trim: true },
    listDescription: { type: String, trim: true },
    year: { type: String, trim: true },
    availableOn: {
      website: { type: String, trim: true, default: "" },
      android: { type: String, trim: true, default: "" },
      ios: { type: String, trim: true, default: "" },
    },
    slug: { type: String, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model("Portfolio", PortfolioSchema);