
const mongoose = require('mongoose');

let isConnected = false;

const connectToMongoDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  const uri = process.env.MONGO_URI;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    });

    console.log("Successfully connected to MongoDB!");
    isConnected = true;

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });
  } catch (error) {
    console.error("An error occurred while connecting to MongoDB:", error);
    isConnected = false;
    throw error;
  }
};

const getDb = () => {
  if (!isConnected) {
    throw new Error("Database not connected. Call connectToMongoDB first.");
  }
  return mongoose.connection.db;
};

const closeConnection = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB connection closed.");
  }
};

module.exports = { connectToMongoDB, getDb, closeConnection };