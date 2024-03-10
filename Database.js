// dbConnection.js

const { MongoClient, ServerApiVersion } = require("mongodb");
let database = null;
const connectAndPingMongoDB = async () => {
  const uri =
    "mongodb+srv://aayushkapoor2001:aayush1415@cluster0.sj3vvpc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    database = client.db("Organic-Nation");
  } catch (error) {
    console.error("An error occurred while connecting to MongoDB:", error);
  }
};

const getDb = () => {
  if (!database) {
    throw new Error(
      "Database not initialized. Call connectAndPingMongoDB first."
    );
  }
  return database;
};

module.exports = { connectAndPingMongoDB, getDb };
