import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa"; // Import delete icon from react-icons
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import PhoneCell from "./components/PhoneCell";

const DeletedProperties = () => {
  const [filters, setFilters] = useState({
    ppcId: "",
    phoneNumber: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const [deletedProperties, setDeletedProperties] = useState([]);
  const [lastDeletedId, setLastDeletedId] = useState(null);

  const fetchDeletedProperties = () => {
    try {
      // Get permanently deleted properties from localStorage
      const storedDeleted = JSON.parse(
        localStorage.getItem("permanentlyDeletedProperties") || "[]",
      );

      const sorted = storedDeleted.sort((a, b) => {
        return new Date(b.deletedAt) - new Date(a.deletedAt); // New to old
      });

      setDeletedProperties(sorted);

      // Highlight the most recently deleted property
      if (sorted.length > 0) {
        setLastDeletedId(sorted[0].ppcId);
        setTimeout(() => setLastDeletedId(null), 5000);
      }
    } catch (error) {
      console.error("Failed to fetch deleted properties:", error);
    }
  };

  // Listen for storage changes (when Permanent Delete is clicked on RemovedCar page)
  useEffect(() => {
    fetchDeletedProperties();

    // Listen to localStorage changes
    const handleStorageChange = () => {
      fetchDeletedProperties();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const navigate = useNavigate();
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

  const handleExcelExport = () => {
    if (filteredProperties.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare data with all columns matching the table structure
    const dataForExport = filteredProperties.map((property) => ({
      "PPC ID": property.ppcId || "",
      "Phone Number": property.phoneNumber || "",
      "Property Mode": property.propertyMode || "",
      "Property Type": property.propertyType || "",
      Price: property.price ? `₹ ${property.price}` : "",
      Status: property.status || "",
      "Deleted At": property.deletedAt
        ? new Date(property.deletedAt).toLocaleString()
        : "",
      "DeletedBy AdminName": property.permanentDeletedBy || "",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Auto-adjust column widths
    const colWidths = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deleted Properties");

    // Generate file name with current date
    const fileName = `Deleted_Properties_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
  };
  const filteredProperties = deletedProperties.filter((property) => {
    const { ppcId, phoneNumber, status, startDate, endDate } = filters;

    const matchPpcId =
      !ppcId || property.ppcId.toLowerCase().includes(ppcId.toLowerCase());
    const matchPhone =
      !phoneNumber || String(property.phoneNumber || "").includes(phoneNumber);
    const matchStatus = !status || property.status === status;

    const deletedAt = property.deletedAt ? new Date(property.deletedAt) : null;
    const matchStart =
      !startDate || (deletedAt && deletedAt >= new Date(startDate));
    const matchEnd = !endDate || (deletedAt && deletedAt <= new Date(endDate));

    return matchPpcId && matchPhone && matchStatus && matchStart && matchEnd;
  });

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileName = "Delete Properties"; // current file

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
      } catch (err) {}
    };

    if (adminName && adminRole) {
      recordDashboardView();
    }
  }, [adminName, adminRole]);

  // Fetch role-based permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-role-permissions`,
        );
        const rolePermissions = res.data.find(
          (perm) => perm.role === adminRole,
        );
        const viewed = rolePermissions?.viewedFiles?.map((f) => f.trim()) || [];
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
    <div className="container mt-4">
      {lastDeletedId && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          <strong>Success!</strong> Property has been permanently deleted and is
          now displayed below (highlighted in yellow).
          <button
            type="button"
            className="btn-close"
            onClick={() => setLastDeletedId(null)}
          ></button>
        </div>
      )}

      <h4>Permanently Deleted Properties</h4>
      <div
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff",
        }}
        className="row mb-3"
      >
        <div className="col">
          <input
            type="text"
            name="ppcId"
            placeholder="Search PPC ID"
            className="form-control"
            value={filters.ppcId}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col">
          <input
            type="text"
            name="phoneNumber"
            placeholder="Search Phone Number"
            className="form-control"
            value={filters.phoneNumber}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col">
          <select value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="incomplete">Incomplete</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="complete">Complete</option>
            <option value="sendInterest">Send Interest</option>
            <option value="soldOut">Sold Out</option>
            <option value="reportProperties">Report Properties</option>
            <option value="needHelp">Need Help</option>
            <option value="contact">Contact</option>
            <option value="favorite">Favorite</option>
            <option value="alreadySaved">Already Saved</option>
            <option value="favoriteRemoved">Favorite Removed</option>
            <option value="delete">Delete</option>
            <option value="undo">Undo</option>
          </select>
        </div>
        <div className="col">
          <input
            type="date"
            name="startDate"
            className="form-control"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col">
          <input
            type="date"
            name="endDate"
            className="form-control"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col-auto d-flex align-items-end">
          <button
            className="btn btn-secondary"
            onClick={() =>
              setFilters({
                ppcId: "",
                phoneNumber: "",
                status: "",
                startDate: "",
                endDate: "",
              })
            }
          >
            Reset
          </button>
        </div>
      </div>
      <button
        className="btn mb-3 mt-1"
        style={{ background: "#90EE90" }}
        onClick={handleExcelExport}
      >
        Download Excel
      </button>
      <button
        className="btn btn-secondary mb-3 mt-1"
        style={{ background: "tomato", marginLeft: "10px" }}
        onClick={handlePrint}
      >
        Print
      </button>
      {filteredProperties.length === 0 ? (
        <p>No deleted properties found.</p>
      ) : (
        <div ref={tableRef}>
          <Table
            striped
            bordered
            hover
            responsive
            className="table-sm align-middle"
          >
            <thead className="sticky-top">
              <tr>
                <th>PPC ID</th>
                <th>Phone Number</th>
                <th>Property Mode</th>
                <th>Property Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Deleted At</th>
                <th>DeletedBy AdminName </th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr
                  key={property.ppcId}
                  style={
                    lastDeletedId === property.ppcId
                      ? {
                          backgroundColor: "#fff3cd",
                          borderLeft: "4px solid #ffc107",
                        }
                      : {}
                  }
                >
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/dashboard/detail`, {
                        state: {
                          ppcId: property.ppcId,
                          phoneNumber: property.phoneNumber,
                        },
                      })
                    }
                  >
                    {property.ppcId}
                  </td>
                  <td><PhoneCell phone={property.phoneNumber} type="owner" ppcId={property.ppcId} /></td>
                  <td>{property.propertyMode}</td>
                  <td>{property.propertyType}</td>
                  <td>₹ {property.price}</td>
                  <td>{property.status || "N/A"}</td>
                  <td>
                    {property.deletedAt
                      ? new Date(property.deletedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>{property.permanentDeletedBy}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DeletedProperties;
