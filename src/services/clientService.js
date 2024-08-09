const { throwError } = require("../helpers/errorUtil");
const logger = require("../logger");
const Client = require("../models/clientSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const {
  validateRequestFields,
  invitationEmail,
  returnMessage,
  paginationObject,
  validateEmail,
  passwordValidation,
  capitalizeFirstLetter,
  templateMaker,
} = require("../utils/utils");
const Authentication = require("../models/authenticationSchema");
const sendEmail = require("../helpers/sendEmail");
const statusCode = require("../messages/statusCodes.json");
const Team_Agency = require("../models/teamAgencySchema");
const Team_Client = require("../models/teamClientSchema");
const SheetManagement = require("../models/sheetManagementSchema");
const moment = require("moment");
const mongoose = require("mongoose");
const Configuration = require("../models/configurationSchema");
const Workspace = require("../models/workspaceSchema");
const crypto = require("crypto");
const SubscriptionPlan = require("../models/subscriptionplanSchema");
const PaymentService = require("../services/paymentService");
const paymentService = new PaymentService();

class ClientService {
  // create client for the agency
  createClient = async (payload, user) => {
    try {
      const {
        email,
        first_name,
        last_name,
        contact_number,
        company_name,
        company_website,
        gst,
        address,
        country,
        city,
        state,
        pincode,
      } = payload;

      const workspace_exist = await Workspace.findById(user?.workspace)
        .where("is_deleted")
        .equals(false)
        .lean();

      if (!workspace_exist)
        return throwError(
          returnMessage("workspace", "workspaceNotFound"),
          statusCode.notFound
        );

      const [client_exist, role, configuration, plan, sheets] =
        await Promise.all([
          Authentication.findOne({ email, is_deleted: false }).lean(),
          Role_Master.findOne({ name: "client" }).lean(),
          Configuration.findOne({}).lean(),
          SubscriptionPlan.findById(user?.purchased_plan).lean(),
          SheetManagement.findOne({
            user_id: user?._id,
            is_deleted: false,
          }).lean(),
        ]);

      if (
        plan?.plan_type === "unlimited" &&
        sheets?.occupied_sheets?.length >= sheets?.total_sheets - 1
      )
        return throwError(returnMessage("payment", "maxSheetsAllocated"));

      if (client_exist) {
        // check for the user already exist in the workspace
        const exist_in_workspace = workspace_exist?.members?.find(
          (member) =>
            member?.user_id?.toString() === client_exist?._id?.toString() &&
            member?.status !== "deleted"
        );

        if (exist_in_workspace)
          return throwError(
            returnMessage("client", "clientIsAlreadyExistInWorkspace")
          );
        let invitation_token;
        if (
          sheets?.total_sheets - 1 > sheets?.occupied_sheets?.length ||
          workspace_exist?.trial_end_date ||
          workspace_exist?.pause_subscription_date
        ) {
          invitation_token = crypto.randomBytes(16).toString("hex");
          const link = `${process.env.REACT_APP_URL}/verify?workspace=${
            workspace_exist?._id
          }&email=${encodeURIComponent(
            client_exist?.email
          )}&token=${invitation_token}&workspace_name=${
            workspace_exist?.name
          }&first_name=${client_exist?.first_name}&last_name=${
            client_exist?.last_name
          }`;

          const email_template = templateMaker("teamInvitation.html", {
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            username:
              capitalizeFirstLetter(client_exist?.first_name) +
              " " +
              capitalizeFirstLetter(client_exist?.last_name),
            invitation_text: `You are invited to the ${capitalizeFirstLetter(
              workspace_exist?.name
            )} workspace by ${
              capitalizeFirstLetter(user?.first_name) +
              " " +
              capitalizeFirstLetter(user?.last_name)
            }. Click on the below link to join the workspace.`,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
          });

          sendEmail({
            email: client_exist?.email,
            subject: returnMessage("auth", "invitationEmailSubject"),
            message: email_template,
          });
        }
        // need to remove the user if the user is added before and deleted
        workspace_exist.members = workspace_exist?.members?.filter(
          (member) =>
            member?.user_id?.toString() !== client_exist?._id?.toString()
        );

        const members = [...workspace_exist.members];
        members.push({
          user_id: client_exist?._id,
          role: role?._id,
          invitation_token: invitation_token,
          status:
            sheets?.total_sheets - 1 > sheets?.occupied_sheets?.length ||
            workspace_exist?.trial_end_date ||
            workspace_exist?.pause_subscription_date
              ? "confirm_pending"
              : "payment_pending",
        });

        await Workspace.findByIdAndUpdate(
          workspace_exist?._id,
          { members: members },
          { new: true }
        );

        const occupied_sheets = [...sheets.occupied_sheets];

        occupied_sheets.push({
          user_id: client_exist?._id,
          role: role?._id,
          workspace: workspace_exist?._id,
        });

        const sheet_obj = {
          occupied_sheets: occupied_sheets,
        };

        if (plan?.plan_type === "limited") {
          sheet_obj.total_sheets = sheets?.total_sheets + 1;
          paymentService.updateSubscription(
            user?._id,
            sheets?.total_sheets + 1
          );
        }
        await SheetManagement.findByIdAndUpdate(sheets?._id, sheet_obj);

        return {
          message:
            sheets?.total_sheets - 1 > sheets?.occupied_sheets?.length ||
            workspace_exist?.trial_end_date ||
            workspace_exist?.pause_subscription_date
              ? returnMessage("workspace", "invitationSend")
              : returnMessage("agency", "clientCreated"),
        };
      } else {
        validateRequestFields(payload, [
          "first_name",
          "last_name",
          "email",
          "address",
          "company_name",
        ]);

        if (contact_number) {
          const unique_contact = await Authentication.findOne({
            contact_number,
            is_deleted: false,
          }).lean();
          if (unique_contact)
            return throwError(returnMessage("user", "contactNumberExist"));
        }

        const new_user = await Authentication.create({
          email,
          first_name: first_name?.toLowerCase(),
          last_name: last_name?.toLowerCase(),
          contact_number,
          company_name,
          company_website,
          address,
          city,
          country,
          state,
          pincode,
          gst,
        });

        let invitation_token;

        if (
          sheets?.total_sheets - 1 > sheets?.occupied_sheets?.length ||
          workspace_exist?.trial_end_date ||
          workspace_exist?.pause_subscription_date
        ) {
          invitation_token = crypto.randomBytes(16).toString("hex");
          const link = `${process.env.REACT_APP_URL}/verify?workspace=${
            workspace_exist?._id
          }&email=${encodeURIComponent(
            email
          )}&token=${invitation_token}&workspace_name=${
            workspace_exist?.name
          }&first_name=${first_name}&last_name=${last_name}`;

          const email_template = templateMaker("teamInvitation.html", {
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            username:
              capitalizeFirstLetter(first_name) +
              " " +
              capitalizeFirstLetter(last_name),
            invitation_text: `You are invited to the ${capitalizeFirstLetter(
              workspace_exist?.name
            )} workspace by ${
              capitalizeFirstLetter(user?.first_name) +
              " " +
              capitalizeFirstLetter(user?.last_name)
            }. Click on the below link to join the workspace.`,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
          });

          sendEmail({
            email: email,
            subject: returnMessage("auth", "invitationEmailSubject"),
            message: email_template,
          });
        }
        // need to remove the user if the user is added before and deleted
        workspace_exist.members = workspace_exist?.members?.filter(
          (member) => member?.user_id?.toString() !== new_user?._id?.toString()
        );

        const members = [...workspace_exist.members];
        members.push({
          user_id: new_user?._id,
          role: role?._id,
          invitation_token: invitation_token,
          status:
            sheets?.total_sheets - 1 > sheets?.occupied_sheets?.length ||
            workspace_exist?.trial_end_date ||
            workspace_exist?.pause_subscription_date
              ? "confirm_pending"
              : "payment_pending",
        });

        await Workspace.findByIdAndUpdate(
          workspace_exist?._id,
          { members: members },
          { new: true }
        );

        const occupied_sheets = [...sheets.occupied_sheets];

        occupied_sheets.push({
          user_id: new_user?._id,
          role: role?._id,
          workspace: workspace_exist?._id,
        });
        const sheet_obj = {
          occupied_sheets: occupied_sheets,
        };

        if (plan?.plan_type === "limited") {
          sheet_obj.total_sheets = sheets?.total_sheets + 1;
          paymentService.updateSubscription(
            user?._id,
            sheets?.total_sheets + 1
          );
        }
        await SheetManagement.findByIdAndUpdate(sheets?._id, sheet_obj);
        return {
          message:
            sheets?.total_sheets - 1 > sheets?.occupied_sheets?.length ||
            workspace_exist?.trial_end_date ||
            workspace_exist?.pause_subscription_date
              ? returnMessage("workspace", "invitationSend")
              : returnMessage("agency", "clientCreated"),
        };
      }
    } catch (error) {
      console.log(error);
      logger.error(`Error while creating client: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get the client ist for the Agency
  clientList = async (payload, user) => {
    try {
      if (!payload?.pagination) {
        return await this.clientListWithoutPagination(user);
      }
      const pagination = paginationObject(payload);

      let search_obj = {},
        filter_obj = {};
      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          { "user.first_name": { $regex: payload.search, $options: "i" } },
          { "user.last_name": { $regex: payload.search, $options: "i" } },
          { "user.name": { $regex: payload.search, $options: "i" } },
          { "user.email": { $regex: payload.search, $options: "i" } },
          { status: { $regex: payload.search, $options: "i" } },
          { sub_role: { $regex: payload.search, $options: "i" } },
        ];
      }

      if (payload?.filter) {
        const { filter } = payload;

        if (filter?.status && filter?.status !== "")
          filter_obj.status = filter.status;

        if (
          filter?.date &&
          filter?.date?.start_date &&
          filter?.date?.end_date &&
          filter?.date?.start_date !== "" &&
          filter?.date?.end_date !== ""
        ) {
          const start_date = moment
            .utc(filter?.date?.start_date, "DD-MM-YYYY")
            .startOf("day");
          const end_date = moment
            .utc(filter?.date?.end_date, "DD-MM-YYYY")
            .endOf("day");
          filter_obj["$and"] = [
            { joining_date: { $gte: new Date(start_date) } },
            { joining_date: { $lte: new Date(end_date) } },
          ];
        }
      }

      const [client_role, client_team_role] = await Promise.all([
        Role_Master.findOne({ name: "client" }).select("_id").lean(),
        Role_Master.findOne({ name: "team_client" }).select("_id").lean(),
      ]);

      const aggragate = [
        { $match: { _id: new mongoose.Types.ObjectId(user?.workspace) } },
        { $unwind: "$members" }, // Unwind the members array
        {
          $match: {
            $or: [
              { "members.role": client_role?._id },
              { "members.role": client_team_role?._id },
            ],
            "members.status": { $ne: "deleted" },
          },
        },
        {
          $lookup: {
            from: "authentications", // The collection name of the users
            localField: "members.user_id",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                  email: 1,
                  company_name: 1,
                  company_website: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }, // Unwind the user details array
        {
          $lookup: {
            from: "role_masters", // The collection name of the sub_roles
            localField: "members.role",
            foreignField: "_id",
            as: "role",
          },
        },
        {
          $unwind: { path: "$role", preserveNullAndEmptyArrays: true },
        }, // Unwind the sub_role details array
        {
          $project: {
            _id: 0,
            user: "$user", // Get user details
            role: "$role.name",
            status: "$members.status",
            client_id: "$members.client_id",
            joining_date: "$members.joining_date",
          },
        },
        { $match: filter_obj },
        { $match: search_obj },
      ];

      const [clients, totalClients] = await Promise.all([
        Workspace.aggregate(aggragate)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Workspace.aggregate(aggragate),
      ]);

      return {
        clients,
        page_count:
          Math.ceil(totalClients.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(
        `Error While fetching list of client for the agency: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get the client ist for the Agency without pagination
  clientListWithoutPagination = async (user) => {
    try {
      const client_data = await Role_Master.findOne({ name: "client" }).lean();
      // const team_client_data = await Role_Master.findOne({
      //   name: "team_client",
      // }).lean();
      const pipeline = [
        {
          $match: { _id: new mongoose.Types.ObjectId(user?.workspace) },
        },

        {
          $unwind: {
            path: "$members",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "authentications",
            localField: "members.user_id",
            foreignField: "_id",
            as: "user_details",
          },
        },

        {
          $unwind: {
            path: "$user_details",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "role_masters",
            localField: "members.role",
            foreignField: "_id",
            as: "status_name",
          },
        },
        {
          $unwind: {
            path: "$status_name",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "state_masters",
            localField: "client_data.state",
            foreignField: "_id",
            as: "client_state",
            pipeline: [
              {
                $project: {
                  name: 1,
                  _id: 1,
                },
              },
            ],
          },
        },

        {
          $unwind: { path: "$client_state", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "city_masters",
            localField: "client_data.city",
            foreignField: "_id",
            as: "clientCity",
            pipeline: [
              {
                $project: {
                  name: 1,
                  _id: 1,
                },
              },
            ],
          },
        },

        {
          $unwind: { path: "$clientCity", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "country_masters",
            localField: "client_data.country",
            foreignField: "_id",
            as: "clientCountry",
            pipeline: [
              {
                $project: {
                  name: 1,
                  _id: 1,
                },
              },
            ],
          },
        },

        {
          $unwind: { path: "$clientCountry", preserveNullAndEmptyArrays: true },
        },

        {
          $match: {
            $or: [
              {
                "status_name._id": new mongoose.Types.ObjectId(
                  client_data?._id
                ),
              },
              // {
              //   "status_name._id": new mongoose.Types.ObjectId(
              //     team_client_data?._id
              //   ),
              // },
            ],
            "members.status": "confirmed",
            "user_details.is_deleted": false,
          },
        },

        {
          $project: {
            _id: 0,
            role: "$status_name.name",
            _id: "$user_details._id",
            profile_image: "$user_details.profile_image",
            first_name: "$user_details.first_name",
            last_name: "$user_details.last_name",
            company_name: "$user_details.company_name",
            contact_number: "$user_details.contact_number",
            address: "$user_details.address",
            industry: "$user_details.industry",
            no_of_people: "$user_details.no_of_people",
            pincode: "$user_details.pincode",
            email: "$user_details.email",
            city: "$clientCity",
            state: "$clientState",
            country: "$clientCountry",
            client_full_name: {
              $concat: [
                "$user_details.first_name",
                " ",
                "$user_details.last_name",
              ],
            },
          },
        },
      ];
      const client_list = await Workspace.aggregate(pipeline);

      return client_list;
    } catch (error) {
      logger.error(
        `Error While fetching list of client for the agency: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  getAgencies = async (client) => {
    try {
      let client_data, status;
      // if the user role is type of hte team client then we need to provide the access same as a client
      if (client?.role?.name === "team_client") {
        client_data = await Team_Client.findById(client?.reference_id).lean();
        status = "confirmed";
      } else {
        client_data = await Client.findById(client?.reference_id).lean();
        status = "active";
      }

      const agency_array = client_data?.agency_ids?.map((agency) =>
        agency?.status === status ? agency?.agency_id : undefined
      );

      return await Authentication.find({
        reference_id: { $in: agency_array },
        is_deleted: false,
      })
        .select("name reference_id first_name last_name")
        .lean();
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get the client ist for the Agency without pagination
  //  and this will used for the activity only to add client team member
  clientListWithoutPaginationForActivity = async (agency) => {
    try {
      let clients;
      let team_client;
      if (agency?.role?.name === "team_agency") {
        const agency_detail = await Team_Agency.findById(agency.reference_id);
        clients = await Client.distinct("_id", {
          agency_ids: {
            $elemMatch: {
              agency_id: agency_detail?.agency_id,
              status: "active",
            },
          },
        }).lean();
        team_client = await Team_Client.distinct("_id", {
          agency_ids: {
            $elemMatch: {
              agency_id: agency_detail?.agency_id,
              status: "confirmed",
            },
          },
        }).lean();
        clients = [...clients, ...team_client];
      } else {
        clients = await Client.distinct("_id", {
          agency_ids: {
            $elemMatch: { agency_id: agency?.reference_id, status: "active" },
          },
        }).lean();
        team_client = await Team_Client.distinct("_id", {
          agency_ids: {
            $elemMatch: {
              agency_id: agency?.reference_id,
              status: "confirmed",
            },
          },
        }).lean();
        clients = [...clients, ...team_client];
      }
      const aggrage_array = [
        { $match: { reference_id: { $in: clients }, is_deleted: false } },
        {
          $lookup: {
            from: "role_masters",
            localField: "role",
            foreignField: "_id",
            as: "user_type",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: {
            path: "$user_type",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            first_name: 1,
            last_name: 1,
            email: 1,
            name: { $concat: ["$first_name", " ", "$last_name"] },
            createdAt: 1,
            reference_id: 1,
            contact_number: 1,
            profile_image: 1,
            role: "$user_type.name",
          },
        },
      ];

      return await Authentication.aggregate(aggrage_array);
    } catch (error) {
      logger.error(
        `Error While fetching list of client for the agency: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };
  referralCodeGenerator = async () => {
    try {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let referral_code = "";

      // Generate the initial code
      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referral_code += characters.charAt(randomIndex);
      }

      const referral_code_exist = await Authentication.findOne({
        $or: [{ referral_code }, { affiliate_referral_code: referral_code }],
      }).lean();
      if (referral_code_exist) return this.referralCodeGenerator();

      return referral_code;
    } catch (error) {
      logger.error("Error while generating the referral code", error);
      return false;
    }
  };
}

module.exports = ClientService;
