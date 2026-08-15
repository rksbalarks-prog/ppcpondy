


import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useSelector } from "react-redux";

const BuyerAssistanceSummary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const navigate = useNavigate();
const [summaryFilters, setSummaryFilters] = useState({
  phoneNumber: '',
  ba_postBy: '',
  startDate: '',
  endDate: ''
});

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-summary`);
      const sortedData = res.data.data.sort((a, b) => {
        const aDate = new Date(a.entries[0]?.updatedAt?.split("/").reverse().join("-"));
        const bDate = new Date(b.entries[0]?.updatedAt?.split("/").reverse().join("-"));
        return bDate - aDate; // Sort by latest updatedAt first
      });
      setSummaryData(sortedData);
    } catch (error) {
      console.error("Failed to fetch summary", error);
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

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "BuyerStatics"; // current file
   
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
    <div className="p-4">
      <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}  className="d-flex flex-row gap-2 align-items-center flex-nowrap">
  <input
    type="text"
    placeholder="Filter by Phone"
    value={summaryFilters.phoneNumber}
    onChange={(e) => setSummaryFilters({ ...summaryFilters, phoneNumber: e.target.value })}
  />
  <input
    type="text"
    placeholder="Filter by BA Post By"
    value={summaryFilters.ba_postBy}
    onChange={(e) => setSummaryFilters({ ...summaryFilters, ba_postBy: e.target.value })}
  />
  <input
    type="date"
    value={summaryFilters.startDate}
    onChange={(e) => setSummaryFilters({ ...summaryFilters, startDate: e.target.value })}
  />
  <input
    type="date"
    value={summaryFilters.endDate}
    onChange={(e) => setSummaryFilters({ ...summaryFilters, endDate: e.target.value })}
  />
  <button
    onClick={() =>
      setSummaryFilters((prev) => ({ ...prev, startDate: '', endDate: '' }))
    }
    style={{ padding: '4px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
  >
    Reset Dates
  </button>
</div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 className="text-xl font-bold mb-4">Buyer Assistance Summary</h2>
<div ref={tableRef}>      <table className="table-auto border w-full mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">S.No</th>
            <th className="border px-4 py-2">Phone Number</th>
            <th className="border px-4 py-2">Posted By</th>
            <th className="border px-4 py-2">Buyer Assistance Count</th>
            <th className="border px-4 py-2">Created Date</th>
            <th className="border px-4 py-2">Updated Date</th>
            <th className="border px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
         
          {summaryData
  .filter((item) => {
    const { phoneNumber, ba_postBy, startDate, endDate } = summaryFilters;
    const latestEntry = item.entries[0] || {};
    const entryDateStr = latestEntry.updatedAt?.split("/").reverse().join("-");
    const entryDate = entryDateStr ? new Date(entryDateStr) : null;

    const matchPhone = phoneNumber ? item.phoneNumber.includes(phoneNumber) : true;
    const matchBA = ba_postBy ? (latestEntry.ba_postBy || '').toLowerCase().includes(ba_postBy.toLowerCase()) : true;
    const matchStart = startDate ? entryDate && entryDate >= new Date(startDate) : true;
    const matchEnd = endDate ? entryDate && entryDate <= new Date(endDate) : true;

    return matchPhone && matchBA && matchStart && matchEnd;
  })
  .map((item, index) => {
    const latestEntry = item.entries[0] || {};
    return (
      <tr key={item.phoneNumber}>
        <td className="border px-4 py-2">{index + 1}</td>
        <td className="border px-4 py-2">{item.phoneNumber}</td>
        <td className="border px-4 py-2">{latestEntry.ba_postBy || "N/A"}</td>
        <td className="border px-4 py-2">{item.count}</td>
        <td className="border px-4 py-2">{latestEntry.createdAt || "N/A"}</td>
        <td className="border px-4 py-2">{latestEntry.updatedAt || "N/A"}</td>
        <td className="border px-4 py-2">
          <button
            onClick={() =>
              navigate(`/dashboard/all-buyer-statics?phoneNumber=${encodeURIComponent(item.phoneNumber)}`)
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
    );
  })}

        </tbody>
      </table>
      </div>
    </div>
  );
};

export default BuyerAssistanceSummary;
