const parser = require("fast-xml-parser");
const express = require("express");
const nodeFetch = require("node-fetch");
const EmailN = require('../email_notification')
const middlewear = require("../middleware");
var router = express.Router();
const Joi = require("@hapi/joi");
const Product = require("../model/product");
const Cart = require("../model/cart");
const Order = require("../model/order");
const hopeup_buyershare = 0.1;
const hopeup_sellershare = 0.2;
const Notification = require("../index");
const AdminNotification = require("../model/admin_notifications")

const shippingHeaders = {
  Accept: "application/xml",
  "Content-Type": "application/xml",
};

async function getShippingLabel(data, cartData) {
  let shippingLabelURL = "https://onlinetools.ups.com/ship/v1701/shipments";
  const upsHeaders = {
    AccessLicenseNumber: 'DDA269451F977D95',
    Username: 'Teasleymike',
    Password: "Ups123!",
    transId: "1234",
    transactionSrc: "Test Track",
  };
  const body = {
    ShipmentRequest: {
      Shipment: {
        Description: "",
        Shipper: {
          Name: "Teasley Mike",
          ShipperNumber: "7E542A",
          Address: {
            AddressLine: cartData.address,
            City: cartData.city,
            StateProvinceCode: cartData.state,
            PostalCode: cartData.postal_code,
            CountryCode: "US"
          }
        },
        ShipTo: {
          Name: data.name,
          Phone: {
            Number: data.phone
          },
          Address: {
            AddressLine: data.address,
            City: data.city,
            PostalCode: data.zip,
            StateProvinceCode: data.state,
            CountryCode: "US"
          }
        },
        Service: {
          Code: data.shippingService
        },
        Package: {
          Packaging: {
            Code: cartData.package,
            Description: ""
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: "LBS"
            },
            Weight: cartData.weight
          }
        },
        PaymentInformation: {
          ShipmentCharge: {
            Type: "01",
            BillShipper: {
              AccountNumber: "7E542A"
            }
          }
        },
        ShipmentServiceOptions: {
          LabelDelivery: {
            Email: {
              EmailAddress: data.email,
              FromEmailAddress: "Teasleymike@hopeup.net",
              FromName: "Hope Up LLC."
            }
          }
        }
      },
      LabelSpecification: {
        LabelImageFormat: {
          Code: "PNG",
          Description: ""
        },
        HTTPUserAgent: "Mozilla/4.5"
      }
    }
  };

  try {
    const responseFromUpsLabel = await nodeFetch(
      shippingLabelURL,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: upsHeaders,
      }
    );
    let upsLabelResponse = await responseFromUpsLabel.json();
    return upsLabelResponse;
  } catch (error) {
    return error
  }
}

router.get("/tracking", middlewear.checkToken, async (req, res) => {
  // let order = await Order.find().populate({path:"product_id" , select : "title , description , images , createdAt"}).populate({path :'buyer_id' , select : 'first_name , last_name , username'}).populate({path :'seller_id' , select : 'first_name , last_name , username'});
  let data = req.query;
  let per_page = 80;
  let page = 1;
  req.query.page ? (page = req.query.page) : null;
  console.log("data", data);
  let order2 = await Order.aggregate([
    {
      $sort: { _id: -1 },
    },
    {
      $match: { order_status: "incomplete" },
    },

    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "buyer_id",
        foreignField: "_id",
        as: "buyer",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "seller_id",
        foreignField: "_id",
        as: "seller",
      },
    },
    {
      $lookup: {
        from: "billingdetails",
        let: { user_id: "$buyer_id", order_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user_id", "$$user_id"] },
                  //  { $match : {$in :[ '$order_id' , '$$order_id'   ]}}
                ],
              },
            },
          },
        ],
        as: "billing Details",
      },
    },
    data.order_no
      ? {
        $match: { order_no: parseInt(data.order_no) },
      }
      : data.user
        ? {
          $match: { "buyer.first_name": { $regex: data.user } },
        }
        : data.title
          ? {
            $match: { "product.title": { $regex: data.title } },
          }
          : {
            $match: { order_status: "complete" },
          },
    {
      $skip: per_page * page - per_page,
    },
    {
      $limit: per_page,
    },
    {
      $project: {
        "product.updatedAt": 0,
        "buyer.salt": 0,
        "buyer.hash_password": 0,
        "buyer.updatedAt": 0,
        "seller.salt": 0,
        "seller.hash_password": 0,
        "seller.updatedAt": 0,
      },
    },
  ]);

  res.status(200).json(order2);
});

