 

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useSelector } from "react-redux";

const FreePlansWithProperties = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [filters, setFilters] = useState({
  ba_id: "",
  billNo: "",
  planName: "",
  paymentType: "",
  planExpiryDate: "", // Format: "YYYY-MM-DD"
});

  const navigate = useNavigate();


  const fetchData = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-bills/free-with-assistance`);
    const fetchedData = response.data.data || [];
    setData(fetchedData);
  } catch (err) {
    // setError("Error fetching Free Plan bills with properties.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, []);
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
const handleDelete = async (ba_id) => {
  const confirmed = window.confirm(`Are you sure you want to delete BA ID: ${ba_id}?`);
  if (!confirmed) return;

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-assistant/${ba_id}`, {
      method: "PUT",
    });
    const result = await response.json();
    alert(result.message);

    // ✅ Update local state
    setData((prevData) =>
      prevData.map((item) =>
        item.buyerAssistance?.ba_id === ba_id
          ? { ...item, buyerAssistance: { ...item.buyerAssistance, isDeleted: true } }
          : item
      )
    );
  } catch (error) {
    console.error("Delete error:", error);
    alert("Failed to delete the buyer assistance.");
  }
};


const handleUndoDelete = async (ba_id) => {
  const confirmed = window.confirm(`Are you sure you want to undo delete for BA ID: ${ba_id}?`);
  if (!confirmed) return;

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/undo-delete-free-assistant/${ba_id}`, {
      method: "PUT",
    });
    const result = await response.json();
    alert(result.message);

    // ✅ Update local state
    setData((prevData) =>
      prevData.map((item) =>
        item.buyerAssistance?.ba_id === ba_id
          ? { ...item, buyerAssistance: { ...item.buyerAssistance, isDeleted: false } }
          : item
      )
    );
  } catch (error) {
    console.error("Undo delete error:", error);
    alert("Failed to undo delete.");
  }
};



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "BaFree Bills"; // current file
   
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

  // if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container mt-4">
 <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="row mb-3">
  <div className="col">
    <input
      type="text"
      className="form-control"
      placeholder="Filter by BA ID"
      value={filters.ba_id}
      onChange={(e) => setFilters({ ...filters, ba_id: e.target.value })}
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control"
      placeholder="Filter by Bill No"
      value={filters.billNo}
      onChange={(e) => setFilters({ ...filters, billNo: e.target.value })}
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control"
      placeholder="Filter by Plan Name"
      value={filters.planName}
      onChange={(e) => setFilters({ ...filters, planName: e.target.value })}
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control"
      placeholder="Filter by Payment Type"
      value={filters.paymentType}
      onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
    />
  </div>
  <div className="col">
    <input
      type="date"
      className="form-control"
      value={filters.planExpiryDate}
      onChange={(e) => setFilters({ ...filters, planExpiryDate: e.target.value })}
    />
  </div>
  <div className="col-auto">
    <button
      className="btn btn-secondary w-100"
      onClick={() =>
        setFilters({
          ba_id: "",
          billNo: "",
          planName: "",
          paymentType: "",
          planExpiryDate: "",
        })
      }
    >
      Reset
    </button>
  </div>
</div>

             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 className="mb-4 text-center">Buyer Free Office Bills Data</h2>
  <div ref={tableRef}>   <Table striped bordered hover responsive className="table-sm align-middle">
        <thead className="sticky-top">
          <tr>
            <th>Sl. No</th>
            <th>View Assistant</th>
            <th>Ba Id</th>
            <th>Phone Number</th>
            <th>Price</th>
            <th>Property Mode</th>
            <th>Property Type</th>
            <th>Status</th>
            <th>Payment Type</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Plan Name</th>
            <th>Bill No</th>
            <th>Admin</th>
            <th>Office</th>
            <th>Plan Expiry</th>
            <th>Action</th>
          </tr>
        </thead>
<tbody> 

  {data
  .filter((item) => {
    const prop = item.buyerAssistance;
    if (!prop) return false;

    const matchesBaId = String(prop.ba_id || "").toLowerCase().includes(filters.ba_id.toLowerCase());
    const matchesBillNo = item.bill.billNo?.toLowerCase().includes(filters.billNo.toLowerCase());
    const matchesPlanName = item.bill.planName?.toLowerCase().includes(filters.planName.toLowerCase());
    const matchesPaymentType = item.bill.paymentType?.toLowerCase().includes(filters.paymentType.toLowerCase());
    const matchesExpiryDate = filters.planExpiryDate
      ? moment(item.bill.planExpiryDate).format("YYYY-MM-DD") === filters.planExpiryDate
      : true;

    return matchesBaId && matchesBillNo && matchesPlanName && matchesPaymentType && matchesExpiryDate;
  })
  .map((item, i) => {
    const prop = item.buyerAssistance;
    return (
      <tr key={i}>
        <td>{i + 1}</td>
        <td>
          <button
            style={{ backgroundColor: "#0d94c1", color: "white" }}
            onClick={() =>
              navigate(`/dashboard/view-buyer-assistance`, {
                state: { ba_id: prop.ba_id, phoneNumber: prop.phoneNumber },
              })
            }
            className="btn btn-sm"
          >
            View Details
          </button>
        </td>
        <td>{prop.ba_id}</td>
        <td>{prop.phoneNumber}</td>
        <td>₹{prop.minPrice} - ₹{prop.maxPrice}</td>
        <td>{prop.propertyMode}</td>
        <td>{prop.propertyType}</td>
        <td>{prop.ba_status}</td>
        <td><strong>{item.bill.paymentType}</strong></td>
        <td>{prop.ba_postBy}</td>
        <td>{moment(prop.createdAt).format("YYYY-MM-DD HH:mm")}</td>
        <td>{moment(prop.updatedAt).format("YYYY-MM-DD HH:mm")}</td>
        <td>{item.bill.planName}</td>
        <td>{item.bill.billNo}</td>
        <td>{item.bill.adminName}</td>
        <td>{item.bill.adminOffice}</td>
        <td>{moment(item.bill.planExpiryDate).format("YYYY-MM-DD")}</td>
        <td>
          {prop.isDeleted ? (
            <button className="btn btn-success btn-sm" onClick={() => handleUndoDelete(prop.ba_id)}>Undo</button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prop.ba_id)}>Delete</button>
          )}
        </td>
      </tr>
    );
  })}

</tbody>


      </Table>
    </div>
    </div> 
  );
};

export default FreePlansWithProperties;




