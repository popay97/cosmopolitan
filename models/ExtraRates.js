import mongoose, { model, Schema } from "mongoose";

const ExtraratesSchema = new Schema(
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
    type: {
      type: String,
    },
    price: {
      type: Number,
    },
    transefer: {
      type: String,
    },
  },
  {
    collection: "Extrarates",
    Strings: true,
    validateBeforeSave: false,
    timestamps: true,
  }
);

ExtraratesSchema.set("toObject", { virtuals: true });
ExtraratesSchema.set("toJSON", { virtuals: true });

export default mongoose.models.Extrarates ||
  mongoose.model("Extrarates", ExtraratesSchema);
