

import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Table, Pagination, Modal, Button } from "react-bootstrap";

const PayUMoney = () => {
     const [fromDate, setFromDate] = useState("");
        const [endDate, setEndDate] = useState("");
        const [search, setSearch] = useState("");
                  

    
        const handleSubmit = (e) => {
          e.preventDefault();
          alert(`Search: ${search}, From Date: ${fromDate}, End Date: ${endDate}`);
        };
  const initialData = [
    {
      pucId: 8096,
      postedFrom: "PUC",
      planName: "SILVER",
      date: "2024-09-18 17:54:00",
      transactionId: "0e03fa59e75a9e8b02b0",
      mobile: "8050006406",
      amount: 299,
      status: "Paid",
    },
    {
      pucId: 7972,
      postedFrom: "PUC",
      planName: "SILVER",
      date: "2024-06-18 20:05:15",
      transactionId: "87c6e7a5611c91c61f3b",
      mobile: "9943888802",
      amount: 299,
      status: "Paid",
    },
    {
      pucId: 7910,
      postedFrom: "PUC",
      planName: "SILVER",
      date: "2024-03-14 11:03:32",
      transactionId: "a39f57105afa727eae48",
      mobile: "7708566929",
      amount: 299,
      status: "Paid",
    },
    {
      pucId: 7727,
      postedFrom: "TUC",
      planName: "SILVER",
      date: "2023-09-24 06:09:15",
      transactionId: "b106e7984db96f7b236a",
      mobile: "8870884896",
      amount: 299,
      status: "Paid",
    },
  ];

  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const itemsPerPage = 3;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };


  

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Pay U Money"; // current file
   
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
    <h4>Manage Pay u Money

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
            <th>Plan Name</th>
            <th>Date</th>
            <th>Transaction ID</th>
            <th>Mobile</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item) => (
            <tr key={item.pucId}>
              <td>{item.pucId}</td>
              <td>{item.postedFrom}</td>
              <td>{item.planName}</td>
              <td>{item.date}</td>
              <td>{item.transactionId}</td>
              <td>{item.mobile}</td>
              <td>{item.amount}</td>
              <td>{item.status}</td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => handleViewDetails(item)}
                >
                  View Details
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
          <Modal.Title>Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div>
              <p>
                <strong>PUC ID:</strong> {selectedTransaction.pucId}
              </p>
              <p>
                <strong>Posted From:</strong> {selectedTransaction.postedFrom}
              </p>
              <p>
                <strong>Plan Name:</strong> {selectedTransaction.planName}
              </p>
              <p>
                <strong>Date:</strong> {selectedTransaction.date}
              </p>
              <p>
                <strong>Transaction ID:</strong>{" "}
                {selectedTransaction.transactionId}
              </p>
              <p>
                <strong>Mobile:</strong> {selectedTransaction.mobile}
              </p>
              <p>
                <strong>Amount:</strong> {selectedTransaction.amount}
              </p>
              <p>
                <strong>Status:</strong> {selectedTransaction.status}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default PayUMoney;
