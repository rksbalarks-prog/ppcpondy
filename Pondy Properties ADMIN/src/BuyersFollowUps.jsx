

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaPrint } from 'react-icons/fa';
import { Table } from 'react-bootstrap';
import PhoneCell from "./components/PhoneCell";

const FollowUpBuyerGetTable = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const printRef = useRef();
  const [allData, setAllData] = useState([]); // store unfiltered data for future use

  // Logged-in admin — used to auto-fill the Admin Name on the create modal so
  // the user doesn't have to re-pick themselves every time. Falls back to
  // localStorage in case Redux hasn't hydrated (e.g. fresh page load).
  const reduxAdminName = useSelector((state) => state.admin?.name);
  const loggedInAdminName =
    reduxAdminName || localStorage.getItem('adminName') || '';

  // Create follow-up state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    ba_id: 'N/A',
    phoneNumber: '',
    followupStatus: '',
    followupType: '',
    followupDate: '',
    adminName: '',
    remarks: '',
  });

  // Edit follow-up state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    followupStatus: '',
    followupType: '',
    followupDate: '',
    remarks: '',
  });

  // Admin names dropdown state
  const predefinedAdminNames = [
    "Bala",
    "Madhan",
    "Prabavathi",
    "ThilagavatiMayavan",
    "Arund",
    "Gayathri",
    "Nandhishwari",
  ];
  const [showCreateAdminDropdown, setShowCreateAdminDropdown] = useState(false);
  const [selectedAdminNames, setSelectedAdminNames] = useState([]);
  const [customAdminName, setCustomAdminName] = useState("");
  const [showEditAdminDropdown, setShowEditAdminDropdown] = useState(false);
  const [selectedEditAdminNames, setSelectedEditAdminNames] = useState([]);
  const [customEditAdminName, setCustomEditAdminName] = useState("");

  // Fetch all followups
  const fetchAllFollowUps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list-buyer`);
      setFollowups(res.data.data);
      setAllData(res.data.data);
    } catch (error) {
      console.error('Error fetching all follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch followups based on dateFilter (today/past)
  const fetchFilteredFollowUps = async (filterType) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list-today-past-buyer?dateFilter=${filterType}`);
      setFollowups(res.data.data);
    } catch (error) {
      console.error(`Error fetching ${filterType} follow-up data:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllFollowUps();
  }, []);

  // Date range filter
  const handleDateFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = allData.filter((item) => {
      const followUpDate = new Date(item.followupDate);
      return followUpDate >= start && followUpDate <= end;
    });
    setFollowups(filtered);
  };

  // Future follow-up filter
  const handleFutureFollowUps = () => {
    const today = new Date();
    const filtered = allData.filter((item) => {
      const followUpDate = new Date(item.followupDate);
      return followUpDate > today;
    });
    setFollowups(filtered);
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Handle checkbox change for create modal
  const handleCreateAdminNameChange = (name) => {
    setSelectedAdminNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    setShowCreateAdminDropdown(false);
  };

  // Handle checkbox change for edit modal
  const handleEditAdminNameChange = (name) => {
    setSelectedEditAdminNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    setShowEditAdminDropdown(false);
  };

  // Get final admin names for create
  const getFinalCreateAdminNames = () => {
    return selectedAdminNames.join(", ");
  };

  // Get final admin names for edit
  const getFinalEditAdminNames = () => {
    return selectedEditAdminNames.join(", ");
  };

  // Handle adding custom admin name for create
  const handleAddCustomCreateAdminName = () => {
    if (customAdminName.trim()) {
      setSelectedAdminNames([...selectedAdminNames, customAdminName.trim()]);
      setCustomAdminName("");
      setShowCreateAdminDropdown(false);
    }
  };

  // Handle adding custom admin name for edit
  const handleAddCustomEditAdminName = () => {
    if (customEditAdminName.trim()) {
      setSelectedEditAdminNames([
        ...selectedEditAdminNames,
        customEditAdminName.trim(),
      ]);
      setCustomEditAdminName("");
      setShowEditAdminDropdown(false);
    }
  };

  // Handle edit form input change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle open edit modal
  const handleEdit = (followUp) => {
    setEditingFollowUp(followUp);
    // Convert stored UTC date to local YYYY-MM-DDTHH:mm for datetime-local input
    let dt = '';
    if (followUp.followupDate) {
      const d = new Date(followUp.followupDate);
      const pad = (n) => String(n).padStart(2, "0");
      dt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    setEditFormData({
      followupStatus: followUp.followupStatus || '',
      followupType: followUp.followupType || '',
      followupDate: dt,
      remarks: followUp.remarks || '',
    });

    // Parse existing admin names
    if (followUp.adminName && followUp.adminName.trim()) {
      const adminNames = followUp.adminName
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      setSelectedEditAdminNames(adminNames);
    } else {
      setSelectedEditAdminNames([]);
    }
    setCustomEditAdminName("");
    setShowEditModal(true);
  };

  // Handle save edited follow-up
  const handleSaveEdit = async () => {
    if (!editingFollowUp?._id) {
      alert("Error: Follow-up ID not found");
      return;
    }

    if (
      !editFormData.followupStatus ||
      !editFormData.followupType ||
      !editFormData.followupDate
    ) {
      alert("⚠️ Please fill all required fields (Status, Type, Date)");
      return;
    }

    const finalAdminName = getFinalEditAdminNames();
    const dataToSend = { ...editFormData, adminName: finalAdminName };

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/followup-update-buyer/${editingFollowUp._id}`,
        dataToSend
      );

      if (response.status === 200) {
        alert("✅ Follow-up updated successfully!");
        handleCloseEditModal();
        fetchAllFollowUps();
      }
    } catch (error) {
      alert(
        "❌ Failed to update follow-up!\n" +
          (error.response?.data?.message || error.message)
      );
      console.error("Error updating follow-up:", error);
    }
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingFollowUp(null);
    setEditFormData({
      followupStatus: '',
      followupType: '',
      followupDate: '',
      remarks: '',
    });
    setSelectedEditAdminNames([]);
    setCustomEditAdminName("");
    setShowEditAdminDropdown(false);
  };

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Current local datetime in YYYY-MM-DDTHH:mm format for datetime-local min
  const getNowDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Determine follow-up day status (Today / Past / Future)
  const getFollowUpDayStatus = (followupDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUpDay = new Date(followupDate);
    followUpDay.setHours(0, 0, 0, 0);

    if (followUpDay.getTime() === today.getTime()) return "Today";
    if (followUpDay < today) return "Past";
    return "Future";
  };

  // Get badge color based on day status
  const getDayStatusBadgeColor = (status) => {
    switch (status) {
      case "Today":
        return { backgroundColor: "#ffc107", color: "#000", fontWeight: "600" };
      case "Past":
        return { backgroundColor: "#dc3545", color: "#fff", fontWeight: "600" };
      case "Future":
        return { backgroundColor: "#28a745", color: "#fff", fontWeight: "600" };
      default:
        return { backgroundColor: "#6c757d", color: "#fff", fontWeight: "600" };
    }
  };

  // Handle create form input change
  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle create follow-up
  const handleCreateFollowUp = async () => {
    // Validate required fields
    if (
      !createFormData.ba_id ||
      !createFormData.phoneNumber ||
      !createFormData.followupStatus ||
      !createFormData.followupType ||
      !createFormData.followupDate
    ) {
      alert(
        "⚠️ Please fill all required fields (BA ID, Phone Number, Status, Type, Date)"
      );
      return;
    }

    // The user picks the date; we append the current local time (HH:mm:ss)
    // at submit so the recorded `followupDate` is the chosen day combined
    // with the actual save moment — strict record of time.
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const combinedFollowupDate = `${createFormData.followupDate}T${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    // Strict record: the admin name on the saved follow-up is whoever is
    // logged in right now — never something the user could pick.
    const dataToSend = {
      ...createFormData,
      followupDate: combinedFollowupDate,
      adminName: loggedInAdminName,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/followup-create-buyer`,
        dataToSend
      );

      if (response.status === 201) {
        alert("✅ Follow-up created successfully!");
        setShowCreateModal(false);
        setCreateFormData({
          ba_id: 'N/A',
          phoneNumber: '',
          followupStatus: '',
          followupType: '',
          followupDate: '',
          adminName: '',
          remarks: '',
        });
        setSelectedAdminNames([]);
        setCustomAdminName("");

        // Refresh the list
        fetchAllFollowUps();
      }
    } catch (error) {
      alert(
        "❌ Failed to create follow-up!\n" +
          (error.response?.data?.message || error.message)
      );
      console.error("Error creating follow-up:", error);
    }
  };

  // Handle close create modal
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      ba_id: 'N/A',
      phoneNumber: '',
      followupStatus: '',
      followupType: '',
      followupDate: '',
      adminName: '',
      remarks: '',
    });
    setSelectedAdminNames([]);
    setCustomAdminName("");
    setShowCreateAdminDropdown(false);
  };

  // Open create modal — auto-fill the Admin Name with the logged-in admin
  // and the Follow-up Date with today (user can change to schedule future).
  // The time portion is captured at submit, not here, so it always reflects
  // the actual save moment.
  const handleOpenCreateModal = () => {
    setCreateFormData({
      ba_id: 'N/A',
      phoneNumber: '',
      followupStatus: '',
      followupType: '',
      followupDate: getTodayDateString(),
      adminName: '',
      remarks: '',
    });
    setSelectedAdminNames(loggedInAdminName ? [loggedInAdminName] : []);
    setCustomAdminName("");
    setShowCreateAdminDropdown(false);
    setShowCreateModal(true);
  };

  return (
    <div className="p-4">
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div
        className="mb-3"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="text-xl font-bold">Buyer Follow-Up List</h2>

        <button
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
        >
          + Create New Buyer Follow-Up
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="mb-3 space-x-2">
        <button className="btn btn-secondary ms-2" onClick={fetchAllFollowUps}>All Follow-Up</button>
        <button className="btn btn-success ms-2" onClick={() => fetchFilteredFollowUps('today')}>Today Follow-Up</button>
        <button className="btn btn-warning ms-2" onClick={() => fetchFilteredFollowUps('past')}>Past Follow-Up</button>
        <button className="btn btn-info ms-2" onClick={handleFutureFollowUps}>Future Follow-Up</button>
      </div>

      {/* Date Range Filter */}
      <div style={{
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        backgroundColor: '#fff'
      }} className="d-flex flex-row gap-2 align-items-center flex-nowrap mb-3">
        <label className="mr-2">Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="form-control mr-2"
        />
        <label className="mr-2">End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="form-control mr-2"
        />
        <button onClick={handleDateFilter} className="btn btn-primary">Filter</button>
      </div>

      {/* Actions */}
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={handlePrint}>
          <FaPrint /> Print All
        </button>
        <button className="btn btn-info" onClick={fetchAllFollowUps}>
          Refresh
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p>Loading...</p>
      ) : followups.length === 0 ? (
        <p>No follow-up records found.</p>
      ) : (
        <div ref={printRef}>
          <h3 className='mt-5 mb-3'>Buyer Follow-Up Data</h3>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">
              <tr className="bg-gray-100 text-center">
                <th>S.No</th>
                <th>BA ID</th>
                <th>Phone Number</th>
                <th>Follow-Up Status</th>
                <th>Follow-Up Type</th>
                <th>Follow-Up Date &amp; Time</th>
                <th>Follow-up Day</th>
                <th>Admin Name</th>
                <th>Remark</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {followups
                .filter(
                  (item) =>
                    item.followupStatus !== "Not Interested-Closed" &&
                    item.followupStatus !== "Paid Closed"
                )
                .map((item, index) => (
                  <tr key={item._id} className="text-center">
                    <td>{index + 1}</td>
                    <td>{item.ba_id}</td>
                    <td><PhoneCell phone={item.phoneNumber} display={item.phoneNumber || '-'} type="tenant" ba_id={item.ba_id} /></td>
                    <td>{item.followupStatus}</td>
                    <td>{item.followupType}</td>
                    <td>{new Date(item.followupDate).toLocaleString()}</td>
                    <td>
                      <span
                        style={{
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          ...getDayStatusBadgeColor(
                            getFollowUpDayStatus(item.followupDate)
                          ),
                        }}
                      >
                        {getFollowUpDayStatus(item.followupDate)}
                      </span>
                    </td>
                    <td>{item.adminName}</td>
                    <td style={{ textAlign: "left", maxWidth: "220px", whiteSpace: "pre-wrap" }}>{item.remarks || "-"}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(item)}
                        style={{ marginRight: "5px" }}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>

          {/* Today / Future / Past Section Tables */}
          {[
            { label: "Today", color: "#ffc107", textColor: "#000" },
            { label: "Future", color: "#28a745", textColor: "#fff" },
            { label: "Past", color: "#dc3545", textColor: "#fff" },
          ].map((section) => {
            const rows = followups.filter(
              (item) =>
                item.followupStatus !== "Not Interested-Closed" &&
                item.followupStatus !== "Paid Closed" &&
                getFollowUpDayStatus(item.followupDate) === section.label
            );
            if (rows.length === 0) return null;
            return (
              <div key={section.label} style={{ marginTop: "40px" }}>
                <h3
                  className="mt-5 mb-3"
                  style={{
                    color: section.color,
                    borderBottom: `2px solid ${section.color}`,
                    paddingBottom: "10px",
                  }}
                >
                  {section.label} Follow-Up
                </h3>
                <Table
                  striped
                  bordered
                  hover
                  responsive
                  className="table-sm align-middle"
                >
                  <thead className="sticky-top">
                    <tr
                      style={{
                        backgroundColor: section.color,
                        color: section.textColor,
                      }}
                    >
                      <th>S.No</th>
                      <th>BA ID</th>
                      <th>Phone Number</th>
                      <th>Follow-Up Status</th>
                      <th>Follow-Up Type</th>
                      <th>Follow-Up Date &amp; Time</th>
                      <th>Follow-up Day</th>
                      <th>Admin Name</th>
                      <th>Remark</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, index) => (
                      <tr key={item._id} className="text-center">
                        <td>{index + 1}</td>
                        <td>{item.ba_id}</td>
                        <td><PhoneCell phone={item.phoneNumber} display={item.phoneNumber || '-'} type="tenant" ba_id={item.ba_id} /></td>
                        <td>{item.followupStatus}</td>
                        <td>{item.followupType}</td>
                        <td>{new Date(item.followupDate).toLocaleString()}</td>
                        <td>
                          <span
                            style={{
                              padding: "5px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              ...getDayStatusBadgeColor(section.label),
                            }}
                          >
                            {section.label}
                          </span>
                        </td>
                        <td>{item.adminName}</td>
                        <td style={{ textAlign: "left", maxWidth: "220px", whiteSpace: "pre-wrap" }}>{item.remarks || "-"}</td>
                        <td>{new Date(item.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEdit(item)}
                            style={{ marginRight: "5px" }}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            );
          })}

          {/* Closed Follow-Ups Table - Not Interested-Closed & Paid Closed */}
          {followups.filter(
            (item) =>
              item.followupStatus === "Not Interested-Closed" ||
              item.followupStatus === "Paid Closed"
          ).length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h3
                className="mt-5 mb-3"
                style={{
                  color: "#dc3545",
                  borderBottom: "2px solid #dc3545",
                  paddingBottom: "10px",
                }}
              >
                ✓ Closed Follow-Ups (Not Interested-Closed / Paid Closed)
              </h3>
              <Table
                striped
                bordered
                hover
                responsive
                className="table-sm align-middle"
              >
                <thead className="sticky-top">
                  <tr style={{ backgroundColor: "#f8d7da", color: "#721c24" }}>
                    <th>S.No</th>
                    <th>BA ID</th>
                    <th>Phone Number</th>
                    <th>Follow-Up Status</th>
                    <th>Follow-Up Type</th>
                    <th>Follow-Up Date &amp; Time</th>
                    <th>Follow-up Day</th>
                    <th>Admin Name</th>
                    <th>Remark</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followups
                    .filter(
                      (item) =>
                        item.followupStatus === "Not Interested-Closed" ||
                        item.followupStatus === "Paid Closed"
                    )
                    .map((item, index) => (
                      <tr
                        key={item._id}
                        className="text-center"
                        style={{ backgroundColor: "#fff5f5" }}
                      >
                        <td>{index + 1}</td>
                        <td>{item.ba_id}</td>
                        <td><PhoneCell phone={item.phoneNumber} display={item.phoneNumber || '-'} type="tenant" ba_id={item.ba_id} /></td>
                        <td>
                          <span
                            style={{
                              padding: "5px 12px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor:
                                item.followupStatus === "Paid Closed"
                                  ? "#28a745"
                                  : "#dc3545",
                              color: "white",
                            }}
                          >
                            {item.followupStatus}
                          </span>
                        </td>
                        <td>{item.followupType}</td>
                        <td>{new Date(item.followupDate).toLocaleString()}</td>
                        <td>
                          <span
                            style={{
                              padding: "5px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              ...getDayStatusBadgeColor(
                                getFollowUpDayStatus(item.followupDate)
                              ),
                            }}
                          >
                            {getFollowUpDayStatus(item.followupDate)}
                          </span>
                        </td>
                        <td>{item.adminName}</td>
                        <td style={{ textAlign: "left", maxWidth: "220px", whiteSpace: "pre-wrap" }}>{item.remarks || "-"}</td>
                        <td>{new Date(item.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEdit(item)}
                            style={{ marginRight: "5px" }}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Edit Buyer Follow-Up Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            overflow: "auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
              width: "100%",
              maxWidth: "550px",
              margin: "auto",
              position: "relative",
              zIndex: 10000,
              animation: "slideDown 0.3s ease",
            }}
          >
            <button
              onClick={handleCloseEditModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                color: "#666",
                padding: "0",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#000")}
              onMouseLeave={(e) => (e.target.style.color = "#666")}
              title="Close"
            >
              ×
            </button>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                color: "#333",
                fontSize: "1.5rem",
                borderBottom: "2px solid #007bff",
                paddingBottom: "10px",
              }}
            >
              Edit Buyer Follow-Up
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                BA ID:
              </label>
              <input
                type="text"
                value={editingFollowUp?.ba_id || ""}
                disabled
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Phone Number:
              </label>
              <input
                type="text"
                value={editingFollowUp?.phoneNumber || ""}
                disabled
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Follow-up Status: <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                name="followupStatus"
                value={editFormData.followupStatus}
                onChange={handleEditFormChange}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">Select Status</option>
                <option value="Ring">Ring</option>
                <option value="Ready To Pay">Ready To Pay</option>
                <option value="Not Decided">Not Decided</option>
                <option value="Not Interested-Closed">
                  Not Interested-Closed
                </option>
                <option value="Paid Closed">Paid Closed</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Follow-up Type: <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                name="followupType"
                value={editFormData.followupType}
                onChange={handleEditFormChange}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">Select Type</option>
                <option value="Payment Followup">Payment Followup</option>
                <option value="Data Followup">Data Followup</option>
                <option value="Enquiry Followup">Enquiry Followup</option>
                <option value="Payment Closed">Payment Closed</option>
              </select>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Follow-up Date: <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="followupDate"
                value={editFormData.followupDate}
                onChange={handleEditFormChange}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Remark:
              </label>
              <textarea
                name="remarks"
                placeholder="Enter remark (optional)"
                value={editFormData.remarks}
                onChange={handleEditFormChange}
                rows={3}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Admin Name:
              </label>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() =>
                    setShowEditAdminDropdown(!showEditAdminDropdown)
                  }
                  style={{
                    padding: "10px",
                    width: "100%",
                    border: "2px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {selectedEditAdminNames.length > 0
                      ? `${selectedEditAdminNames.length} selected`
                      : "Select Admin Names"}
                  </span>
                  <span style={{ fontSize: "12px" }}>▼</span>
                </button>
                {showEditAdminDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#fff",
                      border: "2px solid #007bff",
                      borderRadius: "4px",
                      marginTop: "5px",
                      zIndex: 1000,
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      maxHeight: "250px",
                      overflowY: "auto",
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowEditAdminDropdown(false)}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        backgroundColor: "transparent",
                        border: "none",
                        fontSize: "20px",
                        cursor: "pointer",
                        color: "#666",
                        padding: "0",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1001,
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#000")}
                      onMouseLeave={(e) => (e.target.style.color = "#666")}
                    >
                      ×
                    </button>
                    <div style={{ padding: "10px", paddingTop: "30px" }}>
                      {predefinedAdminNames.map((name) => (
                        <div
                          key={name}
                          style={{
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            id={`edit_admin_${name}`}
                            checked={selectedEditAdminNames.includes(name)}
                            onChange={() => handleEditAdminNameChange(name)}
                            style={{
                              marginRight: "8px",
                              cursor: "pointer",
                              width: "16px",
                              height: "16px",
                            }}
                          />
                          <label
                            htmlFor={`edit_admin_${name}`}
                            style={{ cursor: "pointer", marginBottom: 0 }}
                          >
                            {name}
                          </label>
                        </div>
                      ))}
                      <div
                        style={{
                          borderTop: "1px solid #ddd",
                          marginTop: "10px",
                          paddingTop: "10px",
                        }}
                      >
                        <label
                          style={{
                            fontWeight: "bold",
                            display: "block",
                            marginBottom: "5px",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          Add Custom Name:
                        </label>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <input
                            type="text"
                            placeholder="Enter custom name"
                            value={customEditAdminName}
                            onChange={(e) =>
                              setCustomEditAdminName(e.target.value)
                            }
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              handleAddCustomEditAdminName()
                            }
                            style={{
                              padding: "8px",
                              flex: 1,
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomEditAdminName}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "600",
                              minWidth: "40px",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.backgroundColor = "#218838")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.backgroundColor = "#28a745")
                            }
                            title="Add custom name"
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedEditAdminNames.length > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    backgroundColor: "#e7f3ff",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#0066cc",
                  }}
                >
                  <strong>Selected:</strong> {getFinalEditAdminNames()}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                paddingTop: "20px",
                borderTop: "1px solid #eee",
              }}
            >
              <button
                onClick={handleCloseEditModal}
                style={{
                  padding: "10px 25px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#5a6268")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#6c757d")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: "10px 25px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#218838")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#28a745")
                }
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Buyer Follow-Up Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            overflow: "auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
              width: "100%",
              maxWidth: "550px",
              margin: "auto",
              position: "relative",
              zIndex: 10000,
              animation: "slideDown 0.3s ease",
            }}
          >
            <button
              onClick={handleCloseCreateModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                color: "#666",
                padding: "0",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#000")}
              onMouseLeave={(e) => (e.target.style.color = "#666")}
              title="Close"
            >
              ×
            </button>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                color: "#333",
                fontSize: "1.5rem",
                borderBottom: "2px solid #007bff",
                paddingBottom: "10px",
              }}
            >
              Create New Buyer Follow-Up
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                BA ID:
              </label>
              <input
                type="text"
                name="ba_id"
                value={createFormData.ba_id}
                disabled
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Phone Number: <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={createFormData.phoneNumber}
                onChange={handleCreateFormChange}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Follow-up Status: <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                name="followupStatus"
                value={createFormData.followupStatus}
                onChange={handleCreateFormChange}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">Select Status</option>
                <option value="Ring">Ring</option>
                <option value="Ready To Pay">Ready To Pay</option>
                <option value="Not Decided">Not Decided</option>
                <option value="Not Interested-Closed">
                  Not Interested-Closed
                </option>
                <option value="Paid Closed">Paid Closed</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Follow-up Type: <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                name="followupType"
                value={createFormData.followupType}
                onChange={handleCreateFormChange}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">Select Type</option>
                <option value="Payment Followup">Payment Followup</option>
                <option value="Data Followup">Data Followup</option>
                <option value="Enquiry Followup">Enquiry Followup</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Follow-up Date: <span style={{ color: "#dc3545" }}>*</span>{" "}
                <span style={{ color: "#888", fontWeight: "normal", fontSize: "12px" }}>
                  (time auto-captured at save)
                </span>
              </label>
              {/* User picks the date; the time portion is appended at submit
                  in handleCreateFollowUp so it's always the actual save moment. */}
              <input
                type="date"
                name="followupDate"
                value={createFormData.followupDate}
                onChange={handleCreateFormChange}
                min={getTodayDateString()}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Remark:
              </label>
              <textarea
                name="remarks"
                placeholder="Enter remark (optional)"
                value={createFormData.remarks}
                onChange={handleCreateFormChange}
                rows={3}
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "5px",
                  color: "#555",
                }}
              >
                Admin Name:{" "}
                <span style={{ color: "#888", fontWeight: "normal", fontSize: "12px" }}>
                  (auto-captured from login)
                </span>
              </label>
              {/* Strict record: the admin name is whoever is currently logged
                  in. The user can't change it on create — keeps reporting
                  honest. The Edit modal still allows updating if needed. */}
              <input
                type="text"
                value={loggedInAdminName}
                disabled
                style={{
                  padding: "10px",
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                paddingTop: "20px",
                borderTop: "1px solid #eee",
              }}
            >
              <button
                onClick={handleCloseCreateModal}
                style={{
                  padding: "10px 25px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#5a6268")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#6c757d")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFollowUp}
                style={{
                  padding: "10px 25px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#0056b3")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#007bff")
                }
              >
                Create Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpBuyerGetTable;

