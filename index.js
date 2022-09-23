const express = require("express");
const mongoose = require("mongoose");
const app = express();
const server = require("http").createServer(app);
const bodyParser = require("body-parser");
const cors = require("cors");
const APP = require("./app");
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});
const Chat = require("./model/chat");
const Support = require("./model/support")
const Adv = require('./model/adv')
const date = require('date-and-time');
const Notification = require('./model/notification');
var cron = require('node-cron');
const User = require("./model/user");
const nodeFetch = require('node-fetch')
// const not = require("./notifictaion")

var FCM = require('fcm-node');
const order = require("./model/order");
const _return = require("./model/return");
var serverKey = 'AAAAtxlC9M8:APA91bGM95tGlF_DsTh-RYG93yHngZkkxfB0JFw7z-VVAc8IFonq5GzKljR3Gp66YXiRyR_WM02O2ujKp4iDgPSzT2aFT5Lz715f8kVYfTZdYwuYTqhlD5IEDYAVWgxBJidB4KjNZQUR'; //put your server key here
var fcm = new FCM(serverKey);


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true
}));
app.use(cors());
app.use(express.json());
app.use(APP)

function generate_id(receiver_id, sender_id) {
  receiver_id = receiver_id.substring(19, 24);
  sender_id = sender_id.substring(19, 24);
  let message_id = receiver_id + sender_id;
  const sorted = message_id.split('').sort().join('')
  return sorted
}

io.on("connection", function (_socket) {
  console.log("a user connected to client");



  _socket.on('view_notification', async (data) => {
    let not = await Notification.findByIdAndUpdate(data, {
      $set: { viewed: true }
    }, { new: true });

    console.log('notification', not)
  })

  _socket.on('done', async (data) => {
    console.log('next', data)
    let check = `${data.not.notification_id.toString()}`;
    console.log('check', check)
    _socket.broadcast.emit(check, data)
  })

  _socket.on("new_message", async (data) => {
    console.log("data", data)
    let message_id = await generate_id(data.receiver_id, data.sender_id);
    let chat = new Chat({
      receiver_id: data.receiver_id,
      sender_id: data.sender_id,
      message_id: message_id,
      message: data.message,
      image: data.images,
      read: false
    })
    let user = await User.findById(data.sender_id);
    let receiver = await User.findById(data.receiver_id);
    console.log("RECEIVER", receiver, "RECEIVER")
    chat.save();
    if (receiver && receiver.token && receiver.notification && receiver.isLoggedin) {
      SEND_FCM(receiver.token, "New Message", `${user && user.first_name + " " + user.last_name}  has send you a message`, {
        username: user.username,
        avatar: user.profile_picture,
        deleted: user.deleted,
        sender_id: user._id
      })

    }
    console.log("index", { chat, user, receiver })
    _socket.broadcast.emit("message", { chat, user, receiver });
  })
  _socket.on("check", async (data) => {
    console.log("agaya");
    _socket.broadcast.emit("check", "baatain")
  })

  _socket.on("view_message", async (data) => {
    let chat = await Chat.findByIdAndUpdate(data, {
      $set: { read: true }
    }, { new: true })
    console.log("READ MESSAGE", chat)
  })

  _socket.on("help_center", async (data) => {
    console.log("support", data);
    if (data.group_id) {
      let support_message = new Support({
        user_id: data.user_id,
        message: data.message,
        message_id: data.user_id,
        group_id: data.group_id,
        image: data.images,
        read: false,
        expired: false
      });
      let user = await User.findById(data.user_id);
      support_message.save();
      _socket.broadcast.emit("support_message", { support_message, user });
    } else {
      const response = await createGroup(data)
      let support_message = new Support({
        user_id: data.user_id,
        message: data.message,
        message_id: data.user_id,
        group_id: response._id,
        image: data.images,
        read: false,
        expired: false
      });
      let user = await User.findById(data.user_id);
      support_message.save();
      _socket.broadcast.emit("support_message", { support_message, user });
    }
  });

})

