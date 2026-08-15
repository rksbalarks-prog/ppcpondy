import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Button, Table } from "react-bootstrap";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import PhoneCell from "./components/PhoneCell";

const UserLeadStatsTable = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusProperties, setStatusProperties] = useState({});
const [searchText, setSearchText] = useState('');
const [ppcIdFilter, setPpcIdFilter] = useState('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

const resetDates = () => {
  setStartDate('');
  setEndDate('');
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
const filteredData = properties.filter((item) => {
  // General text match
  const matchesSearch = Object.values(item).some((value) =>
    value?.toString().toLowerCase().includes(searchText.toLowerCase())
  );

  // Exact match for PPC ID
  const matchesPpcId = ppcIdFilter
    ? item.ppcId?.toString() === ppcIdFilter
    : true;

  // Date range filtering
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const from = startDate ? new Date(startDate) : null;
  const to = endDate ? new Date(endDate) : null;

  const matchesDate =
    (!from || (createdAt && createdAt >= from)) &&
    (!to || (createdAt && createdAt <= to));

  return matchesSearch && matchesPpcId && matchesDate;
});

 
  const handlePermanentDelete = async (ppcId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this record?");
    if (!confirmDelete) return;
  
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/delete-ppcId-data`, {
        params: { ppcId },
      });
  
      if (response.status === 200) {
        alert("User Permenent deleted successfully!");
  
        // Remove from UI list
        setProperties((prevProperties) =>
          prevProperties.filter((property) => property.ppcId !== ppcId)
        );
  
        // Also update localStorage if status is stored
        const updatedStatus = { ...statusProperties };
        delete updatedStatus[ppcId];
        setStatusProperties(updatedStatus);
        localStorage.setItem("statusProperties", JSON.stringify(updatedStatus));
      } else {
        alert(response.data.message || "Failed to delete user.");
      }
    } catch (error) {
      alert("An error occurred while deleting.");
    }
  };
  

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/user-lead-stats`)
      .then((res) => {
        // Flatten all properties from all users
        const allProperties = res.data.data.flatMap(user =>
          user.properties.map(prop => ({
            ...prop,
            ownerPhone: user.phoneNumber
          }))
        );
        setProperties(allProperties);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, []);

  
    const reduxAdminName = useSelector((state) => state.admin.name);
    const reduxAdminRole = useSelector((state) => state.admin.role);
    
    const adminName = reduxAdminName || localStorage.getItem("adminName");
    const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
    
    
     const [allowedRoles, setAllowedRoles] = useState([]);
     
     const fileName = "FreeUser Lead"; // current file
     
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
    <div className="container mt-4">
<div  className="d-flex flex-row gap-2 align-items-center flex-nowrap"
    style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}>
  <input
    type="text"
    placeholder="Search"
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
  />
  <input
    type="text"
    placeholder="PPC ID"
    value={ppcIdFilter}
    onChange={(e) => setPpcIdFilter(e.target.value)}
  />
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
  />
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
  />
  <button style={{background:"orange"}} onClick={resetDates}>Reset Dates</button>
</div>

             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>

      <h2 className="mb-3">All User Properties Overview</h2>
 {loading ? (
  <p>Loading...</p>
) : filteredData.length === 0 ? (
  <p>No properties found.</p>
) : (
  <div ref={tableRef}>
  <Table striped bordered hover responsive className="table-sm align-middle">
    <thead className="sticky-top">
      <tr>
        <th>S.No</th>
        <th>Owner Phone</th>
        <th>PPC ID</th>
        <th>Mode</th>
        <th>Type</th>
        <th>City</th>
        <th>Area</th>
        <th>Created At</th>
        <th>Updated At</th>
        <th>Interest</th>
        <th>Contact</th>
        <th>Favorite</th>
        <th>Action</th>
        {/* <th>View Details</th> */}
      </tr>
    </thead>
    <tbody>
      {filteredData.map((prop, index) => (
        <tr key={`${prop.ppcId}-${index}`}>
          <td>{index + 1}</td>
          <td><PhoneCell phone={prop.ownerPhone} type="any" /></td>
          <td style={{cursor: "pointer"}}
            onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: prop.ppcId, phoneNumber: prop.phoneNumber },
                              })
                            }>{prop.ppcId}</td>
          <td>{prop.propertyMode}</td>
          <td>{prop.propertyType}</td>
          <td>{prop.city}</td>
          <td>{prop.area}</td>
          <td>{new Date(prop.createdAt).toLocaleDateString()}</td>
          <td>{new Date(prop.updatedAt).toLocaleDateString()}</td>
          <td>{prop.interestCount}</td>
          <td>{prop.contactCount}</td>
          <td>{prop.favoriteCount}</td>
          <td>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handlePermanentDelete(prop.ppcId)}
            >
              <MdDeleteForever />
            </Button>
          </td>
        
        </tr>
      ))}
    </tbody>
  </Table></div>
)}

    </div>
  );
};

export default UserLeadStatsTable;











