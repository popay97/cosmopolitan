function dateBetweenFilterFn(rows, id, filterValue) {
  if (!Array.isArray(filterValue)) return rows
  const sd = filterValue[0] ? filterValue[0] : undefined;
  const ed = filterValue[1] ? filterValue[1] : undefined;

  if (ed || sd) {
    const rws = rows.filter((r) => {
      if (
        r.original.booked != undefined &&
        r.original.booked != null &&
        r.original.booked != ""
      ) {
        const cellDate = new Date(r.original.booked.split("T")[0] + "T00:00:00Z");
        if (sd && ed) {
          return cellDate.getTime() >= sd.getTime() && cellDate.getTime() <= ed.getTime();
        }
        if (sd) {
          return cellDate.getTime() >= sd.getTime();
        }
        if (ed) {
          return cellDate.getTime() <= ed.getTime();
        }
      } else {
        return false;
      }
    });
    return rws;
  } else {
    return rows;
  }
}

function dateBetweenArrFn(rows, id, filterValue) {
  if (!Array.isArray(filterValue)) return rows
  const sd = filterValue[0] ? filterValue[0] : undefined;
  const ed = filterValue[1] ? filterValue[1] : undefined;
  if (ed || sd) {
    const rws = rows.filter((r) => {
      if (
        r.original.arrivalDate != undefined &&
        r.original.arrivalDate != null &&
        r.original.arrivalDate != ""
      ) {
        const cellDate = new Date(`${r.original.arrivalDate.split("T")[0]}T00:01:00Z`);
        if (sd && ed) {
          return cellDate.getTime() >= sd.getTime() && cellDate.getTime() <= ed.getTime();
        }
        if (sd) {
          return cellDate.getTime() >= sd.getTime();
        }
        if (ed) {
          return cellDate.getTime() <= ed.getTime();
        }
      } else {
        console.log("nema ga")
        return false;
      }
    });
    return rws;
  } else {
    return rows;
  }
}
function dateBetweenDepFn(rows, id, filterValue) {
  if (!Array.isArray(filterValue)) return rows
  const sd = filterValue[0] ? filterValue[0] : undefined;
  const ed = filterValue[1] ? filterValue[1] : undefined;
  if (ed || sd) {
    const rws = rows.filter((r) => {
      if (
        r.original.depDate != undefined &&
        r.original.depDate != null &&
        r.original.depDate != ""
      ) {
        const cellDate = new Date(r.original.depDate.split("T")[0] + "T00:00:00Z");
        if (sd && ed) {
          return cellDate.getTime() >= sd.getTime() && cellDate.getTime() <= ed.getTime();
        }
        if (sd) {
          return cellDate.getTime() >= sd.getTime();
        }
        if (ed) {
          return cellDate.getTime() <= ed.getTime();
        }
      } else {
        return false;
      }
    });
    return rws;
  } else {
    return rows;
  }
}
function countryFilterFn(rows, id, filterValue) {

  if (filterValue !== 'ME' && filterValue !== 'HR') {
    let rws = rows
    return rws;
  } else {
    const rws = rows.filter((r) => {
      if (
        r.original.arrivalAirport != undefined &&
        r.original.arrivalAirport != null &&
        r.original.arrivalAirport != ""
      ) {
        if (filterValue == 'ME' && r.original.arrivalAirport == 'TIV') {
          return true;
        }
        if (filterValue == 'HR' && r.original.arrivalAirport != 'TIV') {
          return true;
        }
        else {
          return false;
        }
      } else {
        return false;
      }
    });
    return rws;
  }
}



export { dateBetweenFilterFn, dateBetweenArrFn, dateBetweenDepFn, countryFilterFn };
