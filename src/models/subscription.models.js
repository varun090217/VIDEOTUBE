import mongoose, { Schema } from "mongoose";

const susbscriptionSchema = new Schema(
  {
    Subscriber: {
      type: Schema.Types.ObjectId,
      required: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      required: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", susbscriptionSchema);
