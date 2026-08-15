
import React, { useState } from 'react';

const Tablmo = () => {
  const [tables, setTables] = useState([]);
  const [loopLimit, setLoopLimit] = useState(10); // Default loop limit

  const numbers = [2, 3, 5, 7]; // Array of numbers for which to generate tables
  const loopLimits = [5, 10, 15]; // Array of possible loop limits

  const generateTables = () => {
    const newTables = numbers.map((num) => {
      const table = [];
      for (let i = 1; i <= loopLimit; i++) {
        table.push(`${num} x ${i} = ${num * i}`);
      }
      return { number: num, table };
    });
    setTables(newTables);
  };

  const setLimit = (limit) => {
    setLoopLimit(limit);
  };

  return (
    <div>
      <h1>Multiplication Table Generator</h1>
      <div>
        <h2>Select Loop Limit:</h2>
        {loopLimits.map((limit) => (
          <button key={limit} onClick={() => setLimit(limit)}>
            Set Loop Limit to {limit}
          </button>
        ))}
      </div>
      <div>
        <button onClick={generateTables}>Generate Tables</button>
      </div>
      {tables.map((tableData) => (
        <div key={tableData.number}>
          <h2>Multiplication Table for {tableData.number}</h2>
          <table border="1">
            <thead>
              <tr>
                <th>#</th>
                <th>Equation</th>
              </tr>
            </thead>
            <tbody>
              {tableData.table.map((row, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{row}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Tablmo;






