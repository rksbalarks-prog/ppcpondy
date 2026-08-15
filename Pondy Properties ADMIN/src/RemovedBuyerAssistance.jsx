import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, Badge } from "react-bootstrap";
import { FaTrash, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";
import PhoneCell from "./components/PhoneCell";

// Lists buyer assistance requests that have been soft-deleted (isDeleted: true).
// Admins can restore (undo) a request, or permanently delete it from the DB.
// The list pattern mirrors PendingAssistant so the table reads the same.
const RemovedBuyerAssistanceList = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchBaId, setSearchBaId] = useState("");
  const [searchPhoneNumber, setSearchPhoneNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileName = "Removed Buyer Assistant"; // role-permission key

  // Sync Redux to localStorage (same pattern as PendingAssistant)
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
    if (adminName && adminRole) recordDashboardView();
  }, [adminName, adminRole]);

  // Fetch role-based permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-role-permissions`
        );
        const rolePermissions = res.data.find(
          (perm) => perm.role === adminRole
        );
        const viewed =
          rolePermissions?.viewedFiles?.map((f) => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    if (adminRole) fetchPermissions();
  }, [adminRole]);

  const fetchRemovedAssistance = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fetch-buyerAssistance-removed`
      );
      const sorted = [...(response.data.data || [])].sort(
        (a, b) =>
          new Date(b.deletedAt || b.updatedAt) -
          new Date(a.deletedAt || a.updatedAt)
      );
      setData(sorted);
      setFiltered(sorted);
    } catch (error) {
      // Network / 5xx — leave list empty; permission gate or empty state will show.
    }
  };

  useEffect(() => {
    fetchRemovedAssistance();
  }, []);

  const tableRef = useRef();
  const handlePrint = () => {
    const printContent = tableRef.current?.innerHTML || "";
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
          <h3>Removed Buyer Assistance Requests</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleFilter = () => {
    let result = data;

    if (searchBaId.trim()) {
      result = result.filter((item) =>
        String(item.ba_id || "").includes(searchBaId.trim())
      );
    }
    if (searchPhoneNumber.trim()) {
      result = result.filter((item) =>
        String(item.phoneNumber || "").includes(searchPhoneNumber.trim())
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(
        (item) => new Date(item.deletedAt || item.updatedAt) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(
        (item) => new Date(item.deletedAt || item.updatedAt) <= end
      );
    }

    setFiltered(result);
  };

  const handleReset = () => {
    setSearchBaId("");
    setSearchPhoneNumber("");
    setStartDate("");
    setEndDate("");
    setFiltered(data);
  };

  // Restore: backend flips isDeleted back to false. We then drop the row from
  // the local list since this page only shows isDeleted: true records.
  const handleUndoDelete = async (ba_id) => {
    if (!window.confirm("Restore this buyer assistance request?")) return;
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/undo-delete-buyer-assistance/${ba_id}`
      );
      const drop = (prev) => prev.filter((item) => item.ba_id !== ba_id);
      setData(drop);
      setFiltered(drop);
      alert("Buyer assistance request restored successfully.");
    } catch (error) {
      alert(
        error?.response?.data?.message || "Error restoring buyer assistance."
      );
    }
  };

  // Permanent delete: backend removes the document from MongoDB entirely.
  const handlePermanentDelete = async (item) => {
    const id = item._id || item.ba_id;
    if (!id) return;
    if (
      !window.confirm(
        `Permanently delete BA ${item.ba_id || id}? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/permanent-delete-buyer-assistance/${id}`
      );
      const drop = (prev) =>
        prev.filter((row) => (row._id || row.ba_id) !== id);
      setData(drop);
      setFiltered(drop);
      alert("Buyer assistance request permanently deleted.");
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Error permanently deleting buyer assistance."
      );
    }
  };

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
      <h3>Removed Buyer Assistance Requests</h3>

      <div
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff",
        }}
        className="row mb-3"
      >
        <div className="col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by BA ID"
            value={searchBaId}
            onChange={(e) => setSearchBaId(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            type="text"
            placeholder="Search by Phone Number"
            value={searchPhoneNumber}
            onChange={(e) => setSearchPhoneNumber(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-2 d-flex gap-2">
          <button className="btn btn-primary" onClick={handleFilter}>
            Filter
          </button>
          <button className="btn btn-danger" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      <button
        className="btn mb-3"
        style={{ background: "tomato", color: "#fff" }}
        onClick={handlePrint}
      >
        Print
      </button>
      <span className="ms-3 fw-bold">
        Showing: {filtered.length} of {data.length} removed records
      </span>

      <div ref={tableRef} style={{ overflowX: "auto" }}>
        <Table striped bordered hover className="align-middle">
          <thead className="table-secondary">
            <tr>
              <th>#</th>
              <th>BA ID</th>
              <th>Buyer Name</th>
              <th>Phone</th>
              <th>City</th>
              <th>Area</th>
              <th>Min Price</th>
              <th>Max Price</th>
              <th>Property Mode</th>
              <th>Property Type</th>
              <th>BA Status</th>
              <th>Deleted At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center text-muted">
                  No removed buyer assistance requests found.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item._id || item.ba_id || idx}>
                  <td>{idx + 1}</td>
                  <td>{item.ba_id}</td>
                  <td>{item.baName}</td>
                  <td><PhoneCell phone={item.phoneNumber} type="tenant" ba_id={item.ba_id} /></td>
                  <td>{item.city}</td>
                  <td>{item.area}</td>
                  <td>{item.minPrice}</td>
                  <td>{item.maxPrice}</td>
                  <td>{item.propertyMode}</td>
                  <td>{item.propertyType}</td>
                  <td>{item.ba_status}</td>
                  <td>
                    {item.deletedAt
                      ? new Date(item.deletedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <Badge bg="danger" className="d-inline-flex align-items-center">
                      <FaTrash className="me-1" /> Removed
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleUndoDelete(item.ba_id)}
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                        title="Restore"
                      >
                        <FaUndo className="me-1" /> Undo
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item)}
                        className="btn btn-outline-danger btn-sm d-inline-flex align-items-center"
                        title="Permanently delete"
                      >
                        <FaTrash className="me-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default RemovedBuyerAssistanceList;
