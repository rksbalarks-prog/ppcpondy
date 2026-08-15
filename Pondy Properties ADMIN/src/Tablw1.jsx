import React, { useState } from 'react';

const Tablw1 = () => {
  const [number, setNumber] = useState(1);
  const [table, setTable] = useState([]);

  const handleNumberChange = (e) => {
    setNumber(Number(e.target.value));
  };

  const generateTable = () => {
    const newTable = [];

    for (let i = 1; i <= 10; i++) {
      newTable.push(`${number} x ${i} = ${number * i}`);
    }

    setTable(newTable);
  };

  return (
    <div>
      <h1>Multiplication Table Generator</h1>
      <div>
        <input 
          type="number" 
          value={number} 
          onChange={handleNumberChange} 
          min="1"
        />
        <button onClick={generateTable}>Generate Table</button>
      </div>
      {table.length > 0 && (
        <table border="1">
          <thead>
            <tr>
              <th>Multiplication Table for {number}</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => (
              <tr key={index}>
                <td>{row}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Tablw1;