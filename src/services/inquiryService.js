const Inquiry = require("../models/inquirySchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  paginationObject,
  inquiryEmail,
  returnMessage,
  inquiryTemplate,
  validateEmail,
  ticketTemplate,
  templateMaker,
} = require("../utils/utils");
const sendEmail = require("../helpers/sendEmail");
const Admin = require("../models/adminSchema");
const NotificationService = require("./notificationService");
const Ticket = require("../models/ticketSchema");
const Configuration = require("../models/configurationSchema");
const notificationService = new NotificationService();

class inquiryService {
  // Add   Inquiry
  addInquiry = async (payload) => {
    try {
      const {
        first_name,
        contact_number,
        email,
        last_name,
        country,
        no_of_people,
        thoughts,
      } = payload;
      const inquiry = await Inquiry.create({
        first_name,
        contact_number,
        email,
        last_name,
        country,
        no_of_people,
        thoughts,
      });

      // Use a template or format the invoice message accordingly
      const configuration = await Configuration.findOne().lean();

      const email_template = templateMaker("inquiry.html", {
        REACT_APP_URL: process.env.REACT_APP_URL + "/admin",
        SERVER_URL: process.env.SERVER_URL,
        name:
          capitalizeFirstLetter(first_name) +
          " " +
          capitalizeFirstLetter(last_name),
        email: email,
        message: thoughts,
        contact_number: contact_number,
        createdAt: inquiry.createdAt,
        instagram: configuration?.urls?.instagram,
        facebook: configuration?.urls?.facebook,
        privacy_policy: configuration?.urls?.privacy_policy,
      });

      sendEmail({
        email: process.env.CLIENT_EMAIL,
        subject: returnMessage("inquiry", "newInquiry"),
        message: email_template,
      });

      await notificationService.addAdminNotification({
        module_name: "inquiry",
      });

      return inquiry;
    } catch (error) {
      logger.error(`Error while Inquiry create, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All Inquires
  getAllInquiry = async (searchObj) => {
    try {
      const queryObj = { is_deleted: false };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            first_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            last_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            contact_number: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            thoughts: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            no_of_people: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$first_name", " ", "$last_name"] },
                regex: searchObj.search.toLowerCase(),
                options: "i",
              },
            },
          },
        ];
      }

      const pagination = paginationObject(searchObj);

      const pipeLine = [
        {
          $match: queryObj,
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            contact_number: 1,
            country: 1,
            no_of_people: 1,
            thoughts: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const [inquiries, totalInquiryCount] = await Promise.all([
        Inquiry.aggregate(pipeLine)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Inquiry.aggregate(pipeLine),
      ]);

      return {
        inquiries,
        page_count:
          Math.ceil(totalInquiryCount.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while Inquiry Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Inquires

  deleteInquiry = async (payload) => {
    try {
      const { inquiryIdsToDelete } = payload;
      await Inquiry.updateMany(
        { _id: { $in: inquiryIdsToDelete } },
        { $set: { is_deleted: true } }
      );
      return true;
    } catch (error) {
      logger.error(`Error while Inquiry Delete, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Add   Ticket
  addTicket = async (payload) => {
    try {
      const { name, contact_number, email, ticket_detail } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }
      const ticket = await Ticket.create({
        name,
        contact_number,
        email,
        ticket_detail,
      });
      const admin = await Admin.findOne({});

      // Use a template or format the invoice message accordingly
      const formattedTicketEmail = ticketTemplate({
        ...payload,
        user: "Admin",
      });
      await sendEmail({
        email: admin?.email,
        subject: returnMessage("emailTemplate", "newTicketReceived"),
        message: formattedTicketEmail,
      });
      const formattedTicketEmailUser = ticketTemplate({
        user: name,
        ...payload,
      });

      await sendEmail({
        email: email,
        subject: returnMessage("emailTemplate", "newTicketSent"),
        message: formattedTicketEmailUser,
      });

      await notificationService.addAdminNotification({
        module_name: "ticket",
      });

      return ticket;
    } catch (error) {
      logger.error(`Error while ticket create, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All Tickets
  getAllTicket = async (searchObj) => {
    try {
      const queryObj = { is_deleted: false };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            contact_number: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            ticket_detail: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }

      const pagination = paginationObject(searchObj);

      const pipeLine = [
        {
          $match: queryObj,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            contact_number: 1,
            country: 1,
            ticket_detail: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const [tickets, totalTicketCount] = await Promise.all([
        Ticket.aggregate(pipeLine)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Ticket.aggregate(pipeLine),
      ]);

      return {
        tickets,
        page_count:
          Math.ceil(totalTicketCount.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while list Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = inquiryService;
