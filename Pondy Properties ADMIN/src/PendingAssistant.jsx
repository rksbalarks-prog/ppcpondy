


import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table,Badge } from "react-bootstrap";
import { FaInfoCircle, FaTrash, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";
import PhoneCell from "./components/PhoneCell";

const PendingBuyerAssistanceList = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchBaId, setSearchBaId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchPhoneNumber, setSearchPhoneNumber] = useState('');
  const navigate=useNavigate();

  
    const [billMap, setBillMap] = useState({});
  
  
  
    const fetchBills = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-bills`);
        const map = {};
    
        res.data.data.forEach(bill => {
          if (!map[bill.ba_id]) {
            map[bill.ba_id] = {
              adminName: bill.adminName,
              billNo: bill.billNo
            };
          }
        });
    
        setBillMap(map);
      } catch (error) {
      }
    };
    
  useEffect(() => {
    fetchBills();
  }, []);
  
    const [followUpMap, setFollowUpMap] = useState({});
  
    const fetchFollowUps = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list-buyer`);
        const map = {};
    
        res.data.data.forEach(f => {
          if (!map[f.ba_id]) {
            map[f.ba_id] = {
              adminName: f.adminName,
              createdAt: f.createdAt
            };
          }
        });
    
        setFollowUpMap(map);
      } catch (err) {
      }
    };
    
    useEffect(() => {
      fetchFollowUps();
    }, []);
    
  
  
    // Handle creating bill or follow-up with confirmation
    const handleCreateAction = (actionType, ba_id, phoneNumber) => {
      const confirmMessage = `Do you want to create ${actionType}?`;
  
      const isConfirmed = window.confirm(confirmMessage);
  
      if (isConfirmed) {
        const currentDate = new Date().toLocaleDateString(); // Store current date
  
        // Update the specific property with the current date for the action
        setData(prevProperties =>
          prevProperties.map((item) =>
            item.ba_id === ba_id && item.phoneNumber === phoneNumber
              ? {
                  ...item,
                  [`create${actionType}Date`]: currentDate, // Dynamically set date field
                }
              : item
          )
        );
  
        // Navigate to the respective page (Follow-up or Bill creation)
        if (actionType === 'FollowUp') {
          navigate('/dashboard/create-followup-buyer', {
            state: { ba_id: ba_id, phoneNumber: phoneNumber },
          });
          
} else if (actionType === 'Bill') {
        navigate('/dashboard/buyer-create-bill', {
            state: { ba_id: ba_id, phoneNumber: phoneNumber },
        });
      
       
      
        } 
       
      }
    };


  useEffect(() => {
    fetchPendingAssistance();
  }, []);


  const fetchPendingAssistance = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance-pending`);
      const sorted = [...response.data.data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setData(sorted);
      setFiltered(sorted);
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
  const handleFilter = () => {
    let filteredData = data;

    if (searchBaId) {
      filteredData = filteredData.filter((item) =>
        item.ba_id.toString().includes(searchBaId)
      );
    }
 if (searchPhoneNumber) {
    filteredData = filteredData.filter((item) =>
      String(item.phoneNumber || '').includes(searchPhoneNumber)
    );
  }
    // Normalize to full-day bounds so picking the same date for both bounds
    // (or End = today) still includes records created later that day.
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(
        (item) => new Date(item.createdAt) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(
        (item) => new Date(item.createdAt) <= end
      );
    }

    setFiltered(filteredData);
  };
const handleReset = () => {
  setSearchBaId('');
  setSearchPhoneNumber('');
  setStartDate('');
  setEndDate('');
  setFiltered(data);
};

  const handleUndoDelete = async (ba_id) => {
    if (!window.confirm("Are you sure you want to restore this request?")) return;
  
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-buyer-assistance/${ba_id}`);
      alert("Buyer Assistance request restored successfully.");
  
      setData(prevData =>
        prevData.map(item =>
          item.ba_id === ba_id ? { ...item, isDeleted: false } : item
        )
      );
  
      setFiltered(prevData =>
        prevData.map(item =>
          item.ba_id === ba_id ? { ...item, isDeleted: false } : item
        )
      );
    } catch (error) {
      alert("Error restoring Buyer Assistance.");
    }
  };

  
  const handleSoftDelete = async (ba_id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/delete-buyer-assistance/${ba_id}`);
      alert("Buyer Assistance request deleted successfully.");

      // Drop the row from this page — soft-deleted records live in the
      // Removed Buyer Assistant page now and shouldn't linger here.
      setData(prevData => prevData.filter(item => item.ba_id !== ba_id));
      setFiltered(prevData => prevData.filter(item => item.ba_id !== ba_id));
    } catch (error) {
      alert("Error deleting Buyer Assistance.");
    }
  };
  

  
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Pending Assistant"; // current file
   
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

  

  

const handleGetFollowUp = () => {
  window.open('/process/dashboard/followup-list-buyer', '_blank');
};
  

  return (
    <div className="container mt-4">
      <h3>Pending Buyer Assistance Requests</h3>

      {/* Search Form */}
      <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="row mb-3">
        <div className="col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by BA ID"
            value={searchBaId}
            onChange={(e) => setSearchBaId(e.target.value)}
          />
        </div>
               <div className="col-md-2">
          <input
            className="form-control"
       type="text"
  placeholder="Search by Phone Number"
  value={searchPhoneNumber}
  onChange={(e) => setSearchPhoneNumber(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={handleFilter}>
            Filter
          </button>
           <button className="btn btn-danger w-100 mt-2" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-3 mt-3">
        <button className="btn btn-secondary" style={{ background: "tomato" }} onClick={handlePrint}>
          Print
        </button>
        <span style={{ background: "#6c757d", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
          Total: {data.length} Records
        </span>
        <span style={{ background: "#007bff", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
          Showing: {filtered.length} Records
        </span>
      </div>
       <div className="mb-3 text-end">
                  <button className="text-white bg-success"  onClick={handleGetFollowUp}>
                    Get Follow-Up Buyer
                  </button>
                </div>

      {/* Table */}
        <div ref={tableRef}>
       
      <Table striped bordered hover responsive className="table-sm align-middle">
      <thead className="sticky-top">
            <tr>
              <th>SI.No</th>
              <th>BA ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>City</th>
              <th>Area</th>
              <th>Price Range</th>
              <th>Total Area</th>
              <th>Bedrooms</th>
              <th>PropertyMode</th>
              <th>PropertyType</th>
              <th>Ba_Status</th>
              <th>Created At</th>
              <th>Added By</th>
              {/* <th>Plan Name</th> */}
    {/* <th>Plan Created</th> */}
    {/* <th>Expires</th> */}
    <th>Status Changed</th>
    <th>Actions</th>
        <th>Create FollowUp</th>
<th>Create Bill</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.ba_id}</td>
                  <td>{item.baName}</td>
                  <td><PhoneCell phone={item.phoneNumber} type="tenant" ba_id={item.ba_id} /></td>
                  <td>{item.city}</td>
                  <td>{item.area}</td>
                  <td>
                    ₹{item.minPrice} - ₹{item.maxPrice}
                  </td>
                  <td>
                    {item.totalArea} {item.areaUnit}
                  </td>
                  <td>{item.bedrooms}</td>
                  <td>{item.propertyMode}</td>
                  <td>{item.propertyType}</td>
                  <td>{item.ba_status}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>{item.addedBy || item.adminName || "-"}</td>
                  {/* <td>{item.planDetails.planName}</td> */}
      {/* <td>{item.planDetails.planCreatedAt}</td> */}
      {/* <td>{item.planDetails.planExpiryDate}</td> */}
      <td>
  {item.isDeleted ? (
    <Badge bg="danger" className="d-flex align-items-center">
      <FaTrash className="me-1" /> Deleted
    </Badge>
  ) : (
    <Badge bg="success" className="d-flex align-items-center">
      <FaInfoCircle className="me-1" /> baPending
    </Badge>
  )}
</td>

<td>
  {!item.isDeleted ? (
    <button
      onClick={() => handleSoftDelete(item.ba_id)}
      className="d-flex align-items-center btn btn-outline-danger btn-sm"
    >
      <FaTrash className="me-1" /> 
    </button>
  ) : (
    <button
      onClick={() => handleUndoDelete(item.ba_id)}
      className="d-flex align-items-center btn btn-outline-primary btn-sm"
    >
      <FaUndo className="me-1" /> 
    </button>
  )}
</td>

<td>
  {followUpMap[item.ba_id] ? (
    <div className="text-success">
      <div><strong>{followUpMap[item.ba_id].adminName}</strong></div>
      <div>
        <small>
          {new Date(followUpMap[item.ba_id].createdAt).toLocaleDateString()}
        </small>
      </div>
    </div>
  ) : (
    <button
      className="btn btn-sm btn-primary"
      onClick={() => handleCreateAction("FollowUp", item.ba_id, item.phoneNumber)}
    >
      Create Follow-up
    </button>
  )}
</td>

   <td>
                {followUpMap[item.ba_id] && !billMap[item.ba_id] ? (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleCreateAction("Bill", item.ba_id, item.phoneNumber)}
                  >
                    Create Bill
                  </button>
                ) : billMap[item.ba_id] ? (
                  <span className="text-success">Bill Created</span>
                ) : (
                  <span className="text-muted">Follow-up Required</span>
                )}
              </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default PendingBuyerAssistanceList;


 