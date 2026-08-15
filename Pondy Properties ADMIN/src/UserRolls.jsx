import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Container, Table, Form, Button, Badge, Modal, Spinner } from "react-bootstrap";
import { FaEdit, FaTrashAlt, FaShieldAlt, FaPlus, FaSave, FaTimes, FaCheckSquare, FaSquare, FaSync } from "react-icons/fa";
import { MdDeleteForever, MdSecurity } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Complete page/file registry mapped from Dashboard.jsx routes + Sidebar.jsx labels ───
const ALL_FILES = [
  // Dashboard
  { key: "Statistics", label: "Statistics", section: "Dashboard" },
  { key: "Property DailyReport", label: "Property Daily Report", section: "Dashboard" },
  { key: "Detail Property DailyReport", label: "Details Daily Report", section: "Dashboard" },
  { key: "Property Payment DailyReport", label: "Payment Property Daily Report", section: "Dashboard" },
  { key: "Buyer Assistant DailyReport", label: "BA Daily Report", section: "Dashboard" },

  // Report
  { key: "Login Report", label: "Login Report", section: "Report" },
  { key: "Login Users Datas", label: "Login Users Datas", section: "Report" },
  { key: "Users Log", label: "Login User Views Pages", section: "Report" },
  { key: "Login Separate User", label: "Login Datas Separate Users", section: "Report" },
  { key: "Admin Report", label: "Admin Report", section: "Report" },
  { key: "PPC Staff Report", label: "PPC Staff Report", section: "Report" },
  { key: "Download History", label: "Download History", section: "Report" },

  // Login Direct
  { key: "Login Verify Directly", label: "Direct Login User", section: "Login Direct" },
  { key: "MyAccount", label: "My Account", section: "Login Direct" },
  { key: "PUC Property", label: "PUC Property", section: "Login Direct" },
  { key: "Apply OnDemad Property", label: "Set As On Demand Property", section: "Login Direct" },
  { key: "Set PPCID", label: "Set PPCID Property", section: "Login Direct" },

  // Notification
  { key: "Admin Notification", label: "Admin Notification", section: "Notification" },
  { key: "Notification Send", label: "Notification Send Form", section: "Notification" },
  { key: "Push Notifications", label: "Push Notifications (mobile app)", section: "Notification" },

  // Office Setup
  { key: "Office", label: "Office", section: "Office Setup" },
  { key: "Users", label: "Users", section: "Office Setup" },
  { key: "AddPlan", label: "Plan", section: "Office Setup" },
  { key: "BuyerPlan", label: "Buyer Plan", section: "Office Setup" },
  { key: "Payment Type", label: "Payment Type", section: "Office Setup" },
  { key: "State", label: "State", section: "Office Setup" },
  { key: "District", label: "District", section: "Office Setup" },
  { key: "City", label: "City", section: "Office Setup" },
  { key: "Area", label: "Area", section: "Office Setup" },
  { key: "Roll", label: "Rolls", section: "Office Setup" },
  { key: "AdminLog", label: "Admin Log", section: "Office Setup" },
  { key: "Text Editer", label: "Text Editors", section: "Office Setup" },
  { key: "AdminSetForm", label: "Admin Set Property", section: "Office Setup" },
  { key: "Get User Profile", label: "Get User Profile", section: "Office Setup" },

  // Buyer Assistant
  { key: "Add Buyer Assistance", label: "Add Buyers Assistance", section: "Buyer Assistant" },
  { key: "Get Buyer Assistances", label: "Manage All Buyer Assistance", section: "Buyer Assistant" },
  { key: "Buyer Active Assistant", label: "Approved - Buyer Assistance", section: "Buyer Assistant" },
  { key: "Pending Assistant", label: "Pending - Buyer Assistance", section: "Buyer Assistant" },
  { key: "Buyer Assistant Viewed", label: "Buyer Assistant Viewed User", section: "Buyer Assistant" },
  { key: "Expired Assistant", label: "Expired Assistant", section: "Buyer Assistant" },
  { key: "Removed Buyer Assistant", label: "Removed Buyer Assistant", section: "Buyer Assistant" },
  { key: "All Buyer Bills", label: "Get All Buyer Office Bills", section: "Buyer Assistant" },
  { key: "BaFree Bills", label: "Buyer Free Office Bills", section: "Buyer Assistant" },
  { key: "BaPaid Bill", label: "Buyer Paid Office Bills", section: "Buyer Assistant" },

  // PPC Property
  { key: "Search Property", label: "Search Property", section: "PPC Property" },
  { key: "Pricing Info", label: "Pricing Info", section: "PPC Property" },
  { key: "Add Property", label: "Add Property", section: "PPC Property" },
  { key: "Bulk Upload Property", label: "Bulk Upload Property", section: "PPC Property" },
  { key: "Manage Property", label: "Manage Properties", section: "PPC Property" },
  { key: "Approved Property", label: "Approved Property", section: "PPC Property" },
  { key: "PreApproved Property", label: "PreApproved Property", section: "PPC Property" },
  { key: "Pending Property", label: "Pending Property", section: "PPC Property" },
  { key: "Removed Property", label: "Removed Property", section: "PPC Property" },
  { key: "Expire Property", label: "Expired Property", section: "PPC Property" },
  { key: "Delete Properties", label: "Permanent Deleted Property", section: "PPC Property" },
  { key: "Feature Property", label: "Featured Property", section: "PPC Property" },
  { key: "Paid Property", label: "Paid Property", section: "PPC Property" },
  { key: "Free Property", label: "Free Property", section: "PPC Property" },
  { key: "Set Property Message", label: "Set Property Message", section: "PPC Property" },
  { key: "Fetch All Address", label: "Get All Properties Address", section: "PPC Property" },
  { key: "Get All Property Datas", label: "Get All Property Datas", section: "PPC Property" },

  // PPC Prop Accounts
  { key: "Free Bills", label: "Free Bills", section: "PPC Prop Accounts" },
  { key: "Paid Bills", label: "Paid Bills", section: "PPC Prop Accounts" },
  { key: "Payment Success", label: "Payment Paid Success", section: "PPC Prop Accounts" },
  { key: "Payment Failed", label: "Payment Paid Failed", section: "PPC Prop Accounts" },
  { key: "Payment PayNow", label: "Payment Pay Now", section: "PPC Prop Accounts" },
  { key: "Payment PayLater", label: "Payment Pay Later", section: "PPC Prop Accounts" },
  { key: "All Bills", label: "All Bills Datas", section: "PPC Prop Accounts" },
  { key: "Upload Groom", label: "Upload Groom", section: "PPC Prop Accounts" },
  { key: "Upload Bride", label: "Upload Bride", section: "PPC Prop Accounts" },
  { key: "Upload Ads Images", label: "Upload Ads Images", section: "PPC Prop Accounts" },
  { key: "Upload Detail Ads Images", label: "Upload Detail Ads Images", section: "PPC Prop Accounts" },

  // Customer Care
  { key: "Customer Care", label: "Customer Care", section: "Customer Care" },
  { key: "Help Request Table", label: "Received Need Help", section: "Customer Care" },
  { key: "Report Property Table", label: "Received Report Property", section: "Customer Care" },
  { key: "SoldOut Table", label: "Received SoldOut Request", section: "Customer Care" },
  { key: "CalledList Datas", label: "User Called Experience Datas", section: "Customer Care" },

  // Property List
  { key: "Developer Property", label: "Developer Property", section: "Property List" },
  { key: "Owner Property", label: "Owner Property", section: "Property List" },
  { key: "Promotor Property", label: "Promotor Property", section: "Property List" },
  { key: "Agent Property", label: "Agent Property", section: "Property List" },
  { key: "PostBy Property", label: "PostedBy Properties", section: "Property List" },
  { key: "Py Property", label: "Py Properties", section: "Property List" },

  // Buyer PayU
  { key: "Buyer Payment Success", label: "Buyer Assistant Paid Success", section: "Buyer PayU" },
  { key: "Buyer Payment Failed", label: "Buyer Assistant Paid Failed", section: "Buyer PayU" },
  { key: "Buyer Payment PayNow", label: "Buyer Assistant Pay Now", section: "Buyer PayU" },
  { key: "Buyer Payment PayLater", label: "Buyer Assistant Pay Later", section: "Buyer PayU" },

  // Customer direct PayU
  { key: "Customer Direct Paid", label: "Paid", section: "Customer direct PayU" },
  { key: "Customer Direct Failed", label: "Failed", section: "Customer direct PayU" },

  // Business Support
  { key: "Search Data", label: "Searched Data", section: "Business Support" },
  { key: "BuyerList Interest", label: "Buyers List - Interest", section: "Business Support" },
  { key: "Interest Table", label: "Received Interest", section: "Business Support" },
  { key: "Contact Table", label: "Received Contact Request Datas", section: "Business Support" },
  { key: "Called List", label: "Called List Datas", section: "Business Support" },
  { key: "ShortList Favorite Table", label: "Received Favorite Datas", section: "Business Support" },
  { key: "ShortList FavoriteRemoved Table", label: "Received Favorite Removed Datas", section: "Business Support" },
  { key: "Viewed Property Table", label: "Viewed Properties", section: "Business Support" },
  { key: "Matched Property Table", label: "Matched Properties", section: "Business Support" },
  { key: "LastViewed Property", label: "Last Viewed Property", section: "Business Support" },
  { key: "Offers Raised Table", label: "Offers Raised", section: "Business Support" },
  { key: "PhotoRequest Table", label: "Photo Request", section: "Business Support" },
  { key: "Address Request", label: "Get Address Request Datas", section: "Business Support" },
  { key: "All Views Datas", label: "All Views Datas", section: "Business Support" },

  // Lead Menu
  { key: "BaLoan Lead", label: "Property Loan Lead", section: "Lead Menu" },
  { key: "Buyer Assistance Loan Lead", label: "Buyer Assistance Loan Lead", section: "Lead Menu" },
  { key: "Help LoanLead", label: "Help Loan Lead", section: "Lead Menu" },
  { key: "New Property Lead", label: "New Property Lead", section: "Lead Menu" },
  { key: "FreeUser Lead", label: "Free User Lead", section: "Lead Menu" },
  { key: "Groom Click Datas", label: "User Click Groom Datas", section: "Lead Menu" },
  { key: "Bride Click Datas", label: "User Click Bride Datas", section: "Lead Menu" },

  // No Property Users
  { key: "Without Property User", label: "Per Day Datas", section: "No Property Users" },
  { key: "Without 30 Days User", label: "Get 30 Days Datas", section: "No Property Users" },
  { key: "Without All Statics", label: "Fetch All Statics", section: "No Property Users" },

  // Business Statics
  { key: "Property Statics", label: "Property Statics", section: "Business Statics" },
  { key: "BuyerStatics", label: "Buyers Statics", section: "Business Statics" },
  { key: "PPCId Statics", label: "PPC ID Statics", section: "Business Statics" },
  { key: "Usage Statics", label: "Usage Statics", section: "Business Statics" },
  { key: "User Log", label: "User Log", section: "Business Statics" },
  { key: "Contact Usage", label: "Contact Usage", section: "Business Statics" },
  { key: "Daily Usage", label: "Daily Usage", section: "Business Statics" },

  // Follow Ups
  { key: "Property FllowUp", label: "Property Follow Ups", section: "Follow Ups" },
  { key: "All Property FollowUp", label: "All Property FollowUps Data", section: "Follow Ups" },
  { key: "Buyer FllowUp", label: "All Buyers FollowUps Data", section: "Follow Ups" },
  { key: "Transfer FllowUps", label: "Transfer FollowUps", section: "Follow Ups" },
  { key: "Transfer Assistant", label: "Transfer Assistant", section: "Follow Ups" },

  // Points Pricing
  { key: "Points Plans", label: "Points Plans - List", section: "Points Pricing" },
  { key: "Points Users", label: "Points Users & Balance", section: "Points Pricing" },
  { key: "Points Transactions", label: "Points Transactions", section: "Points Pricing" },
  { key: "Points PayLater", label: "Points Pay Later Leads", section: "Points Pricing" },
  { key: "Points PayU", label: "Points PayU Records", section: "Points Pricing" },
  { key: "Points Refunds", label: "Points Refund Requests", section: "Points Pricing" },
  { key: "Points Settings", label: "Points Settings", section: "Points Pricing" },

  // Settings
  { key: "User Roles", label: "User Rolls", section: "Settings" },
  { key: "Admin OTP Number", label: "Admin OTP Number", section: "Settings" },
  { key: "Limits", label: "Limits", section: "Settings" },
  { key: "Admin Views Table", label: "Admin Views Table", section: "Settings" },
  { key: "Profile", label: "Profile", section: "Settings" },
];

