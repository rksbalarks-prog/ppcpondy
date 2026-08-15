

import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Table, Pagination, Button, Modal } from "react-bootstrap";

const PayLater = () => {
   const [fromDate, setFromDate] = useState("");
        const [endDate, setEndDate] = useState("");
        const [search, setSearch] = useState("");

        const handleSubmit = (e) => {
          e.preventDefault();
          alert(`Search: ${search}, From Date: ${fromDate}, End Date: ${endDate}`);
        };
  const initialData = [
    {
      pucId: 8287,
      postedFrom: "TUC",
      ownerNumber: "8122728894",
      carDetails: "Hyundai Xcent",
      date: "2024-12-24 18:48:15",
    },
    {
      pucId: 8186,
      postedFrom: "TUC",
      ownerNumber: "9840424883",
      carDetails: "Tata Motors Zest",
      date: "2024-11-28 17:02:39",
    },
    {
      pucId: 8183,
      postedFrom: "TUC",
      ownerNumber: "7418248016",
      carDetails: "Maruthi Suzuki Alto",
      date: "2024-11-28 12:44:59",
    },
    {
      pucId: 8111,
      postedFrom: "TUC",
      ownerNumber: "9843250851",
      carDetails: "Audi A4",
      date: "2024-11-26 13:31:08",
    },
  ];

  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const itemsPerPage = 3;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleResolveClick = (car) => {
    setSelectedCar(car);
    setShowModal(true);
  };

  const handleResolveConfirm = () => {
    setData(data.filter((item) => item.pucId !== selectedCar.pucId));
    setShowModal(false);
    setSelectedCar(null);
  };


  

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "PayLater"; // current file
   
   // Sync Redux to localStorage
   useEffect(() => {
     if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
     if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
   }, [reduxAdminName, reduxAdminRole]);
   
   // Record dashboard view
   useEffect(() => {
     const recordDashboardView = async () => {
       try {
         await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
           userName: adminName,
           role: adminRole,
           viewedFile: fileName,
           viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
         });
       } catch (err) {
       }
     };
   
     if (adminName && adminRole) {
       recordDashboardView();
     }
   }, [adminName, adminRole]);
   
   // Fetch role-based permissions
   useEffect(() => {
     const fetchPermissions = async () => {
       try {
         const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
         const rolePermissions = res.data.find((perm) => perm.role === adminRole);
         const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
         setAllowedRoles(viewed);
       } catch (err) {
       } finally {
         setLoading(false);
       }
     };
   
     if (adminRole) {
       fetchPermissions();
     }
   }, [adminRole]);
   
  
   if (loading) return <p>Loading...</p>;
  
   if (!allowedRoles.includes(fileName)) {
     return (
       <div className="text-center text-red-500 font-semibold text-lg mt-10">
         Only admin is allowed to view this file.
       </div>
     );
   }

  return (
    <>
     <div className="d-flex justify-content-between align-items-center mb-3">
    <h4>Manage Pay Later
    </h4>  <button className="btn" style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>
    </div>
    <div className="container mt-5">
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
    <div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>PUC ID</th>
            <th>Posted From</th>
            <th>Owner Number</th>
            <th>Car Details</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item) => (
            <tr key={item.pucId}>
              <td>{item.pucId}</td>
              <td>{item.postedFrom}</td>
              <td>{item.ownerNumber}</td>
              <td>{item.carDetails}</td>
              <td>{item.date}</td>
              <td>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleResolveClick(item)}
                >
                  Resolve
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination>
        {[...Array(totalPages).keys()].map((page) => (
          <Pagination.Item
            key={page + 1}
            active={page + 1 === currentPage}
            onClick={() => handlePageChange(page + 1)}
          >
            {page + 1}
          </Pagination.Item>
        ))}
      </Pagination>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Car Issue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCar && (
            <div>
              <p>
                <strong>PUC ID:</strong> {selectedCar.pucId}
              </p>
              <p>
                <strong>Posted From:</strong> {selectedCar.postedFrom}
              </p>
              <p>
                <strong>Owner Number:</strong> {selectedCar.ownerNumber}
              </p>
              <p>
                <strong>Car Details:</strong> {selectedCar.carDetails}
              </p>
              <p>
                <strong>Date:</strong> {selectedCar.date}
              </p>
            </div>
          )}
          <p>Are you sure you want to resolve this issue?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="success" onClick={handleResolveConfirm}>
            Resolve
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default PayLater;
