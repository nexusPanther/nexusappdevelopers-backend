import mongoose from "mongoose";

const ComparisonCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    items: { type: [String], default: [] },
    borderColor: { type: String, required: false, trim: true },
  },
  { _id: false }
);

const StandOutSchema = new mongoose.Schema(
  {
    mainTitle: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    manualWork: { type: ComparisonCardSchema, required: true },
    nexusAutomation: { type: ComparisonCardSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const StandOut = mongoose.model("StandOut", StandOutSchema);
