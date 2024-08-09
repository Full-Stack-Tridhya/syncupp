const logger = require("../logger");
const Workspace = require("../models/workspaceSchema");
const { throwError } = require("../helpers/errorUtil");
const statusCode = require("../messages/statusCodes.json");
const moment = require("moment");
const { returnMessage, validateRequestFields } = require("../utils/utils");
const Configuration = require("../models/configurationSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const SheetManagement = require("../models/sheetManagementSchema");
const Razorpay = require("razorpay");
const Authentication = require("../models/authenticationSchema");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

class WorkspaceService {
  createWorkspace = async (payload, user) => {
    try {
      const { workspace_name } = payload;
      if (!workspace_name)
        return throwError(returnMessage("workspace", "nameMissing"));
      if (!user) return throwError(returnMessage("auth", "unAuthorized"), 401);
      // this is used to check that user only creates the one workspace
      const workspace_exist = await Workspace.findOne({
        created_by: user?._id,
        is_deleted: false,
      }).lean();

      if (workspace_exist)
        return throwError(
          returnMessage("workspace", "workspaceAlreadyCreated")
        );

      const [workspace_name_exist, configuration, role] = await Promise.all([
        Workspace.findOne({
          name: workspace_name.trim(),
          is_deleted: false,
        }).lean(),
        Configuration.findOne({}).lean(),
        Role_Master.findOne({ name: "agency" }).lean(),
      ]);

      if (workspace_name_exist)
        return throwError(returnMessage("workspace", "duplicateWorkspaceName"));

      const status =
        configuration?.payment?.free_trial > 0
          ? "payment_pending"
          : "confirmed";

      const workspace_obj = {
        name: workspace_name.trim(),
        created_by: user?._id,
        members: [
          {
            user_id: user?._id,
            status: status,
            role: role?._id,
            joining_date: moment.utc().startOf("day"),
          },
        ],
      };

      // removed as we dont have use of this
      /* if (configuration && configuration?.payment?.free_trial > 0) {
        workspace_obj.trial_end_date = moment
          .utc()
          .startOf("day")
          .add(configuration?.payment?.free_trial, "days");
      } */
      const new_workspace = await Workspace.create(workspace_obj);

      if (new_workspace)
        await SheetManagement.findOneAndUpdate(
          { user_id: user?._id },
          {
            user_id: user?._id,
            total_sheets: 1,
            occupied_sheets: [],
          },
          { upsert: true }
        );

      return true;
    } catch (error) {
      logger.error(`Error while creating the workspace: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  updateWorkspace = async (payload, user) => {
    try {
      const { workspace_id, agency_id } = payload;
      const member_obj = {
        user_id: user?._id,
        status: "confirm_pending",
        role: user?.role,
        joining_date: moment.utc().startOf("day"),
      };

      // Add in workspace and Increse the sheet count
      Promise.all([
        await Workspace.findByIdAndUpdate(
          {
            _id: workspace_id,
          },
          {
            $push: {
              members: member_obj,
            },
          },
          {
            new: true,
          }
        ),
        await SheetManagement.findOneAndUpdate(
          { agency_id: agency_id },
          {
            $inc: { total_sheets: 1 },
            $push: {
              occupied_sheets: {
                user_id: user?._id,
                role: user?.role, // Assuming total_sheets should be based on workspace members count
              },
            },
          },
          { new: true }
        ),
      ]);
      return;
    } catch (error) {
      logger.error(`Error while creating the workspace: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  workspaces = async (user) => {
    try {
      const [created, invited] = await Promise.all([
        Workspace.find({ created_by: user?._id, is_deleted: false }).lean(),
        Workspace.find({
          members: {
            $elemMatch: { user_id: user?._id, status: "confirmed" },
          },
          is_deleted: false,
          created_by: { $ne: user?._id },
        })
          .sort({ "members.joining_date": -1 })
          .lean(),
      ]);
      const workspaces = [...created, ...invited];
      if (workspaces.length > 0) workspaces[0].default_workspace = true;
      return workspaces;
    } catch (error) {
      logger.error(`Error while fetching the workspaces: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  updateTrialEndDate = async (payload) => {
    try {
      const { trial_end_date, agency_id } = payload;
      const today = moment.utc().startOf("day");
      const trial_extend_date = moment
        .utc(trial_end_date, "DD-MM-YYYY")
        .startOf("day");
      if (!trial_extend_date.isSameOrAfter(today))
        return throwError(returnMessage("workspace", "invalidTrailExtendDate"));

      const [workspace, user] = await Promise.all([
        Workspace.findOne({
          created_by: agency_id,
          $and: [
            { trial_end_date: { $exists: true } },
            { trial_end_date: { $ne: null } },
          ],
          is_deleted: false,
        }).lean(),
        Authentication.findById(agency_id).lean(),
      ]);

      if (!workspace)
        return throwError(returnMessage("workspace", "workspaceNotFound"), 404);

      await Workspace.findByIdAndUpdate(workspace?._id, {
        trial_end_date: trial_extend_date,
      });

      const trial_extend_unix = trial_extend_date.unix();
      razorpay.subscriptions
        .update(user?.subscription_id, {
          start_at: trial_extend_unix,
        })
        .then((data) => {
          console.log("subscription updated:");
        })
        .catch((error) => {
          logger.error(`Error while updating subscription: ${error}`);
          console.log("error with update subscription", error);
        });
      return;
    } catch (error) {
      logger.error(`Error while updating the trial end date: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  workspaceCheck = async (payload, user) => {
    try {
      const { workspace_name } = payload;
      const workspace_exist = await Workspace.findOne({
        "members.user_id": user?._id,
        name: workspace_name,
      }).lean();

      if (!workspace_exist) {
        return throwError(
          returnMessage("workspace", "workspaceNotFound"),
          statusCode.notFound
        );
      }
      return true;
    } catch (error) {
      logger.error(`Error while checking the workspace name: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = WorkspaceService;
