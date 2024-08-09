const loginTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description: "",
  summary: "Login team Member ",
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
            email: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
            password: {
              type: "string",
              description: "Enter password",
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

/* const verifyTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description: "",
  summary: "Team Member Verify Password ",
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
            email: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
            first_name: {
              type: "string",
              description: "Enter first_name",
              required: true,
            },
            last_name: {
              type: "string",
              description: "Enter last_name",
              required: true,
            },
            token: {
              type: "string",
              description: "Enter token",
              required: true,
            },
            password: {
              type: "string",
              description: "Enter password",
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
}; */

const verifyTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description: "",
  summary: "Verify workspace member ",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",

          properties: {
            email: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
            token: {
              type: "string",
              description: "Enter token",
              required: true,
            },
            workspace: {
              type: "string",
              description: "Enter workspace id",
              required: true,
            },
            accept: {
              type: "boolean",
              required: true,
              default: true,
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

const addTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description: "",
  summary: "Add the team member to the workspace.",
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
            email: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
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
            },
            role: {
              type: "string",
              description: "Enter role",
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

const getTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description: "",
  summary: "Get team member ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: "id",
      in: "path", // or "query" depending on your use case
      description: "ID of the team member",
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

const getAllTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description:
    "For Agency \n\n\n- sortOrder: (asc, desc)\n- sortField: (name, email, contact_number  ,member_role  ,createdAt)\n- search : (string)\n- page: (number)\n- itemsPerPage: (number)",
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
            filter: {
              type: "object",

              properties: {
                status: {
                  type: "string",
                  description: "Enter status value.",
                },
                date: {
                  type: "object",
                  properties: {
                    start_date: { type: "date", default: "DD-MM-YYYY" },
                    end_date: { type: "date", default: "DD-MM-YYYY" },
                  },
                },
              },
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

const deleteTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description:
    'Pass data like this {"teamMemberIds" : ["6597aeb9528e7bc34319c6f7" , "6597b11b248ca49192fcb7b9"]}',
  summary: "Delete Team Member ",
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

const editTeamMember = {
  tags: ["Team Member - CRM Panel"],
  description: "",
  summary: "Edit Team Member ",
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
            name: {
              type: "string",
              description: "Enter name",
              required: true,
            },
            contact_number: {
              type: "string",
              description: "Enter contact number",
              required: true,
            },

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
          },
        },
      },
    },
  },
  parameters: [
    {
      name: "id",
      in: "path", // or "query" depending on your use case
      description: "ID of the team member",
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

const teamMembersRoutes = {
  "/api/v1/team-member/login": {
    post: loginTeamMember,
  },
  "/api/v1/team-member/verify": {
    post: verifyTeamMember,
  },

  "/api/v1/team-member/add": {
    post: addTeamMember,
  },

  "/api/v1/team-member/get-all": {
    post: getAllTeamMember,
  },
  "/api/v1/team-member/details/{id}": {
    get: getTeamMember,
  },
  "/api/v1/team-member/delete": {
    delete: deleteTeamMember,
  },
  "/api/v1/team-member/edit/{id}": {
    put: editTeamMember,
  },

  "/api/v1/client/team-member/add": {
    post: addTeamMember,
  },
  "/api/v1/client/team-member/get-all": {
    post: getAllTeamMember,
  },
  "/api/v1/client/team-member/details/{id}": {
    get: getTeamMember,
  },
  "/api/v1/client/team-member/delete/{id}": {
    delete: deleteTeamMember,
  },
  "/api/v1/client/team-member/edit/{id}": {
    put: editTeamMember,
  },
};

module.exports = teamMembersRoutes;
