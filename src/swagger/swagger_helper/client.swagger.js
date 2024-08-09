const getClientProfile = {
  tags: ["Client - CRM Panel"],
  description: "",
  summary: "Get client profile",
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

const getClientAgencies = {
  tags: ["Client - CRM Panel"],
  description: "",
  summary: "Get client agencies",
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

const deleteTeamMember = {
  tags: ["Client - CRM Panel"],
  description:
    'Pass data like this {"teamMemberIds" : ["6597aeb9528e7bc34319c6f7" , "6597b11b248ca49192fcb7b9"]}',
  summary: "Delete Team Member of client ",
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
            teamMemberIds: {
              type: "array",
              description: "Enter team member IDS to be delete",
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

const clientRoutes = {
  "/api/v1/client": {
    get: getClientProfile,
  },
  "/api/v1/client/get-agencies": {
    get: getClientAgencies,
  },
  "/api/v1/client/delete": {
    delete: deleteTeamMember,
  },
};

module.exports = clientRoutes;
