import mongoose, { Schema } from "mongoose";
import ExtrratesSchema from "./ExtraRates";
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
    accomAddress: String,
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
    extraItemsw1: {
      type: [ExtrratesSchema.schema],
    },
    extraItemsw2: {
      type: [ExtrratesSchema.schema],
    },
    comments: [
      {
        user: String,
        comment: String,
        date: Date,
      },
    ],
    changeHistory: [
      {
        changedFields: Object,
        changedBy: String,
        changedAt: Date,
        message: String,
      },
    ],
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

ReservationSchema.plugin(require("mongoose-version"));

ReservationSchema.virtual("pricing.incomingInvoice.total").get(function () {
  return Number(
    (
      (this.pricing?.incomingInvoice?.totalw1 ?? 0) +
      (this.pricing?.incomingInvoice?.totalw2 ?? 0) +
      (this.pricing?.incomingInvoice?.extraCostw1?.price ?? 0) +
      (this.pricing?.incomingInvoice?.extraCostw2?.price ?? 0)
    ).toFixed(3)
  );
});

ReservationSchema.virtual("pricing.outgoingInvoice.total").get(function () {
  return Number(
    (
      (this.pricing?.outgoingInvoice?.totalw1 ?? 0) +
      (this.pricing?.outgoingInvoice?.totalw2 ?? 0) +
      (this.pricing?.outgoingInvoice?.extraCostw1?.price ?? 0) +
      (this.pricing.outgoingInvoice.extraCostw2.price ?? 0)
    ).toFixed(3)
  );
});

ReservationSchema.virtual("pricing.outgoingInvoice.totalWithFee").get(
  function () {
    return Number(
      (
        (this.pricing?.outgoingInvoice?.totalw1 ?? 0) +
        (this.pricing?.outgoingInvoice?.totalw2 ?? 0) +
        (this.pricing?.outgoingInvoice?.extraCostw1?.price ?? 0) +
        (this.pricing?.outgoingInvoice?.extraCostw2?.price ?? 0) +
        (this.pricing?.outgoingInvoice?.handlingFee ?? 0)
      ).toFixed(3)
    );
  }
);

ReservationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.changeHistory = [
      {
        changedFields: this.toObject(),
        changedBy: this._changedBy || "system",
        changedAt: new Date(),
        message: this._changeMessage || "Initial creation",
      },
    ];
  } else if (this.isModified()) {
    const changedFields = {};
    this.modifiedPaths().forEach((path) => {
      changedFields[path] = this.get(path);
    });
    this.changeHistory.push({
      changedFields,
      changedBy: this._changedBy || "system",
      changedAt: new Date(),
      message: this._changeMessage || "Update",
    });
  }
  next();
});

ReservationSchema.methods.remove = function () {
  throw new Error("Deletion is not allowed for Reservation documents");
};

ReservationSchema.static("deleteOne", function () {
  throw new Error("Deletion is not allowed for Reservation documents");
});

ReservationSchema.static("deleteMany", function () {
  throw new Error("Deletion is not allowed for Reservation documents");
});
ReservationSchema.index({ resId: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.path("resId").immutable(true);
// For findOneAndUpdate
ReservationSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const changedFields = {};
  const currentDoc = await this.model.findOne(this.getFilter());

  if (!currentDoc) {
    // If the document doesn't exist, we can't compare changes
    return next();
  }

  // Helper function to compare values
  const hasChanged = (currentValue, newValue) =>
    JSON.stringify(currentValue) !== JSON.stringify(newValue);

  // Check $set operations
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) {
      if (hasChanged(currentDoc.get(key), value)) {
        changedFields[key] = value;
      }
    }
  }

  // Check $unset operations
  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) {
      if (currentDoc.get(key) !== undefined) {
        changedFields[key] = null;
      }
    }
  }

  // Check top-level updates
  for (const [key, value] of Object.entries(update)) {
    if (
      key !== "$set" &&
      key !== "$unset" &&
      hasChanged(currentDoc.get(key), value)
    ) {
      changedFields[key] = value;
    }
  }

  // Only add to changeHistory if there are actual changes
  if (Object.keys(changedFields).length > 0) {
    this.update(
      {},
      {
        $push: {
          changeHistory: {
            changedFields,
            changedBy: update._changedBy || "system",
            changedAt: new Date(),
            message: update._changeMessage || "Update via findOneAndUpdate",
          },
        },
      }
    );
  }

  delete update._changedBy;
  delete update._changeMessage;

  next();
});

