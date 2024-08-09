const paymentHistory = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Payment History for the Agency",
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
            page: {
              type: "number",
              description: "Enter page number.",
              default: 1,
            },
            items_per_page: {
              type: "number",
              description: "Enter item per page.",
              default: 5,
            },
            sort_order: {
              type: "string",
              description: "Enter order of sort asc or desc.",
              default: "desc",
            },
            sort_field: {
              type: "string",
              description: "Enter field to sort.",
              default: "createdAt",
            },
            search: {
              type: "string",
              description: "Enter value of search",
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

const sheets = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Payment Sheets history for the Agency",
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
            page: {
              type: "number",
              description: "Enter page number.",
              default: 1,
            },
            items_per_page: {
              type: "number",
              description: "Enter item per page.",
              default: 5,
            },
            sort_order: {
              type: "string",
              description: "Enter order of sort asc or desc.",
              default: "desc",
            },
            sort_field: {
              type: "string",
              description: "Enter field to sort.",
              default: "createdAt",
            },
            search: {
              type: "string",
              description: "Enter value of search",
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

const removeUser = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Remove user for the Agency",
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
            user_id: {
              type: "string",
            },
            force_fully_remove: {
              type: "boolean",
              default: false,
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

const cancelSubscription = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Cancel Subscription for the Agency",
  security: [
    {
      bearerAuth: [],
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

const getSubscription = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Get Subscription detail for the Agency",
  security: [
    {
      bearerAuth: [],
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

const paymentScopes = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Get Payment scope details for the Agency",
  security: [
    {
      bearerAuth: [],
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

const deactivateAccount = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Deactivate the account of the agency.",
  security: [
    {
      bearerAuth: [],
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

const getPlan = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Get plan",
  security: [
    {
      bearerAuth: [],
    },
  ],

  parameters: [
    {
      name: "planId",
      in: "path", // or "query" depending on your use case
      description: "ID of the Plan",
      required: true,
      schema: {
        type: "string", // adjust the type accordingly
      },
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

const getPlans = {
  tags: ["Payment - CRM Panel"],
  description: "",
  summary: "Get plan list",
  security: [
    {
      bearerAuth: [],
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

const paymentRoute = {
  "/api/v1/payment/history": {
    post: paymentHistory,
  },
  "/api/v1/payment/sheets": {
    post: sheets,
  },
  "/api/v1/payment/remove-user": {
    post: removeUser,
  },
  "/api/v1/payment/cancel-subscription": {
    get: cancelSubscription,
  },
  "/api/v1/payment/get-subscription": {
    get: getSubscription,
  },
  "/api/v1/payment/payment-scopes": {
    get: paymentScopes,
  },
  "/api/v1/payment/de-activated": {
    get: deactivateAccount,
  },
  "/api/v1/payment/plans": {
    get: getPlans,
  },
  "/api/v1/payment/plan/{planId}": {
    get: getPlan,
  },
};

module.exports = paymentRoute;
