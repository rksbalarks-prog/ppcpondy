 


import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button, Table } from "react-bootstrap";
import PhoneCell from "./components/PhoneCell";


const RecentProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
const [ppcIdFilter, setPpcIdFilter] = useState('');
const [phoneFilter, setPhoneFilter] = useState('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');

  const fetchRecentProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/fetch-recent-properties`
      );

      const data = await response.json();
      console.log("API Response:", data);

      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
        setMessage("");
      } else {
        setProperties([]);
        setMessage("No recent properties found in the last 15 days.");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setMessage("Failed to fetch recent properties.");
      setProperties([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecentProperties();
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
const filteredProperties = properties.filter((property) => {
const matchesPpcId =
  ppcIdFilter.trim() === '' ||
  String(property.ppcId || '')
    .toLowerCase()
    .includes(ppcIdFilter.trim().toLowerCase());

    const matchesPhone =
    phoneFilter.trim() === '' ||
    property.phoneNumber?.includes(phoneFilter.trim());

  const createdAt = property.createdAt ? new Date(property.createdAt) : null;
  const start = startDate ? new Date(startDate + 'T00:00:00') : null;
  const end = endDate ? new Date(endDate + 'T23:59:59') : null;

  const matchesDate =
    !createdAt ||
    (!start && !end) ||
    (start && end && createdAt >= start && createdAt <= end) ||
    (start && !end && createdAt >= start) ||
    (!start && end && createdAt <= end);

  return matchesPpcId && matchesPhone && matchesDate;
});
const handleReset = () => {
  setPpcIdFilter('');
  setPhoneFilter('');
  setStartDate('');
  setEndDate('');
};

  
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "New Property Lead"; // current file
   
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
    <div className="container">

      <div    className="d-flex flex-row gap-2 align-items-center flex-nowrap"
>
  <input
    type="text"
    placeholder="Filter by PPC ID"
    value={ppcIdFilter}
    onChange={(e) => setPpcIdFilter(e.target.value)}
    className="form-control"
    style={{ maxWidth: '200px' }}
  />
  <input
    type="text"
    placeholder="Filter by Phone"
    value={phoneFilter}
    onChange={(e) => setPhoneFilter(e.target.value)}
    className="form-control"
    style={{ maxWidth: '200px' }}
  />
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
  <button onClick={handleReset} className="btn btn-secondary">
    Reset
  </button>
</div>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2>Recent Properties (Last 15 Days)</h2>

      {loading && <p>Loading...</p>}

      {!loading && message && (
        <div style={{ color: "red", marginBottom: "10px" }}>{message}</div>
      )}

      {!loading && filteredProperties.length > 0 && (
        <div ref={tableRef}>
<Table striped bordered hover responsive className="table-sm align-middle">     
   <thead className="sticky-top">
 <tr>
              <th>S.No</th>
              <th>PPC ID</th>
              <th>PhoneNumber</th>
              <th>Property Mode</th>
              <th>Property Type</th>
              <th>Price</th>
              <th>City</th>
                            <th>State</th>
              <th>Created At</th>
             </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property, index) => (
              <tr key={index}>
                <td>{index+1}</td>
                <td style={{cursor: "pointer"}}
                   onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
                              })
                            }>{property.ppcId || "N/A"}</td>
                                <td><PhoneCell phone={property.phoneNumber} display={property.phoneNumber || "N/A"} type="any" /></td>
                <td>{property.propertyMode || "N/A"}</td>
                <td>{property.propertyType || "N/A"}</td>
                <td>{property.price || "N/A"}</td>
                <td>{property.city || "N/A"}</td>
                <td>{property.state || "N/A"}</td>

                <td>{new Date(property.createdAt).toLocaleString()}</td>
          
                         </tr>
            ))}
          </tbody>
        </Table>
          </div>
      )}
    </div>
  );
};

export default RecentProperties;
