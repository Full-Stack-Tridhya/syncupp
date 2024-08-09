const settingRoute = require("express").Router();
const invoiceController = require("../controllers/invoiceController");
const { checkFileSize, upload } = require("../helpers/multer");
const { protect } = require("../middlewares/authMiddleware");

settingRoute.use(protect);

settingRoute.post(
  "/upload-logo",
  checkFileSize,
  upload.single("invoice_logo"),
  invoiceController.uploadLogo
);
settingRoute.get("/get-setting", invoiceController.getSetting);

module.exports = settingRoute;
