 


import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaEdit, FaInfoCircle, FaTrash, FaUndo } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { Badge, Table } from "react-bootstrap";
import moment from "moment";
import { useSelector } from "react-redux";
import PhoneCell from "./components/PhoneCell";

const BuyerAssistanceTable = ({ setFormData, setEditId }) => {
  const [buyerRequests, setBuyerRequests] = useState([]); // Original data
  const [filteredRequests, setFilteredRequests] = useState([]); // Filtered data
  const [searchBAId, setSearchBAId] = useState(""); // Search filter
  const [startDate, setStartDate] = useState(""); // Start date filter
  const [endDate, setEndDate] = useState(""); // End date filter
  const [searchPhoneNumber, setSearchPhoneNumber] = useState('');
const [searchBAStatus, setSearchBAStatus] = useState('');
const navigate = useNavigate();

    const [message, setMessage] = useState(null);
  

  useEffect(() => {
    fetchBuyerRequests();
  }, []);

  // Fetch All Buyer Assistance Requests
  const fetchBuyerRequests = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance`);
      // Sort data by createdAt (latest date first)
      const sortedData = response.data.data.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Sort in descending order (latest date first)
      });
      setBuyerRequests(sortedData); // Save original sorted data
      setFilteredRequests(sortedData); // Initialize filtered data with sorted data
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

  const filtered = buyerRequests.filter((request) => {
    const isBaIdMatch = searchBAId
      ? String(request.ba_id || '').includes(searchBAId)
      : true;

    const isPhoneMatch = searchPhoneNumber
      ? String(request.phoneNumber || '').includes(searchPhoneNumber)
      : true;

    const isStartDateMatch = startDate
      ? new Date(request.createdAt) >= new Date(startDate)
      : true;

    const isEndDateMatch = endDate
      ? new Date(request.createdAt) <= new Date(endDate)
      : true;

    const isStatusMatch = searchBAStatus
      ? request.ba_status === searchBAStatus
      : true;

    return (
      isBaIdMatch &&
      isPhoneMatch &&
      isStartDateMatch &&
      isEndDateMatch &&
      isStatusMatch
    );
  });

  setFilteredRequests(filtered);
};

 
const handleReset = () => {
  setSearchBAId('');
  setSearchPhoneNumber('');
  setStartDate('');
  setEndDate('');
  setSearchBAStatus('');
  setFilteredRequests(buyerRequests);
};


  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === "baPending" ? "baActive" : "baPending";
  
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/update-buyerAssistance-status/${id}`,
        { newStatus }
      );
      alert(response.data.message);
      fetchBuyerRequests(); // Refresh the list of buyer requests after the update
    } catch (error) {
      alert("Failed to update the status.");
    }
  };
  
  


  const handleEdit = (ba_id) => {
  navigate("/dashboard/edit-buyer-assistance",  { state: { ba_id: ba_id } });
};



const handleSoftDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this request?")) return;

  try {
    await axios.delete(`${process.env.REACT_APP_API_URL}/delete-buyer-assistance/${id}`);
    setMessage("Buyer Assistance request deleted successfully.");

    // Drop the row from this page — soft-deleted records live in the
    // Removed Buyer Assistant page now and shouldn't linger here.
    setBuyerRequests(prevData =>
      prevData.filter(item => item._id !== id && item.ba_id !== id)
    );
    setFilteredRequests(prevData =>
      prevData.filter(item => item._id !== id && item.ba_id !== id)
    );
  } catch (error) {
    setMessage("Error deleting Buyer Assistance.");
  }
};

