import mongoose from "mongoose";

const AboutHeroSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    highlightedHeading: { type: String, required: false, trim: true },
    paragraph: { type: String, required: false, trim: true },
    image: { type: String, required: false, trim: true },
    videoUrl: { type: String, required: false, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AboutHero = mongoose.model("AboutHero", AboutHeroSchema);
