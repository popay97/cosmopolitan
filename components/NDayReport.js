import React, { useEffect } from 'react';
import ReservationModel from '../models/ReservationModel';
export async function getServerSideProps(context) {
    const AllData = await ReservationModel.find({});
    return {
        props: { AllData },
    }
} 
function NDayReport({AllData}) {
    const [data, setData] = React.useState([]);
    const [filter, setFilter] = React.useState(4);
    const filterData = () => {
        let today = new Date.now();  // current date
        for(let i = 0; i < AllData.length; i++) {
            let date = new Date(AllData[i].arrivalDate);
            let diff = Math.abs(today - date);
            let diffDays = Math.ceil(diff / (1000 * 3600 * 24));
            if(diffDays < filter) {
                setData(data => [...data, AllData[i]]);
            }
        }
    }
    useEffect(() => {
        filterData();
    }  , [filter]);
  return (<>
    <div>Report</div>
    <div style={{width:"100%", minHeight:"100%"}}>
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
                {data.map(res => ( <tr>
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
                </tr>))}
            </tbody>
        </table>

    </div>
    </>
  )
}

export default NDayReport