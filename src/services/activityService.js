const Activity = require("../models/activitySchema");
const ActivityStatus = require("../models/masters/activityStatusMasterSchema");
const ActivityType = require("../models/masters/activityTypeMasterSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  paginationObject,
  getKeywordType,
  validateRequestFields,
  taskTemplate,
  activityTemplate,
  capitalizeFirstLetter,
  templateMaker,
  extractTextFromHtml,
} = require("../utils/utils");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const Team_Agency = require("../models/teamAgencySchema");
const statusCode = require("../messages/statusCodes.json");
const sendEmail = require("../helpers/sendEmail");
const Authentication = require("../models/authenticationSchema");
const NotificationService = require("./notificationService");
const notificationService = new NotificationService();
const ics = require("ics");
const momentTimezone = require("moment-timezone");
const Section = require("../models/sectionSchema");
const AuthService = require("../services/authService");
const Gamification = require("../models/gamificationSchema");
const authService = new AuthService();
require("dotenv").config();
const { google } = require("googleapis");
const Configuration = require("../models/configurationSchema");

class ActivityService {
  // this function is used to create the call meeting and other call details
  createCallMeeting = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;
      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.user_role !== "team_agency"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      validateRequestFields(payload, [
        "title",
        "meeting_date",
        "meeting_start_time",
        "meeting_end_time",
      ]);

      if (payload.all_day) {
        payload.meeting_start_time = "18.30";
        payload.meeting_end_time = "18.29";
      }

      const {
        title,
        agenda,
        meeting_date,
        meeting_start_time,
        meeting_end_time,
        internal_info,
        attendees,
        all_day,
        alert_time,
        alert_time_unit,
        recurrence_pattern,
        recurrence_interval,
        weekly_recurrence_days,
        monthly_recurrence_day_of_month,
        token,
      } = payload;

      let google_meet_link;

      if (payload?.google_meeting) {
        google_meet_link = await this.createCallGoogleMeeting(payload);
      }

      let recurring_date;
      const current_date = moment.utc();
      const start_date = moment.utc(meeting_date, "DD-MM-YYYY").startOf("day");
      let start_time;
      let end_time;
      start_time = moment.utc(
        `${meeting_date}-${meeting_start_time}`,
        "DD-MM-YYYY-HH:mm"
      );

      end_time = moment.utc(
        `${meeting_date}-${meeting_end_time}`,
        "DD-MM-YYYY-HH:mm"
      );

      let original_start_time = moment.utc(start_time);
      let original_end_time = moment.utc(end_time);

      // Get the date part separately
      let datePart = original_start_time.format("YYYY-MM-DD");

      // Add 5 hours and 30 minutes to the time part
      let new_start_time = original_start_time
        .clone()
        .add(5, "hours")
        .add(30, "minutes")
        .format("HH:mm:ss");
      // Add 5 hours and 30 minutes to the time part
      let new_end_time = original_end_time
        .clone()
        .add(5, "hours")
        .add(30, "minutes")
        .format("HH:mm:ss");

      // Combine the date and time parts
      let converted_start_date = moment.utc(`${datePart}T${new_start_time}Z`);
      let converted_end_date = moment.utc(`${datePart}T${new_end_time}Z`);

      if (!converted_start_date.isSameOrAfter(current_date) && !all_day)
        return throwError(returnMessage("activity", "dateinvalid"));
      if (!converted_end_date.isAfter(converted_start_date))
        return throwError(returnMessage("activity", "invalidTime"));

      if (!payload?.all_day) {
        // Adjust start_time if meeting starts after 18:30 and at or before 23:59
        if (
          (start_time.hour() > 18 ||
            (start_time.hour() === 18 && start_time.minute() >= 30)) &&
          (start_time.hour() < 23 ||
            (start_time.hour() === 23 && start_time.minute() <= 59))
        ) {
          start_time.subtract(1, "day");
        }

        // Adjust end_time if meeting ends after 18:30 and at or before 23:59
        if (
          (end_time.hour() > 18 ||
            (end_time.hour() === 18 && end_time.minute() > 30)) &&
          (end_time.hour() < 23 ||
            (end_time.hour() === 23 && end_time.minute() <= 59))
        ) {
          end_time.subtract(1, "day");
        }
      } else {
        start_time = moment
          .utc(`${meeting_date}-${meeting_start_time}`, "DD-MM-YYYY-HH:mm")
          .subtract(1, "day");

        end_time = moment.utc(
          `${meeting_date}-${meeting_end_time}`,
          "DD-MM-YYYY-HH:mm"
        );
      }

      if (payload?.recurrence_end_date) {
        recurring_date = moment
          .utc(payload?.recurrence_end_date, "DD-MM-YYYY")
          .startOf("day");
        if (!recurring_date.isSameOrAfter(start_date))
          return throwError(returnMessage("activity", "invalidRecurringDate"));
      }

      const status = await ActivityStatus.findOne({ name: "pending" }).lean();

      payload.attendees?.push(user?._id.toString());
      payload.attendees = [
        ...new Set(payload?.attendees?.map((attendee) => attendee.toString())),
      ].map((attendee) => new mongoose.Types.ObjectId(attendee));

      const create_data = {
        activity_status: status?._id,
        created_by: user?._id,
        agenda,
        title,
        internal_info,
        meeting_start_time: start_time,
        meeting_end_time: end_time,
        meeting_date: start_date,
        recurrence_end_date: recurring_date,
        attendees: payload?.attendees,
        workspace_id: user?.workspace,
        all_day,
        alert_time,
        alert_time_unit,
        ...(google_meet_link && { google_meeting_data: google_meet_link }),
        recurrence_pattern,
        recurrence_interval,
        weekly_recurrence_days,
        monthly_recurrence_day_of_month,
        access_token: payload?.access_token,
        refresh_token: payload?.refresh_token,
      };

      const newActivity = await Activity.create(create_data);

      const event = {
        start: [
          moment(start_date).year(),
          moment(start_date).month() + 1, // Months are zero-based in JavaScript Date objects
          moment(start_date).date(),
          moment(payload.meeting_start_time, "HH:mm").hour(), // Use .hour() to get the hour as a number
          moment(payload.meeting_start_time, "HH:mm").minute(),
        ],
        end: [
          moment(recurring_date).year(),
          moment(recurring_date).month() + 1, // Months are zero-based in JavaScript Date objects
          moment(recurring_date).date(),
          moment(payload.meeting_end_time, "HH:mm").hour(), // Use .hour() to get the hour as a number
          moment(payload.meeting_end_time, "HH:mm").minute(),
        ],

        title: title,
        description: agenda,
        // Other optional properties can be added here such as attendees, etc.
      };

      const file = await new Promise((resolve, reject) => {
        const filename = "ExampleEvent.ics";
        ics.createEvent(event, (error, value) => {
          if (error) {
            reject(error);
          }

          resolve(value, filename, { type: "text/calendar" });
        });
      });

      // --------------- Start--------------------
      const [attendees_data, configuration] = await Promise.all([
        Authentication.find({
          _id: { $in: attendees },
        }).lean(),
        Configuration.findOne({}).lean(),
      ]);

