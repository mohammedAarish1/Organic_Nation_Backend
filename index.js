const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
const categoryRouter = require("./Router/categoryRouter.js");
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const { connectAndPingMongoDB } = require("./Database.js");

connectAndPingMongoDB().catch(console.error);

app.use("/category", categoryRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
