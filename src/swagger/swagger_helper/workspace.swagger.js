const workspaces = {
  tags: ["Workspace - CRM Panel"],
  description: "",
  summary: "List of workspaces",
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

const workspaceCheck = {
  tags: ["Workspace - CRM Panel"],
  description: "",
  summary: "Check the workspace exist",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",

          properties: {
            workspace_name: {
              type: "string",
              required: true,
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

const workspaceRoute = {
  "/api/v1/workspace/list": { get: workspaces },
  "/api/v1/workspace/workspace-check": { post: workspaceCheck },
};

module.exports = workspaceRoute;
