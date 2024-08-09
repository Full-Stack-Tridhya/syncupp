const registerUser = {
  tags: ["CRM Panel"],
  description: "",
  summary: "User registration.",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
              required: true,
            },
            affiliate_referral_code: {
              type: "string",
              descripition: "Enter referral code",
            },
            referral_code: {
              type: "string",
              descripition: "Enter affiliate referral code",
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

const signupComplete = {
  tags: ["CRM Panel"],
  description: "",
  summary: "User complete the signup.",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
              required: true,
            },
            first_name: {
              type: "string",
              descripition: "Enter your first name",
              required: true,
            },
            last_name: {
              type: "string",
              descripition: "Enter your last name",
              required: true,
            },
            password: {
              type: "string",
              descripition: "Enter your password",
              required: true,
            },
            contact_number: {
              type: "string",
              descripition: "Enter your contact number",
            },
            no_of_people: {
              type: "string",
              descripition: "Enter no of people",
            },
            profession_role: {
              type: "string",
              descripition: "Enter professional role",
            },
            workspace_name: {
              type: "string",
              descripition: "Enter workspace name.",
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

const checkContactunique = {
  tags: ["CRM Panel"],
  description: "",
  summary: "Check for the contact number is unique.",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
              required: true,
            },
            contact_number: {
              type: "string",
              descripition: "Enter contact number",
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

const getEmailDetails = {
  tags: ["CRM Panel"],
  description: "",
  summary: "Get the Email details.",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
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

const googleSignIn = {
  tags: ["CRM Panel"],
  description: "Agency Google SignIn",
  summary: "Agency Google SignIn",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            signupId: {
              type: "string",
              descripition: "Enter your token",
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

const facebookSignIn = {
  tags: ["CRM Panel"],
  description: "Agency Facebook SignIn",
  summary: "Agency Facebook SignIn",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            access_token: {
              type: "string",
              descripition: "Enter your token",
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

const login = {
  tags: ["CRM Panel"],
  description: "CRM login",
  summary: "CRM login",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
              required: true,
            },
            password: {
              type: "string",
              descripition: "Enter your password",
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

const forgotPassword = {
  tags: ["CRM Panel"],
  description: "CRM forgot password",
  summary: "CRM forgot password",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
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

const resetPassword = {
  tags: ["CRM Panel"],
  description: "CRM reset password",
  summary: "CRM reset password",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              descripition: "Enter your email",
              required: true,
            },
            password: {
              type: "string",
              descripition: "Enter your password",
              required: true,
            },
            token: {
              type: "string",
              descripition: "Enter your token",
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

const changePassword = {
  tags: ["CRM Panel"],
  description: "CRM change password",
  summary: "CRM change password",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            old_password: {
              type: "string",
              descripition: "Enter your old password",
              required: true,
            },
            new_password: {
              type: "string",
              descripition: "Enter your new password",
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

const countriesList = {
  tags: ["Master table - CRM Panel"],
  description: "",
  summary: "Get all Countries",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
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

const statesList = {
  tags: ["Master table - CRM Panel"],
  description: "",
  summary: "Get all states",
  parameters: [
    {
      name: "countryId",
      in: "path",
      description: "provide the country id",
      required: true,
    },
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
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

const citiesList = {
  tags: ["Master table - CRM Panel"],
  description: "",
  summary: "Get all cities",
  parameters: [
    {
      name: "stateId",
      in: "path",
      description: "provide the state id",
      required: true,
    },
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
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

const getProfile = {
  tags: ["CRM Panel"],
  description: "",
  summary: "Get profile",
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

const updateProfile = {
  tags: ["CRM Panel"],
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
              description: "Enter city id",
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
              description: "Enter country id",
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
              description: "Enter state Id",
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

const checkSubscriptionHalt = {
  tags: ["CRM Panel"],
  description: "",
  summary: "Get Subscription halt details",
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

const workspaceChange = {
  tags: ["CRM Panel"],
  description: "",
  summary: "Change workspace.",
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
            workspace_id: {
              type: "string",
              descripition: "Add workspace id",
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

const authRoutes = {
  "/api/v1/auth/signup": {
    post: registerUser,
  },
  "/api/v1/auth/signup-complete": {
    patch: signupComplete,
  },
  "/api/v1/auth/contact-unique": {
    post: checkContactunique,
  },
  "/api/v1/auth/email-check": {
    post: getEmailDetails,
  },
  "/api/v1/auth/google-signup": {
    post: googleSignIn,
  },
  "/api/v1/auth/facebook-signup": {
    post: facebookSignIn,
  },
  "/api/v1/auth/login": {
    post: login,
  },
  "/api/v1/auth/forgot-password": {
    post: forgotPassword,
  },
  "/api/v1/auth/reset-password": {
    post: resetPassword,
  },
  "/api/v1/auth/change-password": {
    post: changePassword,
  },
  "/api/v1/auth/countries": {
    post: countriesList,
  },
  "/api/v1/auth/states/{countryId}": {
    post: statesList,
  },
  "/api/v1/auth/cities/{stateId}": {
    post: citiesList,
  },
  "/api/v1/auth/profile": {
    get: getProfile,
  },
  "/api/v1/auth/update-profile": {
    patch: updateProfile,
  },
  "/api/v1/auth/subscription-halt": {
    get: checkSubscriptionHalt,
  },
  "/api/v1/auth/change-workspace": {
    post: workspaceChange,
  },
};

module.exports = authRoutes;
