import mongoose, { Schema, Document } from "mongoose";

export interface IMetaTag extends Document {
  route: string;
  pageTitle?: string;
  focusKeyword?: string;
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterCard?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MetaTagSchema = new Schema(
  {
    route: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    pageTitle: {
      type: String,
      trim: true,
      default: "",
    },
    focusKeyword: {
      type: String,
      trim: true,
      default: "",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: String,
      trim: true,
      default: "",
    },
    canonical: {
      type: String,
      trim: true,
      default: "",
    },
    ogTitle: {
      type: String,
      trim: true,
      default: "",
    },
    ogDescription: {
      type: String,
      trim: true,
      default: "",
    },
    ogImage: {
      type: String,
      trim: true,
      default: "/static/img/logo.png",
    },
    twitterTitle: {
      type: String,
      trim: true,
      default: "",
    },
    twitterDescription: {
      type: String,
      trim: true,
      default: "",
    },
    twitterCard: {
      type: String,
      trim: true,
      default: "summary_large_image",
    },
  },
  { timestamps: true }
);

export const MetaTag = mongoose.model<IMetaTag>("MetaTag", MetaTagSchema);
