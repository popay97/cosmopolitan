import mongoose, { model, Schema } from "mongoose";

const ReservationSchema = new Schema(
  {
    resId: {
      type: String,
    },
    status: {
      type: String,
    },
    title: {
      type: String,
    },
    name: {
      type: String,
    },
    surname: {
      type: String,
    },
    phone: {
      type: String,
    },
    adults: Number,
    children: Number,
    infants: Number,
    booked: {
      type: Date,
    },
    arrivalAirport: {
      type: String,
    },
    arrivalDate: Date,
    arrivalFlight: {
      number: String,
      arrTime: String,
      depAirport: String,
    },
    depDate: Date,
    departureFlight: {
      number: String,
      arrAirport: String,
      depTime: String,
    },
    transfer: String,
    accomCd: String,
    accom: String,
    resort: String,
    billingDestination: String,
    pricing: {
      ways: Number,
      calculated: {
        type: Boolean,
        default: false,
      },
      incomingInvoice: {
        totalw1: {
          type: Number,
        },
        totalw2: {
          type: Number,
        },
        extraCostw1: {
          price: Number,
          description: String,
        },
        extraCostw2: {
          price: Number,
          description: String,
        },
      },
      outgoingInvoice: {
        handlingFee: Number,
        totalw1: Number,
        totalw2: Number,
        extraCostw1: {
          price: Number,
          description: String,
        },
        extraCostw2: {
          price: Number,
          description: String,
      },
    },
    },
    hasEmptyFields: Boolean,
    hasLocation: Boolean,
    hasPricesIncoming: Boolean,
    hasPricesOutgoing: Boolean,
    outgoingPickupTime: String,
    comments: [
      {
        user: String,
        comment: String,
        date: Date,
      }
    ]
  },
  {
    collection: "reservation",
    Strings: true,
    validateBeforeSave: false,
    timestamps: true,
  }
);
ReservationSchema.set("toObject", { virtuals: true });
ReservationSchema.set("toJSON", { virtuals: true });
ReservationSchema.virtual("pricing.incomingInvoice.total").get(function () {
  return Number(((this.pricing?.incomingInvoice?.totalw1 ?? 0) + (this.pricing?.incomingInvoice?.totalw2 ?? 0) + (this.pricing?.incomingInvoice?.extraCostw1?.price ?? 0) + (this.pricing?.incomingInvoice?.extraCostw2?.price ?? 0)).toFixed(3));
});
ReservationSchema.virtual("pricing.outgoingInvoice.total").get(function () {
  return Number(((this.pricing?.outgoingInvoice?.totalw1 ?? 0) + (this.pricing?.outgoingInvoice?.totalw2 ?? 0) + (this.pricing?.outgoingInvoice?.extraCostw1?.price ?? 0) + (this.pricing.outgoingInvoice.extraCostw2.price ?? 0)).toFixed(3));
});
ReservationSchema.virtual("pricing.outgoingInvoice.totalWithFee").get(function () {
  return Number(((this.pricing?.outgoingInvoice?.totalw1 ?? 0) + (this.pricing?.outgoingInvoice?.totalw2 ?? 0) + (this.pricing?.outgoingInvoice?.extraCostw1?.price ?? 0) + (this.pricing?.outgoingInvoice?.extraCostw2?.price ?? 0) + (this.pricing?.outgoingInvoice?.handlingFee ?? 0)).toFixed(3));
});


export default (mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema));
