const AdminFqa = require("../models/adminFaqSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, paginationObject } = require("../utils/utils");

class FaqService {
  // Add   FQA
  addFaq = async (payload) => {
    try {
      const faq = await AdminFqa.create(payload);
      return faq;
    } catch (error) {
      logger.error(`Error while Admin add FQA, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All FQA
  getAllFaq = async (searchObj) => {
    try {
      const queryObj = { is_deleted: false };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            title: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            description: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];

        // const keywordType = getKeywordType(searchObj.search);
        // if (keywordType === "number") {
        //   const numericKeyword = parseInt(searchObj.search);
        //   queryObj["$or"].push({
        //     contact_number: numericKeyword,
        //   });
        // }
      }

      const pagination = paginationObject(searchObj);

      const [faqs, totalFaqsCount] = await Promise.all([
        AdminFqa.find(queryObj)
          .select("title description")
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .lean(),
        AdminFqa.countDocuments(queryObj),
      ]);

      return {
        faqs,
        pagination: {
          current_page: pagination.page,
          total_pages: Math.ceil(totalFaqsCount / pagination.result_per_page),
        },
      };
    } catch (error) {
      logger.error(`Error while Admin FQA Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete FQA
  deleteFaq = async (payload) => {
    const { faqIdsToDelete } = payload;
    try {
      const deletedFaqs = await AdminFqa.updateMany(
        { _id: { $in: faqIdsToDelete } },
        { $set: { is_deleted: true } }
      );
      return deletedFaqs;
    } catch (error) {
      logger.error(`Error while Deleting FQA, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Add   FQA

  updateFaq = async (payload, faqId) => {
    try {
      const faq = await AdminFqa.findByIdAndUpdate(
        {
          _id: faqId,
        },
        payload,
        { new: true, useFindAndModify: false }
      );
      return faq;
    } catch (error) {
      logger.error(`Error while updating FQA, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
  // GET FQA

  getFaq = async (faqId) => {
    try {
      const faq = await AdminFqa.findById({
        _id: faqId,
        is_deleted: false,
      }).lean();
      return faq;
    } catch (error) {
      logger.error(`Error while Get FQA, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = FaqService;
