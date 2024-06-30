import mongoose from "mongoose";
import Extrarates from "../../../models/ExtraRates";
import MergedExtraRates from "../../../models/MergedExtraRates";
import dbConnect from "../../../lib/dbConnect";
export default async function handler() {
  await dbConnect();

  const oldRates = await Extrarates.find({});

  const mergedRates = {};

  for (const rate of oldRates) {
    const key = `${rate.item}-${rate.specs}`;
    if (!mergedRates[key]) {
      mergedRates[key] = {
        country: rate.country,
        item: rate.item,
        specs: rate.specs,
        transfer: rate.transfer,
        priceIncoming: 0,
        priceOutgoing: 0,
      };
    }

    if (rate.type === "incoming") {
      mergedRates[key].priceIncoming = rate.price;
    } else if (rate.type === "outgoing") {
      mergedRates[key].priceOutgoing = rate.price;
    }
  }

  for (const key in mergedRates) {
    await MergedExtraRates.findOneAndUpdate(
      { item: mergedRates[key].item, specs: mergedRates[key].specs },
      mergedRates[key],
      { upsert: true, new: true }
    );
  }

  console.log("Migration completed successfully");
  mongoose.disconnect();
}

migrateExtrarates().catch(console.error);
