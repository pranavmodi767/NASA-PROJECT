const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.once("open", () => {
  console.log("\x1b[32m MongoDb Connection ready...\x1b[0m");
});

mongoose.connection.on("error", (e) => console.log);

const mongoConnect = async () => await mongoose.connect(MONGO_URL);
const mongoDisconnect = async () => await mongoose.disconnect();

module.exports = {
  mongoDisconnect,
  mongoConnect,
};
