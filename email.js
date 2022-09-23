const nodemailer = require("nodemailer");

const sendMail = (email, subject, text, cb) => {
  var transporter = nodemailer.createTransport({
    // service: "hopeup",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  var mailOptions = {
    from: `Hope Up LLC <yourqatester@gmail.com>`,
    to: email,
    messageId: "123456",
    inReplyTo: "123456",
    replyTo: "Customer.care@hopeup.net",
    subject: subject,
    text: text

  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      cb(true, error)
    } else {
      console.log("Email sent: " + info);
      // return res.status(200).json(info)
      cb(false, info)
    }
  });
}

const sendLabel = (email, subject, text, image, cb) => {
  var transporter = nodemailer.createTransport({
    // service: "hopeup",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "Customer.care@hopeup.net",
      pass: "uhalcezjubqllosw",
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  var mailOptions = {
    from: `Hope Up LLC <yourqatester@gmail.com>`,
    to: email,
    messageId: "123456",
    inReplyTo: "123456",
    replyTo: "Customer.care@hopeup.net",
    subject: subject,
    text: text,
    image: image
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      cb(true, error)
    } else {
      console.log("Email sent: " + info);
      // return res.status(200).json(info)
      cb(false, info)
    }
  });
}

const signup = (email, subject, text, html, cb) => {
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "yourqatester@gmail.com",
      // pass: "?k-KGL~6PL&Sg5wt",
      pass: "infocodebusterspro"
    },
  });

  var mailOptions = {
    from: "yourqatester@gmail.com",
    to: email,
    subject: subject,
    html: html

  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      cb(true, error)
    } else {
      console.log("Email sent: " + info.response);

      cb(false, "Email has successfully sended to " + email)
    }
  });
}

// const send = (email , subject , text , attachemnts , cb)=>{
//   console.log("email" , email)
//   var transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: "yourqatester@gmail.com",
//         pass: "?k-KGL~6PL&Sg5wt",
//       },
//     });

//     var mailOptions = {
//       from: "noreply@gmail.com",
//       to: "yourqatester@gmail.com",
//       subject: subject,
//       html:text,
//       attachments: attachemnts

//     };

//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         console.log(error);
//         cb(true , error  )
//       } else {
//         console.log("Email sent: " + info.response);

//          cb(false , "Email has successfully sended to "+email  )
//       }
//     });
// }


module.exports = { sendMail, signup, sendLabel }

