import mongoose from "mongoose";

const AboutSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    highlightedHeading: { type: String, required: false, trim: true },
    paragraph: { type: String, required: false, trim: true },
    image: { type: String, required: false, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AboutSection = mongoose.model("AboutSection", AboutSchema);
