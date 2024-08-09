const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const AdminTermAndCondition = require("../models/cms/admintermAndConditionSchema");

class TermAdnConditionService {
  // Add   TermAndCondition
  addTermAndCondition = async (payload) => {
    try {
      const TermAndCondition = await AdminTermAndCondition.create(payload);
      return TermAndCondition;
    } catch (error) {
      logger.error(`Error while add Term And Condition, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  getTermAndCondition = async () => {
    try {
      const termDetail = await AdminTermAndCondition.findOne({});
      return termDetail;
    } catch (error) {
      console.log(error);
      logger.error(`Error while get term and condition CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  updateTermAndCondition = async (payload) => {
    try {
      const { description } = payload;

      const TermAndCondition = await AdminTermAndCondition.findOne({});

      await AdminTermAndCondition.findOneAndUpdate(
        {
          _id: TermAndCondition._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );
      return true;
    } catch (error) {
      logger.error(`Error while add Term and Condition CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = TermAdnConditionService;