const SECTION_COLORS = {
  "Dashboard": "#3B82F6",
  "Report": "#8B5CF6",
  "Login Direct": "#EC4899",
  "Notification": "#F59E0B",
  "Office Setup": "#10B981",
  "Buyer Assistant": "#06B6D4",
  "PPC Property": "#F97316",
  "PPC Prop Accounts": "#84CC16",
  "Customer Care": "#EF4444",
  "Property List": "#6366F1",
  "Buyer PayU": "#14B8A6",
  "Customer direct PayU": "#7C3AED",
  "Business Support": "#F43F5E",
  "Lead Menu": "#A855F7",
  "No Property Users": "#64748B",
  "Business Statics": "#0EA5E9",
  "Follow Ups": "#D97706",
  "Points Pricing": "#8BC34A",
  "Settings": "#DC2626",
};

// Group files by section
const groupBySection = (files) => {
  return files.reduce((acc, file) => {
    if (!acc[file.section]) acc[file.section] = [];
    acc[file.section].push(file);
    return acc;
  }, {});
};

// Section display order — kept in sync with the sidebar (Sidebar.jsx) so the
// Roles & Access page lists sections in the same order the menu shows them.
const SECTION_ORDER = [
  "Dashboard",
  "Report",
  "Login Direct",
  "Notification",
  "Office Setup",
  "Buyer Assistant",
  "PPC Property",
  "PPC Prop Accounts",
  "Points Pricing",
  "Customer Care",
  "Property List",
  "Buyer PayU",
  "Customer direct PayU",
  "Business Support",
  "Lead Menu",
  "No Property Users",
  "Business Statics",
  "Follow Ups",
  "Settings",
];

