import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table, Form, Button, Modal } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
// excel utilities
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PhoneCell from "./components/PhoneCell";

const PreApprovedCar = () => {
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ppcIdSearch, setPpcIdSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusProperties, setStatusProperties] = useState({});
  const [previousStatuses, setPreviousStatuses] = useState({});
  const [showFollowUpButton, setShowFollowUpButton] = useState(false); // 🌟 NEW STATE
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPpcId, setCurrentPpcId] = useState("");
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [phoneNumberSearch, setPhoneNumberSearch] = useState("");
  const [otpStatusFilter, setOtpStatusFilter] = useState(""); // "verified", "non-verified", or '' for all
  const [featureStatusFilter, setFeatureStatusFilter] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState(""); // "yes" or "no" for follow-up existence
  const [bulkUploadFilter, setBulkUploadFilter] = useState(""); // "yes" or "no" for bulk-upload origin

  const [billMap, setBillMap] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  const handleStatusChange = async (ppcId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "pending" : "active";

    const hasFollowUp = followUpMap[ppcId];
    const hasBill = billMap[ppcId];

    if (!hasFollowUp || !hasBill) {
      const proceed = window.confirm(
        `⚠️ Either Follow-Up or Bill is not created for PPC ID ${ppcId}.\n\nDo you still want to change the status to "${newStatus.toUpperCase()}"?`,
      );

      if (!proceed) return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/update-property-status`,
        {
          ppcId,
          status: newStatus,
        },
      );

      setStatusProperties((prev) => ({
        ...prev,
        [ppcId]: newStatus,
      }));
    } catch (error) {
      alert("Failed to update status.");
      console.error(error);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/bills`);
      const map = {};

      res.data.data.forEach((bill) => {
        if (!map[bill.ppId]) {
          map[bill.ppId] = {
            adminName: bill.adminName,
            billNo: bill.billNo,
            createdAt: bill.createdAt || bill.createdDate,
          };
        }
      });

      setBillMap(map);
    } catch (error) {}
  };

  useEffect(() => {
    fetchBills();
  }, []);

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

  // Refresh follow-ups and bills when a property is newly moved to Pre-Approved
  useEffect(() => {
    const clearedPpcIds = location.state?.clearedPpcIds;
    if (clearedPpcIds && clearedPpcIds.length > 0) {
      console.log(
        "Property moved to Pre-Approved. Refreshing follow-up and bill data:",
        clearedPpcIds,
      );
      fetchFollowUps();
      fetchBills();
    }
  }, [location.state?.clearedPpcIds]);

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

  useEffect(() => {
    const initialStatus = {};
    filtered.forEach((p) => {
      initialStatus[p.ppcId] = p.status; // assuming each property has `.status`
    });
    setStatusProperties(initialStatus);
  }, [filtered]);

  const statusColorMap = {
    active: "#28a745", // Green
    pending: "#ffc107", // Yellow
    complete: "#6610f2", // Teal
  };

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");

  useEffect(() => {
    const fetchPreApprovedProperties = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/properties/pre-approved-all`,
        );

        const sortedUsers = res.data.users.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt), // New to old
        );

        setProperties(sortedUsers);
        setFiltered(sortedUsers);
      } catch (err) {}
    };
    fetchPreApprovedProperties();
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

  // Excel export handler: exports whatever is currently shown (filtered array). If no filters, filtered === properties.
  const handleExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((prop, idx) => ({
        "S.No": idx + 1,
        "PPC ID": prop.ppcId,
        Views: prop.views,
        "Phone Number": prop.phoneNumber,
        "Otp Status": prop.otpStatus,
        "Verified User": prop.isVerifiedUser ? "True" : "False",
        "Property Type": prop.propertyType,
        "Property Mode": prop.propertyMode,
        Price: prop.price,
        City: prop.city,
        "Created By": prop.createdBy,
        "Created At": prop.createdAt
          ? moment(prop.createdAt).format("YYYY-MM-DD")
          : "",
        "Updated At": prop.updatedAt
          ? moment(prop.updatedAt).format("YYYY-MM-DD")
          : "",
        "No. Of Ads": prop.adsCount,
        Mandatory: prop.required,
        "Set PPCID Status": prop.setPpcId ? "True" : "False",
        "Assigned Date": prop.setPpcIdAssignedAt
          ? moment(prop.setPpcIdAssignedAt).format("YYYY-MM-DD")
          : "",
        "Assigned Phone": prop.assignedPhoneNumber || "",
        "Plan Name": prop.planName,
        "Plan Type": prop.packageType,
        "Plan Created": prop.planCreatedAt
          ? moment(prop.planCreatedAt).format("YYYY-MM-DD")
          : "",
        "Plan Expiry": prop.planExpiryDate,
        "PayU Status": prop.paymentData?.payustatususer,
        "Transaction ID": prop.paymentData?.txnid,
        "Plan Amount": prop.paymentData?.amount,
        "Plan CreatedBy": prop.paymentData?.firstname,
        Email: prop.paymentData?.email,
        "payU Date": prop.paymentData?.payUdate,
        "Deletion Reason": prop.deletionReason || "",
        "Deleted At": prop.deletionDate
          ? moment(prop.deletionDate).format("YYYY-MM-DD HH:mm")
          : "",
        "Feature Status": prop.featureStatus,
        Status: prop.status,
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
    let result = [...properties];

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
    // OTP status filter
    if (otpStatusFilter === "verified") {
      result = result.filter(
        (prop) => String(prop.otpStatus || "").toLowerCase() === "verified",
      );
    } else if (otpStatusFilter === "non-verified") {
      result = result.filter(
        (prop) => String(prop.otpStatus || "").toLowerCase() !== "verified",
      );
    }
    // Follow-up status filter
    if (followUpFilter === "yes") {
      result = result.filter((prop) => !!followUpMap[prop.ppcId]);
    } else if (followUpFilter === "no") {
      result = result.filter((prop) => !followUpMap[prop.ppcId]);
    }
    if (featureStatusFilter) {
      result = result.filter((prop) => prop.status === featureStatusFilter);
    }
    result = result.filter((prop) => {
      const createdDate = new Date(prop.createdAt).toISOString().split("T")[0];
      const matchStart = !startDate || createdDate >= startDate;
      const matchEnd = !endDate || createdDate <= endDate;
      return matchStart && matchEnd;
    });

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
    featureStatusFilter,
    otpStatusFilter,
    followUpFilter,
    bulkUploadFilter,
  ]);

  const handleReset = () => {
    setPhoneNumberSearch("");
    setOtpStatusFilter("");
    setFollowUpFilter("");
    setPpcIdSearch("");
    setStartDate("");
    setEndDate("");
    setFeatureStatusFilter("");
    setBulkUploadFilter("");
    setFiltered(properties);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin-delete`,
        { deletionReason },
        { params: { ppcId: currentPpcId } },
      );

      // Remove the property from this page so it shows up under Removed Property
      setProperties((prev) =>
        prev.filter((prop) => prop.ppcId !== currentPpcId),
      );
      setFiltered((prev) =>
        prev.filter((prop) => prop.ppcId !== currentPpcId),
      );

      setStatusProperties((prev) => {
        const next = { ...prev };
        delete next[currentPpcId];
        return next;
      });
      setShowDeleteModal(false);
      setDeletionReason("");
      alert("Property moved to Removed Property successfully.");
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
  const handleDeleteClick = (ppcId, phoneNumber) => {
    setCurrentPpcId(ppcId);
    setCurrentPhoneNumber(phoneNumber);
    setShowDeleteModal(true);
  };

  const handleFeatureStatusChange = async (ppcId, currentStatus) => {
    const newStatus = currentStatus === "yes" ? "no" : "yes"; // Toggle status
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/update-feature-status`,
        {
          ppcId,
          featureStatus: newStatus,
        },
      );

      setProperties((prevProperties) =>
        prevProperties.map((property) =>
          property.ppcId === ppcId
            ? { ...property, featureStatus: newStatus }
            : property,
        ),
      );
    } catch (error) {}
  };

  const handleCreateBill = (type, ppcId) => {
    if (type === "Bill" && ppcId) {
      navigate(`/dashboard/edit-bill/${ppcId}`);
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

  const fileName = "PreApproved Property"; // current file

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
      <h4>Pending Properties</h4>
      <form
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          className="form-control"
          placeholder="PPC ID"
          value={ppcIdSearch}
          onChange={(e) => setPpcIdSearch(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <input
          type="text"
          className="form-control"
          placeholder="Phone Number"
          value={phoneNumberSearch}
          onChange={(e) => setPhoneNumberSearch(e.target.value)}
        />

        <select
          className="form-select"
          value={otpStatusFilter}
          onChange={(e) => setOtpStatusFilter(e.target.value)}
          style={{ maxWidth: "150px" }}
        >
          <option value="">OTP All</option>
          <option value="verified">Verified</option>
          <option value="non-verified">Non-Verified</option>
        </select>

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

        <select
          className="form-select"
          value={featureStatusFilter}
          onChange={(e) => setFeatureStatusFilter(e.target.value)}
          style={{ maxWidth: "150px" }}
        >
          <option value="">All Status</option>
          <option value="complete">Complete</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
        </select>

        <input
          type="date"
          className="form-control"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <input
          type="date"
          className="form-control"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ maxWidth: "150px" }}
        />

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleSearch}
        >
          Search
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
        >
          Reset
        </button>
      </form>
      <button
        className="btn btn-secondary mb-3"
        style={{ background: "tomato" }}
        onClick={handlePrint}
      >
        Print
      </button>
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
      <div className="d-flex align-items-center gap-3 mt-3 mb-4 flex-wrap">
        <h3 className="text-success mb-0">
          Pre Approved Properties All Datas
        </h3>
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
              <th>Image</th>
              <th className="sticky-col sticky-col-1">PPC ID</th>
              <th>Views</th>
              <th className="sticky-col sticky-col-2">PhoneNumber</th>
              <th>Otp Status</th>
              <th>Direct Verified User</th>
              <th>Property Type</th>
              <th>Property Mode</th>
              <th>Price</th>
              <th>City</th>
              <th>CreatedBy</th>
              <th>Added By</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>No.Of.Ads</th>
              <th>Mandatory</th>
              <th>Bulk Upload</th>
              <th>Property Edit</th>
              <th>Delete</th>
              <th>Feature Status</th>
              <th>Status</th>
              {/* <th>Action</th> */}

              {/* <th>Change Status</th> */}
              <th>Create FollowUp</th>
              <th>Create Bill</th>
              <th>Edit Bill</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="21" className="text-center">
                  No properties found.
                </td>
              </tr>
            ) : (
              filtered.map((prop, idx) => (
                <tr key={prop._id}>
                  <td>{idx + 1}</td>
                  <td>
                    <img
                      src={
                        prop.photos?.[0]
                          ? `https://ppcpondy.com/PPC/${prop.photos[0].replace(/\\/g, "/")}`
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
                    className="sticky-col sticky-col-1"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate("/dashboard/detail", {
                        state: {
                          ppcId: prop.ppcId,
                          phoneNumber: prop.phoneNumber,
                        },
                      })
                    }
                  >
                    {prop.ppcId}
                  </td>
                  <td>
                    <FaEye /> {prop.views}
                  </td>
                  <td
                    className={`sticky-col sticky-col-2 ${
                      prop.otpStatus !== "verified" || !prop.isVerifiedUser
                        ? "text-danger"
                        : ""
                    }`}
                  >
                    <PhoneCell phone={prop.phoneNumber} type="owner" ppcId={prop.ppcId} />
                  </td>
                  <td>{prop.otpStatus}</td>
                  <td>{prop.isVerifiedUser ? "True" : "False"}</td>
                  <td>{prop.propertyType}</td>
                  <td>{prop.propertyMode}</td>
                  <td>{prop.price}</td>
                  <td>{prop.city || "-"}</td>
                  <td>{prop.createdBy}</td>
                  <td>{prop.addedBy || "-"}</td>
                  <td>
                    {prop.createdAt
                      ? new Date(prop.createdAt).toLocaleDateString()
                      : new Date(prop.planCreatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    {prop.updatedAt
                      ? new Date(prop.updatedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{prop.adsCount}</td>
                  <td>{prop.required}</td>
                  <td>{prop.bulkUploadId ? 'Yes' : 'No'}</td>

                  {/* Property Edit Column */}
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      title="Property Edit"
                      onClick={() =>
                        navigate("/dashboard/edit-property", {
                          state: {
                            ppcId: prop.ppcId,
                            phoneNumber: prop.phoneNumber,
                          },
                        })
                      }
                    >
                      <FaEdit /> Property Edit
                    </Button>
                  </td>

                  {/* Delete Column - moves property to Removed Property */}
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      title="Delete (move to Removed Property)"
                      onClick={() =>
                        handleDeleteClick(prop.ppcId, prop.phoneNumber)
                      }
                    >
                      <MdDeleteForever /> Delete
                    </Button>
                  </td>

                  {/* Feature Status    */}
                  <td>
                    <Button
                      variant={
                        prop.featureStatus === "yes" ? "danger" : "success"
                      }
                      size="sm"
                      onClick={() =>
                        handleFeatureStatusChange(
                          prop.ppcId,
                          prop.featureStatus,
                        )
                      }
                    >
                      {prop.featureStatus === "yes"
                        ? "Set to No"
                        : "Set to Yes"}
                    </Button>
                  </td>

                  {/* Status badge with optional deletion info */}
                  <td>
                    {statusProperties[prop.ppcId] === "delete" ? (
                      <div>
                        <span
                          style={{
                            padding: "5px 10px",
                            borderRadius: "5px",
                            backgroundColor: statusColorMap["delete"],
                            color: "white",
                            display: "inline-block",
                            marginBottom: "5px",
                          }}
                        >
                          {statusProperties[prop.ppcId]}
                        </span>
                        <div style={{ fontSize: "0.8rem", color: "#666" }}>
                          <strong>Reason:</strong> {prop.deletionReason || "-"}
                          <br />
                          <strong>Date:</strong>{" "}
                          {prop.deletionDate
                            ? new Date(prop.deletionDate).toLocaleString()
                            : "-"}
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: "5px",
                          backgroundColor:
                            statusColorMap[statusProperties[prop.ppcId]] ||
                            "#343a40",
                          color: "white",
                        }}
                      >
                        {statusProperties[prop.ppcId]}
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  {/* <td>
                    {statusProperties[prop.ppcId] === "delete" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUndo(prop.ppcId)}
                      >
                        Undo
                      </Button>
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
                            handleDeleteClick(prop.ppcId, prop.phoneNumber)
                          }
                        >
                          <MdDeleteForever />
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          className="mt-2"
                          onClick={() => handlePermanentDelete(prop.ppcId)}
                        >
                          <MdDeleteForever /> Permanent
                        </Button>
                      </>
                    )}
                  </td> */}

                  {/* Status Toggle Button */}
                  {/* <td>
                    <Button
                      variant=""
                      size="sm"
                      style={{
                        backgroundColor: "#6c757d", // Bootstrap gray
                        color: "#fff",
                        border: "none",
                      }}
                      onClick={() =>
                        handleStatusChange(
                          prop.ppcId,
                          statusProperties[prop.ppcId] || "pending",
                        )
                      }
                    >
                      {statusProperties[prop.ppcId] === "active"
                        ? "Set Pending"
                        : "Set Active"}
                    </Button>
                  </td> */}

                  {/* Follow-up Column */}
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

                  {/* Bill Column */}
                  <td>
                    {followUpMap[prop.ppcId] && !billMap[prop.ppcId] ? (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() =>
                          handleCreateAction(
                            "Bill",
                            prop.ppcId,
                            prop.phoneNumber,
                          )
                        }
                      >
                        Create Bill
                      </button>
                    ) : billMap[prop.ppcId] ? (
                      <div className="text-success">
                        <div>
                          <strong>{billMap[prop.ppcId].adminName}</strong>
                        </div>
                        <div>
                          <small>Bill #: {billMap[prop.ppcId].billNo}</small>
                        </div>
                        <div>
                          <small>
                            {billMap[prop.ppcId].createdAt
                              ? new Date(
                                  billMap[prop.ppcId].createdAt,
                                ).toLocaleDateString()
                              : "Date N/A"}
                          </small>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">Follow-up Required</span>
                    )}
                  </td>
                  {/* Edit Bill Column */}
                  <td>
                    {billMap[prop.ppcId] ? (
                      <button
                        className="text-primary"
                        onClick={() => handleCreateBill("Bill", prop.ppcId)}
                      >
                        Edit Bill
                      </button>
                    ) : (
                      <span className="text-muted">Create Bill is needed</span>
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
          <p>Are you sure you want to delete property {currentPpcId}?</p>
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

export default PreApprovedCar;
