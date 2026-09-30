import mongoose from "mongoose";

const BlogContentItemSchema = new mongoose.Schema({
  type: { type: String, enum: ["paragraph", "heading", "text", "bullets"], default: "text" },
  text: { type: String },
  title: { type: String },
  content: { type: String },
  items: { type: [String], default: [] },
});

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    date: { type: String, trim: true },
    readTime: { type: String, trim: true },
    author: { type: String, trim: true },
    category: { type: String, trim: true },
    tags: { type: [String], default: [] },
    content: { type: [BlogContentItemSchema], default: [] },
    featured: { type: Boolean, default: false },
    slug: { type: String, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Blog = mongoose.model("Blog", BlogSchema);
