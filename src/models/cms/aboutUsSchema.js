const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const aboutUsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const About_Us = admin_connection.model("about_us_cms", aboutUsSchema);

module.exports = About_Us;
