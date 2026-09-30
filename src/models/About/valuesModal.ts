import mongoose from "mongoose";

const ValueItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    borderColor: { type: String, required: false, trim: true },
  },
  { _id: false }
);

const ValuesSchema = new mongoose.Schema(
  {
    mainTitle: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    values: { type: [ValueItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Values = mongoose.model("Values", ValuesSchema);
