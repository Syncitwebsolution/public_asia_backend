import mongoose from "mongoose";
import { autoSeed } from "./autoSeed.js";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  try {
    console.log(`🔌 Attempting to connect to MongoDB...`);
    const connectionInstance = await mongoose.connect(uri, {
      dbName: "news-db",
      serverSelectionTimeoutMS: 3000,
    });
    console.log(
      `\n✅ MongoDB connected successfully! DB HOST: ${connectionInstance.connection.host}`,
    );
    
    // Auto-seed data on successful connection
    await autoSeed();
  } catch (error) {
    console.warn("\n⚠️ Primary MongoDB connection failed or not running:", error.message);
    console.log("⚡ Attempting In-Memory MongoDB server fallback...");

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      console.log(`🚀 In-Memory MongoDB started successfully at: ${inMemoryUri}`);

      const connectionInstance = await mongoose.connect(inMemoryUri, {
        dbName: "news-db"
      });
      console.log(
        `\n✅ MongoDB connected (In-Memory)! DB HOST: ${connectionInstance.connection.host}`,
      );

      await autoSeed();
    } catch (inMemoryError) {
      console.error("\n❌ MongoDB is not currently running on 127.0.0.1:27017 and Windows Application Control blocked the temporary MongoMemoryServer binary.");
      console.error("\n👉 HOW TO FIX:");
      console.error(" 1. Start your local MongoDB service / MongoDB Compass on your PC.");
      console.error(" 2. OR paste your MongoDB Atlas Cloud URI into Backend/.env (e.g. MONGODB_URI=mongodb+srv://...)\n");
    }
  }
};

export default connectDB;
