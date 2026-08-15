


import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Table , Pagination, Button} from 'react-bootstrap';
import { MdDeleteForever, MdUndo } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';


const CalledListDatas = () => {
    const [contactRequestsData, setContactRequestsData] = useState([]);
    const [propertiesData, setPropertiesData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
      const navigate = useNavigate();
    
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 30;

    
  useEffect(() => {
    fetchAllContactSentProperties();
  }, []);

  const fetchAllContactSentProperties = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/get-all-contact-sent-properties`
      );

      if (res.data.success) {
        setContactRequestsData(res.data.properties);
        // setMessage(res.data.message);
      } else {
        // setMessage("No data found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
    //   setMessage("Server error while fetching contact sent properties");
    } finally {
      setLoading(false);
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
    // Filter data
const filterData = (data) => {
  return data.filter(item => {
    const contactedAt = new Date(item.contactedAt).getTime(); // ✅ Use contactedAt
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = endDate ? new Date(endDate).getTime() : null;

    const matchesSearch = search
      ? String(item.ppcId).toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesStartDate = from ? contactedAt >= from : true;
    const matchesEndDate = to ? contactedAt <= to : true;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });
};


const combinedData = contactRequestsData.map(data => ({ ...data, type: 'Owner' }));
const filteredData = filterData(combinedData);  // ← use only as variable
const totalItems = filteredData.length;

const totalPages = Math.ceil(totalItems / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);



const handleDelete = async (ppcId) => {
  if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
        method: 'PUT',
      });
      const data = await response.json();
      alert(data.message);

      // ✅ Refresh from server
      fetchAllContactSentProperties();
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

      // ✅ Refresh from server
      fetchAllContactSentProperties();
    } catch (error) {
      alert('Failed to undo delete.');
    }
  }
};



    // Download PDF
const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Contact Request Owner Data", 14, 10);

    const filtered = filterData(contactRequestsData);

    const tableData = filtered.map(item => [
        item.ppcId,
        item.postedUserPhoneNumber,
        (item.contactRequestedUserPhoneNumbers || []).join(', '),
        item.bestTimeToCall || 'N/A',
        item.email || 'N/A',
        item.views || 0,
        item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A',
        item.updatedAt ? moment(item.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A',
    ]);

    autoTable(doc, {
        head: [['PPC ID', 'Posted User', 'Requested Users', 'Best Time', 'Email', 'Views', 'Created At', 'Updated At']],
        body: tableData,
        startY: 20
    });

    doc.save("ContactRequests.pdf");
};

// Download Excel
const downloadExcel = () => {
    const filtered = filterData(contactRequestsData);

    const worksheetData = filtered.map(item => ({
        "PPC ID": item.ppcId,
        "Posted User Phone": item.postedUserPhoneNumber,
        "Contact Requested Users": (item.contactRequestedUserPhoneNumbers || []).join(', '),
        "Best Time to Call": item.bestTimeToCall || 'N/A',
        "Email": item.email || 'N/A',
        "Views": item.views || 0,
        "Created At": item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A',
        "Updated At": item.updatedAt ? moment(item.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contact Requests");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "ContactRequests.xlsx");
};

    
const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  
    return (
        <div className="container mt-5">
            <h2 className="mb-4">Search Contact Requests</h2>

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

            <div className="d-flex justify-content-end mb-3 gap-2">
    <button className="btn btn-success" onClick={downloadPDF}>Download PDF</button>
    <button className="btn btn-primary" onClick={downloadExcel}>Download Excel</button>
             <button className="btn btn-secondary " style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button></div>


            {loading ? (
                <p>Loading data...</p>
            ) : (
                <>
                    <h3 className='text-success pb-3 mt-4'>Contact List Data</h3>
                    {filteredData.length > 0 ? (
                    <>  <div ref={tableRef}>   <Table striped bordered hover responsive className="table-sm align-middle">
                            <thead className="sticky-top">
                                <tr>
                                    <th>S.No</th>
                                    <th>PPC ID</th>
                                    <th>contactedAt</th>
                                    <th>userPhone</th>
                                    <th>postedUserPhone</th>
                                    <th>bestTimeToCall</th>
                                    {/* <th>email</th> */}
                                    <th>views</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>Actions</th>
                                    {/* <th>Views Details</th> */}
</tr>
                            </thead>
                      <tbody>
  {currentPageData.map((data, index) => (
    <tr key={index}>
        <td>{index+1}</td>
      <td
        style={{ cursor: "pointer" }}
        onClick={() =>
          navigate(`/dashboard/detail`, {
            state: {
              ppcId: data.ppcId,
              phoneNumber: data.postedUserPhone, // ✅ navigate with owner phone
            },
          })
        }
      >
        {data.ppcId}
      </td>
            <td>{data.contactedAt 
               ? new Date(data.contactedAt).toLocaleString()
          : "N/A"}</td>

      <td>{data.userPhone}</td>
            <td>{data.postedUserPhone }</td>
      <td>{data.property?.bestTimeToCall || "N/A"}</td>
      {/* <td>{data.property?.email || "N/A"}</td> */}
      <td>{data.property?.views || 0}</td>
      <td>
        {data.property?.createdAt
          ? new Date(data.property.createdAt).toLocaleString()
          : "N/A"}
      </td>
      <td>
        {data.property?.updatedAt
          ? new Date(data.property.updatedAt).toLocaleString()
          : "N/A"}
      </td>
      <td>
        {!data.property?.isDeleted ? (
          <button
            className="btn btn-danger"
            onClick={() => handleDelete(data.ppcId)}
          >
            <MdDeleteForever size={24} />
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={() => handleUndoDelete(data.ppcId)}
          >
            <MdUndo size={24} />
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
                                </Pagination>  
                                 </> 
                    ) : (
                        <p>No contact request owner data found.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default CalledListDatas;

















 