import React from 'react';
import styles from './ComparativeStatTable.module.css';

const ComparativeStatTable = ({ data, airports, months, year1, year2, type, id = "" }) => {
  const renderTableHeader = () => (
    <thead>
      <tr>
        <th></th>
        {months.map(month => (
          <th colSpan={3} key={month}>
            {month}
          </th>
        ))}
        <th colSpan={3}>TOTAL</th>
      </tr>
      <tr>
        <th></th>
        {months.map(month => (
          <React.Fragment key={month}>
            <th>{year1}</th>
            <th>{year2}</th>
            <th>%</th>
          </React.Fragment>
        ))}
        <th>{year1}</th>
        <th>{year2}</th>
        <th>%</th>
      </tr>
    </thead>
  );

  const renderTableBody = () => (
    <tbody className={styles.tbody}>
      {airports.map(airport => (
        <tr key={airport}>
          <td>{airport}</td>
          {months.map(month => {
            const { totalTransfers, totalPassengers } = data[airport][month];
            return (
              <React.Fragment key={month}>
                {type == "transfers" ? (
                <><td>{totalTransfers[year1]}</td><td>{totalTransfers[year2]}</td><td>{totalTransfers.percentChange}</td></>
                ) : (
                <><td>{totalPassengers[year1]}</td><td>{totalPassengers[year2]}</td><td>{totalPassengers.percentChange}</td></>    
                )}
              </React.Fragment>
            );
          })}
          {/* Total Transfers */}
           <td>{data[airport].totalTransfers[year1]}</td>
          <td>{data[airport].totalTransfers[year2]}</td>
          <td>
            {
              ((data[airport].totalTransfers[year2] - data[airport].totalTransfers[year1]) /
                data[airport].totalTransfers[year1] *
                100
              ).toFixed(1)
            }
            %
          </td> 
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className={styles.tableContainer} key={data}>
    <table className={styles.table} id={id}>
      {renderTableHeader()}
      {renderTableBody()}
    </table>
    </div>
  );
};

export default ComparativeStatTable;