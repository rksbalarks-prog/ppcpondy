














import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";

const FreePlansWithProperties = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-all-free-plans`);
        const rawData = response.data.data || [];
  
        // Sort by the latest updatedAt (or createdAt) from the properties array
        const sortedData = rawData.sort((a, b) => {
          const latestA = getLatestPropertyDate(a.properties);
          const latestB = getLatestPropertyDate(b.properties);
  
          return latestB - latestA; // Descending order
        });
  
        setData(sortedData);
        setFilteredData(sortedData);
      } catch (err) {
        setError("Error fetching data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);
        // Optionally refresh data here
      } catch (error) {
        alert('Failed to delete the property.');
      }
    }
  };
  
  const handleUndoDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to undo delete for PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/undo-delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);
        // Optionally refresh data here
      } catch (error) {
        alert('Failed to undo delete.');
      }
    }
  };
  

  // Utility to get latest date from properties
  const getLatestPropertyDate = (properties = []) => {
    let latestDate = new Date(0);
    properties.forEach((p) => {
      const updatedAt = new Date(p.updatedAt || 0);
      const createdAt = new Date(p.createdAt || 0);
      const maxDate = updatedAt > createdAt ? updatedAt : createdAt;
      if (maxDate > latestDate) latestDate = maxDate;
    });
    return latestDate;
  };

  
  const handleDeleteProperty = async (ppcId) => {
    if (!window.confirm(`Are you sure you want to delete property with PPC ID ${ppcId}?`)) return;
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
        method: 'DELETE',
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('Property deleted successfully!');
        // Optionally re-fetch your list or remove the property from state
      } else {
        alert(data.message || 'Failed to delete property');
      }
    } catch (error) {
      alert('Server error while deleting property');
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
  // Filter data based on user input
const handleSearch = () => {
  const filtered = data.map((item) => ({
    ...item,
    properties: item.properties.filter((property) => {
      const searchTermLower = searchTerm.toLowerCase();

      const ppcIdMatch = property.ppcId?.toString().toLowerCase().includes(searchTermLower);
      const phoneNumberMatch = property.phoneNumber?.toString().toLowerCase().includes(searchTermLower);
      const statusMatch = property.status?.toLowerCase().includes(searchTermLower);
      const planNameMatch = property.planName?.toLowerCase().includes(searchTermLower);
      const billNoMatch = property.billNo?.toLowerCase().includes(searchTermLower);

      const planExpiry = new Date(property.planExpiryDate); // updated field
      const startMatch = startDate ? planExpiry >= new Date(startDate) : true;
      const endMatch = endDate ? planExpiry <= new Date(endDate + "T23:59:59") : true;

      return (
        (ppcIdMatch || phoneNumberMatch || statusMatch || planNameMatch || billNoMatch) &&
        startMatch &&
        endMatch
      );
    }),
  })).filter((item) => item.properties.length > 0);

  setFilteredData(filtered);
};

  const handleReset = () => {
  setSearchTerm("");
  setStartDate("");
  setEndDate("");
  setFilteredData(data); // show original data
};


  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "Free Property"; // current file
   
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container">
      <h1 className="my-4 text-center">Free Plans Properties</h1>

      {/* Search Form */}
  <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} onSubmit={(e) => e.preventDefault()}
   className="d-flex flex-row gap-2 align-items-center flex-nowrap"
   >
  {/* Search input (for ppcId, phoneNumber, status, planName, billNo) */}
  <div>
    <label className="form-label fw-bold">Search</label>
    <input
      type="text"
      className="form-control"
      placeholder="Search by PPC ID, Phone, Status, Plan, Bill No"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* Plan Expiry Date - From */}
  <div>
    <label className="form-label fw-bold">Plan Expiry From</label>
    <input
      type="date"
      className="form-control"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </div>

  {/* Plan Expiry Date - To */}
  <div>
    <label className="form-label fw-bold">Plan Expiry To</label>
    <input
      type="date"
      className="form-control"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </div>

  {/* Buttons */}
  <div className="d-flex gap-2">
    <button type="button" className="btn btn-primary" onClick={handleSearch}>
      Search
    </button>
    <button type="button" className="btn btn-secondary" onClick={handleReset}>
      Reset
    </button>
  </div>
</form>

             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h3 className="mt-4 mb-4">Free Properties datas</h3> 

 <div ref={tableRef}>
      <Table striped bordered hover responsive className="table-sm align-middle">
      <thead className="sticky-top">
    <tr>
      <th>Sl. No</th>
      <th>Image</th>
      <th>PPC ID</th>
       <th>Property Mode</th>
      <th>Property Type</th>
      <th>Price</th>
      <th>City</th>
      <th>Created By</th>
      <th>Created At</th>
      <th>Updated At</th>
      <th>Mandatory</th>
      <th>No. of Ads</th>
      <th>Status</th>
      <th>Plan Name</th>
       <th>Follow Up</th>
      <th>Bill No</th>
      <th>Set Feature</th>
       <th>APP BY</th>
      <th>APP DATE</th>
      <th>EXPIRED DATE</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {filteredData.map((item, index) =>
      item.properties.map((property, propertyIndex) => (
        <tr key={`${index}-${propertyIndex}`}>
          <td>{propertyIndex + 1}</td>
          <td>
                          <img
                            src={
                              property.photos && property.photos.length > 0
                                ? `https://ppcpondy.com/PPC/${property.photos[0]}`
                                : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
                            }
                            alt="Property"
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                          />
                        </td>
                        <td style={{cursor: "pointer"}}     
                         onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
                              })
                            }>{property.ppcId}</td>
      
          <td>{property.propertyMode || "N/A"}</td>
          <td>{property.propertyType || "N/A"}</td>
          <td>₹{property.price}</td>
          <td>{property.streetName || "N/A"}</td>
          <td>{property.createdBy}</td>
          <td>{new Date(property.createdAt).toLocaleString()}</td>
          <td>{new Date(property.updatedAt).toLocaleString()}</td>
          <td>{property.required}</td>
          <td>{ item.user.adsCount}</td>
          <td>{property.status}</td>
          <td>{item.user.planName}</td>
     
                              <td>{item.user.adminName}</td>
          <td>{item.user.billNo}</td>
          <td>{property.featureStatus}</td>
           <td>{property.createdBy}</td>
          <td>{item.user.billCreatedAt}</td>
          <td>{item.user.planExpiryDate}</td>
          <td>
  {property.isDeleted ? (
    <button
      className="btn btn-success btn-sm"
      onClick={() => handleUndoDelete(property.ppcId)}
    >
      Undo
    </button>
  ) : (
    <button
      className="btn btn-danger btn-sm"
      onClick={() => handleDelete(property.ppcId)}
    >
      Delete
    </button>
  )}
</td>

        </tr>
      ))
    )}
  </tbody>
</Table>
</div>
    </div>
  );
};

export default FreePlansWithProperties;




