module.exports.SEND_FCM = (token, title, body, obj) => {
  var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: `${token}`,
    collapse_key: 'next_key',
    priority: "high",
    content_available: true,
    notification: {
      title: `${title}`,
      body: `${body}`
    },
    apns: {
      payload: {
        aps: {
          "content-available": 1,
        },
      },
    },
    data: obj
  };
  console.log("functions", message)

  fcm.send(message, function (err, response) {
    if (err) {
      console.log("Something has gone wrong!", err);
    } else {
      // res.status(200).json(message)
      console.log("Successfully sent with response: ", response);
    }
  });

}

//this cron job runs at 12:00
cron.schedule('0 0 * * *', async () => {
  // cron.schedule('*/2 * * * *', async () => {
  // console.log('running a task every two minutes');
  const now = new Date();
  const yesterday = date.addDays(now, -12);
  console.log("last", yesterday)
  //find ads which are created 12 days ago
  let adv = await Adv.find({ expired: false, createdAt: { $lt: yesterday } });
  console.log('records', adv)
  if (adv.length > 0) {
    let records = []
    for (let i = 0; i < adv.length; i++) {
      let change = await Adv.findByIdAndUpdate((adv[i]._id), {
        $set: { expired: true, deleteDate: date.addDays(now, 5) }
      }, { new: true });
      let owner = await User.findById(adv[i].user_id);
      records = [...records, change];
      // send notification to ad owner
      SEND_FCM(owner.token, "Ad Expired", `Your ad ${adv[i].title} has been expired.`, { adv: adv[i] })
    }
  }
  let adv2 = await Adv.find({ expired: true, deleteDate: date.addDays(now, -5) });
  console.log('records', adv2)
  for (let i = 0; i < adv2.length; i++) {
    let deleteRecords = await Adv.findByIdAndUpdate((adv2[i]._id), {
      $set: { delete: true }
    }, { new: true });

  }
});

//this job runs at 11:59 PM everyday
cron.schedule('59 23 * * *', async () => {
  const now = new Date();
  try {
    let deliveredOrder = await order.find({ return: false, paid: false, deliveryDate: date.addDays(now, -3) });
    if (deliveredOrder.length) {
      for (let i = 0; i < deliveredOrder.length; i++) {
        let url = `http://3.13.217.144:4000/api/selling_details/${deliveredOrder[i].seller_id._id}`
        const response = await nodeFetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const jsonResponse = await response.json();
        let transfer_url = `http://3.13.217.144:4000/api/stripe/transfer?order_id=${deliveredOrder[i]._id}`;
        let body = {
          amount: deliveredOrder[i].seller_money,
          destination: jsonResponse.data.account_number
        }
        const autoRelease = await nodeFetch(transfer_url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        });
        const jsonPayment = await autoRelease.json();
        console.log(jsonPayment, "AUTO-TRANSFERS")
      }
    }
    let deliveredReturn = await _return.find({ paid: false, deliveryDate: date.addDays(now, -3) }).populate({ path: "order_id" });
    if (deliveredReturn.length) {
      for (let i = 0; i < deliveredReturn.length; i++) {
        let refund_url = `http://3.13.217.144:4000/api/stripe/refund?return_id=${deliveredReturn[i]._id}`;
        let body = {
          chargeId: deliveredReturn[i].order_id.chargeId,
          amount: deliveredReturn[i].order_id.price * 100
        }
        const autoRelease = await nodeFetch(refund_url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        });
        const jsonPayment = await autoRelease.json();
        console.log(jsonPayment, "AUTO-REFUNDS")
      }
    }
  } catch (error) {
    console.log(error)
  }
})

server.listen(process.env.PORT || 4000, () => {
  console.log(`Server running `, process.env.PORT || 4000);
});
