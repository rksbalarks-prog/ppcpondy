










import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";

const PropertyPpc = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();
const [status, setStatus] = useState('');
const [planName, setPlanName] = useState('');
const [billNo, setBillNo] = useState('');
const [featureStatus, setFeatureStatus] = useState('');



  
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-all-ppc-properties`);
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

      const statusMatch = status
        ? String(property.status).toLowerCase().includes(status.toLowerCase())
        : true;

      const planNameMatch = planName
        ? String(item.bill?.planName).toLowerCase().includes(planName.toLowerCase())
        : true;

      const billNoMatch = billNo
        ? String(item.bill?.billNo).toLowerCase().includes(billNo.toLowerCase())
        : true;

      const featureStatusMatch = featureStatus
        ? String(property.featureStatus).toLowerCase().includes(featureStatus.toLowerCase())
        : true;

      const createdAt = new Date(property.createdAt);
      const startMatch = startDate ? createdAt >= new Date(startDate) : true;
      const endMatch = endDate ? createdAt <= new Date(endDate + "T23:59:59") : true;

      return (
        (ppcIdMatch || phoneNumberMatch) &&
        statusMatch &&
        planNameMatch &&
        billNoMatch &&
        featureStatusMatch &&
        startMatch &&
        endMatch
      );
    }),
  })).filter((item) => item.properties.length > 0);

  setFilteredData(filtered);
};


  

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "PPC Property"; // current file
   
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
      <h1 className="my-4 text-center">PPC NO Properties</h1>

      {/* Search Form */}
      <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch({
          searchTerm,
          status,
          planName,
          billNo,
          featureStatus,
          startDate,
          endDate,
        });
      }}
   className="d-flex flex-row gap-2 align-items-center flex-nowrap"
    >
      <input
        type="text"
        placeholder="Search by PPC ID / Phone"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="form-control"
        style={{ maxWidth: 220 }}
      />

 
<select
           value={status}
        onChange={(e) => setStatus(e.target.value)}>
  <option value="">All Status</option>
  <option value="incomplete">Incomplete</option>
  <option value="active">Active</option>
  <option value="pending">Pending</option>
  <option value="complete">Complete</option>
  <option value="sendInterest">Send Interest</option>
  <option value="soldOut">Sold Out</option>
  <option value="reportProperties">Report Properties</option>
  <option value="needHelp">Need Help</option>
  <option value="contact">Contact</option>
  <option value="favorite">Favorite</option>
  <option value="alreadySaved">Already Saved</option>
  <option value="favoriteRemoved">Favorite Removed</option>
  <option value="delete">Delete</option>
  <option value="undo">Undo</option>
</select>
      <input
        type="text"
        placeholder="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        className="form-control"
        style={{ maxWidth: 180 }}
      />

      <input
        type="text"
        placeholder="Bill No"
        value={billNo}
        onChange={(e) => setBillNo(e.target.value)}
        className="form-control"
        style={{ maxWidth: 140 }}
      />

      <input
        type="text"
        placeholder="Feature Status"
        value={featureStatus}
        onChange={(e) => setFeatureStatus(e.target.value)}
        className="form-control"
        style={{ maxWidth: 180 }}
      />
<select
        value={featureStatus}
        onChange={(e) => setFeatureStatus(e.target.value)}>
  <option value="">All Status</option>
  <option value="incomplete">Incomplete</option>
  <option value="active">Active</option>
  <option value="pending">Pending</option>
  <option value="complete">Complete</option>
  <option value="sendInterest">Send Interest</option>
  <option value="soldOut">Sold Out</option>
  <option value="reportProperties">Report Properties</option>
  <option value="needHelp">Need Help</option>
  <option value="contact">Contact</option>
  <option value="favorite">Favorite</option>
  <option value="alreadySaved">Already Saved</option>
  <option value="favoriteRemoved">Favorite Removed</option>
  <option value="delete">Delete</option>
  <option value="undo">Undo</option>
</select>

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="form-control"
      />

      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="form-control"
      />

      <button type="submit" className="btn btn-primary">
        Search
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          setSearchTerm('');
          setStatus('');
          setPlanName('');
          setBillNo('');
          setFeatureStatus('');
          setStartDate('');
          setEndDate('');
          handleSearch({
            searchTerm: '',
            status: '',
            planName: '',
            billNo: '',
            featureStatus: '',
            startDate: '',
            endDate: '',
          });
        }}
      >
        Reset
      </button>
    </form>

    <h3 className="mt-4 mb-4">PPC No Properties datas</h3> 
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
<div ref={tableRef}>
    <Table striped bordered hover responsive className="table-sm align-middle">
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
          <td>{property.phoneNumber}</td>
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

export default PropertyPpc;