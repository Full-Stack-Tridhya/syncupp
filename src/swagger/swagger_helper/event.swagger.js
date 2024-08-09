const createActivity = {
  tags: ["Event - CRM Panel"],
  description: "",
  summary: "Create event ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",

          properties: {
            title: {
              type: "string",
              required: true,
            },
            agenda: {
              type: "string",
              required: true,
            },

            due_date: {
              type: "string",
              required: true,
            },

            event_start_time: {
              type: "string",
              required: true,
            },
            event_end_time: {
              type: "string",
              required: true,
            },
            internal_info: {
              type: "string",
            },
            recurring_end_date: {
              type: "string",
            },
            email: {
              type: "array",
              required: true,
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const getActivity = {
  tags: ["Event - CRM Panel"],
  description: "",
  summary: "get event ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
    },
  ],
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const activityRoute = {
  "/api/v1/event/create-event": {
    post: createActivity,
  },
  "/api/v1/activity/update/call-meeting/{activityId}": {
    patch: updateActivity,
  },
  "/api/v1/activity/call-meeting/{activityId}": {
    get: getActivity,
  },
  "/api/v1/activity/list": {
    post: activityList,
  },
};

module.exports = activityRoute;
