import mongoose from "mongoose";
import { autoSeed } from "./autoSeed.js";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  try {
    // Try connecting to primary URI with a 3-second timeout so it fails fast if not running
    console.log(`🔌 Attempting to connect to MongoDB...`);
    const connectionInstance = await mongoose.connect(uri, {
      dbName: "news-db",
      serverSelectionTimeoutMS: 3000,
    });
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`,
    );
    
    // Auto-seed data on successful connection
    await autoSeed();
  } catch (error) {
    console.warn("\n⚠️ Local MongoDB connection failed or not running:", error.message);
    console.log("⚡ Attempting to spin up programmatically managed In-Memory MongoDB server...");

    try {
      // Dynamically import to avoid load issues if package is not yet fully installed
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: "5.0.26",
        }
      });
      const inMemoryUri = mongoServer.getUri();
      console.log(`🚀 In-Memory MongoDB (v5.0.26) started successfully at: ${inMemoryUri}`);

      const connectionInstance = await mongoose.connect(inMemoryUri, {
        dbName: "news-db"
      });
      console.log(
        `\n MongoDB connected !! DB HOST (In-Memory): ${connectionInstance.connection.host}`,
      );

      // Seed the in-memory database
      await autoSeed();
    } catch (inMemoryError) {
      console.error("\n❌ FAILED to start or connect to In-Memory MongoDB server:", inMemoryError.message);
      console.error("Please ensure MongoDB is running or that 'npm install -D mongodb-memory-server' is completed.");
      process.exit(1);
    }
  }
};

export default connectDB;
