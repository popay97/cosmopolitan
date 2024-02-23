import React from 'react';
import styles from './StatTable.module.css';
const StatTable = ({ data, airports ,months , passangers = false, id = "", year, type }) => {
    React.useEffect(() => {
        console.log(data);
        console.log(airports);
        console.log(months);
    }, []);
    const calculateTotals = (month, key) => {
        return airports.reduce((total, airport) => {
            const monthData = data[type][airport][month];
            return total + (monthData ? monthData[key] : 0);
        }, 0);
    }
    const renderTable = () => {
        const colspan = months.length * 3;
        return (
            <table className={styles.table} id={id}>
                <thead>
                <tr>
                    <th></th>
                    {months.map((month) => {
                        return (
                            <th colSpan={colspan / months.length}>{`${month}-${year}`}</th>
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
                            </>
                        )
                    })}
                </tr>
                </thead>
                <tbody>
                {airports.map((airport) => {
                    return (
                        <tr>
                            <td>{airport}</td>
                            {passangers ? months.map((month) => {
                                return (
                                    <>
                                        <td colSpan={1}>{
                                            data[type][airport][month] ? data[type][airport][month].adults : 0
                                        }</td>
                                        <td colSpan={1}>{data[type][airport][month] ? data[type][airport][month].children : 0 }</td>
                                        <td colSpan={1}>{data[type][airport][month] ? data[type][airport][month].infants : 0}</td>
                                    </>
                                )
                            }) : months.map((month) => {
                                return (
                                    <>
                                        <td colSpan={1}>{
                                            data[type][airport][month] ? data[type][airport][month].booked : 0
                                        }</td>
                                        <td colSpan={1}>{data[type][airport][month] ? data[type][airport][month].amended : 0}</td>
                                    </>
                                )
                            })}
                        </tr >
                    )
                }
                )}
                </tbody>
                <tfoot>
                    <tr>
                        <td>Subtotals</td>
                        {passangers ? months.flatMap((month) => [
                            <td>{calculateTotals(month, 'adults')}</td>,
                            <td>{calculateTotals(month, 'children')}</td>,
                            <td>{calculateTotals(month, 'infants')}</td>,
                        ]) : months.flatMap((month) => [
                            <td>{calculateTotals(month, 'booked')}</td>,
                            <td>{calculateTotals(month, 'amended')}</td>,
                        ])}
                    </tr>
                    <tr>
                        <td>Total</td>
                        {months.map((month) => (
                            <td colSpan={3}>
                                {passangers ?
                                    calculateTotals(month, 'adults') +
                                    calculateTotals(month, 'children') +
                                    calculateTotals(month, 'infants') :
                                    calculateTotals(month, 'booked') +
                                    calculateTotals(month, 'amended') 
                                }
                            </td>
                        ))}
                    </tr>
                </tfoot>

            </table>);

    }
    return (
        <div className={styles.tableContainer} key={data}>
            {renderTable()}
        </div>
    );
};

export default StatTable;