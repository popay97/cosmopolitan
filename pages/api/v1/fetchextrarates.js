import dbConnect from "../../../lib/dbConnect";
import Extrarates from "../../../models/ExtraRates";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const extrarates = await Extrarates.find({});

    // Create a map to deduplicate and merge data
    const mergedRates = extrarates.reduce((acc, rate) => {
      const key = `${rate.item}-${rate.specs}-${rate.type}`;

      if (!acc[key]) {
        acc[key] = {
          country: rate.country,
          item: rate.item,
          specs: rate.specs,
          type: rate.type,
          price: { incoming: null, outgoing: null },
        };
      }

      if (rate.transefer === "incoming") {
        acc[key].price.incoming = rate.price;
      } else if (rate.transefer === "outgoing") {
        acc[key].price.outgoing = rate.price;
      }

      return acc;
    }, {});

    // Convert the mergedRates object back to an array
    const result = Object.values(mergedRates);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
