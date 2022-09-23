const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");
const videoRoutes = require("./routes/videoRoutes");
const advRoutes = require("./routes/advRoutes");
const sellingRoutes = require("./routes/sellingRoutes.js");
const buyingRoutes = require("./routes/buyingRoutes");
const cartroutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const contributeRoutes = require("./routes/contributeRoutes");
const favouriteRoutes = require("./routes/favouriteRoutes");
const uploadImage = require("./routes/uploadImage");
const Image = require("./routes/upload");
const billing = require("./routes/billingRoutes");
const flag = require("./routes/flagRoutes");
const notification = require("./routes/notifictaion");
const tag = require("./routes/tagRoutes");
const admin = require("./routes/adminRoutes");
const path = require("path");
const chargesRoutes = require("./routes/chargesRoutes");
const returnRoutes = require("./routes/returnRoutes");
const marketingRoutes = require("./routes/marketingRoutes");
const supportRoutes = require("./routes/supportRoutes");
const mail = require("./email");
const helpcenterRoutes = require("./routes/helpcenterRoutes");
const url = "mongodb://localhost:27017/nambakadai";
/* const connect = mongoose.connect(
  "mongodb+srv://codebusters:omSpIMdrjhxqhMZ5@cluster0.sp3ku.mongodb.net/<dbname>?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
); */

const connect = mongoose.connect(url,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
connect.then(
  (db) => {
    console.log("Connected correctly to server");
  },
  (err) => {
    console.log(err);
  }
);
var app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.json("Welcome To Hope Up");
});

app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/adv", advRoutes);
app.use("/api/selling_details", sellingRoutes);
app.use("/api/buying_details", buyingRoutes);
app.use("/api/cart", cartroutes);
app.use("/api/order", orderRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/contribute", contributeRoutes);
app.use("/api/favourite", favouriteRoutes);
app.use("/api/upload", uploadImage);
app.use("/api/image", Image);
app.use("/api/billing", billing);
app.use("/api/flag", flag);
app.use("/api/notification", notification);
app.use("/api/tag", tag);
app.use("/api/admin", admin);
app.use("/api/return", returnRoutes);
app.use("/api/charges", chargesRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/help_center", helpcenterRoutes);
app.use("/sendmail", async (req, res) => {
  let check = await mail.sendMail(
    "maofficial222@gmail.com",
    "new mail agae",
    "Hope up",
    (iserr, err) => {
      if (iserr) {
        console.log(err);
      } else {
        console.log("donr", err);
      }
    }
  );
});

module.exports = app;
