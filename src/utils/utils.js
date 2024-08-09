const { throwError } = require("../helpers/errorUtil");
const engMessage = require("../messages/english.json");
const notificationMessage = require("../messages/notification.json");
const cheerio = require("cheerio");
const colorsData = require("../messages/colors.json");
const colors = colorsData.colors;
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const { parsePhoneNumber } = require("libphonenumber-js");

exports.returnMessage = (module, key, language = "en") => {
  return engMessage[module][key];
};

exports.returnNotification = (module, key, subKey) => {
  const moduleData = notificationMessage[module];

  if (moduleData) {
    const keyData = moduleData[key];

    if (keyData) {
      if (subKey !== undefined && keyData.hasOwnProperty(subKey)) {
        return keyData[subKey];
      } else {
        return keyData;
      }
    }
  }
  return undefined;
};

// this function is used to get the member detail from the workspace memebers
exports.memberDetail = (user) => {
  return user?.workspace_detail?.members?.find(
    (member) =>
      member?.user_id?.toString() === user?._id?.toString() &&
      member?.status === "confirmed"
  );
};

exports.replaceFields = (inputString, replacements) => {
  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`\\$\\{${key}\\}`, "g");
    inputString = inputString?.replace(pattern, value);
  }
  return inputString;
};

exports.extractTextFromHtml = (htmlString) => {
  const $ = cheerio.load(htmlString);
  return $("body").text();
};

exports.validateEmail = (email) => {
  // email validator from https://github.com/manishsaraan/email-validator/blob/master/index.js
  const regex =
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

  if (!email) return false;
  const email_parts = email.split("@");

  if (email_parts.length !== 2) return false;

  const account = email_parts[0];
  const address = email_parts[1];

  if (account.length > 64) return false;
  else if (address.length > 255) return false;

  const domainParts = address.split(".");

  if (
    domainParts.some((part) => {
      return part.length > 63;
    })
  )
    return false;

  return regex.test(email);
};

exports.passwordValidation = (password) => {
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;

  return passwordRegex.test(password);
};

exports.capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string?.charAt(0).toUpperCase() + string?.slice(1);
};

exports.lowercaseFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toLowerCase() + string.slice(1);
};

exports.formatPhoneNumber = (phoneNumber) => {
  // Parse the phone number without a default country code
  try {
    const phoneNumberObj = parsePhoneNumber(phoneNumber);
    return phoneNumberObj.formatInternational();
  } catch {
    return "";
  }
};

exports.validateRequestFields = (payload, fields) => {
  for (const field of fields) {
    if (!payload[field] || payload[field] == " ") {
      switch (field) {
        case "title":
          return throwError(`Title is required.`);
        case "workspace":
          return throwError(`Workspace is required.`);
        case "token":
          return throwError(`Invitation token is required.`);
        case "agenda":
          return throwError(`Agency is required.`);
        case "due_time":
          return throwError(`Due time is required.`);
        case "due_date":
          return throwError(`Due date is required.`);
        case "contact_number":
          return throwError(`Contact number is required.`);
        case "token":
          return throwError(`Token is required.`);
        case "first_name":
          return throwError(`First name is required.`);
        case "last_name":
          return throwError(`Last name is required.`);
        case "company_name":
          return throwError(`Company name is required.`);
        case "password":
          return throwError(`Password is required.`);
        case "email":
          return throwError(`Email is required.`);
        case "agency_id":
          return throwError(`Agency detail is required.`);
        case "workspace_id":
          return throwError(`Workspace id is required.`);
        case "address":
          return throwError(`Address is required.`);
      }
    }
  }
  return;
};

exports.templateMaker = (file_name, payload) => {
  payload.year = moment().format("YYYY");
  const templateData = fs.readFileSync(
    path.join(__dirname, "templates", file_name),
    "utf-8"
  );
  return ejs.render(templateData, payload);
};

exports.agrementEmail = (data) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    style="font-family: arial, 'helvetica neue', helvetica, sans-serif"
  >
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Syncupp Invoice</title>
      <!--[if (mso 16)]>
        <style type="text/css">
          a {
            text-decoration: none;
          }
        </style>
      <![endif]-->
      <!--[if gte mso 9
        ]><style>
          sup {
            font-size: 100% !important;
          }
        </style><!
      [endif]-->
      <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG></o:AllowPNG>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <link
        href="https://fonts.googleapis.com/css2?family=Imprima&display=swap"
        rel="stylesheet"
      />
      <!--<![endif]-->
      <style type="text/css">
        #outlook a {
          padding: 0;
        }
  
        .es-button {
          mso-style-priority: 100 !important;
          text-decoration: none !important;
        }
  
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }
  
        .es-desk-hidden {
          display: none;
          float: left;
          overflow: hidden;
          width: 0;
          max-height: 0;
          line-height: 0;
          mso-hide: all;
        }
  
        [data-ogsb] .es-button {
          border-width: 0 !important;
          padding: 15px 20px 15px 20px !important;
        }
  
        @media only screen and (max-width: 600px) {
          p,
          ul li,
          ol li,
          a {
            line-height: 150% !important;
          }
  
          h1,
          h2,
          h3,
          h1 a,
          h2 a,
          h3 a {
            line-height: 120%;
          }
  
          h1 {
            font-size: 30px !important;
            text-align: left;
          }
  
          h2 {
            font-size: 24px !important;
            text-align: left;
          }
  
          h3 {
            font-size: 20px !important;
            text-align: left;
          }
  
          .es-header-body h1 a,
          .es-content-body h1 a,
          .es-footer-body h1 a {
            font-size: 30px !important;
            text-align: left;
          }
  
          .es-header-body h2 a,
          .es-content-body h2 a,
          .es-footer-body h2 a {
            font-size: 24px !important;
            text-align: left;
          }
  
          .es-header-body h3 a,
          .es-content-body h3 a,
          .es-footer-body h3 a {
            font-size: 20px !important;
            text-align: left;
          }
  
          .es-menu td a {
            font-size: 14px !important;
          }
  
          .es-header-body p,
          .es-header-body ul li,
          .es-header-body ol li,
          .es-header-body a {
            font-size: 14px !important;
          }
  
          .es-content-body p,
          .es-content-body ul li,
          .es-content-body ol li,
          .es-content-body a {
            font-size: 14px !important;
          }
  
          .es-footer-body p,
          .es-footer-body ul li,
          .es-footer-body ol li,
          .es-footer-body a {
            font-size: 14px !important;
          }
  
          .es-infoblock p,
          .es-infoblock ul li,
          .es-infoblock ol li,
          .es-infoblock a {
            font-size: 12px !important;
          }
  
          *[class="gmail-fix"] {
            display: none !important;
          }
  
          .es-m-txt-c,
          .es-m-txt-c h1,
          .es-m-txt-c h2,
          .es-m-txt-c h3 {
            text-align: center !important;
          }
  
          .es-m-txt-r,
          .es-m-txt-r h1,
          .es-m-txt-r h2,
          .es-m-txt-r h3 {
            text-align: right !important;
          }
  
          .es-m-txt-l,
          .es-m-txt-l h1,
          .es-m-txt-l h2,
          .es-m-txt-l h3 {
            text-align: left !important;
          }
  
          .es-m-txt-r img,
          .es-m-txt-c img,
          .es-m-txt-l img {
            display: inline !important;
          }
  
          .es-button-border {
            display: block !important;
          }
  
          a.es-button,
          button.es-button {
            font-size: 18px !important;
            display: block !important;
            border-right-width: 0px !important;
            border-left-width: 0px !important;
            border-top-width: 15px !important;
            border-bottom-width: 15px !important;
          }
  
          .es-adaptive table,
          .es-left,
          .es-right {
            width: 100% !important;
          }
  
          .es-content table,
          .es-header table,
          .es-footer table,
          .es-content,
          .es-footer,
          .es-header {
            width: 100% !important;
            max-width: 600px !important;
          }
  
          .es-adapt-td {
            display: block !important;
            width: 100% !important;
          }
  
          .adapt-img {
            width: 100% !important;
            height: auto !important;
          }
  
          .es-m-p0 {
            padding: 0px !important;
          }
  
          .es-m-p0r {
            padding-right: 0px !important;
          }
  
          .es-m-p0l {
            padding-left: 0px !important;
          }
  
          .es-m-p0t {
            padding-top: 0px !important;
          }
  
          .es-m-p0b {
            padding-bottom: 0 !important;
          }
  
          .es-m-p20b {
            padding-bottom: 20px !important;
          }
  
          .es-mobile-hidden,
          .es-hidden {
            display: none !important;
          }
  
          tr.es-desk-hidden,
          td.es-desk-hidden,
          table.es-desk-hidden {
            width: auto !important;
            overflow: visible !important;
            float: none !important;
            max-height: inherit !important;
            line-height: inherit !important;
          }
  
          tr.es-desk-hidden {
            display: table-row !important;
          }
  
          table.es-desk-hidden {
            display: table !important;
          }
  
          td.es-desk-menu-hidden {
            display: table-cell !important;
          }
  
          .es-menu td {
            width: 1% !important;
          }
  
          table.es-table-not-adapt,
          .esd-block-html table {
            width: auto !important;
          }
  
          table.es-social {
            display: inline-block !important;
          }
  
          table.es-social td {
            display: inline-block !important;
          }
  
          .es-desk-hidden {
            display: table-row !important;
            width: auto !important;
            overflow: visible !important;
            max-height: inherit !important;
          }
        }
      </style>
    </head>
  
    <body
      data-new-gr-c-s-loaded="14.1098.0"
      style="
        width: 100%;
        font-family: arial, 'helvetica neue', helvetica, sans-serif;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        padding: 0;
        margin: 0;
      "
    >
      <div class="es-wrapper-color" style="background-color: #ffffff">
        <!--[if gte mso 9]>
          <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
            <v:fill type="tile" color="#ffffff"></v:fill>
          </v:background>
        <![endif]-->
        <table
          class="es-wrapper"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            border-collapse: collapse;
            border-spacing: 0px;
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            background-repeat: repeat;
            background-position: center top;
            background-color: #ffffff;
          "
        >
          <tr>
            <td valign="top" style="padding: 0; margin: 0">
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#560082"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        border-radius: 20px;
                        width: 600px;
  
                        margin-top: 20px;
                      "
                    >
                      <tr>
                        <td align="left" style="padding: 0; margin: 0">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 560px"
                              >
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  bgcolor="#fafafa"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: separate;
                                    border-spacing: 0px;
                                    background-color: #fafafa;
                                    border-radius: 10px;
                                  "
                                  role="presentation"
                                >
                                  <tr>
                                    <td
                                      align="center"
                                      style="padding: 0px; margin: 0"
                                    >
                                      <table
                                        bgcolor="#ffefc4"
                                        class="es-content-body"
                                        align="center"
                                        cellpadding="0"
                                        cellspacing="0"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                          background-color: #31276F;
                                          border-radius: 20px 20px 0px 0px;
                                          width: 600px;
                                          padding: 20px;
                                          text-align: center;
                                          margin-bottom: 10px;
                                        "
                                      >
                                        <tr>
                                          <td
                                            align="center"
                                            style="padding: 10px"
                                          >
                                            <a
                                              target="_blank"
                                              href="${data?.REACT_APP_URL}"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #2d3142;
                                                font-size: 14px;
                                              "
                                              ><img
                                                src="${
                                                  data?.SERVER_URL
                                                }/template/logo.png"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                                height="60"
                                            /></a>
                                          </td>
                                        </tr>
                                      </table>
  
                                      <h3
                                        style="
                                          margin: 0;
                                          line-height: 34px;
                                          mso-line-height-rule: exactly;
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          font-size: 24px;
                                          font-style: normal;
                                          font-weight: bold;
                                          color: #111318;
                                          text-align: left;
                                          padding: 0 20px;
                                          text-transform: capitalize;
                                        "
                                      >
                                        ${data?.title}
                                      </h3>
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        bgcolor="#fafafa"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: separate;
                                          border-spacing: 0px;
                                          background-color: #fafafa;
                                          border-radius: 10px;
                                          padding: 0 20px;
                                          color: #111318;
                                        "
                                        role="presentation"
                                      >
                                        <tr>
                                          <td
                                            align="left"
                                            style="
                                              padding-top: 10px;
                                              font-weight: 600;
                                              font-size: 14px;
                                            "
                                          >
                                            ${data?.dueDate}
                                          </td>
                                        </tr>
                                   
                                      </table>
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        style="
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: separate;
                                          border-spacing: 0px;
  
                                          border-radius: 10px;
                                          padding: 10px;
                                          margin-top: 20px;
                                        "
                                        role="presentation"
                                      >
                                        <tr
                                          style="
                                            border-bottom: 1px solid #fafafa;
                                            padding: 0 20px;
                                          "
                                        >
                                          <td
                                            align="left"
                                            style="
                                              padding-top: 10px;
                                              font-weight: 400;
                                              font-size: 12px;
                                              text-overflow: ellipsis;
                                              vertical-align: top;
                                              padding: 0 10px;
                                              border-collapse: collapse;
                                              word-break: break-all;
                                                                                        color: #111318;

                                            "
                                          >
                                          <p style="word-wrap: break-word">${
                                            data?.content
                                          }</p>
                                                                                  <!-- <p>
                                              Lorem ipsum dolor sit, amet
                                              consectetur adipisicing elit. Quia
                                              incidunt sit in laborum error
                                              aperiam numquam porro veniam
                                              deserunt sint, dolorem, animi quae
                                              illum a qui, ipsum possimus.
                                              Praesentium, veritatis.
                                            </p> -->
                                          </td>
                                          <td
                                            align="left"
                                            style="
                                              padding-top: 10px;
                                              font-weight: 400;
                                              font-size: 12px;
                                              text-overflow: ellipsis;
                                              vertical-align: top;
                                            "
                                          ></td>
                                        </tr>
                                      </table>
  
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        bgcolor="#fafafa"
                                        style="
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: separate;
                                          border-spacing: 0px;
                                          background-color: #f3f3f3;
  
                                          padding: 10px;
                                          margin-top: 20px;
                                          font-size: 14px;
                                                                                    color: #111318;

                                        "
                                        role="presentation"
                                      >
                                        <tr>
                                          <th style="text-align: left">
                                            Receiver
                                          </th>
                                          <th
                                            style="border-left: 1px solid black"
                                          ></th>
                                          <th
                                            style="text-align: left; float: right"
                                          >
                                            Sender
                                          </th>
                                        </tr>
                                        <tr>
                                          <td>
                                            <ul
                                              style="
                                                list-style: none;
                                                padding-left: 0;
                                              "
                                            >
                                              <li style="text-transform: capitalize;"> ${
                                                data?.receiverName ?? "-"
                                              }</li>
                                              <li                                            color: #111318;
