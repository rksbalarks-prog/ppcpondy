import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button, Table } from "react-bootstrap";
import moment from "moment/moment";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import PhoneCell from "./components/PhoneCell";

const DeletedPropertiesTable = () => {
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusProperties, setStatusProperties] = useState({});
  const [previousStatuses, setPreviousStatuses] = useState({});
  const [phoneNumberSearch, setPhoneNumberSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeletedProperties = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/properties/deleted`,
        );
        const deleted = res.data.data.filter(
          (prop) => prop.status === "delete",
        );

        setProperties(deleted);
        setFiltered(deleted);

        const statusMap = {};
        deleted.forEach((prop) => {
          statusMap[prop.ppcId] = prop.status;
        });
        setStatusProperties(statusMap);
      } catch (err) {}
    };
    fetchDeletedProperties();
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

  const handleExcelExport = () => {
    if (filtered.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare data with all columns matching the table structure
    const dataForExport = filtered.map((prop, idx) => ({
      "S.No": idx + 1,
      "PPC ID": prop.ppcId || "",
      Phone: prop.phoneNumber || "",
      City: prop.city || "",
      Status: statusProperties[prop.ppcId] || "",
      "Property Type": prop.propertyType || "",
      "Property Mode": prop.propertyMode || "",
      Price: prop.price || "",
      "Created At": prop.createdAt
        ? new Date(prop.createdAt).toLocaleDateString()
        : "",
      "Updated At": prop.updatedAt
        ? new Date(prop.updatedAt).toLocaleDateString()
        : "",
      "Deleted By": prop.deletedBy || "",
      "Bill No": prop.billNo || "",
      "Follow Up": prop.adminName || "",
      Remarks: prop.remarks || "",
      "Deleted Date": prop.deletedAt
        ? new Date(prop.deletedAt).toLocaleDateString()
        : "",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Auto-adjust column widths
    const colWidths = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Removed Properties");

    // Generate file name with current date
    const fileName = `Removed_Properties_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
  };
  const handleSearch = () => {
    let result = properties;

    if (search.trim()) {
      result = result.filter((prop) =>
        String(prop.ppcId || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    }
    if (phoneNumberSearch.trim()) {
      result = result.filter((prop) =>
        String(prop.phoneNumber || "")
          .toLowerCase()
          .includes(phoneNumberSearch.toLowerCase()),
      );
    }
    if (statusFilter) {
      result = result.filter(
        (prop) => statusProperties[prop.ppcId] === statusFilter,
      );
    }
    if (fromDate || endDate) {
      result = result.filter((prop) => {
        if (!prop.createdAt) return false;
        const created = new Date(prop.createdAt);
        const createdDate = `${created.getFullYear()}-${String(
          created.getMonth() + 1,
        ).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
        const matchStart = !fromDate || createdDate >= fromDate;
        const matchEnd = !endDate || createdDate <= endDate;
        return matchStart && matchEnd;
      });
    }

    setFiltered(result);
  };
  const handleReset = () => {
    setSearch("");
    setPhoneNumberSearch("");
    setFromDate("");
    setEndDate("");
    setFiltered(properties);
  };

  const handleDelete = async (ppcId, phoneNumber) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this property?",
    );
    if (!isConfirmed) return;

    setPreviousStatuses((prev) => ({
      ...prev,
      [ppcId]: statusProperties[ppcId],
    }));

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/delete-datas`,
        null,
        {
          params: { ppcId, phoneNumber },
        },
      );

      if (response.status === 200) {
        setStatusProperties((prev) => ({
          ...prev,
          [ppcId]: "delete",
        }));
      }
    } catch (error) {
      alert("Failed to delete property.");
    }
  };

  const handleUndo = async (ppcId) => {
    const isConfirmed = window.confirm(
      "Restore this property to Pre-Approved Property?",
    );
    if (!isConfirmed) return;

    try {
      // 1. Clear the deletion flags on the backend (isDeleted = false, etc.)
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin-undo-delete`,
        {},
        { params: { ppcId } },
      );

      // 2. Restore status to "complete" so the property appears under Pre-Approved Property
      await axios.put(
        `${process.env.REACT_APP_API_URL}/update-property-status`,
        {
          ppcId,
          status: "complete",
        },
      );

      // Remove it from the Removed Properties list
      setFiltered((prev) => prev.filter((prop) => prop.ppcId !== ppcId));
      setProperties((prev) => prev.filter((prop) => prop.ppcId !== ppcId));

      // Clean up status tracking
      setStatusProperties((prev) => {
        const updated = { ...prev };
        delete updated[ppcId];
        return updated;
      });

      setPreviousStatuses((prev) => {
        const updated = { ...prev };
        delete updated[ppcId];
        return updated;
      });

      alert("Property restored to Pre-Approved Property successfully.");
    } catch (error) {
      alert("Failed to undo delete.");
    }
  };

  const handlePermanentDelete = (ppcId, phoneNumber) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this property?",
    );
    if (!confirmDelete) return;

    const adminName = reduxAdminName || localStorage.getItem("adminName");

    if (!adminName) {
      alert("Admin name is missing. Please log in again.");
      return;
    }

    // Find the property to be deleted
    const propertyToDelete = properties.find((prop) => prop.ppcId === ppcId);

    if (!propertyToDelete) {
      alert("Property not found.");
      return;
    }

    // Add permanentDeletedBy field
    const deletedProperty = {
      ...propertyToDelete,
      permanentDeletedBy: adminName,
      deletedAt: new Date().toISOString(),
    };

    // Get existing permanently deleted properties from localStorage
    const existingDeleted = JSON.parse(
      localStorage.getItem("permanentlyDeletedProperties") || "[]",
    );

    // Add the new deleted property
    const updatedDeleted = [...existingDeleted, deletedProperty];

    // Save to localStorage
    localStorage.setItem(
      "permanentlyDeletedProperties",
      JSON.stringify(updatedDeleted),
    );

    // Remove from local state
    setFiltered((prev) => prev.filter((prop) => prop.ppcId !== ppcId));
    setProperties((prev) => prev.filter((prop) => prop.ppcId !== ppcId));

    alert("Property permanently deleted successfully.");
  };

  // Bulk permanent-delete every property currently visible (after filters).
  // Calls the backend /bulk-permanent-delete which archives each property to
  // DeletedAddModel and then removes it from AddModel in a single round-trip.
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const handleBulkPermanentDelete = async () => {
    if (!filtered || filtered.length === 0) {
      alert("No properties to delete.");
      return;
    }

    const adminName = reduxAdminName || localStorage.getItem("adminName");
    if (!adminName) {
      alert("Admin name is missing. Please log in again.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete all ${filtered.length} shown property(s)? This cannot be undone.`
    );
    if (!confirmDelete) return;

    const ppcIds = filtered.map((p) => p.ppcId).filter(Boolean);

    setBulkDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/bulk-permanent-delete`,
        { data: { ppcIds, deletedBy: adminName } }
      );

      const { deleted = [], notFound = [], failed = [] } = response.data || {};
      const deletedSet = new Set(deleted);

      // Drop successfully deleted rows from local state. Leave the rest visible.
      setFiltered((prev) => prev.filter((p) => !deletedSet.has(p.ppcId)));
      setProperties((prev) => prev.filter((p) => !deletedSet.has(p.ppcId)));

      const summary = [
        `${deleted.length} property(s) permanently deleted.`,
        notFound.length ? `${notFound.length} not found.` : "",
        failed.length ? `${failed.length} failed.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      alert(summary);
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Failed to bulk delete. Please try again."
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileName = "Removed Property"; // current file

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
    <div className="p-3">
      <form
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff",
        }}
        onSubmit={(e) => e.preventDefault()}
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <div className="mb-3">
          <label className="form-label fw-bold">PPC ID</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter PPC ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">PhoneNumber</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Phone Number"
            value={phoneNumberSearch}
            onChange={(e) => setPhoneNumberSearch(e.target.value)}
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
        <div className="mb-3">
          <label className="form-label fw-bold">Status</label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
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
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
          <Button variant="secondary" onClick={handleReset} className="ms-2">
            Reset
          </Button>
        </div>
      </form>
      <button
        className="btn mb-3"
        style={{ background: "#90EE90" }}
        onClick={handleExcelExport}
      >
        Download Excel
      </button>
      <button
        className="btn btn-secondary mb-3"
        style={{ background: "tomato", marginLeft: "10px" }}
        onClick={handlePrint}
      >
        Print
      </button>
      {/* Bulk delete button — hidden for now. Handler + backend route are
          still wired up; un-comment to bring it back. */}
      {/* <button
        className="btn btn-danger mb-3"
        style={{ marginLeft: "10px" }}
        onClick={handleBulkPermanentDelete}
        disabled={
          bulkDeleting || !filtered || filtered.length === 0
        }
        title="Permanently delete all rows currently shown (use the filters above to narrow the set)"
      >
        {bulkDeleting
          ? "Deleting..."
          : `Bulk Delete (${(filtered || []).length})`}
      </button> */}
      <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
        <h4 className="mb-0">Removed Properties</h4>
        <span
          style={{
            background: "#6c757d",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Total: {properties.length} Records
        </span>
        <span
          style={{
            background: "#007bff",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Showing: {filtered.length} Records
        </span>
      </div>
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
              <th>S.No</th>
              <th>PPC ID</th>
              <th>Phone</th>
              <th>City</th>
              <th>Status</th>
              <th>Property Type</th>
              <th>Property Mode</th>
              <th>Price</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Deleted By</th>
              <th>Bill No</th>
              <th>Follow Up</th>
              <th>Remarks</th>
              <th>Deleted Date</th>
              <th>Undo</th>
              <th>Permanent Delete</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="17" className="text-center">
                  No properties found.
                </td>
              </tr>
            ) : (
              filtered.map((prop, idx) => (
                <tr key={prop._id}>
                  <td>{idx + 1}</td>
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/dashboard/detail`, {
                        state: {
                          ppcId: prop.ppcId,
                          phoneNumber: prop.phoneNumber,
                        },
                      })
                    }
                  >
                    {prop.ppcId}
                  </td>
                  <td><PhoneCell phone={prop.phoneNumber} type="owner" ppcId={prop.ppcId} /></td>
                  <td>{prop.city}</td>
                  <td>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: "5px",
                        backgroundColor: "red",
                        color: "white",
                      }}
                    >
                      {statusProperties[prop.ppcId]}
                    </span>
                  </td>
                  <td>{prop.propertyType}</td>
                  <td>{prop.propertyMode}</td>
                  <td>{prop.price}</td>
                  <td>{new Date(prop.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(prop.updatedAt).toLocaleDateString()}</td>
                  <td>{prop.deletedBy}</td>
                  <td>{prop.billNo}</td>
                  <td>{prop.adminName}</td>
                  <td>{prop.remarks || "-"}</td>
                  <td>
                    {prop.deletedAt
                      ? new Date(prop.deletedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUndo(prop.ppcId)}
                    >
                      Undo
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handlePermanentDelete(prop.ppcId, prop.phoneNumber)
                      }
                    >
                      Permanent Delete
                    </Button>
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

export default DeletedPropertiesTable;
