const { protect } = require("../middlewares/authMiddleware");
const agreementRoute = require("express").Router();
const agreementController = require("../controllers/agreementController");
const agreementValidator = require("../validators/agreement.validator");
const validatorFunc = require("../utils/validatorFunction.helper");

agreementRoute.use(protect);
agreementRoute.get("/get-clients", agreementController.getClients);

// Agency Agreement API
agreementRoute.post(
  "/add-agreement",
  agreementValidator.addAgreementValidator,
  validatorFunc,
  agreementController.addAgreement
);
agreementRoute.post("/get-all-agreement", agreementController.getAllAgreement);
agreementRoute.get("/get-agreement/:id", agreementController.getAgreement);
agreementRoute.post("/delete-agreement", agreementController.deleteAgreement);
agreementRoute.put(
  "/update-agreement/:id",
  agreementValidator.updateAgreementValidator,
  validatorFunc,
  agreementController.updateAgreement
);
agreementRoute.post("/send-agreement", agreementController.sendAgreement);
agreementRoute.get("/download-pdf/:id", agreementController.downloadPdf);

// Client Agreement API

agreementRoute.put(
  "/update-agreement-status/:id",
  agreementController.updateAgreementStatus
);

module.exports = agreementRoute;
