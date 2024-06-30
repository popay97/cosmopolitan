import mongoose, { Schema } from "mongoose";

const MergedExtraratesSchema = new Schema(
  {
    country: {
      type: String,
    },
    item: {
      type: String,
    },
    specs: {
      type: String,
    },
    priceIncoming: {
      type: Number,
    },
    priceOutgoing: {
      type: Number,
    },
    transfer: {
      type: String,
    },
  },
  {
    collection: "MergedExtrarates",
    timestamps: true,
  }
);

MergedExtraratesSchema.index({ item: 1, specs: 1 }, { unique: true });

MergedExtraratesSchema.set("toObject", { virtuals: true });
MergedExtraratesSchema.set("toJSON", { virtuals: true });

export default mongoose.models.MergedExtrarates ||
  mongoose.model("MergedExtrarates", MergedExtraratesSchema);
