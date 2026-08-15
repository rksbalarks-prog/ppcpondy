


import React, { useState, useEffect } from "react";
import axios from "axios";

const ScrollableTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://ppcpondy.com/PPC/user/all");
        if (response.status === 200 && Array.isArray(response.data.data)) {
          setData(response.data.data);
          setFilteredData(response.data.data);
        } else {
          setError("Error: Invalid response structure or empty data");
        }
      } catch (err) {
        setError("Error fetching data. Please check your API or network.");
      }
    };

    fetchData();
  }, []);

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ddd",
  };

  const theadStyle = {
    backgroundColor: "#f4f4f4",
    position: "sticky",
    top: 0,
    zIndex: 1,
  };

  const thTdStyle = {
    padding: "8px",
    textAlign: "left",
    border: "1px solid #ddd",
  };

  const tbodyStyle = {
    display: "block",
    maxHeight: "300px", // Set desired height
    overflowY: "scroll",
  };

  const trStyle = {
    display: "table",
    width: "100%",
    tableLayout: "fixed",
  };

  return (
    <div>
      <h1>Scrollable Table with API Data</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table style={tableStyle}>
        <thead style={theadStyle}>
          <tr style={trStyle}>
            <th style={thTdStyle}>ID</th>
            <th style={thTdStyle}>Name</th>
            <th style={thTdStyle}>Email</th>
          </tr>
        </thead>
        <tbody style={tbodyStyle}>
          {filteredData.map((item) => (
            <tr key={item.id} style={trStyle}>
              <td style={thTdStyle}>{item.id}</td>
              <td style={thTdStyle}>{item.name}</td>
              <td style={thTdStyle}>{item.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScrollableTable;
