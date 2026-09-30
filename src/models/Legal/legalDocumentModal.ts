import mongoose from "mongoose";

const LegalSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number },
});

const LegalDocumentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["terms", "privacy"], required: true },
    sections: { type: [LegalSectionSchema], default: [] },
    lastUpdated: { type: Date },
  },
  { timestamps: true }
);

export const LegalDocument = mongoose.model("LegalDocument", LegalDocumentSchema);
