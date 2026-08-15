



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


const ReportPropertyTables = () => {
    const [reportedProperties, setReportedProperties] = useState([]);
    const [loading, setLoading] = useState(true);
const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
  const navigate = useNavigate();

    // Search & Filter
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 30;

   

    useEffect(() => {
        const fetchReportedData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-reported-properties`);
                setReportedProperties(res.data.data || []);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchReportedData();
    }, []);

    const handleDelete = async (ppcId) => {
        if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-reportproperty/${ppcId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                alert(data.message);

                // Remove the deleted reported-property row from the table
                setReportedProperties(prev => prev.filter(item => item.ppcId !== ppcId));
            } catch (error) {
                alert('Failed to delete the reported property.');
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
    
                setReportedProperties(prev =>
                    prev.map(item =>
                        item.ppcId === ppcId ? { ...item, isDeleted: false } : item
                    )
                );
            } catch (error) {
                alert('Failed to undo delete.');
            }
        }
    };
    

    
  // --- PDF Export Function ---
  const exportPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "#",
      "PPC ID",
      "Owner Name",
      "Owner Phone",
      "Property Mode",
      "Property Type",
      "Price",
      "Area",
      "City",
      "State",
      "Created",
      "Updated",
      "Total Reports",
    ];
    const tableRows = [];

    filterData().forEach((item, index) => {
      const rowData = [
        index + 1,
        item.ppcId,
        item.ownerName,
        item.ownerPhoneNumber,
        item.propertyMode,
        item.propertyType,
        item.price,
        item.area,
        item.city,
        item.state,
        moment(item.createdAt).format("DD-MM-YYYY hh:mm A"),
        moment(item.updatedAt).format("DD-MM-YYYY hh:mm A"),
        item.totalReports,
      ];
      tableRows.push(rowData);
    });

    doc.text("Reported Properties", 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save("ReportedProperties.pdf");
  };

  // --- Excel Export Function ---
  const exportExcel = () => {
    const filteredData = filterData().map((item, index) => ({
      "#": index + 1,
      "PPC ID": item.ppcId,
      "Owner Name": item.ownerName,
      "Owner Phone": item.ownerPhoneNumber,
      "Property Mode": item.propertyMode,
      "Property Type": item.propertyType,
      Price: item.price,
      Area: item.area,
      City: item.city,
      State: item.state,
      Created: moment(item.createdAt).format("DD-MM-YYYY hh:mm A"),
      Updated: moment(item.updatedAt).format("DD-MM-YYYY hh:mm A"),
      "Total Reports": item.totalReports,
      // You can add report details summary if needed here
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "ReportedProperties");
    XLSX.writeFile(workbook, "ReportedProperties.xlsx");
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
const filterData = (data) => {
    return data.filter(data => {
        const createdAt = new Date(data.createdAt).getTime();
        const from = fromDate ? new Date(fromDate).getTime() : null;
        const to = endDate ? new Date(endDate).getTime() : null;

        const matchesSearch = search ? String(data.ppcId).toLowerCase().includes(search.toLowerCase()) : true;
        const matchesStartDate = from ? createdAt >= from : true;
        const matchesEndDate = to ? createdAt <= to : true;
        const matchesPhone = ownerPhoneNumber ? String(data.ownerPhoneNumber).includes(ownerPhoneNumber) : true;

        return matchesSearch && matchesStartDate && matchesEndDate && matchesPhone;
    });
};


const combinedData = reportedProperties.map(data => ({ ...data, type: 'Owner' }));
const filteredData = filterData(combinedData);  // ← use only as variable
const totalItems = filteredData.length;

const totalPages = Math.ceil(totalItems / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const reduxAdminName = useSelector((state) => state.admin.name);
    const reduxAdminRole = useSelector((state) => state.admin.role);
    
    const adminName = reduxAdminName || localStorage.getItem("adminName");
    const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
    
    
     const [allowedRoles, setAllowedRoles] = useState([]);
     
     const fileName = "Report Property Table"; // current file
     
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
            <h2 className="mb-4">Reported Properties</h2>

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
        <label className="form-label fw-bold">Phone Number</label>
        <input
            type="text"
            className="form-control"
            placeholder="Enter Owner Phone Number"
            value={ownerPhoneNumber}
            onChange={(e) => setOwnerPhoneNumber(e.target.value)}
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
        onClick={() => {
            setSearch('');
            setFromDate('');
            setEndDate('');
            setOwnerPhoneNumber('');
        }}
    >
        Reset Filters
    </button>
                 <button className="btn btn-secondary " style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
            </form>

              {/* Export Buttons */}
      <div className="mb-3">
        <button className="btn btn-primary me-2" onClick={exportPDF}>
          Download PDF
        </button>
        <button className="btn btn-success" onClick={exportExcel}>
          Download Excel
        </button>
      </div>

            {loading ? (
                <p>Loading reported properties...</p>
            ) : filteredData.length > 0 ? (
              <div ref={tableRef}>
                <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
                        <tr>
                            <th>#</th>
                            <th>PPC ID</th>
                            <th>Owner Name</th>
                            <th>Owner Phone</th>
                            <th>Property Mode</th>
                            <th>Property Type</th>
                            <th>Price</th>
                            <th>Area</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th>Total Reports</th>
                            <th>Report Details</th>
                            <th>Action</th>
                            {/* <th>Views</th> */}
                        </tr>
                    </thead>
                    <tbody>
        {currentPageData.map((item, index) => (
                            <tr key={item.ppcId}>
                                <td>{index + 1}</td>
                                <td style={{cursor: "pointer"}} onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: item.ppcId, phoneNumber: item.phoneNumber },
                              })
                            }>{item.ppcId}</td>
                                <td>{item.ownerName}</td>
                                <td>{item.ownerPhoneNumber}</td>
                                <td>{item.propertyMode}</td>
                                <td>{item.propertyType}</td>
                                <td>{item.price}</td>
                                <td>{item.area}</td>
                                <td>{item.city}</td>
                                <td>{item.state}</td>
                                <td>{moment(item.createdAt).format("DD-MM-YYYY hh:mm A")}</td>
                                <td>{moment(item.updatedAt).format("DD-MM-YYYY hh:mm A")}</td>
                                <td>{item.totalReports}</td>
                                <td>
                                    {item.reportDetails.map((report, i) => (
                                        <div key={i} className="mb-2 p-2 bg-light rounded">
                                            <div><strong>By:</strong> {report.phoneNumber}</div>
                                            <div><strong>Reason:</strong> {report.selectReasons || "N/A"}</div>
                                            <div><strong>Comment:</strong> {report.reason || "—"}</div>
                                            <div><strong>Date:</strong> {moment(report.date).format("DD-MM-YYYY hh:mm A")}</div>
                                        </div>
                                    ))}
                                </td>
                                <td>
    {item.isDeleted ? (
        <button className="btn btn-warning" onClick={() => handleUndoDelete(item.ppcId)}>
            <MdUndo />
        </button>
    ) : (
        <button className="btn btn-danger" onClick={() => handleDelete(item.ppcId)}>
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
                <p>No reported properties found.</p>
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

export default ReportPropertyTables;