>${data?.receiverEmail ?? "-"}</li>
                                              <li>${
                                                data?.receiverNumber ?? "-"
                                              }</li>
                                            </ul>
                                          </td>
                                          <td
                                            style="border-left: 1px solid black"
                                          ></td>
                                          <td
                                            style="
                                              float: right;
                                              text-align: right;
                                            "
                                          >
                                            <ul
                                              style="
                                                list-style: none;
                                                padding-left: 0;
                                              "
                                            >
                                              <li style ="text-transform: capitalize;">${
                                                data?.senderName
                                              }</li>
                                              <li                                            color: #111318;
>${data?.senderEmail}</li>
                                              <li>${data?.senderNumber}</li>
                                            </ul>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#ffefc4"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #31276F;
                        border-radius: 0px 0px 20px 20px;
                        width: 600px;
                      "
                    >
                      <tr>
                        <td
                          class="esdev-adapt-off"
                          align="left"
                          style="
                            margin: 0;
                            padding-top: 20px;
                            padding-bottom: 20px;
                            padding-left: 40px;
                            padding-right: 40px;
                          "
                        >
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  "
                                >
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
  `;
};

exports.paginationObject = (paginationObject) => {
  const page = paginationObject?.page || 1;
  const result_per_page = paginationObject?.items_per_page || 10;
  const skip = result_per_page * (page - 1);
  const sort_order = paginationObject?.sort_order === "asc" ? 1 : -1;
  const sortField =
    paginationObject?.sort_field && paginationObject?.sort_field !== ""
      ? paginationObject?.sort_field
      : "createdAt";
  const sort = {};
  sort[sortField] = sort_order;

  return { page, skip, result_per_page, sort };
};

exports.getKeywordType = (keyword) => {
  if (!isNaN(keyword)) {
    return "number";
  } else if (Date.parse(keyword)) {
    return "date";
  } else {
    return "string";
  }
};

exports.invitationEmail = (
  link,
  username,
  invitation_text,
  privacy_policy,
  facebook,
  instagram
) => {
  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif"
>
  <head>
    <meta charset="UTF-8" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta content="telephone=no" name="format-detection" />
    <title>New message</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Imprima&display=swap"
      rel="stylesheet"
    />
    <style type="text/css">
      #outlook a {
        padding: 0;
      }
      .es-button {
        mso-style-priority: 100 !important;
        text-decoration: none !important;
      }
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }
      .es-desk-hidden {
        display: none;
        float: left;
        overflow: hidden;
        width: 0;
        max-height: 0;
        line-height: 0;
        mso-hide: all;
      }
      [data-ogsb] .es-button {
        border-width: 0 !important;
        padding: 15px 20px 15px 20px !important;
      }
      @media only screen and (max-width: 600px) {
        p,
        ul li,
        ol li,
        a {
          line-height: 150% !important;
        }
        h1,
        h2,
        h3,
        h1 a,
        h2 a,
        h3 a {
          line-height: 120%;
        }
        h1 {
          font-size: 30px !important;
          text-align: left;
        }
        h2 {
          font-size: 24px !important;
          text-align: left;
        }
        h3 {
          font-size: 20px !important;
          text-align: left;
        }
        .es-header-body h1 a,
        .es-content-body h1 a,
        .es-footer-body h1 a {
          font-size: 30px !important;
          text-align: left;
        }
        .es-header-body h2 a,
        .es-content-body h2 a,
        .es-footer-body h2 a {
          font-size: 24px !important;
          text-align: left;
        }
        .es-header-body h3 a,
        .es-content-body h3 a,
        .es-footer-body h3 a {
          font-size: 20px !important;
          text-align: left;
        }
        .es-menu td a {
          font-size: 14px !important;
        }
        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 14px !important;
        }
        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 14px !important;
        }
        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 14px !important;
        }
        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important;
        }
        *[class="gmail-fix"] {
          display: none !important;
        }
        .es-m-txt-c,
        .es-m-txt-c h1,
        .es-m-txt-c h2,
        .es-m-txt-c h3 {
          text-align: center !important;
        }
        .es-m-txt-r,
        .es-m-txt-r h1,
        .es-m-txt-r h2,
        .es-m-txt-r h3 {
          text-align: right !important;
        }
        .es-m-txt-l,
        .es-m-txt-l h1,
        .es-m-txt-l h2,
        .es-m-txt-l h3 {
          text-align: left !important;
        }
        .es-m-txt-r img,
        .es-m-txt-c img,
        .es-m-txt-l img {
          display: inline !important;
        }
        .es-button-border {
          display: block !important;
        }
        a.es-button,
        button.es-button {
          font-size: 18px !important;
          display: block !important;
          border-right-width: 0px !important;
          border-left-width: 0px !important;
          border-top-width: 15px !important;
          border-bottom-width: 15px !important;
        }
        .es-adaptive table,
        .es-left,
        .es-right {
          width: 100% !important;
        }
        .es-content table,
        .es-header table,
        .es-footer table,
        .es-content,
        .es-footer,
        .es-header {
          width: 100% !important;
          max-width: 600px !important;
        }
        .es-adapt-td {
          display: block !important;
          width: 100% !important;
        }
        .adapt-img {
          width: 100% !important;
          height: auto !important;
        }
        .es-m-p0 {
          padding: 0px !important;
        }
        .es-m-p0r {
          padding-right: 0px !important;
        }

        .es-m-p0l {
          padding-left: 0px !important;
        }

        .es-m-p0t {
          padding-top: 0px !important;
        }

        .es-m-p0b {
          padding-bottom: 0 !important;
        }

        .es-m-p20b {
          padding-bottom: 20px !important;
        }

        .es-mobile-hidden,
        .es-hidden {
          display: none !important;
        }

        tr.es-desk-hidden,
        td.es-desk-hidden,
        table.es-desk-hidden {
          width: auto !important;
          overflow: visible !important;
          float: none !important;
          max-height: inherit !important;
          line-height: inherit !important;
        }

        tr.es-desk-hidden {
          display: table-row !important;
        }

        table.es-desk-hidden {
          display: table !important;
        }

        td.es-desk-menu-hidden {
          display: table-cell !important;
        }

        .es-menu td {
          width: 1% !important;
        }

        table.es-table-not-adapt,
        .esd-block-html table {
          width: auto !important;
        }

        table.es-social {
          display: inline-block !important;
        }

        table.es-social td {
          display: inline-block !important;
        }

        .es-desk-hidden {
          display: table-row !important;
          width: auto !important;
          overflow: visible !important;
          max-height: inherit !important;
        }
      }
    </style>
  </head>

  <body
    data-new-gr-c-s-loaded="14.1098.0"
    style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    "
  >
    <div class="es-wrapper-color" style="background-color: #ffffff">
      <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
      <table
        class="es-wrapper"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        "
      >
        <tr>
          <td valign="top" style="padding: 0; margin: 0">
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-footer"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#560082"
                    class="es-footer-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        align="left"
                        style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 520px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      font-size: 0px;
                                    "
                                  >
                                    <a
                                      target="_blank"
                                      href="${process.env.REACT_APP_URL}"
                                      style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: underline;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "
                                      ><img
                                        src="${process.env.SERVER_URL}/template/logo.png"
                                        style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        "
                                        height="60"
                                    /></a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-content"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#560082"
                    class="es-content-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        align="left"
                        style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 560px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                bgcolor="#fafafa"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                "
                                role="presentation"
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 20px; margin: 0"
                                  >
                                    <h3
                                      style="
                                        margin: 0;
                                        line-height: 34px;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        font-size: 24px;
                                        font-style: normal;
                                        font-weight: bold;
                                        color: #111318;
                                        text-align: center;
                                      "
                                    >
                                      Hi <span>${username}</span>,&nbsp;
                                    </h3>
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      "
                                    >
                                      <br />
                                    </p>
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                        margin-bottom: 30px;
                                      "
                                    >
                                      ${invitation_text}
                                    </p>
                                    <a
                                      target="_blank"
                                      href="${link}"
                                      style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #560082;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #fff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      "
                                      >Join Syncupp</a
                                    >
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-content"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#ffefc4"
                    class="es-content-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        class="esdev-adapt-off"
                        align="left"
                        style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 520px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 0; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #2d3142;
                                        font-size: 16px;
                                      "
                                    >
                                      Thanks and Best Regards,<br />Have a great
                                      day!<br />Syncupp Team<a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        "
                                        href="${process.env.REACT_APP_URL}"
                                      ></a>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-footer"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#bcb8b1"
                    class="es-footer-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td align="left" style="padding: 20px; margin: 0">
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="left"
                              style="padding: 0; margin: 0; width: 560px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    class="es-m-txt-c"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                      padding-bottom: 20px;
                                      font-size: 0;
                                    "
                                  >
                                    <table
                                      cellpadding="0"
                                      cellspacing="0"
                                      class="es-table-not-adapt es-social"
                                      role="presentation"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        border-collapse: collapse;
                                        border-spacing: 0px;
                                      "
                                    >
                                      <tr>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        >
                                   
                                        </td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        >
                                       
                                        </td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        >
                                          <a
                                            target="_blank"
                                            href="${instagram}"
                                            style="
                                              -webkit-text-size-adjust: none;
                                              -ms-text-size-adjust: none;
                                              mso-line-height-rule: exactly;
                                              text-decoration: underline;
                                              color: #2d3142;
                                              font-size: 14px;
                                            "
                                            ><img
                                              src="${process.env.SERVER_URL}/template/instagram.png"
                                              alt="Ig"
                                              title="Instagram"
                                              height="24"
                                              style="
                                                display: block;
                                                border: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                              "
                                          /></a>
                                        </td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        >
                                          
                                        </td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="padding: 0; margin: 0"
                                        >
                                          <a
                                            target="_blank"
                                            href="${facebook}"
                                            style="
                                              -webkit-text-size-adjust: none;
                                              -ms-text-size-adjust: none;
                                              mso-line-height-rule: exactly;
                                              text-decoration: underline;
                                              color: #2d3142;
                                              font-size: 14px;
                                            "
                                            ><img
                                              src="${process.env.SERVER_URL}/template/facebook.png"
                                              alt="Fb"
                                              title="Facebook"
                                              height="24"
                                              style="
                                                display: block;
                                                border: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                              "
                                          /></a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 0; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 20px;
                                        color: #2d3142;
                                        font-size: 13px;
                                      "
                                    >
                                      <a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: none;
                                          color: #2d3142;
                                          font-size: 14px;
                                        "
                                        href=""
                                      ></a
                                      ><a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: none;
                                          color: #2d3142;
                                          font-size: 13px;
                                        "
                                        href="${privacy_policy}"
                                        >Privacy Policy</a
                                      >
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="center"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 20px;
                                    "
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "
                                    >
                                      Copyright &copy; 2024 Syncupp
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
  `;
};

