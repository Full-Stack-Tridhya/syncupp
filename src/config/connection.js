const mongoose = require("mongoose");
const logger = require("../logger");
require("dotenv").config();

const dbConnection = (uri) => {
  const db = mongoose.createConnection(uri);

  db.on("error", function (error) {
    logger.error(`MongoDB :: connection ${this.name} ${JSON.stringify(error)}`);
    db.close().catch(() =>
      logger.error(`MongoDB :: failed to close connection ${this.name}`)
    );
  });

  db.on("connected", function () {
    logger.info(`MongoDB :: connected ${this.name}`);
  });

  db.on("disconnected", function () {
    logger.info(`MongoDB :: disconnected ${this.name}`);
  });

  return db;
};

const admin_connection = dbConnection(process.env.ADMIN_DB_URL);
const crm_connection = dbConnection(process.env.CRM_DB_URL);

module.exports = {
  admin_connection,
  crm_connection,
};