// For updateMany
ReservationSchema.pre("updateMany", async function (next) {
  const update = this.getUpdate();
  const changedFields = {};

  // For updateMany, we can't easily compare with current values
  // So we'll just record all fields in the update operation

  if (update.$set) {
    Object.assign(changedFields, update.$set);
  }

  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) {
      changedFields[key] = null;
    }
  }

  for (const [key, value] of Object.entries(update)) {
    if (key !== "$set" && key !== "$unset") {
      changedFields[key] = value;
    }
  }

  if (Object.keys(changedFields).length > 0) {
    this.updateMany(
      {},
      {
        $push: {
          changeHistory: {
            changedFields,
            changedBy: update._changedBy || "system",
            changedAt: new Date(),
            message: update._changeMessage || "Update via updateMany",
          },
        },
      }
    );
  }

  delete update._changedBy;
  delete update._changeMessage;

  next();
});
ReservationSchema.methods.calculatePricing = async function () {
  // Import necessary models
  const Prices = mongoose.model("Prices");
  const Locations = mongoose.model("Locations");

  let pricing = {
    ways: 0,
    calculated: false,
    incomingInvoice: {
      totalw1: 0,
      totalw2: 0,
      total: 0,
    },
    outgoingInvoice: {
      cost: 0,
      handlingFee: 0,
      totalw1: 0,
      totalw2: 0,
      total: 0,
      totalWithFee: 0,
    },
  };

  // Check if location exists
  const location =
    (await Locations.findOne({ code: this.accomCd })) ||
    (await Locations.findOne({ hotel: this.resort }));

  if (!location) {
    this.hasLocation = false;
    this.hasPricesIncoming = false;
    this.hasPricesOutgoing = false;
    this.pricing = pricing;
    return;
  }

  this.billingDestination = location.destination;
  this.hasLocation = true;

  // Calculate ways
  if (
    this.arrivalDate &&
    this.depDate &&
    this.arrivalDate.getMonth() === this.depDate.getMonth() &&
    this.arrivalDate.getFullYear() === this.depDate.getFullYear()
  ) {
    pricing.ways = 2;
  } else {
    pricing.ways = 1;
  }

  // Calculate prices
  const pricesIncomingArrival = await Prices.findOne({
    airport: this.arrivalAirport,
    destination: this.billingDestination,
    validFrom: { $lte: this.arrivalDate },
    validTo: { $gte: this.arrivalDate },
    type: "incoming",
  });

  const pricesIncomingDep = await Prices.findOne({
    airport: this.arrivalAirport,
    destination: this.billingDestination,
    validFrom: { $lte: this.depDate },
    validTo: { $gte: this.depDate },
    type: "incoming",
  });

  const pricesOutgoingArrival = await Prices.findOne({
    airport: this.arrivalAirport,
    destination: this.billingDestination,
    validFrom: { $lte: this.booked },
    validTo: { $gte: this.booked },
    type: "outgoing",
  });

  const pricesOutgoingDep = await Prices.findOne({
    airport: this.arrivalAirport,
    destination: this.billingDestination,
    validFrom: { $lte: this.booked },
    validTo: { $gte: this.booked },
    type: "outgoing",
  });

  // Calculate incoming invoice
  if (pricesIncomingArrival && pricesIncomingDep) {
    if (this.transfer === "STR") {
      pricing.incomingInvoice.totalw1 = Number(
        (
          this.adults * pricesIncomingArrival.shared +
          this.children * pricesIncomingArrival.shared * 0.5
        ).toFixed(3)
      );
      pricing.incomingInvoice.totalw2 = Number(
        (
          this.adults * pricesIncomingDep.shared +
          this.children * pricesIncomingDep.shared * 0.5
        ).toFixed(3)
      );
    } else if (this.transfer === "PTR") {
      if (this.adults + this.children <= 3) {
        pricing.incomingInvoice.totalw1 = Number(
          pricesIncomingArrival.private3less.toFixed(3)
        );
        pricing.incomingInvoice.totalw2 = Number(
          pricesIncomingDep.private3less.toFixed(3)
        );
      } else {
        pricing.incomingInvoice.totalw1 = Number(
          pricesIncomingArrival.private3more.toFixed(3)
        );
        pricing.incomingInvoice.totalw2 = Number(
          pricesIncomingDep.private3more.toFixed(3)
        );
      }
    }
    pricing.incomingInvoice.total = Number(
      (
        pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2
      ).toFixed(3)
    );
    this.hasPricesIncoming = true;
  } else {
    this.hasPricesIncoming = false;
  }

  // Calculate outgoing invoice
  if (pricesOutgoingArrival && pricesOutgoingDep) {
    if (this.transfer === "STR") {
      pricing.outgoingInvoice.cost =
        Number(pricesOutgoingArrival.shared.toFixed(3)) +
        Number(pricesOutgoingDep.shared.toFixed(3));
      pricing.outgoingInvoice.handlingFee = Number(
        (this.adults * 4.5 + this.children * 2.25).toFixed(3)
      );
      pricing.outgoingInvoice.totalw1 = Number(
        (
          pricesOutgoingArrival.shared * this.adults +
          pricesOutgoingArrival.shared * this.children * 0.5
        ).toFixed(3)
      );
      pricing.outgoingInvoice.totalw2 = Number(
        (
          pricesOutgoingDep.shared * this.adults +
          pricesOutgoingDep.shared * this.children * 0.5
        ).toFixed(3)
      );
    } else if (this.transfer === "PTR") {
      if (this.adults + this.children <= 3) {
        pricing.outgoingInvoice.cost =
          Number(pricesOutgoingArrival.private3less.toFixed(3)) +
          Number(pricesOutgoingDep.private3less.toFixed(3));
        pricing.outgoingInvoice.handlingFee = Number(
          (this.adults * 4.5 + this.children * 2.25).toFixed(3)
        );
        pricing.outgoingInvoice.totalw1 = Number(
          pricesOutgoingArrival.private3less.toFixed(3)
        );
        pricing.outgoingInvoice.totalw2 = Number(
          pricesOutgoingDep.private3less.toFixed(3)
        );
      } else {
        pricing.outgoingInvoice.cost =
          Number(pricesOutgoingArrival.private3more.toFixed(3)) +
          Number(pricesOutgoingDep.private3more.toFixed(3));
        pricing.outgoingInvoice.handlingFee = Number(
          (this.adults * 4.5 + this.children * 2.25).toFixed(3)
        );
        pricing.outgoingInvoice.totalw1 = Number(
          pricesOutgoingArrival.private3more.toFixed(3)
        );
        pricing.outgoingInvoice.totalw2 = Number(
          pricesOutgoingDep.private3more.toFixed(3)
        );
      }
    }
    pricing.outgoingInvoice.total = Number(
      (
        pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2
      ).toFixed(3)
    );
    pricing.outgoingInvoice.totalWithFee =
      pricing.ways == 2
        ? Number(
            (
              pricing.outgoingInvoice.total +
              pricing.outgoingInvoice.handlingFee
            ).toFixed(3)
          )
        : Number(
            (
              pricing.outgoingInvoice.totalw2 +
              pricing.outgoingInvoice.handlingFee
            ).toFixed(3)
          );
    this.hasPricesOutgoing = true;
  } else {
    this.hasPricesOutgoing = false;
  }

  if (pricing.incomingInvoice.total > 0 && pricing.outgoingInvoice.total > 0) {
    pricing.calculated = true;
  }

  // Add extra items
  if (this.extraItemsw1 && this.extraItemsw1.length > 0) {
    pricing.incomingInvoice.totalw1 += this.extraItemsw1.reduce(
      (sum, item) => sum + item.price,
      0
    );
    pricing.outgoingInvoice.totalw1 += this.extraItemsw1.reduce(
      (sum, item) => sum + item.price,
      0
    );
  }
  if (this.extraItemsw2 && this.extraItemsw2.length > 0) {
    pricing.incomingInvoice.totalw2 += this.extraItemsw2.reduce(
      (sum, item) => sum + item.price,
      0
    );
    pricing.outgoingInvoice.totalw2 += this.extraItemsw2.reduce(
      (sum, item) => sum + item.price,
      0
    );
  }

  // Update totals
  pricing.incomingInvoice.total = Number(
    (pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(
      3
    )
  );
  pricing.outgoingInvoice.total = Number(
    (pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(
      3
    )
  );
  pricing.outgoingInvoice.totalWithFee =
    pricing.ways == 2
      ? Number(
          (
            pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee
          ).toFixed(3)
        )
      : Number(
          (
            pricing.outgoingInvoice.totalw2 +
            pricing.outgoingInvoice.handlingFee
          ).toFixed(3)
        );

  this.pricing = pricing;
};
ReservationSchema.pre("save", async function (next) {
  const dateFields = ["booked", "arrivalDate", "depDate"];
  const changedFields = this.modifiedPaths();

  if (
    changedFields.some((field) => dateFields.includes(field)) ||
    changedFields.includes("extraItemsw1") ||
    changedFields.includes("extraItemsw2") ||
    this.isNew
  ) {
    await this.calculatePricing();
  }

  next();
});

ReservationSchema.pre("findOneAndUpdate", async function (next) {
  const dateFields = ["booked", "arrivalDate", "depDate"];
  const update = this.getUpdate();
  const shouldRecalculate = Object.keys(update).some(
    (field) =>
      dateFields.includes(field) ||
      field === "extraItemsw1" ||
      field === "extraItemsw2"
  );

  if (shouldRecalculate) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      Object.assign(docToUpdate, update);
      await docToUpdate.calculatePricing();
      this.setUpdate(docToUpdate.toObject());
    }
  }

  next();
});

export default mongoose.models.Reservation ||
  mongoose.model("Reservation", ReservationSchema);
