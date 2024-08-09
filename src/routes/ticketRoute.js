const ticketRoute = require("express").Router();
const ticketController = require("../controllers/inquiryController");
const { protect } = require("../middlewares/authAdminMiddleware");

ticketRoute.post("/send-ticket", ticketController.addTicket);

ticketRoute.use(protect);

ticketRoute.post("/get-all", ticketController.getAllTicket);

module.exports = ticketRoute;
