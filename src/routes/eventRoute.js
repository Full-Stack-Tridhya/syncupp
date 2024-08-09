const eventRoute = require("express").Router();
const validatorFunc = require("../utils/validatorFunction.helper");
const eventController = require("../controllers/eventController");
const { protect } = require("../middlewares/authMiddleware");
eventRoute.use(protect);
eventRoute.post("/create-event", eventController.createEvent);
eventRoute.get("/fetch-event/:id", eventController.fetchEvent);
eventRoute.post("/event-list", eventController.eventList);
eventRoute.put("/update-event/:id", eventController.updateEvent);
eventRoute.put("/delete-event/:id", eventController.deleteEvent);

module.exports = eventRoute;
