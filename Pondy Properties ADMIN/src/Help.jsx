

import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table } from "react-bootstrap";
const Help = () => {
      const [fromDate, setFromDate] = useState("");
      const [endDate, setEndDate] = useState("");
      const [search, setSearch] = useState("");
                
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Help ",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
      const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Search: ${search}, From Date: ${fromDate}, End Date: ${endDate}`);
      };
      const data = [
        {
          rowId: 97,
          pucId: 7992,
          postedFrom: "PUC",
          carMake: "Maruthi Suzuki Alto 800",
          helpSeekNumber: "9944244409",
          helpMessage: "Help Me to buy this Car",
          comment: "test",
          helpDate: "2024-07-05 14:11:54",
          action: "Resolve",
        },
        {
          rowId: 96,
          pucId: 4060,
          postedFrom: "TUC",
          carMake: "Maruthi Suzuki Swift 2015",
          helpSeekNumber: "9003139611",
          helpMessage: "Loan Help",
          comment: "",
          helpDate: "2024-04-06 17:19:31",
          action: "Resolve",
        },
      ];
    
  return (
    <> 
     
    <div className="d-flex justify-content-between align-items-center mb-3">
    <h4>Manage Help Page
    </h4>  <button className="btn" style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>
    </div>
    <div className="container mt-5">
      <h2 className="mb-4">User Logs</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="searchInput" className="form-label">
            Search
          </label>
          <input
            type="text"
            id="searchInput"
            className="form-control"
            placeholder="Enter search term"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      {/* From Date Field */}
      <div className="mb-3">
          <label htmlFor="fromDate" className="form-label">
            From Date
          </label>
          <input
            type="date"
            id="fromDate"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        {/* End Date Field */}
        <div className="mb-3">
          <label htmlFor="endDate" className="form-label">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" style={{background:"#E91E63", color:"#fff", border:'none'}}>
          Submit
        </button>
      </form>
    </div>
    <div className="table-responsive">
    <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
          <tr>
            <th>ROW ID</th>
            <th>PUC ID</th>
            <th>Posted From</th>
            <th>Car Make</th>
            <th>Help Seek Number</th>
            <th>Help Message</th>
            <th>Comment</th>
            <th>Help Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.rowId}>
              <td>{item.rowId}</td>
              <td>{item.pucId}</td>
              <td>{item.postedFrom}</td>
              <td>{item.carMake}</td>
              <td>{item.helpSeekNumber}</td>
              <td>{item.helpMessage}</td>
              <td>{item.comment || "N/A"}</td>
              <td>{item.helpDate}</td>
              <td>
                <button className="btn btn-primary btn-sm">{item.action}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
    </>
  );
};

export default Help;






