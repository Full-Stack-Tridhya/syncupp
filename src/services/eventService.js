const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  paginationObject,
  getKeywordType,
  eventTemplate,
} = require("../utils/utils");
const sendEmail = require("../helpers/sendEmail");
const ActivityStatus = require("../models/masters/activityStatusMasterSchema");
const moment = require("moment");
const Event = require("../models/eventSchema");
const { default: mongoose } = require("mongoose");
const ActivityType = require("../models/masters/activityTypeMasterSchema");
const momentTimezone = require("moment-timezone");
class ScheduleEvent {
  //create event
  createEvent = async (payload, user) => {
    try {
      const {
        title,
        agenda,
        due_date,
        event_start_time,
        event_end_time,
        email,
        internal_info,
      } = payload;

      const current_date = moment.utc().startOf("day");
      const start_date = moment.utc(due_date, "DD-MM-YYYY").startOf("day");
      const start_time = moment.utc(
        `${due_date}-${event_start_time}`,
        "DD-MM-YYYY-HH:mm"
      );
      const end_time = moment.utc(
        `${due_date}-${event_end_time}`,
        "DD-MM-YYYY-HH:mm"
      );
      if (!start_date.isSameOrAfter(current_date))
        return throwError(returnMessage("event", "dateinvalid"));

      if (!end_time.isAfter(start_time))
        return throwError(returnMessage("event", "invalidTime"));
      let recurring_date;
      if (payload?.recurring_end_date) {
        recurring_date = moment
          .utc(payload?.recurring_end_date, "DD-MM-YYYY")
          .startOf("day");
        if (!recurring_date.isSameOrAfter(start_date))
          return throwError(returnMessage("event", "invalidRecurringDate"));
      }
      // this condition is used for the check if client or team member is assined to any same time event or not
      const or_condition = [
        {
          $and: [
            { event_start_time: { $gte: start_time } },
            { event_end_time: { $lte: end_time } },
          ],
        },
        {
          $and: [
            { event_start_time: { $lte: start_time } },
            { event_end_time: { $gte: end_time } },
          ],
        },
        {
          $and: [
            { event_start_time: { $gte: start_time } },
            { event_end_time: { $lte: end_time } },
            { due_date: { $gte: start_date } },
            { recurring_end_date: { $lte: recurring_date } },
          ],
        },
        {
          $and: [
            { event_start_time: { $lte: start_time } },
            { event_end_time: { $gte: end_time } },
            { due_date: { $gte: start_date } },
            { recurring_end_date: { $lte: recurring_date } },
          ],
        },
      ];

      let event_exist;
      if (
        user?.role?.name === "agency" ||
        user?.role?.name === "team_agency" ||
        user?.role?.name === "client" ||
        user?.role?.name === "team_client"
      ) {
        event_exist = await Event.findOne({
          $or: [
            { created_by: user?.reference_id },
            { email: { $in: payload?.email } },
          ],
          $and: or_condition,
          is_deleted: false,
        }).lean();
      }

      if (event_exist) {
        if (payload?.createEventIfEmailExists === "yes") {
          // If email exists and flag is set to "yes", create the event
          const newEvent = await Event.create({
            created_by: user?.reference_id,
            agenda,
            title,
            event_start_time: start_time,
            event_end_time: end_time,
            due_date: start_date,
            recurring_end_date: recurring_date,
            email,
            internal_info,
          });
          let data = {
            EventTitle: "New Event Created",
            EventName: title,
            created_by: user.first_name + " " + user.last_name,
            start_date: moment(due_date)?.format("DD/MM/YYYY"),
            startTime: momentTimezone(start_time, "HH:mm")
              .tz("Asia/Kolkata")
              .format("HH:mm"),
            endTime: momentTimezone(end_time, "HH:mm")
              .tz("Asia/Kolkata")
              .format("HH:mm"),
            agenda: agenda,
            recurring_end_date: payload?.recurring_end_date,
            action_type: "Created By",
          };
          email &&
            email.map((item) => {
              const eventMessage = eventTemplate(data);
              sendEmail({
                email: item,
                subject: returnMessage("event", "createSubject"),
                message: eventMessage,
              });
            });

          return newEvent;
        } else {
          // If email exists and flag is not set to "yes", return error
          return {
            event_exist: true, // Conflict status code
            message: returnMessage("event", "eventScheduledForTeam"),
          };
        }
      } else {
        // If email does not exist, create the event
        const newEvent = await Event.create({
          created_by: user?.reference_id,
          agenda,
          title,
          event_start_time: start_time,
          event_end_time: end_time,
          due_date: start_date,
          recurring_end_date: recurring_date,
          email,
          internal_info,
        });
        let data = {
          EventTitle: "New Event Created",
          EventName: title,
          created_by: user.first_name + " " + user.last_name,
          start_date: due_date,
          startTime: momentTimezone(start_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          endTime: momentTimezone(end_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          agenda: agenda,
          recurring_end_date: payload?.recurring_end_date,
          action_type: "Created By",
        };
        email &&
          email.map((item) => {
            const eventMessage = eventTemplate(data);
            sendEmail({
              email: item,
              subject: returnMessage("event", "createSubject"),
              message: eventMessage,
            });
          });

        return newEvent;
      }
    } catch (error) {
      logger.error(`Error while creating event, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
  //fetch event with id
  fetchEvent = async (id) => {
    try {
      const eventPipeline = [
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "reference_id",
            as: "agency_Data",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  agency_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$agency_Data", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "activity_status_masters",
            localField: "status",
            foreignField: "_id",
            as: "activity_status",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: {
            path: "$activity_status",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            is_deleted: false,
          },
        },
        {
          $project: {
            contact_number: 1,
            title: 1,
            due_time: 1,
            due_date: 1,
            createdAt: 1,
            agenda: 1,
            event_start_time: 1,
            event_end_time: 1,
            recurring_end_date: 1,
            internal_info: 1,
            email: 1,
            status: "$activity_status.name",
          },
        },
      ];

      const result = await Event.aggregate(eventPipeline);
      return result;
    } catch (error) {
      logger.error(`Error while fetching  event, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
  //event list with filter
  eventList = async (payload, user) => {
    try {
      if (!payload?.pagination) {
        return await this.eventListWithOutPaination(payload, user);
      }
      let filterObj = {
        is_deleted: false,
        $or: [
          { created_by: user?.reference_id }, // Match based on created_by id

          { email: { $regex: new RegExp(user?.email, "i") } },
          // Optionally match based on user's email
        ],
      };
      let queryObj = {};

      const filter = {
        $match: {},
      };
      if (payload?.filter) {
        if (payload?.filter?.date === "today") {
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $eq: new Date(moment.utc().startOf("day")) },
          };
        } else if (payload?.filter?.date === "tomorrow") {
          filter["$match"] = {
            ...filter["$match"],
            due_date: {
              $eq: new Date(moment.utc().add(1, "day").startOf("day")),
            },
          };
        } else if (payload?.filter?.date === "this_week") {
          filter["$match"] = {
            ...filter["$match"],
            $and: [
              {
                due_date: { $gte: new Date(moment.utc().startOf("week")) },
              },
              {
                due_date: { $lte: new Date(moment.utc().endOf("week")) },
              },
            ],
          };
        } else if (payload?.filter?.date === "period") {
          // need the start and end date to fetch the data between 2 dates

          if (
            !(payload?.filter?.start_date && payload?.filter?.end_date) &&
            payload?.filter?.start_date !== "" &&
            payload?.filter?.end_date !== ""
          )
            return throwError(
              returnMessage("activity", "startEnddateRequired")
            );

          const start_date = moment
            .utc(payload?.filter?.start_date, "DD-MM-YYYY")
            .startOf("day");
          const end_date = moment
            .utc(payload?.filter?.end_date, "DD-MM-YYYY")
            .endOf("day");

          if (end_date.isBefore(start_date))
            return throwError(returnMessage("activity", "invalidDate"));

          filter["$match"] = {
            ...filter["$match"],
            $or: [
              {
                $and: [
                  { due_date: { $gte: new Date(start_date) } },
                  { due_date: { $lte: new Date(end_date) } },
                ],
              },
              {
                $and: [
                  { due_date: { $gte: new Date(start_date) } },
                  { recurring_end_date: { $lte: new Date(end_date) } },
                ],
              },
            ],
          };
        }
        if (
          payload?.filter?.activity_type &&
          payload?.filter?.activity_type !== ""
        ) {
          const activity_type = await ActivityType.findOne({
            name: payload?.filter?.activity_type,
          })
            .select("_id")
            .lean();

          if (!activity_type)
            return throwError(
              returnMessage("activity", "activityTypeNotFound"),
              statusCode.notFound
            );

          filter["$match"] = {
            ...filter["$match"],
            activity_type: activity_type?._id,
          };
        }
      }

      if (payload?.search && payload?.search !== "") {
        queryObj["$or"] = [
          {
            title: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },

          {
            agenda: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            email: {
              $elemMatch: {
                $regex: payload.search.toLowerCase(),
                $options: "i",
              },
            },
          },
        ];

        const keywordType = getKeywordType(payload.search);
        if (keywordType === "number") {
          const numericKeyword = parseInt(payload.search);

          queryObj["$or"].push({
            revenue_made: numericKeyword,
          });
        } else if (keywordType === "date") {
          const dateKeyword = new Date(payload.search);
          queryObj["$or"].push({ due_date: dateKeyword });
          queryObj["$or"].push({ due_time: dateKeyword });
          queryObj["$or"].push({ event_start_time: dateKeyword });
          queryObj["$or"].push({ event_end_time: dateKeyword });
          queryObj["$or"].push({ recurring_end_date: dateKeyword });
        }
      }
      const pagination = paginationObject(payload);

      const eventPipeline = [
        filter,
        { $match: filterObj },
        {
          $match: queryObj,
        },
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "reference_id",
            as: "agency_Data",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  agency_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$agency_Data", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            contact_number: 1,
            title: 1,
            due_time: 1,
            due_date: 1,
            createdAt: 1,
            agenda: 1,
            // agency_name: "$agency_Data.agency_name",
            event_start_time: 1,
            event_end_time: 1,
            recurring_end_date: 1,
            email: 1,
            created_by: 1,
          },
        },
      ];
      const event = await Event.aggregate(eventPipeline)
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.result_per_page);

      const totalEventCount = await Event.aggregate(eventPipeline);

      // Calculating total pages
      const pages = Math.ceil(
        totalEventCount.length / pagination.result_per_page
      );

      return {
        event,
        page_count: pages,
      };
    } catch (error) {
      logger.error(`Error while fetching  event, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  eventListWithOutPaination = async (payload, user) => {
    try {
      let queryObj = {
        is_deleted: false,
        $or: [
          { created_by: user?.reference_id }, // Match based on created_by id
          { email: user?.email }, // Optionally match based on user's email
        ],
      };

      const filter = {
        $match: {},
      };
      if (payload?.filter) {
        if (payload?.filter?.date === "today") {
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $eq: new Date(moment.utc().startOf("day")) },
          };
        } else if (payload?.filter?.date === "tomorrow") {
          filter["$match"] = {
            ...filter["$match"],
            due_date: {
              $eq: new Date(moment.utc().add(1, "day").startOf("day")),
            },
          };
        } else if (payload?.filter?.date === "this_week") {
          filter["$match"] = {
            ...filter["$match"],
            $and: [
              {
                due_date: { $gte: new Date(moment.utc().startOf("week")) },
              },
              {
                due_date: { $lte: new Date(moment.utc().endOf("week")) },
              },
            ],
          };
        } else if (payload?.filter?.date === "period") {
          // need the start and end date to fetch the data between 2 dates

          if (
            !(payload?.filter?.start_date && payload?.filter?.end_date) &&
            payload?.filter?.start_date !== "" &&
            payload?.filter?.end_date !== ""
          )
            return throwError(
              returnMessage("activity", "startEnddateRequired")
            );

          const start_date = moment
            .utc(payload?.filter?.start_date, "DD-MM-YYYY")
            .startOf("day");
          const end_date = moment
            .utc(payload?.filter?.end_date, "DD-MM-YYYY")
            .endOf("day");

          if (end_date.isBefore(start_date))
            return throwError(returnMessage("activity", "invalidDate"));

          filter["$match"] = {
            ...filter["$match"],
            $or: [
              {
                $or: [
                  { due_date: { $gte: new Date(start_date) } },
                  { due_date: { $lte: new Date(end_date) } },
                ],
              },
              {
                $and: [
                  { due_date: { $gte: new Date(start_date) } },
                  { recurring_end_date: { $lte: new Date(end_date) } },
                ],
              },
            ],
          };
        }
      }

      const eventPipeline = [
        filter,
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "reference_id",
            as: "agency_Data",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  agency_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$agency_Data", preserveNullAndEmptyArrays: true },
        },

        { $match: queryObj },
        {
          $project: {
            contact_number: 1,
            title: 1,
            due_time: 1,
            due_date: 1,
            createdAt: 1,
            agenda: 1,
            agency_name: "$agency_Data.agency_name",
            event_start_time: 1,
            event_end_time: 1,
            recurring_end_date: 1,
          },
        },
      ];
      return await Event.aggregate(eventPipeline);
    } catch (error) {
      logger.error(`Error while fetching  event, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
  // update event
  updateEvent = async (eventId, payload, user) => {
    try {
      const {
        title,
        agenda,
        due_date,
        event_start_time,
        event_end_time,
        email,
        internal_info,
      } = payload;

      const current_date = moment.utc().startOf("day");
      const start_date = moment.utc(due_date, "DD-MM-YYYY").startOf("day");
      const start_time = moment.utc(
        `${due_date}-${event_start_time}`,
        "DD-MM-YYYY-HH:mm"
      );
      const end_time = moment.utc(
        `${due_date}-${event_end_time}`,
        "DD-MM-YYYY-HH:mm"
      );

      if (!start_date.isSameOrAfter(current_date))
        return throwError(returnMessage("event", "dateinvalid"));

      if (!end_time.isAfter(start_time))
        return throwError(returnMessage("event", "invalidTime"));

      let recurring_date;
      if (payload?.recurring_end_date) {
        recurring_date = moment
          .utc(payload?.recurring_end_date, "DD-MM-YYYY")
          .startOf("day");
        if (!recurring_date.isSameOrAfter(start_date))
          return throwError(returnMessage("event", "invalidRecurringDate"));
      } else {
        recurring_date = null;
      }

      const or_condition = [
        {
          $and: [
            { event_start_time: { $gte: start_time } },
            { event_end_time: { $lte: end_time } },
          ],
        },
        {
          $and: [
            { event_start_time: { $lte: start_time } },
            { event_end_time: { $gte: end_time } },
          ],
        },
        {
          $and: [
            { event_start_time: { $gte: start_time } },
            { event_end_time: { $lte: end_time } },
            { due_date: { $gte: start_date } },
            { recurring_end_date: { $lte: recurring_date } },
          ],
        },
        {
          $and: [
            { event_start_time: { $lte: start_time } },
            { event_end_time: { $gte: end_time } },
            { due_date: { $gte: start_date } },
            { recurring_end_date: { $lte: recurring_date } },
          ],
        },
      ];
      let event_exist;

      if (
        user?.role?.name === "agency" ||
        user?.role?.name === "team_agency" ||
        user?.role?.name === "client" ||
        user?.role?.name === "team_client"
      ) {
        event_exist = await Event.findOne({
          _id: { $ne: eventId },
          $or: [
            { created_by: user?.reference_id },
            { email: { $in: payload.email } },
          ],
          $and: or_condition,
          is_deleted: false,
        }).lean();
      }
      if (event_exist) {
        if (
          // email === event_exist.email &&
          payload.createEventIfEmailExists === "yes"
        ) {
          // If email exists and flag is set to "yes", create the event
          const updatedEvent = await Event.findByIdAndUpdate(eventId, {
            agenda,
            title,
            event_start_time: start_time,
            event_end_time: end_time,
            due_date: start_date,
            recurring_end_date: recurring_date,
            email,
            internal_info,
          });
          let getEvent = await Event.findById(eventId).lean();
          let data = {
            EventTitle: "Updated Event ",
            EventName: getEvent?.title,
            created_by: user.first_name + " " + user.last_name,
            start_date: moment(getEvent?.due_date)?.format("DD/MM/YYYY"),
            startTime: momentTimezone(start_time, "HH:mm")
              .tz("Asia/Kolkata")
              .format("HH:mm"),
            endTime: momentTimezone(end_time, "HH:mm")
              .tz("Asia/Kolkata")
              .format("HH:mm"),
            agenda: getEvent?.agenda,
            recurring_end_date: moment(getEvent?.recurring_end_date)?.format(
              "DD/MM/YYYY"
            ),
            action_type: "Updated By",
          };
          email &&
            email.map((item) => {
              const eventMessage = eventTemplate(data);
              sendEmail({
                email: item,
                subject: returnMessage("event", "updateSubject"),
                message: eventMessage,
              });
            });

          return updatedEvent;
        } else {
          // If email exists and flag is not set to "yes", return error
          return {
            event_exist: true, // Conflict status code
            message: returnMessage("event", "eventScheduledForTeam"),
          };
        }
      } else {
        // If email exists and flag is set to "yes", create the event
        const updatedEvent = await Event.findByIdAndUpdate(eventId, {
          agenda,
          title,
          event_start_time: start_time,
          event_end_time: end_time,
          due_date: start_date,
          recurring_end_date: recurring_date,
          email,
          internal_info,
        });
        let getEvent = await Event.findById(eventId);
        let data = {
          EventTitle: "New Event Updated",
          EventName: getEvent?.title,
          created_by: user.first_name + " " + user.last_name,
          start_date: moment(getEvent?.due_date)?.format("DD/MM/YYYY"),
          startTime: momentTimezone(start_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          endTime: momentTimezone(end_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          agenda: getEvent?.agenda,
          recurring_end_date: moment(getEvent?.recurring_end_date)?.format(
            "DD/MM/YYYY"
          ),
          action_type: "Updated By",
        };
        email &&
          email.map((item) => {
            const eventMessage = eventTemplate(data);
            sendEmail({
              email: item,
              subject: returnMessage("event", "updateSubject"),
              message: eventMessage,
            });
          });
        return updatedEvent;
      }
    } catch (error) {
      logger.error(`Error while updating event, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  deleteEvent = async (id, user) => {
    try {
      const updateevent = await Event.findByIdAndUpdate(
        {
          _id: id,
        },
        {
          is_deleted: true,
        },
        { new: true, useFindAndModify: false }
      );
      let getEvent = await Event.findById(id);
      let data = {
        EventTitle: "Event Cancled",
        EventName: getEvent?.title,
        created_by: user?.first_name + " " + user?.last_name,
        start_date: moment(getEvent?.due_date)?.format("DD/MM/YYYY"),
        startTime: momentTimezone(getEvent?.event_start_time, "HH:mm")
          .tz("Asia/Kolkata")
          .format("HH:mm"),
        endTime: momentTimezone(getEvent?.event_end_time, "HH:mm")
          .tz("Asia/Kolkata")
          .format("HH:mm"),
        agenda: getEvent?.agenda,
        recurring_end_date: moment(getEvent?.recurring_end_date)?.format(
          "DD/MM/YYYY"
        ),
        action_type: "Deleted By",
      };
      getEvent?.email &&
        getEvent?.email.map((item) => {
          const eventMessage = eventTemplate(data);
          sendEmail({
            email: item,
            subject: returnMessage("event", "cancleSubject"),
            message: eventMessage,
          });
        });
      return updateevent;
    } catch (error) {
      logger.error(`Error while deleting, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = ScheduleEvent;
