const addClient = {
  tags: ["Agency - CRM Panel"],
  description: "",
  summary: "Create or Register client",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              descripition: "Enter name of client.",
              required: true,
            },
            email: {
              type: "string",
              descripition: "Enter email of client.",
              required: true,
            },
            company_name: {
              type: "string",
              descripition: "Enter company name of client.",
              required: true,
            },
            company_website: {
              type: "string",
              descripition: "Enter company website of client.",
            },
            address: {
              type: "string",
              descripition: "Enter address of client.",
            },
            city: {
              type: "string",
              descripition: "Enter city object Id of client.",
            },
            state: {
              type: "string",
              descripition: "Enter state object Id of client.",
            },
            country: {
              type: "string",
              descripition: "Enter country object id of client.",
            },
            pincode: {
              type: "string",
              descripition: "Enter pincode of client.",
            },
            title: {
              type: "string",
              descripition: "Enter title of client.",
            },
            contact_number: {
              type: "string",
              descripition: "Enter contact number of client.",
            },
          },
        },
      },
    },
  },

  responses: {
    200: {
      descripition: "ok",
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

const clientList = {
  tags: ["Agency - CRM Panel"],
  description: "",
  summary: "Get all clients",
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
              default: 10,
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
            pagination: {
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
      descripition: "ok",
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

const getAgencyProfile = {
  tags: ["Agency - CRM Panel"],
  description: "",
  summary: "Get agency profile ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {},
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

const updateAgencyProfile = {
  tags: ["Agency - CRM Panel"],
  description: "",
  summary: "Update agency profile ",
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
            first_name: {
              type: "string",
              description: "Enter first name",
              required: true,
            },
            last_name: {
              type: "string",
              description: "Enter last name",
              required: true,
            },
            contact_number: {
              type: "string",
              description: "Enter contact number",
              required: true,
            },
            address: {
              type: "string",
              description: "Enter address",
              required: true,
            },
            city: {
              type: "string",
              description: "Enter city",
              required: true,
            },
            company_name: {
              type: "string",
              description: "Enter company name ",
              required: true,
            },
            company_website: {
              type: "string",
              description: "Enter Company Website",
              required: true,
            },
            country: {
              type: "string",
              description: "Enter country",
              required: true,
            },
            industry: {
              type: "string",
              description: "Enter industry",
              required: true,
            },
            no_of_people: {
              type: "string",
              description: "Enter No of people",
              required: true,
            },
            pincode: {
              type: "number",
              description: "Enter Pin code",
              required: true,
            },
            state: {
              type: "string",
              description: "Enter state name",
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

const getDashboard = {
  tags: ["Dashboard"],
  description: "",
  summary: "Dashboard Data",

  responses: {
    200: {
      descripition: "ok",
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

const todaysTaskDashboard = {
  tags: ["Dashboard"],
  description: "",
  summary: "Todays task - Dashboard",

  responses: {
    200: {
      descripition: "ok",
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

const overdueTaskDashboard = {
  tags: ["Dashboard"],
  description: "",
  summary: "Overdue task - Dashboard",

  responses: {
    200: {
      descripition: "ok",
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

const affiliateDashboards = {
  tags: ["Dashboard"],
  description: "",
  summary: "Affiliate Agency - Dashboard",

  responses: {
    200: {
      descripition: "ok",
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

const agenciesRoutes = {
  "/api/v1/agency/create-client": {
    post: addClient,
  },
  "/api/v1/agency/clients": {
    post: clientList,
  },
  "/api/v1/agency/get-profile": {
    get: getAgencyProfile,
  },
  // "/api/v1/agency/update-profile": {
  //   put: updateAgencyProfile,
  // },
  "/api/v1/dashboard": {
    get: getDashboard,
  },
  "/api/v1/dashboard/todays-task": {
    get: todaysTaskDashboard,
  },
  "/api/v1/dashboard/overdue-task": {
    get: overdueTaskDashboard,
  },
  "/api/v1/agency/affiliate-data": {
    get: affiliateDashboards,
  },
};

module.exports = agenciesRoutes;
