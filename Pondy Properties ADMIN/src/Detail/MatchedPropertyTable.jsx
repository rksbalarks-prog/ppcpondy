import React, { useState, useEffect, useRef } from "react";
import { Table, Badge, Button, Spinner } from "react-bootstrap";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaHome,
  FaUser,
  FaCalendarAlt,
  FaTrash,
  FaUndo,
  FaInfoCircle,
  FaIdBadge,
  FaUserTag,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const MatchedDataTable = () => {
  const [matchedData, setMatchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBaId, setSearchBaId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({
    propertyId: "",
    ownerContact: "",
    buyerId: "",
    buyerName: "",
    buyerPhone: "",
    startDate: "",
    endDate: "",
  });
  const navigate = useNavigate();

  // Format price with Indian rupee symbol and commas
  const formatPrice = (price) => {
    return price ? `₹${new Intl.NumberFormat("en-IN").format(price)}` : "-";
  };

  // Format date
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString("en-IN") : "-";
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/delete-buyer-assistance/${id}`,
      );
      setMessage("Buyer Assistance request deleted successfully.");

      setMatchedData((prevData) =>
        prevData.map((item) =>
          item.buyerAssistanceCard._id === id
            ? {
                ...item,
                buyerAssistanceCard: {
                  ...item.buyerAssistanceCard,
                  isDeleted: true,
                },
              }
            : item,
        ),
      );
    } catch (error) {
      setMessage("Error deleting Buyer Assistance.");
    }
  };

  const handleUndoDelete = async (id) => {
    if (!window.confirm("Are you sure you want to restore this request?"))
      return;
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/undo-delete-buyer-assistance/${id}`,
      );
      setMessage("Buyer Assistance request restored successfully.");

      setMatchedData((prevData) =>
        prevData.map((item) =>
          item.buyerAssistanceCard._id === id
            ? {
                ...item,
                buyerAssistanceCard: {
                  ...item.buyerAssistanceCard,
                  isDeleted: false,
                },
              }
            : item,
        ),
      );
    } catch (error) {
      setMessage("Error restoring Buyer Assistance.");
    }
  };

  useEffect(() => {
    fetchMatchedData();
  }, []);

  const fetchMatchedData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/get-matched-buyers-properties`,
      );
      if (res.data.success) {
        setMatchedData(res.data.data);
        setFilteredData(res.data.data);
      }
    } catch (error) {
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
  // Case-insensitive "contains" helper for the text filters.
  const has = (val, q) =>
    q ? String(val ?? "").toLowerCase().includes(q.toLowerCase()) : true;

  const applyFilters = () => {
    return filteredData
      // Buyer-level filters — drop the whole card if the buyer doesn't match.
      .filter((item) => {
        const card = item.buyerAssistanceCard || {};
        return (
          has(card.Ba_Id, filters.buyerId) &&
          has(card.name, filters.buyerName) &&
          has(card.phoneNumber, filters.buyerPhone)
        );
      })
      // Property-level filters — keep only the matching properties.
      .map((item) => {
        const matched = item.matchedProperties.filter((property) => {
          const matchesId = has(property.propertyId, filters.propertyId);
          const matchesOwner = has(property.postedByUser, filters.ownerContact);

          const createdDate = new Date(property.createdAt);
          const startMatch = filters.startDate
            ? createdDate >= new Date(filters.startDate)
            : true;
          const endMatch = filters.endDate
            ? createdDate <= new Date(filters.endDate)
            : true;

          return matchesId && matchesOwner && startMatch && endMatch;
        });

        return { ...item, matchedProperties: matched };
      })
      .filter((item) => item.matchedProperties.length > 0);
  };

  const handleResetFilters = () => {
    setFilters({
      propertyId: "",
      ownerContact: "",
      buyerId: "",
      buyerName: "",
      buyerPhone: "",
      startDate: "",
      endDate: "",
    });
  };

  // -------------- PDF EXPORT ----------------
  const exportPDF = () => {
    const doc = new jsPDF();
    const title = "Matched Buyer Requests & Properties";

    // Prepare headers for table columns
    const headers = [
      "Property ID",
      "Posted By",
      "Contact",
      "Price",
      "Location",
      "Type",
      "Facing",
      "Bedrooms",
      "Area",
      "Posted On",
      "BA_ID",
      "BA_NAME",
      "BA PHONE",
      "BA AREA",
      "BA CITY",
      "Buyer Budget",
      "Buyer BHK",
      "Status",
    ];

    // Flatten data for export, one row per matched property with BA details
    const data = [];
    filteredData.forEach((item) => {
      item.matchedProperties.forEach((property) => {
        data.push([
          property.propertyId || "-",
          property.postedBy || "-",
          property.postedByUser || "-",
          formatPrice(property.price),
          `${property.city || "-"} / ${property.area || "-"}`,
          property.propertyType || "-",
          property.facing || "-",
          property.bedrooms || "-",
          property.totalArea
            ? `${property.totalArea} ${property.areaUnit || ""}`
            : "-",
          property.createdAt ? formatDate(property.createdAt) : "-",
          item.buyerAssistanceCard.Ba_Id || "N/A",
          item.buyerAssistanceCard.name || "N/A",
          item.buyerAssistanceCard.phoneNumber || "N/A",
          item.buyerAssistanceCard.area || "N/A",
          item.buyerAssistanceCard.city || "N/A",
          `${formatPrice(item.buyerAssistanceCard.minPrice)} - ${formatPrice(
            item.buyerAssistanceCard.maxPrice,
          )}`,
          item.buyerAssistanceCard.bedrooms || "-",
          property.isDeleted ? "Deleted" : "Active",
        ]);
      });
    });

    doc.text(title, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: 14, right: 14 },
    });

    doc.save("Matched_Buyer_Requests_Properties.pdf");
  };

  // -------------- EXCEL EXPORT ----------------
  const exportExcel = () => {
    // Prepare data array of objects for XLSX
    const dataForExcel = [];

    filteredData.forEach((item) => {
      item.matchedProperties.forEach((property) => {
        dataForExcel.push({
          "Property ID": property.propertyId || "-",
          "Posted By": property.postedBy || "-",
          Contact: property.postedByUser || "-",
          Price: property.price || "-",
          Location: `${property.city || "-"} / ${property.area || "-"}`,
          Type: property.propertyType || "-",
          Facing: property.facing || "-",
          Bedrooms: property.bedrooms || "-",
          Area: property.totalArea
            ? `${property.totalArea} ${property.areaUnit || ""}`
            : "-",
          "Posted On": property.createdAt
            ? formatDate(property.createdAt)
            : "-",
          BA_ID: item.buyerAssistanceCard.Ba_Id || "N/A",
          BA_NAME: item.buyerAssistanceCard.name || "N/A",
          "BA PHONE": item.buyerAssistanceCard.phoneNumber || "N/A",
          "BA AREA": item.buyerAssistanceCard.area || "N/A",
          "BA CITY": item.buyerAssistanceCard.city || "N/A",
          "Buyer Budget": `${formatPrice(
            item.buyerAssistanceCard.minPrice,
          )} - ${formatPrice(item.buyerAssistanceCard.maxPrice)}`,
          "Buyer BHK": item.buyerAssistanceCard.bedrooms || "-",
          Status: property.isDeleted ? "Deleted" : "Active",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matched Data");

    XLSX.writeFile(workbook, "Matched_Buyer_Requests_Properties.xlsx");
  };

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  const [allowedRoles, setAllowedRoles] = useState([]);
  const fileName = "Matched Property Table";

  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

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

  if (loading) return <Spinner animation="border" />;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-danger fw-bold mt-5">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 px-4">
      {/* Keep the header section and the table on the same left edge, and
          stop the table-header cells from wrapping unevenly. */}
      <style>{`
        .matched-table thead th {
          white-space: nowrap;
          vertical-align: middle;
        }
      `}</style>
      <h2 className="mb-3">Matched Buyer Requests & Properties</h2>
      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      <div className="mb-4 p-3 border rounded bg-light">
        <div className="d-flex gap-3 mb-3 flex-wrap">
          <input
            type="text"
            placeholder="Search PPC ID"
            value={filters.propertyId}
            onChange={(e) =>
              setFilters({ ...filters, propertyId: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 180px" }}
          />

          <input
            type="text"
            placeholder="Search Owner Contact"
            value={filters.ownerContact}
            onChange={(e) =>
              setFilters({ ...filters, ownerContact: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 180px" }}
          />

          <input
            type="text"
            placeholder="Search Buyer ID"
            value={filters.buyerId}
            onChange={(e) =>
              setFilters({ ...filters, buyerId: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 180px" }}
          />

          <input
            type="text"
            placeholder="Search Buyer Name"
            value={filters.buyerName}
            onChange={(e) =>
              setFilters({ ...filters, buyerName: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 180px" }}
          />

          <input
            type="text"
            placeholder="Search Buyer Contact"
            value={filters.buyerPhone}
            onChange={(e) =>
              setFilters({ ...filters, buyerPhone: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 180px" }}
          />

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 160px" }}
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="form-control"
            style={{ flex: "1 1 160px" }}
          />

          <button onClick={handleResetFilters} className="btn btn-secondary">
            Reset
          </button>
        </div>
      </div>
      <div className="mb-4">
        <Button variant="success" className="me-4" onClick={exportExcel}>
          <FaFileExcel className="me-2" />
          Download Excel
        </Button>

        <Button variant="danger" onClick={exportPDF}>
          <FaFilePdf className="me-2" />
          Download PDF
        </Button>
        <button
          className="btn btn-secondary"
          style={{ background: "tomato" }}
          onClick={handlePrint}
        >
          Print
        </button>
      </div>

      <h3>Get Matched Property Datas</h3>
      <div ref={tableRef}>
        <Table
          striped
          bordered
          hover
          responsive
          className="table-sm align-middle matched-table"
        >
          <thead className="sticky-top">
            <tr>
              <th>
                <FaIdBadge className="me-1" /> PPC ID
              </th>
              <th>
                <FaUser className="me-1" /> Posted By
              </th>
              <th>
                <FaPhone className="me-1" /> Owner Contact
              </th>
              <th>
                <FaMoneyBillWave className="me-1" /> Price
              </th>
              <th>
                <FaMapMarkerAlt className="me-1" /> Location
              </th>
              <th>
                <FaHome className="me-1" /> Type
              </th>
              <th>Facing</th>
              <th>Bedrooms</th>
              <th>Area</th>
              <th>
                <FaCalendarAlt className="me-1" /> Posted On
              </th>
              <th>
                <FaIdBadge className="me-1" /> Buyer ID
              </th>
              <th>
                <FaUserTag className="me-1" /> Buyer Name
              </th>
              <th>
                <FaPhone className="me-1" /> Buyer Contact
              </th>
              <th>
                <FaMapMarkerAlt className="me-1" /> BA AREA
              </th>
              <th>
                <FaMapMarkerAlt className="me-1" /> BA CITY
              </th>
              <th>
                <FaMoneyBillWave className="me-1" /> Buyer Budget
              </th>
              <th>Buyer BHK</th>
              {/* Columns commented out per request:
              <th>Status</th>
              <th>Action</th>
              <th>Views Details</th>
              */}
            </tr>
          </thead>
          <tbody>
            {applyFilters().map((item, index) =>
              item.matchedProperties.map((property, idx) => (
                <tr key={`${index}-${idx}`}>
                  <td>{property.propertyId || "-"}</td>
                  <td>{property.postedBy || "-"}</td>
                  <td>{property.postedByUser || "-"}</td>
                  <td className="text-nowrap">{formatPrice(property.price)}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaMapMarkerAlt className="text-muted me-1" />
                      {property.city || "-"} / {property.area || "-"}
                    </div>
                  </td>
                  <td>{property.propertyType || "-"}</td>
                  <td>{property.facing || "-"}</td>
                  <td>{property.bedrooms || "-"}</td>
                  <td>
                    {property.totalArea ? (
                      <span className="text-nowrap">
                        {property.totalArea} {property.areaUnit || ""}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-nowrap">
                    <FaCalendarAlt className="text-muted me-1" />
                    {formatDate(property.createdAt)}
                  </td>
                  <td>
                    <Badge bg="secondary">
                      {item.buyerAssistanceCard.Ba_Id || "N/A"}
                    </Badge>
                  </td>
                  <td>{item.buyerAssistanceCard.name || "N/A"}</td>
                  <td>
                    <a href={`tel:${item.buyerAssistanceCard.phoneNumber}`}>
                      {item.buyerAssistanceCard.phoneNumber || "N/A"}
                    </a>
                  </td>
                  <td>{item.buyerAssistanceCard.area || "N/A"}</td>
                  <td>{item.buyerAssistanceCard.city || "N/A"}</td>
                  <td className="text-nowrap">
                    {formatPrice(item.buyerAssistanceCard.minPrice)} –{" "}
                    {formatPrice(item.buyerAssistanceCard.maxPrice)}
                  </td>
                  <td>{item.buyerAssistanceCard.bedrooms || "-"}</td>
                  {/* Status / Action / Views Details columns commented out per request
                  <td>
                    {property.isDeleted ? (
                      <Badge bg="danger" className="d-flex align-items-center">
                        <FaTrash className="me-1" /> Deleted
                      </Badge>
                    ) : (
                      <Badge bg="success" className="d-flex align-items-center">
                        <FaInfoCircle className="me-1" /> Active
                      </Badge>
                    )}
                  </td>
                  <td>
                    {!item.buyerAssistanceCard.isDeleted ? (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() =>
                          handleSoftDelete(item.buyerAssistanceCard._id)
                        }
                        className="d-flex align-items-center"
                      >
                        <FaTrash className="me-1" /> Delete
                      </Button>
                    ) : (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() =>
                          handleUndoDelete(item.buyerAssistanceCard._id)
                        }
                        className="d-flex align-items-center"
                      >
                        <FaUndo className="me-1" /> Restore
                      </Button>
                    )}
                  </td>
                  <td>
                    <Button
                      variant=""
                      size="sm"
                      style={{ backgroundColor: "#0d94c1", color: "white" }}
                      onClick={() =>
                        navigate(`/dashboard/detail`, {
                          state: {
                            ppcId: property.ppcId,
                            phoneNumber: property.phoneNumber,
                          },
                        })
                      }
                    >
                      View Details
                    </Button>
                  </td>
                  */}
                </tr>
              )),
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default MatchedDataTable;
