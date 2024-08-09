const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.addCouponValidator = [
  body("brand")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired)
    .isLength({ max: 15 }) // specify the maximum length for the title
    .withMessage(validationMessage.coupon.brandMaxLength),
  body("couponCode")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired)
    .isLength({ max: 20 }) // specify the maximum length for the title
    .withMessage(validationMessage.coupon.brandMaxLength),
  body("discountTitle")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.descriptionRequired)
    .isLength({ max: 115 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.descriptionLength),
  body("siteURL")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired),
  body("brandLogo")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired)
    .isLength({ max: 15 }) // specify the maximum length for the title
    .withMessage(validationMessage.coupon.brandMaxLength),
];
exports.deleteCouponValidator = [
  body("couponIdsToDelete")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.couponIdsReq),
];
exports.updateCouponValidator = [
  body("brand")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired)
    .isLength({ max: 15 }) // specify the maximum length for the title
    .withMessage(validationMessage.coupon.brandMaxLength),
  body("couponCode")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired)
    .isLength({ max: 20 }) // specify the maximum length for the title
    .withMessage(validationMessage.coupon.brandMaxLength),
  body("discountTitle")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.descriptionRequired)
    .isLength({ max: 115 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.descriptionLength),
  body("siteURL")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired),
  body("brandLogo")
    .not()
    .isEmpty()
    .withMessage(validationMessage.coupon.titleRequired)
    .isLength({ max: 15 }) // specify the maximum length for the title
    .withMessage(validationMessage.coupon.brandMaxLength),
];
