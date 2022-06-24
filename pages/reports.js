import React, { useEffect } from "react";
import Reservation from "../models/ReservationModel";
export async function getServerSideProps(context) {
  const AllData = await Reservation.find({});
  return {
    props: { AllData},
  };
}
function NDayReport({ AllData }) {
  const [data, setData] = React.useState([]);
  const [filter, setFilter] = React.useState(4);
  const filterData = () => {
    //set data array to contain only objects that less then filter days away from today=
    setData(
      AllData.filter((item) => {
        const date = new Date(item.arrivalDate);
        const diff = Math.abs(date.getTime() - new Date().getTime());
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
        if (diffDays < filter) {
          return item;
        }
      })
    );
  };
  useEffect(() => {
    console.log("useEffect");
    console.log(AllData);
    filterData();
  }, [filter]);
  return (
    <>
      <div>Report</div>
      <div style={{ width: "100%", minHeight: "100%" }}>
        <table>
          <thead>
            <tr>
              <th>Reservation ID</th>
              <th>Title</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Booking Date</th>
              <th>Arrival Airport</th>
              <th>Arrival Date</th>
              <th>Arrival Flight</th>
              <th>Departure Date</th>
              <th>Departure Flight</th>
              <th>Transfer Type</th>
              <th>Accommodation</th>
              <th>Accomodation Code</th>
              <th>Resort</th>
            </tr>
          </thead>
          <tbody>
            {data.map((res) => (
              <tr>
                <td>{res.reservationId}</td>
                <td>{res.title}</td>
                <td>{res.name}</td>
                <td>{res.surname}</td>
                <td>{res.phone}</td>
                <td>{res.booked}</td>
                <td>{res.arrivalAirport}</td>
                <td>{res.arrivalDate}</td>
                <td>{res.arrivalFlight.number}</td>
                <td>{res.depDate}</td>
                <td>{res.departureFlight.number}</td>
                <td>{res.transfer}</td>
                <td>{res.accom}</td>
                <td>{res.accomCd}</td>
                <td>{res.resort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default NDayReport;
