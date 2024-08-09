const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, capitalizeFirstLetter } = require("../utils/utils");
const Section = require("../models/sectionSchema");
const colors = require("../messages/colorsCombinations.json");
const AuthService = require("../services/authService");
const Task = require("../models/taskSchema");
const authService = new AuthService();

class sectionService {
  // Add   Section
  addSection = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.sub_role !== "admin"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      const { board_id } = payload;

      const sections = await Section.find({
        board_id: board_id,
        section_name: new RegExp("^New Section"),
        sort_order: { $exists: true },
      }).lean();
      // Determine the next section name
      let next_section_number = 1;
      sections.forEach((section) => {
        const match = section.section_name.match(/^New Section (\d+)$/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number >= next_section_number) {
            next_section_number = number + 1;
          }
        }
      });

      const new_section_name = `New Section ${next_section_number}`;

      const get_random_color = async () => {
        try {
          // Get an array of color keys
          const color_keys = Object.keys(colors);

          let random_color_key;
          let is_color = false;

          do {
            // Select a random color key
            random_color_key =
              color_keys[Math.floor(Math.random() * color_keys.length)];

            // Check if the selected color combination exists in the database
            const is_color_exist = await Section.findOne({
              board_id: board_id,
              color: String(colors[random_color_key].color),
            }).lean();

            // If the color combination doesn't exist, set is_color to true to exit the loop
            if (!is_color_exist) {
              is_color = true;
            }
          } while (!is_color);
          // Return the selected color combination
          return colors[random_color_key];
        } catch (error) {
          console.error("Error occurred while fetching random color:", error);
          return null;
        }
      };

      const sections_list = await Section.find({
        board_id: board_id,
        sort_order: { $exists: true },
      }).sort({
        sort_order: -1,
      });

      if (sections_list && sections_list.length > 0) {
        for (const section of sections_list) {
          section.sort_order += 1;
          await section.save();
        }
      }

      const resolved_color = await get_random_color();
      await Section.create({
        section_name: new_section_name,
        board_id,
        sort_order: 1,
        color: resolved_color?.color,
        test_color: resolved_color?.test_color,
        is_deletable: true,
        workspace_id: user?.workspace,
      });

      return;
    } catch (error) {
      logger.error(`Error while section create, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update   Section
  updateSection = async (payload, section_data, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.sub_role !== "admin"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      const { section_name, board_id } = payload;
      const { section_id } = section_data;
      const is_exist = await Section.findOne({
        board_id: board_id,
        section_name: capitalizeFirstLetter(section_name),
        is_deleted: false,
      }).lean();

      if (is_exist) {
        return throwError(returnMessage("section", "nameAlreadyExists"));
      }

      await Section.findOneAndUpdate(
        { _id: section_id },
        {
          $set: {
            section_name: capitalizeFirstLetter(section_name),
          },
        }
      );

      return;
    } catch (error) {
      logger.error(`Error while update section, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All Sections
  getAllSections = async (payload) => {
    try {
      const { board_id } = payload;
      const sections = await Section.find({
        board_id: board_id,
        sort_order: { $exists: true },
        is_deleted: false,
      })
        .select("-is_deleted")
        .sort({ sort_order: 1 })
        .lean();

      const [completed_section, archived_section] = await Promise.all([
        Section.findOne({
          board_id: board_id,
          key: "completed",
        })
          .select("-is_deleted")
          .lean(),
        Section.findOne({
          board_id: board_id,
          key: "archived",
        })
          .select("-is_deleted")
          .lean(),
      ]);

      return [...sections, completed_section, archived_section];
    } catch (error) {
      logger.error(`Error while get all section, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET  Section
  getSection = async (payload) => {
    try {
      const { section_id } = payload;
      const section = await Section.findById(section_id).select("-is_deleted");
      return section;
    } catch (error) {
      logger.error(`Error while  get section, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Section

  deleteSection = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.sub_role !== "admin"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      const { section_id } = payload;

      const is_task_available = await Task.findOne({
        activity_status: section_id,
        is_deleted: false,
      }).lean();

      if (is_task_available) {
        return throwError(returnMessage("section", "canNotBeDeleted"));
      }
      await Section.findOneAndUpdate(
        { _id: section_id },
        { is_deleted: true },
        { new: true }
      );
      return true;
    } catch (error) {
      logger.error(`Error while Delete Section, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Section
  updateSectionOrder = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.sub_role !== "admin"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      const { sort_order, section_id, board_id } = payload;

      // Check if the section exists
      const sectionExists = await Section.findOne({
        board_id: board_id,
        _id: section_id,
      }).lean();

      if (!sectionExists) {
        return throwError(returnMessage("section", "sectionNotFound"));
      }

      // Get all sections sorted by sort_order
      const sections = await Section.find({
        board_id: board_id,
        sort_order: { $exists: true },
      }).sort({ sort_order: 1 });

      if (sections && sections.length > 0) {
        // Find the section to be updated and its current sort order
        const currentSection = sections.find(
          (section) => section._id.toString() === section_id
        );
        const currentSortOrder = currentSection.sort_order;

        // Update other sections' sort orders
        await Promise.all(
          sections.map(async (section) => {
            if (section._id.toString() !== section_id) {
              if (
                currentSortOrder < sort_order &&
                section.sort_order > currentSortOrder &&
                section.sort_order <= sort_order
              ) {
                // If the section is after the current section and before or equal to the new position, decrement its sort order
                await Section.findByIdAndUpdate(section._id, {
                  $inc: { sort_order: -1 },
                });
              } else if (
                currentSortOrder > sort_order &&
                section.sort_order < currentSortOrder &&
                section.sort_order >= sort_order
              ) {
                // If the section is before the current section and after or equal to the new position, increment its sort order
                await Section.findByIdAndUpdate(section._id, {
                  $inc: { sort_order: 1 },
                });
              }
            }
          })
        );

        // Finally, update the sort order of the moved section
        await Section.findByIdAndUpdate(section_id, {
          $set: {
            sort_order: sort_order,
          },
        });
      }

      return;
    } catch (error) {
      logger.error(`Error while updating order section, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = sectionService;
