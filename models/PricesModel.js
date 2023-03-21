import mongoose, { model, Schema } from "mongoose";

const PricesSchema = new Schema({
    type: {
        type: String,
    },
    airport: {
        type: String,
    },
    destination: {
        type: String,
    },
    shared: {
        type: Number,
    },
    private3less: {
        type: Number,
    },
    private3more: {
        type: Number,
    },
    validFrom: {
        type: Date,
    },
    validTo: {
        type: Date,
    },
    assignedSubcontractor: {
        type: Schema.Types.ObjectId,
        ref: "Subcontractor",
    },
},
    {
        collection: "Prices",
        Strings: true,
        validateBeforeSave: false,
        timestamps: true,
    });

PricesSchema.set("toObject", { virtuals: true });
PricesSchema.set("toJSON", { virtuals: true });
export default (mongoose.models.Prices || mongoose.model("Prices", PricesSchema));
