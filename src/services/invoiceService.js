const Invoice = require("../models/invoiceSchema");
require("dotenv").config();
const Invoice_Status_Master = require("../models/masters/invoiceStatusMaster");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  invoiceTemplate,
  validateEmail,
  formatPhoneNumber,
} = require("../utils/utils");
const mongoose = require("mongoose");
const { calculateInvoice, calculateAmount } = require("./commonSevice");
const { paginationObject, getKeywordType } = require("../utils/utils");
const Authentication = require("../models/authenticationSchema");
const sendEmail = require("../helpers/sendEmail");
const NotificationService = require("./notificationService");
const notificationService = new NotificationService();
const moment = require("moment");
const Currency = require("../models/masters/currencyListSchema");
const Configuration = require("../models/configurationSchema");
const Workspace = require("../models/workspaceSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const Setting = require("../models/settingSchema");
const AuthService = require("../services/authService");
const authService = new AuthService();
const fs = require("fs");
const SERVER_URL = process.env.SERVER_URL;
const puppeteer = require("puppeteer");

class InvoiceService {
  // Get Client list  ------   AGENCY API

  getClients = async (user) => {
    try {
      const client_data = await Role_Master.findOne({ name: "client" }).lean();
      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(user?.workspace) } },
        { $unwind: { path: "$members", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "members.role": client_data?._id,
            "members.status": "confirmed",
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
          $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true },
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
          $unwind: { path: "$status_name", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "state_masters",
            localField: "client_data.state",
            foreignField: "_id",
            as: "client_state",
            pipeline: [{ $project: { name: 1, _id: 1 } }],
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
            pipeline: [{ $project: { name: 1, _id: 1 } }],
          },
        },
        { $unwind: { path: "$clientCity", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "country_masters",
            localField: "client_data.country",
            foreignField: "_id",
            as: "clientCountry",
            pipeline: [{ $project: { name: 1, _id: 1 } }],
          },
        },
        {
          $unwind: { path: "$clientCountry", preserveNullAndEmptyArrays: true },
        },
        {
          $match: { "user_details.is_deleted": false },
        },
        {
          $project: {
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
      const [client_list, invoice_custom_clients] = await Promise.all([
        Workspace.aggregate(pipeline),
        Invoice.aggregate([
          {
            $match: {
              workspace_id: user?.workspace_detail?._id,
              $and: [
                { custom_client: { $exists: true } },
                { custom_client: { $ne: null } },
              ],
            },
          },
          {
            $project: {
              _id: 0,
              custom_client_id: "$custom_client._id",
              client_full_name: "$custom_client.name",
              email: "$custom_client.email",
              address: "$custom_client.address",
              contact_number: "$custom_client.contact_number",
              createdAt: 1, // Assume createdAt is a field from the Invoice
            },
          },
          {
            $sort: { createdAt: -1 }, // Sort by createdAt in descending order
          },
          {
            $group: {
              _id: {
                client_full_name: "$client_full_name",
                email: "$email",
                address: "$address",
                contact_number: "$contact_number",
              },
              client_full_name: { $first: "$client_full_name" },
              address: { $first: "$address" },
              contact_number: { $first: "$contact_number" },
              custom_client_id: { $first: "$custom_client_id" },
              email: { $first: "$email" },
              createdAt: { $first: "$createdAt" }, // Include createdAt in the group to retain the sorting
            },
          },
          {
            $project: {
              _id: "$custom_client_id",
              client_full_name: "$client_full_name",
              email: "$email",
              address: "$address",
              contact_number: "$contact_number",
              createdAt: "$createdAt", // Include createdAt in the final output if needed
            },
          },
        ]),
      ]);

      return [...client_list, ...invoice_custom_clients];
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Add   Invoice    ------   AGENCY API
  addInvoice = async (payload, user, logo) => {
    try {
      const {
        due_date,
        invoice_number,
        invoice_date,
        invoice_content,
        sent,
        currency,
        memo,
      } = payload;

      // this is used when user adds the client details manually
      let { custom_client, client_id } = payload;

      if (
        !client_id &&
        client_id === "" &&
        !custom_client &&
        custom_client === ""
      )
        return throwError(returnMessage("invoice", "clientDetailRequired"));

      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      if (user_role_data?.user_role !== "agency") {
        return throwError(returnMessage("auth", "insufficientPermission"), 403);
      }

      if (due_date < invoice_date) {
        return throwError(returnMessage("invoice", "invalidDueDate"));
      }

      const invoiceItems = JSON.parse(invoice_content);
      calculateAmount(invoiceItems);

      let newInvoiceNumber;

      // If invoice_number is not provided, generate a new one based on count
      if (!invoice_number) {
        let invoiceCount = await Invoice.countDocuments({
          agency_id: user?._id,
        });

        // Generate a new invoice number and ensure it's unique
        do {
          invoiceCount += 1;
          newInvoiceNumber = invoiceCount;
          var existingInvoice = await Invoice.findOne({
            invoice_number: newInvoiceNumber,
            workspace_id: user?.workspace,
          });
        } while (existingInvoice);
      } else {
        newInvoiceNumber = invoice_number;
        const isInvoice = await Invoice.findOne({
          invoice_number: newInvoiceNumber,
          workspace_id: user?.workspace,
        });
        if (isInvoice) {
          return throwError(returnMessage("invoice", "invoiceNumberExists"));
        }
      }

      const { total, sub_total } = calculateInvoice(invoiceItems);

      // Update Invoice status
      let getInvoiceStatus;
      if (sent === "true") {
        getInvoiceStatus = await Invoice_Status_Master.findOne({
          name: "unpaid",
        });
      } else {
        getInvoiceStatus = await Invoice_Status_Master.findOne({
          name: "draft",
        });
      }

      const invoice_setting_data = await Setting.findOne({
        workspace_id: user?.workspace,
      }).lean();
      let image_path = false;
      if (logo) {
        image_path = "uploads/" + logo?.filename;
        if (!invoice_setting_data?.invoice?.logo) {
          await Setting.findOneAndUpdate(
            { workspace_id: user?.workspace },
            { invoice: { logo: image_path } },
            { new: true }
          );
        }
      } else {
        image_path = invoice_setting_data?.invoice?.logo;
      }

      if (client_id && client_id !== "" && client_id !== "null") {
        const is_permanant_client = await Authentication.findById(client_id)
          .where("is_deleted")
          .eq(false)
          .lean();

        if (!is_permanant_client) client_id = null;
        else custom_client = null;
      }

      if (
        custom_client &&
        custom_client !== "" &&
        (client_id === "" || client_id === "null" || client_id === "undefined")
      ) {
        custom_client = JSON.parse(custom_client);
        const { email } = custom_client;
        if (!email) return throwError(returnMessage("auth", "emailRequired"));
        if (!validateEmail(email)) return returnMessage("auth", "invalidEmail");

        custom_client = {
          _id: new mongoose.Types.ObjectId(),
          name: custom_client?.name?.toLowerCase(),
          email: custom_client?.email?.toLowerCase(),
          address: custom_client?.address,
          contact_number: custom_client?.contact_number,
        };
      }

      const invoice = await Invoice.create({
        due_date,
        invoice_number: newInvoiceNumber,
        invoice_date,
        total,
        sub_total,
        invoice_content: invoiceItems,
        ...(client_id &&
          client_id !== "undefined" &&
          client_id !== "null" && { client_id: client_id }),
        currency,
        workspace_id: user?.workspace,
        memo,
        agency_id: user?._id,
        status: getInvoiceStatus?._id,
        ...(image_path && {
          invoice_logo: image_path,
        }),
        custom_client,
      });

      if (sent === "true") {
        const payload = { invoice_id: invoice?._id };
        await this.sendInvoice(payload, "create", user);
      }

      return invoice;
    } catch (error) {
      logger.error(`Error while  create Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Invoice   ------   AGENCY API
  updateInvoice = async (payload, invoiceIdToUpdate, user, logo) => {
    try {
      const {
        due_date,
        invoice_content,
        invoice_date,
        sent,
        currency,
        memo,
        invoice_number,
      } = payload;

      // this is used when user adds the client details manually
      let { custom_client, client_id } = payload;

      if (
        !client_id &&
        client_id !== "" &&
        !custom_client &&
        custom_client !== ""
      )
        return throwError(returnMessage("invoice", "clientDetailRequired"));

      if (client_id === "undefined" || client_id === "null" || client_id === "")
        client_id = null;

      // Check Permission
      const user_role_data = await authService?.getRoleSubRoleInWorkspace(user);
      if (user_role_data?.user_role !== "agency") {
        return throwError(returnMessage("auth", "insufficientPermission"), 403);
      }

      // Check invoice number already exists
      const draftKey = await Invoice_Status_Master.findOne({
        name: "draft",
      }).lean();
      const isInvoice = await Invoice.findOne({
        invoice_number: invoice_number,
        status: { $ne: draftKey?._id },
        workspace_id: user?.workspace,
      }).lean();

      if (isInvoice) {
        return throwError(returnMessage("invoice", "invoiceNumberExists"));
      }

      if (due_date < invoice_date) {
        return throwError(returnMessage("invoice", "invalidDueDate"));
      }

      const invoice = await Invoice.findById(invoiceIdToUpdate)
        .populate("status")
        .lean();

      if (client_id && client_id !== "") {
        const is_permanant_client = await Authentication.findById(client_id)
          .where("is_deleted")
          .eq(false)
          .lean();

        if (!is_permanant_client) client_id = null;
        else custom_client = null;
      }

      if (custom_client && custom_client !== "") {
        custom_client = JSON.parse(custom_client);

        if (!invoice?.custom_client?._id) {
          custom_client._id = new mongoose.Types.ObjectId();
        }
        const { email } = custom_client;
        if (!email) return throwError(returnMessage("auth", "emailRequired"));
        if (!validateEmail(email)) return returnMessage("auth", "invalidEmail");
      }

      if (invoice.status.name === "draft") {
        if (sent === "true") {
          var getInvoiceStatus = await Invoice_Status_Master.findOne({
            name: "unpaid",
          }).lean();
        }

        // For invoice calculation
        const invoiceItems = JSON.parse(invoice_content);
        calculateAmount(invoiceItems);
        const { total, sub_total } = calculateInvoice(invoiceItems);

        const invoice_setting_data = await Setting.findOne({
          workspace_id: user?.workspace,
        }).lean();

        // For update Image
        let image_path;

        image_path = logo ? "uploads/" + logo?.filename : null;
        if (!invoice_setting_data?.invoice?.logo && logo) {
          await Setting.findOneAndUpdate(
            { workspace_id: user?.workspace },
            { invoice: { logo: image_path } },
            { new: true }
          );
        }

        // For delete Image
        if (
          !logo ||
          invoice_setting_data?.invoice?.logo !== invoice?.invoice_logo
        ) {
          fs.unlink(`./src/public/${invoice?.invoice_logo}`, (err) => {
            if (err) {
              logger.error(`Error while unlinking the documents: ${err}`);
            }
          });
        }

        await Invoice.findByIdAndUpdate(invoiceIdToUpdate, {
          $set: {
            total,
            sub_total,
            due_date,
            invoice_content: invoiceItems,
            ...(!client_id || client_id === "null" || client_id === "undefined"
              ? {
                  client_id: null,
                }
              : { client_id: client_id }),
            invoice_date,
            status: getInvoiceStatus,
            currency,
            memo,
            invoice_number: invoice_number,
            invoice_logo: image_path,
            custom_client:
              !client_id || client_id === ""
                ? {
                    _id: new mongoose.Types.ObjectId(),
                    name: custom_client?.name?.toLowerCase(),
                    email: custom_client?.email?.toLowerCase(),
                    address: custom_client?.address,
                    contact_number: custom_client?.contact_number,
                  }
                : null,
          },
        });

        if (sent === "true") {
          const payload = { invoice_id: invoice?._id };
          await this.sendInvoice(payload, "create", user);
        }
      } else {
        return throwError(returnMessage("invoice", "canNotUpdate"));
      }
      return true;
    } catch (error) {
      logger.error(`Error while updating Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All Invoice    ------   AGENCY API
  getAllInvoice = async (searchObj, user) => {
    try {
      const { client_id } = searchObj;

      const match_obj = {
        is_deleted: false,
        workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        ...(client_id && { client_id: new mongoose.Types.ObjectId(client_id) }),
      };

      const queryObj = {};
      if (
        searchObj?.start_date !== null &&
        searchObj?.end_date !== null &&
        searchObj?.start_date !== undefined &&
        searchObj?.start_date !== undefined
      ) {
        const parsedEndDate = moment.utc(searchObj?.end_date, "DD/MM/YYYY");
        const parsedStartDate = moment.utc(searchObj?.start_date, "DD/MM/YYYY");
        searchObj.start_date = parsedStartDate.utc();
        searchObj.end_date = parsedEndDate.utc();
      }
      // Add date range conditions for invoice date and due date

      if (searchObj?.start_date && searchObj?.end_date) {
        queryObj.$and = [
          {
            $or: [
              {
                invoice_date: {
                  $gte: new Date(searchObj?.start_date),
                  $lte: new Date(searchObj?.end_date),
                },
              },
              {
                due_date: {
                  $gte: new Date(searchObj?.start_date),
                  $lte: new Date(searchObj?.end_date),
                },
              },
            ],
          },
        ];
      } else if (searchObj?.start_date) {
        queryObj.$or = [
          { invoice_date: { $gte: new Date(searchObj?.start_date) } },
          { due_date: { $gte: new Date(searchObj?.start_date) } },
        ];
      } else if (searchObj?.end_date) {
        queryObj.$or = [
          { invoice_date: { $lte: new Date(searchObj?.end_date) } },
          { due_date: { $lte: new Date(searchObj?.end_date) } },
        ];
      }
      if (searchObj?.search && searchObj?.search !== "") {
        queryObj["$or"] = [
          {
            invoice_number: {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "status.name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "customer_info.first_name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "customer_info.last_name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "customer_info.client_fullName": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            total: {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "custom_client.name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
        ];

        const keywordType = getKeywordType(searchObj?.search);
        if (keywordType === "number") {
          const numericKeyword = parseFloat(searchObj?.search);

          queryObj["$or"].push({
            total: numericKeyword,
          });
        }
      }

      if (searchObj?.client_name && searchObj?.client_name !== "") {
        const valid_object_id = mongoose.isValidObjectId(
          searchObj?.client_name
        );

        if (valid_object_id) {
          const client_objId = new mongoose.Types.ObjectId(
            searchObj?.client_name
          );
          queryObj["$or"] = [
            { "customer_info._id": client_objId },
            { "custom_client._id": client_objId },
          ];
        }
      }
      if (searchObj.status_name && searchObj.status_name.trim() !== "") {
        queryObj["status.name"] = {
          $regex: `^${searchObj.status_name.trim()}$`,
          $options: "i", // Case-insensitive match
        };
      }

      const pagination = paginationObject(searchObj);
      const pipeLine = [
        { $match: match_obj },
        {
          $lookup: {
            from: "invoice_status_masters",
            localField: "status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "client_id",
            foreignField: "_id",
            as: "customer_info",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  reference_id: 1,
                  company_name: 1,
                  client_fullName: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$customer_info", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "currencies",
            localField: "currency",
            foreignField: "_id",
            as: "currency_name",
            pipeline: [{ $project: { symbol: 1, name: 1 } }],
          },
        },
        {
          $unwind: { path: "$currency_name", preserveNullAndEmptyArrays: true },
        },
        { $match: queryObj },
        {
          $project: {
            _id: 1,
            invoice_number: 1,
            invoice_date: 1,
            due_date: 1,
            first_name: "$customer_info.first_name",
            last_name: "$customer_info.last_name",
            company_name: "$customer_info.company_name",
            status: "$status.name",
            client_full_name: "$customer_info.client_fullName",
            total: 1,
            createdAt: 1,
            updatedAt: 1,
            client_id: "$customer_info._id",
            currency_symbol: "$currency_name.symbol",
            currency_name: "$currency_name.name",
            custom_client: 1,
            memo: 1,
          },
        },
      ];

      // added condition due to the custom client
      if (searchObj?.sort_field === "client_full_name") {
        pagination.sort["custom_client.name"] =
          payload?.sort_order === "desc" ? -1 : 1;
      }

      const [invoiceList, total_invoices] = await Promise.all([
        Invoice.aggregate(pipeLine)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Invoice.aggregate(pipeLine),
      ]);

      return {
        invoiceList,
        page_count:
          Math.ceil(total_invoices.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while Lising ALL Invoice Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET Invoice   ------   Client and Agency API

  getInvoice = async (invoice_id) => {
    try {
      const invoice = await Invoice.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(invoice_id) } },
        {
          $lookup: {
            from: "authentications",
            localField: "client_id",
            foreignField: "_id",
            as: "client_info",
            pipeline: [
              {
                $project: {
                  name: 1,
                  _id: 1,
                  contact_number: 1,
                  first_name: 1,
                  last_name: 1,
                  client_full_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                  email: 1,
                  state: 1,
                  city: 1,
                  country: 1,
                  company_name: 1,
                  address: 1,
                  pincode: 1,
                  gst: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$client_info", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "authentications",
            localField: "agency_id",
            foreignField: "_id",
            as: "agency_info",
            pipeline: [
              {
                $project: {
                  name: 1,
                  _id: 1,
                  contact_number: 1,
                  first_name: 1,
                  last_name: 1,
                  agency_full_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                  email: 1,
                  state: 1,
                  city: 1,
                  country: 1,
                  company_name: 1,
                  address: 1,
                  pincode: 1,
                  gst: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$agency_info", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "invoice_status_masters",
            localField: "status",
            foreignField: "_id",
            as: "status_data",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        { $unwind: { path: "$status_data", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "state_masters",
            localField: "client_info.state",
            foreignField: "_id",
            as: "client_state",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: { path: "$client_state", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "city_masters",
            localField: "client_info.city",
            foreignField: "_id",
            as: "client_city",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        { $unwind: { path: "$client_city", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "country_masters",
            localField: "client_info.country",
            foreignField: "_id",
            as: "client_country",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: {
            path: "$client_country",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "state_masters",
            localField: "agency_info.state",
            foreignField: "_id",
            as: "agencyState",
            pipeline: [
              {
                $project: { name: 1 },
              },
            ],
          },
        },
        { $unwind: { path: "$agencyState", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "city_masters",
            localField: "agency_info.city",
            foreignField: "_id",
            as: "agencyCity",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        { $unwind: { path: "$agencyCity", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "country_masters",
            localField: "agency_info.country",
            foreignField: "_id",
            as: "agencyCountry",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: { path: "$agencyCountry", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "currencies",
            localField: "currency",
            foreignField: "_id",
            as: "currency_name",
            pipeline: [{ $project: { symbol: 1, name: 1 } }],
          },
        },
        {
          $unwind: { path: "$currency_name", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 1,
            invoice_number: 1,
            invoice_date: 1,
            invoice_logo: 1,
            due_date: 1,
            status: "$status_data.name",
            from: {
              _id: "$agency_info._id",
              first_name: "$agency_info.first_name",
              last_name: "$agency_info.last_name",
              agency_full_name: "$agency_info.agency_full_name",
              contact_number: "$agency_info.contact_number",
              email: "$agency_info.email",
              company_name: "$agency_info.company_name",
              address: "$agency_info.address",
              pincode: "$agency_info.pincode",
              state: "$agencyState",
              city: "$agencyCity",
              country: "$agencyCountry",
              gst: "$agency_info.gst",
            },
            to: {
              _id: "$client_info._id",
              first_name: "$client_info.first_name",
              last_name: "$client_info.last_name",
              client_full_name: "$client_info.client_full_name",
              contact_number: "$client_info.contact_number",
              email: "$client_info.email",
              company_name: "$client_info.company_name",
              address: "$client_info.address",
              pincode: "$client_info.pincode",
              state: "$client_state",
              city: "$client_city",
              country: "$client_country",
              gst: "$client_info.gst",
            },

            invoice_content: 1,
            sub_total: 1,
            total: 1,
            createdAt: 1,
            updatedAt: 1,
            memo: 1,
            currency_symbol: "$currency_name.symbol",
            currency_name: "$currency_name.name",
            currency_id: "$currency_name._id",
            workspace_id: 1,
            custom_client: 1,
          },
        },
      ]);

      if (invoice.length > 0) {
        if (invoice[0]?.from) {
          if (invoice[0]?.from?.contact_number) {
            invoice[0].from.contact_number = formatPhoneNumber(
              "+" + invoice[0]?.from?.contact_number
            );
          }
        }
        if (invoice[0]?.to) {
          if (invoice[0]?.to?.contact_number) {
            invoice[0].to.contact_number = formatPhoneNumber(
              "+" + invoice[0]?.to?.contact_number
            );
          }
        }
      }
      return invoice;
    } catch (error) {
      logger.error(`Error while Get Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Status Invoice   ------   AGENCY API
  updateStatusInvoice = async (payload, invoiceIdToUpdate, user) => {
    try {
      const { status } = payload;

      if (status === "unpaid") {
        const payload = { invoice_id: invoiceIdToUpdate };
        await this.sendInvoice(payload, "updateStatusUnpaid", user);
      }

      if (status === "unpaid" || status === "paid" || status === "overdue") {
        // Get Invoice status
        const get_invoice_status = await Invoice_Status_Master.findOne({
          name: status,
        }).lean();
        await Invoice.updateOne(
          { _id: invoiceIdToUpdate },
          { $set: { status: get_invoice_status?._id } }
        );
      }

      if (status === "paid") {
        const payload = { invoice_id: invoiceIdToUpdate };
        await this.sendInvoice(payload, "updateStatusPaid", user);
      }
      return true;
    } catch (error) {
      logger.error(`Error while updating  Invoice status, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Invoice  ------   AGENCY API

  deleteInvoice = async (payload) => {
    try {
      const { invoiceIdsToDelete } = payload;

      const invoices = await Invoice.find({
        _id: { $in: invoiceIdsToDelete },
        is_deleted: false,
      })
        .populate("status", "name")
        .lean();
      const deletableInvoices = invoices.filter(
        (invoice) => invoice.status.name === "draft"
      );
      if (deletableInvoices.length === invoiceIdsToDelete.length) {
        await Invoice.updateMany(
          { _id: { $in: invoiceIdsToDelete } },
          { $set: { is_deleted: true } },
          { new: true }
        );
        return true;
      } else {
        return throwError(returnMessage("invoice", "canNotDelete"));
      }
    } catch (error) {
      logger.error(`Error while Deleting Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All Invoice    ------   CLient API
  getClientInvoice = async (searchObj, user) => {
    try {
      const match_obj = {
        is_deleted: false,
        client_id: new mongoose.Types.ObjectId(user?._id),
        workspace_id: new mongoose.Types.ObjectId(user?.workspace),
      };
      const queryObj = {};
      if (
        searchObj?.start_date !== null &&
        searchObj?.end_date !== null &&
        searchObj?.start_date !== undefined &&
        searchObj?.start_date !== undefined
      ) {
        const parsedStartDate = moment.utc(searchObj?.start_date, "DD/MM/YYYY");
        searchObj.start_date = parsedStartDate.utc();
        const parsedEndDate = moment.utc(searchObj?.end_date, "DD/MM/YYYY");
        searchObj.end_date = parsedEndDate.utc();
      }
      // Add date range conditions for invoice date and due date
      if (searchObj?.start_date && searchObj?.end_date) {
        queryObj.$and = [
          {
            $or: [
              {
                invoice_date: {
                  $gte: new Date(searchObj?.start_date),
                  $lte: new Date(searchObj?.end_date),
                },
              },
              {
                due_date: {
                  $gte: new Date(searchObj?.start_date),
                  $lte: new Date(searchObj?.end_date),
                },
              },
            ],
          },
        ];
      } else if (searchObj.start_date) {
        queryObj.$or = [
          { invoice_date: { $gte: new Date(searchObj?.start_date) } },
          { due_date: { $gte: new Date(searchObj?.start_date) } },
        ];
      } else if (searchObj.end_date) {
        queryObj.$or = [
          { invoice_date: { $lte: new Date(searchObj?.end_date) } },
          { due_date: { $lte: new Date(searchObj?.end_date) } },
        ];
      }

      if (searchObj?.search && searchObj?.search !== "") {
        queryObj["$or"] = [
          {
            invoice_number: {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "status_array.name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            total: {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
        ];

        const keywordType = getKeywordType(searchObj?.search);
        if (keywordType === "number") {
          const numericKeyword = parseFloat(searchObj?.search);
          queryObj["$or"].push({
            total: numericKeyword,
          });
        }
      }

      if (searchObj?.status_name && searchObj?.status_name !== "") {
        queryObj["status_array.name"] = {
          $regex: `^${searchObj?.status_name.trim()}$`,
          $options: "i",
        };
      }

      const pagination = paginationObject(searchObj);
      const pipeLine = [
        {
          $match: match_obj,
        },
        {
          $lookup: {
            from: "invoice_status_masters",
            localField: "status",
            foreignField: "_id",
            as: "status_array",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: { path: "$status_array", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "currencies",
            localField: "currency",
            foreignField: "_id",
            as: "currency_name",
            pipeline: [
              {
                $project: {
                  symbol: 1,
                  name: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$currency_name", preserveNullAndEmptyArrays: true },
        },

        {
          $match: {
            "status_array.name": { $ne: "draft" }, // Exclude documents with status "draft"
          },
        },
        {
          $match: queryObj,
        },
        {
          $project: {
            _id: 1,
            invoice_number: 1,
            client_id: 1,
            due_date: 1,
            invoice_date: 1,
            status: "$status_array.name",
            agency_id: 1,
            sub_total: 1,
            total: 1,
            createdAt: 1,
            updatedAt: 1,
            memo: 1,
            currency_symbol: "$currency_name.symbol",
            currency_name: "$currency_name.name",
          },
        },
      ];

      const [invoiceList, total_invoices] = await Promise.all([
        Invoice.aggregate(pipeLine)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Invoice.aggregate(pipeLine),
      ]);

      return {
        invoiceList,
        page_count:
          Math.ceil(total_invoices.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while Lising ALL Invoice Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Send Invoice

  sendInvoice = async (payload, type, user) => {
    try {
      let notification;
      let invoice_data;

      const { invoice_id } = payload;
      const configuration = await Configuration.findOne({}).lean();

      if (invoice_id) {
        const invoice = await Invoice.findOne({
          _id: invoice_id,
          is_deleted: false,
        })
          .populate("client_id")
          .populate("agency_id")
          .populate("status")
          .lean();

        if (invoice?.status?.name === "draft") {
          notification = true;
          const get_invoice_status = await Invoice_Status_Master.findOne({
            name: "unpaid",
          }).lean();
          await Invoice.updateOne(
            { _id: invoice_id },
            { $set: { status: get_invoice_status?._id } }
          );
        }
        invoice_data = await this.getInvoice(invoice_id);

        const client_details = await Authentication.findById(
          invoice?.client_id
        ).lean();

        if (
          !invoice_data[0]?.invoice_logo ||
          invoice_data[0]?.invoice_logo == ""
        ) {
          const setting_invoice_exist = await Setting.findOne({
            workspace_id: user?.workspace,
          }).lean();

          if (
            setting_invoice_exist &&
            setting_invoice_exist?.invoice?.logo &&
            setting_invoice_exist?.invoice?.logo !== ""
          ) {
            invoice_data[0].invoice_logo = setting_invoice_exist?.invoice?.logo;
          }
        }

        if (
          invoice_data[0]?.invoice_logo &&
          invoice_data[0]?.invoice_logo !== ""
        ) {
          invoice_data[0].invoice_logo =
            SERVER_URL + "/" + invoice_data[0].invoice_logo;
        }
        if (client_details || invoice?.custom_client) {
          // Use a template or format the invoice message accordingly
          const formatted_inquiry_email = invoiceTemplate({
            ...invoice_data[0],
            invoice_date: moment(invoice_data[0]?.invoice_date).format(
              "MMM DD, YYYY"
            ),
            due_date: moment(invoice_data[0]?.due_date).format("MMM DD, YYYY"),
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
            year: new Date().getFullYear(),
          });

          let invoiceSubject = "invoiceSubject";
          if (type === "updateStatusPaid") invoiceSubject = "invoicePaid";
          if (type === "create") invoiceSubject = "invoiceCreated";
          if (type === "updateStatusUnpaid") invoiceSubject = "invoicePaid";

          sendEmail({
            email: client_details?.email || invoice?.custom_client?.email,
            subject:
              returnMessage("invoice", invoiceSubject) +
              invoice?.invoice_number,
            message: formatted_inquiry_email,
          });
        }
      }
      if (
        (invoice_data &&
          invoice_data[0]?.status === "unpaid" &&
          type === "create") ||
        notification ||
        (invoice_data &&
          invoice_data[0]?.status === "unpaid" &&
          type === "updateStatusUnpaid") ||
        (invoice_data &&
          invoice_data[0]?.status === "paid" &&
          type === "updateStatusPaid")
      ) {
        if (invoice_data[0]?.to?._id) {
          // ----------------  Notification start    -----------------

          await notificationService.addNotification(
            {
              receiver_name: invoice_data[0]?.to?.client_full_name,
              sender_name: invoice_data[0]?.from?.agency_full_name,
              receiver_id: invoice_data[0]?.to?._id,
              invoice_number: invoice_data[0]?.invoice_number,
              module_name: "invoice",
              action_type: type,
              workspace_id: user?.workspace,
            },
            invoice_data[0]?._id
          );
          // ----------------  Notification end    -----------------
        }
      }
      if (Array.isArray(payload) && type === "overdue") {
        payload.forEach(async (invoice_id) => {
          const invoice = await this.getInvoice(invoice_id);

          // ----------------  Notification start    -----------------

          let notification_sent = ["agency"];
          if (invoice[0]?.client_id) {
            notification_sent.push("client");
          }

          notification_sent.forEach(async (receiver) => {
            await notificationService?.addNotification(
              {
                receiver_name:
                  receiver === "client"
                    ? invoice[0]?.to?.client_full_name
                    : invoice[0]?.from?.agency_full_name,
                sender_name:
                  receiver === "client"
                    ? invoice[0]?.from?.agency_full_name
                    : invoice[0]?.to?.client_full_name,
                receiver_id:
                  receiver === "client"
                    ? invoice[0]?.to?._id
                    : invoice[0]?.from?._id,
                invoice_number: invoice[0]?.invoice_number,
                module_name: "invoice",
                action_type:
                  receiver === "client" ? "overdue" : "agencyOverdue",
                workspace_id: invoice[0]?.workspace_id,
                receiver: receiver,
              },
              invoice_id
            );
          });
          const client_details = await Authentication.findById(
            invoice[0]?.to?._id
          ).lean();

          if (!invoice[0]?.invoice_logo || invoice[0]?.invoice_logo == "") {
            const setting_invoice_exist = await Setting.findOne({
              workspace_id: user?.workspace,
            }).lean();

            if (
              setting_invoice_exist &&
              setting_invoice_exist?.invoice?.logo &&
              setting_invoice_exist?.invoice?.logo !== ""
            ) {
              invoice[0].invoice_logo = setting_invoice_exist?.invoice?.logo;
            }
          }

          if (invoice[0]?.invoice_logo && invoice[0]?.invoice_logo !== "") {
            invoice[0].invoice_logo =
              SERVER_URL + "/" + invoice[0].invoice_logo;
          }
          if (client_details || invoice[0]?.custom_client) {
            // Use a template or format the invoice message accordingly
            const formatted_inquiry_email = invoiceTemplate({
              ...invoice[0],
              invoice_date: moment(invoice[0]?.invoice_date).format(
                "MMM DD, YYYY"
              ),
              due_date: moment(invoice[0]?.due_date).format("MMM DD, YYYY"),
              REACT_APP_URL: process.env.REACT_APP_URL,
              SERVER_URL: process.env.SERVER_URL,
              instagram: configuration?.urls?.instagram,
              facebook: configuration?.urls?.facebook,
              privacy_policy: configuration?.urls?.privacy_policy,
              year: new Date().getFullYear(),
            });
            sendEmail({
              email: client_details?.email || invoice[0]?.custom_client?.email,
              subject:
                returnMessage("invoice", "invoiceOverdue") +
                invoice[0]?.invoice_number,
              message: formatted_inquiry_email,
            });
          }

          // ----------------  Notification end    -----------------
        });
      }

      return true;
    } catch (error) {
      logger.error(`Error while send Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Download PDF

  downloadPdf = async (payload, res, user) => {
    try {
      const { invoice_id } = payload;
      const invoice = await this.getInvoice(invoice_id);
      const configuration = await Configuration.find({}).lean();

      if (!invoice[0]?.invoice_logo || invoice[0]?.invoice_logo == "") {
        const setting_invoice_exist = await Setting.findOne({
          workspace_id: user?.workspace,
        }).lean();

        if (
          setting_invoice_exist &&
          setting_invoice_exist?.invoice?.logo &&
          setting_invoice_exist?.invoice?.logo !== ""
        ) {
          invoice[0].invoice_logo = setting_invoice_exist?.invoice?.logo;
        }
      }

      if (invoice[0]?.invoice_logo && invoice[0]?.invoice_logo !== "") {
        invoice[0].invoice_logo = SERVER_URL + "/" + invoice[0].invoice_logo;
      }
      const renderedHtml = invoiceTemplate({
        ...invoice[0],
        invoice_date: moment(invoice[0]?.invoice_date).format("MMM DD, YYYY"),
        due_date: moment(invoice[0]?.due_date).format("MMM DD, YYYY"),
        REACT_APP_URL: process.env.REACT_APP_URL,
        SERVER_URL: process.env.SERVER_URL,
        instagram: configuration[0]?.urls?.instagram,
        facebook: configuration[0]?.urls?.facebook,
        privacy_policy: configuration[0]?.urls?.privacy_policy,
        year: new Date().getFullYear(),
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(renderedHtml);
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      // const pdfOptions = {};
      // // Convert the PDF to a buffer using html-pdf
      // const pdfBuffer = await new Promise((resolve, reject) => {
      //   pdf.create(renderedHtml, { format: "A4" }).toBuffer((err, buffer) => {
      //     if (err) {
      //       reject(err);
      //     } else {
      //       resolve(buffer);
      //     }
      //   });
      // });

      // res.set({
      //   "Content-Type": "application/pdf",
      //   "Content-Disposition": `attachment; filename="invoice_${invoice_id}.pdf"`,
      // });
      // res.send(pdfBuffer);
      return {
        pdfBuffer: pdfBuffer,
        filename: `${invoice[0]?.invoice_number}.pdf`,
        html: renderedHtml,
      };
    } catch (error) {
      logger.error(`Error while generating PDF, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Overdue crone Job

  overdueCronJob = async () => {
    try {
      const currentDate = new Date();
      const overdue = await Invoice_Status_Master.findOne({
        name: "overdue",
      }).lean();
      const paid = await Invoice_Status_Master.findOne({ name: "paid" }).lean();
      const draft = await Invoice_Status_Master.findOne({
        name: "draft",
      }).lean();
      const overdueInvoices = await Invoice.find({
        due_date: { $lt: currentDate },
        status: { $nin: [overdue?._id, paid?._id, draft?._id] },
      });

      const overDueIds = await Invoice.distinct("_id", {
        due_date: { $lt: currentDate },
        status: { $nin: [overdue._id, paid._id, draft?._id] },
      }).lean();

      // Update status to "overdue" for each overdue invoice
      const overdueStatus = await Invoice_Status_Master.findOne({
        name: "overdue",
      });
      for (const invoice of overdueInvoices) {
        invoice.status = overdueStatus._id;
        await invoice.save();
      }

      await this.sendInvoice(overDueIds, "overdue");
    } catch (error) {
      logger.error(`Error while Overdue crone Job PDF, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Currency List

  currencyList = async () => {
    try {
      const currencies = await Currency.find({ is_deleted: false });
      return currencies;
    } catch (error) {
      logger.error(`Error while Currency list Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  addCurrency = async (payload) => {
    try {
      await Currency.create({
        symbol: payload.symbol,
        name: payload.name,
        code: payload.code,
      });
    } catch (error) {
      logger.error(`Error while Currency list Invoice, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Upload logo
  uploadLogo = async (user, logo) => {
    try {
      const is_exist = await Setting.findOne({
        workspace_id: user?.workspace,
      }).lean();

      if (
        is_exist?.invoice?.logo ||
        !logo ||
        logo == "" ||
        logo == "null" ||
        logo == "undefined"
      ) {
        fs.unlink(`./src/public/${is_exist?.invoice?.logo}`, (err) => {
          if (err) {
            logger.error(`Error while unlinking the documents: ${err}`);
          }
        });
      }

      const image_path =
        logo && logo !== "" && logo !== "null" && logo !== "undefined"
          ? "uploads/" + logo?.filename
          : null;
      await Setting.findOneAndUpdate(
        { workspace_id: user?.workspace },
        {
          invoice: { logo: image_path },
        },
        { upsert: true }
      );
      return;
    } catch (error) {
      logger.error(`Error while Upload image , ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Get Setting
  getSetting = async (user, logo) => {
    try {
      const getSetting = await Setting.findOne({
        workspace_id: user?.workspace,
      })
        .select("-__v")
        .lean();
      return getSetting;
    } catch (error) {
      logger.error(`Error while Get setting , ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = InvoiceService;
