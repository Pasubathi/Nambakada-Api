
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path")
const Email = require('email-templates');

const emailt = new Email({
  transport: {
    jsonTransport: true
  },
  preview: true,
  send: true,
  views: {
    options: {
      extension: 'ejs' // <---- HERE
    }
  }
});


const sendNotification = (email, subject, text, link) => {
  console.log("email", email, subject, text, link)
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    // auth: {
    //   user: "yourqatester@gmail.com",
    //   pass: "infocodebusterspro",
    // },
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
  });
  let ejs_data = {
    link: link,
    text: text
  }
  ejs.renderFile(
    path.join(__dirname, "ejs/index.ejs"),
    { ejs_data },
    (err, data) => {
      if (err) {
        console.log("err", err)
      } else {
        var mailOptions = {
          from: `Hope Up LLC <Customer.care@hopeup.net>`,
          to: email,
          subject: subject,
          text: text,
          html: data
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent to: " + email + " "+info.response);
            // cb(false , "Email has successfully sended to "+email  )
          }
        });
      }
    })
}

const accountVerficationEmail = (email, subject, text, cb) => {
  console.log("email", email, subject, text)
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
  });
  let ejs_data = {
    text: text
  }
  ejs.renderFile(
    path.join(__dirname, "emails/custom/emailAddress.ejs"),
    { ejs_data },
    (err, data) => {
      if (err) {
        console.log("err", err)
        cb(true, err)
      } else {
        var mailOptions = {
          from: `Hope Up LLC <Customer.care@hopeup.net>`,
          to: email,
          subject: subject,
          text: text,
          html: data
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent to: " + email + " "+info.response);
            cb(false, info)
          }
        });
      }
    })
}

const forgetEmail = (email, subject, text, cb) => {
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
  });
  let ejs_data = {
    text: text
  }
  ejs.renderFile(
    path.join(__dirname, "emails/custom/forgotPassword.ejs"),
    { ejs_data },
    (err, data) => {
      if (err) {
        console.log("err", err)
        cb(true, err)
      } else {
        var mailOptions = {
          from: `Hope Up LLC <Customer.care@hopeup.net>`,
          to: email,
          subject: subject,
          text: text,
          html: data
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent to: " + email + " "+info.response);
            cb(false, info)
          }
        });
      }
    })
}

const orderVerification = (email, subject, name, text, data, summary, cb) => {
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
  });

  let ejs_data = {
    text: text,
    name: name,
    summary: summary,
    data: data
  }

  ejs.renderFile(
    path.join(__dirname, "emails/custom/orderDetails.ejs"),
    { ejs_data },
    (err, data) => {
      if (err) {
        console.log("err", err)
        cb(true, err)
      } else {
        var mailOptions = {
          from: `Hope Up LLC <Customer.care@hopeup.net>`,
          to: email,
          subject: subject,
          text: text,
          html: data
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent to: " + email + " "+info.response);
            cb(false, info)
          }
        });
      }
    })
}

const shippingverification = (email, subject, name, text, data, labels, cb) => {
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
  });

  let ejs_data = {
    text: text,
    name: name,
    labels: labels,
    data: data
  }

  ejs.renderFile(
    path.join(__dirname, "emails/custom/shippingDetails.ejs"),
    { ejs_data },
    (err, data) => {
      if (err) {
        console.log("err", err)
        cb(true, err)
      } else {
        var mailOptions = {
          from: `Hope Up LLC <Customer.care@hopeup.net>`,
          to: email,
          subject: subject,
          text: text,
          html: data,
          attachments: [
            {
              path: `data:image/png;base64, ${labels.graphic}`
            }
          ],
          date: new Date()
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent to: " + email + " "+info.response);
            cb(false, info)
          }
        });
      }
    })
}

module.exports = { sendNotification, accountVerficationEmail, forgetEmail, orderVerification, shippingverification }

