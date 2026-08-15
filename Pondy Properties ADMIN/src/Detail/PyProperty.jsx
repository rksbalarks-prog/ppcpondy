






import { useState, useEffect, useRef } from "react";
import { Container, Table, Spinner, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaRupeeSign, FaCamera, FaEye
} from "react-icons/fa";
import { MdDeleteForever, MdUndo } from "react-icons/md";
import { useSelector } from "react-redux";
import moment from "moment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const PyProperty = () => {
  const [properties, setProperties] = useState([]);
  const [imageCounts, setImageCounts] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();
  const [ppcId, setPpcId] = useState("");

  const fetchedPropertiesRef = useRef([]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-Pudhucherry-properties`);
      fetchedPropertiesRef.current = response.data.data; // store all unfiltered
      setProperties(response.data.data);                 // display all
      setError("");
    } catch (error) {
      setError("Pondy properties Not Found");
    } finally {
      setLoading(false);
    }
  };
  
  
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchImageCount = async (ppcId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/uploads-count`, {
        params: { ppcId },
      });
      return response.data.uploadedImagesCount || 0;
    } catch (error) {
      return 0;
    }
  };

  const fetchAllImageCounts = async () => {
    const counts = {};
    await Promise.all(
      properties.map(async (property) => {
        const count = await fetchImageCount(property.ppcId);
        counts[property.ppcId] = count;
      })
    );
    setImageCounts(counts);
  };

  useEffect(() => {
    if (properties.length > 0) {
      fetchAllImageCounts();
    }
  }, [properties]);


  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);
        
        // Update local state immediately
        setProperties(prevProperties => 
          prevProperties.map(property => 
            property.ppcId === ppcId 
              ? { ...property, isDeleted: true } 
              : property
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
        
        // Update local state immediately
        setProperties(prevProperties => 
          prevProperties.map(property => 
            property.ppcId === ppcId 
              ? { ...property, isDeleted: false } 
              : property
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
  const handleFilter = () => {
    const filtered = fetchedPropertiesRef.current.filter((property) => {
      const createdDate = new Date(property.createdAt).toISOString().split("T")[0];
  
      const matchDate =
        (!startDate || !endDate) || (createdDate >= startDate && createdDate <= endDate);
  
      const matchPpcId =
        !ppcId || property.ppcId?.toString().includes(ppcId);
  
      return matchDate && matchPpcId;
    });
  
    setProperties(filtered);
  };
  
  
  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setProperties(fetchedPropertiesRef.current);
  };
  

  const handleDownloadPDF = () => {
  const doc = new jsPDF();

  const tableColumn = [
    "PPC ID",
    "Type",
    "Mode",
    "City",
    "Area",
    "Date",
    "Price",
    "Photos",
    "Views",
  ];

  const tableRows = properties.map((property) => [
    property.ppcId || "N/A",
    property.propertyType || "N/A",
    property.propertyMode || "N/A",
    property.city || "N/A",
    `${property.totalArea || "N/A"} ${property.areaUnit || ""}`,
    property.createdAt
      ? new Date(property.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A",
    property.price ? property.price.toLocaleString("en-IN") : "N/A",
    imageCounts[property.ppcId] || 0,
    property.views || 0,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.text("Puducherry Properties", 14, 15);
  doc.save("puducherry-properties.pdf");
};

const handleDownloadExcel = () => {
  // Prepare data for Excel
  const dataForExcel = properties.map((property) => ({
    "PPC ID": property.ppcId || "N/A",
    Type: property.propertyType || "N/A",
    Mode: property.propertyMode || "N/A",
    City: property.city || "N/A",
    Area: `${property.totalArea || "N/A"} ${property.areaUnit || ""}`,
    Date: property.createdAt
      ? new Date(property.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A",
    Price: property.price ? property.price.toLocaleString("en-IN") : "N/A",
    Photos: imageCounts[property.ppcId] || 0,
    Views: property.views || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Properties");

  const wbout = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, "puducherry-properties.xlsx");
};


  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "Py Property"; // current file
   
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
    <Container fluid className="py-4">
      <h2 className="mb-3 text-center">Puducherry Properties</h2>

      {/* Filter Form */}
      <div   style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="card p-3 mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">PPCId</label>
            <input
          type="text"
          placeholder="Enter PPC ID"
          value={ppcId}
          onChange={(e) => setPpcId(e.target.value)}
        />
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button className="btn btn-primary w-100" onClick={handleFilter}>Filter</button>
            <button className="btn btn-outline-secondary w-100" onClick={handleReset}>Reset</button>
          </div>
          
        </div>
      </div>

      <div className="mb-3 d-flex gap-2 justify-content-end">
  <button className="btn btn-success" onClick={handleDownloadPDF}>
    Download PDF
  </button>
  <button className="btn btn-info text-white" onClick={handleDownloadExcel}>
    Download Excel
  </button>
               <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
</div>


      {error && <p className="text-danger text-center">{error}</p>}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
      <div ref={tableRef}>
              <Table bordered hover responsive className="table-sm align-middle">
              <thead className=" sticky-top">
              <tr>
                <th>ppcId</th>
                <th>Type</th>
                <th>Mode</th>
                <th>City</th>
                <th>Area</th>
                <th>Date</th>
                <th>Price</th>
                <th>Photos</th>
                <th>Views</th>
                {/* <th>View Details</th> */}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property._id} style={{ cursor: "pointer" }}>
                  <td style={{cursor: "pointer"}}  onClick={() =>
                        navigate(`/dashboard/detail`, {
                          state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
                        })
                      }>{property.ppcId || 'N/A'}</td>
                  <td>{property.propertyType || 'N/A'}</td>
                  <td>{property.propertyMode || 'N/A'}</td>
                  <td>{property.city || 'N/A'}</td>
                  <td>{property.totalArea || 'N/A'} {property.areaUnit || ''}</td>
                  <td>
                    {property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'N/A'}
                  </td>
                  <td>
                    <span className="text-success fw-bold">
                      <FaRupeeSign className="me-1" />
                      {property.price ? property.price.toLocaleString('en-IN') : 'N/A'}
                    </span>
                    <div style={{ fontSize: '11px', color: '#888' }}>Negotiable</div>
                  </td>
                  <td className="text-center">
                    <FaCamera className="me-1" />
                    {imageCounts[property.ppcId] || 0}
                  </td>
                  <td className="text-center">
                    <FaEye className="me-1" />
                    {property.views || 0}
                  </td>
              
                
<td>
          {property.isDeleted ? (
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleUndoDelete(property.ppcId)}
              title="Undo Delete"
            >
              <MdUndo size={24} />
            </button>
          ) : (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(property.ppcId)}
              title="Delete"
            >
              <MdDeleteForever size={24} />
            </button>
          )}
        </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
      )}
    </Container>
  );
};

export default PyProperty;
