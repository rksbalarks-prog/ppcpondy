
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdDeleteForever, MdUndo } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Table , Pagination, Button} from 'react-bootstrap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';



const FavoriteTables = () => {
    const [favoriteRequestsData, setFavoriteRequestsData] = useState([]);
    const [propertiesData, setPropertiesData] = useState([]);
    const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

    // Search & Filter States
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 30;
 
    // Fetch all favorite data for owner and buyer
    const fetchAllFavoriteData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-favorite-requests`);

            if (response.status === 200 && response.data.favoriteRequestsData) {
                setFavoriteRequestsData(response.data.favoriteRequestsData);
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
    
                setFavoriteRequestsData(prev =>
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
    
                setFavoriteRequestsData(prev =>
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
const combinedData = favoriteRequestsData.map(data => ({ ...data, type: 'Owner' }));
const filteredData = filterData(combinedData);  // ← use only as variable
const totalItems = filteredData.length;

const totalPages = Math.ceil(totalItems / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        fetchAllFavoriteData();
    }, []);

const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Favorite Owner Data", 14, 10);
    const tableColumn = [
        "PPC ID", "Posted Phone", "Favorited Phones",
        "Property Mode", "Property Type", "Price", "Area",
        "Views", "Created At", "Updated At"
    ];
    const tableRows = [];

    filterData(favoriteRequestsData).forEach(data => {
        const rowData = [
            data.ppcId,
            data.postedUserPhoneNumber,
            (data.favoritedUserPhoneNumbers || []).join(', '),
            data.propertyMode || 'N/A',
            data.propertyType || 'N/A',
            data.price || 'N/A',
            data.area || 'N/A',
            data.views || 0,
            data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A',
            data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A',
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });

    doc.save("favorite-data.pdf");
};

const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
        filterData(favoriteRequestsData).map(data => ({
            "PPC ID": data.ppcId,
            "Posted Phone": data.postedUserPhoneNumber,
            "Favorited Phones": (data.favoritedUserPhoneNumbers || []).join(', '),
            "Property Mode": data.propertyMode || 'N/A',
            "Property Type": data.propertyType || 'N/A',
            "Price": data.price || 'N/A',
            "Area": data.area || 'N/A',
            "Views": data.views || 0,
            "Created At": data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A',
            "Updated At": data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A',
        }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Favorite Data");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "favorite-data.xlsx");
};

    
const reduxAdminName = useSelector((state) => state.admin.name);
const reduxAdminRole = useSelector((state) => state.admin.role);

const adminName = reduxAdminName || localStorage.getItem("adminName");
const adminRole = reduxAdminRole || localStorage.getItem("adminRole");


 const [allowedRoles, setAllowedRoles] = useState([]);
 
 const fileName = "ShortList Favorite Table"; // current file
 
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
            <h2 className="mb-4">Search Favorite Requests</h2>

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

            <div className="d-flex justify-content-end mb-3">
    <button className="btn btn-success me-2" onClick={exportPDF}>
        📄 Download PDF
    </button>
    <button className="btn btn-primary" onClick={exportExcel}>
        📊 Download Excel
    </button>
                 <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
</div>


            {loading ? (
                <p>Loading data...</p>
            ) : (
                <>
                    {/* Favorite Owner Data */}
                    <h3 className='text-success pb-3 mb-3'>Favorite Owner Data</h3>
 {filteredData.length > 0 ? (
                        <>      <div ref={tableRef}>                     <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
                                <tr>
                                    <th>PPC ID</th>
                                    <th>Posted User Phone Number</th>
                                    <th>Favorited User Phone Numbers</th>
                                    <th>Property Mode</th>
                                    <th>Property Type</th>
                                    <th>Price</th>
                                    <th>Area</th>
                                    <th>Views</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>Actions</th>
                            {/* <th>Views Details</th>  */}
                               </tr>
                            </thead>
                            <tbody>
  {currentPageData.map((data, index) => (
                                    <tr key={index}>
                                        <td style={{cursor: "pointer"}}   onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: data.ppcId, phoneNumber: data.phoneNumber },
                              })
                            }>{data.ppcId}</td>
                                        <td>{data.postedUserPhoneNumber}</td>
                                        <td>{(data.favoritedUserPhoneNumbers || []).join(', ')}</td>
                                        <td>{data.propertyMode || 'N/A'}</td>
                                        <td>{data.propertyType || 'N/A'}</td>
                                        <td>{data.price || 'N/A'}</td>
                                        <td>{data.area || 'N/A'}</td>
                                        <td>{data.views || 0}</td>
                                        <td>{data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</td>
                                        <td>{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}</td>
                                        {/* <td>
                                            <button className="btn btn-danger" onClick={() => handleDelete(data.ppcId)}>
                                                <MdDeleteForever size={24} />
                                            </button>
                                        </td> */}

<td>
    {data.isDeleted ? (
        <button className="btn btn-warning" onClick={() => handleUndoDelete(data.ppcId)}>
           <MdUndo /> Undo
        </button>
    ) : (
        <button className="btn btn-danger" onClick={() => handleDelete(data.ppcId)}>
            <MdDeleteForever size={24} />
        </button>
    )}
</td>
        

                                    </tr>
                                ))}
                            </tbody>
                        </Table></div>
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
                        <p>No favorite owner data found.</p>
                    )}

                  
                </>
            )}
        </div>
    );
};

export default FavoriteTables;
