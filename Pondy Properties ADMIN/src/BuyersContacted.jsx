

import axios from "axios";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Table, Button, Modal } from "react-bootstrap";
import { useSelector } from "react-redux";

const CarListTable = () => {
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
       viewedFile: "Buyer Contacted",
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
  const initialData = [
    {
      sNo: 1,
      pucId: 2951,
      postedFrom: "PUC",
      carTitle: "Toyota Etios",
      customer: "7598862321",
      owner: "8072080646",
      view: "Unread",
      date: "2024-12-25",
      planName: "FREE",
    },
    {
      sNo: 2,
      pucId: 8208,
      postedFrom: "PUC",
      carTitle: "Morris Garage Astor",
      customer: "9489339649",
      owner: "9600902096",
      view: "Unread",
      date: "2024-12-25",
      planName: "FREE",
    },
    {
      sNo: 3,
      pucId: 4786,
      postedFrom: "PUC",
      carTitle: "Volks Wagen Others",
      customer: "9489339649",
      owner: "9600897445",
      view: "Unread",
      date: "2024-12-25",
      planName: "FREE",
    },
  ];

  const [data, setData] = useState(initialData);
  const [showModal, setShowModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const handleDeleteClick = (car) => {
    setSelectedCar(car);
    setShowModal(true);
  };

  const handleDeleteConfirm = () => {
    setData(data.filter((item) => item.pucId !== selectedCar.pucId));
    setShowModal(false);
    setSelectedCar(null);
  };

  return (
    <>
    <div className="d-flex justify-content-between align-items-center mb-3">

    <button className="btn" style={{background:"#5F9EA0", color:"#fff", border:'none'}}>delete buyer Contacted</button>
    </div>
    <div className="d-flex justify-content-between align-items-center mb-3">
    <h4>Manage Searched Data
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
        <button className="btn" type="submit" style={{background:"#E91E63", color:"#fff", border:'none'}}>
          Submit
        </button>
      </form>
    </div>
    <div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>S.No</th>
            <th>PUC Id</th>
            <th>Posted From</th>
            <th>Car Title</th>
            <th>Customer</th>
            <th>Owner</th>
            <th>View</th>
            <th>Date</th>
            <th>Plan Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.pucId}>
              <td>{item.sNo}</td>
              <td>{item.pucId}</td>
              <td>{item.postedFrom}</td>
              <td>{item.carTitle}</td>
              <td>{item.customer}</td>
              <td>{item.owner}</td>
              <td>{item.view}</td>
              <td>{item.date}</td>
              <td>{item.planName}</td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteClick(item)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Car</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCar && (
            <div>
              <p><strong>Car Title:</strong> {selectedCar.carTitle}</p>
              <p><strong>Customer:</strong> {selectedCar.customer}</p>
              <p><strong>Owner:</strong> {selectedCar.owner}</p>
              <p><strong>Plan Name:</strong> {selectedCar.planName}</p>
              <p><strong>Date:</strong> {selectedCar.date}</p>
            </div>
          )}
          <p>Are you sure you want to delete this car?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default CarListTable;
