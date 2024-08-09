const sectionRoute = require("express").Router();
const sectionController = require("../controllers/sectionController");
const { protect } = require("../middlewares/authMiddleware");

sectionRoute.use(protect);

sectionRoute.post("/create-section", sectionController.addSection);
sectionRoute.put(
  "/update-section/:section_id",
  sectionController.updateSection
);
sectionRoute.get("/get-all/:board_id", sectionController.getAllSections);
sectionRoute.get("/:section_id", sectionController.getSection);
sectionRoute.delete("/:section_id", sectionController.deleteSection);
sectionRoute.put("/update-order", sectionController.updateSectionOrder);

module.exports = sectionRoute;