router.post("/domestic-rates", middlewear.checkToken, async (req, res) => {
  const { product_id, line1, destination_zip, city, state, shipping_method, shipping_service, package } = req.body;
  console.log("running")
  const schema = Joi.object({
    product_id: Joi.array().required(),
    line1: Joi.string().required(),
    destination_zip: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    shipping_method: Joi.string().required(),
    shipping_service: Joi.string().required(),
    package: Joi.string().required()
  });

  try {
    let value = await schema.validateAsync(req.body);
    if (!value.error) {
      let rate = 0;
      let userId = "849HOPEU7325";

      let URLForAddress = `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&`;
      URLForAddress += `XML=<AddressValidateRequest USERID="${userId}"><Revision>1</Revision><Address ID="0">`;
      URLForAddress += `<Address1>${line1}</Address1><Address2></Address2><City>${city}</City><State>${state}</State>`;
      URLForAddress += `<Zip5>${destination_zip}</Zip5><Zip4></Zip4></Address></AddressValidateRequest>`;

      const responseFromAddress = await nodeFetch(URLForAddress, {
        method: "POST",
        headers: shippingHeaders,
      });

      let addressInJson = await responseFromAddress.text();
      addressInJson = parser.parse(addressInJson);

      if (!addressInJson.AddressValidateResponse.Address.Error) {
        if (product_id.length) {
          await Promise.all(
            product_id.map(async (product) => {
              let pounds, ounces;

              const productFound = await Product.findById({ _id: product });
              const weight = productFound.weight.split(".");

              if (weight.length === 2) {
                pounds = weight[0];
                ounces = `0.${weight[1]}`;
              } else {
                pounds = weight[0];
                ounces = 0;
              }

              let ups_url = "https://onlinetools.ups.com/ship/v1/rating/Rate"
              const upsHeaders = {
                AccessLicenseNumber: 'DDA269451F977D95',
                Username: 'Teasleymike',
                Password: "Ups123!",
                transId: "1234",
                transactionSrc: "Test Track",
              }
              let body = {
                RateRequest: {
                  Request: {
                    SubVersion: "1703",
                    TransactionReference: {
                      CustomerContext: " "
                    }
                  },
                  Shipment: {
                    ShipmentRatingOptions: {
                      UserLevelDiscountIndicator: "False"
                    },
                    Shipper: {
                      Name: "",
                      ShipperNumber: " ",
                      Address: {
                        AddressLine: "",
                        City: "",
                        StateProvinceCode: "",
                        PostalCode: productFound.postal_code,
                        CountryCode: "US"
                      }
                    },
                    ShipTo: {
                      Name: "",
                      Address: {
                        AddressLine: "",
                        City: "",
                        StateProvinceCode: "",
                        PostalCode: destination_zip,
                        CountryCode: "US"
                      }
                    },
                    Service: {
                      Code: shipping_service,
                      Description: ""
                    },
                    Package: {
                      PackagingType: {
                        Code: package,
                        Description: ""
                      },
                      PackageWeight: {
                        UnitOfMeasurement: {
                          Code: "LBS"
                        },
                        Weight: productFound.weight
                      }
                    }
                  }
                }
              }
              const responseFromUpsRate = await nodeFetch(
                ups_url,
                {
                  method: "POST",
                  body: JSON.stringify(body),
                  headers: upsHeaders,
                }
              );

              let upsRateResponse = await responseFromUpsRate.json()
              console.log(upsRateResponse, "RATERESPONSE")
              if (upsRateResponse.response && upsRateResponse.response.errors.length) {
                return res.status(400).json({ message: upsRateResponse.response.errors[0].message })
              } else if (upsRateResponse.RateResponse.Response.ResponseStatus.Code == 1) {
                rate = upsRateResponse.RateResponse.RatedShipment.TotalCharges.MonetaryValue
                return res.status(200).json({ total_price: rate });
              } else {
                return res.status(400).json(upsRateResponse.response.errors[0])
              }
            })
          );
        }
      } else {
        return res.status(400).json({
          message: `${addressInJson.AddressValidateResponse.Address.Error.Description}`,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: `${error}` });
  }
});

router.get("/create", middlewear.checkToken, async (req, res) => {
  const data = req.query;
  const schema = Joi.object({
    user_id: Joi.string().required(),
    name: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    address: Joi.string().required(),
    zip: Joi.number().required(),
    country: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    card_number: Joi.string(),
    card_id: Joi.string(),
    shippingMethod: Joi.string(),
    shippingService: Joi.string(),
    shippingFee: Joi.string(),
    total: Joi.string(),
    subTotal: Joi.string(),
    hopeupshare: Joi.string(),
    chargeId: Joi.string().required()
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      let order;
      let cartData;
      let object

      let carts = await Cart.find({ user_id: data.user_id }).populate(
        "product_id"
      );
      if (carts.length === 0) {
        return res.status(404).json({ message: "Cart is Empty" });
      }

      let foundOrder = await Order.findOne().sort({ _id: -1 });

      let number = 1;
      if (foundOrder && foundOrder.order_no && foundOrder.order_no != 0) {
        number = foundOrder.order_no + 1;
      } else {
        number = 1;
      }

      carts.map(async (cart, index) => {
        cartData = cart.product_id;
        number = number + index;
        let hopeup_buyerFee = hopeup_buyershare * cart.total;
        let hopeup_sellerFee = hopeup_sellershare * cart.total;
        let seller_money = 0.8 * cart.total;

        object = {
          address: data.address,
          buyer_id: data.user_id,
          city: data.city,
          country: "US",
          chargeId: data.chargeId,
          hopeup_buyerFee,
          hopeup_sellerFee,
          image: cart.image,
          name: data.name,
          order_no: number,
          phone: data.phone,
          price: cart.price,
          product_id: cart.product_id._id,
          quantity: cart.quantity,
          seller_id: cart.seller_id,
          seller_money,
          shipping_method: data.shippingMethod,
          shipping_rate: data.shippingFee,
          shipping_service: data.shippingService,
          state: data.state,
          total: cart.total + hopeup_buyerFee,
          zip: data.zip
        };

        order = new Order(object);
        order.save();

        await Product.findByIdAndUpdate(cart.product_id._id, {
          $set: { available: false }
        }, { new: true })

        let notification = {
          user_id: data.user_id,
          title: "ordered",
          notification_type: "product",
          product_id: cart.product_id._id,
          notification_id: cart.product_id.user_id,
        };
        Notification.not(notification);

        let notifiyAdmin = {
          order_id: order._id,
          title: "ordered",
          body: `${data.name} has ordered ${cart.product_id.title}`,
          notification_type: "order",
        }

        let admin_not = new AdminNotification(notifiyAdmin);
        admin_not.save();
      });

      let sellerURL = `http://3.13.217.144:4000/api/user/${cartData.user_id}`;

      const sellerDataResp = await nodeFetch(
        sellerURL,
        {
          method: "GET",
        }
      );

      let responseData = await sellerDataResp.json();

      const label_response = await getShippingLabel(data, cartData);
      console.log(label_response, "LABEL");
      if (label_response.ShipmentResponse) {
        let trackingId = label_response.ShipmentResponse.ShipmentResults.PackageResults.TrackingNumber;
        let shippingLabel = label_response.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.HTMLImage
        let shippingLabelg = label_response.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage
        let subject = "Hope Up LLC";
        let name = data.name;
        let buyers_text = `You have ordered ${cartData.title} from The Hope Up Store. Your order should shipout within 2 business days. Your tracking number is: ${trackingId}. Here's a overview of what you bought:`;
        let sellers_text = `Your product ${cartData.title} has been order through The Hope Up Store. The Tracking Number is :${trackingId}. Ship the item within 2 business days. Here's the overview of your order:`
        let prodata = {
          title: cartData.title,
          image: object.image,
          price: object.price,
          shipping: object.shipping_method,
          address: object.address + "," + object.city + "," + object.state + "," + object.zip,
          tracking_id: trackingId
        }
        let summary = {
          subTotal: data.subTotal,
          shipping: data.shippingFee,
          hopeup: data.hopeupshare,
          total: data.total
        }

        let labels = {
          html: shippingLabel,
          graphic: shippingLabelg
        }

        let sname = responseData.data.first_name + " " + responseData.data.last_name
        EmailN.orderVerification(data.email, subject, name, buyers_text, prodata, summary, (iserr, err) => {
          if (!iserr) {
            console.log("Email sent successfully to buyer")
          } else {
            console.log("Email not sent to buyer")
          }
        })
        EmailN.shippingverification(responseData.data.email, subject, sname, sellers_text, prodata, labels, (iserr, err) => {
          if (!iserr) {
            console.log("Email sent successfully to seller")
          } else {
            console.log("Email not sent to seller")
          }
        })
        res.status(200).json({ order_id: order._id, track_id: trackingId });
        await Cart.deleteMany({ user_id: data.user_id });
      } else throw label_response.response.errors[0];
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/package-track/:track_id", middlewear.checkToken, async (req, res) => {
  const { track_id } = req.params;
  const { shipping_method } = req.body;
  console.log(shipping_method, "SSM", req.params)

  if (shipping_method == "USPS") {
    try {
      let userId = "849HOPEU7325";

      let URLForPackageTrack = `https://secure.shippingapis.com /ShippingAPI.dll?API=TrackV2&XML=`;
      URLForPackageTrack += `<TrackRequest USERID="${userId}"><TrackID ID="${track_id}"></TrackID></TrackRequest>`;

      const responseFromPackageTrack = await nodeFetch(URLForPackageTrack, {
        method: "POST",
        headers: shippingHeaders,
      });

      let packagetrackInJson = await responseFromPackageTrack.text();
      packagetrackInJson = parser.parse(packagetrackInJson);
      console.log(packagetrackInJson.TrackResponse.TrackInfo.Error);

      if (!packagetrackInJson.TrackResponse.TrackInfo.Error) {
        res.status(200).json({ data: packagetrackInJson });
      } else {
        res.status(400).json({
          message: `${packagetrackInJson.TrackResponse.TrackInfo.Error.Description}`,
        });
      }
    } catch (error) {
      res.status(400).json(error);
      console.log(error);
    }
  } else {
    try {
      let ups_track_url = `https://onlinetools.ups.com/track/v1/details/${track_id}`;
      const upsHeaders = {
        AccessLicenseNumber: 'DDA269451F977D95',
        Username: 'Teasleymike',
        Password: "Ups123!",
        transId: "1234",
        transactionSrc: "Test Track",
      }
      const responseFromUPSTrack = await nodeFetch(ups_track_url, {
        method: 'GET',
        headers: upsHeaders
      })

      let upsTrackResp = await responseFromUPSTrack.json();
      console.log(upsTrackResp, "TRACKRESPONSE")

      if (upsTrackResp.trackResponse.shipment) {
        res.status(200).json({ data: upsTrackResp.trackResponse })
      } else {
        res.status(400).json({ message: "Please try again" })
      }
    } catch (error) {
      res.status(400).json(error);
      console.log(error);
    }
  }
});

router.post("/package-track-fields/:track_id", middlewear.checkToken, async (req, res) => {
  const { track_id } = req.params;
  try {
    let userId = "849HOPEU7325";

    let URLForPackageTrackFields = `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=`;
    URLForPackageTrackFields += `<TrackFieldRequest USERID="${userId}"><Revision>1</Revision><ClientIp>3.13.217.144</ClientIp>`;
    URLForPackageTrackFields += `<SourceId>Hope UP L.L.C</SourceId><TrackID ID="${track_id}"/></TrackFieldRequest>`;

    const responseFromPackageTrackField = await nodeFetch(
      URLForPackageTrackFields,
      {
        method: "POST",
        headers: shippingHeaders,
      }
    );

    let packageTrackFieldsInJson = await responseFromPackageTrackField.text();
    packageTrackFieldsInJson = parser.parse(packageTrackFieldsInJson);
    console.log(packageTrackFieldsInJson.TrackResponse.TrackInfo);

    if (!packageTrackFieldsInJson.TrackResponse.TrackInfo.Error) {
      res.status(200).json({ data: packageTrackFieldsInJson });
    } else {
      res.status(400).json({
        message: `${packageTrackFieldsInJson.TrackResponse.TrackInfo.Error.Description}`,
      });
    }
  } catch (error) {
    res.status(400).json(error);
    console.log(error);
  }
});

router.put("/track-id", middlewear.checkToken, async (req, res) => {
  const { order_id, track_id } = req.body;
  console.log(track_id, "TACKID", req.body)
  try {
    const order = await Order.findByIdAndUpdate(order_id, {
      $set: { track_id: track_id }
    }, { new: true }, function (resp, err) {
      if (resp) {
        console.log(resp, "OREDERRES")
        return res.status(200).json(order);
      } else {
        console.log(err)
      }
    });
  } catch (error) {
    res.status(400).json(error);
    console.log(error);
  }
});

router.put("/orderComplete/:order_id", middlewear.checkToken, async (req, res) => {
  const { order_id } = req.params;
  let data = req.body;
  console.log(req.body, "DELIVERYDAtE")
  try {
    const order = await Order.findByIdAndUpdate(order_id, {
      $set: { order_status: "completed", deliveryDate: data.deliveryDate }
    }, { new: true }, function (err, docs) {
      if (err) {
        console.log(err, "order not completed");
        let notifiyAdmin = {
          order_id: order_id,
          title: "Order Delivered",
          body: 'order has been deliverd to address',
          notification_type: "order",
        }

        let admin_not = new AdminNotification(notifiyAdmin);
        admin_not.save();
        throw err
      } else {
        console.log(docs, "RE");
        let
        return res.status(200).json({ updated: docs })
      }
    })
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
})

router.put("/order_paid/:order_id", middlewear.checkToken, async (req, res) => {
  const { order_id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(order_id, {
      $set: { paid: true }
    }, { new: true }, function (err, docs) {
      if (err) {
        console.log(err)
        throw err
      } else {
        console.log(docs, "RE");
        return res.status(200).json({ updated: docs })
      }
    })
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
})

router.put("/:cart_id", middlewear.checkToken, async (req, res) => {
  const data = req.body;
  const { cart_id } = req.params;
  const schema = Joi.object({
    quantity: Joi.number(),
  });
  try {
    let value = await schema.validateAsync(data);
    if (!value.error) {
      let cart = await Cart.findById(cart_id);
      cart["quantity"] = data.quantity;
      cart["total"] = cart.price * data.quantity;
      cart.save();

      res.status(200).json(cart);
    }
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/:user_id", middlewear.checkToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    console.log(user_id);
    let sell_array = [];
    let buy_array = [];
    let sell = await Order.find({ seller_id: user_id })
      .populate({
        path: "product_id",
        select: "title , description , images , createdAt",
      })
      .populate({
        path: "buyer_id",
        select: "first_name , last_name , username",
      })
      .sort({ _id: -1 });
    sell.map((s) => {
      sell_array = [...sell_array, s];
    });
    let buy = await Order.find({ buyer_id: user_id })
      .populate({
        path: "product_id",
        select: "title , description , images , createdAt",
      })
      .populate({
        path: "buyer_id",
        select: "first_name , last_name , username",
      })
      .sort({ _id: -1 });
    console.log("bbbbbbb", buy);

    buy.map((b) => {
      buy_array = [...buy_array, b];
    });
    res.status(200).json({
      sold: sell_array,
      bought: buy_array,
    });
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/", middlewear.checkToken, async (req, res) => {
  let order = await Order.find()
    .populate({
      path: "product_id",
      select: "title , description , images , price, createdAt",
    })
    .populate({
      path: "buyer_id",
      select: "first_name , last_name , username",
    })
    .populate({
      path: "seller_id",
      select: "first_name , last_name , username",
    }).sort({ _id: -1 })
  res.status(200).json(order);
});

router.delete("/:cart_id", middlewear.checkToken, async (req, res) => {
  const { cart_id } = req.params;
  try {
    let cart = await Cart.findByIdAndRemove(cart_id);
    res.status(200).json(cart);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/byId/:order_id", middlewear.checkToken, async (req, res) => {
  const { order_id } = req.params;
  console.log(order_id, "GETORDERBYID")
  try {
    await Order.findById(order_id, function (err, docs) {
      if (err) {
        console.log(err);
        return res.status(404).json(err)
      } else {
        console.log(docs, "ORDERID")
        return res.status(200).json(docs)
      }
    })
  } catch (error) {
    return res.status(400).json(error)
  }
})

module.exports = router;
