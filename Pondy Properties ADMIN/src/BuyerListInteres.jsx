
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import PhoneCell from "./components/PhoneCell";

const BuyerAssistanceInterestsTable = () => {
  const [assistanceInterests, setAssistanceInterests] = useState([]);
  const [filteredInterests, setFilteredInterests] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
 const [baId, setBaId] = useState('');
const [phoneNumber, setPhoneNumber] = useState(''); const navigate = useNavigate();

  useEffect(() => {
    fetchAssistanceInterests();
  }, []);

  const fetchAssistanceInterests = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-interests`);
      setAssistanceInterests(response.data.data);
      setFilteredInterests(response.data.data); // Initialize filtered data with all the fetched data
    } catch (error) {
    }
  };
  const tableRef = useRef();

  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const printWindow = window.open("", "", "width=1200,height=800");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h3>Filtered Users</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
const handleFilterSubmit = (e) => {
  e.preventDefault();

  const filtered = assistanceInterests.filter((interest) => {
    const isBaIdMatch = baId ? String(interest.ba_id || '').includes(baId) : true;
    const isPhoneMatch = phoneNumber ? String(interest.phoneNumber || '').includes(phoneNumber) : true;
    const isStartDateMatch = startDate ? new Date(interest.createdAt) >= new Date(startDate) : true;
    const isEndDateMatch = endDate ? new Date(interest.createdAt) <= new Date(endDate) : true;

    return isBaIdMatch && isPhoneMatch && isStartDateMatch && isEndDateMatch;
  });

  setFilteredInterests(filtered);
};
const handleReset = () => {
  setBaId('');
  setPhoneNumber('');
  setStartDate('');
  setEndDate('');
  setFilteredInterests(assistanceInterests); // Reset to original data
};


  // Helper function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-5">
      {/* Filter Form */}
      <div className="container mt-3">
        <form  className="d-flex flex-row gap-2 align-items-center flex-nowrap" onSubmit={handleFilterSubmit}>
                <div className="mb-3">
            <label className="form-label fw-bold">BA ID</label>
            <input
              className="form-control"
                 type="text"
      placeholder="Search by BA ID"
      value={baId}
      onChange={(e) => setBaId(e.target.value)} />
          </div>
              <div className="mb-3">
            <label className="form-label fw-bold">PhoneNumber</label>
            <input
              className="form-control"
  type="text"
      placeholder="Search by Phone Number"
      value={phoneNumber}
      onChange={(e) => setPhoneNumber(e.target.value)}
  />
          </div>
          {/* Start Date */}
          <div className="mb-3">
            <label className="form-label fw-bold">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          {/* End Date */}
          <div className="mb-3">
            <label className="form-label fw-bold">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {/* Filter Button */}
          <div className="col-md-6 col-lg-3 d-flex align-items-end">
            <button type="submit" className="btn btn-primary me-2 w-100">Filter</button>
                      <button onClick={handleReset}  className="btn btn-secondary w-100">Reset</button>
</div>
        </form>
      </div>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {/* Table */}
      <div style={{ width: "100%" }}>
        <h3 className="mt-3 mb-3">Buyer Assistance Interests</h3>
<div ref={tableRef}>        <Table striped bordered hover responsive className="table-sm align-middle">
        <thead className="sticky-top">
              <tr>
                <th>BA ID</th>
                <th>Buyer Phone Number</th>
                <th>Interested User Phone Numbers</th> {/* Added Column for Interested Users */}
                <th>City</th>
                <th>Area</th>
                <th>State</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Area Unit</th>
                <th>No. of BHK</th>
                <th>Property Mode</th>
                <th>Property Type</th>
                <th>Property Age</th>
                <th>Bank Loan</th>
                <th>Approved</th>
                <th>Facing</th>
                <th>Payment Type</th>
                <th>Description</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterests.length > 0 ? (
                filteredInterests.map((interest, index) => (
                  <tr key={index}>
                    <td>{interest.ba_id}</td>
                    <td><PhoneCell phone={interest.phoneNumber} type="tenant" ba_id={interest.ba_id} /></td>
                    <td>{interest.interestedUserPhone ? interest.interestedUserPhone.join(", ") : "N/A"}</td> 
                    <td>{interest.city}</td>
                    <td>{interest.area}</td>
                    <td>{interest.state}</td>
                    <td>{interest.minPrice}</td>
                    <td>{interest.maxPrice}</td>
                    <td>{interest.areaUnit}</td>
                    <td>{interest.bedrooms}</td>
                    <td>{interest.propertyMode}</td>
                    <td>{interest.propertyType}</td>
                    <td>{interest.propertyAge}</td>
                    <td>{interest.bankLoan}</td>
                    <td>{interest.propertyApproved}</td>
                    <td>{interest.facing}</td>
                    <td>{interest.paymentType}</td>
                    <td>{interest.description}</td>
                    <td>{formatDate(interest.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="18" className="text-center">No Buyer Assistance Interests Found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BuyerAssistanceInterestsTable;
