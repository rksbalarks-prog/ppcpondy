 

import axios from 'axios';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const UserActivityCounts = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [activityFilters, setActivityFilters] = useState({
  phoneNumber: '',
  startDate: '',
  endDate: ''
});

  const navigate = useNavigate();

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/get-user-activity-counts`); // Replace with your actual API endpoint

        if (!response.ok) {
          throw new Error(` ${response.status}`);
        }
        const result = await response.json();
        if (result.data) {
          setActivityData(result.data);
        } else {
          setActivityData([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

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
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
      //  const [loading, setLoading] = useState(true);
   
   const fileName = "Property Statics"; // current file
   
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
    <div style={{ padding: '20px', margin: 'auto' }}>
    <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="d-flex flex-row gap-2 align-items-center flex-nowrap">
  <input
    type="text"
    placeholder="Filter by Phone"
    value={activityFilters.phoneNumber}
    onChange={(e) => setActivityFilters({ ...activityFilters, phoneNumber: e.target.value })}
  />
  <input
    type="date"
    value={activityFilters.startDate}
    onChange={(e) => setActivityFilters({ ...activityFilters, startDate: e.target.value })}
  />
  <input
    type="date"
    value={activityFilters.endDate}
    onChange={(e) => setActivityFilters({ ...activityFilters, endDate: e.target.value })}
  />
  <button
    onClick={() =>
      setActivityFilters((prev) => ({ ...prev, startDate: '', endDate: '' }))
    }
    style={{
      padding: '4px 10px',
      background: '#dc3545',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    Reset Dates
  </button>
</div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 style={{ textAlign: 'center' }}>User Activity Counts</h2>
 <div ref={tableRef}>     <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'center',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        }}
        border="1"
      >
        <thead style={{ backgroundColor: '#f7f7f7' }}>
          <tr>
            <th>S.No</th>
            <th>Phone Number</th>
            <th>Interest Count</th>
            <th>Contact Count</th>
            <th>Favorite Count</th>
            <th>Photo Request Count</th>
            <th>Offer Count</th>
                        <th>Called List Count</th>

            <th>View Property Count</th>
            <th>Login Date</th>
                        {/* <th>Login Last Date</th> */}
<th>View</th>
          </tr>
        </thead>
        <tbody>
         
          {activityData
  .filter(({ phoneNumber, loginDate }) => {
    const { phoneNumber: filterPhone, startDate, endDate } = activityFilters;

    const matchPhone = filterPhone ? phoneNumber.includes(filterPhone) : true;

    const loginDateObj = loginDate ? new Date(loginDate) : null;
    const matchStart = startDate ? loginDateObj && loginDateObj >= new Date(startDate) : true;
    const matchEnd = endDate ? loginDateObj && loginDateObj <= new Date(endDate) : true;

    return matchPhone && matchStart && matchEnd;
  })
  .map(({ phoneNumber, interestCount, contactCount, favoriteCount, photoRequestCount, offerCount,calledListCount,helpRequestCount,reportRequestCount,viewedPropertyCount, loginDate }, idx) => (
    <tr key={idx}>
      <td>{idx + 1}</td>
      <td>{phoneNumber}</td>
      <td>{interestCount}</td>
      <td>{contactCount}</td>
      <td>{favoriteCount}</td>
      <td>{photoRequestCount}</td>
      <td>{offerCount}</td>
        <td>{calledListCount}</td>

      <td>{viewedPropertyCount}</td>
      <td>{loginDate ? new Date(loginDate).toLocaleString() : 'N/A'}</td>
      <td>
        <button
          onClick={() =>
            navigate(`/dashboard/all-property-statics?phoneNumber=${encodeURIComponent(phoneNumber)}`)
          }
          style={{
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Expand
        </button>
      </td>
    </tr>
  ))}

        </tbody>
      </table>
      </div>
    </div>
  );
};

export default UserActivityCounts;


