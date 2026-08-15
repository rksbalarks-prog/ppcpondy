










import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, Spinner, Form, Row, Col, Container, Button } from "react-bootstrap";
import moment from "moment";
import { useSelector } from "react-redux";
import { MdDeleteForever } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const FavoriteRemoved = () => {
  const [favoriteRemovedData, setFavoriteRemovedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
const [searchPpcId, setSearchPpcId] = useState('');
  const navigate = useNavigate();

  // Filters
  const [searchPhone, setSearchPhone] = useState("");
  const [searchOwner, setSearchOwner] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const fetchFavoriteRemovedData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-favorite-removed`);
      if (response.status === 200 && response.data.data) {
        setFavoriteRemovedData(response.data.data);
        setFilteredData(response.data.data);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteRemovedData();
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
  // Filtering logic
 useEffect(() => {
    const filtered = favoriteRemovedData.filter((property) => {
      const ownerMatch = searchOwner
        ? property.ownerName?.toLowerCase().includes(searchOwner.toLowerCase())
        : true;
const ppcIdMatch = searchPpcId
  ? String(property?.ppcId || '').toLowerCase().includes(searchPpcId.toLowerCase())
  : true;

      const phoneMatch = searchPhone
        ? property.favoriteRemoved.some((fav) =>
            fav.phoneNumber?.toLowerCase().includes(searchPhone.toLowerCase())
          )
        : true;

      const from = fromDate ? new Date(fromDate).getTime() : null;
      const to = endDate ? new Date(endDate).getTime() : null;

      const dateMatch = property.favoriteRemoved.some((fav) => {
        const removedTime = new Date(fav.removedAt).getTime();
        const afterFrom = from ? removedTime >= from : true;
        const beforeTo = to ? removedTime <= to : true;
        return afterFrom && beforeTo;
      });

      return ownerMatch && phoneMatch && ppcIdMatch && dateMatch;
    });

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filter
  }, [searchPhone, searchOwner, fromDate,searchPpcId, endDate, favoriteRemovedData]);

  // 📄 Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
                method: 'PUT',
            });
            const data = await response.json();
            alert(data.message);

            setFavoriteRemovedData(prev =>
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

            setFavoriteRemovedData(prev =>
                prev.map(item =>
                    item.ppcId === ppcId ? { ...item, isDeleted: false } : item
                )
            );
        } catch (error) {
            alert('Failed to undo delete.');
        }
    }
};


  // Export PDF function
  const exportPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "PPC_Id",
      "PhoneNumber",
      "Owner Name",
      "Property Mode",
      "Property Type",
      "Price",
      "Area",
      "City",
      "Removed By (Phone)",
      "Removed At",
    ];

    // Format rows: join multiple removed phones and dates with newline
    const tableRows = filteredData.map((property) => [
      property.ppcId,
      property.postedUserPhoneNumber,
      property.ownerName || "N/A",
      property.propertyMode || "N/A",
      property.propertyType || "N/A",
      property.price || "N/A",
      property.area || "N/A",
      property.city || "N/A",
      property.favoriteRemoved?.map((fav) => fav.phoneNumber).join("\n") || "N/A",
      property.favoriteRemoved
        ?.map((fav) => (fav.removedAt ? moment(fav.removedAt).format("DD-MM-YYYY hh:mm A") : "N/A"))
        .join("\n") || "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [22, 160, 133] },
      theme: "grid",
    });

    doc.text("Favorite Removed Data", 14, 15);
    doc.save("FavoriteRemovedData.pdf");
  };

  // Export Excel function
  const exportExcel = () => {
    // Prepare worksheet data as array of objects
    const worksheetData = filteredData.map((property) => ({
      PPC_Id: property.ppcId,
      PhoneNumber: property.postedUserPhoneNumber,
      OwnerName: property.ownerName || "N/A",
      PropertyMode: property.propertyMode || "N/A",
      PropertyType: property.propertyType || "N/A",
      Price: property.price || "N/A",
      Area: property.area || "N/A",
      City: property.city || "N/A",
      RemovedByPhones:
        property.favoriteRemoved?.map((fav) => fav.phoneNumber).join(", ") || "N/A",
      RemovedAtDates:
        property.favoriteRemoved
          ?.map((fav) => (fav.removedAt ? moment(fav.removedAt).format("DD-MM-YYYY hh:mm A") : "N/A"))
          .join(", ") || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FavoriteRemoved");

    XLSX.writeFile(workbook, "FavoriteRemovedData.xlsx");
  };

    
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "ShortList FavoriteRemoved Table"; // current file
   
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
    <Container className="p-3">
      <h4 className="mb-4 text-primary fw-bold">Favorite Removed Data</h4>

      {/* Filters */}
      <Form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="mb-4">
        <Row className="g-3">
          <Col md={3}>
            <Form.Control
              type="text"
              placeholder="Search Owner Name"
              value={searchOwner}
              onChange={(e) => setSearchOwner(e.target.value)}
            />
          </Col>
            <Col md={3}>
            <Form.Control
              type="text"
              placeholder="Enter PPC ID"
    value={searchPpcId}
    onChange={(e) => setSearchPpcId(e.target.value)}    />
          </Col>
          <Col md={3}>
            <Form.Control
              type="text"
              placeholder="Search by Phone Number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Col>
          <Col md={3}>
          <button
  type="button"
  className="btn btn-secondary mb-3"
  onClick={() => {
    setSearchPhone('');
    setSearchOwner('');
    setSearchPpcId('');
    setFromDate('');
    setEndDate('');
  }}
>
  Reset Filters
</button>
</Col>
        </Row>
      </Form>


       {/* Export Buttons */}
      <div className="mb-3 d-flex gap-2">
        <button  className="text-white bg-success" onClick={exportExcel}>
          Download Excel
        </button>
        <button className="text-white bg-warning" onClick={exportPDF}>
          Download PDF
        </button>
                     <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status" />
        </div>
      ) : filteredData.length === 0 ? (
        <p>No favorite removed data found.</p>
      ) : (
        <div ref={tableRef}>
    <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
            <tr>
                <th>PPC_Id</th>
                <th>PhoneNumber</th>
              <th>Owner Name</th>
              <th>Property Mode</th>
              <th>Property Type</th>
              <th>Price</th>
              <th>Area</th>
              <th>City</th>
              <th>Removed By (Phone)</th>
              <th>Removed At</th>
              <th>Action</th>
              {/* <th>Views Details</th> */}
            </tr>
          </thead>
          <tbody>
        
            {currentItems.map((property, index) => (
  <tr key={index}>
    <td style={{cursor: "pointer"}}     onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
                              })
                            }>{property.ppcId}</td>
    <td>{property.postedUserPhoneNumber}</td>
    <td>{property.ownerName || "N/A"}</td>
    <td>{property.propertyMode || "N/A"}</td>
    <td>{property.propertyType || "N/A"}</td>
    <td>{property.price || "N/A"}</td>
    <td>{property.area || "N/A"}</td>
    <td>{property.city || "N/A"}</td>
    <td>
      {property.favoriteRemoved?.map((fav, idx) => (
        <div key={idx}>{fav.phoneNumber || "N/A"}</div>
      ))}
    </td>
    <td>
      {property.favoriteRemoved?.map((fav, idx) => (
        <div key={idx}>
          {fav.removedAt
            ? moment(fav.removedAt).format("DD-MM-YYYY hh:mm A")
            : "N/A"}
        </div>
      ))}
    </td>
    <td>
      {property.isDeleted ? (
        <button className="btn btn-warning" onClick={() => handleUndoDelete(property.ppcId)}>
          Undo
        </button>
      ) : (
        <button className="btn btn-danger" onClick={() => handleDelete(property.ppcId)}>
          <MdDeleteForever size={24} />
        </button>
      )}
    </td>
             

  </tr>
))}

          </tbody>
        </Table> </div>
      )}
      <div className="mt-3">
  {Array.from({ length: totalPages }, (_, i) => (
    <button
      key={i}
      onClick={() => setCurrentPage(i + 1)}
      className={`btn btn-sm me-2 ${currentPage === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
    >
      {i + 1}
    </button>
  ))}
</div>

    </Container>
  );
};

export default FavoriteRemoved;
