import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logger";

// Load environment variables
dotenv.config();

const connectToDatabase = async () => {
  const uri = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD??'')}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DBNAME}?appName=Cluster0`;

  try {
    await mongoose.connect(uri);
    logger.info("Connected to Mongo!");
  } catch (error) {
    logger.error({ err: error }, "Connection to MongoDB failed");
    throw error;
  }
};

export default connectToDatabase;
