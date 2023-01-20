import Reservation from "../../../models/ReservationModel.js";

export default async function handler(req, res) {
  let dataQ;
  if (req.body.year !== undefined && req.body.month !== undefined) {
    req.body.year = parseInt(req.body.year);
    req.body.month = parseInt(req.body.month);
    let startDate = new Date(req.body.year, req.body.month - 1, 1);
    let endDate = new Date(req.body.year, req.body.month, 0);
    dataQ = await Reservation.find({
      status: { $ne: "CANCELLED" },
      arrivalDate: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();
  } else if (req.body.year !== undefined && req.body.month === undefined) {
    req.body.year = parseInt(req.body.year);
    let startDate = new Date(req.body.year, 0, 1);
    let endDate = new Date(req.body.year + 1, 0, 0);
    dataQ = await Reservation.find({
      status: { $ne: "CANCELLED" },
      arrivalDate: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();
  } else {
    res.status(400).json({ error: "Bad Request, pick a time period" });
  }
  const data = JSON.parse(JSON.stringify(dataQ));
  let airports = [];
  let AllData = data.filter((r) => {
    if (r.arrivalDate === undefined) {
      return false;
    } else {
      if (
        airports.indexOf(r.arrivalAirport) === -1 &&
        r.arrivalAirport != undefined &&
        r.arrivalAirport != null &&
        r.arrivalAirport != ""
      ) {
        airports.push(r.arrivalAirport);
      }
      return true;
    }
  });
  let months = [];
  let AllMonths = AllData.filter((r) => {
    let arrdate = new Date(r.arrivalDate);
    if (
      months.indexOf(`${arrdate.getMonth() + 1}-${arrdate.getFullYear()}`) === -1
    ) {
      months.push(`${arrdate.getMonth() + 1}-${arrdate.getFullYear()}`);
    }
    return true;
  });
  //sort months by descending order (newest first)
  months.sort((a, b) => {
    let a1 = a.split("-");
    let b1 = b.split("-");
    if (a1[1] > b1[1]) {
      return -1;
    } else if (a1[1] < b1[1]) {
      return 1;
    } else {
      if (a1[0] > b1[0]) {
        return -1;
      } else if (a1[0] < b1[0]) {
        return 1;
      } else {
        return 0;
      }
    }
  });
  //sort airports alphabetically
  airports.sort((a, b) => {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  });
  let brojTransfera = {};
  let brojPutnika = {};
  for (let i = 0; i < airports.length; i++) {
    brojTransfera[airports[i]] = { airport: airports[i] };
    brojPutnika[airports[i]] = { airport: airports[i] };
    for (let j = 0; j < months.length; j++) {
      brojTransfera[airports[i]][months[j]] = 0;
      brojPutnika[airports[i]][months[j]] = 0;
    }
  }
  for (let i = 0; i < AllData.length; i++) {
    let arrdate = new Date(AllData[i].arrivalDate);
    brojTransfera[AllData[i].arrivalAirport][
      `${arrdate.getMonth() + 1}-${arrdate.getFullYear()}`
    ]++;
    brojPutnika[AllData[i].arrivalAirport][
      `${arrdate.getMonth() + 1}-${arrdate.getFullYear()}`
    ] += AllData[i].adults + AllData[i].children + AllData[i].infants;
  }
  let resortPercentageofTransfersbyAirport = [];
  // calculate the percentage of transfers per resort per airport, do not differentiate between months
  for (let i = 0; i < airports.length; i++) {
    resortPercentageofTransfersbyAirport[airports[i]] = {
      airport: airports[i],
    };
    let totalTransfers = 0;
    for (let j = 0; j < AllData.length; j++) {
      if (AllData[j].arrivalAirport == airports[i]) {
        totalTransfers++;
      }
    }
    for (let j = 0; j < AllData.length; j++) {
      if (AllData[j].arrivalAirport == airports[i]) {
        if (
          resortPercentageofTransfersbyAirport[airports[i]][
          AllData[j].resort
          ] == undefined
        ) {
          resortPercentageofTransfersbyAirport[airports[i]][AllData[j].resort] =
            1 / totalTransfers;
        } else {
          resortPercentageofTransfersbyAirport[airports[i]][
            AllData[j].resort
          ] += 1 / totalTransfers;
        }
      }
    }
  }
  //if months are columns and airports are rows add a total column for airports and a total row for months
  if (req.body.month === undefined) {
    for (let i = 0; i < airports.length; i++) {
      brojTransfera[airports[i]]["Total"] = 0;
      brojPutnika[airports[i]]["Total"] = 0;
      for (let j = 0; j < months.length; j++) {
        brojTransfera[airports[i]]["Total"] +=
          brojTransfera[airports[i]][months[j]];
        brojPutnika[airports[i]]["Total"] +=
          brojPutnika[airports[i]][months[j]];
      }
    }
    brojTransfera["Total"] = { airport: "Total" };
    brojPutnika["Total"] = { airport: "Total" };
    for (let j = 0; j < months.length; j++) {
      brojTransfera["Total"][months[j]] = 0;
      brojPutnika["Total"][months[j]] = 0;
      for (let i = 0; i < airports.length; i++) {
        brojTransfera["Total"][months[j]] +=
          brojTransfera[airports[i]][months[j]];
        brojPutnika["Total"][months[j]] += brojPutnika[airports[i]][months[j]];
      }
    }
  }
  airports.push("Total");
  const objToReturn = {
    months: months,
    airports: airports,
    brojTransfera: brojTransfera,
    brojPutnika: brojPutnika,
    resortPercentageofTransfersbyAirport: resortPercentageofTransfersbyAirport,
  };
  res.status(200).json(objToReturn);
}
