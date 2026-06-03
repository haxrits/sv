const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas or local MongoDB instance.
 * Uses the MONGODB_URI from environment variables.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MongoDB connection string is missing. Please define MONGODB_URI or MONGO_URI in your environment variables.');
    }
    const conn = await mongoose.connect(uri);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
