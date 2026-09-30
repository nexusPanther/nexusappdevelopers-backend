import mongoose, { Schema } from "mongoose";
const tokenSchema = new mongoose.Schema({
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 20000,// this is the expiry time in seconds
    },
  });
  export const Token = mongoose.model("Token", tokenSchema);