exports.invoiceTemplate = (invoiceData) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice</title>
  </head>
  <body style="font-family: 'Arial', sans-serif; line-height: 1.4">
    <div
      class="invoice-box"
      style="
        width: 100%;
        max-width: 800px !important;
        margin: auto;
        padding: 20px;
        background-color: #fff;
      "
    >
      <table
        cellpadding="0"
        cellspacing="0"
        style="
          width: 100%;
          line-height: inherit;
          text-align: left;
          border-collapse: collapse;
        "
      >
        <tr class="top">
          <td colspan="2" style="padding-bottom: 20px">
            <table style="width: 100% !important">
              <tr>
                <td class="title" style="color: #333">
                  <h1 style="line-height: 30px; font-weight: 600">Invoice</h1>
                  <table
                    class="invoice-details"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                      padding: 0px;
                      width: 75%;
                      font-size: 16px !important;
                      line-height: 20px;
                    "
                  >
                    <tr>
                      <th style="width: 175px !important">Invoice Number</th>
                      <td
                        class="invoice-details-description"
                        style="padding-block: 4px !important"
                      >
                        ${invoiceData?.invoice_number ?? `&nbsp;`}
                      </td>
                    </tr>
                    <tr>
                      <th style="width: 175px !important">Date of Issue</th>
                      <td
                        class="invoice-details-description"
                        style="padding-block: 4px !important"
                      >
                        ${invoiceData?.invoice_date ?? `&nbsp;`}
                      </td>
                    </tr>
                    <tr>
                      <th style="width: 175px !important">Date Due</th>
                      <td
                        class="invoice-details-description"
                        style="padding-block: 4px !important"
                      >
                        ${invoiceData?.due_date ?? `&nbsp;`}
                      </td>
                    </tr>
                  </table>
                </td>
                <td
                  class="logo"
                  style="
                    text-align: center;
                    vertical-align: top !important;
                    padding-top: 22px !important;
                  "
                >
                  ${
                    invoiceData?.invoice_logo &&
                    invoiceData?.invoice_logo !== ""
                      ? `
                  <img
                    src="${invoiceData?.invoice_logo}"
                    alt=""
                    style="
                      display: block;
                      border: 0;
                      outline: none;
                      text-decoration: none;
                      -ms-interpolation-mode: bicubic;
                      max-height: 60px;
                      margin: auto;
                    "
                    height="60"
                  />`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr class="information">
          <td colspan="2" style="padding-bottom: 20px">
            <table style="width: 100% !important">
              <tr>
                <td style="vertical-align: top; width: 33.33% !important">
                  <table>
                    <thead>
                      <tr>
                        <th
                          class="from-to-labels"
                          style="margin-block: 0px !important"
                        >
                          Agency Details:
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="agency-details-list"
                      style="
                        width: 100%;
                        border-collapse: collapse;
                        text-transform: capitalize;
                      "
                    >
                      ${
                        invoiceData?.from?.agency_full_name
                          ? `
                      <tr>
                        <td>${invoiceData?.from?.agency_full_name}</td>
                      </tr>
                      `
                          : ""
                      } ${
    invoiceData?.from?.company_name
      ? `
                      <tr>
                        <td>${invoiceData?.from?.company_name + ","}</td>
                      </tr>
                      `
      : ""
  } ${
    invoiceData?.from?.address || invoiceData?.from?.city?.name
      ? `
                      <tr>
                        <td>
                          ${
                            invoiceData?.from?.address
                              ? invoiceData?.from?.address + ", "
                              : "" + invoiceData?.from?.city?.name
                              ? invoiceData?.from?.city?.name + ","
                              : ""
                          }
                        </td>
                      </tr>
                      `
      : ""
  } ${
    invoiceData?.from?.state?.name || invoiceData?.from?.country?.name
      ? `
                      <tr>
                        <td>
                          ${
                            invoiceData?.from?.state?.name
                              ? invoiceData?.from?.state?.name + ", "
                              : "" + invoiceData?.from?.country?.name
                              ? invoiceData?.from?.country?.name + ","
                              : ""
                          }
                        </td>
                      </tr>
                      `
      : ""
  } ${
    invoiceData?.from?.pincode
      ? `
                      <tr>
                        <td>${invoiceData?.from?.pincode + "."}</td>
                      </tr>
                      `
      : ""
  } ${
    invoiceData?.from?.contact_number
      ? `
                      <tr>
                        <td>${invoiceData?.from?.contact_number}</td>
                      </tr>
                      `
      : ""
  }
                    </tbody>
                  </table>
                </td>
                <td style="vertical-align: top; width: 33.33% !important"></td>
                <td style="vertical-align: top; width: 33.33% !important">
                  <table>
                    <thead>
                      <tr>
                        <th
                          class="from-to-labels"
                          style="margin-block: 0px !important"
                        >
                          Recipient:
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="agency-details-list"
                      style="
                        width: 100%;
                        border-collapse: collapse;
                        text-transform: capitalize;
                      "
                    >
                      ${
                        invoiceData?.to?.client_full_name
                          ? `
                      <tr>
                        <td>${invoiceData?.to?.client_full_name + ","}</td>
                      </tr>
                      `
                          : invoiceData?.custom_client?.name
                          ? `
                      <tr>
                        <td>${invoiceData?.custom_client?.name}</td>
                      </tr>
                      `
                          : ""
                      } ${
    !invoiceData?.custom_client
      ? `${
          invoiceData?.to?.address || invoiceData?.to?.city?.name
            ? `
                      <tr>
                        <td>
                          ${
                            invoiceData?.to?.address
                              ? invoiceData?.to?.address + ","
                              : "" + invoiceData?.to?.city?.name
                              ? invoiceData?.to?.city?.name + ","
                              : ""
                          }
                        </td>
                      </tr>
                      `
            : ""
        } ${
          invoiceData?.to?.state?.name || invoiceData?.to?.country?.name
            ? `
                      <tr>
                        <td>
                          ${
                            invoiceData?.to?.state?.name
                              ? invoiceData?.to?.state?.name + ","
                              : "" + invoiceData?.to?.country?.name
                              ? invoiceData?.to?.country?.name + ","
                              : ""
                          }
                        </td>
                      </tr>
                      `
            : ""
        } ${
          invoiceData?.to?.pincode
            ? `
                      <tr>
                        <td>${invoiceData?.to?.pincode + "."}</td>
                      </tr>
                      `
            : ""
        } ${
          invoiceData?.to?.contact_number
            ? `
                      <tr>
                        <td>${invoiceData?.to?.contact_number}</td>
                      </tr>
                      `
            : ""
        }`
      : ` ${
          invoiceData?.custom_client?.address
            ? `
                      <tr>
                        <td>${invoiceData?.custom_client?.address}</td>
                      </tr>
                      `
            : ""
        } ${
          invoiceData?.custom_client?.contact_number
            ? `
                      <tr>
                        <td>${invoiceData?.custom_client?.contact_number}</td>
                      </tr>
                      `
            : ""
        }`
  }
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table
        class="calculation-table"
        role="presentation"
        style="
          width: 100%;
          background-color: white;
          font-family: -apple-system, blinkmacsystemfont, 'segoe ui', roboto,
            helvetica, arial, sans-serif, 'apple color emoji', 'segoe ui emoji',
            'segoe ui symbol';
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 10px;
          padding: 10px;
          margin-top: 20px;
        "
      >
        <thead
          style="
            color: rgb(96, 96, 96);
            font-weight: 400;
            border-bottom: 1px solid rgb(96, 96, 96);
            text-align: left;
          "
        >
          <tr>
            <th style="font-size: 14px; font-weight: 500">Item</th>
            <th style="font-size: 14px; font-weight: 500">Descriptions</th>
            <th style="font-size: 14px; font-weight: 500">Qty</th>
            <th style="font-size: 14px; font-weight: 500">Rate</th>
            <th style="font-size: 14px; font-weight: 500">Tax</th>
            <th style="font-size: 14px; font-weight: 500">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.invoice_content
            .map(
              (item, index) => `
          <tr>
            <td
              style="
                width: 10%;
                padding-inline-start: 0px;
                padding-top: 12px;
                font-weight: 400;
                font-size: 12px;
                text-overflow: ellipsis;
                vertical-align: top;
                border-bottom: 1px solid rgb(96, 96, 96);
                padding-bottom: 12px;
                border-collapse: collapse;
              "
            >
              ${index + 1}
            </td>
            <td
              style="
                width: 50%;
                padding-inline-start: 0px;
                padding-top: 12px;
                font-weight: 400;
                font-size: 12px;
                text-overflow: ellipsis;
                vertical-align: top;
                border-bottom: 1px solid rgb(96, 96, 96);
                padding-bottom: 12px;
                border-collapse: collapse;
              "
            >
              ${
                item.description.charAt(0).toUpperCase() +
                item.description.slice(1)
              }
            </td>
            <td
              style="
                width: 10%;
                padding-inline-start: 0px;
                padding-top: 12px;
                font-weight: 400;
                font-size: 12px;
                text-overflow: ellipsis;
                vertical-align: top;
                border-bottom: 1px solid rgb(96, 96, 96);
                padding-bottom: 12px;
                border-collapse: collapse;
              "
            >
              ${item.qty}
            </td>
            <td
              style="
                width: 10%;
                padding-inline-start: 0px;
                padding-top: 12px;
                font-weight: 400;
                font-size: 12px;
                text-overflow: ellipsis;
                vertical-align: top;
                border-bottom: 1px solid rgb(96, 96, 96);
                padding-bottom: 12px;
                border-collapse: collapse;
              "
            >
              ${invoiceData?.currency_symbol} ${item.rate}
            </td>
            <td
              style="
                width: 10%;
                padding-inline-start: 0px;
                padding-top: 12px;
                font-weight: 400;
                font-size: 12px;
                text-overflow: ellipsis;
                vertical-align: top;
                border-bottom: 1px solid rgb(96, 96, 96);
                padding-bottom: 12px;
                border-collapse: collapse;
              "
            >
              ${item.tax} %
            </td>
            <td
              style="
                width: 10%;
                padding-inline-start: 0px;
                padding-top: 12px;
                font-weight: 400;
                font-size: 12px;
                text-overflow: ellipsis;
                vertical-align: top;
                border-bottom: 1px solid rgb(96, 96, 96);
                padding-bottom: 12px;
                border-collapse: collapse;
              "
            >
              ${invoiceData?.currency_symbol} ${item.amount}
            </td>
          </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <table
        class="total-calculation"
        style="width: 100% !important; padding-bottom: 100px"
      >
        <tr>
          <td>
            <table
              class="summary"
              style="
                width: 45%;
                text-align: right;
                float: right;
                list-style: none;
                margin-bottom: 60px;
                margin-inline-end: 30px;
                font-family: -apple-system, blinkmacsystemfont, 'segoe ui',
                  roboto, helvetica, arial, sans-serif, 'apple color emoji',
                  'segoe ui emoji', 'segoe ui symbol';
                font-size: 14px;
              "
            >
              <tr
                style="
                  text-align: left;
                  width: 100%;
                  padding-block: 10px;
                  border-top: 1px solid rgb(96, 96, 96) !important;
                "
              >
                <td
                  class="label"
                  style="text-align: left; width: 50%; font-weight: 500"
                >
                  Subtotal
                </td>
                <td
                  class="value"
                  style="text-align: right; width: 50%; font-weight: 600"
                >
                  ${invoiceData?.currency_symbol} ${invoiceData.sub_total}
                </td>
              </tr>
              <tr
                style="
                  text-align: left;
                  width: 100%;
                  padding-block: 10px;
                  border-top: 1px solid rgb(96, 96, 96);
                "
              >
                <td
                  class="label"
                  style="text-align: left; width: 50%; font-weight: 500"
                >
                  Total
                </td>
                <td
                  class="value"
                  style="text-align: right; width: 50%; font-weight: 600"
                >
                  ${invoiceData?.currency_symbol} ${invoiceData.total}
                </td>
              </tr>
              <tr
                style="
                  text-align: left;
                  width: 100%;
                  padding-block: 10px;
                  border-top: 1px solid rgb(96, 96, 96);
                "
              >
                <td
                  class="label"
                  style="text-align: left; width: 50%; font-weight: 500"
                >
                  Status
                </td>
                <td
                  class="value"
                  style="
                    text-align: right;
                    width: 50%;
                    font-weight: 600;
                    text-transform: capitalize;
                  "
                >
                  ${invoiceData.status}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;
};

exports.activityTemplate = (data) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif">

<head>
  <meta charset="UTF-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Syncupp Create Task</title>
  <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
  <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
  <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
  <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css2?family=Imprima&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    [data-ogsb] .es-button {
      border-width: 0 !important;
      padding: 15px 20px 15px 20px !important;
    }

    @media only screen and (max-width: 600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important;
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120%;
      }

      h1 {
        font-size: 30px !important;
        text-align: left;
      }

      h2 {
        font-size: 24px !important;
        text-align: left;
      }

      h3 {
        font-size: 20px !important;
        text-align: left;
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important;
        text-align: left;
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 24px !important;
        text-align: left;
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
        text-align: left;
      }

      .es-menu td a {
        font-size: 14px !important;
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 14px !important;
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 14px !important;
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 14px !important;
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important;
      }

      *[class="gmail-fix"] {
        display: none !important;
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important;
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important;
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important;
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important;
      }

      .es-button-border {
        display: block !important;
      }

      a.es-button,
      button.es-button {
        font-size: 18px !important;
        display: block !important;
        border-right-width: 0px !important;
        border-left-width: 0px !important;
        border-top-width: 15px !important;
        border-bottom-width: 15px !important;
      }

      .es-adaptive table,
      .es-left,
      .es-right {
        width: 100% !important;
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important;
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important;
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important;
      }

      .es-m-p0 {
        padding: 0px !important;
      }

      .es-m-p0r {
        padding-right: 0px !important;
      }

      .es-m-p0l {
        padding-left: 0px !important;
      }

      .es-m-p0t {
        padding-top: 0px !important;
      }

      .es-m-p0b {
        padding-bottom: 0 !important;
      }

      .es-m-p20b {
        padding-bottom: 20px !important;
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important;
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important;
      }

      tr.es-desk-hidden {
        display: table-row !important;
      }

      table.es-desk-hidden {
        display: table !important;
      }

      td.es-desk-menu-hidden {
        display: table-cell !important;
      }

      .es-menu td {
        width: 1% !important;
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important;
      }

      table.es-social {
        display: inline-block !important;
      }

      table.es-social td {
        display: inline-block !important;
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important;
      }
    }
  </style>
</head>

<body data-new-gr-c-s-loaded="14.1098.0" style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    ">
  <div class="es-wrapper-color" style="background-color: #ffffff">
    <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        ">
      <tr>
        <td valign="top" style="padding: 0; margin: 0">
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    ">    <tr style=>
                          <td align="center"  style="
                                padding: 0;
                                margin: 0;
                                font-size: 0px;
                                         padding-top: 20px;        
                              ">
                            <a target="_blank" href="${
                              data?.REACT_APP_URL
                            }" style="
                                  -webkit-text-size-adjust: none;
                                  -ms-text-size-adjust: none;
                                  mso-line-height-rule: exactly;
                                  text-decoration: underline;
                                  color: #2d3142;
                                  font-size: 14px;
                                "><img src="${data?.SERVER_URL}"  style="
                                    display: block;
                                    border: 0;
                                    outline: none;
                                    text-decoration: none;
                                    -ms-interpolation-mode: bicubic;
                                  " height="60" /></a>
                          </td>
                        </tr>
                  
                <tr>
                  <tr>
                    <td align="left" style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                " role="presentation">
                              <tr>
                                <td align="center" style="padding: 20px; margin: 0">
                              
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      ">
                                    <br />
                                  </p>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                        margin-bottom: 30px;
                                      ">
                                    Recent Activity :
                                    <span style="font-weight: 600;">
                                         "Call meeting"
                                      
                                    </span>

                                  </p>
                                  <table cellpadding="0" cellspacing="0" width="70%" style="
                                                              mso-table-lspace: 0pt;
                                                              mso-table-rspace: 0pt;
                                                              border-collapse: collapse;
                                                              border-spacing: 0px;
                                                              
                                                            ">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0; margin: 0; width: 400px">
                                        <table cellpadding="10" cellspacing="5" width="100%" align="center"
                                          bgcolor="#fafafa" valign="top" style="
                                                                                                      mso-table-lspace: 0pt;
                                                                                                      mso-table-rspace: 0pt;
                                                                                                      border-collapse: collapse;
                                                                                                      border-spacing: 0px;
                                                                                                      background-color: #f1f1f1;
                                                                                                      padding: 10px;
                                                                                                      border-radius: 5px;
                                                                                                      font-size: 14px;
                                                                                                    ">
                                          <tr>
                                            <td style=" border-top-left-radius: 5px;
  border-collapse: collapse;">Title :</td>
                                            <td style="
  border-collapse: collapse; font-weight: 600; max-width: 100px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap; text-transform: capitalize;">${
   data?.title ?? `&nbsp;`
 }</td>
                                          </tr>
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Agenda :</td>
                                          <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap; text-transform: capitalize;">${
    data?.agenda ? data?.agenda : "-"
  }</td>
                                        </tr>


                                    
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Assign by :</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap; text-transform: capitalize; ">${
    data?.assigned_by_name ?? `&nbsp;`
  }</td>
                                      </tr>
                                

                                      <tr>
                                        <tr>
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Assign to:</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap; text-transform: capitalize; ">${
    data?.assigned_to_name ?? `&nbsp;`
  }</td>
                                      </tr>

                                        <tr>
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Meeting Date :</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.meeting_date ?? `&nbsp;`}</td>
                                      </tr>



                                      <tr>
                                      <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Meeting start time :</td>
                                      <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.meeting_start_time ?? `&nbsp;`}</td>
                                    </tr>

                                    
                                    <tr>
                                    <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Meeting end time :</td>
                                    <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.meeting_end_time ?? `&nbsp;`}</td>
                                  </tr>
                                <tr>
                                <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Status :</td>
                                <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap; text-transform: capitalize;">${data?.status}</td>
                              </tr>
                                  
                                        
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
            border-collapse: collapse;">Recurring End Date :</td>
                                          <td style="
            border-collapse: collapse; font-weight: 600; max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;">${data?.recurring_end_date ?? `-`}</td>
                                        </tr>
                                         
                                          
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }/calendar" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #560082;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #fff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      ">View Details</a>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      ">
                                    An autogenerated alert by the system.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#ffefc4" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    ">
                  <tr>
                    <td class="esdev-adapt-off" align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="padding: 0; margin: 0">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #2d3142;
                                        font-size: 16px;
                                      ">
                                    Thanks and Best Regards,<br />Have a great
                                    day!<br />Syncupp Team<a target="_blank" style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        " href="${
                                          process.env.REACT_APP_URL
                                        }"></a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#bcb8b1" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="padding: 20px; margin: 0">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="left" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">


                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                    ">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      ">
                                  Copyright &copy; ${data?.year ?? "-"} Syncupp
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

exports.taskTemplate = (data) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif"
>
  <head>
    <meta charset="UTF-8" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta content="telephone=no" name="format-detection" />
    <title>Syncupp Create Task</title>
    <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
    <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
    <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <link
      href="https://fonts.googleapis.com/css2?family=Imprima&display=swap"
      rel="stylesheet"
    />
    <!--<![endif]-->
    <style type="text/css">
      #outlook a {
        padding: 0;
      }

      .es-button {
        mso-style-priority: 100 !important;
        text-decoration: none !important;
      }

      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }

      .es-desk-hidden {
        display: none;
        float: left;
        overflow: hidden;
        width: 0;
        max-height: 0;
        line-height: 0;
        mso-hide: all;
      }

      [data-ogsb] .es-button {
        border-width: 0 !important;
        padding: 15px 20px 15px 20px !important;
      }

      @media only screen and (max-width: 600px) {
        p,
        ul li,
        ol li,
        a {
          line-height: 150% !important;
        }

        h1,
        h2,
        h3,
        h1 a,
        h2 a,
        h3 a {
          line-height: 120%;
        }

        h1 {
          font-size: 30px !important;
          text-align: left;
        }

        h2 {
          font-size: 24px !important;
          text-align: left;
        }

        h3 {
          font-size: 20px !important;
          text-align: left;
        }

        .es-header-body h1 a,
        .es-content-body h1 a,
        .es-footer-body h1 a {
          font-size: 30px !important;
          text-align: left;
        }

        .es-header-body h2 a,
        .es-content-body h2 a,
        .es-footer-body h2 a {
          font-size: 24px !important;
          text-align: left;
        }

        .es-header-body h3 a,
        .es-content-body h3 a,
        .es-footer-body h3 a {
          font-size: 20px !important;
          text-align: left;
        }

        .es-menu td a {
          font-size: 14px !important;
        }

        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 14px !important;
        }

        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 14px !important;
        }

        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 14px !important;
        }

        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important;
        }

        *[class="gmail-fix"] {
          display: none !important;
        }

        .es-m-txt-c,
        .es-m-txt-c h1,
        .es-m-txt-c h2,
        .es-m-txt-c h3 {
          text-align: center !important;
        }

        .es-m-txt-r,
        .es-m-txt-r h1,
        .es-m-txt-r h2,
        .es-m-txt-r h3 {
          text-align: right !important;
        }

        .es-m-txt-l,
        .es-m-txt-l h1,
        .es-m-txt-l h2,
        .es-m-txt-l h3 {
          text-align: left !important;
        }

        .es-m-txt-r img,
        .es-m-txt-c img,
        .es-m-txt-l img {
          display: inline !important;
        }

        .es-button-border {
          display: block !important;
        }

        a.es-button,
        button.es-button {
          font-size: 18px !important;
          display: block !important;
          border-right-width: 0px !important;
          border-left-width: 0px !important;
          border-top-width: 15px !important;
          border-bottom-width: 15px !important;
        }

        .es-adaptive table,
        .es-left,
        .es-right {
          width: 100% !important;
        }

        .es-content table,
        .es-header table,
        .es-footer table,
        .es-content,
        .es-footer,
        .es-header {
          width: 100% !important;
          max-width: 600px !important;
        }

        .es-adapt-td {
          display: block !important;
          width: 100% !important;
        }

        .adapt-img {
          width: 100% !important;
          height: auto !important;
        }

        .es-m-p0 {
          padding: 0px !important;
        }

        .es-m-p0r {
          padding-right: 0px !important;
        }

        .es-m-p0l {
          padding-left: 0px !important;
        }

        .es-m-p0t {
          padding-top: 0px !important;
        }

        .es-m-p0b {
          padding-bottom: 0 !important;
        }

        .es-m-p20b {
          padding-bottom: 20px !important;
        }

        .es-mobile-hidden,
        .es-hidden {
          display: none !important;
        }

        tr.es-desk-hidden,
        td.es-desk-hidden,
        table.es-desk-hidden {
          width: auto !important;
          overflow: visible !important;
          float: none !important;
          max-height: inherit !important;
          line-height: inherit !important;
        }

        tr.es-desk-hidden {
          display: table-row !important;
        }

        table.es-desk-hidden {
          display: table !important;
        }

        td.es-desk-menu-hidden {
          display: table-cell !important;
        }

        .es-menu td {
          width: 1% !important;
        }

        table.es-table-not-adapt,
        .esd-block-html table {
          width: auto !important;
        }

        table.es-social {
          display: inline-block !important;
        }

        table.es-social td {
          display: inline-block !important;
        }

        .es-desk-hidden {
          display: table-row !important;
          width: auto !important;
          overflow: visible !important;
          max-height: inherit !important;
        }
      }
    </style>
  </head>

  <body
    data-new-gr-c-s-loaded="14.1098.0"
    style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    "
  >
    <div class="es-wrapper-color" style="background-color: #ffffff">
      <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
      <table
        class="es-wrapper"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        "
      >
        <tr>
          <td valign="top" style="padding: 0; margin: 0">
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-footer"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#560082"
                    class="es-footer-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        align="left"
                        style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 520px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-content"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#560082"
                    class="es-content-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276f;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    "
                  >

                      <tr style=>
                          <td align="center"  style="
                                padding: 0;
                                margin: 0;
                                font-size: 0px;
                                         padding-top: 20px;        
                              ">
                            <a target="_blank" href="${
                              data?.REACT_APP_URL
                            }" style="
                                  -webkit-text-size-adjust: none;
                                  -ms-text-size-adjust: none;
                                  mso-line-height-rule: exactly;
                                  text-decoration: underline;
                                  color: #2d3142;
                                  font-size: 14px;
                                "><img src="${data?.SERVER_URL}"  style="
                                    display: block;
                                    border: 0;
                                    outline: none;
                                    text-decoration: none;
                                    -ms-interpolation-mode: bicubic;
                                  " height="60" /></a>
                          </td>
                        </tr>
                  
                <tr>
                    <tr>
                      <td
                        align="left"
                        style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 560px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                bgcolor="#fafafa"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                "
                                role="presentation"
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 20px; margin: 0"
                                  >
                                    <h3
                                      style="
                                        margin: 0;
                                        line-height: 34px;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        font-size: 24px;
                                        font-style: normal;
                                        font-weight: bold;
                                        color: #111318;
                                        text-align: center;
                                      "
                                    >
                                      Hi
                                      <span text-transform: capitalize;
                                        >${data?.assignName}</span
                                      >,&nbsp;
                                    </h3>
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      "
                                    >
                                      <br />
                                    </p>
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                        margin-bottom: 30px;
                                      "
                                    >
                                      Recent Activity :
                                      <span
                                        style="
                                          font-weight: 600;
                                          text-transform: capitalize;
                                        "
                                        >${data?.TaskTitle}</span
                                      >
                                    </p>
                                    <table
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="70%"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        border-collapse: collapse;
                                        border-spacing: 0px;
                                      "
                                    >
                                      <tr>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            width: 400px;
                                          "
                                        >
                                          <table
                                            cellpadding="10"
                                            cellspacing="5"
                                            width="100%"
                                            align="center"
                                            bgcolor="#fafafa"
                                            valign="top"
                                            style="
                                              mso-table-lspace: 0pt;
                                              mso-table-rspace: 0pt;
                                              border-collapse: collapse;
                                              border-spacing: 0px;
                                              background-color: #f1f1f1;
                                              padding: 10px;
                                              border-radius: 5px;
                                              font-size: 14px;
                                            "
                                          >
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Task Name :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  max-width: 100px;
                                                  overflow: hidden;
                                                  text-overflow: ellipsis;
                                                  white-space: nowrap;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${data?.taskName}
                                              </td>
                                            </tr>
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Project Name :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${
                                                  data.board_name
                                                    ? data.board_name
                                                    : ""
                                                }
                                              </td>
                                            </tr>
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Status :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${data.status_name}
                                              </td>
                                            </tr>
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Priority :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${data.priority}
                                              </td>
                                            </tr>
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Created By :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${data?.assign_by}
                                              </td>
                                            </tr>
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Due Date :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${
                                                  data?.dueDate
                                                    ? `${data?.dueDate} |`
                                                    : ""
                                                }
                                                ${data?.dueTime}
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                    <a
                                      target="_blank"
                                      href="${data?.REACT_APP_URL}/${
    data.workspace_name
  }/tasks/board/${data.board_id}"
                                      style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #31276f;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #ffff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      "
                                      >View Details</a
                                    >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      "
                                    >
                                      An autogenerated alert by the system.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-content"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#ffefc4"
                    class="es-content-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276f;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        class="esdev-adapt-off"
                        align="left"
                        style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 520px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 0; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #ffff;
                                        font-size: 16px;
                                      "
                                    >
                                      Thanks and Best Regards,<br />Have a great
                                      day!<br />Syncupp Team<a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        "
                                        href="${data?.REACT_APP_URL}"
                                      ></a>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-footer"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#bcb8b1"
                    class="es-footer-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td align="left" style="padding: 20px; margin: 0">
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="left"
                              style="padding: 0; margin: 0; width: 560px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    class="es-m-txt-c"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                      padding-bottom: 20px;
                                      font-size: 0;
                                    "
                                  >
                                    <table
                                      cellpadding="0"
                                      cellspacing="0"
                                      class="es-table-not-adapt es-social"
                                      role="presentation"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        border-collapse: collapse;
                                        border-spacing: 0px;
                                      "
                                    >
                                      <tr>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        ></td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        ></td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        >
                                          <a
                                            target="_blank"
                                            href="${data?.instagram}"
                                            style="
                                              -webkit-text-size-adjust: none;
                                              -ms-text-size-adjust: none;
                                              mso-line-height-rule: exactly;
                                              text-decoration: underline;
                                              color: #2d3142;
                                              font-size: 14px;
                                            "
                                            ><img
                                              src="${
                                                data?.SERVER_URL
                                              }/template/instagram.png"
                                              alt="Ig"
                                              title="Instagram"
                                              height="24"
                                              style="
                                                display: block;
                                                border: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                              "
                                          /></a>
                                        </td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        ></td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="padding: 0; margin: 0"
                                        >
                                          <a
                                            target="_blank"
                                            href="${data?.facebook}"
                                            style="
                                              -webkit-text-size-adjust: none;
                                              -ms-text-size-adjust: none;
                                              mso-line-height-rule: exactly;
                                              text-decoration: underline;
                                              color: #2d3142;
                                              font-size: 14px;
                                            "
                                            ><img
                                              src="${
                                                data?.SERVER_URL
                                              }/template/facebook.png"
                                              alt="Fb"
                                              title="Facebook"
                                              height="24"
                                              style="
                                                display: block;
                                                border: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                              "
                                          /></a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 0; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 20px;
                                        color: #2d3142;
                                        font-size: 13px;
                                      "
                                    >
                                      <a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: none;
                                          color: #2d3142;
                                          font-size: 14px;
                                        "
                                        href=""
                                      ></a
                                      ><a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: none;
                                          color: #2d3142;
                                          font-size: 13px;
                                        "
                                        href="${data?.privacy_policy}"
                                        >Privacy Policy</a
                                      >
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="center"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 20px;
                                    "
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "
                                    >
                                  Copyright &copy; ${data?.year ?? "-"} Syncupp
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>

`;
};

exports.eventTemplate = (data) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif">

<head>
  <meta charset="UTF-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Syncupp Create Event</title>
  <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
  <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
  <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
  <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css2?family=Imprima&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    [data-ogsb] .es-button {
      border-width: 0 !important;
      padding: 15px 20px 15px 20px !important;
    }

    @media only screen and (max-width: 600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important;
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120%;
      }

      h1 {
        font-size: 30px !important;
        text-align: left;
      }

      h2 {
        font-size: 24px !important;
        text-align: left;
      }

      h3 {
        font-size: 20px !important;
        text-align: left;
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important;
        text-align: left;
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 24px !important;
        text-align: left;
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
        text-align: left;
      }

      .es-menu td a {
        font-size: 14px !important;
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 14px !important;
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 14px !important;
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 14px !important;
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important;
      }

      *[class="gmail-fix"] {
        display: none !important;
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important;
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important;
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important;
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important;
      }

      .es-button-border {
        display: block !important;
      }

      a.es-button,
      button.es-button {
        font-size: 18px !important;
        display: block !important;
        border-right-width: 0px !important;
        border-left-width: 0px !important;
        border-top-width: 15px !important;
        border-bottom-width: 15px !important;
      }

      .es-adaptive table,
      .es-left,
      .es-right {
        width: 100% !important;
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important;
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important;
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important;
      }

      .es-m-p0 {
        padding: 0px !important;
      }

      .es-m-p0r {
        padding-right: 0px !important;
      }

      .es-m-p0l {
        padding-left: 0px !important;
      }

      .es-m-p0t {
        padding-top: 0px !important;
      }

      .es-m-p0b {
        padding-bottom: 0 !important;
      }

      .es-m-p20b {
        padding-bottom: 20px !important;
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important;
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important;
      }

      tr.es-desk-hidden {
        display: table-row !important;
      }

      table.es-desk-hidden {
        display: table !important;
      }

      td.es-desk-menu-hidden {
        display: table-cell !important;
      }

      .es-menu td {
        width: 1% !important;
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important;
      }

      table.es-social {
        display: inline-block !important;
      }

      table.es-social td {
        display: inline-block !important;
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important;
      }
    }
  </style>
