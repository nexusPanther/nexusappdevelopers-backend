import mongoose, { Document } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  designation?: string;
  profileImageUrl?: string;
  description: string;
  rating: number;
  isVideo: boolean;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: string;
  isFeatured: boolean;
  orderIndex: number;
  status: "active" | "inactive";
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new mongoose.Schema(
  {
    // Client Identity
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: 120,
    },
    designation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },
    profileImageUrl: {
      type: String,
      default: "/static/img/profile-img.png",
      trim: true,
    },

    // Testimonial Content
    description: {
      type: String,
      required: [true, "Testimonial quote/description is required"],
      trim: true,
      maxlength: 10000,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    // Video Testimonial Fields
    isVideo: {
      type: Boolean,
      default: false,
      index: true,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    videoThumbnail: {
      type: String,
      trim: true,
      default: "",
    },
    videoDuration: {
      type: String,
      trim: true,
      default: "",
    },

    // Display & Ordering
    isFeatured: {
      type: Boolean,
      default: false,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    // Backwards compatibility with previous field
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text search index on name, designation, and description
TestimonialSchema.index({ name: "text", designation: "text", description: "text" });

export const Testimonial = mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

