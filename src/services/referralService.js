const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const Configuration = require("../models/configurationSchema");
const Authentication = require("../models/authenticationSchema");
const ReferralHistory = require("../models/referralHistorySchema");
const Gamification = require("../models/gamificationSchema");

class ReferralClass {
  checkReferralAvailable = async (user) => {
    try {
      let [config, user_data] = await Promise.all([
        Configuration.findOne().lean(),
        Authentication.findById(user._id).lean(),
      ]);
      const referralAvailable =
        user_data.total_referral_point >= config.referral.redeem_required_point;

      return { referralAvailable };
    } catch (error) {
      logger.error(`Error while checking referral available: ${error}`);
      throw new Error(error?.message); // Throw error instead of returning it
    }
  };

  referralStatistics = async (user) => {
    try {
      const [referral_points_history, successful_signups] = await Promise.all([
        Gamification.find({
          agency_id: user?._id,
          type: "referral",
        }).lean(),
        ReferralHistory.countDocuments({
          referred_by: user?._id,
          registered: true,
        }),
      ]);

      // Use reducer to sum up the points
      const total_points = referral_points_history.reduce(
        (accumulator, currentValue) => {
          // Remove the "+" sign and convert the string to a number
          const points = parseInt(currentValue.point);
          return accumulator + points;
        },
        0
      );
      return {
        successful_signups,
        erned_points: total_points,
      };
    } catch (error) {
      logger.error(
        `Error while getting the referral statistcs for the agency: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = ReferralClass;
