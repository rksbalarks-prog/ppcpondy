







import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdDeleteForever, MdUndo } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Button, Pagination, Table } from 'react-bootstrap';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from 'react-router-dom';

const SoldOutTables = () => {
    const [soldOutRequestsData, setSoldOutRequestsData] = useState([]);
    const [propertiesData, setPropertiesData] = useState([]);
    const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 30;
    const navigate = useNavigate();

    // Search & Filter States
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Fetch all sold-out request data for owners and buyers
    const fetchAllSoldOutData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-soldout-requests`);

            if (response.status === 200 && response.data.soldOutRequestsData) {
                setSoldOutRequestsData(response.data.soldOutRequestsData);
                setPropertiesData(response.data.propertiesData);
            } else {
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    
    const handleDelete = async (ppcId) => {
        if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-soldout/${ppcId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                alert(data.message);

                // Remove the deleted sold-out request row from the table
                setSoldOutRequestsData(prev => prev.filter(item => item.ppcId !== ppcId));
            } catch (error) {
                alert('Failed to delete the sold-out request.');
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

                // Update state
                setSoldOutRequestsData(prev =>
                    prev.map(item =>
                        item.ppcId === ppcId ? { ...item, isDeleted: false } : item
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
    // Filter function for search and date range
    const filterData = (data) => {
        return data.filter(item => {
            const createdAt = new Date(item.createdAt).getTime();
            const from = fromDate ? new Date(fromDate).getTime() : null;
            const to = endDate ? new Date(endDate).getTime() : null;

            // Ensure ppcId is a string before calling toLowerCase()
            const matchesSearch = search ? String(item.ppcId).toLowerCase().includes(search.toLowerCase()) : true;
            const matchesStartDate = from ? createdAt >= from : true;
            const matchesEndDate = to ? createdAt <= to : true;

            return matchesSearch && matchesStartDate && matchesEndDate;
        });
    };
const combinedData = soldOutRequestsData.map(data => ({ ...data, type: 'Owner' }));
const filteredData = filterData(combinedData);  // ← use only as variable
const totalItems = filteredData.length;

const totalPages = Math.ceil(totalItems / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);


    useEffect(() => {
        fetchAllSoldOutData();
    }, []);


    
  // --- PDF Export ---
  const exportPDF = () => {
    const doc = new jsPDF();

    // Columns for the table
    const columns = [
      "PPC ID",
      "Posted User Phone Number",
      "Sold-Out Requesters Phone Numbers",
      "Property Mode",
      "Property Type",
      "Price",
      "Area",
      "Views",
      "Created At",
      "Updated At",
    ];

    // Rows for the table from filtered data
    const rows = filterData(soldOutRequestsData).map((item) => [
      item.ppcId || "",
      item.postedUserPhoneNumber || "",
      (item.soldOutRequestedUserPhoneNumbers || []).join(", "),
      item.propertyMode || "N/A",
      item.propertyType || "N/A",
      item.price || "N/A",
      item.area || "N/A",
      item.views || 0,
      item.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "N/A",
      item.updatedAt
        ? new Date(item.updatedAt).toLocaleString()
        : "N/A",
    ]);

    doc.text("Sold-Out Requests Data", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [columns],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      theme: "grid",
    });

    doc.save("SoldOut_Requests.pdf");
  };

  // --- Excel Export ---
  const exportExcel = () => {
    // Prepare data for sheet
    const wsData = [
      [
        "PPC ID",
        "Posted User Phone Number",
        "Sold-Out Requesters Phone Numbers",
        "Property Mode",
        "Property Type",
        "Price",
        "Area",
        "Views",
        "Created At",
        "Updated At",
      ],
      ...filterData(soldOutRequestsData).map((item) => [
        item.ppcId || "",
        item.postedUserPhoneNumber || "",
        (item.soldOutRequestedUserPhoneNumbers || []).join(", "),
        item.propertyMode || "N/A",
        item.propertyType || "N/A",
        item.price || "N/A",
        item.area || "N/A",
        item.views || 0,
        item.createdAt
          ? new Date(item.createdAt).toLocaleString()
          : "N/A",
        item.updatedAt
          ? new Date(item.updatedAt).toLocaleString()
          : "N/A",
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "SoldOut Requests");
    XLSX.writeFile(wb, "SoldOut_Requests.xlsx");
  };

    
    
        const reduxAdminName = useSelector((state) => state.admin.name);
        const reduxAdminRole = useSelector((state) => state.admin.role);
        
        const adminName = reduxAdminName || localStorage.getItem("adminName");
        const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
        
        
         const [allowedRoles, setAllowedRoles] = useState([]);
         
         const fileName = "SoldOut Table"; // current file
         
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

         
    

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Search Sold-Out Requests</h2>

            {/* Search & Filter Form */}
            <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}
                onSubmit={(e) => e.preventDefault()} 
         className="d-flex flex-row gap-2 align-items-center flex-nowrap"
            >
                <div className="mb-3">
                    <label htmlFor="searchInput" className="form-label fw-bold">Search PPC ID</label>
                    <input
                        type="text"
                        id="searchInput"
                        className="form-control"
                        placeholder="Enter PPC ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="fromDate" className="form-label fw-bold">From Date</label>
                    <input
                        type="date"
                        id="fromDate"
                        className="form-control"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="endDate" className="form-label fw-bold">End Date</label>
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
        type="button"
        className="btn btn-secondary"
        onClick={() => {
            setSearch('');
            setFromDate('');
            setEndDate('');
        }}
    >
        Reset Filters
    </button>
                             <button type="button" className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
            </form>


              {/* Buttons for export */}
      <div className="mb-3 d-flex gap-3 justify-content-center">
        <button className="btn btn-primary" onClick={exportPDF}>
          Download PDF
        </button>
        <button className="btn btn-success" onClick={exportExcel}>
          Download Excel
        </button>
      </div>

            {loading ? (
                <p>Loading data...</p>
            ) : (
                <>
                    {/* Sold-Out Owner Data */}
                    <h3 className='text-success pb-3 mt-5'>Sold-Out Owner Data</h3>
                 {filteredData.length > 0 ? (
                     <>   <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
                                <tr>
                                    <th>PPC ID</th>
                                    <th>Posted User Phone Number</th>
                                    <th>Sold-Out Requesters Phone Numbers</th>
                                    <th>Property Mode</th>
                                    <th>Property Type</th>
                                    <th>Price</th>
                                    <th>Area</th>
                                    <th>Views</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>Actions</th>
                                {/* <th>Views Details</th> */}
                                 </tr>
                            </thead>
                            <tbody>
  {currentPageData.map((data, index) => (
                                    <tr key={index}>
                                        <td style={{cursor: "pointer"}}  onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: data.ppcId, phoneNumber: data.phoneNumber },
                              })
                            }>{data.ppcId}</td>
                                        <td>{data.postedUserPhoneNumber}</td>
                                        <td>{(data.soldOutRequestedUserPhoneNumbers || []).join(', ')}</td>
                                        <td>{data.propertyMode || 'N/A'}</td>
                                        <td>{data.propertyType || 'N/A'}</td>
                                        <td>{data.price || 'N/A'}</td>
                                        <td>{data.area || 'N/A'}</td>
                                        <td>{data.views || 0}</td>
                                        <td>{data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</td>
                                        <td>{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}</td>
                                         <td>
                                            <button className="btn btn-danger" onClick={() => handleDelete(data.ppcId)}>
                                                <MdDeleteForever size={24} />
                                            </button>
                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        
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
                                </Pagination>   </>
                    ) : (
                        <p>No sold-out owner data found.</p>
                    )}

                  
                </>
            )}
        </div>
    );
};

export default SoldOutTables;





