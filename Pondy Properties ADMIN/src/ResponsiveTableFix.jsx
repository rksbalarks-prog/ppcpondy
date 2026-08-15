import React from "react";
import "./ResponsiveTableFix.css";

const ResponsiveTableFix = () => {
  const data = [
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },
    { id: 3, name: "Charlie", age: 35 },

    // Add more data here
  ];

  return (
    <div className="table-container">
      <table className="fixed-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTableFix;