</head>

<body data-new-gr-c-s-loaded="14.1098.0" style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    ">
  <div class="es-wrapper-color" style="background-color: #ffffff">
    <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        ">
      <tr>
        <td valign="top" style="padding: 0; margin: 0">
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      font-size: 0px;
                                    ">
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: underline;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "><img src="${
                                        process.env.SERVER_URL
                                      }/template/logo.png" style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        " height="60" /></a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                " role="presentation">
                              <tr>
                                <td align="center" style="padding: 20px; margin: 0">
                              
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      ">
                                    <br />
                                  </p>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                        margin-bottom: 30px;
                                      ">
                                      ${data?.EventTitle ?? `&nbsp;`}
                               

                                  </p>
                                  <table cellpadding="0" cellspacing="0" width="70%" style="
                                                              mso-table-lspace: 0pt;
                                                              mso-table-rspace: 0pt;
                                                              border-collapse: collapse;
                                                              border-spacing: 0px;
                                                              
                                                            ">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0; margin: 0; width: 400px">
                                        <table cellpadding="10" cellspacing="5" width="100%" align="center"
                                          bgcolor="#fafafa" valign="top" style="
                                                                                                      mso-table-lspace: 0pt;
                                                                                                      mso-table-rspace: 0pt;
                                                                                                      border-collapse: collapse;
                                                                                                      border-spacing: 0px;
                                                                                                      background-color: #f1f1f1;
                                                                                                      padding: 10px;
                                                                                                      border-radius: 5px;
                                                                                                      font-size: 14px;
                                                                                                    ">
                                          <tr>
                                            <td style=" border-top-left-radius: 5px;
  border-collapse: collapse;">Title :</td>
                                            <td style="
  border-collapse: collapse; font-weight: 600; max-width: 100px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;">${data?.EventName ?? `&nbsp;`}</td>
                                          </tr>
                                          <tr>
                                            <td style=" border-top-left-radius: 5px;
  border-collapse: collapse;">${data?.action_type ?? `&nbsp;`} :</td>
                                            <td style="
  border-collapse: collapse; font-weight: 600; max-width: 100px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;">${data?.created_by ?? `&nbsp;`}</td>
                                          </tr>
                                          
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Agenda :</td>
                                          <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.agenda ?? `&nbsp;`}</td>
                                        </tr>


                                    

                                      

                                        <tr>
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Start Date :</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.start_date ?? `&nbsp;`}</td>
                                      </tr>



                                      <tr>
                                      <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Event start time :</td>
                                      <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.startTime ?? `&nbsp;`}</td>
                                    </tr>

                                    
                                    <tr>
                                    <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Event end time :</td>
                                    <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.endTime ?? `&nbsp;`}</td>
                                  </tr>

                                  
                                    
                               

                               
                                  
                                        
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
            border-collapse: collapse;">Recurring End Date :</td>
                                          <td style="
            border-collapse: collapse; font-weight: 600; max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;">${data?.recurring_end_date ?? `-`}</td>
                                        </tr>
                                         
                                          
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }/events" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #560082;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #fff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      ">View Details</a>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      ">
                                    An autogenerated alert by the system.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#ffefc4" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    ">
                  <tr>
                    <td class="esdev-adapt-off" align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="padding: 0; margin: 0">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #2d3142;
                                        font-size: 16px;
                                      ">
                                    Thanks and Best Regards,<br />Have a great
                                    day!<br />Syncupp Team<a target="_blank" style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        " href="${
                                          process.env.REACT_APP_URL
                                        }"></a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#bcb8b1" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="padding: 20px; margin: 0">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="left" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">


                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                    ">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      ">
                                    Copyright &copy; 2023 Syncupp
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>  `;
};

exports.memberDeletedTemplate = (data) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif">

<head>
  <meta charset="UTF-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Syncupp Create Task</title>
  <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
  <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
  <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
  <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css2?family=Imprima&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    [data-ogsb] .es-button {
      border-width: 0 !important;
      padding: 15px 20px 15px 20px !important;
    }

    @media only screen and (max-width: 600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important;
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120%;
      }

      h1 {
        font-size: 30px !important;
        text-align: left;
      }

      h2 {
        font-size: 24px !important;
        text-align: left;
      }

      h3 {
        font-size: 20px !important;
        text-align: left;
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important;
        text-align: left;
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 24px !important;
        text-align: left;
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
        text-align: left;
      }

      .es-menu td a {
        font-size: 14px !important;
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 14px !important;
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 14px !important;
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 14px !important;
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important;
      }

      *[class="gmail-fix"] {
        display: none !important;
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important;
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important;
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important;
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important;
      }

      .es-button-border {
        display: block !important;
      }

      a.es-button,
      button.es-button {
        font-size: 18px !important;
        display: block !important;
        border-right-width: 0px !important;
        border-left-width: 0px !important;
        border-top-width: 15px !important;
        border-bottom-width: 15px !important;
      }

      .es-adaptive table,
      .es-left,
      .es-right {
        width: 100% !important;
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important;
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important;
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important;
      }

      .es-m-p0 {
        padding: 0px !important;
      }

      .es-m-p0r {
        padding-right: 0px !important;
      }

      .es-m-p0l {
        padding-left: 0px !important;
      }

      .es-m-p0t {
        padding-top: 0px !important;
      }

      .es-m-p0b {
        padding-bottom: 0 !important;
      }

      .es-m-p20b {
        padding-bottom: 20px !important;
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important;
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important;
      }

      tr.es-desk-hidden {
        display: table-row !important;
      }

      table.es-desk-hidden {
        display: table !important;
      }

      td.es-desk-menu-hidden {
        display: table-cell !important;
      }

      .es-menu td {
        width: 1% !important;
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important;
      }

      table.es-social {
        display: inline-block !important;
      }

      table.es-social td {
        display: inline-block !important;
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important;
      }
    }
  </style>
</head>

<body data-new-gr-c-s-loaded="14.1098.0" style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    ">
  <div class="es-wrapper-color" style="background-color: #ffffff">
    <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        ">
      <tr>
        <td valign="top" style="padding: 0; margin: 0">
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      font-size: 0px;
                                    ">
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: underline;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "><img src="${
                                        process.env.SERVER_URL
                                      }/template/logo.png"  style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        " height="60"  /></a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                " role="presentation">
                              <tr>
                                <td align="center" style="padding: 20px; margin: 0">
                              
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      ">
                                    <br />
                                  </p>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 24px;
                                        margin-bottom: 30px;
                                      ">
                                    
                                    <span style="font-weight: 600;"> Member Deleted</span>

                                  </p>
                                  <table cellpadding="0" cellspacing="0" width="70%" style="
                                                              mso-table-lspace: 0pt;
                                                              mso-table-rspace: 0pt;
                                                              border-collapse: collapse;
                                                              border-spacing: 0px;
                                                              
                                                            ">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0; margin: 0; width: 400px">
                                        <table cellpadding="10" cellspacing="5" width="100%" align="center"
                                          bgcolor="#fafafa" valign="top" style="
                                                                                                      mso-table-lspace: 0pt;
                                                                                                      mso-table-rspace: 0pt;
                                                                                                      border-collapse: collapse;
                                                                                                      border-spacing: 0px;
                                                                                                      background-color: #f1f1f1;
                                                                                                      padding: 10px;
                                                                                                      border-radius: 5px;
                                                                                                      font-size: 14px;
                                                                                                    ">
                                        
                                        
                                        
                                                                                                    <tr>
                                                                                                    <td style=" border-top-left-radius: 5px;
                                                          border-collapse: collapse;">Deleted by :</td>
                                                                                                    <td style="
                                                          border-collapse: collapse; font-weight: 600; max-width: 100px;
                                                          overflow: hidden;
                                                          text-overflow: ellipsis;
                                                          white-space: nowrap; text-transform: capitalize;">${
                                                            data?.deleted_by ??
                                                            `&nbsp;`
                                                          }</td>
                                                                                                  </tr>
                                                                                                    <tr>
                                            <td style=" border-top-left-radius: 5px;
  border-collapse: collapse;">Member name :</td>
                                            <td style="
  border-collapse: collapse; font-weight: 600; max-width: 100px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap; text-transform: capitalize;">${
   data?.member_name ?? `&nbsp;`
 }</td>
                                          </tr>
                                   
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Member email :</td>
                                          <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.email ?? `&nbsp;`}</td>
                                        </tr>


                                    
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Member contact number :</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.contact_number ? data?.contact_number : "-"}</td>
                                      </tr>    
             </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }/team"style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #560082;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #fff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      ">View Details</a>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      ">
                                    An autogenerated alert by the system.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#ffefc4" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    ">
                  <tr>
                    <td class="esdev-adapt-off" align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="padding: 0; margin: 0">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #2d3142;
                                        font-size: 16px;
                                      ">
                                    Thanks and Best Regards,<br />Have a great
                                    day!<br />Syncupp Team<a target="_blank" style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        " href="${
                                          process.env.REACT_APP_URL
                                        }"></a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#bcb8b1" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="padding: 20px; margin: 0">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="left" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">


                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                    ">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      ">
                                    Copyright &copy; 2023 Syncupp
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

exports.memberDeletedClient = (data) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif">

<head>
  <meta charset="UTF-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Syncupp Create Task</title>
  <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
  <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
  <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
  <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css2?family=Imprima&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    [data-ogsb] .es-button {
      border-width: 0 !important;
      padding: 15px 20px 15px 20px !important;
    }

    @media only screen and (max-width: 600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important;
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120%;
      }

      h1 {
        font-size: 30px !important;
        text-align: left;
      }

      h2 {
        font-size: 24px !important;
        text-align: left;
      }

      h3 {
        font-size: 20px !important;
        text-align: left;
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important;
        text-align: left;
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 24px !important;
        text-align: left;
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
        text-align: left;
      }

      .es-menu td a {
        font-size: 14px !important;
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 14px !important;
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 14px !important;
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 14px !important;
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important;
      }

      *[class="gmail-fix"] {
        display: none !important;
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important;
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important;
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important;
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important;
      }

      .es-button-border {
        display: block !important;
      }

      a.es-button,
      button.es-button {
        font-size: 18px !important;
        display: block !important;
        border-right-width: 0px !important;
        border-left-width: 0px !important;
        border-top-width: 15px !important;
        border-bottom-width: 15px !important;
      }

      .es-adaptive table,
      .es-left,
      .es-right {
        width: 100% !important;
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important;
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important;
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important;
      }

      .es-m-p0 {
        padding: 0px !important;
      }

      .es-m-p0r {
        padding-right: 0px !important;
      }

      .es-m-p0l {
        padding-left: 0px !important;
      }

      .es-m-p0t {
        padding-top: 0px !important;
      }

      .es-m-p0b {
        padding-bottom: 0 !important;
      }

      .es-m-p20b {
        padding-bottom: 20px !important;
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important;
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important;
      }

      tr.es-desk-hidden {
        display: table-row !important;
      }

      table.es-desk-hidden {
        display: table !important;
      }

      td.es-desk-menu-hidden {
        display: table-cell !important;
      }

      .es-menu td {
        width: 1% !important;
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important;
      }

      table.es-social {
        display: inline-block !important;
      }

      table.es-social td {
        display: inline-block !important;
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important;
      }
    }
  </style>
</head>

<body data-new-gr-c-s-loaded="14.1098.0" style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    ">
  <div class="es-wrapper-color" style="background-color: #ffffff">
    <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        ">
      <tr>
        <td valign="top" style="padding: 0; margin: 0">
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      font-size: 0px;
                                    ">
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: underline;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "><img src="${
                                        process.env.SERVER_URL
                                      }/template/logo.png"  style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        " height="60"/></a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                " role="presentation">
                              <tr>
                                <td align="center" style="padding: 20px; margin: 0">
                              
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      ">
                                    <br />
                                  </p>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 24px;
                                        margin-bottom: 30px;
                                      ">
                                    
                                    <span style="font-weight: 600;">Member Deleted</span>

                                  </p>
                                  <table cellpadding="0" cellspacing="0" width="70%" style="
                                                              mso-table-lspace: 0pt;
                                                              mso-table-rspace: 0pt;
                                                              border-collapse: collapse;
                                                              border-spacing: 0px;
                                                              
                                                            ">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0; margin: 0; width: 400px">
                                        <table cellpadding="10" cellspacing="5" width="100%" align="center"
                                          bgcolor="#fafafa" valign="top" style="
                                                                                                      mso-table-lspace: 0pt;
                                                                                                      mso-table-rspace: 0pt;
                                                                                                      border-collapse: collapse;
                                                                                                      border-spacing: 0px;
                                                                                                      background-color: #f1f1f1;
                                                                                                      padding: 10px;
                                                                                                      border-radius: 5px;
                                                                                                      font-size: 14px;
                                                                                                    ">
                                        
                                        
                                        
                                                                                                    <tr>
                                                                                                    <td style=" border-top-left-radius: 5px;
                                                          border-collapse: collapse;">Deleted by :</td>
                                                                                                    <td style="
                                                          border-collapse: collapse; font-weight: 600; max-width: 100px;
                                                          overflow: hidden;
                                                          text-overflow: ellipsis;
                                                          white-space: nowrap; text-transform: capitalize;">${
                                                            data?.deleted_by ??
                                                            `&nbsp;`
                                                          }</td>
                                                                                                  </tr>
                                                                                                    <tr>
                                            <td style=" border-top-left-radius: 5px;
  border-collapse: collapse;">Member name :</td>
                                            <td style="
  border-collapse: collapse; font-weight: 600; max-width: 100px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap; text-transform: capitalize;">${
   data?.member_name ?? `&nbsp;`
 }</td>
                                          </tr>
                                   
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Member email :</td>
                                          <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.email ?? `&nbsp;`}</td>
                                        </tr>


                                    
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Member contact number :</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.contact_number ? data?.contact_number : "-"}</td>
                                      </tr>    
             </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }/client-team/details/${
    data.member_id
  }"style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #560082;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #fff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      ">View Details</a>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      ">
                                    An autogenerated alert by the system.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#ffefc4" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    ">
                  <tr>
                    <td class="esdev-adapt-off" align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="padding: 0; margin: 0">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #2d3142;
                                        font-size: 16px;
                                      ">
                                    Thanks and Best Regards,<br />Have a great
                                    day!<br />Syncupp Team<a target="_blank" style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        " href="${
                                          process.env.REACT_APP_URL
                                        }"></a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#bcb8b1" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="padding: 20px; margin: 0">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="left" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">


                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                    ">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      ">
                                    Copyright &copy; 2023 Syncupp
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

exports.seatRemoved = (data) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif">

<head>
  <meta charset="UTF-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Syncupp Create Task</title>
  <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
  <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
  <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
  <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css2?family=Imprima&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    [data-ogsb] .es-button {
      border-width: 0 !important;
      padding: 15px 20px 15px 20px !important;
    }

    @media only screen and (max-width: 600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important;
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120%;
      }

      h1 {
        font-size: 30px !important;
        text-align: left;
      }

      h2 {
        font-size: 24px !important;
        text-align: left;
      }

      h3 {
        font-size: 20px !important;
        text-align: left;
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important;
        text-align: left;
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 24px !important;
        text-align: left;
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
        text-align: left;
      }

      .es-menu td a {
        font-size: 14px !important;
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 14px !important;
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 14px !important;
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 14px !important;
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important;
      }

      *[class="gmail-fix"] {
        display: none !important;
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important;
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important;
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important;
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important;
      }

      .es-button-border {
        display: block !important;
      }

      a.es-button,
      button.es-button {
        font-size: 18px !important;
        display: block !important;
        border-right-width: 0px !important;
        border-left-width: 0px !important;
        border-top-width: 15px !important;
        border-bottom-width: 15px !important;
      }

      .es-adaptive table,
      .es-left,
      .es-right {
        width: 100% !important;
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important;
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important;
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important;
      }

      .es-m-p0 {
        padding: 0px !important;
      }

      .es-m-p0r {
        padding-right: 0px !important;
      }

      .es-m-p0l {
        padding-left: 0px !important;
      }

      .es-m-p0t {
        padding-top: 0px !important;
      }

      .es-m-p0b {
        padding-bottom: 0 !important;
      }

      .es-m-p20b {
        padding-bottom: 20px !important;
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important;
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important;
      }

      tr.es-desk-hidden {
        display: table-row !important;
      }

      table.es-desk-hidden {
        display: table !important;
      }

      td.es-desk-menu-hidden {
        display: table-cell !important;
      }

      .es-menu td {
        width: 1% !important;
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important;
      }

      table.es-social {
        display: inline-block !important;
      }

      table.es-social td {
        display: inline-block !important;
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important;
      }
    }
  </style>
</head>

<body data-new-gr-c-s-loaded="14.1098.0" style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    ">
  <div class="es-wrapper-color" style="background-color: #ffffff">
    <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        ">
      <tr>
        <td valign="top" style="padding: 0; margin: 0">
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      font-size: 0px;
                                    ">
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: underline;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "><img src="${
                                        process.env.SERVER_URL
                                      }/template/logo.png"  style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        " height="60"/></a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#560082" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                " role="presentation">
                              <tr>
                                <td align="center" style="padding: 20px; margin: 0">
                              
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      ">
                                    <br />
                                  </p>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 24px;
                                        margin-bottom: 30px;
                                      ">
                                    
                                    <span style="font-weight: 600;">Seat Removed</span>

                                  </p>
                                  <table cellpadding="0" cellspacing="0" width="70%" style="
                                                              mso-table-lspace: 0pt;
                                                              mso-table-rspace: 0pt;
                                                              border-collapse: collapse;
                                                              border-spacing: 0px;
                                                              
                                                            ">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0; margin: 0; width: 400px">
                                        <table cellpadding="10" cellspacing="5" width="100%" align="center"
                                          bgcolor="#fafafa" valign="top" style="
                                                                                                      mso-table-lspace: 0pt;
                                                                                                      mso-table-rspace: 0pt;
                                                                                                      border-collapse: collapse;
                                                                                                      border-spacing: 0px;
                                                                                                      background-color: #f1f1f1;
                                                                                                      padding: 10px;
                                                                                                      border-radius: 5px;
                                                                                                      font-size: 14px;
                                                                                                    ">
                                        
                                        
                                        
                                                                                                    <tr>
                                                                                                    <td style=" border-top-left-radius: 5px;
                                                          border-collapse: collapse;">Removed by :</td>
                                                                                                    <td style="
                                                          border-collapse: collapse; font-weight: 600; max-width: 100px;
                                                          overflow: hidden;
                                                          text-overflow: ellipsis;
                                                          white-space: nowrap;  text-transform: capitalize; ">${
                                                            data?.agency_name ??
                                                            `&nbsp;`
                                                          }</td>
                                                                                                  </tr>
                                                                                                    <tr>
                                            <td style=" border-top-left-radius: 5px;
  border-collapse: collapse;">Removed user :</td>
                                            <td style="
  border-collapse: collapse; font-weight: 600; max-width: 100px;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;  text-transform: capitalize; ">${
   data?.removed_user ?? `&nbsp;`
 }</td>
                                          </tr>
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">Removed user type :</td>
                                          <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;   text-transform: capitalize;">${
    data?.user_type ?? `&nbsp;`
  }</td>
                                        </tr>
                                   
                                          <tr>
                                          <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">User email :</td>
                                          <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.email ?? `&nbsp;`}</td>
                                        </tr>


                                    
                                        <td style=" border-top-left-radius: 5px;
border-collapse: collapse;">User contact number :</td>
                                        <td style="
border-collapse: collapse; font-weight: 600; max-width: 100px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;">${data?.contact_number ?? "-"}</td>
                                      </tr>    
             </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <a target="_blank" href="${
                                    process.env.REACT_APP_URL
                                  }"style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #560082;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #fff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      ">View Details</a>
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      ">
                                    An autogenerated alert by the system.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#ffefc4" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276F;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    ">
                  <tr>
                    <td class="esdev-adapt-off" align="left" style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        ">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">
                              <tr>
                                <td align="center" style="padding: 0; margin: 0">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #2d3142;
                                        font-size: 16px;
                                      ">
                                    Thanks and Best Regards,<br />Have a great
                                    day!<br />Syncupp Team<a target="_blank" style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        " href="${
                                          process.env.REACT_APP_URL
                                        }"></a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              ">
            <tr>
              <td align="center" style="padding: 0; margin: 0">
                <table bgcolor="#bcb8b1" class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    ">
                  <tr>
                    <td align="left" style="padding: 20px; margin: 0">
                      <table cellpadding="0" cellspacing="0" width="100%" style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          ">
                        <tr>
                          <td align="left" style="padding: 0; margin: 0; width: 560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                ">


                              <tr>
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                    ">
                                  <p style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      ">
                                    Copyright &copy; 2023 Syncupp
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

let lastRandomColor = null;

exports.getRandomColor = () => {
  const colorKeys = Object.keys(colors);
  let randomColorKey;

  // Ensure that the randomly selected color is not the same as the last one
  do {
    randomColorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  } while (randomColorKey === lastRandomColor);

  lastRandomColor = randomColorKey;
  return colors[randomColorKey];
};

exports.generateUniqueColors = (count) => {
  const uniqueColors = new Set();
  const letters = "0123456789ABCDEF";

  while (uniqueColors.size < count) {
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    uniqueColors.add(color);
  }

  return Array.from(uniqueColors);
};

exports.ticketTemplate = (data) => {
  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    style="font-family: arial, 'helvetica neue', helvetica, sans-serif"
  >
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Syncupp Admin Inquiry</title>
      <!--[if (mso 16)]>
        <style type="text/css">
          a {
            text-decoration: none;
          }
        </style>
      <![endif]-->
      <!--[if gte mso 9
        ]><style>
          sup {
            font-size: 100% !important;
          }
        </style><!
      [endif]-->
      <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG></o:AllowPNG>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <link
        href="https://fonts.googleapis.com/css2?family=Imprima&display=swap"
        rel="stylesheet"
      />
      <!--<![endif]-->
      <style type="text/css">
        #outlook a {
          padding: 0;
        }
  
        .es-button {
          mso-style-priority: 100 !important;
          text-decoration: none !important;
        }
  
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }
  
        .es-desk-hidden {
          display: none;
          float: left;
          overflow: hidden;
          width: 0;
          max-height: 0;
          line-height: 0;
          mso-hide: all;
        }
  
        [data-ogsb] .es-button {
          border-width: 0 !important;
          padding: 15px 20px 15px 20px !important;
        }
  
        @media only screen and (max-width: 600px) {
          p,
          ul li,
          ol li,
          a {
            line-height: 150% !important;
          }
  
          h1,
          h2,
          h3,
          h1 a,
          h2 a,
          h3 a {
            line-height: 120%;
          }
  
          h1 {
            font-size: 30px !important;
            text-align: left;
          }
  
          h2 {
            font-size: 24px !important;
            text-align: left;
          }
  
          h3 {
            font-size: 20px !important;
            text-align: left;
          }
  
          .es-header-body h1 a,
          .es-content-body h1 a,
          .es-footer-body h1 a {
            font-size: 30px !important;
            text-align: left;
          }
  
          .es-header-body h2 a,
          .es-content-body h2 a,
          .es-footer-body h2 a {
            font-size: 24px !important;
            text-align: left;
          }
  
          .es-header-body h3 a,
          .es-content-body h3 a,
          .es-footer-body h3 a {
            font-size: 20px !important;
            text-align: left;
          }
  
          .es-menu td a {
            font-size: 14px !important;
          }
  
          .es-header-body p,
          .es-header-body ul li,
          .es-header-body ol li,
          .es-header-body a {
            font-size: 14px !important;
          }
  
          .es-content-body p,
          .es-content-body ul li,
          .es-content-body ol li,
          .es-content-body a {
            font-size: 14px !important;
          }
  
          .es-footer-body p,
          .es-footer-body ul li,
          .es-footer-body ol li,
          .es-footer-body a {
            font-size: 14px !important;
          }
  
          .es-infoblock p,
          .es-infoblock ul li,
          .es-infoblock ol li,
          .es-infoblock a {
            font-size: 12px !important;
          }
  
          *[class="gmail-fix"] {
            display: none !important;
          }
  
          .es-m-txt-c,
          .es-m-txt-c h1,
          .es-m-txt-c h2,
          .es-m-txt-c h3 {
            text-align: center !important;
          }
  
          .es-m-txt-r,
          .es-m-txt-r h1,
          .es-m-txt-r h2,
          .es-m-txt-r h3 {
            text-align: right !important;
          }
  
          .es-m-txt-l,
          .es-m-txt-l h1,
          .es-m-txt-l h2,
          .es-m-txt-l h3 {
            text-align: left !important;
          }
  
          .es-m-txt-r img,
          .es-m-txt-c img,
          .es-m-txt-l img {
            display: inline !important;
          }
  
          .es-button-border {
            display: block !important;
          }
  
          a.es-button,
          button.es-button {
            font-size: 18px !important;
            display: block !important;
            border-right-width: 0px !important;
            border-left-width: 0px !important;
            border-top-width: 15px !important;
            border-bottom-width: 15px !important;
          }
  
          .es-adaptive table,
          .es-left,
          .es-right {
            width: 100% !important;
          }
  
          .es-content table,
          .es-header table,
          .es-footer table,
          .es-content,
          .es-footer,
          .es-header {
            width: 100% !important;
            max-width: 600px !important;
          }
  
          .es-adapt-td {
            display: block !important;
            width: 100% !important;
          }
  
          .adapt-img {
            width: 100% !important;
            height: auto !important;
          }
  
          .es-m-p0 {
            padding: 0px !important;
          }
  
          .es-m-p0r {
            padding-right: 0px !important;
          }
  
          .es-m-p0l {
            padding-left: 0px !important;
          }
  
          .es-m-p0t {
            padding-top: 0px !important;
          }
  
          .es-m-p0b {
            padding-bottom: 0 !important;
          }
  
          .es-m-p20b {
            padding-bottom: 20px !important;
          }
  
          .es-mobile-hidden,
          .es-hidden {
            display: none !important;
          }
  
          tr.es-desk-hidden,
          td.es-desk-hidden,
          table.es-desk-hidden {
            width: auto !important;
            overflow: visible !important;
            float: none !important;
            max-height: inherit !important;
            line-height: inherit !important;
          }
  
          tr.es-desk-hidden {
            display: table-row !important;
          }
  
          table.es-desk-hidden {
            display: table !important;
          }
  
          td.es-desk-menu-hidden {
            display: table-cell !important;
          }
  
          .es-menu td {
            width: 1% !important;
          }
  
          table.es-table-not-adapt,
          .esd-block-html table {
            width: auto !important;
          }
  
          table.es-social {
            display: inline-block !important;
          }
  
          table.es-social td {
            display: inline-block !important;
          }
  
          .es-desk-hidden {
            display: table-row !important;
            width: auto !important;
            overflow: visible !important;
            max-height: inherit !important;
          }
        }
      </style>
    </head>
  
    <body
      data-new-gr-c-s-loaded="14.1098.0"
      style="
        width: 100%;
        font-family: arial, 'helvetica neue', helvetica, sans-serif;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        padding: 0;
        margin: 0;
      "
    >
      <div class="es-wrapper-color" style="background-color: #ffffff">
        <!--[if gte mso 9]>
          <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
            <v:fill type="tile" color="#ffffff"></v:fill>
          </v:background>
        <![endif]-->
        <table
          class="es-wrapper"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            border-collapse: collapse;
            border-spacing: 0px;
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            background-repeat: repeat;
            background-position: center top;
            background-color: #ffffff;
          "
        >
          <tr>
            <td valign="top" style="padding: 0; margin: 0">
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-footer"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                  background-color: transparent;
                  background-repeat: repeat;
                  background-position: center top;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#560082"
                      class="es-footer-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      "
                    >
                      <tr>
                        <td
                          align="left"
                          style="
                            margin: 0;
                            padding-top: 20px;
                            padding-bottom: 20px;
                            padding-left: 40px;
                            padding-right: 40px;
                          "
                        >
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  "
                                >
                                  <tr>
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      "
                                    >
                                      <a
                                        target="_blank"
                                        href="${process.env.REACT_APP_URL}"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 14px;
                                        "
                                        ><img
                                          src="${
                                            process.env.SERVER_URL
                                          }/template/logo.png"
                                          style="
                                            display: block;
                                            border: 0;
                                            outline: none;
                                            text-decoration: none;
                                            -ms-interpolation-mode: bicubic;
                                          "
                                          height="60"
                                      /></a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#560082"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #31276F;
                        border-radius: 20px 20px 0px 0px;
                        width: 600px;
                      "
                    >
                      <tr>
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 20px;
                            padding-left: 20px;
                            padding-right: 20px;
                          "
                        >
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 560px"
                              >
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  bgcolor="#fafafa"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: separate;
                                    border-spacing: 0px;
                                    background-color: #fafafa;
                                    border-radius: 10px;
                                  "
                                  role="presentation"
                                >
                                  <tr>
                                    <td
                                      align="center"
                                      style="padding: 20px; margin: 0"
                                    >
                                      <h3
                                        style="
                                          margin: 0;
                                          line-height: 34px;
                                          mso-line-height-rule: exactly;
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          font-size: 24px;
                                          font-style: normal;
                                          font-weight: bold;
                                          color: #111318;
                                          text-align: center;
                                        "
                                      >
                                        Hi <span>${data?.user}</span>,&nbsp;
                                      </h3>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          line-height: 27px;
                                          color: #111318;
                                          font-size: 18px;
                                        "
                                      >
                                        <br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          line-height: 27px;
                                          color: #111318;
                                          font-size: 16px;
                                          margin-bottom: 30px;
                                        "
                                      >

                                      ${
                                        data.user === "Admin"
                                          ? "We've received a recent ticket and below are the details."
                                          : "You've successfully raised ticket and below are the details."
                                      }

                                        
                                      </p>
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="70%"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tr>
                                          <td
                                            align="center"
                                            valign="top"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              width: 400px;
                                            "
                                          >
                                            <table
                                              cellpadding="10"
                                              cellspacing="5"
                                              width="100%"
                                              align="center"
                                              bgcolor="#fafafa"
                                              valign="top"
                                              style="
                                                mso-table-lspace: 0pt;
                                                mso-table-rspace: 0pt;
                                                border-collapse: collapse;
                                                border-spacing: 0px;
                                                background-color: #f1f1f1;
                                                padding: 10px;
                                                border-radius: 5px;
                                                font-size: 14px;
                                              "
                                            >
                                              <tr>
                                                <td
                                                  style="
                                                    border-top-left-radius: 5px;
                                                    border-collapse: collapse;
                                                  "
                                                >
                                                  Name :
                                                </td>
                                                <td
                                                  style="
                                                    border-collapse: collapse;
                                                    font-weight: 600;
                                                  "
                                                >
                                                  ${data.name}
                                                </td>
                                              </tr>
                                      
                                              <tr>
                                                <td
                                                  style="
                                                    border-top-left-radius: 5px;
                                                    border-collapse: collapse;
                                                  "
                                                >
                                                  Email :
                                                </td>
                                                <td
                                                  style="
                                                    border-collapse: collapse;
                                                    font-weight: 600;
                                                  "
                                                >
                                                  ${data.email}
                                                </td>
                                              </tr>
                                              <tr>
                                                <td
                                                  style="
                                                    border-top-left-radius: 5px;
                                                    border-collapse: collapse;
                                                  "
                                                >
                                                  Contact Number :
                                                </td>
                                                <td
                                                  style="
                                                    border-collapse: collapse;
                                                    font-weight: 600;
                                                  "
                                                >
                                                  ${
                                                    data?.contact_number
                                                      ? data?.contact_number
                                                      : "-"
                                                  }
                                                </td>
                                              </tr>
                                        
                                              <tr>
                                                <td
                                                  style="
                                                    border-top-left-radius: 5px;
                                                    border-collapse: collapse;
                                                     vertical-align: top;
                                                  "
                                                >
                                                  Ticket Details :
                                                </td>
                                                <td
                                                  style="
                                                    max-width: 100px;
                                                    overflow: hidden;
                                                    font-weight: 600;
    word-wrap: break-word;
                                                    
                                                  "
                                                >
                                                  ${data?.ticket_detail}
                                                </td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: -apple-system,
                                            blinkmacsystemfont, 'segoe ui', roboto,
                                            helvetica, arial, sans-serif,
                                            'apple color emoji', 'segoe ui emoji',
                                            'segoe ui symbol';
                                          line-height: 27px;
                                          color: #111318;
                                          font-size: 16px;
                                        "
                                      >
                                        An autogenerated alert by the system.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#ffefc4"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #31276F;
                        border-radius: 0px 0px 20px 20px;
                        width: 600px;
                      "
                    >
                      <tr>
                        <td
                          class="esdev-adapt-off"
                          align="left"
                          style="
                            margin: 0;
                            padding-top: 20px;
                            padding-bottom: 20px;
                            padding-left: 40px;
                            padding-right: 40px;
                          "
                        >
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  "
                                >
                                  <tr>
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: Imprima, Arial, sans-serif;
                                          line-height: 24px;
                                          color: #2d3142;
                                          font-size: 16px;
                                        "
                                      >
                                        Thanks and Best Regards,<br />Have a great
                                        day!<br />Syncupp Team<a
                                          target="_blank"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #2d3142;
                                            font-size: 16px;
                                          "
                                          href="${process.env.REACT_APP_URL}"
                                        ></a>
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-footer"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                  background-color: transparent;
                  background-repeat: repeat;
                  background-position: center top;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#bcb8b1"
                      class="es-footer-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      "
                    >
                      <tr>
                        <td align="left" style="padding: 20px; margin: 0">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                align="left"
                                style="padding: 0; margin: 0; width: 560px"
                              >
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  "
                                >
                                  <tr>
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-top: 10px;
                                      "
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: Imprima, Arial, sans-serif;
                                          line-height: 21px;
                                          color: #2d3142;
                                          font-size: 14px;
                                        "
                                      >
                                        Copyright &copy; 2023 Syncupp
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
`;
};
exports.boardTemplate = (data) => {
  return `
 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family: arial, 'helvetica neue', helvetica, sans-serif"
>
  <head>
    <meta charset="UTF-8" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta content="telephone=no" name="format-detection" />
    <title>Syncupp Create Task</title>
    <!--[if (mso 16)]>
      <style type="text/css">
        a {
          text-decoration: none;
        }
      </style>
    <![endif]-->
    <!--[if gte mso 9
      ]><style>
        sup {
          font-size: 100% !important;
        }
      </style><!
    [endif]-->
    <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <link
      href="https://fonts.googleapis.com/css2?family=Imprima&display=swap"
      rel="stylesheet"
    />
    <!--<![endif]-->
    <style type="text/css">
      #outlook a {
        padding: 0;
      }

      .es-button {
        mso-style-priority: 100 !important;
        text-decoration: none !important;
      }

      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }

      .es-desk-hidden {
        display: none;
        float: left;
        overflow: hidden;
        width: 0;
        max-height: 0;
        line-height: 0;
        mso-hide: all;
      }

      [data-ogsb] .es-button {
        border-width: 0 !important;
        padding: 15px 20px 15px 20px !important;
      }

      @media only screen and (max-width: 600px) {
        p,
        ul li,
        ol li,
        a {
          line-height: 150% !important;
        }

        h1,
        h2,
        h3,
        h1 a,
        h2 a,
        h3 a {
          line-height: 120%;
        }

        h1 {
          font-size: 30px !important;
          text-align: left;
        }

        h2 {
          font-size: 24px !important;
          text-align: left;
        }

        h3 {
          font-size: 20px !important;
          text-align: left;
        }

        .es-header-body h1 a,
        .es-content-body h1 a,
        .es-footer-body h1 a {
          font-size: 30px !important;
          text-align: left;
        }

        .es-header-body h2 a,
        .es-content-body h2 a,
        .es-footer-body h2 a {
          font-size: 24px !important;
          text-align: left;
        }

        .es-header-body h3 a,
        .es-content-body h3 a,
        .es-footer-body h3 a {
          font-size: 20px !important;
          text-align: left;
        }

        .es-menu td a {
          font-size: 14px !important;
        }

        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 14px !important;
        }

        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 14px !important;
        }

        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 14px !important;
        }

        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important;
        }

        *[class="gmail-fix"] {
          display: none !important;
        }

        .es-m-txt-c,
        .es-m-txt-c h1,
        .es-m-txt-c h2,
        .es-m-txt-c h3 {
          text-align: center !important;
        }

        .es-m-txt-r,
        .es-m-txt-r h1,
        .es-m-txt-r h2,
        .es-m-txt-r h3 {
          text-align: right !important;
        }

        .es-m-txt-l,
        .es-m-txt-l h1,
        .es-m-txt-l h2,
        .es-m-txt-l h3 {
          text-align: left !important;
        }

        .es-m-txt-r img,
        .es-m-txt-c img,
        .es-m-txt-l img {
          display: inline !important;
        }

        .es-button-border {
          display: block !important;
        }

        a.es-button,
        button.es-button {
          font-size: 18px !important;
          display: block !important;
          border-right-width: 0px !important;
          border-left-width: 0px !important;
          border-top-width: 15px !important;
          border-bottom-width: 15px !important;
        }

        .es-adaptive table,
        .es-left,
        .es-right {
          width: 100% !important;
        }

        .es-content table,
        .es-header table,
        .es-footer table,
        .es-content,
        .es-footer,
        .es-header {
          width: 100% !important;
          max-width: 600px !important;
        }

        .es-adapt-td {
          display: block !important;
          width: 100% !important;
        }

        .adapt-img {
          width: 100% !important;
          height: auto !important;
        }

        .es-m-p0 {
          padding: 0px !important;
        }

        .es-m-p0r {
          padding-right: 0px !important;
        }

        .es-m-p0l {
          padding-left: 0px !important;
        }

        .es-m-p0t {
          padding-top: 0px !important;
        }

        .es-m-p0b {
          padding-bottom: 0 !important;
        }

        .es-m-p20b {
          padding-bottom: 20px !important;
        }

        .es-mobile-hidden,
        .es-hidden {
          display: none !important;
        }

        tr.es-desk-hidden,
        td.es-desk-hidden,
        table.es-desk-hidden {
          width: auto !important;
          overflow: visible !important;
          float: none !important;
          max-height: inherit !important;
          line-height: inherit !important;
        }

        tr.es-desk-hidden {
          display: table-row !important;
        }

        table.es-desk-hidden {
          display: table !important;
        }

        td.es-desk-menu-hidden {
          display: table-cell !important;
        }

        .es-menu td {
          width: 1% !important;
        }

        table.es-table-not-adapt,
        .esd-block-html table {
          width: auto !important;
        }

        table.es-social {
          display: inline-block !important;
        }

        table.es-social td {
          display: inline-block !important;
        }

        .es-desk-hidden {
          display: table-row !important;
          width: auto !important;
          overflow: visible !important;
          max-height: inherit !important;
        }
      }
    </style>
  </head>

  <body
    data-new-gr-c-s-loaded="14.1098.0"
    style="
      width: 100%;
      font-family: arial, 'helvetica neue', helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      padding: 0;
      margin: 0;
    "
  >
    <div class="es-wrapper-color" style="background-color: #ffffff">
      <!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
          <v:fill type="tile" color="#ffffff"></v:fill>
        </v:background>
      <![endif]-->
      <table
        class="es-wrapper"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-collapse: collapse;
          border-spacing: 0px;
          padding: 0;
          margin: 0;
          width: 100%;
          height: 100%;
          background-repeat: repeat;
          background-position: center top;
          background-color: #ffffff;
        "
      >
        <tr>
          <td valign="top" style="padding: 0; margin: 0">
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-footer"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#560082"
                    class="es-footer-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        align="left"
                        style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 520px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                              
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-content"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#560082"
                    class="es-content-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276f;
                      border-radius: 20px 20px 0px 0px;
                      width: 600px;
                    "
                  >

                      <tr style=>
                          <td align="center"  style="
                                padding: 0;
                                margin: 0;
                                font-size: 0px;
                                         padding-top: 20px;        
                              ">
                            <a target="_blank" href="${
                              data?.REACT_APP_URL
                            }" style="
                                  -webkit-text-size-adjust: none;
                                  -ms-text-size-adjust: none;
                                  mso-line-height-rule: exactly;
                                  text-decoration: underline;
                                  color: #2d3142;
                                  font-size: 14px;
                                "><img src="${data?.SERVER_URL}"  style="
                                    display: block;
                                    border: 0;
                                    outline: none;
                                    text-decoration: none;
                                    -ms-interpolation-mode: bicubic;
                                  " height="60" /></a>
                          </td>
                        </tr>
                  
                <tr>
                    <tr>
                      <td
                        align="left"
                        style="
                          padding: 0;
                          margin: 0;
                          padding-top: 20px;
                          padding-left: 20px;
                          padding-right: 20px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 560px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                bgcolor="#fafafa"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: separate;
                                  border-spacing: 0px;
                                  background-color: #fafafa;
                                  border-radius: 10px;
                                "
                                role="presentation"
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 20px; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 18px;
                                      "
                                    >
                                      <br />
                                    </p>
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                        margin-bottom: 30px;
                                      "
                                    >
                                      <span style="font-weight: 600"
                                        >Project Details</span
                                      >
                                    </p>
                                    <table
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="70%"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        border-collapse: collapse;
                                        border-spacing: 0px;
                                      "
                                    >
                                      <tr>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            width: 400px;
                                          "
                                        >
                                          <table
                                            cellpadding="10"
                                            cellspacing="5"
                                            width="100%"
                                            align="center"
                                            bgcolor="#fafafa"
                                            valign="top"
                                            style="
                                              mso-table-lspace: 0pt;
                                              mso-table-rspace: 0pt;
                                              border-collapse: collapse;
                                              border-spacing: 0px;
                                              background-color: #f1f1f1;
                                              padding: 10px;
                                              border-radius: 5px;
                                              font-size: 14px;
                                            "
                                          >
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Project Name :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  max-width: 100px;
                                                  overflow: hidden;
                                                  text-overflow: ellipsis;
                                                  white-space: nowrap;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${
                                                  data?.project_name ?? `&nbsp;`
                                                }
                                              </td>
                                            </tr>
                                            <tr>
                                              <td
                                                style="
                                                  border-top-left-radius: 5px;
                                                  border-collapse: collapse;
                                                "
                                              >
                                                Description :
                                              </td>
                                              <td
                                                style="
                                                  border-collapse: collapse;
                                                  font-weight: 600;
                                                  max-width: 100px;
                                                  overflow: hidden;
                                                  text-overflow: ellipsis;
                                                  white-space: nowrap;
                                                  text-transform: capitalize;
                                                "
                                              >
                                                ${
                                                  data?.description
                                                    ? data?.description
                                                    : "-"
                                                }
                                              </td>
                                            </tr>

                                            <td
                                              style="
                                                border-top-left-radius: 5px;
                                                border-collapse: collapse;
                                              "
                                            >
                                              Added By :
                                            </td>
                                            <td
                                              style="
                                                border-collapse: collapse;
                                                font-weight: 600;
                                                max-width: 100px;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                white-space: nowrap;
                                                text-transform: capitalize;
                                              "
                                            >
                                              ${data?.added_by ?? `&nbsp;`}
                                            </td>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                    <a
                                      target="_blank"
                                      href="${data?.REACT_APP_URL}"
                                      style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        background-color: #31276f;
                                        padding: 10px 20px;
                                        width: 170px;
                                        display: block;
                                        font-weight: 600;
                                        color: #ffff;
                                        font-size: 16px;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        margin-top: 30px;
                                        margin-bottom: 30px;
                                      "
                                      >View Details</a
                                    >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: -apple-system,
                                          blinkmacsystemfont, 'segoe ui', roboto,
                                          helvetica, arial, sans-serif,
                                          'apple color emoji', 'segoe ui emoji',
                                          'segoe ui symbol';
                                        line-height: 27px;
                                        color: #111318;
                                        font-size: 16px;
                                      "
                                    >
                                      An autogenerated alert by the system.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-content"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#ffefc4"
                    class="es-content-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #31276f;
                      border-radius: 0px 0px 20px 20px;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td
                        class="esdev-adapt-off"
                        align="left"
                        style="
                          margin: 0;
                          padding-top: 20px;
                          padding-bottom: 20px;
                          padding-left: 40px;
                          padding-right: 40px;
                        "
                      >
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="center"
                              valign="top"
                              style="padding: 0; margin: 0; width: 520px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 0; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 24px;
                                        color: #ffff;
                                        font-size: 16px;
                                      "
                                    >
                                      Thanks and Best Regards,<br />Have a great
                                      day!<br />Syncupp Team<a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #2d3142;
                                          font-size: 16px;
                                        "
                                        href="${data?.REACT_APP_URL}"
                                      ></a>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table
              cellpadding="0"
              cellspacing="0"
              class="es-footer"
              align="center"
              style="
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse;
                border-spacing: 0px;
                table-layout: fixed !important;
                width: 100%;
                background-color: transparent;
                background-repeat: repeat;
                background-position: center top;
              "
            >
              <tr>
                <td align="center" style="padding: 0; margin: 0">
                  <table
                    bgcolor="#bcb8b1"
                    class="es-footer-body"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      mso-table-lspace: 0pt;
                      mso-table-rspace: 0pt;
                      border-collapse: collapse;
                      border-spacing: 0px;
                      background-color: #ffffff;
                      width: 600px;
                    "
                  >
                    <tr>
                      <td align="left" style="padding: 20px; margin: 0">
                        <table
                          cellpadding="0"
                          cellspacing="0"
                          width="100%"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            border-collapse: collapse;
                            border-spacing: 0px;
                          "
                        >
                          <tr>
                            <td
                              align="left"
                              style="padding: 0; margin: 0; width: 560px"
                            >
                              <table
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                role="presentation"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  border-collapse: collapse;
                                  border-spacing: 0px;
                                "
                              >
                                <tr>
                                  <td
                                    align="center"
                                    class="es-m-txt-c"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 10px;
                                      padding-bottom: 20px;
                                      font-size: 0;
                                    "
                                  >
                                    <table
                                      cellpadding="0"
                                      cellspacing="0"
                                      class="es-table-not-adapt es-social"
                                      role="presentation"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        border-collapse: collapse;
                                        border-spacing: 0px;
                                      "
                                    >
                                      <tr>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        ></td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        ></td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        >
                                          <a
                                            target="_blank"
                                            href="${data?.instagram}"
                                            style="
                                              -webkit-text-size-adjust: none;
                                              -ms-text-size-adjust: none;
                                              mso-line-height-rule: exactly;
                                              text-decoration: underline;
                                              color: #2d3142;
                                              font-size: 14px;
                                            "
                                            ><img
                                              src="${
                                                data?.SERVER_URL
                                              }/template/instagram.png"
                                              alt="Ig"
                                              title="Instagram"
                                              height="24"
                                              style="
                                                display: block;
                                                border: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                              "
                                          /></a>
                                        </td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding: 0;
                                            margin: 0;
                                            padding-right: 5px;
                                          "
                                        ></td>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="padding: 0; margin: 0"
                                        >
                                          <a
                                            target="_blank"
                                            href="${data?.facebook}"
                                            style="
                                              -webkit-text-size-adjust: none;
                                              -ms-text-size-adjust: none;
                                              mso-line-height-rule: exactly;
                                              text-decoration: underline;
                                              color: #2d3142;
                                              font-size: 14px;
                                            "
                                            ><img
                                              src="${
                                                data?.SERVER_URL
                                              }/template/facebook.png"
                                              alt="Fb"
                                              title="Facebook"
                                              height="24"
                                              style="
                                                display: block;
                                                border: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                              "
                                          /></a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="center"
                                    style="padding: 0; margin: 0"
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 20px;
                                        color: #2d3142;
                                        font-size: 13px;
                                      "
                                    >
                                      <a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: none;
                                          color: #2d3142;
                                          font-size: 14px;
                                        "
                                        href=""
                                      ></a
                                      ><a
                                        target="_blank"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: none;
                                          color: #2d3142;
                                          font-size: 13px;
                                        "
                                        href="${data?.privacy_policy}"
                                        >Privacy Policy</a
                                      >
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="center"
                                    style="
                                      padding: 0;
                                      margin: 0;
                                      padding-top: 20px;
                                    "
                                  >
                                    <p
                                      style="
                                        margin: 0;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        font-family: Imprima, Arial, sans-serif;
                                        line-height: 21px;
                                        color: #2d3142;
                                        font-size: 14px;
                                      "
                                    >
                                  Copyright &copy; ${data?.year ?? "-"} Syncupp
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;
};