      const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/meetings`;
      const activity_email_template = templateMaker("activityTemplate.html", {
        ...payload,
        status: "pending",
        assigned_by_name: user.first_name + " " + user.last_name,
        google_meet_link: google_meet_link?.meet_link ?? "-",
        agenda: payload?.agenda ? extractTextFromHtml(payload?.agenda) : "-",
        meeting_start_time: momentTimezone
          .utc(meeting_start_time, "HH:mm")
          .tz("Asia/Kolkata")
          .format("HH:mm"),
        meeting_end_time: momentTimezone
          .utc(meeting_end_time, "HH:mm")
          .tz("Asia/Kolkata")
          .format("HH:mm"),
        REACT_APP_URL: process.env.REACT_APP_URL,
        SERVER_URL: process.env.SERVER_URL,
        link: link,
        instagram: configuration?.urls?.instagram,
        facebook: configuration?.urls?.facebook,
        privacy_policy: configuration?.urls?.privacy_policy,
        recurrence_end_date: payload?.recurrence_end_date ?? "-",
        year: new Date().getFullYear(),
      });

      attendees_data &&
        attendees_data[0] &&
        attendees_data.map((item) => {
          sendEmail({
            email: item?.email,
            subject: returnMessage("emailTemplate", "newActivityMeeting"),
            message: activity_email_template,
            icsContent: file,
          });
        });
      await notificationService.addNotification(
        {
          assign_by: user?._id,
          assigned_by_name: user?.first_name + " " + user?.last_name,
          ...payload,
          module_name: "activity",
          activity_type_action: "create_call_meeting",
          workspace_id: user?.workspace,
          status: "pending",
          meeting_start_time: momentTimezone
            .utc(meeting_start_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          meeting_end_time: momentTimezone
            .utc(meeting_end_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
        },
        newActivity?._id
      );
      // ---------------- End ---------------

      return;
    } catch (error) {
      logger.error(`Error while creating call meeting and other: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  activityStatus = async () => {
    try {
      return await ActivityStatus.find({});
    } catch (error) {
      logger.error(`Error while activity status list : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getActivityById = async (id, user) => {
    const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
    user["role"] = user_role_data?.user_role;
    user["sub_role"] = user_role_data?.sub_role;

    const is_attendees = await Activity.findOne({
      _id: id,
      $or: [{ created_by: user?._id }, { attendees: user?._id }],
    }).lean();
    if (!is_attendees && user_role_data?.user_role !== "agency") {
      return throwError(returnMessage("activity", "activityNotAvailable"));
    }

    try {
      const taskPipeline = [
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "attendees",
            foreignField: "_id",
            as: "attendeesData",
            pipeline: [
              {
                $project: {
                  email: 1,
                  _id: 1,
                  profile_image: 1,
                  first_name: 1,
                  last_name: 1,
                  attendees_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "activity_status_masters",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            is_deleted: false,
          },
        },
        {
          $project: {
            title: 1,
            due_time: 1,
            meeting_date: 1,
            createdAt: 1,
            status: "$status.name",
            agenda: 1,
            assigned_by_name: "$created_by.name",
            assigned_by_first_name: "$created_by.first_name",
            assigned_by_last_name: "$created_by.last_name",
            assigned_by_name: {
              $concat: ["$created_by.first_name", " ", "$created_by.last_name"],
            },
            meeting_start_time: 1,
            meeting_end_time: 1,
            attendees: "$attendeesData",
            internal_info: 1,
            all_day: 1,
            google_meeting_data: 1,
            alert_time_unit: 1,
            alert_time: 1,
            recurrence_pattern: 1,
            recurrence_interval: 1,
            weekly_recurrence_days: 1,
            monthly_recurrence_day_of_month: 1,
            recurrence_end_date: 1,
            google_meeting_data: 1,
          },
        },
      ];
      const activity = await Activity.aggregate(taskPipeline);

      return activity;
    } catch (error) {
      logger.error(`Error while fetching data: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  statusUpdate = async (payload, id, user) => {
    try {
      const { status } = payload;
      let update_status;
      if (status === "completed") {
        update_status = await ActivityStatus.findOne({
          name: "completed",
        }).lean();
      } else if (status === "pending") {
        update_status = await ActivityStatus.findOne({
          name: "pending",
        }).lean();
      } else if (status === "cancel") {
        update_status = await ActivityStatus.findOne({
          name: "cancel",
        }).lean();
      }
      const get_activity = await Activity.findById(id).lean();

      if (status === "cancel" && get_activity?.google_meeting_data?.meet_link) {
        await this.deleteGoogleMeeting({
          ...payload,
          activity_id: id,
        });
      }

      const updateTasks = await Activity.findByIdAndUpdate(
        {
          _id: id,
        },
        {
          activity_status: update_status._id,
        },
        { new: true, useFindAndModify: false }
      );

      const pipeline = [
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true },
        },

        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            is_deleted: false,
          },
        },
        {
          $project: {
            agenda: 1,
            assigned_first_name: "$created_by.first_name",
            assigned_last_name: "$created_by.last_name",
            assigned_by_name: "$created_by.assigned_by_name",
            column_id: "$status.name",
            meeting_date: 1,
            due_time: 1,
            title: 1,
            meeting_start_time: 1,
            meeting_end_time: 1,
            recurrence_end_date: 1,
            created_by: 1,
            attendees: 1,
            google_meeting_data: 1,
          },
        },
      ];

      const getTask = await Activity.aggregate(pipeline);

      const [attendees_data, configuration] = await Promise.all([
        Authentication.find({
          _id: { $in: getTask[0]?.attendees },
        }).lean(),
        Configuration.findOne({}).lean(),
      ]);

      const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/meetings`;

      let task_status;
      let emailTempKey;
      if (payload.status == "cancel") {
        task_status = "cancel";
        emailTempKey = "meetingCancelled";
      }
      if (payload.status == "completed") {
        task_status = "completed";
        emailTempKey = "activityCompleted";
      }
      if (payload.status == "pending") {
        task_status = "pending";
        emailTempKey = "activityInPending";
      }

      //   ----------    Notifications start ----------
      const activity_email_template = templateMaker("activityTemplate.html", {
        ...getTask[0],
        meeting_start_time: momentTimezone(
          getTask[0]?.meeting_start_time,
          "HH:mm"
        )
          .tz("Asia/Kolkata")
          .format("HH:mm"),
        meeting_end_time: momentTimezone(getTask[0]?.meeting_end_time, "HH:mm")
          .tz("Asia/Kolkata")
          .format("HH:mm"),
        recurrence_end_date: getTask[0]?.recurrence_end_date
          ? moment(getTask[0]?.recurrence_end_date).format("DD-MM-YYYY")
          : null,
        meeting_date: moment(getTask[0]?.meeting_date).format("DD-MM-YYYY"),
        status: payload?.status === "cancel" ? "cancelled" : "completed",
        agenda: getTask[0]?.agenda
          ? extractTextFromHtml(getTask[0]?.agenda)
          : "-",
        google_meet_link: getTask[0]?.google_meeting_data?.meet_link ?? "-",
        REACT_APP_URL: process.env.REACT_APP_URL,
        SERVER_URL: process.env.SERVER_URL,
        link: link,
        instagram: configuration?.urls?.instagram,
        facebook: configuration?.urls?.facebook,
        privacy_policy: configuration?.urls?.privacy_policy,
        year: new Date().getFullYear(),
      });

      attendees_data &&
        attendees_data[0] &&
        attendees_data.map((item) => {
          sendEmail({
            email: item?.email,
            subject: returnMessage("emailTemplate", emailTempKey),
            message: activity_email_template,
          });
        });

      //   ----------    Notifications start ----------

      await notificationService.addNotification(
        {
          ...getTask[0],
          module_name: "activity",
          activity_type_action: task_status,
          meeting_start_time: moment(getTask[0]?.meeting_start_time).format(
            "HH:mm"
          ),
          meeting_date: moment(getTask[0]?.meeting_date).format("DD-MM-YYYY"),
          workspace_id: user?.workspace,
          meeting_start_time: momentTimezone
            .utc(getTask[0]?.meeting_start_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          meeting_end_time: momentTimezone
            .utc(getTask[0]?.meeting_end_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
        },
        id
      );
      //   ----------    Notifications end ----------
      return updateTasks;
    } catch (error) {
      logger.error(`Error while Updating status, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used to update the call type activity or other
  updateActivity = async (activity_id, payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.user_role !== "team_agency"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      const activity_exist = await Activity.findById(activity_id)
        .populate("activity_status")
        .lean();
      if (!activity_exist)
        return throwError(
          returnMessage("activity", "activityNotFound"),
          statusCode.notFound
        );

      if (payload.all_day) {
        payload.meeting_start_time = "18.30";
        payload.meeting_end_time = "18.29";
      }

      const output_date = moment(activity_exist?.meeting_date).format(
        "DD-MM-YYYY"
      );
      const meet_start_time = moment(activity_exist?.meeting_start_time)
        .utc()
        .format("HH:mm");

      const meet_end_time = moment(activity_exist?.meeting_end_time)
        .utc()
        .format("HH:mm");

      let google_meet_link;

      if (
        (payload?.meeting_date !== output_date ||
          payload?.meeting_start_time !== meet_start_time ||
          payload?.meeting_end_time !== meet_end_time ||
          payload?.title !== activity_exist?.title ||
          payload?.agenda !== activity_exist?.agenda ||
          payload?.attendees.toString() !==
            activity_exist?.attendees.toString()) &&
        payload?.google_meeting &&
        activity_exist?.google_meeting_data?.meet_link
      ) {
        const link = await this.updateGoogleMeeting({
          ...payload,
          event_id: activity_exist?.google_meeting_data?.event_id,
          activity_id: activity_id,
        });

        google_meet_link = {
          meet_link: link.meeting_link,
          event_id: activity_exist?.google_meeting_data?.event_id,
        };
      } else if (
        payload?.google_meeting &&
        !activity_exist?.google_meeting_data?.meet_link
      ) {
        google_meet_link = await this.createCallGoogleMeeting(payload);
      }

      if (activity_exist?.activity_status?.name === "completed") {
        return throwError(returnMessage("activity", "ActivityCannotUpdate"));
      }
      validateRequestFields(payload, [
        "title",
        "meeting_start_time",
        "meeting_end_time",
        "meeting_date",
      ]);

      const {
        title,
        agenda,
        meeting_date,
        meeting_start_time,
        meeting_end_time,
        internal_info,
        attendees,
        recurrence_pattern,
        recurrence_interval,
        weekly_recurrence_days,
        monthly_recurrence_day_of_month,
        all_day,
        alert_time,
        alert_time_unit,
        token,
      } = payload;

      let recurring_date;
      const current_date = moment.utc();
      const start_date = moment.utc(meeting_date, "DD-MM-YYYY").startOf("day");
      let start_time;
      let end_time;
      start_time = moment.utc(
        `${meeting_date}-${meeting_start_time}`,
        "DD-MM-YYYY-HH:mm"
      );
      end_time = moment.utc(
        `${meeting_date}-${meeting_end_time}`,
        "DD-MM-YYYY-HH:mm"
      );

      let original_start_time = moment.utc(start_time);
      let original_end_time = moment.utc(end_time);

      // Get the date part separately
      let datePart = original_start_time.format("YYYY-MM-DD");

      // Add 5 hours and 30 minutes to the time part
      let new_start_time = original_start_time
        .clone()
        .add(5, "hours")
        .add(30, "minutes")
        .format("HH:mm:ss");
      // Add 5 hours and 30 minutes to the time part
      let new_end_time = original_end_time
        .clone()
        .add(5, "hours")
        .add(30, "minutes")
        .format("HH:mm:ss");

      // Combine the date and time parts
      let converted_start_date = moment.utc(`${datePart}T${new_start_time}Z`);
      let converted_end_date = moment.utc(`${datePart}T${new_end_time}Z`);

      if (!converted_start_date.isSameOrAfter(current_date) && !all_day)
        return throwError(returnMessage("activity", "dateinvalid"));

      if (!converted_end_date.isSameOrAfter(converted_start_date))
        return throwError(returnMessage("activity", "invalidTime"));

      if (!payload?.all_day) {
        // Adjust start_time if meeting starts after 18:30 and at or before 23:59
        if (
          (start_time.hour() > 18 ||
            (start_time.hour() === 18 && start_time.minute() >= 30)) &&
          (start_time.hour() < 23 ||
            (start_time.hour() === 23 && start_time.minute() <= 59))
        ) {
          start_time.subtract(1, "day");
        }

        // Adjust end_time if meeting ends after 18:30 and at or before 23:59
        if (
          (end_time.hour() > 18 ||
            (end_time.hour() === 18 && end_time.minute() > 30)) &&
          (end_time.hour() < 23 ||
            (end_time.hour() === 23 && end_time.minute() <= 59))
        ) {
          end_time.subtract(1, "day");
        }
      } else {
        start_time = moment
          .utc(`${meeting_date}-${meeting_start_time}`, "DD-MM-YYYY-HH:mm")
          .subtract(1, "day");

        end_time = moment.utc(
          `${meeting_date}-${meeting_end_time}`,
          "DD-MM-YYYY-HH:mm"
        );
      }

      if (payload?.recurrence_end_date) {
        recurring_date = moment
          .utc(payload?.recurrence_end_date, "DD-MM-YYYY")
          .startOf("day");
        if (!recurring_date.isSameOrAfter(start_date))
          return throwError(returnMessage("activity", "invalidRecurringDate"));
      }

      payload.attendees?.push(user?._id.toString());
      payload.attendees = [
        ...new Set(payload?.attendees?.map((attendee) => attendee.toString())),
      ].map((attendee) => new mongoose.Types.ObjectId(attendee));

      const status = await ActivityStatus.findOne({ name: "pending" }).lean();

      const update_data = {
        activity_status: status?._id,
        assign_by: user?._id,
        agenda,
        title,
        internal_info,
        meeting_start_time: start_time,
        meeting_end_time: end_time,
        meeting_date: start_date,
        recurrence_end_date: recurring_date,
        attendees: payload?.attendees,
        ...(google_meet_link && { google_meeting_data: google_meet_link }),
        recurrence_pattern,
        recurrence_interval,
        weekly_recurrence_days,
        monthly_recurrence_day_of_month,
        all_day,
        token,
        alert_time,
        alert_time_unit,
      };

      if (recurrence_pattern === null) {
        update_data.recurrence_interval = null;
        update_data.weekly_recurrence_days = null;
        update_data.monthly_recurrence_day_of_month = null;
        update_data.recurrence_end_date = null;
      }

      await Activity.findByIdAndUpdate(activity_id, update_data, { new: true });
      // --------------- Start--------------------

      const [attendees_data, configuration] = await Promise.all([
        Authentication.find({
          _id: { $in: attendees },
        }).lean(),
        Configuration.findOne({}).lean(),
      ]);
      const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/meetings`;
      attendees_data &&
        attendees_data[0] &&
        attendees_data.map((item) => {
          const activity_email_template = templateMaker(
            "activityTemplate.html",
            {
              ...payload,
              title: payload?.title ?? "-",
              agenda: payload?.agenda ?? "-",
              assigned_by_name: payload?.assigned_by_name ?? "-",
              meeting_date: payload?.meeting_date ?? "-",
              status: "pending",
              assigned_by_name: user.first_name + " " + user.last_name,
              REACT_APP_URL: process.env.REACT_APP_URL,
              SERVER_URL: process.env.SERVER_URL,
              link: link,
              instagram: configuration?.urls?.instagram,
              facebook: configuration?.urls?.facebook,
              privacy_policy: configuration?.urls?.privacy_policy,
              google_meet_link: google_meet_link?.meet_link ?? "-",
              meeting_start_time: momentTimezone
                .utc(meeting_start_time, "HH:mm")
                .tz("Asia/Kolkata")
                .format("HH:mm"),
              meeting_end_time: momentTimezone
                .utc(meeting_end_time, "HH:mm")
                .tz("Asia/Kolkata")
                .format("HH:mm"),
              recurrence_end_date: payload?.recurrence_end_date ?? "-",
              year: new Date().getFullYear(),
            }
          );

          sendEmail({
            email: item?.email,
            subject: returnMessage("emailTemplate", "activityUpdated"),
            message: activity_email_template,
          });
        });
      await notificationService.addNotification(
        {
          assign_by: user?._id,
          assigned_by_name: user?.first_name + " " + user?.last_name,
          ...payload,
          module_name: "activity",
          activity_type_action: "update",
          workspace_id: user?.workspace,
          meeting_start_time: momentTimezone
            .utc(meeting_start_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
          meeting_end_time: momentTimezone
            .utc(meeting_end_time, "HH:mm")
            .tz("Asia/Kolkata")
            .format("HH:mm"),
        },
        activity_id
      );
      // ---------------- End ---------------
      return;
    } catch (error) {
      logger.error(`Error while updating call meeting and other: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used for to get the activity with date and user based filter
  getActivities = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      if (payload?.pagination) {
        return await this.getWithPaginationActivities(payload, user);
      }

      const match_obj = { $match: {} };
      const assign_obj = { $match: {} };
      if (payload?.given_date) {
        match_obj["$match"] = {
          meeting_date: {
            $eq: moment.utc(payload?.given_date, "DD-MM-YYYY").startOf("day"),
          },
        };
      }

      // this will used for the date filter in the listing
      const filter = {
        $match: {},
      };
      if (payload?.filter) {
        if (payload?.filter?.status === "in_progress") {
          const activity_status = await ActivityStatus.findOne({
            name: "in_progress",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "pending") {
          const activity_status = await ActivityStatus.findOne({
            name: "pending",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "overdue") {
          const activity_status = await ActivityStatus.findOne({
            name: "overdue",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "done") {
          const activity_status = await ActivityStatus.findOne({
            name: "completed",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        }

        if (payload?.filter?.date === "today") {
          filter["$match"] = {
            ...filter["$match"],
            meeting_date: { $eq: new Date(moment.utc().startOf("day")) },
          };
        } else if (payload?.filter?.date === "tomorrow") {
          filter["$match"] = {
            ...filter["$match"],
            meeting_date: {
              $eq: new Date(moment.utc().add(1, "day").startOf("day")),
            },
          };
        } else if (payload?.filter?.date === "this_week") {
          filter["$match"] = {
            ...filter["$match"],
            $and: [
              {
                meeting_date: { $gte: new Date(moment.utc().startOf("week")) },
              },
              {
                meeting_date: { $lte: new Date(moment.utc().endOf("week")) },
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
            $and: [
              {
                meeting_date: { $lte: new Date(end_date) },
              },
              {
                $expr: {
                  $or: [
                    {
                      $not: {
                        $gte: ["$recurrence_end_date", new Date(start_date)],
                      },
                    }, // Condition to match documents without the recurrence_end_date field
                    { $gte: ["$recurrence_end_date", new Date(start_date)] }, // Condition to match documents with the recurrence_end_date field and check its value
                  ],
                },
              },
            ],
          };
        }
      }

      if (user?.role === "agency") {
        assign_obj["$match"] = {
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      } else if (user?.role === "team_agency") {
        assign_obj["$match"] = {
          $or: [{ created_by: user?._id }, { attendees: user?._id }],
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      } else if (user?.role === "client") {
        assign_obj["$match"] = {
          is_deleted: false,
          attendees: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      } else if (user?.role === "team_client") {
        assign_obj["$match"] = {
          is_deleted: false,
          attendees: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      }

      let aggragate = [
        assign_obj,
        match_obj,
        filter,
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "attendees",
            foreignField: "_id",
            as: "attendeesData",
            pipeline: [
              {
                $project: {
                  email: 1,
                  _id: 1,
                  profile_image: 1,
                  first_name: 1,
                  last_name: 1,
                  attendees_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "activity_status_masters",
            localField: "activity_status",
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
      ];

      let activity, total_activity;
      activity = await Activity.aggregate(aggragate);
      let activity_array = [];
      activity.forEach((act) => {
        if (
          !payload?.given_date &&
          payload?.filter &&
          act?.recurrence_end_date &&
          act?.recurrence_end_date !== null &&
          act?.recurrence_pattern &&
          act?.recurrence_pattern !== null
        ) {
          // this will give the activity based on the filter selected and recurring date activity
          if (payload?.filter?.date === "period") {
            // act.recurrence_end_date = moment
            //   .utc(payload?.filter?.end_date, "DD-MM-YYYY")
            //   .endOf("day");
            act.filter_end_date = moment
              .utc(payload?.filter?.end_date, "DD-MM-YYYY")
              .endOf("day");
            act.filter_start_date = moment
              .utc(payload?.filter?.start_date, "DD-MM-YYYY")
              .startOf("day");
          }
          const others_meetings = this.generateMeetingTimes(act);
          activity_array = [...activity_array, ...others_meetings];
          // return;
        } else {
          let obj = {
            id: act?._id,
            title: act?.title,
            description: act?.agenda,
            allDay: act?.all_day,
            start: act?.meeting_start_time,
            end: act?.meeting_end_time,
            status: act?.activity_status?.name,
          };
          activity_array.push(obj);
        }
      });

      activity_array = [...activity_array];
      return activity_array;
    } catch (error) {
      logger.error(`Error while fetching the activity: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getWithPaginationActivities = async (payload, user) => {
    try {
      const match_obj = { $match: {} };
      const assign_obj = { $match: {} };
      if (payload?.given_date) {
        match_obj["$match"] = {
          meeting_date: {
            $eq: moment.utc(payload?.given_date, "DD-MM-YYYY").startOf("day"),
          },
        };
      }

      // this will used for the date filter in the listing
      const filter = {
        $match: {},
      };
      if (payload?.filter) {
        if (payload?.filter?.status === "in_progress") {
          const activity_status = await ActivityStatus.findOne({
            name: "in_progress",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "pending") {
          const activity_status = await ActivityStatus.findOne({
            name: "pending",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "overdue") {
          const activity_status = await ActivityStatus.findOne({
            name: "overdue",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "cancel") {
          const activity_status = await ActivityStatus.findOne({
            name: "cancel",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        } else if (payload?.filter?.status === "done") {
          const activity_status = await ActivityStatus.findOne({
            name: "completed",
          })
            .select("_id")
            .lean();
          filter["$match"] = {
            ...filter["$match"],
            activity_status: activity_status?._id,
          };
        }

        if (payload?.filter?.date === "today") {
          filter["$match"] = {
            ...filter["$match"],
            meeting_date: { $eq: new Date(moment.utc().startOf("day")) },
          };
        } else if (payload?.filter?.date === "tomorrow") {
          filter["$match"] = {
            ...filter["$match"],
            meeting_date: {
              $eq: new Date(moment.utc().add(1, "day").startOf("day")),
            },
          };
        } else if (payload?.filter?.date === "this_week") {
          filter["$match"] = {
            ...filter["$match"],
            $and: [
              {
                meeting_date: { $gte: new Date(moment.utc().startOf("week")) },
              },
              {
                meeting_date: { $lte: new Date(moment.utc().endOf("week")) },
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
                  { meeting_date: { $gte: new Date(start_date) } },
                  { meeting_date: { $lte: new Date(end_date) } },
                ],
              },
              {
                $and: [
                  { meeting_date: { $gte: new Date(start_date) } },
                  { recurrence_end_date: { $lte: new Date(end_date) } },
                ],
              },
            ],
          };
        }
      }

      if (payload?.attendee_id) {
        filter["$match"] = {
          ...filter["$match"],
          attendees: new mongoose.Types.ObjectId(payload?.attendee_id),
        };
      }

      const pagination = paginationObject(payload);
      if (user?.role === "agency") {
        assign_obj["$match"] = {
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      } else if (user?.role === "team_agency") {
        assign_obj["$match"] = {
          $or: [{ created_by: user?._id }, { attendees: user?._id }],
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      } else if (user?.role === "client") {
        assign_obj["$match"] = {
          is_deleted: false,
          attendees: new mongoose.Types.ObjectId(user?._id),
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      } else if (user?.role === "team_client") {
        assign_obj["$match"] = {
          is_deleted: false,
          attendees: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace), // this is removed because agency can also assign the activity
        };
      }

      if (payload?.search && payload?.search !== "") {
        match_obj["$match"] = {
          ...match_obj["$match"],
          $or: [
            {
              title: {
                $regex: payload?.search.toLowerCase(),
                $options: "i",
              },
            },
            {
              "google_meeting_data.meet_link": {
                $regex: payload?.search.toLowerCase(),
                $options: "i",
              },
            },
            // {
            //   "assign_by.first_name": {
            //     $regex: payload?.search.toLowerCase(),
            //     $options: "i",
            //   },
            // },
            // {
            //   "assign_by.last_name": {
            //     $regex: payload?.search.toLowerCase(),
            //     $options: "i",
            //   },
            // },
            // {
            //   "assign_by.name": {
            //     $regex: payload?.search.toLowerCase(),
            //     $options: "i",
            //   },
            // },
            {
              "activity_status.name": {
                $regex: payload?.search.toLowerCase(),
                $options: "i",
              },
            },
            {
              "attendeesData.first_name": {
                $regex: payload?.search.toLowerCase(),
                $options: "i",
              },
            },
            {
              "attendeesData.last_name": {
                $regex: payload?.search.toLowerCase(),
                $options: "i",
              },
            },
            {
              "attendeesData.attendees_name": {
                $regex: payload?.search.toLowerCase(),
                $options: "i",
              },
            },
          ],
        };
      }
      let aggragate = [
        assign_obj,
        filter,
        {
          $match: {
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "attendees",
            foreignField: "_id",
            as: "attendeesData",
            pipeline: [
              {
                $project: {
                  email: 1,
                  _id: 1,
                  profile_image: 1,
                  first_name: 1,
                  last_name: 1,
                  attendees_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "activity_status_masters",
            localField: "activity_status",
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
        match_obj,
        {
          $project: {
            title: 1,
            due_time: 1,
            meeting_date: 1,
            createdAt: 1,
            status: "$activity_status.name",
            agenda: 1,
            assigned_by_first_name: "$assign_by.first_name",
            assigned_by_last_name: "$assign_by.last_name",
            assigned_by_name: {
              $concat: ["$assign_by.first_name", " ", "$assign_by.last_name"],
            },
            meeting_start_time: 1,
            meeting_end_time: 1,
            attendees: "$attendeesData",
            internal_info: 1,
            all_day: 1,
            google_meeting_data: 1,
            alert_time_unit: 1,
            alert_time: 1,
            recurrence_pattern: 1,
            recurrence_interval: 1,
            weekly_recurrence_days: 1,
            monthly_recurrence_day_of_month: 1,
            recurrence_end_date: 1,
            workspace_id: 1,
          },
        },
      ];

      const [activity, total_activity] = await Promise.all([
        Activity.aggregate(aggragate)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Activity.aggregate(aggragate),
      ]);

      return {
        activity,
        page_count:
          Math.ceil(total_activity.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while fetching the activity: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used for the only generate the calandar view objects only
  // because we need to generate the between dates from the start and recurring date

  generateMeetingTimes = (activity_obj) => {
    const meetingTimes = [];
    let current_meeting_start = moment.utc(activity_obj?.meeting_start_time);
    const meeting_end = moment.utc(activity_obj?.meeting_end_time);
    const recurring_end = moment
      .utc(activity_obj?.recurrence_end_date)
      .endOf("day");
    const filter_start_date = moment.utc(activity_obj?.filter_start_date);
    const filter_end_date = moment.utc(activity_obj?.filter_end_date);

    // Function to add interval based on recurrence pattern
    const addInterval = () => {
      console.time("asd");
      switch (activity_obj?.recurrence_pattern) {
        case "daily":
          current_meeting_start?.add(
            activity_obj?.recurrence_interval + 1,
            "days"
          );
          break;
        case "weekly":
          // If weekly recurrence days are specified, adjust start date accordingly
          if (activity_obj?.weekly_recurrence_days) {
            current_meeting_start?.add(
              activity_obj?.recurrence_interval,
              "weeks"
            );
            const daysOfWeek = [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ];
            const currentDay = current_meeting_start?.day(); // Get the day of the week (0 = Sunday, 1 = Monday, ...)
            const targetDay = daysOfWeek.indexOf(
              activity_obj?.weekly_recurrence_days
            ); // Get the index of the target day
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7; // If the target day has already passed this week, move to next occurrence
            current_meeting_start?.add(daysToAdd, "days");
          } else {
            current_meeting_start?.add(
              activity_obj?.recurrence_interval,
              "weeks"
            );
          }
          break;
        case "monthly":
          // Add the recurrence interval in months while setting the day of the month
          current_meeting_start?.add(
            activity_obj.recurrence_interval + 1,
            "months"
          );
          const targetDayOfMonth =
            activity_obj?.monthly_recurrence_day_of_month;
          const targetMonth = current_meeting_start?.month();
          current_meeting_start?.date(targetDayOfMonth);
          // Check if the day of the month is valid for the current month
          if (current_meeting_start?.month() !== targetMonth) {
            // The day of the month does not exist in the current month, so skip this month
            current_meeting_start?.add(1, "months").date(targetDayOfMonth);
          }
          break;
      }
    };

    // Recursive function to generate meeting times
    while (current_meeting_start?.isSameOrBefore(recurring_end)) {
      const currentMeetingEnd = moment
        .utc(current_meeting_start)
        .add(
          meeting_end?.diff(activity_obj?.meeting_start_time),
          "milliseconds"
        );

      if (
        current_meeting_start?.isSameOrAfter(filter_start_date) &&
        current_meeting_start?.isSameOrBefore(filter_end_date)
      ) {
        meetingTimes.push({
          id: activity_obj?._id,
          title: activity_obj?.title,
          description: activity_obj?.agenda,
          all_day: activity_obj?.all_day,
          start: current_meeting_start?.format(),
          end: currentMeetingEnd?.format(),
          status: activity_obj?.activity_status?.name,
        });
      }

      addInterval(); // Increment meeting start time by the defined interval
    }
    console.timeEnd("asd");
    return meetingTimes;
  };

  generateEventTimes = (activity_obj) => {
    const meetingTimes = [];
    let current_meeting_start = moment.utc(activity_obj?.event_start_time);
    const meeting_end = moment.utc(activity_obj?.event_end_time);
    const recurring_end = moment.utc(activity_obj?.recurring_end_date);

    // Generate event times till recurring end time
    while (current_meeting_start.isBefore(recurring_end)) {
      const currentMeetingEnd = moment
        .utc(current_meeting_start)
        .add(meeting_end.diff(activity_obj?.event_start_time), "milliseconds");
      meetingTimes.push({
        id: activity_obj?._id,
        title: activity_obj?.title,
        description: activity_obj?.agenda,
        allDay: false,
        start: current_meeting_start.format(),
        end: currentMeetingEnd.format(),
        type: "event",
      });
      current_meeting_start.add(1, "day"); // Increment event start time by one day
    }

    return meetingTimes;
  };

  leaderboard = async (payload, user) => {
    try {
      const pagination = paginationObject(payload);
      const query_obj = {
        workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        $or: [{ type: "task" }, { type: "login" }],
      };
      let start_date, end_date;
      if (payload?.filter === "weekly") {
        start_date = moment.utc().startOf("week");
        end_date = moment.utc().endOf("week");
      } else if (payload?.filter === "monthly") {
        start_date = moment.utc().startOf("month");
        end_date = moment.utc().endOf("month");
      }
      if (start_date && end_date) {
        query_obj["$and"] = [
          { createdAt: { $gte: new Date(start_date) } },
          { createdAt: { $lte: new Date(end_date) } },
        ];
      }

      const aggragate = [
        { $match: query_obj },
        {
          $group: {
            _id: "$user_id",
            totalPoints: { $sum: { $toInt: "$point" } },
            createdAt: { $first: "$createdAt" },
          },
        },
        {
          $sort: {
            createdAt: -1, // Secondary sorting by createdAt in ascending order
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "_id",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                  profile_image: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $setWindowFields: {
            sortBy: { totalPoints: -1 },
            output: {
              serial_number: { $documentNumber: {} },
            },
          },
        },
      ];
      const [leaderboard, total_leaderboard] = await Promise.all([
        Gamification.aggregate(aggragate)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Gamification.aggregate(aggragate),
      ]);

      return {
        leaderboard,
        page_count: Math.ceil(
          total_leaderboard.length / pagination.result_per_page
        ),
      };
    } catch (error) {
      logger.error(`Error while fetching the leaderboard users: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used to check the activities are assigned to the attandees or not
  checkAnyActivitiesAssingend = async (payload, user) => {
    try {
      if (payload?.attendees?.length === 0) {
        return { activity_assinged_to_attendees: false };
      }

      if (user?.role?.name === "client" || user?.role?.name === "team_client")
        return throwError(
          returnMessage("auth", "unAuthorized"),
          statusCode.forbidden
        );

      validateRequestFields(payload, [
        "meeting_date",
        "activity_type",
        "meeting_start_time",
        "meeting_end_time",
      ]);

      const {
        client_id,
        meeting_date,
        meeting_start_time,
        meeting_end_time,
        activity_type,
        attendees,
      } = payload;

      let recurring_date;
      const current_date = moment.utc().startOf("day");
      const start_date = moment.utc(meeting_date, "DD-MM-YYYY").startOf("day");
      const start_time = moment.utc(
        `${meeting_date}-${meeting_start_time}`,
        "DD-MM-YYYY-HH:mm"
      );
      const end_time = moment.utc(
        `${meeting_date}-${meeting_end_time}`,
        "DD-MM-YYYY-HH:mm"
      );
      if (!start_date.isSameOrAfter(current_date))
        return throwError(returnMessage("activity", "dateinvalid"));

      if (!end_time.isAfter(start_time))
        return throwError(returnMessage("activity", "invalidTime"));

      // if (activity_type === "others" && !payload?.recurring_end_date)
      //   return throwError(returnMessage("activity", "recurringDateRequired"));

      if (activity_type === "others" && payload?.recurring_end_date) {
        recurring_date = moment
          .utc(payload?.recurring_end_date, "DD-MM-YYYY")
          .startOf("day");
        if (!recurring_date.isSameOrAfter(start_date))
          return throwError(returnMessage("activity", "invalidRecurringDate"));
      }

      const [activity_type_id, activity_status_type] = await Promise.all([
        ActivityType.findOne({ name: activity_type }).select("_id").lean(),
        ActivityStatus.findOne({ name: "pending" }).select("name").lean(),
      ]);

      if (!activity_type_id)
        return throwError(
          returnMessage("activity", "activityTypeNotFound"),
          statusCode.notFound
        );

      // this condition is used for the check if client or team member is assined to any same time activity or not
      const or_condition = [
        {
          $and: [
            { meeting_start_time: { $gte: start_time } },
            { meeting_end_time: { $lte: end_time } },
          ],
        },
        {
          $and: [
            { meeting_start_time: { $lte: start_time } },
            { meeting_end_time: { $gte: end_time } },
          ],
        },
        {
          $and: [
            { meeting_start_time: { $gte: start_time } },
            { meeting_end_time: { $lte: end_time } },
            { meeting_date: { $gte: start_date } },
            { recurring_end_date: { $lte: recurring_date } },
          ],
        },
        {
          $and: [
            { meeting_start_time: { $lte: start_time } },
            { meeting_end_time: { $gte: end_time } },
            { meeting_date: { $gte: start_date } },
            { recurring_end_date: { $lte: recurring_date } },
          ],
        },
      ];

      // check for the user role. if the role is team_agency then we need to
      // find the agency id for that user which he is assigned

      // let team_agency_detail;
      if (user?.role?.name === "team_agency") {
        const team_agency_detail = await Team_Agency.findById(
          user?.reference_id
        ).lean();
        user.agency_id = team_agency_detail?.agency_id;
      }

      // if we need to check when we are updating then at that time we need the activity id
      let activity_id = {};
      if (payload?.activity_id) {
        activity_id = { _id: { $ne: payload?.activity_id } };
      }

      // this below function is used to check weather client is assign to any type of the call or other
      // activity or not if yes then throw an error but it should be in the same agency id not in the other
      let meeting_exist;
      if (user?.role?.name === "agency") {
        meeting_exist = await Activity.findOne({
          client_id,
          agency_id: user?.reference_id,
          activity_status: { $eq: activity_status_type?._id },
          activity_type: activity_type_id?._id,
          $or: or_condition,
          attendees: { $in: attendees },
          ...activity_id,
        }).lean();
      } else if (user?.role?.name === "team_agency") {
        meeting_exist = await Activity.findOne({
          client_id,
          agency_id: user?.agency_id,
          activity_status: { $eq: activity_status_type?._id },
          $or: or_condition,
          activity_type: activity_type_id?._id,
          attendees: { $in: attendees },
          ...activity_id,
        }).lean();
      }
      if (meeting_exist) return { activity_assinged_to_attendees: true };

      return { activity_assinged_to_attendees: false };
    } catch (error) {
      logger.error(`Error while check activity assigned or not: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // below function is used for the get the completion points for the agency and agency team member
  completionHistory = async (payload, user) => {
    try {
      const pagination = paginationObject(payload);
      const match_obj = {
        workspace_id: user?.workspace_detail?._id,
        user_id: user?._id,
      };

      const search_obj = {};
      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          {
            "user.first_name": {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },

          {
            "user.last_name": {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "user.name": {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            point: {
              $regex: payload?.search.toLowerCase(),
              $options: "i",
            },
          },
          { type: { $regex: payload?.search.toLowerCase(), $options: "i" } },
        ];
      }

      const aggragate = [
        { $match: match_obj },
        {
          $lookup: {
            from: "authentications",
            localField: "user_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  name: { $concat: ["$first_name", " ", "$last_name"] },
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $match: search_obj },
      ];

      const [points_history, total_points_history, total_points] =
        await Promise.all([
          Gamification.aggregate(aggragate)
            .sort(pagination.sort)
            .skip(pagination.skip)
            .limit(pagination.result_per_page),
          Gamification.aggregate(aggragate),
          Gamification.aggregate([
            { $match: match_obj },
            {
              $group: {
                _id: "$user_id",
                totalPoints: {
                  $sum: {
                    $toInt: "$point",
                  },
                },
              },
            },
          ]),
        ]);

      return {
        points_history,
        page_count: Math.ceil(
          total_points_history.length / pagination.result_per_page
        ),
        total_points: total_points[0]?.totalPoints,
      };
    } catch (error) {
      logger.error(`Error while fetching completion history: ${error}`);

      return throwError(error?.message, error?.statusCode);
    }
  };

  // competition  points statistics for the agency and agency team member
  competitionStats = async (user) => {
    try {
      const match_condition = {
        user_id: user?._id,
        workspace_id: user?.workspace_detail?._id,
      };

      const member_details = user?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === user?._id?.toString() &&
          member?.status == "confirmed"
      );

      if (!member_details) return { available_points: 0, earned_points: 0 };

      const gamification = await Gamification.aggregate([
        { $match: match_condition },
        {
          $group: {
            _id: "$user_id",
            totalPoints: {
              $sum: { $abs: { $toInt: "$point" } },
            },
          },
        },
      ]);

      return {
        available_points: member_details?.gamification_points || 0,
        earned_points: gamification[0]?.totalPoints,
      };
    } catch (error) {
      logger.error(`Error while fetching the competition stats: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  createCallGoogleMeeting = async (payload) => {
    try {
      const {
        token,
        meeting_date,
        meeting_start_time,
        title,
        internal_info,
        agenda,
        meeting_end_time,
      } = payload;

      // Define the initial time
      const initial_start_time = moment(meeting_start_time, "HH:mm");
      // Add 5 hours and 30 minutes
      const new_meeting_start_time = initial_start_time
        .add(5, "hours")
        .add(30, "minutes");
      // Format the new time
      const formatted_start_time = new_meeting_start_time.format("HH:mm");

      // Define the initial time
      const initial_end_time = moment(meeting_end_time, "HH:mm");
      // Add 5 hours and 30 minutes
      const new_meeting_end_time = initial_end_time
        .add(5, "hours")
        .add(30, "minutes");
      // Format the new time
      const formatted_end_time = new_meeting_end_time.format("HH:mm");

      // Formate Date
      const formate_meeting_date = moment(meeting_date, "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );

      // Find Attendees mails

      let attendees_data = [];
      if (payload?.attendees && payload?.attendees[0]) {
        const promises = payload.attendees.map(async (item) => {
          const attendee = await Authentication.findById(item);
          return { email: attendee?.email };
        });
        attendees_data = await Promise.all(promises);
      }

      const options = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: token,
        date: formate_meeting_date,
        start_time: formatted_start_time,
        end_time: formatted_end_time,
        summary: title,
        location: internal_info,
        description: agenda,
        attendees: attendees_data,
      };

      const { OAuth2 } = google.auth;
      const SCOPES = ["https://www.googleapis.com/auth/calendar"];

      // Calculate start and end times for the event
      var date1 =
        options.date +
        "T" +
        options.start_time.replace(".", ":") +
        ":00" +
        "+05:30"; // Indian Standard Time (IST) offset
      var date2 =
        options.date +
        "T" +
        options.end_time.replace(".", ":") +
        ":00" +
        "+05:30"; // Indian Standard Time (IST) offset

      //setting details for teacher
      let oAuth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "postmessage"
      );
      const { tokens } = await oAuth2Client.getToken(options.code); // exchange code for tokens
      oAuth2Client.setCredentials(tokens);

      payload.access_token = tokens.access_token;
      payload.refresh_token = tokens.refresh_token;

      // Create a new calender instance.
      let calendar = google.calendar({ version: "v3", auth: oAuth2Client });

      // Create a new event start date instance for teacher in their calendar.
      const eventStartTime = new Date();
      eventStartTime.setDate(options.date.split("-")[2]);
      const eventEndTime = new Date();
      eventEndTime.setDate(options.date.split("-")[2]);
      eventEndTime.setMinutes(eventStartTime.getMinutes() + 45);

      // Create a dummy event for temp users in our calendar
      const event = {
        summary: options.summary,
        location: options.location,
        description: options.description,
        colorId: 1,
        conferenceData: {
          createRequest: {
            requestId: "zzz",
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        start: {
          dateTime: date1,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: date2,
          timeZone: "Asia/Kolkata",
        },
        attendees: options.attendees,
      };

      let link = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: "1",
        resource: event,
      });
      return {
        meet_link: link.data.hangoutLink,
        event_id: link.data.id, // Include eventId in the response
      };
    } catch (error) {
      logger.error(`Error while creating google meeting : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  updateGoogleMeeting = async (payload) => {
    try {
      const {
        token,
        event_id,
        meeting_date,
        meeting_start_time,
        title,
        internal_info,
        agenda,
        all_day,
        meeting_end_time,
      } = payload;

      // Define the initial time
      const initial_start_time = moment(meeting_start_time, "HH:mm");
      // Add 5 hours and 30 minutes
      const new_meeting_start_time = initial_start_time
        .add(5, "hours")
        .add(30, "minutes");
      // Format the new time
      const formatted_start_time = new_meeting_start_time.format("HH:mm");

      // Define the initial time
      const initial_end_time = moment(meeting_end_time, "HH:mm");
      // Add 5 hours and 30 minutes
      const new_meeting_end_time = initial_end_time
        .add(5, "hours")
        .add(30, "minutes");
      // Format the new time
      const formatted_end_time = new_meeting_end_time.format("HH:mm");

      // Date udpate
      const formate_meeting_date = moment(meeting_date, "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );

      // Get Attendees Mails
      let attendees_data = [];
      if (payload?.attendees && payload?.attendees[0]) {
        const promises = payload.attendees.map(async (item) => {
          const attendee = await Authentication.findById(item);
          return { email: attendee?.email };
        });
        attendees_data = await Promise.all(promises);
      }

      const options = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: token,
        date: formate_meeting_date,
        start_time: formatted_start_time,
        end_time: formatted_end_time,
        summary: title,
        location: internal_info,
        description: agenda,
        attendees: attendees_data,
        endTimeUnspecified: all_day,
      };

      const { OAuth2 } = google.auth;
      const SCOPES = ["https://www.googleapis.com/auth/calendar"];

      // Initialize OAuth2 client
      let oAuth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "postmessage"
      );

      const get_tokens = await Activity.findById(payload?.activity_id);

      oAuth2Client.setCredentials({
        refresh_token: get_tokens?.refresh_token,
        access_token: get_tokens?.access_token,
      });

      await this.refreshAccessTokenIfNeeded(oAuth2Client, get_tokens);

      // Create a new calendar instance
      let calendar = google.calendar({ version: "v3", auth: oAuth2Client });

      // Calculate start and end times for the event
      var date1 =
        options.date +
        "T" +
        options.start_time.replace(".", ":") +
        ":00" +
        "+05:30"; // Indian Standard Time (IST) offset
      var date2 =
        options.date +
        "T" +
        options.end_time.replace(".", ":") +
        ":00" +
        "+05:30"; // Indian Standard Time (IST) offset

      // Create an event object with updated details
      const event = {
        summary: options.summary,
        location: options.location,
        description: options.description,
        colorId: 1,
        conferenceData: {
          createRequest: {
            requestId: "zzz",
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        start: {
          dateTime: date1,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: date2,
          timeZone: "Asia/Kolkata",
        },
        attendees: options.attendees,
      };

      // Update the event in Google Calendar
      let link = await calendar.events.update({
        calendarId: "primary",
        eventId: event_id,
        conferenceDataVersion: "1",
        resource: event,
      });

      return {
        meeting_link: link.data.hangoutLink,
      };
    } catch (error) {
      console.error(`Error while updating google meeting: ${error}`);
      throw new Error(
        error?.message || "An error occurred while updating the meeting"
      );
    }
  };

  deleteGoogleMeeting = async (payload) => {
    try {
      const { activity_id } = payload;

      const options = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      };

      // Setting up OAuth2 client
      const { OAuth2 } = google.auth;
      const oAuth2Client = new OAuth2(
        options.client_id,
        options.client_secret,
        "postmessage"
      );
      const get_tokens = await Activity.findById(activity_id);

      oAuth2Client.setCredentials({
        refresh_token: get_tokens?.refresh_token,
        access_token: get_tokens?.access_token,
      });

      await this.refreshAccessTokenIfNeeded(oAuth2Client, get_tokens);

      // Create a new calendar instance.
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

      // Delete the event
      await calendar.events.delete({
        calendarId: "primary",
        eventId: get_tokens?.google_meeting_data?.event_id,
      });

      return { message: "Meeting deleted successfully" };
    } catch (error) {
      console.error(`Error while deleting Google meeting: ${error}`);
      throw new Error(error?.message || "Error deleting meeting");
    }
  };

  refreshAccessTokenIfNeeded = async (oAuth2Client, activity_data) => {
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      // Update tokens in the database
      activity_data.access_token = credentials.access_token;
      activity_data.refresh_token = credentials.refresh_token;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Error refreshing access token");
    }
  };

  meetingAlertCronJob = async () => {
    try {
      const currentDate = moment().utc().startOf("day");
      const pipeline = [
        {
          $match: {
            is_deleted: false,
            $or: [
              {
                $and: [
                  { recurrence_end_date: { $exists: true } },
                  { recurrence_end_date: { $ne: null } },
                  { recurrence_end_date: { $gte: currentDate.toDate() } },
                ],
              },
              {
                $and: [
                  { recurrence_end_date: { $exists: false } },
                  { meeting_date: { $gte: currentDate.toDate() } },
                ],
              },
              {
                $and: [
                  { recurrence_end_date: null },
                  { meeting_date: { $gte: currentDate.toDate() } },
                ],
              },
            ],

            $and: [
              {
                alert_time: { $exists: true },
              },
              { alert_time: { $ne: null } },
            ],
            $and: [
              {
                alert_time_unit: { $exists: true },
              },
              { alert_time_unit: { $ne: null } },
            ],
          },
        },
        {
          $lookup: {
            from: "activity_status_masters",
            localField: "activity_status",
            foreignField: "_id",
            as: "activity_status",
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
            "activity_status.name": { $ne: "completed" },
          },
        },
      ];
      const activity = await Activity.aggregate(pipeline);
      let activity_array = [];
      activity &&
        activity[0] &&
        activity.forEach(async (act) => {
          if (
            act?.recurrence_end_date &&
            act?.recurrence_pattern &&
            act?.recurrence_pattern !== null &&
            act?.recurrence_end_date !== null
          ) {
            const others_meetings = this.generateMeetingTimesForCron(act);
            activity_array = [...activity_array, ...others_meetings];
          } else {
            let obj = {
              id: act?._id,
              title: act?.title,
              description: act?.agenda,
              all_day: act?.all_day,
              start: act?.meeting_start_time,
              end: act?.meeting_end_time,
              status: act?.activity_status?.name,
              alert_time: act?.alert_time,
              alert_time_unit: act?.alert_time_unit,
              attendees: act?.attendees,
              workspace_id: act?.workspace_id,
            };
            activity_array.push(obj);
          }
        });
      activity_array = [...activity_array];
      await this.meetingNotificationCronJob(activity_array);
    } catch (error) {
      logger.error(`Error while Overdue crone Job PDF, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
  generateMeetingTimesForCron = (activity_obj) => {
    const meetingTimes = [];
    let current_meeting_start = moment.utc(activity_obj?.meeting_start_time);
    const meeting_end = moment.utc(activity_obj?.meeting_end_time);
    const recurring_end = moment
      .utc(activity_obj?.recurrence_end_date)
      .endOf("day");

    // Function to add interval based on recurrence pattern
    const addInterval = () => {
      switch (activity_obj?.recurrence_pattern) {
        case "daily":
          current_meeting_start?.add(
            activity_obj?.recurrence_interval + 1,
            "days"
          );
          break;
        case "weekly":
          // If weekly recurrence days are specified, adjust start date accordingly
          if (activity_obj?.weekly_recurrence_days) {
            current_meeting_start?.add(
              activity_obj?.recurrence_interval,
              "weeks"
            );
            const daysOfWeek = [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ];
            const currentDay = current_meeting_start?.day(); // Get the day of the week (0 = Sunday, 1 = Monday, ...)
            const targetDay = daysOfWeek.indexOf(
              activity_obj?.weekly_recurrence_days
            ); // Get the index of the target day
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7; // If the target day has already passed this week, move to next occurrence
            current_meeting_start?.add(daysToAdd, "days");
          } else {
            current_meeting_start?.add(
              activity_obj?.recurrence_interval,
              "weeks"
            );
          }
          break;
        case "monthly":
          // Add the recurrence interval in months while setting the day of the month
          current_meeting_start?.add(
            activity_obj?.recurrence_interval + 1,
            "months"
          );
          const targetDayOfMonth =
            activity_obj?.monthly_recurrence_day_of_month;
          const targetMonth = current_meeting_start?.month();
          current_meeting_start?.date(targetDayOfMonth);
          // Check if the day of the month is valid for the current month
          if (current_meeting_start?.month() !== targetMonth) {
            // The day of the month does not exist in the current month, so skip this month
            current_meeting_start?.add(1, "months").date(targetDayOfMonth);
          }
          break;
      }
    };
    // Iterate to generate meeting times
    while (current_meeting_start?.isSameOrBefore(recurring_end)) {
      const currentMeetingEnd = moment
        .utc(current_meeting_start)
        .add(
          meeting_end.diff(activity_obj?.meeting_start_time),
          "milliseconds"
        );

      meetingTimes.push({
        id: activity_obj?._id,
        title: activity_obj?.title,
        description: activity_obj?.agenda,
        all_day: activity_obj?.all_day,
        start: current_meeting_start.format(),
        end: currentMeetingEnd.format(),
        status: activity_obj?.activity_status?.name,
        alert_time: activity_obj?.alert_time,
        alert_time_unit: activity_obj?.alert_time_unit,
        meeting_start_time: activity_obj?.meeting_start_time,
        recurrence_pattern: activity_obj?.recurrence_pattern,
        recurrence_interval: activity_obj?.recurrence_interval,
        recurrence_end_date: activity_obj?.recurrence_end_date,
        weekly_recurrence_days: activity_obj?.weekly_recurrence_days,
        monthly_recurrence_day_of_month:
          activity_obj?.monthly_recurrence_day_of_month,
        attendees: activity_obj?.attendees,
        workspace_id: activity_obj?.workspace_id,
      });

      addInterval(); // Increment meeting start time by the defined interval
    }
    return meetingTimes;
  };
  meetingNotificationCronJob = async (meetings) => {
    try {
      const currentUtcDate = moment().utc();

      meetings.forEach(async (meeting) => {
        const {
          alert_time,
          alert_time_unit,
          start,
          recurrence_pattern,
          recurrence_interval,
          recurrence_end_date,
          weekly_recurrence_days,
          monthly_recurrence_day_of_month,
        } = meeting;
        const time_unit_mapping = {
          min: "minutes",
          h: "hours",
        };
        const new_formate_alert_time_unit =
          time_unit_mapping[alert_time_unit] || "";
        let notificationTime;
        if (
          recurrence_pattern &&
          alert_time &&
          alert_time_unit &&
          alert_time_unit !== null &&
          alert_time !== null &&
          recurrence_pattern !== null
        ) {
          if (recurrence_pattern === "daily") {
            notificationTime = moment.utc(start);
            while (
              notificationTime?.isBefore(currentUtcDate) &&
              notificationTime?.isBefore(recurrence_end_date)
            ) {
              notificationTime?.add(recurrence_interval, "days");
            }
            notificationTime?.subtract(alert_time, new_formate_alert_time_unit);
          } else if (recurrence_pattern === "weekly") {
            notificationTime = moment.utc(start);
            const targetDay = moment().day(weekly_recurrence_days).day();

            while (
              notificationTime?.isBefore(currentUtcDate) &&
              notificationTime?.isBefore(recurrence_end_date)
            ) {
              if (notificationTime?.day() === targetDay) {
                notificationTime?.add(recurrence_interval, "weeks");
              } else {
                notificationTime?.add(1, "days");
              }
            }
            notificationTime?.subtract(alert_time, new_formate_alert_time_unit);
          } else if (recurrence_pattern === "monthly") {
            notificationTime = moment.utc(start);

            while (
              notificationTime?.isBefore(currentUtcDate) &&
              notificationTime?.isBefore(recurrence_end_date)
            ) {
              if (
                notificationTime?.date() === monthly_recurrence_day_of_month
              ) {
                notificationTime?.add(recurrence_interval, "months");
              } else {
                notificationTime?.add(1, "days");
              }
            }
            notificationTime?.subtract(alert_time, new_formate_alert_time_unit);
          }
        } else {
          notificationTime = moment.utc(start);
        }
        if (
          alert_time &&
          alert_time_unit &&
          alert_time_unit !== null &&
          alert_time !== null
        ) {
          const fifteen_minutes_before_start = moment
            .utc(notificationTime)
            .subtract(16, "minutes");
          if (
            currentUtcDate?.isSameOrAfter(
              fifteen_minutes_before_start?.toDate()
            ) &&
            currentUtcDate?.isSameOrBefore(notificationTime?.toDate())
          ) {
            await notificationService.addNotification(
              {
                module_name: "activity",
                activity_type_action: "meetingAlert",
                title: meeting?.title,
                alert_time_unit:
                  new_formate_alert_time_unit === "hours" ? "hour" : "minutes",
                alert_time: meeting?.alert_time,
                attendees: meeting?.attendees,
                workspace_id: meeting?.workspace_id,
              },
              meeting?.id
            );
          }
        }
      });
    } catch (error) {
      logger.error(`Error while Overdue crone Job PDF, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = ActivityService;
