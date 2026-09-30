import mongoose from "mongoose";

const HeroSectionSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: false,
      unique: false,
    },
    heading: {
      type: String,
      required: true,
    },
    highlightedHeading: {
      type: String,
      required: false,
    },
    paragraph: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const HeroSection = mongoose.model("HeroSection", HeroSectionSchema);
