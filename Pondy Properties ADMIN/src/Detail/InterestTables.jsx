

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Table , Pagination, Button} from 'react-bootstrap';
import { MdDeleteForever, MdUndo } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
 
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <-- This is the critical missing part
import { useNavigate } from 'react-router-dom';




const InterestTables = () => {
    const [interestRequestsData, setInterestRequestsData] = useState([]);
    const [propertiesData, setPropertiesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
      const navigate = useNavigate();

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 30;

    // Fetch all interest data for owner and buyer
    const fetchAllInterestData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-sendinterest`);

            if (response.status === 200 && response.data.interestRequestsData) {
                const mergedInterestData = response.data.interestRequestsData.map(item => {
                    const matchedProperty = response.data.propertiesData.find(p => p.ppcId === item.ppcId);
                    return {
                        ...item,
                        isDeleted: matchedProperty?.isDeleted || false
                    };
                });

                setInterestRequestsData(mergedInterestData);
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
                const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
                    method: 'PUT',
                });
                const data = await response.json();
                alert(data.message);

                // Update state
                setInterestRequestsData(prev =>
                    prev.map(item =>
                        item.ppcId === ppcId ? { ...item, isDeleted: true } : item
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

                // Update state
                setInterestRequestsData(prev =>
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


const combinedData = interestRequestsData.map(data => ({ ...data, type: 'Owner' }));
const filteredData = filterData(combinedData);  // ← use only as variable
const totalItems = filteredData.length;

const totalPages = Math.ceil(totalItems / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        fetchAllInterestData();
    }, []);


 const exportToPDF = () => {
    const doc = new jsPDF("landscape"); // 'landscape' to fit wide tables

    const tableColumn = [
      "PPC ID", "Posted User", "Interested Users", "Property Mode",
      "Property Type", "Price", "Area", "Owner Name",
      "Views", "Created At", "Updated At"
    ];

    const tableRows = (interestRequestsData || []).map(data => [
      data.ppcId || "N/A",
      data.postedUserPhoneNumber || "N/A",
      (data.interestedUserPhoneNumbers || []).join(", "),
      data.propertyMode || "N/A",
      data.propertyType || "N/A",
      data.price || "N/A",
      data.area || "N/A",
      data.ownerName || "N/A",
      data.views || 0,
      data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A",
      data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "N/A"
    ]);

    doc.text("Interest Request Report", 14, 15); // Title

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [22, 160, 133], // teal green
        textColor: 255,
        fontStyle: "bold"
      },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    doc.save("InterestRequests.pdf");
  };


const exportToExcel = () => {
    const worksheetData = filterData(interestRequestsData).map(data => ({
        "PPC ID": data.ppcId,
        "Posted Phone": data.postedUserPhoneNumber,
        "Interested Phones": (data.interestedUserPhoneNumbers || []).join(', '),
        "Mode": data.propertyMode || 'N/A',
        "Type": data.propertyType || 'N/A',
        "Price": data.price || 'N/A',
        "Area": data.area || 'N/A',
        "Owner": data.ownerName || 'N/A',
        "Views": data.views || 0,
        "Created At": data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A',
        "Updated At": data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Interest Data");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "interest-requests.xlsx");
};


    const reduxAdminName = useSelector((state) => state.admin.name);
    const reduxAdminRole = useSelector((state) => state.admin.role);
    
    const adminName = reduxAdminName || localStorage.getItem("adminName");
    const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
    
    
     const [allowedRoles, setAllowedRoles] = useState([]);
     
     const fileName = "Interest Table"; // current file
     
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
     // Filtered and paginated data
// 1. Filter your data

const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

     

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Search Interest Requests</h2>

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
    className="btn btn-secondary"
    onClick={() => {
      setSearch('');
      setFromDate('');
      setEndDate('');
    }}
  >
    Reset
  </button>
            </form>

            <div className="mb-3 d-flex justify-content-end gap-3">
    <button className="btn btn-primary" onClick={exportToPDF}>
        Download PDF
    </button>
    <button className="btn btn-success" onClick={exportToExcel}>
        Download Excel
    </button>
                 <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
</div>


            {loading ? (
                <p>Loading data...</p>
            ) : (
                <>
                    <h3 className='text-primary pb-3 mt-5'>Combined Interest Data</h3>
                    {filteredData.length > 0 ? (
                        <> 
                        <div ref={tableRef}>
                        <Table striped bordered hover responsive className="table-sm align-middle">
                            <thead className="sticky-top">
                                <tr>
                                    <th>PPC ID</th>
                                    <th>Posted User Phone Number</th>
                                    <th>Interested User Phone Numbers</th>
                                    <th>Property Mode</th>
                                    <th>Property Type</th>
                                    <th>Price</th>
                                    <th>Area</th>
                                    <th>Owner Name</th>
                                    <th>Views</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>Actions</th>
                                    <th>Views Details</th>
</tr>
                            </thead>
              <tbody>
  {currentPageData.map((data, index) => (
    <tr key={index}>
      <td  style={{cursor: "pointer"}}
          onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: data.ppcId, phoneNumber: data.phoneNumber },
                              })
                            }>{data?.ppcId || 'N/A'}</td>
      <td>{data?.postedUserPhoneNumber || 'N/A'}</td>
      <td>{(data?.interestedUserPhoneNumbers || []).join(', ')}</td>
      <td>{data?.propertyMode || 'N/A'}</td>
      <td>{data?.propertyType || 'N/A'}</td>
      <td>{data?.price || 'N/A'}</td>
      <td>{data?.area || 'N/A'}</td>
      <td>{data?.ownerName || 'N/A'}</td>
      <td>{data?.views || 0}</td>
      <td>{data?.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</td>
      <td>{data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}</td>
      <td>
        {data?.isDeleted ? (
          <button className="btn btn-success btn-sm" onClick={() => handleUndoDelete(data.ppcId)} title="Undo Delete">
            <MdUndo size={24} />
          </button>
        ) : (
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(data.ppcId)} title="Delete">
            <MdDeleteForever size={24} />
          </button>
        )}
      </td>
                  
    </tr>
  ))}
</tbody>

  </Table>
  </div>
        {/* Pagination UI */}
    


                      
                     
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
                        <p>No interest data found.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default InterestTables;



