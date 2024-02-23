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
          default: 0,
        },
        totalw2: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          default: 0,
        },
        extraCost: {
          type: Number,
          default: 0,
        }
      },
      outgoingInvoice: {
        cost: Number,
        handlingFee: Number,
        totalw1: Number,
        totalw2: Number,
        total: Number,
        totalWithFee: Number,
      },
    },
    hasEmptyFields: Boolean,
    hasLocation: Boolean,
    hasPricesIncoming: Boolean,
    hasPricesOutgoing: Boolean,
    incomingPickupTime: String,
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
export default (mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema));
