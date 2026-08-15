
import axios from "axios";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const PaginationTable = () => {
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
       viewedFile: "Buyer Shortlist",
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
  const [data, setData] = useState([
    {
      sNo: 1,
      pucId: "7611",
      postedFrom: "TUC",
      carTitle: "Maruthi Suzuki Wagon R 1.0",
      buyerNumber: "6380817202",
      ownerNumber: "9047843078",
      view: "Unread",
      date: "2024-11-18 13:03:27",
      planName: "FREE",
    },
    {
      sNo: 2,
      pucId: "1047",
      postedFrom: "PUC",
      carTitle: "Mahindra Logan Logan 1.5",
      buyerNumber: "7695930558",
      ownerNumber: "9443020994",
      view: "Unread",
      date: "2024-08-22 00:32:21",
      planName: "FREE",
    },
    {
      sNo: 3,
      pucId: "4297",
      postedFrom: "TUC",
      carTitle: "Chevrolet Enjoy",
      buyerNumber: "8110804000",
      ownerNumber: "9600550389",
      view: "Unread",
      date: "2024-08-22 00:20:11",
      planName: "FREE",
    },
  ]);

  const handleDelete = (item) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setData(data.filter((row) => row.sNo !== item.sNo));
    }
  };

  return (
    <div className="container mt-4">
         <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Manage Buyer Shortlisted</h2>
        <button className="btn" style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>
      </div>
      <button className="btn" style={{background:"#5F9EA0", color:"#fff", border:'none'}}>deleted buyer shortlisted </button>

      <div className="container mt-5">
      <h2 className="mb-4">Search Form with Dates</h2>
      <form onSubmit={handleSubmit}>
        {/* Search Field */}
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

        {/* Submit Button */}
        <button className="btn" type="submit" style={{background:"#E91E63", color:"#fff", border:'none'}}>
          Submit
        </button>
      </form>
    </div>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="thead-dark">
            <tr>
              <th>S.No</th>
              <th>PUC ID</th>
              <th>Posted From</th>
              <th>Car Title</th>
              <th>Buyer Number</th>
              <th>Owner Number</th>
              <th>View</th>
              <th>Date</th>
              <th>Plan Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.sNo}>
                <td>{item.sNo}</td>
                <td>{item.pucId}</td>
                <td>{item.postedFrom}</td>
                <td>{item.carTitle}</td>
                <td>{item.buyerNumber}</td>
                <td>{item.ownerNumber}</td>
                <td>{item.view}</td>
                <td>{item.date}</td>
                <td>{item.planName}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaginationTable;
