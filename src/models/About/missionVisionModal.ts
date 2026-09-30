import mongoose from "mongoose";

const MissionVisionSchema = new mongoose.Schema(
  {
    missionParagraph: { type: String, required: true, trim: true },
    missionImage: { type: String, required: false, trim: true },
    visionParagraph: { type: String, required: true, trim: true },
    visionImage: { type: String, required: false, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MissionVision = mongoose.model("MissionVision", MissionVisionSchema);
