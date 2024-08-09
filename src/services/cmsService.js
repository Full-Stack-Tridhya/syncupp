const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  paginationObject,
  inquiryEmail,
  returnMessage,
} = require("../utils/utils");
const sendEmail = require("../helpers/sendEmail");
const Price_Plan = require("../models/cms/priceSchema");
const Privacy_Policy = require("../models/cms/privacyPolicySchema");
const Contact_Us = require("../models/cms/contactUsSchema");
const Technology_Stack = require("../models/cms/technologyStackSchema");
const AdminFqa = require("../models/adminFaqSchema");
const About_Us = require("../models/cms/aboutUsSchema");
const cancellation_and_Refund = require("../models/cms/refundSchema");
const Shipping_and_Delivery = require("../models/cms/ShippingandDeliverySchems");
const Feature = require("../models/cms/featureSchema");
const Home = require("../models/cms/homeSchema");

class cmsService {
  updateContactUs = async (payload) => {
    try {
      const { description } = payload;
      const contactDetailCrm = await Contact_Us.findOne({});

      await Contact_Us.findOneAndUpdate(
        {
          _id: contactDetailCrm._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );

      return true;
    } catch (error) {
      console.log(error);
      logger.error(`Error while update Contact Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getContactUs = async () => {
    try {
      const contactDetail = await Contact_Us.findOne({});
      return contactDetail;
    } catch (error) {
      console.log(error);
      logger.error(`Error while get Contact Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Update Policy

  updatePrivacyPolicy = async (payload) => {
    try {
      const { description } = payload;

      const policy = await Privacy_Policy.findOne({});

      await Privacy_Policy.findOneAndUpdate(
        {
          _id: policy._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );
      return true;
    } catch (error) {
      logger.error(`Error while add policy CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getPrivacyPolicy = async () => {
    try {
      const policy = await Privacy_Policy.findOne({});

      return policy;
    } catch (error) {
      logger.error(`Error while Get policy CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Update Plan

  updatePricePlan = async (payload) => {
    try {
      const { description } = payload;

      const plan = await Price_Plan.findOne({});

      await Price_Plan.findOneAndUpdate(
        {
          _id: plan._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );
      return true;
    } catch (error) {
      logger.error(`Error while add new plan CMS : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
  // Get Plan

  getPricePlan = async () => {
    try {
      const plan = await Price_Plan.findOne({});
      return plan;
    } catch (error) {
      logger.error(`Error while Get plan CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Update Technology Stack

  updateTechnologyStack = async (payload) => {
    try {
      const { description } = payload;
      const technology = await Technology_Stack.findOne({});

      await Technology_Stack.findOneAndUpdate(
        {
          _id: technology._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );
      return true;
    } catch (error) {
      logger.error(`Error while update technologyStack CMS : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get Plan

  getTechnologyStack = async () => {
    try {
      const technologyStack = await Technology_Stack.findOne({});
      return technologyStack;
    } catch (error) {
      logger.error(`Error while get technologyStack CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // GET All FQA CMS
  getAllFaqCms = async () => {
    try {
      const faqs = await AdminFqa.find({ is_deleted: false });
      return faqs;
    } catch (error) {
      logger.error(`Error while Admin FQA  CMS Listing, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
  //About Us
  updateAboutUs = async (payload) => {
    try {
      const { description } = payload;
      const aboutDetailCrm = await About_Us.findOne({});

      await About_Us.findOneAndUpdate(
        {
          _id: aboutDetailCrm._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );

      return true;
    } catch (error) {
      console.log(error);
      logger.error(`Error while update About Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getAboutUs = async () => {
    try {
      const aboutUsDetail = await About_Us.findOne({});
      return aboutUsDetail;
    } catch (error) {
      console.log(error);
      logger.error(`Error while get About Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getcancellationAndRefund = async () => {
    try {
      const aboutUsDetail = await cancellation_and_Refund.findOne({});
      return aboutUsDetail;
    } catch (error) {
      console.log(error);
      logger.error(`Error while get About Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  updatecancellationAndRefund = async (payload) => {
    try {
      const { description } = payload;
      const aboutDetailCrm = await cancellation_and_Refund.findOne({});
      // await cancellation_and_Refund.create({ description });

      await cancellation_and_Refund.findOneAndUpdate(
        {
          _id: aboutDetailCrm._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );

      return true;
    } catch (error) {
      console.log(error);
      logger.error(`Error while update About Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getShippingandDelivery = async () => {
    try {
      const aboutUsDetail = await Shipping_and_Delivery.findOne({});
      return aboutUsDetail;
    } catch (error) {
      console.log(error);
      logger.error(`Error while get About Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
  updateShippingandDelivery = async (payload) => {
    try {
      const { description } = payload;
      const aboutDetailCrm = await Shipping_and_Delivery.findOne({});

      await Shipping_and_Delivery.findOneAndUpdate(
        {
          _id: aboutDetailCrm._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );

      return true;
    } catch (error) {
      console.log(error);
      logger.error(`Error while update About Us CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getFeature = async () => {
    try {
      const feature = await Feature.findOne({});
      return feature;
    } catch (error) {
      console.log(error);
      logger.error(`Error while get feature CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
  updateFeature = async (payload) => {
    try {
      const { description } = payload;
      const feature = await Feature.findOne({});
      await Feature.findOneAndUpdate(
        {
          _id: feature._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );

      return true;
    } catch (error) {
      console.log(error);
      logger.error(`Error while update feature CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  updateHome = async (payload) => {
    try {
      const { description } = payload;
      const feature = await Home.findOne({});

      await Home.findOneAndUpdate(
        {
          _id: feature._id,
        },
        { description },
        { new: true, useFindAndModify: false }
      );

      return true;
    } catch (error) {
      console.log(error);
      logger.error(`Error while update home CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getHome = async (payload) => {
    try {
      const home = await Home.findOne({});
      return home;
    } catch (error) {
      console.log(error);
      logger.error(`Error while Get home CRM : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = cmsService;