const handleUndoDelete = async (id) => {
  if (!window.confirm("Are you sure you want to restore this request?")) return;
  try {
    await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-buyer-assistance/${id}`);
    setMessage("Buyer Assistance request restored successfully.");

    // Update both states
    setBuyerRequests(prevData => 
      prevData.map(item => 
        (item._id === id || item.ba_id === id) ? { ...item, isDeleted: false } : item
      )
    );
    
    setFilteredRequests(prevData => 
      prevData.map(item => 
        (item._id === id || item.ba_id === id) ? { ...item, isDeleted: false } : item
      )
    );
  } catch (error) {
    setMessage("Error restoring Buyer Assistance.");
  }
};
  
  // Helper function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };


  
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Get Buyer Assistances"; // current file
   
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
    <div className="mt-5">
      {/* Filter Form */}
      <div className="container mt-3">
        <form  className="d-flex flex-row gap-2 align-items-center flex-nowrap" onSubmit={handleFilterSubmit}>
          {/* Search by BA ID */}
          <div className="mb-3">
            <label className="form-label fw-bold">BA ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by BA ID"
              value={searchBAId}
              onChange={(e) => setSearchBAId(e.target.value)}
            />
          </div>
               <div className="mb-3">
            <label className="form-label fw-bold">PhoneNumber</label>
            <input
              className="form-control"
             type="text"
  placeholder="Search by Phone Number"
  value={searchPhoneNumber}
  onChange={(e) => setSearchPhoneNumber(e.target.value)} />
          </div>

                  <div className="mb-3">
            <label className="form-label fw-bold">Status</label>
<select
  className="form-control"
  value={searchBAStatus}
  onChange={(e) => setSearchBAStatus(e.target.value)}
>
  <option value="">Select BA Status</option>
  <option value="buyer-assistance-interest">Buyer Assistance Interest</option>
  <option value="baActive">BA Active</option>
  <option value="baPending">BA Pending</option>
</select>

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
            <button type="submit" className="btn btn-primary w-100">Filter</button>
                     <button onClick={handleReset} className="btn btn-danger w-100 ms-2">Reset</button>
 </div>
        </form>
      </div>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
        <button className="btn btn-secondary" style={{ background: "tomato" }} onClick={handlePrint}>
          Print
        </button>
        <span style={{ background: "#6c757d", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
          Total: {buyerRequests.length} Records
        </span>
        <span style={{ background: "#007bff", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
          Showing: {filteredRequests.length} Records
        </span>
      </div>
      {/* Table */}
      <div style={{ width: "100%" }}>
        <h3 className="mt-3 mb-3"> Get All Buyer Assistance Data </h3>
<div ref={tableRef}>        <Table striped bordered hover responsive className="table-sm align-middle">
        <thead className="sticky-top">
              <tr>
                <th>SI.No</th>
                <th className="sticky-col sticky-col-1">Ba_Id</th>
                <th className="sticky-col sticky-col-2">Buyer PhoneNumber</th>
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
                <th>Flocaacing</th>
                <th>Payment Type</th>
                <th>Plan Name</th>
      <th>Plan CreateAt</th>
                    <th>Plan Duration Days</th>
      <th>Plan Expiry</th>
                <th>Created At</th>
                <th>Ba_Status</th>
                <td>Status Change</td>
                <th>Actions</th>
                <th>View</th>
                {/* <th>Status Change</th> */}
                <th>Edit Buyer Assistance</th>
              </tr>
            </thead>
            <tbody>
  {filteredRequests.length > 0 ? (
    filteredRequests.map((request, index) => {
      // Define the ID we'll use for operations
      const requestId = request._id || request.ba_id; // Fallback to ba_id if _id doesn't exist
      
      return (
        <tr key={index}>
          <td>{index + 1}</td>
          <td className="sticky-col sticky-col-1">{request.ba_id}</td>
          <td className="sticky-col sticky-col-2"><PhoneCell phone={request.phoneNumber} type="tenant" ba_id={request.ba_id} /></td>
          <td>{request.city}</td>
          <td>{request.area}</td>
          <td>{request.state}</td>
          <td>{request.minPrice}</td>
          <td>{request.maxPrice}</td>
          <td>{request.areaUnit}</td>
          <td>{request.bedrooms}</td>
          <td>{request.propertyMode}</td>
          <td>{request.propertyType}</td>
          <td>{request.propertyAge}</td>
          <td>{request.bankLoan}</td>
          <td>{request.propertyApproved}</td>
          <td>{request.facing}</td>
          <td>{request.paymentType}</td>
          <td>{request.planName}</td>
          <td>{request.planCreatedAt}</td>
          <td>{request.durationDays}</td>
          <td>{request.planExpiry}</td>
          <td>{formatDate(request.createdAt)}</td>
          <td>{request.ba_status}</td>
          <td>
            {request.isDeleted ? (
              <Badge bg="danger" className="d-flex align-items-center">
                <FaTrash className="me-1" /> Deleted
              </Badge>
            ) : (
              <Badge bg="success" className="d-flex align-items-center">
                <FaInfoCircle className="me-1" /> Status_All
              </Badge>
            )}
          </td>
          <td>
            {!request.isDeleted ? (
              <button
                onClick={() => handleSoftDelete(requestId)}
                className="d-flex align-items-center btn btn-outline-danger btn-sm"
              >
                <FaTrash className="me-1" /> 
              </button>
            ) : (
              <button
                onClick={() => handleUndoDelete(requestId)}
                className="d-flex align-items-center btn btn-outline-primary btn-sm"
              >
                <FaUndo className="me-1" /> 
              </button>
            )}
          </td>
          <td>
            <button
              style={{backgroundColor:"#0d94c1",color:"white"}}
              onClick={() =>
                navigate(`/dashboard/view-buyer-assistance`, {
                  state: { ba_id: request.ba_id, phoneNumber: request.phoneNumber },
                })
              }
              className="btn btn-sm"
            >
              View Details
            </button>
          </td>
          {/* <td>
            <button
              className={`btn btn-sm btn-${request.ba_status === "baPending" ? "warning" : "success"}`}
              onClick={() => handleStatusToggle(requestId, request.ba_status)}
            >
              {request.ba_status === "baPending" ?"Deactivate" :"Activate"  }
            </button>
          </td> */}
          <td>
  <button
    className="btn btn-outline-secondary btn-sm"
    onClick={() => handleEdit(request.ba_id)}
  >
   <FaEdit />
  </button>
</td>

        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="24" className="text-center">No Requests Found</td>
    </tr>
  )}
</tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BuyerAssistanceTable;




