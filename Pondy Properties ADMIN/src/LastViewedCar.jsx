 

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table } from 'react-bootstrap';
import { MdDeleteForever, MdUndo } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const AllLastViewedProperties = () => {
  const [views, setViews] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchPhoneNumber, setSearchPhoneNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // 🟢 FETCH AND SORT BY viewedAt (Recent to Old)
  const fetchLastViewedProperties = async () => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/user-get-all-last-views`);
    const data = res.data || []; // ✅ fix applied
    const sorted = data.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    setViews(sorted);
  } catch (err) {
    console.error("Fetch error", err);
    setViews([]);
  }
};


  useEffect(() => {
    fetchLastViewedProperties();
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
  // 🟢 Filter Logic
  const filteredData = React.useMemo(() => {
    return views.filter(entry => {
      const createdAt = new Date(entry.viewedAt).getTime();
      const from = fromDate ? new Date(fromDate).getTime() : null;
      const to = endDate ? new Date(endDate).getTime() : null;

      const ppcId = entry.property?.ppcId || "";
      const phoneNumber = entry.phoneNumber || "";

      const matchesSearch = search ? ppcId.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesPhone = searchPhoneNumber ? phoneNumber.includes(searchPhoneNumber) : true;
      const matchesStartDate = from ? createdAt >= from : true;
      const matchesEndDate = to ? createdAt <= to : true;

      return matchesSearch && matchesPhone && matchesStartDate && matchesEndDate;
    });
  }, [views, search, searchPhoneNumber, fromDate, endDate]);

  // 🟢 Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (ppcId) => {
    if (!window.confirm(`Delete PPC ID: ${ppcId}?`)) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`);
      fetchLastViewedProperties();
    } catch (error) {
      alert("Delete failed.");
    }
  };

  const handleUndoDelete = async (ppcId) => {
    if (!window.confirm(`Undo delete for PPC ID: ${ppcId}?`)) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-free-property/${ppcId}`);
      fetchLastViewedProperties();
    } catch (error) {
      alert("Undo delete failed.");
    }
  };

  // 🟢 Download handlers
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("All Users' Last Viewed Properties", 14, 10);
    autoTable(doc, {
      head: [["#", "Phone Number", "PPC ID", "Property Type", "City", "District", "Viewed At"]],
      body: filteredData.map((entry, index) => [
        index + 1,
        entry.phoneNumber,
        entry.property?.ppcId || "-",
        entry.property?.propertyType || "-",
        entry.property?.city || "-",
        entry.property?.district || "-",
        moment(entry.viewedAt).format("DD-MM-YYYY hh:mm A"),
      ]),
    });
    doc.save("Last_Viewed_Properties.pdf");
  };

  const downloadExcel = () => {
    const sheet = filteredData.map((entry, index) => ({
      "S.No": index + 1,
      "Phone Number": entry.phoneNumber,
      "PPC ID": entry.property?.ppcId || "-",
      "Property Type": entry.property?.propertyType || "-",
      "City": entry.property?.city || "-",
      "District": entry.property?.district || "-",
      "Viewed At": moment(entry.viewedAt).format("DD-MM-YYYY hh:mm A"),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheet);
    XLSX.utils.book_append_sheet(wb, ws, "LastViewed");
    XLSX.writeFile(wb, "Last_Viewed_Properties.xlsx");
  };



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "LastViewed Property"; // current file
   
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
   
  
  
   if (!allowedRoles.includes(fileName)) {
     return (
       <div className="text-center text-red-500 font-semibold text-lg mt-10">
         Only admin is allowed to view this file.
       </div>
     );
   }


  return (
    <div className="container mx-auto p-4">
      <h2 className="mb-3">All Users' Last Viewed Properties</h2>

      {/* Filters */}
      <form className="d-flex flex-wrap gap-3 mb-3" onSubmit={e => e.preventDefault()}>
        <div>
          <label>Search PPC ID</label>
          <input className="form-control" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <label>Phone Number</label>
          <input className="form-control" value={searchPhoneNumber} onChange={e => setSearchPhoneNumber(e.target.value)} />
        </div>
        <div>
          <label>From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label>End Date</label>
          <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button className="btn btn-secondary align-self-end" onClick={() => {
          setSearch('');
          setSearchPhoneNumber('');
          setFromDate('');
          setEndDate('');
        }}>Reset</button>
      </form>

      {/* Export Buttons */}
      <div className="mb-3 d-flex gap-2">
        <button className="btn btn-primary" onClick={downloadPDF}>Download PDF</button>
        <button className="btn btn-success" onClick={downloadExcel}>Download Excel</button>
                   <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button></div>
<div ref={tableRef}>
      {/* Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Phone Number</th>
            <th>PPC ID</th>
            <th>Property Type</th>
            <th>City</th>
            <th>District</th>
            <th>Viewed At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentPageData.length ? currentPageData.map((entry, index) => (
            <tr key={index}>
              <td>{startIndex + index + 1}</td>
              <td>{entry.phoneNumber}</td>
              <td style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/dashboard/detail`, {
                  state: { ppcId: entry.property?.ppcId, phoneNumber: entry.phoneNumber }
                })}
              >
                {entry.property?.ppcId}
              </td>
              <td>{entry.property?.propertyType}</td>
              <td>{entry.property?.city}</td>
              <td>{entry.property?.district}</td>
              <td>{moment(entry.viewedAt).format("DD-MM-YYYY hh:mm A")}</td>
              <td>
                {entry.property?.isDeleted ? (
                  <button className="btn btn-warning" onClick={() => handleUndoDelete(entry.property?.ppcId)}>
                    <MdUndo />
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={() => handleDelete(entry.property?.ppcId)}>
                    <MdDeleteForever />
                  </button>
                )}
              </td>
            </tr>
          )) : (
            <tr><td colSpan="8" className="text-center">No data found</td></tr>
          )}
        </tbody>
      </Table>
</div>
      {/* Pagination */}
      <div className="d-flex gap-1">
        <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn ${currentPage === i + 1 ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button className="btn btn-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
      </div>
    </div>
  );
};

export default AllLastViewedProperties;
