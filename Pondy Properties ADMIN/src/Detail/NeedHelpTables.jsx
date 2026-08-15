







import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MdDeleteForever, MdUndo } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Button, Pagination, Table } from 'react-bootstrap';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from 'react-router-dom';


const HelpRequestTables = () => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [helpRequestsData, setHelpRequestsData] = useState([]);
  const [propertiesData, setPropertiesData] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

const itemsPerPage = 30;
  const handleDelete = async (ppcId, phoneNumber) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-helprequest/${ppcId}/${phoneNumber}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            alert(data.message);

            // Remove the deleted help-request row from the table
            setHelpRequests(prev =>
                prev.filter(item => !(item.ppcId === ppcId && item.phoneNumber === phoneNumber))
            );
        } catch (error) {
            alert('Failed to delete the help request.');
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

            setHelpRequests(prev =>
                prev.map(item =>
                    item.ppcId === ppcId ? { ...item, isDeleted: false } : item
                )
            );
        } catch (error) {
            alert('Failed to undo delete.');
        }
    }
};




  useEffect(() => {
    const fetchHelpRequests = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-help-requests`);
        setHelpRequests(res.data.data || []);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchHelpRequests();
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
const filterData = (data) => {
    return data.filter(data => {
        const createdAt = new Date(data.createdAt).getTime();
        const from = fromDate ? new Date(fromDate).getTime() : null;
        const to = endDate ? new Date(endDate).getTime() : null;

        const matchesSearch = search ? String(data.ppcId).toLowerCase().includes(search.toLowerCase()) : true;
        const matchesStartDate = from ? createdAt >= from : true;
        const matchesEndDate = to ? createdAt <= to : true;

        return matchesSearch && matchesStartDate && matchesEndDate;
    });
};


const combinedData = helpRequests.map(data => ({ ...data, type: 'Owner' }));
const filteredData = filterData(combinedData);  // ← use only as variable
const totalItems = filteredData.length;

const totalPages = Math.ceil(totalItems / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);


// Export to PDF
const handleDownloadPDF = () => {
  const doc = new jsPDF();
  doc.text("Help Request Table", 14, 10);

  const tableData = filterData().map((item, index) => [
    index + 1,
    item.ppcId,
    item.ownerPhoneNumber,
    item.propertyMode,
    item.propertyType,
    item.price,
    item.area,
    item.city,
    item.state,
    item.phoneNumber,
    item.selectHelpReason,
    item.comment || "—",
    moment(item.requestedAt).format("DD-MM-YYYY hh:mm A"),
  ]);

  autoTable(doc, {
    head: [[
      "#", "PPC ID", "Owner Phone", "Property Mode", "Property Type", "Price",
      "Area", "City", "State", "Requested By", "Help Reason", "Comment", "Requested At"
    ]],
    body: tableData,
    startY: 20,
  });

  doc.save("Help_Request_Table.pdf");
};

// Export to Excel
const handleDownloadExcel = () => {
  const tableData = filterData().map((item, index) => ({
    "#": index + 1,
    "PPC ID": item.ppcId,
    "Owner Phone": item.ownerPhoneNumber,
    "Property Mode": item.propertyMode,
    "Property Type": item.propertyType,
    "Price": item.price,
    "Area": item.area,
    "City": item.city,
    "State": item.state,
    "Requested By": item.phoneNumber,
    "Help Reason": item.selectHelpReason,
    "Comment": item.comment || "—",
    "Requested At": moment(item.requestedAt).format("DD-MM-YYYY hh:mm A"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Help Requests");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, "Help_Request_Table.xlsx");
};


  
const reduxAdminName = useSelector((state) => state.admin.name);
const reduxAdminRole = useSelector((state) => state.admin.role);

const adminName = reduxAdminName || localStorage.getItem("adminName");
const adminRole = reduxAdminRole || localStorage.getItem("adminRole");


 const [allowedRoles, setAllowedRoles] = useState([]);
 
 const fileName = "Help Request Table"; // current file
 
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
 
 const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
const handleReset = () => {
  setSearch('');
  setFromDate('');
  setEndDate('');
};


  return (
    <div className="container mt-5">
      <h2 className="mb-4">Help Requests</h2>

      {/* Filters */}
      <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}
        onSubmit={(e) => e.preventDefault()}
      className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <div className="mb-3">
          <label className="form-label fw-bold">Search PPC ID</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter PPC ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">From Date</label>
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
            <button
      type="button"
      className="btn btn-secondary"
      onClick={handleReset}
    >
      Reset
    </button>
                 <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      </form>

      <div className="mb-3 d-flex gap-2">
  <button className="btn btn-outline-primary" onClick={handleDownloadPDF}>
    Download PDF
  </button>
  <button className="btn btn-outline-success" onClick={handleDownloadExcel}>
    Download Excel
  </button>
</div>


  {loading ? (
  <p>Loading help requests...</p>
) : (
  filteredData.length > 0 ? (
    <div ref={tableRef}>
    <Table striped bordered hover responsive className="table-sm align-middle">
      <thead className="sticky-top">
        <tr>
          <th>#</th>
          <th>PPC ID</th>
          <th>Owner Phone</th>
          <th>Property Mode</th>
          <th>Property Type</th>
          <th>Price</th>
          <th>Area</th>
          <th>City</th>
          <th>State</th>
          <th>Requested By</th>
          <th>Help Reason</th>
          <th>Comment</th>
          <th>Requested At</th>
          <th>Action</th> {/* Changed from <td> to <th> */}
         <th>Views Details</th> </tr>
      </thead>
      <tbody>
        {currentPageData.map((data, index) => (
          <tr key={`${data.ppcId}-${index}`}>
            <td>{index + 1}</td>
            <td style={{cursor: "pointer"}} onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: data.ppcId, phoneNumber: data.phoneNumber },
                              })
                            }>{data.ppcId}</td>
            <td>{data.ownerPhoneNumber}</td>
            <td>{data.propertyMode}</td>
            <td>{data.propertyType}</td>
            <td>{data.price}</td>
            <td>{data.area}</td>
            <td>{data.city}</td>
            <td>{data.state}</td>
            <td>{data.phoneNumber}</td>
            <td>{data.selectHelpReason}</td>
            <td>{data.comment || "—"}</td>
            <td>{moment(data.requestedAt).format("DD-MM-YYYY hh:mm A")}</td>
            <td>
              {data.isDeleted ? (
                <button className="btn btn-warning" onClick={() => handleUndoDelete(data.ppcId)}>
                  <MdUndo />
                </button>
              ) : (
                <button className="btn btn-danger" onClick={() => handleDelete(data.ppcId, data.phoneNumber)}>
                  <MdDeleteForever size={24} />
                </button>
              )}
            </td>
            
          </tr>
        ))}
      </tbody>
    </Table>
    </div>
  ) : (
    <p>No help requests found.</p>
  )
)}
           <Pagination className="justify-content-center mt-3">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
            {Array.from({ length: totalPages }, (_, i) => (
                <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => handlePageChange(i + 1)}
                >
                    {i + 1}
                </Pagination.Item>
            ))}
            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>   
  </div>
  );
};

export default HelpRequestTables;
