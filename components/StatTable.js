import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './StatTable.module.css';
const StatTable = ({ year, month, passangers = false, id = "" }) => {
    const [data, setData] = useState([]);
    const [airports, setAirports] = useState([]);
    const [months, setMonths] = useState([]);
    const monthDict = {
        1: 'Jan',
        2: 'Feb',
        3: 'Mar',
        4: 'Apr',
        5: 'May',
        6: 'Jun',
        7: 'Jul',
        8: 'Aug',
        9: 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec',
    };
    useEffect(() => {
        const fetchData = async () => {
            if (!year && !month) return;
            if (year < 2000) return;
            if (!month || month < 1 || month > 12) {
                month = undefined;
            }
            const result = await axios.post('/api/v1/statistics', {
                year,
                month,
            });
            console.log(result.data);
            setData(result.data);
        };

        fetchData();
    }, [year, month]);

    useEffect(() => {
        if (data.length > 0) {
            setAirports([...new Set(data.map((el) => el._id.arrivalAirport))]);

            setMonths([...new Set(data.map((el) => el._id.month))]);
        }
    }, [data]);
    const renderTable = () => {
        const colspan = months.length * 3;
        return (
            <table className={styles.table} id={id}>
                <tr>
                    <th></th>
                    {months.map((month) => {
                        return (
                            <th colSpan={colspan / months.length}>{`${monthDict[month]}-${year}`}</th>
                        )
                    })}
                </tr>
                <tr>
                    <th></th>
                    {passangers ? (months.map((month) => {
                        return (
                            <>
                                <td colSpan={1}>ADULTS</td>
                                <td colSpan={1}>CHILDREN</td>
                                <td colSpan={1}>INFANTS</td>
                            </>
                        )
                    })) : months.map((month) => {
                        return (
                            <>
                                <td colSpan={1}>BOOKED</td>
                                <td colSpan={1}>AMENDED</td>
                                <td colSpan={1}>CANCELLED</td>
                            </>
                        )
                    })}
                </tr>
                {airports.map((airport) => {
                    return (
                        <tr>
                            <td>{airport}</td>
                            {passangers ? months.map((month) => {
                                return (
                                    <>
                                        <td colSpan={1}>{
                                            data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month) ? data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month).reduce((acc, el) => acc + el.adults, 0) : 0
                                        }</td>
                                        <td colSpan={1}>{data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month) ? data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month).reduce((acc, el) => acc + el.children, 0) : 0}</td>
                                        <td colSpan={1}>{data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month) ? data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month).reduce((acc, el) => acc + el.infants, 0) : 0}</td>
                                    </>
                                )
                            }) : months.map((month) => {
                                return (
                                    <>
                                        <td colSpan={1}>{
                                            data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month && el._id.status === 'BOOKED') ? data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month && el._id.status === 'BOOKED').reduce((acc, el) => acc + el.count, 0) : 0
                                        }</td>
                                        <td colSpan={1}>{data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month && el._id.status === 'AMENDED') ? data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month && el._id.status === 'AMENDED').reduce((acc, el) => acc + el.count, 0) : 0}</td>
                                        <td colSpan={1}>{data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month && el._id.status === 'CANCELLED') ? data.filter((el) => el._id.arrivalAirport === airport && el._id.month === month && el._id.status === 'CANCELLED').reduce((acc, el) => acc + el.count, 0) : 0}</td>
                                    </>
                                )
                            })}
                        </tr >
                    )
                }
                )}
                <tr>
                    <td>Subtotals</td>
                    {passangers ? months.map((month) => {
                        return (
                            <>
                                <td colSpan={1}>{data.filter((el) => el._id.month === month) ? data.filter((el) => el._id.month === month).reduce((acc, el) => acc + el.adults, 0) : 0}</td>
                                <td colSpan={1}>{data.filter((el) => el._id.month === month) ? data.filter((el) => el._id.month === month).reduce((acc, el) => acc + el.children, 0) : 0}</td>
                                <td colSpan={1}>{data.filter((el) => el._id.month === month) ? data.filter((el) => el._id.month === month).reduce((acc, el) => acc + el.infants, 0) : 0}</td>
                            </>
                        )
                    }) : months.map((month) => {
                        return (
                            <>
                                <td colSpan={1}>{data.filter((el) => el._id.month === month && el._id.status === 'BOOKED') ? data.filter((el) => el._id.month === month && el._id.status === 'BOOKED').reduce((acc, el) => acc + el.count, 0) : 0}</td>
                                <td colSpan={1}>{data.filter((el) => el._id.month === month && el._id.status === 'AMENDED') ? data.filter((el) => el._id.month === month && el._id.status === 'AMENDED').reduce((acc, el) => acc + el.count, 0) : 0}</td>
                                <td colSpan={1}>{data.filter((el) => el._id.month === month && el._id.status === 'CANCELLED') ? data.filter((el) => el._id.month === month && el._id.status === 'CANCELLED').reduce((acc, el) => acc + el.count, 0) : 0}</td>
                            </>
                        )
                    })}
                </tr>
                <tr>
                    <td>Total</td>
                    {passangers ? months.map((month) => {
                        return (
                            <td colSpan={3}>{data.filter((el) => el._id.month === month) ? data.filter((el) => el._id.month === month).reduce((acc, el) => acc + el.passangers, 0) : 0}</td>
                        )
                    }) : months.map((month) => {
                        return (
                            <td colSpan={3}>{data.filter((el) => el._id.month === month) ? data.filter((el) => el._id.month === month).reduce((acc, el) => acc + el.count, 0) : 0}</td>
                        )
                    })}
                </tr>
            </table>);

    }
    return (
        <div className={styles.tableContainer}>
            {renderTable()}
        </div>
    );
};

export default StatTable;