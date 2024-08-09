const jwt = require("jsonwebtoken");
const Admin = require("../models/adminSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  forgotPasswordEmailTemplate,
  validateEmail,
  passwordValidation,
  paginationObject,
  getKeywordType,
  capitalizeFirstLetter,
  templateMaker,
} = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../helpers/sendEmail");
const PaymentHistory = require("../models/paymentHistorySchema");
const PaymentService = require("./paymentService");
const { default: mongoose } = require("mongoose");
const Authentication = require("../models/authenticationSchema");
const SubscriptionPlan = require("../models/subscriptionplanSchema");
const paymentService = new PaymentService();
const moment = require("moment");
const Configuration = require("../models/configurationSchema");
const Excel = require("exceljs");
const fs = require("fs");
const Workspace = require("../models/workspaceSchema");
const Notification = require("../models/notificationSchema");
const Role_Master = require("../models/masters/roleMasterSchema");

class AdminService {
  tokenGenerator = (payload) => {
    try {
      const expiresIn = payload?.rememberMe
        ? process.env.JWT_REMEMBER_EXPIRE
        : process.env.JWT_EXPIRES_IN;
      const token = jwt.sign(
        { id: payload._id },
        process.env.JWT_ADMIN_SECRET_KEY,
        {
          expiresIn,
        }
      );
      return { token, user: payload };
    } catch (error) {
      logger.error(`Error while token generate, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  login = async (payload) => {
    try {
      const { email, password, rememberMe } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!passwordValidation(password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      if (!email || !password)
        return throwError(
          returnMessage("auth", "emailPassNotFound"),
          statusCode.badRequest
        );

      const admin_exist = await Admin.findOne({
        email,
        is_deleted: false,
      }).lean();

      if (!admin_exist)
        return throwError(
          returnMessage("admin", "adminNotFound"),
          statusCode.notFound
        );

      const correct_password = await bcrypt.compare(
        password,
        admin_exist?.password
      );
      if (!correct_password)
        return throwError(returnMessage("auth", "incorrectPassword"));
      return this.tokenGenerator({ ...admin_exist, rememberMe });
    } catch (error) {
      logger.error(`Error while admin login, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  getAdmin = async (payload) => {
    try {
      const admin_id = payload;
      const admin = await Admin.findOne({ _id: admin_id }).lean();

      if (!admin) {
        return throwError(returnMessage("admin", "adminNotFound"));
      }
      return admin;
    } catch (error) {
      logger.error(`Error while get Admin, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  forgotPassword = async (payload) => {
    try {
      const { email } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }
      const admin = await Admin.findOne({ email: email }, { password: 0 });
      if (!admin) {
        return throwError(returnMessage("admin", "emailNotFound"));
      }
      const reset_password_token = crypto.randomBytes(32).toString("hex");
      const encode = encodeURIComponent(email);
      const link = `${process.env.REACT_APP_URL}/admin/reset-password?token=${reset_password_token}&email=${encode}`;
      const company_urls = await Configuration.find().lean();
      let privacy_policy = company_urls[0]?.urls?.privacy_policy;

      let facebook = company_urls[0]?.urls?.facebook;

      let instagram = company_urls[0]?.urls?.instagram;

      const email_template = templateMaker("forgotPassword.html", {
        REACT_APP_URL: process.env.REACT_APP_URL,
        SERVER_URL: process.env.SERVER_URL,
        link,
        username:
          capitalizeFirstLetter(admin?.first_name) +
          " " +
          capitalizeFirstLetter(admin?.last_name),
        privacy_policy,
        facebook,
        instagram,
      });

      await sendEmail({
        email: email,
        subject: returnMessage("emailTemplate", "forgotPasswordSubject"),
        message: email_template,
      });

      const hash_token = crypto
        .createHash("sha256")
        .update(reset_password_token)
        .digest("hex");
      admin.reset_password_token = hash_token;
      await admin.save();
      return;
    } catch (error) {
      logger.error(`Error while admin forgotpassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  resetPassword = async (payload) => {
    try {
      const { token, email, newPassword } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!passwordValidation(newPassword)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const hash_token = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const admin = await Admin.findOne({
        email: email,
        reset_password_token: hash_token,
        is_deleted: false,
      });

      if (!admin) {
        return throwError(returnMessage("admin", "invalidToken"));
      }

      const hash_password = await bcrypt.hash(newPassword, 14);
      admin.password = hash_password;
      admin.reset_password_token = null;
      await admin.save();
      return;
    } catch (error) {
      logger.error(`Error while admin resetPassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  changePassword = async (payload, teamId) => {
    try {
      const { newPassword, oldPassword } = payload;
      const admin = await Admin.findById({ _id: teamId });
      if (!admin) {
        return throwError(returnMessage("admin", "emailNotFound"));
      }
      if (newPassword === oldPassword) {
        return throwError(returnMessage("auth", "oldAndNewPasswordSame"));
      }

      if (!passwordValidation(newPassword)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const is_match = await bcrypt.compare(oldPassword, admin.password);
      if (!is_match) {
        return throwError(returnMessage("admin", "passwordNotMatch"));
      }
      const hash_password = await bcrypt.hash(newPassword, 14);
      admin.password = hash_password;
      await admin.save();
    } catch (error) {
      logger.error(`Error while admin updatePassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // updateAdmin
  updateAdmin = async (payload, admin_id) => {
    try {
      const admin = await Admin.findByIdAndUpdate(
        {
          _id: admin_id,
        },
        payload,
        { new: true, useFindAndModify: false }
      );

      if (!admin) {
        return throwError(returnMessage("admin", "invalidId"));
      }
      return admin;
    } catch (error) {
      logger.error(`Error while Admin update, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  transactionHistory = async (payload) => {
    try {
      const search_obj = {};
      let match_obj = {
        subscription_id: { $exists: true },
        $and: [
          { payment_mode: { $ne: "referral" } },
          { payment_mode: { $ne: "manual" } },
        ],
      };

      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          {
            "agency.name": {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "agency.first_name": {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "agency.last_name": {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            subscription_id: {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            order_id: {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
        ];

        const keywordType = getKeywordType(payload?.search);
        if (keywordType === "number") {
          search_obj["$or"].push({
            amount: { $regex: parseInt(payload?.search), $options: "i" },
          });
        }
      }

      const pagination = paginationObject(payload);
      if (payload?.subscription_id && payload?.agency_id) {
        match_obj = {
          subscription_id: { $exists: false },
          agency_id: new mongoose.Types.ObjectId(payload?.agency_id),
          $and: [
            { payment_mode: { $ne: "referral" } },
            { payment_mode: { $ne: "manual" } },
          ],
        };
        pagination.skip = 0;
      }

      if (payload?.filter) {
        const { plan_id, date } = payload?.filter;
        if (plan_id && plan_id !== "") match_obj["plan_id"] = plan_id;
        if (date && date !== "") {
          const start_date = moment(date?.start_date, "DD-MM-YYYY").startOf(
            "day"
          );
          const end_date = moment(date?.end_date, "DD-MM-YYYY").endOf("day");

          match_obj["$and"] = [
            { createdAt: { $gte: new Date(start_date) } },
            { createdAt: { $lte: new Date(end_date) } },
          ];
        }
      }
      const aggragate = [
        { $match: match_obj },
        {
          $lookup: {
            from: "authentications",
            localField: "agency_id",
            foreignField: "_id",
            as: "agency",
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
        { $unwind: { path: "$agency", preserveNullAndEmptyArrays: true } },
        { $match: search_obj },
      ];

      // Aggregate pipeline for paginated results
      const paginatedAggregate = [...aggragate];
      if (!(payload?.subscription_id && payload?.agency_id)) {
        aggragate.push({ $sort: pagination.sort });
        aggragate.push({ $skip: pagination.skip });
        aggragate.push({ $limit: pagination.result_per_page });
      }

      const [transactions, total_transactions] = await Promise.all([
        PaymentHistory.aggregate(aggragate),
        PaymentHistory.aggregate(paginatedAggregate),
      ]);

      // for (let i = 0; i < transactions.length; i++) {
      //   if (transactions[i].first_time) {
      //     const orders = await PaymentHistory.find({
      //       agency_id: transactions[i].agency_id,
      //       subscription_id: { $exists: false },
      //       order_id: { $exists: true },
      //     }).lean();

      //     for (let j = 0; j < orders.length; j++) {
      //       const orderDetails = await paymentService.orderPaymentDetails(
      //         orders[j].order_id
      //       );
      //       orders[j].method = orderDetails?.items[0].method;
      //     }
      //     transactions[i].orders = orders;
      //   } else {
      //     const subscription_detail =
      //       await paymentService.getSubscriptionDetail(
      //         transactions[i].subscription_id
      //       );
      //     transactions[i].method = subscription_detail.payment_method;
      //   }
      // }
      let plan;
      for (let i = 0; i < transactions.length; i++) {
        if (
          payload?.subscription_id &&
          payload?.agency_id &&
          transactions[i].order_id
        ) {
          const paymentDetails = await paymentService.orderPaymentDetails(
            transactions[i].order_id
          );
          transactions[i].method = paymentDetails?.items?.[0]?.method;
          transactions[i].status = paymentDetails?.items?.[0]?.status;
        } else if (
          transactions[i]?.subscription_id &&
          transactions[i]?.agency_id
        ) {
          const [subscription_detail, orders_available, invoice_detail] =
            await Promise.all([
              paymentService.getSubscriptionDetail(
                transactions[i].subscription_id
              ),
              PaymentHistory.findOne({
                order_id: { $exists: true },
                agency_id: transactions[i].agency_id,
                subscription_id: { $exists: false },
              }),
              paymentService.invoices(transactions[i].subscription_id),
            ]);

          if (plan && plan?.plan_id == subscription_detail?.plan_id) {
            transactions[i].plan = plan?.name;
          } else {
            plan = await SubscriptionPlan.findOne({
              plan_id: subscription_detail?.plan_id,
            }).lean();
            transactions[i].plan = plan?.name;
          }
          transactions[i].method = subscription_detail?.payment_method;
          transactions[i].orders_available = orders_available ? true : false;
          transactions[i].status = capitalizeFirstLetter(
            invoice_detail?.items[0]?.status
          );
        }
      }

      return {
        transactions,
        page_count:
          Math.ceil(total_transactions.length / pagination.result_per_page) ||
          0,
      };
    } catch (error) {
      logger.error(
        `Error while fetching the Transaction history for the Admin: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Dashboard Data
  dashboardData = async () => {
    try {
      const currentDate = moment();
      const startOfMonth = moment(currentDate).startOf("month");
      const endOfMonth = moment(currentDate).endOf("month");

      let active_agencies = 0,
        active_clients = 0,
        active_team_agency = 0,
        active_team_client = 0;

      const [workspaces, team_agency_role, team_client_role, client_role] =
        await Promise.all([
          Workspace.find({ is_deleted: false }).lean(),
          Role_Master.findOne({ name: "team_agency" }).select("_id").lean(),
          Role_Master.findOne({ name: "team_client" }).select("_id").lean(),
          Role_Master.findOne({ name: "client" }).select("_id").lean(),
        ]);

      active_agencies = workspaces.length;

      workspaces.map((workspace) => {
        workspace?.members?.map((member) => {
          if (member?.user_id?.toString() === workspace?.created_by?.toString())
            return;

          if (
            member?.role?.toString() === team_agency_role?._id?.toString() &&
            member?.status === "confirmed"
          )
            ++active_team_agency;

          if (
            member?.role?.toString() === team_client_role?._id?.toString() &&
            member?.status === "confirmed"
          )
            ++active_team_client;

          if (
            member?.role?.toString() === client_role?._id?.toString() &&
            member?.status === "confirmed"
          )
            ++active_clients;

          return;
        });
        return;
      });

      const [thisMonthTotal] = await Promise.all([
        PaymentHistory.aggregate([
          {
            $match: {
              payment_mode: "payment",
              createdAt: {
                $gte: startOfMonth.toDate(),
                $lte: endOfMonth.toDate(),
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
            },
          },
        ]),
      ]);
      return {
        active_agencies,
        active_clients,
        active_team_agency,
        active_team_client,
        this_billing_amount: thisMonthTotal[0]?.totalAmount ?? 0,
      };
    } catch (error) {
      logger.error(`Error while fetch dashboard data for agency: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Agency Download
  agencyDownload = async (res) => {
    try {
      /* const pipeLine = [
        {
          $lookup: {
            from: "agencies",
            localField: "reference_id",
            foreignField: "_id",
            as: "agencyData",
          },
        },
        {
          $unwind: { path: "$agencyData", preserveNullAndEmptyArrays: true },
        },

        {
          $project: {
            _id: 0,
            first_name: 1,
            last_name: 1,
            contact_number: 1,
            email: 1,
            status: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "confirmed"] }, then: "Active" },
                  {
                    case: { $eq: ["$status", "free_trial"] },
                    then: "Free Trial",
                  },
                  {
                    case: { $eq: ["$status", "payment_pending"] },
                    then: "Payment Pending",
                  },
                  {
                    case: { $eq: ["$status", "agency_inactive"] },
                    then: "Agency Inactive",
                  },
                  {
                    case: { $eq: ["$status", "subscription_cancelled"] },
                    then: "Subscription cancelled",
                  },
                  {
                    case: { $eq: ["$status", "free_trial"] },
                    then: "Free Trial",
                  },
                ],
                default: "null",
              },
            },
            company_name: "$agencyData.company_name",
            company_website: "$agencyData.company_website",
            industry: "$agencyData.industry",
            no_of_people: "$agencyData.no_of_people",
          },
        },
      ]; */

      const aggragate = [
        { $match: { is_deleted: false } },
        { $unwind: { path: "$members", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$members.user_id", "$created_by"] },
                { $eq: ["$_id", "$_id"] }, // Ensures the matching is within the same workspace
              ],
            },
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
            pipeline: [
              {
                $project: {
                  company_name: 1,
                  company_website: 1,
                  profession_role: 1,
                  no_of_people: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  contact_number: 1,
                  name: { $concat: ["$first_name", " ", "$last_name"] },
                  _id: 1,
                  createdAt: 1,
                  purchased_plan: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$created_by._id",
            company_name: "$created_by.company_name",
            company_website: "$created_by.company_website",
            profession_role: "$created_by.profession_role",
            createdAt: "$created_by.createdAt",
            no_of_people: "$created_by.no_of_people",
            first_name: "$created_by.first_name",
            last_name: "$created_by.last_name",
            email: "$created_by.email",
            contact_number: "$created_by.contact_number",
            name: "$created_by.name",
            status: {
              $switch: {
                branches: [
                  {
                    case: { $ne: ["$trial_end_date", null] },
                    then: "Free Trial",
                  },
                  {
                    case: { $eq: ["$members.status", "confirmed"] },
                    then: "Active",
                  },
                  {
                    case: { $eq: ["$members.status", "payment_pending"] },
                    then: "Payment Pending",
                  },
                  {
                    case: { $eq: ["$members.status", "agency_inactive"] },
                    then: "Agency Inactive",
                  },
                  {
                    case: {
                      $eq: ["$members.status", "subscription_cancelled"],
                    },
                    then: "Subscription cancelled",
                  },
                  {
                    case: { $eq: ["$members.status", "free_trial"] },
                    then: "Free Trial",
                  },
                ],
              },
            },
            trial_end_date: { $ifNull: ["$trial_end_date", "-"] },
            workspace_name: "$name",
            purchased_plan: "$created_by.purchased_plan",
            is_deleted: 1,
          },
        },
      ];

      const agenciesData = await Workspace.aggregate(aggragate);

      agenciesData.forEach((agency) => {
        agency.name =
          capitalizeFirstLetter(agency?.first_name) +
          " " +
          capitalizeFirstLetter(agency?.last_name);
        return;
      });

      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Data");
      // Define headers
      worksheet.columns = [
        { header: "Name", key: "name" },
        { header: "Contact Number", key: "contact_number" },
        { header: "Email", key: "email" },
        { header: "Status", key: "status" },
        { header: "Company Name", key: "company_name" },
        { header: "Company Website", key: "company_website" },
        { header: "Profession Role", key: "profession_role" },
        { header: "No of People", key: "no_of_people" },
        { header: "Trial end date", key: "trial_end_date" },
      ];

      // Add headers from the first data object
      // const headers = Object.keys(agenciesData[0]);
      const headers = [
        "name",
        "contact_number",
        "email",
        "status",
        "company_name",
        "company_website",
        "profession_role",
        "no_of_people",
        "trial_end_date",
      ];
      worksheet.addRow();

      // Add data rows
      agenciesData.forEach((data) => {
        const row = [];
        headers.forEach((header) => {
          row.push(data.hasOwnProperty(header) ? data[header] : "");
        });
        worksheet.addRow(row);
      });

      // const filePath = "data.xlsx";
      // await workbook.xlsx.writeFile(filePath);

      // Write to file
      const buffer = await workbook.xlsx.writeBuffer();
      // fs.writeFileSync(filePath, buffer);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");
      res.send(buffer);
    } catch (error) {
      logger.error(`Error while Admin update, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // payment history download
  paymentHistoryDownload = async (res) => {
    try {
      let match_obj = {
        $or: [
          { subscription_id: { $exists: true } },
          { order_id: { $exists: true } },
        ],
        $and: [
          { payment_mode: { $ne: "referral" } },
          { payment_mode: { $ne: "manual" } },
        ],
      };

      const aggragate = [
        { $match: match_obj },
        {
          $lookup: {
            from: "authentications",
            localField: "agency_id",
            foreignField: "_id",
            as: "agency",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                  email: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$agency", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            subscription_id: 1,
            agency_id: 1,
            plan_id: 1,
            payment_mode: 1,
            createdAt: 1,
            name: "$agency.name",
            plan: 1,
            method: 1,
            order_id: 1,
            amount: { $divide: ["$amount", 100] },
            status: 1,
            payment_id: 1,
          },
        },
      ];

      const transactions = await PaymentHistory.aggregate(aggragate);

      let plan;
      for (let i = 0; i < transactions.length; i++) {
        if (
          transactions[i]?.subscription_id === "sub_NntdFhQFVmMize" ||
          transactions[i]?.subscription_id === "sub_Nnp8VY7i6zVPOp" ||
          transactions[i]?.subscription_id === "sub_NnlkQmeyz6BSXG" ||
          transactions[i]?.subscription_id === "sub_Nnju6iqpilvXpG" ||
          transactions[i]?.subscription_id === "sub_NnifTWJrtroRZV" ||
          transactions[i]?.subscription_id === "sub_NniUlPEBicS2A9" ||
          transactions[i]?.subscription_id === "sub_Nney65aXuztTyh" ||
          transactions[i]?.subscription_id === "sub_NmYwjzochRXXxA" ||
          transactions[i]?.subscription_id === "sub_No3VnlWavkrKWl" ||
          transactions[i]?.subscription_id === "sub_No7doVXUkh4gsX" ||
          transactions[i]?.subscription_id === "sub_No7bZmb3v1bzYH" ||
          transactions[i]?.subscription_id === "sub_No7qax1tjaAbHv" ||
          transactions[i]?.subscription_id === "sub_No837ufiB4Nx6f" ||
          transactions[i]?.subscription_id === "sub_No9PXU9DuzxzQN" ||
          transactions[i]?.subscription_id === "sub_NoB79k0MTLQDhf" ||
          transactions[i]?.subscription_id === "sub_NoB9NwDOzNfUVI" ||
          transactions[i]?.subscription_id === "sub_NoBIv6jsFslb2U" ||
          transactions[i]?.subscription_id === "sub_NoBaDtOS1tdSz9" ||
          transactions[i]?.subscription_id === "sub_NoBpdYh4WAwbgH" ||
          transactions[i]?.subscription_id === "sub_NoFf10q1T7Fh5U" ||
          transactions[i]?.subscription_id === "sub_NoT5l7UXZ22UUv" ||
          transactions[i]?.subscription_id === "sub_Noa2MrkJgAQ20o" ||
          transactions[i]?.subscription_id === "sub_NwR8y9eJumTwCA"
        ) {
          continue; // Skip this iteration and move to the next transaction
        }
        if (transactions[i].order_id) {
          const paymentDetails = await paymentService.orderPaymentDetails(
            transactions[i].order_id
          );
          transactions[i].method = paymentDetails?.items?.[0]?.method;
          transactions[i].status = paymentDetails?.items?.[0]?.status;
        } else if (transactions[i]?.subscription_id) {
          const [subscription_detail, invoice_detail] = await Promise.all([
            paymentService.getSubscriptionDetail(
              transactions[i]?.subscription_id
            ),

            paymentService.invoices(transactions[i]?.subscription_id),
          ]);

          if (plan && plan?.plan_id == subscription_detail?.plan_id) {
            transactions[i].plan = plan?.name;
          } else {
            plan = await SubscriptionPlan.findOne({
              plan_id: subscription_detail?.plan_id,
            }).lean();
            transactions[i].plan = plan?.name;
          }
          transactions[i].method = subscription_detail?.payment_method;
          transactions[i].status = capitalizeFirstLetter(
            invoice_detail?.items[0]?.status
          );
        }
      }
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Data");
      // Define headers
      worksheet.columns = [
        { header: "Name", key: "name" },
        { header: "Amount", key: "amount" },
        { header: "Date", key: "createdAt" },
        { header: "Form of Payment", key: "method" },
        { header: "Subscription ID", key: "subscription_id" },
        { header: "Subscription Plan", key: "plan" },
      ];

      // Add headers from the first data object
      // const headers = Object.keys(agenciesData[0]);
      const headers = [
        "name",
        "amount",
        "createdAt",
        "method",
        "subscription_id",
        "plan",
      ];
      worksheet.addRow();

      // Add data rows
      transactions.forEach((data) => {
        const row = [];
        headers.forEach((header) => {
          row.push(data.hasOwnProperty(header) ? data[header] : "");
        });
        worksheet.addRow(row);
      });

      const filePath = "data.xlsx";
      await workbook.xlsx.writeFile(filePath);

      // Write to file
      const buffer = await workbook.xlsx.writeBuffer();
      // fs.writeFileSync(filePath, buffer);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      // res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");
      res.send(buffer);
    } catch (error) {
      logger.error(`Error while Admin update, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // admin notification list

  getAllNotification = async (user, searchObj) => {
    try {
      const { skip, limit } = searchObj;

      const [notifications, un_read_count] = await Promise.all([
        Notification.find({ user_id: user._id })
          .sort({ createdAt: -1, is_read: -1 })
          .skip(skip)
          .limit(limit),
        Notification.find({
          user_id: user._id,
          is_read: false,
        }).countDocuments(),
      ]);
      return {
        notificationList: notifications,
        un_read_count: un_read_count,
      };
    } catch (error) {
      logger.error(
        `Error while getting the notifications list for the admin: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // read the notification

  readNotification = async (payload, user) => {
    try {
      const { notification_id } = payload;

      if (notification_id === "all") {
        await Notification.updateMany({ user_id: user._id }, { is_read: true });
      } else {
        await Notification.findByIdAndUpdate(
          notification_id,
          { is_read: true },
          { new: true }
        );
      }
      return;
    } catch (error) {
      logger.error(`Error while reading notification: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = AdminService;
