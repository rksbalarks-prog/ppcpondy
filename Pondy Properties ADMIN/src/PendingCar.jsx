import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table, Form, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PhoneCell from "./components/PhoneCell";

const PendingProperties = () => {
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ppcIdSearch, setPpcIdSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [previousStatuses, setPreviousStatuses] = useState({});
  const [showFollowUpButton, setShowFollowUpButton] = useState(false); // 🌟 NEW STATE
  const [statusProperties, setStatusProperties] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPpcId, setCurrentPpcId] = useState("");
  const [currentDbId, setCurrentDbId] = useState("");
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [phoneNumberSearch, setPhoneNumberSearch] = useState("");
  // follow-up filter: "yes" for created, "no" for not created
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [bulkUploadFilter, setBulkUploadFilter] = useState("");

  const [followUpMap, setFollowUpMap] = useState({});

  const fetchFollowUps = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/followup-list`,
      );
      const map = {};

      res.data.data.forEach((f) => {
        if (!map[f.ppcId]) {
          map[f.ppcId] = {
            adminName: f.adminName,
            createdAt: f.createdAt,
          };
        }
      });

      setFollowUpMap(map);
    } catch (err) {}
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  // Handle creating bill or follow-up with confirmation
  const handleCreateAction = (actionType, ppcId, phoneNumber) => {
    const confirmMessage = `Do you want to create ${actionType}?`;

    const isConfirmed = window.confirm(confirmMessage);

    if (isConfirmed) {
      const currentDate = new Date().toLocaleDateString(); // Store current date

      // Update the specific property with the current date for the action
      setProperties((prevProperties) =>
        prevProperties.map((prop) =>
          prop.ppcId === ppcId && prop.phoneNumber === phoneNumber
            ? {
                ...prop,
                [`create${actionType}Date`]: currentDate, // Dynamically set date field
              }
            : prop,
        ),
      );

      // Navigate to the respective page (Follow-up or Bill creation)
      if (actionType === "FollowUp") {
        navigate("/dashboard/create-followup", {
          state: { ppcId: ppcId, phoneNumber: phoneNumber },
        });
      } else if (actionType === "Bill") {
        navigate("/dashboard/create-bill", {
          state: { ppcId: ppcId, phoneNumber: phoneNumber },
        });
      }
    }
  };

  // Open Create Follow-up / Create Bill in BULK mode for every bulk-uploaded
  // property currently shown (after the active filters / search).
  const handleBulkFollowup = () => {
    const bulkRows = (filtered || []).filter((p) => p.bulkUploadId);
    if (bulkRows.length === 0) {
      alert("No bulk-uploaded properties in the current view.");
      return;
    }
    navigate("/dashboard/create-followup", {
      state: {
        bulkMode: true,
        bulkCount: bulkRows.length,
        items: bulkRows.map((p) => ({ ppcId: p.ppcId, phoneNumber: p.phoneNumber })),
      },
    });
  };

  const handleBulkBill = () => {
    const bulkRows = (filtered || []).filter((p) => p.bulkUploadId);
    if (bulkRows.length === 0) {
      alert("No bulk-uploaded properties in the current view.");
      return;
    }
    navigate("/dashboard/create-bill", {
      state: {
        bulkMode: true,
        bulkCount: bulkRows.length,
        items: bulkRows.map((p) => ({ ppcId: p.ppcId, phoneNumber: p.phoneNumber })),
      },
    });
  };

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");

  useEffect(() => {
    const fetchPendingProperties = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/properties/pending`,
        );

        const sortedUsers = res.data.users.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt), // New to old
        );

        setProperties(sortedUsers);
        setFiltered(sortedUsers);
      } catch (err) {}
    };
    fetchPendingProperties();
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

  /**
   * Exports filtered properties data to Excel file.
   * Only exports the filtered results shown on the page, not all data.
   */
  const handleExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((prop, idx) => ({
        "S.No": idx + 1,
        "PPC ID": prop.ppcId,
        "Phone Number": prop.phoneNumber,
        "Property Type": prop.propertyType,
        "Property Mode": prop.propertyMode,
        Price: prop.price,
        City: prop.city,
        "Created At": moment(prop.createdAt).format("YYYY-MM-DD"),
        Status: prop.status,
        Views: prop.views,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Properties");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `Pending_Properties_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // Handle filtering
  const handleSearch = () => {
    let result = [...properties]; // create a copy to avoid mutating original

    // ✅ Filter by PPC ID (safe and case-insensitive)
    if (ppcIdSearch.trim()) {
      const query = ppcIdSearch.trim().toLowerCase();
      result = result.filter((prop) => {
        const ppc = String(prop.ppcId || "").toLowerCase();
        return ppc.includes(query);
      });
    }
    if (phoneNumberSearch.trim()) {
      const query = phoneNumberSearch.trim().toLowerCase();
      result = result.filter((prop) => {
        const phone = String(prop.phoneNumber || "").toLowerCase();
        return phone.includes(query);
      });
    }

    // ✅ Filter by Date Range
    result = result.filter((prop) => {
      const createdDate = new Date(prop.createdAt).toISOString().split("T")[0];

      const matchStart = !startDate || createdDate >= startDate;
      const matchEnd = !endDate || createdDate <= endDate;

      return matchStart && matchEnd;
    });

    // ✅ Filter by Follow-up existence if requested
    if (followUpFilter === "yes") {
      result = result.filter((prop) => !!followUpMap[prop.ppcId]);
    } else if (followUpFilter === "no") {
      result = result.filter((prop) => !followUpMap[prop.ppcId]);
    }

    // Bulk upload filter
    if (bulkUploadFilter === "yes") {
      result = result.filter((prop) => !!prop.bulkUploadId);
    } else if (bulkUploadFilter === "no") {
      result = result.filter((prop) => !prop.bulkUploadId);
    }

    setFiltered(result);
  };

  useEffect(() => {
    handleSearch();
  }, [
    properties,
    ppcIdSearch,
    startDate,
    endDate,
    phoneNumberSearch,
    followUpFilter,
    bulkUploadFilter,
    followUpMap,
  ]);

  const handleReset = () => {
    setPhoneNumberSearch("");
    setFollowUpFilter("");
    setBulkUploadFilter("");

    // Reset form fields
    setPpcIdSearch("");
    setStartDate("");
    setEndDate("");

    // Reset filtered results to the original properties
    setFiltered(properties);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Force delete: properties with no PPC-ID can still be removed by
      // falling back to the Mongo _id so the backend can locate the record.
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin-delete`,
        { deletionReason },
        { params: { ppcId: currentPpcId, id: currentDbId } },
      );

      // Update local state — match by _id when available, else by ppcId.
      setProperties((prev) =>
        prev.map((prop) =>
          (currentDbId && prop._id === currentDbId) ||
          (currentPpcId && prop.ppcId === currentPpcId)
            ? {
                ...prop,
                isDeleted: true,
                deletionReason: deletionReason.trim(),
                deletionDate: new Date().toISOString(),
              }
            : prop,
        ),
      );

      setStatusProperties((prev) => ({
        ...prev,
        [currentPpcId || currentDbId]: "delete",
      }));
      setShowDeleteModal(false);
      setDeletionReason("");
      // handleSearch(); // Refresh filtered results
    } catch (error) {
      alert(error.response?.data?.message || "Error deleting property");
    }
  };

  // Undo delete functionality
  const handleUndo = async (ppcId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin-undo-delete`,
        {},
        { params: { ppcId } },
      );

      // Update local state
      setProperties((prev) =>
        prev.map((prop) =>
          prop.ppcId === ppcId
            ? {
                ...prop,
                isDeleted: false,
                deletionReason: null,
                deletionDate: null,
              }
            : prop,
        ),
      );

      setStatusProperties((prev) => ({ ...prev, [ppcId]: "active" }));
      // handleSearch(); // Refresh filtered results
    } catch (error) {
      alert(error.response?.data?.message || "Error undoing delete");
    }
  };

  // Delete functionality
  const handleDeleteClick = (ppcId, phoneNumber, dbId) => {
    setCurrentPpcId(ppcId);
    setCurrentDbId(dbId || "");
    setCurrentPhoneNumber(phoneNumber);
    setShowDeleteModal(true);
  };

  // Bulk soft-delete every property currently visible (after filters).
  // Matches the per-row delete: sets isDeleted + status='delete' so the
  // properties move to the Removed Property bucket. Prompts once for a
  // shared deletion reason (the backend requires one).
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const handleBulkDelete = async () => {
    if (!filtered || filtered.length === 0) {
      alert("No properties to delete.");
      return;
    }

    const reason = window.prompt(
      `Enter a deletion reason for all ${filtered.length} shown property(s):`,
      ""
    );
    if (reason === null) return; // user cancelled
    if (!reason.trim()) {
      alert("Deletion reason is required.");
      return;
    }

    const confirmDelete = window.confirm(
      `Move all ${filtered.length} shown property(s) to Removed Properties? This can be undone from the Removed page.`
    );
    if (!confirmDelete) return;

    const ppcIds = filtered.map((p) => p.ppcId).filter(Boolean);

    setBulkDeleting(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/admin-bulk-delete`,
        { ppcIds, deletionReason: reason.trim() }
      );

      const { deleted = [], notFound = [] } = response.data || {};
      const deletedSet = new Set(deleted);

      // Drop deleted rows from the visible list and mark their status locally
      // so any cached references in this page reflect the new state.
      setFiltered((prev) => prev.filter((p) => !deletedSet.has(p.ppcId)));
      setProperties((prev) =>
        prev.map((p) =>
          deletedSet.has(p.ppcId)
            ? {
                ...p,
                isDeleted: true,
                deletionReason: reason.trim(),
                deletionDate: new Date().toISOString(),
              }
            : p
        )
      );
      setStatusProperties((prev) => {
        const next = { ...prev };
        deletedSet.forEach((id) => {
          next[id] = "delete";
        });
        return next;
      });

      const summary = [
        `${deleted.length} moved to Removed Properties.`,
        notFound.length ? `${notFound.length} not found.` : "",
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

  const handlePermanentDelete = async (ppcId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this record?",
    );
    if (!confirmDelete) return;

    const adminName = reduxAdminName || localStorage.getItem("adminName");

    if (!adminName) {
      alert("Admin name is missing. Please log in again.");
      return;
    }

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/delete-ppcId-data`,
        {
          params: { ppcId },
          data: {
            deletedBy: adminName,
          },
        },
      );

      if (response.status === 200) {
        alert("User permanently deleted successfully!");

        setProperties((prev) =>
          prev.filter((property) => property.ppcId !== ppcId),
        );

        const updatedStatus = { ...statusProperties };
        delete updatedStatus[ppcId];
        setStatusProperties(updatedStatus);
        localStorage.setItem("statusProperties", JSON.stringify(updatedStatus));
      } else {
        alert(response.data.message || "Failed to delete user.");
      }
    } catch (error) {
      alert("An error occurred while deleting.");
      console.error(error);
    }
  };

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileName = "Pending Property"; // current file

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
      <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
        <h4 className="mb-0">Pending Properties</h4>
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

      <form
        onSubmit={(e) => e.preventDefault()}
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <input
          type="text"
          id="searchInput"
          className="form-control"
          placeholder="Enter PPC ID"
          value={ppcIdSearch}
          onChange={(e) => setPpcIdSearch(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <input
          type="text"
          className="form-control"
          placeholder="Search by Phone Number"
          value={phoneNumberSearch}
          onChange={(e) => setPhoneNumberSearch(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <input
          type="date"
          id="fromDate"
          className="form-control"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <input
          type="date"
          id="endDate"
          className="form-control"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <select
          className="form-select"
          value={followUpFilter}
          onChange={(e) => setFollowUpFilter(e.target.value)}
          style={{ maxWidth: "150px" }}
        >
          <option value="">FollowUp All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>

        <select
          className="form-select"
          value={bulkUploadFilter}
          onChange={(e) => setBulkUploadFilter(e.target.value)}
          style={{ maxWidth: "150px" }}
        >
          <option value="">All Bulk Upload</option>
          <option value="yes">Bulk Upload: Yes</option>
          <option value="no">Bulk Upload: No</option>
        </select>

        <div className="col-md-3 d-flex align-items-end">
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
          <Button
            variant="secondary"
            onClick={handleReset}
            style={{ marginLeft: "10px" }}
          >
            Reset
          </Button>
        </div>
      </form>
      <button
        className="btn btn-secondary mb-3"
        style={{ background: "tomato" }}
        onClick={handlePrint}
      >
        Print
      </button>
      {/* Excel Export Button - Exports filtered properties data to Excel file */}
      <button
        className="btn btn-secondary mb-3 ms-2"
        style={{ background: "#90ee90" }}
        onClick={handleExcel}
      >
        Excel
      </button>
      <button
        className="btn mb-3 ms-2"
        style={{ background: "#f0ad4e", color: "#fff", fontWeight: "bold" }}
        onClick={handleBulkFollowup}
      >
        Bulk Followup ({(filtered || []).filter((p) => p.bulkUploadId).length})
      </button>
      <button
        className="btn mb-3 ms-2"
        style={{ background: "#2f747f", color: "#fff", fontWeight: "bold" }}
        onClick={handleBulkBill}
      >
        Bulk Bill ({(filtered || []).filter((p) => p.bulkUploadId).length})
      </button>
      {/* <button
        className="btn btn-danger mb-3 ms-2"
        onClick={handleBulkDelete}
        disabled={bulkDeleting || !filtered || filtered.length === 0}
        title="Move all rows currently shown to Removed Properties (use the filters above to narrow the set)"
      >
        {bulkDeleting
          ? "Deleting..."
          : `Bulk Delete (${(filtered || []).length})`}
      </button> */}
      {/* {showFollowUpButton && ( */}
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
              <th>Image</th>
              <th className="sticky-col sticky-col-1">PPC ID</th>
              <th>Views</th>
              <th className="sticky-col sticky-col-2">PhoneNumber</th>
              <th>Property Type</th>
              <th>Property Mode</th>
              <th>Price</th>
              <th>City</th>
              <th>Bulk Upload</th>
              <th>Created At</th>
              <th>Status</th>
              {/* <th>Deletion Reason</th>
              <th>Deleted At</th> */}
              {/* Plan Information Columns - Plan Name, Type, Creation, Expiry, Remaining Days */}
              {/* <th>Plan Name</th>
      <th>Plan Type</th>
      <th>Plan Created</th>
      <th>Plan Expiry</th>
      <th>Remaining Days</th> */}
              {/* Payment Information Columns - PayU Status, Payment ID, Transaction ID */}
              {/* <th>PayU Status</th>
      <th>Payment ID</th>
      <th>Transaction ID</th> */}
              <th>Action</th>
              <th>Create FollowUp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center">
                  No properties found.
                </td>
              </tr>
            ) : (
              filtered.map((prop, idx) => (
                <tr
                  key={prop._id}
                  className={prop.isDeleted ? "table-danger" : ""}
                >
                  <td>{idx + 1}</td>
                  <td>
                    <img
                      src={
                        prop.photos && prop.photos.length > 0
                          ? `https://ppcpondy.com/PPC/${prop.photos[0]}`
                          : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
                      }
                      alt="Property"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                  </td>
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate("/dashboard/detail", {
                        state: {
                          ppcId: prop.ppcId,
                          phoneNumber: prop.phoneNumber,
                        },
                      })
                    }
                    className="sticky-col sticky-col-1"
                  >
                    {prop.ppcId}
                  </td>
                  <td>
                    <FaEye /> {prop.views}
                  </td>
                  <td className="sticky-col sticky-col-2">
                    <PhoneCell phone={prop.phoneNumber} type="owner" ppcId={prop.ppcId} />
                  </td>
                  <td>{prop.propertyType}</td>
                  <td>{prop.propertyMode}</td>
                  <td>{prop.price}</td>
                  <td>{prop.city}</td>
                  <td>{prop.bulkUploadId ? 'Yes' : 'No'}</td>
                  <td>{new Date(prop.createdAt).toLocaleDateString()}</td>
                  <td>{prop.status}</td>
                  {/* <td>{prop.deletionReason || "-"}</td>
                  <td>
                    {prop.deletionDate
                      ? new Date(prop.deletionDate).toLocaleString()
                      : "-"}
                  </td> */}
                  {/* Plan Information - Plan Name, Package Type, Created At, Expiry Date, Remaining Days */}
                  {/* <td>{prop.planName}</td>
          <td>{prop.packageType}</td>
          <td>{prop.planCreatedAt}</td>
          <td>{prop.planExpiryDate}</td>
          <td>{prop.remainingDays}</td> */}
                  {/* Payment Information - PayU Status, Payment ID, Transaction ID */}
                  {/* <td>{prop.payUStatus}</td>
          <td>{prop.paymentId}</td>
          <td>{prop.transactionId}</td> */}
                  <td>
                    {prop.isDeleted ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUndo(prop.ppcId)}
                          className="me-2"
                        >
                          Undo
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handlePermanentDelete(prop.ppcId)}
                        >
                          <MdDeleteForever /> Permanent
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() =>
                            navigate("/dashboard/edit-property", {
                              state: {
                                ppcId: prop.ppcId,
                                phoneNumber: prop.phoneNumber,
                              },
                            })
                          }
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick(
                              prop.ppcId,
                              prop.phoneNumber,
                              prop._id,
                            )
                          }
                        >
                          <MdDeleteForever />
                        </Button>
                        {/* <Button
                          className="mt-1"
                          variant="warning"
                          size="sm"
                          onClick={() => handlePermanentDelete(prop.ppcId)}
                        >
                          <MdDeleteForever /> Permenent
                        </Button> */}
                      </>
                    )}
                  </td>

                  <td>
                    {followUpMap[prop.ppcId] ? (
                      <div className="text-success">
                        <div>
                          <strong>{followUpMap[prop.ppcId].adminName}</strong>
                        </div>
                        <div>
                          <small>
                            {new Date(
                              followUpMap[prop.ppcId].createdAt,
                            ).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          handleCreateAction(
                            "FollowUp",
                            prop.ppcId,
                            prop.phoneNumber,
                          )
                        }
                      >
                        Create Follow-up
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete property{" "}
            {currentPpcId || "(no PPC-ID)"}?
          </p>
          <Form.Group controlId="deletionReason">
            <Form.Label>Deletion Reason (required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder="Enter reason for deletion"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={!deletionReason.trim()}
          >
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PendingProperties;
