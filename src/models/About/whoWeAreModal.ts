import mongoose from "mongoose";

const StatSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
  },
  { _id: false }
);

const WhoWeAreSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    paragraph: { type: String, required: true, trim: true },
    stats: { type: [StatSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WhoWeAre = mongoose.model("WhoWeAre", WhoWeAreSchema);
