import mongoose from "mongoose";

const TestimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    profileImageUrl: {
      type: String,
      required: false,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: false,
      trim: true,
    },
    designation: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model("Testimonial", TestimonialSchema);
