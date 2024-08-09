const cron = require("node-cron");
const InvoiceService = require("../services/invoiceService");
const invoiceService = new InvoiceService();
const TaskService = require("../services/taskService");
const PaymentService = require("../services/paymentService");
const taskService = new TaskService();
const ActivityService = require("../services/activityService");
const activityService = new ActivityService();
const Configuration = require("../models/configurationSchema");
const paymentService = new PaymentService();

exports.setupNightlyCronJob = async () => {
  const config = await Configuration.findOne({}).lean();

  // For Meeting Alert
  const call_meeting_alert_check_rate =
    config?.cron_job.call_meeting_alert_check_rate;
  cron.schedule(call_meeting_alert_check_rate, async () => {
    activityService.meetingAlertCronJob();
  });

  // For invoice overdue
  const invoiceCronSchedule = config?.cron_job?.invoice_overdue;
  cron.schedule(invoiceCronSchedule, () => {
    console.log("Running the nightly cron job for invoice...");
    invoiceService.overdueCronJob();
  });

  // For task overdue
  const taskOverdueCronSchedule = config?.cron_job.task_overdue;
  cron.schedule(taskOverdueCronSchedule, () => {
    console.log("Running the nightly cron job activity...");
    taskService.overdueCronJob();
  });

  // For Task Due Date Alert
  const taskDueDateCronSchedule = config?.cron_job.task_dueDate;
  cron.schedule(taskDueDateCronSchedule, () => {
    console.log("Running the nightly cron job activity for due date...");
    taskService.dueDateCronJob();
  });

  const payment_cron_schedule = config?.cron_job?.payment;
  cron.schedule(payment_cron_schedule, () => {
    console.log(
      "Running the nightly cron job to expire the subscription and ..."
    );
    paymentService.cronForSubscription();
    paymentService.cronForFreeTrialEnd();
    paymentService.cronJobToExpireManualPayment();
  });

  // After Expire alert
  const afterExpireAlert = config?.cron_job.after_expire_alert_time;
  cron.schedule(afterExpireAlert, () => {
    paymentService.afterExpiryAlert();
  });
};
