import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import moment from "moment";
import { FaFlag, FaBan, FaTrash, FaUndo, FaCheck } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Table, Modal, Button, Badge } from "react-bootstrap";
import PhoneCell from "./components/PhoneCell";
import FollowupQuickModal from "./components/FollowupQuickModal";

// Remark values that map to a follow-up bucket (double-click → quick modal).
const FOLLOWUP_REMARKS = ["seller", "buyer", "visitor", "ring"];

// Constants & Helpers
const remarksMap = {
  visitor: "Visitor",
  seller: "Owner",
  buyer: "Tenant",
  ring: "Ring",
};

const getDisplayRemarks = (r) => remarksMap[r] || r || "N/A";
const normalize = (phone) => String(phone || "").replace(/\D/g, "").slice(-10);

const buildUserDefaults = (user) => ({
  ...user,
  remarks: user.remarks || "",
  updatedBy: user.updatedBy || null,
  updateDate: user.updateDate || null,
  conversionStatus: user.conversionStatus || "pending",
  conversion: user.conversion !== undefined ? user.conversion : false,
  conversionDate: user.conversionDate || null,
  conversionUpdatedBy: user.conversionUpdatedBy || null,
});

const LoginReportTable = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [otpStatusFilter, setOtpStatusFilter] = useState("all");
  const [loginModeFilter, setLoginModeFilter] = useState("all");
  const [remarksFilter, setRemarksFilter] = useState("all");
  const [conversionStatusFilter, setConversionStatusFilter] = useState("all");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingPhones, setUpdatingPhones] = useState(new Set());
  const [allowedRoles, setAllowedRoles] = useState([]);
  // Quick follow-up modal (opened by double-clicking a phone number).
  const [followupTarget, setFollowupTarget] = useState(null); // { phone, remark }
  const [showRemarkWarning, setShowRemarkWarning] = useState(false);

  const reduxAdminName = useSelector((state) => state.admin?.name);
  const reduxAdminRole = useSelector((state) => state.admin?.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName") || "Admin";
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const fileName = "Login Report";
  const tableRef = useRef();

  useEffect(() => {
    fetchUsers();
  }, []);

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
      } catch {}
    };
    if (adminName && adminRole) recordDashboardView();
  }, [adminName, adminRole]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const rolePermissions = res.data.find((perm) => perm.role === adminRole);
        const viewed = rolePermissions?.viewedFiles?.map((f) => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    if (adminRole) fetchPermissions();
  }, [adminRole]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/alls`);
      // Apply defaults on every fetch so remarks/conversion are always present
      setUsers((res.data.data || []).map(buildUserDefaults));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ─── Optimistic update helper ─────────────────────────────────────────────
  const setPhoneUpdating = useCallback((phone, on) => {
    setUpdatingPhones((prev) => {
      const next = new Set(prev);
      on ? next.add(phone) : next.delete(phone);
      return next;
    });
  }, []);

  const updateUser = useCallback((phone, fields) => {
    const key = normalize(phone);
    setUsers((prev) =>
      prev.map((u) => (normalize(u.phone) === key ? { ...u, ...fields } : u))
    );
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleSetActiveStatus = async (user) => {
    if (!user) return;
    setLoading(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/set-active-status`, {
        phone: user.phone,
        adminName,
      });
      await fetchUsers();
      alert(`User ${user.phone} status set to active successfully`);
    } catch (error) {
      console.error("Error setting active status:", error);
      alert(`Failed to set active status: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setSelectedUser(null);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType || !inputValue) return;
    setLoading(true);
    try {
      const payload = {
        phone: selectedUser.phone,
        adminName,
        [actionType === "report" ? "remarks" : "reason"]: inputValue,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/users/${actionType}`, payload);

      setSelectedUser(null);
      setInputValue("");
      setActionType("");
      setShowConfirmModal(false);
      await fetchUsers();
    } catch (error) {
      console.error(`Error during ${actionType}:`, error);
      alert(`Failed to ${actionType} user: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUndoAction = async (type) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const endpointMap = { unreport: "unreport", unban: "unban", undelete: "undelete" };
      const endpoint = endpointMap[type];
      if (!endpoint) return;

      await axios.post(`${process.env.REACT_APP_API_URL}/users/${endpoint}`, {
        phone: selectedUser.phone,
        adminName,
      });

      await fetchUsers();
      setShowConfirmModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(`Error during ${type}:`, error);
      alert(`Failed to ${type} user: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── Remark update (optimistic) ───────────────────────────────────────────
  const handleMarkRemark = useCallback(
    async (user, remark) => {
      const phone = user.phone;
      const now = new Date().toISOString();
      const snap = { remarks: user.remarks, updatedBy: user.updatedBy, updateDate: user.updateDate };

      setPhoneUpdating(phone, true);
      updateUser(phone, { remarks: remark, updatedBy: adminName, updateDate: now });

      try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/update-remarks`, {
          phone,
          adminName,
          remarks: remark,
        });

        if (res.data?.data) {
          const s = res.data.data;
          updateUser(phone, {
            remarks: s.remarks,
            updatedBy: s.updatedBy,
            updateDate: s.updateDate,
          });
        }
      } catch (err) {
        console.error("Error updating remarks:", err);
        alert(`Failed to update remarks: ${err.response?.data?.message || err.message}`);
        updateUser(phone, snap);
      } finally {
        setPhoneUpdating(phone, false);
      }
    },
    [adminName, updateUser, setPhoneUpdating]
  );

  // ─── Conversion update (optimistic) ──────────────────────────────────────
  const handleMarkConversionPaid = useCallback(
    async (user, status) => {
      const phone = user.phone;
      const now = new Date().toISOString();
      const snap = {
        conversionStatus: user.conversionStatus,
        conversionDate: user.conversionDate,
        conversionUpdatedBy: user.conversionUpdatedBy,
        updateDate: user.updateDate,
        conversion: user.conversion,
      };

      setPhoneUpdating(phone, true);
      updateUser(phone, {
        conversionStatus: status,
        conversion: status !== "pending",
        conversionDate: status !== "pending" ? now : null,
        conversionUpdatedBy: adminName,
        updateDate: now,
      });

      try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/update-conversion-status`, {
          phone,
          adminName,
          conversionStatus: status,
        });

        if (res.data?.data) {
          const s = res.data.data;
          updateUser(phone, {
            conversionStatus: s.conversionStatus,
            conversion: s.conversion,
            conversionDate: s.conversionDate,
            conversionUpdatedBy: s.conversionUpdatedBy,
            updateDate: s.updateDate,
          });
        }
      } catch (err) {
        console.error("Error updating conversion:", err);
        alert(`Failed to update conversion: ${err.response?.data?.message || err.message}`);
        updateUser(phone, snap);
      } finally {
        setPhoneUpdating(phone, false);
      }
    },
    [adminName, updateUser, setPhoneUpdating]
  );

  // ─── Quick follow-up (double-click phone) ─────────────────────────────────
  // Double-clicking a phone opens the quick create-follow-up modal. Which
  // bucket it files into is decided by the row's Remark Status. A row with no
  // remark set can't be filed anywhere, so we warn instead.
  const handlePhoneDoubleClick = useCallback((user) => {
    if (!user?.phone) return;
    if (FOLLOWUP_REMARKS.includes(user.remarks)) {
      setFollowupTarget({ phone: user.phone, remark: user.remarks });
    } else {
      setShowRemarkWarning(true);
    }
  }, []);

  // ─── Print ────────────────────────────────────────────────────────────────
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

  // ─── Filter logic ─────────────────────────────────────────────────────────
  const filteredUsers = (() => {
    const filtered = users.filter((user) => {
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      const matchesPhone =
        phoneFilter.trim() === "" || user.phone?.includes(phoneFilter.trim());

      const loginMoment = moment(user.loginDate, moment.ISO_8601, true);
      const start = startDate ? moment(startDate, "YYYY-MM-DD").startOf("day") : null;
      const end = endDate ? moment(endDate, "YYYY-MM-DD").endOf("day") : null;

      const matchesDate =
        !loginMoment.isValid() ||
        (!start && !end) ||
        (start && !end && loginMoment.isSameOrAfter(start)) ||
        (!start && end && loginMoment.isSameOrBefore(end)) ||
        (start && end && loginMoment.isBetween(start, end, null, "[]"));

      const matchesOtpStatus =
        otpStatusFilter === "all" ||
        (user.otpStatus || "").toLowerCase() === otpStatusFilter.toLowerCase();

      const matchesLoginMode =
        loginModeFilter === "all" ||
        (user.loginMode || "").toLowerCase() === loginModeFilter.toLowerCase();

      const matchesRemarks =
        remarksFilter === "all" || user.remarks === remarksFilter;

      const matchesConversionStatus =
        conversionStatusFilter === "all" ||
        (user.conversionStatus || "pending") === conversionStatusFilter;

      return (
        matchesStatus &&
        matchesPhone &&
        matchesDate &&
        matchesOtpStatus &&
        matchesLoginMode &&
        matchesRemarks &&
        matchesConversionStatus
      );
    });

    // ─── FIX: Deduplicate by phone — merge remark/conversion from ALL records,
    //         then use the most recent loginDate record as the base, but ALWAYS
    //         preserve remarks & conversion data from whichever record has it.
    const phoneMap = {};

    filtered.forEach((user) => {
      const phone = user.phone;

      if (!phoneMap[phone]) {
        // First time seeing this phone — use it as-is
        phoneMap[phone] = { ...user };
      } else {
        const existing = phoneMap[phone];
        const existingDate = moment(existing.loginDate, moment.ISO_8601, true);
        const incomingDate = moment(user.loginDate, moment.ISO_8601, true);

        // Pick the record with the more recent loginDate as the base
        const base = incomingDate.isAfter(existingDate) ? { ...user } : { ...existing };
        const other = incomingDate.isAfter(existingDate) ? existing : user;

        // ── KEY FIX: always preserve remarks from whichever record has them ──
        // Prefer the record whose remarks is non-empty; if both have remarks,
        // prefer the one with the more recent updateDate.
        const baseHasRemark = base.remarks && base.remarks !== "";
        const otherHasRemark = other.remarks && other.remarks !== "";

        if (!baseHasRemark && otherHasRemark) {
          base.remarks = other.remarks;
          base.updatedBy = other.updatedBy;
          base.updateDate = other.updateDate;
        } else if (baseHasRemark && otherHasRemark) {
          // Both have remarks — keep the one with more recent updateDate
          const baseUpdate = moment(base.updateDate, moment.ISO_8601, true);
          const otherUpdate = moment(other.updateDate, moment.ISO_8601, true);
          if (otherUpdate.isAfter(baseUpdate)) {
            base.remarks = other.remarks;
            base.updatedBy = other.updatedBy;
            base.updateDate = other.updateDate;
          }
        }

        // ── KEY FIX: always preserve conversionStatus from whichever record has it ──
        const baseHasConversion =
          base.conversionStatus && base.conversionStatus !== "pending";
        const otherHasConversion =
          other.conversionStatus && other.conversionStatus !== "pending";

        if (!baseHasConversion && otherHasConversion) {
          base.conversionStatus = other.conversionStatus;
          base.conversion = other.conversion;
          base.conversionDate = other.conversionDate;
          base.conversionUpdatedBy = other.conversionUpdatedBy;
        } else if (baseHasConversion && otherHasConversion) {
          // Both have conversion — keep the one with more recent conversionDate
          const baseConv = moment(base.conversionDate, moment.ISO_8601, true);
          const otherConv = moment(other.conversionDate, moment.ISO_8601, true);
          if (otherConv.isAfter(baseConv)) {
            base.conversionStatus = other.conversionStatus;
            base.conversion = other.conversion;
            base.conversionDate = other.conversionDate;
            base.conversionUpdatedBy = other.conversionUpdatedBy;
          }
        }

        phoneMap[phone] = base;
      }
    });

    return Object.values(phoneMap).sort((a, b) => {
      const dateA = moment(a.loginDate, moment.ISO_8601, true);
      const dateB = moment(b.loginDate, moment.ISO_8601, true);
      return dateB.diff(dateA);
    });
  })();

  // ─── Confirmation modal helpers ───────────────────────────────────────────
  const showConfirmation = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    // ban / delete / report require a reason — the Action Input modal further
    // down already renders for these actions and has its own submit button.
    // Showing the simple Confirm modal too caused them to stack and the Confirm
    // button silently no-op'd because inputValue was empty.
    if (["ban", "delete", "report"].includes(action)) {
      setInputValue("");
      return;
    }
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    try {
      if (confirmAction === "setActive") {
        await handleSetActiveStatus(selectedUser);
      } else if (["report", "ban", "delete"].includes(confirmAction)) {
        await handleAction();
      } else {
        await handleUndoAction(confirmAction);
      }
    } catch (error) {
      console.error("Error in executeConfirmedAction:", error);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const getActionTitle = (action) => {
    const titles = {
      report: "Report User", ban: "Ban User", delete: "Delete User",
      unreport: "Unreport User", unban: "Unban User", undelete: "Undelete User",
      setActive: "Set Active Status",
    };
    return titles[action] || "Confirm Action";
  };

  const getActionMessage = (action, phone) => {
    const messages = {
      report: `Are you sure you want to report user ${phone}?`,
      ban: `Are you sure you want to ban user ${phone}?`,
      delete: `Are you sure you want to delete user ${phone}? This action cannot be undone.`,
      unreport: `Are you sure you want to remove report from user ${phone}?`,
      unban: `Are you sure you want to unban user ${phone}?`,
      undelete: `Are you sure you want to restore deleted user ${phone}?`,
      setActive: `Are you sure you want to set user ${phone} status to active? This will clear all restrictions.`,
    };
    return messages[action] || `Are you sure you want to perform this action on user ${phone}?`;
  };

  const getTotalCount = () => {
    const phoneMap = {};
    users.forEach((user) => { if (!phoneMap[user.phone]) phoneMap[user.phone] = user; });
    return Object.keys(phoneMap).length;
  };

  const getStatusBadge = (status) => {
    const variants = { active: "success", reported: "warning", banned: "danger", deleted: "dark" };
    return <Badge bg={variants[status] || "primary"}>{status || "active"}</Badge>;
  };

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-danger font-weight-bold mt-5">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Login Report</h2>

      {/* ─── Filters ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end", marginBottom: "12px" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>Phone</label>
          <input
            type="text"
            placeholder="Search Phone"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: "130px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: "130px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: "130px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select form-select-sm"
            style={{ width: "110px" }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="reported">Reported</option>
            <option value="banned">Banned</option>
            <option value="deleted">Deleted</option>
            <option value="unReported">UnReported</option>
            <option value="unDeleted">UnDeleted</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>OTP Status</label>
          <select
            value={otpStatusFilter}
            onChange={(e) => setOtpStatusFilter(e.target.value)}
            className="form-select form-select-sm"
            style={{ width: "105px" }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>Login Mode</label>
          <select
            value={loginModeFilter}
            onChange={(e) => setLoginModeFilter(e.target.value)}
            className="form-select form-select-sm"
            style={{ width: "100px" }}
          >
            <option value="all">All</option>
            <option value="web">Web</option>
            <option value="app">App</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>Remarks</label>
          <select
            value={remarksFilter}
            onChange={(e) => setRemarksFilter(e.target.value)}
            className="form-select form-select-sm"
            style={{ width: "100px" }}
          >
            <option value="all">All</option>
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
            <option value="visitor">Visitor</option>
            <option value="ring">Ring</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: 0 }}>Conversion</label>
          <select
            value={conversionStatusFilter}
            onChange={(e) => setConversionStatusFilter(e.target.value)}
            className="form-select form-select-sm"
            style={{ width: "100px" }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>

      </div>

      {/* ─── Counters ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px", marginTop: "16px", alignItems: "center" }}>
        <div style={{
          background: "#6c757d", color: "white", padding: "8px 16px",
          borderRadius: "4px", fontWeight: "bold", fontSize: "14px", display: "inline-block"
        }}>
          Total: {getTotalCount()} Records
        </div>
        <div style={{
          background: "#007bff", color: "white", padding: "8px 16px",
          borderRadius: "4px", fontWeight: "bold", fontSize: "14px", display: "inline-block"
        }}>
          Showing: {filteredUsers.length} Records
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setPhoneFilter("");
            setStartDate("");
            setEndDate("");
            setStatusFilter("all");
            setOtpStatusFilter("all");
            setLoginModeFilter("all");
            setRemarksFilter("all");
            setConversionStatusFilter("all");
          }}
        >
          Reset
        </button>
        <button
          className="btn btn-sm"
          style={{ background: "tomato", color: "white" }}
          onClick={handlePrint}
        >
          Print
        </button>
      </div>

      {/* ─── Confirmation Modal ────────────────────────────────────────────── */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{getActionTitle(confirmAction)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && getActionMessage(confirmAction, selectedUser.phone)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            variant={
              confirmAction?.includes("un") ? "success"
              : confirmAction === "delete" ? "danger"
              : "primary"
            }
            onClick={executeConfirmedAction}
            disabled={loading}
          >
            {loading ? "Processing..."
              : confirmAction?.includes("un") ? "Confirm Restore"
              : confirmAction === "delete" ? "Confirm Delete"
              : confirmAction === "setActive" ? "Set Active"
              : "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── Action Input Modal (report / ban / delete) ────────────────────── */}
      {selectedUser && ["report", "ban", "delete"].includes(actionType) && (
        <Modal show={true} onHide={() => { setSelectedUser(null); setInputValue(""); setActionType(""); }} centered>
          <Modal.Header closeButton>
            <Modal.Title>{getActionTitle(actionType)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {actionType === "report" ? (
              <select
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="form-select mb-3"
              >
                <option value="">-- Select Remark --</option>
                <option value="seller">Seller</option>
                <option value="buyer">Buyer</option>
                <option value="visitor">Visitor</option>
                <option value="ring">Ring</option>
              </select>
            ) : (
              <input
                type="text"
                placeholder={`Enter ${actionType === "ban" ? "ban" : "delete"} reason`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="form-control mb-3"
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setSelectedUser(null); setInputValue(""); setActionType(""); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === "delete" ? "danger" : "primary"}
              onClick={handleAction}
              disabled={!inputValue || loading}
            >
              {loading ? "Processing..."
                : actionType === "report" ? "Report User"
                : actionType === "ban" ? "Ban User"
                : "Delete User"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* ─── Table ────────────────────────────────────────────────────────── */}
      <div ref={tableRef}>
        <Table striped bordered hover responsive className="table-sm align-middle">
          <thead className="sticky-top">
            <tr>
              <th className="border px-4 py-2">SI.NO</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">OTP</th>
              <th className="border px-4 py-2">Login Date</th>
              <th className="border px-4 py-2">OTP Status</th>
              <th className="border px-4 py-2">Remark</th>
              <th className="border px-4 py-2">Remark Status</th>
              <th className="border px-4 py-2">Conversion</th>
              <th className="border px-4 py-2">Conversion Status</th>
              <th className="border px-4 py-2">Banned Reason</th>
              <th className="border px-4 py-2">Deleted Reason</th>
              <th className="border px-4 py-2">Banned By / Un Banned By</th>
              <th className="border px-4 py-2">Deleted By / Un Deleted By</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((item, index) => (
              <tr key={item._id}>
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">
                  <PhoneCell
                    phone={item.phone}
                    type="any"
                    onDoubleClick={() => handlePhoneDoubleClick(item)}
                    title="Double-click to add a follow-up (by Remark Status)"
                  />
                </td>
                <td className="border px-4 py-2">{item.otp || "N/A"}</td>
                <td className="border px-4 py-2">
                  {moment(item.loginDate).format("DD-MM-YYYY HH:mm")}
                </td>
                <td className="border px-4 py-2">{item.otpStatus}</td>

                {/* Remark Dropdown */}
                <td className="border px-4 py-2 text-center">
                  <select
                    className="form-select form-select-sm"
                    value={item.remarks || ""}
                    onChange={(e) => handleMarkRemark(item, e.target.value)}
                    disabled={updatingPhones.has(item.phone)}
                  >
                    <option value="">Select Remark</option>
                    <option value="seller">Seller</option>
                    <option value="buyer">Buyer</option>
                    <option value="visitor">Visitor</option>
                    <option value="ring">Ring</option>
                  </select>
                </td>

                {/* Remark Status Badge */}
                <td className="border px-4 py-2 text-center">
                  {item.remarks === "seller" && (
                    <div>
                      <span className="badge bg-primary d-block mb-1">Seller</span>
                      {item.updatedBy && (
                        <small className="text-muted d-block">
                          {item.updatedBy}
                          {item.updateDate ? ` (${moment(item.updateDate).format("DD-MM-YYYY")})` : ""}
                        </small>
                      )}
                    </div>
                  )}
                  {item.remarks === "buyer" && (
                    <div>
                      <span className="badge bg-info d-block mb-1">Buyer</span>
                      {item.updatedBy && (
                        <small className="text-muted d-block">
                          {item.updatedBy}
                          {item.updateDate ? ` (${moment(item.updateDate).format("DD-MM-YYYY")})` : ""}
                        </small>
                      )}
                    </div>
                  )}
                  {item.remarks === "visitor" && (
                    <div>
                      <span className="badge bg-warning d-block mb-1">Visitor</span>
                      {item.updatedBy && (
                        <small className="text-muted d-block">
                          {item.updatedBy}
                          {item.updateDate ? ` (${moment(item.updateDate).format("DD-MM-YYYY")})` : ""}
                        </small>
                      )}
                    </div>
                  )}
                  {item.remarks === "ring" && (
                    <div>
                      <span className="badge bg-success d-block mb-1">Ring</span>
                      {item.updatedBy && (
                        <small className="text-muted d-block">
                          {item.updatedBy}
                          {item.updateDate ? ` (${moment(item.updateDate).format("DD-MM-YYYY")})` : ""}
                        </small>
                      )}
                    </div>
                  )}
                  {!item.remarks && <span className="badge bg-secondary">No Remark</span>}
                </td>

                {/* Conversion Dropdown */}
                <td className="border px-4 py-2 text-center">
                  <select
                    className="form-select form-select-sm"
                    value={item.conversionStatus || "pending"}
                    onChange={(e) => handleMarkConversionPaid(item, e.target.value)}
                    disabled={updatingPhones.has(item.phone)}
                  >
                    <option value="pending">Pending</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>

                {/* Conversion Status Badge */}
                <td className="border px-4 py-2 text-center">
                  {item.conversionStatus === "paid" && (
                    <div>
                      <span className="badge bg-success d-block mb-1">
                        Paid
                        {item.conversionDate
                          ? ` (${moment(item.conversionDate).format("DD-MM-YYYY")})`
                          : ""}
                      </span>
                      {item.conversionUpdatedBy && (
                        <small className="text-muted d-block">{item.conversionUpdatedBy}</small>
                      )}
                    </div>
                  )}
                  {item.conversionStatus === "free" && (
                    <div>
                      <span className="badge bg-info d-block mb-1">
                        Free
                        {item.conversionDate
                          ? ` (${moment(item.conversionDate).format("DD-MM-YYYY")})`
                          : ""}
                      </span>
                      {item.conversionUpdatedBy && (
                        <small className="text-muted d-block">{item.conversionUpdatedBy}</small>
                      )}
                    </div>
                  )}
                  {(!item.conversionStatus || item.conversionStatus === "pending") && (
                    <span className="badge bg-secondary">Pending</span>
                  )}
                </td>

                <td className="border px-4 py-2">{item.bannedReason || "N/A"}</td>
                <td className="border px-4 py-2">{item.deleteReason || "N/A"}</td>

                {/* Banned By / UnBanned By */}
                <td className="border px-4 py-2">
                  <div>
                    {item.bannedBy ? (
                      <div>
                        <strong>{item.bannedBy}</strong>
                        {item.bannedDate ? ` (${moment(item.bannedDate).format("DD-MM-YYYY")})` : ""}
                      </div>
                    ) : null}
                    {item.unBannedBy ? (
                      <div style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                        UnBanned By: {item.unBannedBy}
                        {item.unBannedDate ? ` (${moment(item.unBannedDate).format("DD-MM-YYYY")})` : ""}
                      </div>
                    ) : null}
                    {!item.bannedBy && !item.unBannedBy && "N/A"}
                  </div>
                </td>

                {/* Deleted By / UnDeleted By */}
                <td className="border px-4 py-2">
                  <div>
                    {item.deletedBy ? (
                      <div>
                        <strong>{item.deletedBy}</strong>
                        {item.deletedDate ? ` (${moment(item.deletedDate).format("DD-MM-YYYY")})` : ""}
                      </div>
                    ) : null}
                    {item.unDeletedBy ? (
                      <div style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                        UnDeleted By: {item.unDeletedBy}
                        {item.unDeletedDate ? ` (${moment(item.unDeletedDate).format("DD-MM-YYYY")})` : ""}
                      </div>
                    ) : null}
                    {!item.deletedBy && !item.unDeletedBy && "N/A"}
                  </div>
                </td>

                {/* Actions */}
                <td className="border px-4 py-2 text-center">
                  <div className="d-flex justify-content-center gap-2">
                    {item.status === "banned" ? (
                      <button
                        className="btn btn-sm btn-success"
                        title="Unban"
                        onClick={() => showConfirmation(item, "unban")}
                        disabled={loading}
                      >
                        <FaUndo />
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-danger"
                        title="Ban"
                        onClick={() => showConfirmation(item, "ban")}
                        disabled={loading}
                      >
                        <FaBan />
                      </button>
                    )}

                    {item.status === "deleted" ? (
                      <button
                        className="btn btn-sm btn-success"
                        title="Undelete"
                        onClick={() => showConfirmation(item, "undelete")}
                        disabled={loading}
                      >
                        <FaUndo />
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-dark"
                        title="Delete"
                        onClick={() => showConfirmation(item, "delete")}
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td className="border px-4 py-2 text-center" colSpan="14">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* ─── Quick Follow-up Modal (double-click phone) ────────────────────── */}
      {followupTarget && (
        <FollowupQuickModal
          phone={followupTarget.phone}
          remark={followupTarget.remark}
          adminName={adminName}
          onClose={() => setFollowupTarget(null)}
        />
      )}

      {/* ─── Remark Status Required Warning ────────────────────────────────── */}
      <Modal show={showRemarkWarning} onHide={() => setShowRemarkWarning(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remark Status Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Please set a <strong>Remark Status</strong> (Seller / Buyer / Visitor / Ring) for this
          phone number before adding a follow-up.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowRemarkWarning(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LoginReportTable;