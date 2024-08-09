const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const homeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Home = admin_connection.model("home_cms", homeSchema);

module.exports = Home;
