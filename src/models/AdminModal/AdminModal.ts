import mongoose from "mongoose";
const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  avatar: {
    type: String,
    trim: true,
  },
}, { timestamps: true });
export const Admin = mongoose.model("admin", AdminSchema);
