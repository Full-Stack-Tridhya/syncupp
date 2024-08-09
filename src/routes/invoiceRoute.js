const { protect, authorizeRole } = require("../middlewares/authMiddleware");
const invoiceRoute = require("express").Router();
const invoiceController = require("../controllers/invoiceController");
const { validateCreateInvoice } = require("../validators/invoice.validator");
const validatorFunc = require("../utils/validatorFunction.helper");
const { checkProfileSize, upload } = require("../helpers/multer");

invoiceRoute.post("/add-currency", invoiceController.addCurrency);
invoiceRoute.get("/currency", invoiceController.currencyList);

invoiceRoute.use(protect);

invoiceRoute.get("/get-clients", invoiceController.getClients);
// invoiceRoute.post("/get-invoice-data", invoiceController.getInvoiceInformation);
invoiceRoute.post(
  "/create-invoice",
  checkProfileSize,
  upload.single("invoice_logo"),
  validateCreateInvoice,
  validatorFunc,
  invoiceController.addInvoice
);
invoiceRoute.put(
  "/:id",
  checkProfileSize,
  upload.single("invoice_logo"),
  invoiceController.updateInvoice
);
invoiceRoute.post("/get-all", invoiceController.getAllInvoice);
invoiceRoute.get("/:id", invoiceController.getInvoice);
invoiceRoute.delete("/delete-invoice", invoiceController.deleteInvoice);

invoiceRoute.put("/status-update/:id", invoiceController.updateStatusInvoice);
invoiceRoute.post("/send-invoice", invoiceController.sendInvoice);
invoiceRoute.get(
  "/download-invoice/:invoice_id",
  invoiceController.downloadPdf
);
invoiceRoute.post(
  "/upload-logo",
  checkProfileSize,
  upload.single("invoice_logo"),
  invoiceController.uploadLogo
);

module.exports = invoiceRoute;
