const referralStat = {
  tags: ["Referral - CRM Panel"],
  description: "",
  summary: "Get referral stats for the agency",
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

const referralRoute = {
  "/api/v1/referral/stats": {
    get: referralStat,
  },
};

module.exports = referralRoute;
