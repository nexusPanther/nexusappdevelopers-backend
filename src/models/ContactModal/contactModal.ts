import mongoose from "mongoose";
const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  phone: {
    type: String,
    require: true,
  },
  phoneCode: {
    type: String,
    require: true,
  },
  projectType: {
    type: String,
    require: true,
  },
  message: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    enum: ["pending", "resolved"],
    default: "pending",
  },
},
{ timestamps: true });
export const Contact = mongoose.model("contact", ContactSchema);
