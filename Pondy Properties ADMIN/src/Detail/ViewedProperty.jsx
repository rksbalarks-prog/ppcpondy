

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table,Button } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

const ViewedProperties = () => {
  const [viewedProperties, setViewedProperties] = useState([]);
  const [zeroViewProperties, setZeroViewProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
  const fetchData = async () => {
    try {
      const viewedResponse = await axios.get(`${process.env.REACT_APP_API_URL}/all-viewed-properties`);

      const sortedViewedProperties = viewedResponse.data.viewedProperties.sort((a, b) => {
        return new Date(b.viewedAt) - new Date(a.viewedAt);
      });

      setViewedProperties(sortedViewedProperties);
    } catch (err) {
      setError("Failed to fetch viewed properties.");
    }

    try {
      const zeroViewResponse = await axios.get(`${process.env.REACT_APP_API_URL}/zero-view-properties`);
      const sortedZeroViewProperties = zeroViewResponse.data.properties.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setZeroViewProperties(sortedZeroViewProperties);
    } catch (err) {
      setError("Failed to fetch zero-view properties.");
    }

    setLoading(false);
  };

  fetchData();
}, []);

 


  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`);
        alert(response.data.message);
        
        // Update local state immediately
        setViewedProperties(prevProperties => 
          prevProperties.map(property => 
            property.ppcId === ppcId 
              ? { ...property, isDeleted: true } 
              : property
          )
        );
        
        setZeroViewProperties(prevProperties => 
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
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-free-property/${ppcId}`);
        alert(response.data.message);
        
        // Update local state immediately
        setViewedProperties(prevProperties => 
          prevProperties.map(property => 
            property.ppcId === ppcId 
              ? { ...property, isDeleted: false } 
              : property
          )
        );
        
        setZeroViewProperties(prevProperties => 
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
  const filterData = (data) => {
    return data.filter(item => {
      const createdAt = new Date(item.createdAt).getTime();
      const from = fromDate ? new Date(fromDate).getTime() : null;
      const to = endDate ? new Date(endDate).getTime() : null;

      const matchesSearch = search ? String(item.ppcId).toLowerCase().includes(search.toLowerCase()) : true;
      const matchesStartDate = from ? createdAt >= from : true;
      const matchesEndDate = to ? createdAt <= to : true;

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  };


  
  // Export Viewed Properties to PDF
  const exportViewedPDF = () => {
    const doc = new jsPDF();

    doc.text("Viewed Properties", 14, 20);

    const tableColumn = [
      "PPC ID",
      "Price",
      "Type",
      "Mode",
      "City",
      "Area",
      "Total Area",
      "Ownership",
      "View Count",
    ];

    const tableRows = [];

    filterData(viewedProperties).forEach((property) => {
      const rowData = [
        property.ppcId,
        property.price ? `₹ ${property.price.toLocaleString("en-IN")}` : "N/A",
        property.propertyType || "N/A",
        property.propertyMode || "N/A",
        property.city || "N/A",
        property.area || "N/A",
        property.totalArea ? `${property.totalArea} ${property.areaUnit || ""}` : "N/A",
        property.ownership || "N/A",
        property.views || 0,
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("viewed-properties.pdf");
  };

  // Export Zero View Properties to PDF
  const exportZeroViewPDF = () => {
    const doc = new jsPDF();

    doc.text("Zero-View Properties", 14, 20);

    const tableColumn = [
      "PPC ID",
      "Price",
      "Type",
      "Mode",
      "City",
      "Area",
      "Total Area",
      "Ownership",
    ];

    const tableRows = [];

    zeroViewProperties.forEach((property) => {
      const rowData = [
        property.ppcId,
        property.price ? `₹ ${property.price.toLocaleString("en-IN")}` : "N/A",
        property.propertyType || "N/A",
        property.propertyMode || "N/A",
        property.city || "N/A",
        property.area || "N/A",
        property.totalArea ? `${property.totalArea} ${property.areaUnit || ""}` : "N/A",
        property.ownership || "N/A",
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [192, 57, 43] },
    });

    doc.save("zero-view-properties.pdf");
  };

  // Export both tables to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Viewed Properties Sheet
    const viewedData = filterData(viewedProperties).map((property) => ({
      "PPC ID": property.ppcId,
      Price: property.price ? `₹ ${property.price.toLocaleString("en-IN")}` : "N/A",
      Type: property.propertyType || "N/A",
      Mode: property.propertyMode || "N/A",
      City: property.city || "N/A",
      Area: property.area || "N/A",
      "Total Area": property.totalArea ? `${property.totalArea} ${property.areaUnit || ""}` : "N/A",
      Ownership: property.ownership || "N/A",
      "View Count": property.views || 0,
      Viewers: property.viewers && property.viewers.length > 0
        ? property.viewers.map(v => `${v.phoneNumber} (${new Date(v.viewedAt).toLocaleString()})`).join(", ")
        : "No Viewers",
      "Deleted?": property.isDeleted ? "Yes" : "No",
    }));

    const wsViewed = XLSX.utils.json_to_sheet(viewedData);
    XLSX.utils.book_append_sheet(wb, wsViewed, "Viewed Properties");

    // Zero View Properties Sheet
    const zeroViewData = zeroViewProperties.map((property) => ({
      "PPC ID": property.ppcId,
      Price: property.price ? `₹ ${property.price.toLocaleString("en-IN")}` : "N/A",
      Type: property.propertyType || "N/A",
      Mode: property.propertyMode || "N/A",
      City: property.city || "N/A",
      Area: property.area || "N/A",
      "Total Area": property.totalArea ? `${property.totalArea} ${property.areaUnit || ""}` : "N/A",
      Ownership: property.ownership || "N/A",
      "Deleted?": property.isDeleted ? "Yes" : "No",
    }));

    const wsZeroView = XLSX.utils.json_to_sheet(zeroViewData);
    XLSX.utils.book_append_sheet(wb, wsZeroView, "Zero-View Properties");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "properties-data.xlsx");
  };

  if (loading) return <p className="text-center fs-4">Loading properties...</p>;
  if (error) return <p className="text-danger text-center">{error}</p>;


const handleReset = () => {
  setSearch('');
  setFromDate('');
  setEndDate('');
};

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Viewed Properties</h2>
      
      <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="d-flex flex-row gap-2 align-items-center flex-nowrap">
        <input type="text" placeholder="Search PPC ID" value={search} onChange={(e) => setSearch(e.target.value)} className="form-control mb-2" />
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-control mb-2" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control mb-2" />
        <button
      type="button"
      className="btn btn-secondary"
      onClick={handleReset}
    >
      Reset
    </button>  </form>

       {/* Buttons to export */}
      <div className="mb-3 d-flex gap-2">
        <Button variant="primary" onClick={exportViewedPDF}>
          Download Viewed Properties PDF
        </Button>
        <Button variant="warning" onClick={exportZeroViewPDF}>
          Download Zero-View Properties PDF
        </Button>
        <Button variant="success" onClick={exportToExcel}>
          Download Excel (Both Tables)
        </Button>
                     <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      </div>

      <h3 className="mt-5 mb-2">Viewed Properties All Datas</h3>

<div ref={tableRef}>        <Table striped bordered hover responsive className="table-sm align-middle">
          <thead className="sticky-top">
            <tr>
              <th>PPC ID</th>
              <th>Property Owner PhoneNumber</th>
              <th>Price</th>
              <th>Type</th>
              <th>Mode</th>
              <th>City</th>
              <th>Area</th>
              <th>Total Area</th>
              <th>Ownership</th>
              <th>View Count</th>
              <th>Viewers</th>
              <th>Action</th>
              {/* <th>Views Details</th> */}
            </tr>
          </thead>
          <tbody>
            {filterData(viewedProperties).map((property) => (
              <tr key={property.ppcId}>
                <td style={{cursor: "pointer"}} onClick={() =>
                                              navigate(`/dashboard/detail`, {
                                                state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
                                              })
                                            }>{property.ppcId}</td>
                                            <td>{property.phoneNumber}</td>
                <td>₹ {property.price ? property.price.toLocaleString("en-IN") : "N/A"}</td>
                <td>{property.propertyType || "N/A"}</td>
                <td>{property.propertyMode || "N/A"}</td>
                <td>{property.city || "N/A"}</td>
                <td>{property.area || "N/A"}</td>
                <td>{property.totalArea || "N/A"} {property.areaUnit || ""}</td>
                <td>{property.ownership || "N/A"}</td>
                <td>{property.views || 0}</td>
                <td>
                  {property.viewers && property.viewers.length > 0 ? (
                    <ul>
                      {property.viewers.map((viewer, index) => (
                        <li key={index}>{viewer.phoneNumber} (Viewed at: {new Date(viewer.viewedAt).toLocaleString()})</li>
                      ))}
                    </ul>
                  ) : (
                    "No Viewers"
                  )}
                </td>
                <td>
                  {property.isDeleted ? (
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => handleUndoDelete(property.ppcId)}
                    >
                      Undo
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDelete(property.ppcId)}
                    >
                      Delete
                    </button>
                  )}
                </td>
                    

              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <h2 className="text-center mt-5 mb-4">Zero-View Properties</h2>
      <div className="table-responsive">
        <Table striped bordered hover responsive className="table-sm align-middle">
          <thead className="sticky-top">
            <tr>
              <th>PPC ID</th>
              <th>Price</th>
              <th>Type</th>
              <th>Mode</th>
              <th>City</th>
              <th>Area</th>
              <th>Total Area</th>
              <th>Ownership</th>
              <th>Action</th>
              <th>Views Details</th>
            </tr>
          </thead>
          <tbody>
            {zeroViewProperties.length > 0 ? (
              zeroViewProperties.map((property) => (
                <tr key={property.ppcId}>
                  <td>{property.ppcId}</td>
                  <td>₹ {property.price ? property.price.toLocaleString("en-IN") : "N/A"}</td>
                  <td>{property.propertyType || "N/A"}</td>
                  <td>{property.propertyMode || "N/A"}</td>
                  <td>{property.city || "N/A"}</td>
                  <td>{property.area || "N/A"}</td>
                  <td>{property.totalArea || "N/A"} {property.areaUnit || ""}</td>
                  <td>{property.ownership || "N/A"}</td>
                  <td>
                    {property.isDeleted ? (
                      <button 
                        className="btn btn-success btn-sm" 
                        onClick={() => handleUndoDelete(property.ppcId)}
                      >
                        Undo
                      </button>
                    ) : (
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(property.ppcId)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                             <td>
                                            <Button
                                              variant=""
                                              size="sm"
                                              style={{backgroundColor:"#0d94c1",color:"white"}}
                                              onClick={() =>
                                                navigate(`/dashboard/detail`, {
                                                  state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
                                                })
                                              }
                                            >
                                              View Details
                                            </Button>
                                          </td>
                  
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">No properties with zero views.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ViewedProperties;