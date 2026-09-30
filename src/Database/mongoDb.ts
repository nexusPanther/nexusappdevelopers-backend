import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectToDatabase = async () => {
  const uri = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD??'')}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DBNAME}?appName=Cluster0`;

  try {
    await mongoose.connect(uri);
    console.log("Connected to Mongo!");
  } catch (error) {
    console.error("Connection to MongoDB failed:", error);
    throw error;
  }
};

export default connectToDatabase;
