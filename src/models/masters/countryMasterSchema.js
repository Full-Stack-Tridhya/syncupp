const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const country_master_schema = new mongoose.Schema({
  name: { type: String, required: true },
  callingCodes: [],
  latlang: [],
  timezones: [],
  flag: { type: String },
  alpha2Code: { type: String },
  alpha3Code: { type: String },
});

const Country = crm_connection.model("country_master", country_master_schema);

module.exports = Country;
