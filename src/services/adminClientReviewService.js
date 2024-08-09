const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { paginationObject } = require("../utils/utils");
const AdminClientReview = require("../models/adminClientReviewSchema");

class ClientReviewService {
  // Add   Client Review
  addClientReview = async (payload, files) => {
    try {
      const { customer_name, company_name, review } = payload;
      let clientImageFileName;
      if (files?.fieldname === "client_review_image") {
        clientImageFileName = "uploads/" + files?.filename;
      }
      const clientReview = new AdminClientReview({
        customer_name,
        company_name,
        review,
        client_review_image: clientImageFileName,
      });

      return clientReview.save();
    } catch (error) {
      logger.error(`Error while Admin add Client Review, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All Client Review
  getAllClientReview = async (searchObj) => {
    try {
      const queryObj = { is_deleted: false };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            customer_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            company_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            review: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }

      const pagination = paginationObject(searchObj);

      const [ClientReviews, totalClientReviewsCount] = await Promise.all([
        AdminClientReview.find(queryObj)
          .select("customer_name company_name review client_review_image")
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .lean(),
        AdminClientReview.countDocuments(queryObj),
      ]);

      return {
        ClientReviews,
        pagination: {
          current_page: pagination.page,
          total_pages: Math.ceil(
            totalClientReviewsCount / pagination.result_per_page
          ),
        },
      };
    } catch (error) {
      logger.error(`Error while Admin Client Review Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Client Review
  deleteClientReview = async (payload) => {
    const { clientReviewIdsToDelete } = payload;
    try {
      const deletedClientReviews = await AdminClientReview.updateMany(
        { _id: { $in: clientReviewIdsToDelete } },
        { $set: { is_deleted: true } }
      );
      return deletedClientReviews;
    } catch (error) {
      logger.error(`Error while Deleting Client Review, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update   Client Review
  updateClientReview = async (payload, clientReviewId, files) => {
    try {
      if (files?.fieldname === "client_review_image") {
        payload.client_review_image = "uploads/" + files?.filename;
      }
      const { customer_name, company_name, review, client_review_image } =
        payload;
      return await AdminClientReview.findByIdAndUpdate(
        {
          _id: clientReviewId,
        },
        { customer_name, company_name, review, client_review_image },
        { new: true, useFindAndModify: false }
      );
    } catch (error) {
      logger.error(`Error while updating  Client Review, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET Client Review BY ID
  getClientReviewByID = async (clientReviewId) => {
    try {
      const clientReview = await AdminClientReview.findById({
        _id: clientReviewId,
        is_deleted: false,
      }).lean();
      return clientReview;
    } catch (error) {
      logger.error(`Error while Get Client Review, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = ClientReviewService;
