


import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table, Button, Pagination, Modal } from "react-bootstrap";

const MatchedBuyer = () => {

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
       viewedFile: "Match Buyer",
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
      pucId: 3566,
      postedFrom: "TUC",
      carMake: "Maruthi Suzuki",
      carModel: "Alto",
      carFuel: "Petrol",
      carPrice: 63000,
      customer: "9500557897",
      owner: "9161664869",
      view: "Unread",
      date: "2024-12-13 10:30:14",
      assistanceId: 5969,
      planName: "FREE",
    },
    {
      sNo: 2,
      pucId: 3461,
      postedFrom: "PUC",
      carMake: "Maruthi Suzuki",
      carModel: "800",
      carFuel: "Petrol",
      carPrice: 50000,
      customer: "9500557897",
      owner: "9025550512",
      view: "Unread",
      date: "2024-12-13 10:30:13",
      assistanceId: 5969,
      planName: "FREE",
    },
    {
      sNo: 3,
      pucId: 3234,
      postedFrom: "PUC",
      carMake: "Maruthi Suzuki",
      carModel: "800",
      carFuel: "Petrol",
      carPrice: 65000,
      customer: "9500557897",
      owner: "9994231149",
      view: "Unread",
      date: "2024-12-13 10:30:13",
      assistanceId: 5969,
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
    <div className="container mt-5">
    <div className="d-flex justify-content-between align-items-center mb-3">
   <h4>Manage Offers Raised
   </h4>     <button className="btn" style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>
      </div>    
      <button className="btn" style={{background:"#5F9EA0", color:"#fff", border:'none'}}>deleted Matched Buyer   </button>

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
      <button type="submit" className="btn" style={{background:"#E91E63", color:"#fff", border:'none'}}>
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
            <th>Car Make</th>
            <th>Car Model</th>
            <th>Car Fuel</th>
            <th>Car Price</th>
            <th>Customer</th>
            <th>Owner</th>
            <th>View</th>
            <th>Date</th>
            <th>Assistance ID</th>
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
              <td>{item.carMake}</td>
              <td>{item.carModel}</td>
              <td>{item.carFuel}</td>
              <td>{item.carPrice}</td>
              <td>{item.customer}</td>
              <td>{item.owner}</td>
              <td>{item.view}</td>
              <td>{item.date}</td>
              <td>{item.assistanceId}</td>
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
              <p><strong>Car Title:</strong> {selectedCar.carMake} {selectedCar.carModel}</p>
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

export default MatchedBuyer;
