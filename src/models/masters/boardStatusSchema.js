const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const board_status_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["archived", "active"],
    },
  },
  { timestamps: true }
);

const Board_Status_Master = crm_connection.model(
  "board_status_master",
  board_status_schema
);

module.exports = Board_Status_Master;
