const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const featureSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Feature = admin_connection.model("feature_cms", featureSchema);

module.exports = Feature;
