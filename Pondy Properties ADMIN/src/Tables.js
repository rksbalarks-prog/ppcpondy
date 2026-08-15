import React from 'react';

const MultiplicationTable = ({ rows, columns }) => {
  const renderTable = () => {
    let table = [];

    for (let i = 1; i <= rows; i++) {
      let row = [];
      for (let j = 1; j <= columns; j++) {
        row.push(
          <td key={`${i}-${j}`}>{i * j}</td>
        );
      }
      table.push(<tr key={i}>{row}</tr>);
    }

    return table;
  };

  return (
    <table>
      <tbody>{renderTable()}</tbody>
    </table>
  );
};

const Tables = () => {
  return (
    <div>
      <h2>2x2 Multiplication Table</h2>
      <MultiplicationTable rows={2} columns={4} />
    </div>
  );
};

export default Tables;



