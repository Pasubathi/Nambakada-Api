const express = require("express");
var router = express.Router();
const Joi = require('@hapi/joi');
const Return = require('../model/return');
const Order = require('../model/order');
const Email = require("../email");
// const Secret_Key = "sk_test_30oA8vmt8cNzdbua9OJu5nP900wtoIEBrC";
const Secret_Key = "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";
const stripe = require("stripe")(Secret_Key);
const SEND_FCM = require('../')
const middlewear = require("../middleware");
const AdminNotification = require('../model/admin_notifications')

router.post("/", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    const schema = Joi.object({
        images: Joi.array(),
        description: Joi.string(),
        order_id: Joi.string().required(),
        product_id: Joi.string().required(),
        seller_id: Joi.string().required(),
        buyer_id: Joi.string().required(),
        chargeId: Joi.string().required()
    });
    try {
        let value = await schema.validateAsync(data);
        if (!value.error) {
            let check = await Return.find({ product_id: data.product_id, seller_id: data.seller_id });
            if (check && check.length > 0) {
                return res.status(400).json("You already added this product in return list");
            }
            else {
                let obj = new Return(data);
                obj.save();
                let notifiyAdmin = {
                    return_id: obj._id,
                    title: "Return File",
                    body: `The Return Request has been filed for order_no#${data.order_no}`,
                    notification_type: "return",
                }

                let admin_not = new AdminNotification(notifiyAdmin);
                admin_not.save();
                return res.status(200).json(obj);
            }

        }

    } catch (err) {
        console.log(err)
    }
})

router.get("/", middlewear.checkToken, async (req, res) => {
    let per_page = 30;
    let page = 1;
    req.query.page ? page = req.query.page : null;
    let ret = await Return.find().sort({ _id: -1 }).skip(per_page * page - per_page).limit(per_page).populate("order_id").populate("product_id").populate("seller_id").populate("buyer_id");
    res.status(200).json(ret);
});

router.get("/:order_id",middlewear.checkToken, async (req, res) => {
    const { order_id } = req.params;
    try {
        const ret = await Return.findOne({ order_id: order_id });
        console.log(ret, "RETURN")
        if (ret === null) {
            return res.status(404).json({ message: "No Return Found" })
        } return res.status(200).json(ret)
    } catch (error) {
        return res.status(400).json({ error: error, message: "Not found" })
    }
})

router.put("/:return_id", middlewear.checkToken, async (req, res) => {
    const data = req.body;
    console.log(data, "RUNNING", req.params)
    const schema = Joi.object({
        return_status: Joi.string().valid("accept", "reject"),
        admin_description: Joi.string(),
        chargeId: Joi.string()
    })
    try {
        let value = await schema.validateAsync(data);
        if (!value.error && req.params.return_id) {
            if (data.return_status === 'accept') {
                let ret = await Return.findByIdAndUpdate(req.params.return_id, {
                    $set: data
                }, { new: true }).populate({
                    path: "buyer_id"
                }).populate({
                    path: "seller_id"
                }).populate({
                    path: "product_id"
                }).populate({
                    path: "order_id"
                });
                console.log(ret, "RETURNTO");
                //email is not coming in ret so fetch the user and user below for sending email
                if (ret) {
                    let updateOrder = await Order.findByIdAndUpdate(ret.order_id._id, {
                        $set: { return: true }
                    }, { new: true });
                    console.log(updateOrder, "ORDER_RETURN_FILED")
                    SEND_FCM(ret.buyer_id.token, 'Return Accepted', `Your return request for order number ${ret.order_id.order_no} has been ${ret.return_status} by Admin because ${ret.admin_description}, Please provide Return Tracking Id or Inquiry Number`, ret)
                    Email.sendMail(ret.buyer_id.email, "Return Information", `Your return request for order number ${ret.order_id.order_no} has been ${ret.return_status} by Admin because ${ret.admin_description}`, (iserr, err) => {
                        if (!iserr) {
                            console.log("email sended")
                        } else {
                            console.log("Email not send", err)
                        }
                    })
                    return res.status(200).json(ret);
                }
            } else {
                let ret = await Return.findByIdAndUpdate(req.params.return_id, {
                    $set: data
                }, { new: true }).populate({
                    path: "buyer_id"
                }).populate({
                    path: "seller_id"
                }).populate({
                    path: "product_id"
                }).populate({
                    path: "order_id"
                });
                if (ret) {
                    let updateOrder = await Order.findByIdAndUpdate(ret.order_id._id, {
                        $set: { return: false }
                    }, { new: true });
                    console.log(updateOrder, "ORDER_RETURN_FILED")
                    SEND_FCM(ret.buyer_id.token, 'Return Rejected', `Your return request for order number ${ret.order_id.order_no} has been ${ret.return_status} by Admin because ${ret.admin_description}`, ret)
                    Email.sendMail(ret.buyer_id.email, "Return Information", `Your return request for order number ${ret.order_id.order_no} has been ${ret.return_status} by Admin because ${ret.admin_description}`, (iserr, err) => {
                        if (!iserr) {
                            console.log("email sended")
                        } else {
                            console.log("Email not send", err)
                        }
                    })
                    return res.status(200).json(ret);
                }
            }
        }
    } catch (err) {
        console.log(err, "RETURN ERROR")
        return res.status(400).json(err);
    }

});

router.put("/:track_id", middlewear.checkToken, async (req, res) => {
    const { track_id } = req.params;
    const data = req.body;
    try {
        let obj = {
            ...data,
            track_id: track_id
        }
        const updateRet = await findByIdAndUpdate(data._id, {
            $set: obj
        }, { new: true });
        let notifiyAdmin = {
            return_id: data._id,
            title: "Return Tracking",
            body: `The tracking_id#${track_id} for return is submitted`,
            notification_type: "return",
        }

        let admin_not = new AdminNotification(notifiyAdmin);
        admin_not.save();
        return res.status(200).json(updateRet)
    } catch (error) {
        return res.status(400).json(error)
    }
});

router.put("/returnDelivery/:return_id", middlewear.checkToken, async (req, res) => {
    const { return_id } = req.params;
    const data = req.body;
    try {
        let ret = await Return.findByIdAndUpdate(return_id, {
            $set: { return_Delivery: "complete", deliveryDate: data.deliveryDate }
        }, { new: true }, function (err, docs) {
            if (err) {
                console.log(err, "return not completed")
                throw err
            } else {
                console.log(docs, "RE");
                let notifiyAdmin = {
                    return_id: return_id,
                    title: "Return Completed/Delivered",
                    body: `The PArcel has been successfully returned to the seller`,
                    notification_type: "return",
                  }
          
                  let admin_not = new AdminNotification(notifiyAdmin);
                  admin_not.save();
                return res.status(200).json({ updated: docs })
            }
        });
    } catch (error) {
        return res.status(400).json(error)
    }
})

router.put("/return_paid/:return_id", middlewear.checkToken, async (req, res) => {
    const { return_id } = req.params;
    try {
        const ret = await Return.findByIdAndUpdate(return_id, {
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

module.exports = router;