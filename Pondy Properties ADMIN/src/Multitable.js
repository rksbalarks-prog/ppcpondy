

import React, { useState } from 'react';

const Multitable = () => {
    const [table, setTable] = useState([]);

    const generateTable = (number) => {
        let newTable = [];
        for (let i = 1; i <= 10; i++) {
            newTable.push(`${number} x ${i} = ${number * i}`);
          }
        setTable(newTable);
    };

    return (
        <div>
            <button onClick={() =>generateTable(2)}>Generate Table</button>
            <button onClick={() =>generateTable(1)}>1</button>

            <table>
                <tbody>
                {table.map((row, index) => (
              <tr key={index}>
                <td>{row}</td>
              </tr>
            ))}
                </tbody>
            </table>
        </div>
    );
};

export default Multitable;



  