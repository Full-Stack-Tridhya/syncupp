const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const state_master_schema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: mongoose.Schema.Types.ObjectId, ref: "country_master" },
});

const State = crm_connection.model("state_master", state_master_schema);

module.exports = State;