const UserRolls = () => {
  const [rolls, setRolls] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [activeTab, setActiveTab] = useState("roles"); // 'roles' | 'access'
  const [selectedRole, setSelectedRole] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Roll management states
  const [rollType, setRollType] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [editingRoll, setEditingRoll] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allowedRoles, setAllowedRoles] = useState([]);

  const fileName = "User Roles";
  const printRef = useRef();

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const grouped = groupBySection(ALL_FILES);
  // Order sections to match the sidebar; unknown sections fall to the end.
  const sections = Object.keys(grouped).sort((a, b) => {
    const ia = SECTION_ORDER.indexOf(a);
    const ib = SECTION_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  // ── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchRolls(), fetchPermissions()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (adminName && adminRole) recordView();
    fetchPagePermissions();
  }, [adminName, adminRole]);

  // ── API calls ─────────────────────────────────────────────────────
  const recordView = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
        userName: adminName,
        role: adminRole,
        viewedFile: fileName,
        viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
      });
    } catch (_) {}
  };

  const fetchPagePermissions = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
      const rolePerms = res.data.find((p) => p.role === adminRole);
      setAllowedRoles(rolePerms?.viewedFiles?.map((f) => f.trim()) || []);
    } catch (_) {}
  };

  const fetchRolls = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/roll-all`);
      setRolls(res.data);
    } catch (err) {
      toast.error("Failed to fetch roles");
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
      setRolePermissions(res.data);
      localStorage.setItem("rolePermissions", JSON.stringify(res.data));
    } catch (_) {
      const saved = localStorage.getItem("rolePermissions");
      if (saved) setRolePermissions(JSON.parse(saved));
    }
  };

  // ── Roll CRUD ─────────────────────────────────────────────────────
  const createRoll = async () => {
    if (!rollType.trim()) return toast.error("Roll type is required");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/roll-create`, {
        rollType,
        createdDate: createDate,
      });
      setRolls([...rolls, res.data]);
      setRollType("");
      setCreateDate("");
      toast.success("Role created successfully");
    } catch (_) {
      toast.error("Failed to create role");
    }
  };

  const updateRoll = async () => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/roll-update/${editingRoll._id}`,
        { rollType, createdDate: createDate }
      );
      setRolls(rolls.map((r) => (r._id === editingRoll._id ? res.data : r)));
      setRollType("");
      setCreateDate("");
      setEditingRoll(null);
      toast.success("Role updated successfully");
    } catch (_) {
      toast.error("Failed to update role");
    }
  };

  const deleteRoll = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/roll-delete/${id}`);
      setRolls(rolls.filter((r) => r._id !== id));
      toast.success("Role deleted");
    } catch (_) {
      toast.error("Failed to delete role");
    }
  };

  const editRoll = (roll) => {
    setEditingRoll(roll);
    setRollType(roll.rollType);
    setCreateDate(roll.createdDate);
  };

  // ── Permission helpers ────────────────────────────────────────────
  const getFilesForRole = (role) => {
    const found = rolePermissions.find((r) => r.role === role);
    return found?.viewedFiles || [];
  };

  const isChecked = (role, fileKey) => {
    return getFilesForRole(role).includes(fileKey.trim());
  };

  const handleCheckbox = async (role, fileKey) => {
    const trimmedKey = fileKey.trim();
    const updated = rolePermissions.map((rp) => ({ ...rp, viewedFiles: [...(rp.viewedFiles || [])] }));
    const idx = updated.findIndex((r) => r.role === role);

    if (idx === -1) {
      updated.push({ role, viewedFiles: [trimmedKey] });
    } else {
      const has = updated[idx].viewedFiles.includes(trimmedKey);
      updated[idx].viewedFiles = has
        ? updated[idx].viewedFiles.filter((f) => f !== trimmedKey)
        : [...updated[idx].viewedFiles, trimmedKey];
    }

    setRolePermissions(updated);
    localStorage.setItem("rolePermissions", JSON.stringify(updated));

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/update-role-permissions`, {
        role,
        viewedFiles: updated.find((r) => r.role === role)?.viewedFiles || [],
      });
      // Notify Sidebar of permission update
      window.dispatchEvent(new CustomEvent("permissionsUpdated", { detail: { role } }));
    } catch (_) {
      toast.error("Failed to save permission");
    }
  };

  const handleSelectAllSection = async (role, sectionFiles, checked) => {
    const updated = rolePermissions.map((rp) => ({ ...rp, viewedFiles: [...(rp.viewedFiles || [])] }));
    const idx = updated.findIndex((r) => r.role === role);
    const keys = sectionFiles.map((f) => f.key.trim());

    if (idx === -1) {
      updated.push({ role, viewedFiles: checked ? keys : [] });
    } else {
      if (checked) {
        const existing = updated[idx].viewedFiles;
        updated[idx].viewedFiles = [...new Set([...existing, ...keys])];
      } else {
        updated[idx].viewedFiles = updated[idx].viewedFiles.filter((f) => !keys.includes(f));
      }
    }

    setRolePermissions(updated);
    localStorage.setItem("rolePermissions", JSON.stringify(updated));

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/update-role-permissions`, {
        role,
        viewedFiles: updated.find((r) => r.role === role)?.viewedFiles || [],
      });
      // Notify Sidebar of permission update
      window.dispatchEvent(new CustomEvent("permissionsUpdated", { detail: { role } }));
      toast.success("Section permissions updated");
    } catch (_) {
      toast.error("Failed to save permissions");
    }
  };

  const handleSelectAll = async (role, checked) => {
    const allKeys = ALL_FILES.map((f) => f.key.trim());
    const updated = rolePermissions.map((rp) => ({ ...rp, viewedFiles: [...(rp.viewedFiles || [])] }));
    const idx = updated.findIndex((r) => r.role === role);

    if (idx === -1) {
      updated.push({ role, viewedFiles: checked ? allKeys : [] });
    } else {
      updated[idx].viewedFiles = checked ? allKeys : [];
    }

    setRolePermissions(updated);
    localStorage.setItem("rolePermissions", JSON.stringify(updated));

    setSaving(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/update-role-permissions`, {
        role,
        viewedFiles: checked ? allKeys : [],
      });
      // Notify Sidebar of permission update
      window.dispatchEvent(new CustomEvent("permissionsUpdated", { detail: { role } }));
      toast.success(checked ? "All pages granted" : "All pages revoked");
    } catch (_) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const isSectionAllChecked = (role, sectionFiles) => {
    return sectionFiles.every((f) => isChecked(role, f.key));
  };

  const isSectionPartialChecked = (role, sectionFiles) => {
    const count = sectionFiles.filter((f) => isChecked(role, f.key)).length;
    return count > 0 && count < sectionFiles.length;
  };

  const isAllChecked = (role) => {
    return ALL_FILES.every((f) => isChecked(role, f.key));
  };

  const getGrantedCount = (role) => getFilesForRole(role).length;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredFiles = (sectionFiles) => {
    if (!searchFilter.trim()) return sectionFiles;
    return sectionFiles.filter((f) =>
      f.label.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  const exportToExcel = () => {
    const data = rolls.map((roll, i) => ({
      SL: i + 1,
      "Roll Type": roll.rollType,
      "Created Date": moment(roll.createdDate).format("YYYY-MM-DD"),
      "Pages Granted": getGrantedCount(roll.rollType),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roles");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Roles_${moment().format("YYYYMMDD")}.xlsx`);
  };

  const filteredRolls = rolls.filter((r) =>
    r.rollType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Loading / Permission guard ────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <Spinner animation="border" variant="success" />
        <p style={{ marginTop: 12, color: "#666" }}>Loading roles & permissions...</p>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(fileName)) {
    return (
      <div style={styles.accessDenied}>
        <MdSecurity size={64} color="#ef4444" />
        <h3>Access Denied</h3>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" autoClose={2500} />

      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <FaShieldAlt style={{ marginRight: 10, color: "#8BC34A" }} />
            Roles & Access Control
          </h2>
          <p style={styles.subtitle}>Manage roles and control page-level permissions</p>
        </div>
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === "roles" ? styles.tabActive : {}) }}
            onClick={() => setActiveTab("roles")}
          >
            Manage Roles
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === "access" ? styles.tabActive : {}) }}
            onClick={() => setActiveTab("access")}
          >
            Page Permissions
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TAB 1 — ROLE MANAGEMENT
      ══════════════════════════════════════════ */}
      {activeTab === "roles" && (
        <div>
          {/* Create / Edit form */}
          <div style={styles.card}>
            <h5 style={styles.cardTitle}>
              {editingRoll ? "✏️ Edit Role" : "➕ Create New Role"}
            </h5>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Role Name</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. super_admin, editor..."
                  value={rollType}
                  onChange={(e) => setRollType(e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Created Date</label>
                <input
                  style={styles.input}
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <button
                  style={styles.btnGreen}
                  onClick={editingRoll ? updateRoll : createRoll}
                >
                  {editingRoll ? <><FaSave /> Update</> : <><FaPlus /> Create</>}
                </button>
                {editingRoll && (
                  <button
                    style={styles.btnGray}
                    onClick={() => { setEditingRoll(null); setRollType(""); setCreateDate(""); }}
                  >
                    <FaTimes /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Roles Table */}
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h5 style={styles.cardTitle}>All Roles ({filteredRolls.length})</h5>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...styles.input, width: 200 }}
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button style={styles.btnBlue} onClick={exportToExcel}>Export Excel</button>
              </div>
            </div>
            <div style={styles.tableWrapper} ref={printRef}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Role Name</th>
                    <th style={styles.th}>Created Date</th>
                    <th style={styles.th}>Pages Granted</th>
                    <th style={styles.th}>Quick Access</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRolls.map((roll, idx) => (
                    <tr key={roll._id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.td}>{idx + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.roleBadge}>{roll.rollType}</span>
                      </td>
                      <td style={styles.td}>{new Date(roll.createdDate).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <span style={styles.countBadge}>
                          {getGrantedCount(roll.rollType)} / {ALL_FILES.length}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.btnAccess}
                          onClick={() => { setSelectedRole(roll.rollType); setActiveTab("access"); }}
                        >
                          <MdSecurity /> Manage Access
                        </button>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{ cursor: "pointer", color: "#3B82F6", marginRight: 12 }}
                          onClick={() => editRoll(roll)}
                        >
                          <FaEdit size={16} />
                        </span>
                        <span
                          style={{ cursor: "pointer", color: "#EF4444" }}
                          onClick={() => deleteRoll(roll._id)}
                        >
                          <MdDeleteForever size={20} />
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRolls.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#aaa" }}>
                        No roles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2 — PAGE PERMISSIONS
      ══════════════════════════════════════════ */}
      {activeTab === "access" && (
        <div>
          {/* Role selector pills */}
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h5 style={styles.cardTitle}>Select Role to Configure</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {rolls.map((roll) => (
                    <button
                      key={roll._id}
                      style={{
                        ...styles.rolePill,
                        ...(selectedRole === roll.rollType ? styles.rolePillActive : {}),
                      }}
                      onClick={() => setSelectedRole(roll.rollType)}
                    >
                      {roll.rollType}
                      <span style={styles.pillCount}>
                        {getGrantedCount(roll.rollType)}/{ALL_FILES.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  style={{ ...styles.input, width: 220 }}
                  placeholder="Filter pages..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <button
                  style={styles.btnBlue}
                  onClick={() => { fetchPermissions(); localStorage.removeItem("rolePermissions"); }}
                >
                  <FaSync /> Refresh
                </button>
              </div>
            </div>
          </div>

          {!selectedRole ? (
            <div style={styles.noRoleMsg}>
              <FaShieldAlt size={48} color="#ccc" />
              <p>Select a role above to configure its page access</p>
            </div>
          ) : (
            <div>
              {/* Global controls */}
              <div style={styles.globalBar}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <h5 style={{ margin: 0 }}>
                    Configuring: <span style={{ color: "#8BC34A" }}>{selectedRole}</span>
                  </h5>
                  <span style={styles.grantedInfo}>
                    {getGrantedCount(selectedRole)} of {ALL_FILES.length} pages granted
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={styles.btnGreen}
                    onClick={() => handleSelectAll(selectedRole, true)}
                    disabled={saving}
                  >
                    ✅ Grant All
                  </button>
                  <button
                    style={styles.btnRed}
                    onClick={() => handleSelectAll(selectedRole, false)}
                    disabled={saving}
                  >
                    ❌ Revoke All
                  </button>
                </div>
              </div>

              {/* Sections */}
              {sections.map((section) => {
                const sectionFiles = filteredFiles(grouped[section]);
                if (sectionFiles.length === 0) return null;
                const sectionColor = SECTION_COLORS[section] || "#6B7280";
                const allChecked = isSectionAllChecked(selectedRole, grouped[section]);
                const partial = isSectionPartialChecked(selectedRole, grouped[section]);
                const isExpanded = expandedSections[section] !== false; // default expanded

                return (
                  <div key={section} style={styles.sectionCard}>
                    {/* Section header */}
                    <div
                      style={{ ...styles.sectionHeader, borderLeftColor: sectionColor, cursor: "pointer" }}
                      onClick={() => toggleSection(section)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => { if (el) el.indeterminate = partial; }}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectAllSection(selectedRole, grouped[section], !allChecked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{section}</span>
                        <span style={{ ...styles.sectionBadge, background: sectionColor }}>
                          {grouped[section].filter((f) => isChecked(selectedRole, f.key)).length}/{grouped[section].length}
                        </span>
                      </div>
                      <span style={{ color: "#888", fontSize: 13 }}>
                        {isExpanded ? "▲ Collapse" : "▼ Expand"}
                      </span>
                    </div>

                    {/* Section rows */}
                    {isExpanded && (
                      <div style={styles.sectionBody}>
                        {sectionFiles.map((file) => (
                          <div
                            key={file.key}
                            style={{
                              ...styles.fileRow,
                              background: isChecked(selectedRole, file.key) ? "#f0fdf4" : "#fff",
                              borderLeft: isChecked(selectedRole, file.key) ? `3px solid ${sectionColor}` : "3px solid transparent",
                            }}
                          >
                            <label style={styles.fileLabel}>
                              <input
                                type="checkbox"
                                checked={isChecked(selectedRole, file.key)}
                                onChange={() => handleCheckbox(selectedRole, file.key)}
                                style={{ width: 15, height: 15, cursor: "pointer", marginRight: 10 }}
                              />
                              <span style={{ fontSize: 14 }}>{file.label}</span>
                            </label>
                            <span style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>
                              {file.key}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────
const styles = {
  page: {
    padding: "20px",
    background: "#F0F2F5",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
  },
  loadingWrapper: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "60vh",
  },
  accessDenied: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "60vh", gap: 16, color: "#555",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24, flexWrap: "wrap", gap: 16,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" },
  subtitle: { margin: "4px 0 0", color: "#888", fontSize: 14 },
  tabBar: { display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  tabBtn: {
    border: "none", background: "transparent", padding: "8px 20px",
    borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#666", transition: "all 0.2s",
  },
  tabActive: { background: "#8BC34A", color: "#fff" },
  card: {
    background: "#fff", borderRadius: 12, padding: "20px 24px",
    marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
  },
  cardTitle: { margin: "0 0 16px", fontWeight: 700, fontSize: 16, color: "#333" },
  formRow: { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" },
  formGroup: { display: "flex", flexDirection: "column", flex: 1, minWidth: 200 },
  label: { fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 },
  input: {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 14px",
    fontSize: 14, outline: "none", transition: "border 0.2s",
  },
  tableWrapper: { overflowX: "auto", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  thead: { background: "#f8fafc" },
  th: {
    padding: "12px 16px", textAlign: "left", fontWeight: 700,
    color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap",
  },
  td: { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", color: "#374151" },
  trEven: { background: "#fff" },
  trOdd: { background: "#fafbfc" },
  roleBadge: {
    background: "#eff6ff", color: "#3B82F6", padding: "3px 10px",
    borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  countBadge: {
    background: "#f0fdf4", color: "#16a34a", padding: "3px 10px",
    borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  btnGreen: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#8BC34A", color: "#fff", border: "none",
    padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnRed: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#ef4444", color: "#fff", border: "none",
    padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnBlue: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#3B82F6", color: "#fff", border: "none",
    padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnGray: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#6B7280", color: "#fff", border: "none",
    padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  btnAccess: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #86efac",
    padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13,
  },
  rolePill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "#f1f5f9", color: "#374151", border: "2px solid #e2e8f0",
    padding: "7px 16px", borderRadius: 24, cursor: "pointer", fontWeight: 600, fontSize: 14,
    transition: "all 0.2s",
  },
  rolePillActive: {
    background: "#8BC34A", color: "#fff", borderColor: "#8BC34A",
  },
  pillCount: {
    background: "rgba(0,0,0,0.12)", padding: "1px 7px",
    borderRadius: 12, fontSize: 11,
  },
  noRoleMsg: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 60, color: "#aaa", gap: 12,
  },
  globalBar: {
    background: "#fff", borderRadius: 10, padding: "14px 20px",
    marginBottom: 16, display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  grantedInfo: {
    background: "#eff6ff", color: "#3B82F6", padding: "4px 12px",
    borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  sectionCard: {
    background: "#fff", borderRadius: 10, marginBottom: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden",
  },
  sectionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 18px", borderLeft: "4px solid #8BC34A",
    background: "#fafafa",
  },
  sectionBadge: {
    color: "#fff", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
  },
  sectionBody: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 1, padding: "8px 12px 12px",
  },
  fileRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 12px", borderRadius: 6, margin: "2px 0",
    transition: "background 0.15s",
  },
  fileLabel: {
    display: "flex", alignItems: "center", cursor: "pointer",
    flex: 1, margin: 0,
  },
};

export default UserRolls;