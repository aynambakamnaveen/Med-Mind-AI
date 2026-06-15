import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: String,
      required: true,
    },

    paymentId: {
      type: String,
      required: false,
    },

    signature: String,

    amount: Number,

    status: {
      type: String,
      enum: ["Success", "Failed", "Pending"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);
export const paymentModel = mongoose.model("Payment", paymentSchema);
