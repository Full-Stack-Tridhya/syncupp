const fs = require("fs");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const statusCode = require("../messages/statusCodes.json");

// Load Models
const Admin = require("../models/adminSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const Agency_Type_Master = require("../models/masters/agencyTypeMasterSchema");
const Activity_Type_Master = require("../models/masters/activityTypeMasterSchema");
const Activity_Status_Master = require("../models/masters/activityStatusMasterSchema");
const Configuration = require("../models/configurationSchema");

// const Country_Master = require("../models/masters/countryMasterSchema");
// const State_Master = require("../models/masters/stateMasterSchema");
// const City_Master = require("../models/masters/cityMasterSchema");

const admin_data = JSON.parse(
  fs.readFileSync(`${__dirname}/seeder-data/admin.json`, "utf-8")
);
const role_master_data = JSON.parse(
  fs.readFileSync(`${__dirname}/seeder-data/role_master.json`, "utf-8")
);

const agency_type_master_data = JSON.parse(
  fs.readFileSync(`${__dirname}/seeder-data/agency_type_master.json`, "utf-8")
);
const configuration_data = JSON.parse(
  fs.readFileSync(`${__dirname}/seeder-data/configuration.json`, "utf-8")
);
const activity_type_master_data = JSON.parse(
  fs.readFileSync(`${__dirname}/seeder-data/activity_type_master.json`, "utf-8")
);
const activity_status_master_data = JSON.parse(
  fs.readFileSync(
    `${__dirname}/seeder-data/activity_status_master.json`,
    "utf-8"
  )
);

// const state_master_data = JSON.parse(
//   fs.readFileSync(`${__dirname}/seeder-data/state_master.json`, "utf-8")
// );
// const country_master_data = JSON.parse(
//   fs.readFileSync(`${__dirname}/seeder-data/country_master.json`, "utf-8")
// );
// const city_master_data = JSON.parse(
//   fs.readFileSync(`${__dirname}/seeder-data/city_master.json`, "utf-8")
// );

exports.insertData = async () => {
  try {
    const [
      admins,
      roles,
      agency_types,
      activity_type,
      activity_status,
      configuration,
    ] = await Promise.all([
      Admin.countDocuments(),
      Role_Master.countDocuments(),
      Agency_Type_Master.countDocuments(),
      Activity_Type_Master.countDocuments(),
      Activity_Status_Master.countDocuments(),
      Configuration.countDocuments(),
    ]);

    const promiseArray = [];

    if (admins === 0) {
      // promiseArray.push(Admin.deleteMany());
      promiseArray.push(Admin.create(admin_data));
    }
    if (roles === 0) {
      // promiseArray.push(Role_Master.deleteMany());
      promiseArray.push(Role_Master.create(role_master_data));
    }
    if (agency_types === 0) {
      // promiseArray.push(Agency_Type_Master.deleteMany());
      promiseArray.push(Agency_Type_Master.create(agency_type_master_data));
    }
    if (activity_type === 0) {
      promiseArray.push(Activity_Type_Master.create(activity_type_master_data));
    }
    if (activity_status === 0) {
      promiseArray.push(
        Activity_Status_Master.create(activity_status_master_data)
      );
    }

    if (configuration === 0) {
      promiseArray.push(Configuration.create(configuration_data));
    }

    // if (countries === 0) {
    //   await Country_Master.create(country_master_data);
    // }
    // if (states === 0) {
    //   await State_Master.create(state_master_data);
    // }

    // if (cities === 0) {
    //   await City_Master.create(city_master_data);
    // }

    await Promise.all(promiseArray).then(() => console.log("data imported"));
  } catch (error) {
    logger.error(`Error while running seeder file: ${error}`);
    return throwError(error.message, statusCode.internalServerError);
  }
};
