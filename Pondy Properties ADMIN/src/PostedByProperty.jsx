
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import { MdDeleteForever, MdUndo } from "react-icons/md";
import PhoneCell from "./components/PhoneCell";

const PostedByProperty = () => {
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-all-postby-properties`);
        const sortedData = (response.data.users || []).sort((a, b) => {
          const updatedAtA = new Date(a.updatedAt);
          const updatedAtB = new Date(b.updatedAt);
          const createdAtA = new Date(a.createdAt);
          const createdAtB = new Date(b.createdAt);
  
          if (updatedAtB - updatedAtA !== 0) {
            return updatedAtB - updatedAtA; // Sort by updatedAt first
          }
          return createdAtB - createdAtA;   // Fallback to createdAt if updatedAt is equal
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
  
        // Optimistically update the local state
        setFilteredData(prevData =>
          prevData.map(property =>
            property.ppcId === ppcId ? { ...property, isDeleted: true } : property
          )
        );
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

      // Optimistically update the local state
      setFilteredData(prevData =>
        prevData.map(property =>
          property.ppcId === ppcId ? { ...property, isDeleted: false } : property
        )
      );
    } catch (error) {
      alert('Failed to undo delete.');
    }
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
        const ppcIdMatch = searchTerm
          ? String(property.ppcId).toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        const phoneNumberMatch = searchTerm
          ? String(property.phoneNumber).toLowerCase().includes(searchTerm.toLowerCase())
          : true;

        const createdAt = new Date(property.createdAt);
        const startMatch = startDate ? createdAt >= new Date(startDate) : true;
        const endMatch = endDate ? createdAt <= new Date(endDate + "T23:59:59") : true;

        return (ppcIdMatch || phoneNumberMatch) && startMatch && endMatch;
      }),
    })).filter((item) => item.properties.length > 0);

    setFilteredData(filtered);
  };

  

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "PostBy Property"; // current file
   
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
      <h1 className="my-4 text-center">PostedBy Properties</h1>

      {/* Search Form */}
      <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
   className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <div className="mb-3">
          <label htmlFor="searchTerm" className="form-label fw-bold">Search PPC ID / Phone Number</label>
          <input
            type="text"
            id="searchTerm"
            className="form-control"
            placeholder="Enter PPC ID or Phone Number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="startDate" className="form-label fw-bold">From Date</label>
          <input
            type="date"
            id="startDate"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="endDate" className="form-label fw-bold">To Date</label>
          <input
            type="date"
            id="endDate"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
                     <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      </form>

      <h3 className="mt-4 mb-4">PostedBy Properties datas</h3> 
  <div ref={tableRef}>   <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
    <tr>
      <th>Sl. No</th>
      <th>Image</th>
      <th>PPC ID</th>
      <th>Phone Number</th>
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
    {filteredData.map((property, index) => (
      <tr key={property._id || index}>
        <td>{index + 1}</td>
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
        <td  style={{cursor: "pointer"}}  onClick={() =>
              navigate(`/dashboard/detail`, {
                state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
              })
            }>{property.ppcId}</td>
        <td><PhoneCell phone={property.phoneNumber} type="owner" ppcId={property.ppcId} /></td>
        <td>{property.propertyMode || "N/A"}</td>
        <td>{property.propertyType || "N/A"}</td>
        <td>₹{property.price}</td>
        <td>{property.streetName || "N/A"}</td>
        <td>{property.createdBy || "N/A"}</td>
        <td>{new Date(property.createdAt).toLocaleString()}</td>
        <td>{new Date(property.updatedAt).toLocaleString()}</td>
        <td>{property.required}</td>
        <td>{property.adsCount}</td>
        <td>{property.status}</td>
        <td>{property.planName}</td>
 
        <td>{property.adminName}</td>
        <td>{property.billNo}</td>
        <td>{property.featureStatus}</td>
        <td>{property.createdBy}</td>
        <td>{property.planCreatedAt}</td>
        <td>{property.planExpiryDate}</td>
 

         <td>
                                    {property.isDeleted ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUndoDelete(property.ppcId)}
                            >
                              <MdUndo />
                            </button>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(property.ppcId)}
                            >
                              <MdDeleteForever />
                            </button>
                          )}
                          
                          </td>
      </tr>
    ))}
  </tbody>
</Table>
</div> 
    </div>
  );
};

export default PostedByProperty;