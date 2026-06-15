import Razorpay from "razorpay";
import crypto from "node:crypto";
import User from '../model/User.model.js'
import {paymentModel} from "../model/Payment.model.js";
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await paymentModel.create({
      user: req.user.id,
      orderId: order.id,
      amount: order.amount,
      status: "Pending",
    });
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid Signature",
      });
    }

    // Update payment and get updated document
    const payment = await paymentModel.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "Success",
      },
      { new: true },
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Decide credits based on amount
    const creditsToAdd = payment.amount === 39900 ? 200 : 500;

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { credits: creditsToAdd },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Payment Verified Successfully",
      creditsAdded: creditsToAdd,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
