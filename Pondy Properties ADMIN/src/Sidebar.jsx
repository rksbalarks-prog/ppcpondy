import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  FaSignInAlt, FaClipboardList, FaBell, FaUsers, FaBuilding,
  FaCar, FaMoneyBill, FaMapMarkedAlt, FaFileInvoice,
  FaPhoneAlt, FaCogs, FaChartBar, FaRegUserCircle, FaTools,
  FaListAlt, FaTrashAlt, FaSearch, FaPlusCircle, FaUserShield,
  FaFileAlt, FaUserCheck, FaUserClock, FaUserTimes, FaDownload,
  FaChartLine, FaUser, FaMoneyBillAlt, FaPhone, FaRegQuestionCircle,
  FaEye, FaCity, FaUserCog,
} from "react-icons/fa";
import {
  RiAccountCircleFill, RiBankCard2Fill, RiBarChart2Fill, RiCaravanFill,
  RiCellphoneFill, RiDashboardHorizontalFill, RiExchangeFill, RiFileListFill,
  RiGroupFill, RiHandCoinFill, RiLayoutFill, RiNewspaperFill, RiQuestionAnswerFill,
  RiRoadMapFill, RiSettings5Fill, RiShieldUserFill, RiTicket2Fill, RiUserFill,
  RiUserSettingsFill, RiCarFill,
} from "react-icons/ri";
import { FcStatistics } from "react-icons/fc";
import { IoLogInSharp } from "react-icons/io5";
import { MdReport, MdHelp, MdContactMail, MdBusiness, MdNotifications, MdSecurity } from "react-icons/md";
import { FaImages, FaPhotoFilm } from "react-icons/fa6";
import logo from "./logo.jpg";
import useSidebarCounts from "./hooks/useSidebarCounts";
import { getAdminBase, adminBaseLabel } from "./utils/adminBase";
import "./App.css";

// ─── Key mapping: matches ALL_FILES keys in UserRolls.jsx ───────────────────
// Each menu item declares which permission key it needs.
// If the user's role has that key, the item is shown; otherwise hidden.

// Inline pill badge shown next to a NavLink. Renders nothing until the count
// is known so we don't flash a "0" before the request completes.
const CountBadge = ({ value }) => {
  if (value === undefined || value === null) return null;
  return (
    <span
      className="ms-2 px-2 rounded-pill"
      style={{
        background: "rgba(255,255,255,0.18)",
        color: "#fff",
        fontSize: "0.72rem",
        fontWeight: 600,
        lineHeight: "1.4",
        minWidth: "22px",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [openSection, setOpenSection] = useState(null);
  const [allowedFiles, setAllowedFiles] = useState(null); // null = loading, [] = no permissions fetched yet
  const { counts } = useSidebarCounts();

  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  // ── Fetch role permissions on mount / role change ──────────────────
  useEffect(() => {
    const fetchPermissions = async () => {
      // Try cache first for instant render
      const cached = localStorage.getItem("rolePermissions");
      if (cached) {
        try {
          const perms = JSON.parse(cached);
          const rolePerms = perms.find((p) => p.role === adminRole);
          setAllowedFiles(rolePerms?.viewedFiles?.map((f) => f.trim()) || []);
        } catch (_) {}
      }

      // Always refresh from server
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        localStorage.setItem("rolePermissions", JSON.stringify(res.data));
        const rolePerms = res.data.find((p) => p.role === adminRole);
        setAllowedFiles(rolePerms?.viewedFiles?.map((f) => f.trim()) || []);
      } catch (_) {}
    };

    if (adminRole) fetchPermissions();
    else setAllowedFiles([]); // no role → no items
  }, [adminRole]);

  // ── Listen for real-time permission updates ───────────────────────
  // This listens for both storage events (from other tabs) and custom events (from same tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "rolePermissions" && adminRole) {
        try {
          const perms = JSON.parse(e.newValue || "[]");
          const rolePerms = perms.find((p) => p.role === adminRole);
          setAllowedFiles(rolePerms?.viewedFiles?.map((f) => f.trim()) || []);
        } catch (_) {}
      }
    };

    // Listen for storage changes from other tabs
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom event from same tab (UserRolls)
    const handlePermissionsUpdated = () => {
      const updated = localStorage.getItem("rolePermissions");
      if (updated && adminRole) {
        try {
          const perms = JSON.parse(updated);
          const rolePerms = perms.find((p) => p.role === adminRole);
          setAllowedFiles(rolePerms?.viewedFiles?.map((f) => f.trim()) || []);
        } catch (_) {}
      }
    };

    window.addEventListener("permissionsUpdated", handlePermissionsUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("permissionsUpdated", handlePermissionsUpdated);
    };
  }, [adminRole]);

  const toggleSection = (sectionName) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
  };

  // ── Permission check ───────────────────────────────────────────────
  // If allowedFiles is null (still loading), show all items (graceful fallback).
  // If allowedFiles is an empty array, hide all items.
  const can = (key) => {
    if (allowedFiles === null) return true; // loading, show all
    return allowedFiles.includes(key.trim());
  };

  // ── Helper: only render section if ≥1 child is visible ───────────
  const sectionVisible = (keys) => keys.some((k) => can(k));

  return (
    <div className={`sidebar ${isOpen ? "sidebar-open" : ""} p-3 m-3`}>
      <div className="d-flex align-items-center">
        <img src={logo} alt="" className="img-fluid logo-size" />
        <h1 className="gradient-text ms-3" style={{ color: "linear-gradient(195deg, rgb(73, 163, 241), rgb(26, 115, 232))" }}>
          PPC
        </h1>
      </div>
      {/* Active city scope (ALL/PY/CH) chosen at login. */}
      <div
        className="text-center mb-1"
        style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6c757d" }}
      >
        📍 {adminBaseLabel(getAdminBase())}
      </div>
      <hr />
      <nav>
        <ul>

          {/* ── DASHBOARD ── */}
          {sectionVisible(["Statistics", "Property DailyReport", "Detail Property DailyReport", "Property Payment DailyReport", "Buyer Assistant DailyReport"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("Dashboard")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <RiDashboardHorizontalFill size={20} style={{ marginRight: "10px" }} />Dashboard
              </li>
              <ul className={openSection === "Dashboard" ? "show" : "collapse"}>
                {can("Statistics") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/statistics" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FcStatistics size={20} /> Statistics
                    </NavLink>
                  </li>
                )}
                {can("Property DailyReport") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/daily-report" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaUsers /> Property Daily Report
                    </NavLink>
                  </li>
                )}
                {can("Detail Property DailyReport") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/detail-daily-report" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaUsers /> Details Daily Report
                    </NavLink>
                  </li>
                )}
                {can("Property Payment DailyReport") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/payment-daily-report" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaUsers /> Payment Property Daily Report
                    </NavLink>
                  </li>
                )}
                {can("Buyer Assistant DailyReport") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/assist-subscriber" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaUsers /> BA Daily Report
                    </NavLink>
                  </li>
                )}
              </ul>
            </>
          )}

          {/* ── REPORT ── */}
          {sectionVisible(["Login Report", "Login Users Datas", "Users Log", "Login Separate User", "Admin Report", "PPC Staff Report", "Download History"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("Report")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <MdReport size={20} style={{ marginRight: "10px" }} /> Report
              </li>
              <ul className={openSection === "Report" ? "show" : "collapse"}>
                {can("Login Report") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/loginreport" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <IoLogInSharp size={20} /> Login Report
                    </NavLink>
                  </li>
                )}
                {can("Login Users Datas") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/login-user-datas" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaUser size={20} /> Login Users Datas
                    </NavLink>
                  </li>
                )}
                {can("Users Log") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/user-log" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <RiFileListFill size={20} /> Login User Views Pages
                    </NavLink>
                  </li>
                )}
                {can("Login Separate User") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/separate-login-user" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaUser size={20} /> Login Datas Separate Users
                    </NavLink>
                  </li>
                )}
                {can("Admin Report") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/adminreport" className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaSignInAlt size={20} /> Admin Report
                    </NavLink>
                  </li>
                )}
                {can("PPC Staff Report") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/ppc-staff-report" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaSignInAlt size={20} /> PPC Staff Report
                    </NavLink>
                  </li>
                )}
                {can("Download History") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/download-history" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaDownload size={20} /> Download History
                    </NavLink>
                  </li>
                )}
              </ul>
            </>
          )}

          {/* ── LOGIN DIRECT ── */}
          {sectionVisible(["Login Verify Directly", "MyAccount", "PUC Property", "Apply OnDemad Property", "Set PPCID"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("LoginDirect")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <MdReport size={20} style={{ marginRight: "10px" }} /> Login Direct
              </li>
              <ul className={openSection === "LoginDirect" ? "show" : "collapse"}>
                {can("Login Verify Directly") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/login-direct-user" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <IoLogInSharp size={20} /> Direct Login User
                    </NavLink>
                  </li>
                )}
                {can("MyAccount") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/my-account" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <RiUserSettingsFill size={20} /> My Account
                    </NavLink>
                  </li>
                )}
                {can("PUC Property") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/puc-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaFileInvoice /> PUC Property
                    </NavLink>
                  </li>
                )}
                {can("Apply OnDemad Property") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/apply-on-demand" className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaPlusCircle /> Set As On Demand Property
                    </NavLink>
                  </li>
                )}
                {can("Set PPCID") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/set-ppcid" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaFileInvoice /> Set PPCID Property
                    </NavLink>
                  </li>
                )}
              </ul>
            </>
          )}

          {/* ── NOTIFICATION ── */}
          {sectionVisible(["Admin Notification", "Notification Send", "Push Notifications"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("Notification")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaBell size={20} style={{ marginRight: "10px" }} /> Notification
              </li>
              <ul className={openSection === "Notification" ? "show" : "collapse"}>
                {can("Admin Notification") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/admin-notification" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaBell size={20} /> Admin Notification
                    </NavLink>
                  </li>
                )}
                {can("Notification Send") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/notification-send" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaFileAlt /> Notification Send Form
                    </NavLink>
                  </li>
                )}
                {can("Push Notifications") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/push-notifications" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaBell size={20} /> 📣 Push Notifications
                    </NavLink>
                  </li>
                )}
              </ul>
            </>
          )}

          {/* ── OFFICE SETUP ── */}
          {sectionVisible(["Office", "Users", "AddPlan", "BuyerPlan", "Payment Type", "State", "District", "City", "Area", "Roll", "AdminLog", "Text Editer", "AdminSetForm", "Get User Profile"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("Office")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaBuilding size={20} style={{ marginRight: "10px" }} /> Office Setup
              </li>
              <ul className={openSection === "Office" ? "show" : "collapse"}>
                {can("Office") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/office" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaBuilding size={20} /> Office</NavLink></li>
                )}
                {can("Users") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/users" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers size={20} /> Users</NavLink></li>
                )}
                {can("AddPlan") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/plan" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaClipboardList size={20} /> Plan</NavLink></li>
                )}
                {can("BuyerPlan") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/buyerplan" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaClipboardList size={20} /> Buyer Plan</NavLink></li>
                )}
                {can("Payment Type") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/paymenttype" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaMoneyBill size={20} /> Payment Type</NavLink></li>
                )}
                {can("State") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/state" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaMapMarkedAlt /> State</NavLink></li>
                )}
                {can("District") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/district" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaMapMarkedAlt /> District</NavLink></li>
                )}
                {can("City") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/city" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaMapMarkedAlt /> City</NavLink></li>
                )}
                {can("Area") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/area" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaMapMarkedAlt /> Area</NavLink></li>
                )}
                {can("Roll") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/rolls" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUserShield /> Rolls</NavLink></li>
                )}
                {can("AdminLog") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/adminlog" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Admin Log</NavLink></li>
                )}
                {can("Text Editer") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/text-editor" className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaPlusCircle /> Text Editors</NavLink></li>
                )}
                {can("AdminSetForm") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/set-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Admin Set Property</NavLink></li>
                )}
                {can("Get User Profile") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/profile-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Get User Profile</NavLink></li>
                )}
              </ul>
            </>
          )}

          {/* ── BUYER ASSISTANT ── */}
          {sectionVisible(["Add Buyer Assistance", "Get Buyer Assistances", "Buyer Active Assistant", "Pending Assistant", "Buyer Assistant Viewed", "Expired Assistant", "Removed Buyer Assistant", "All Buyer Bills", "BaFree Bills", "BaPaid Bill"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("BuyerAssistant")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaUser style={{ marginRight: "10px" }} /> Buyer Assistant
              </li>
              <ul className={openSection === "BuyerAssistant" ? "show" : "collapse"}>
                {can("Add Buyer Assistance") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/add-buyer-assistance" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Add Buyers Assistance</NavLink></li>
                )}
                {can("Get Buyer Assistances") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/get-buyer-assistance" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Manage All Buyer Assistance</NavLink></li>
                )}
                {can("Buyer Active Assistant") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/active-buyer-assistant" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Approved - Buyer Assistance<CountBadge value={counts["Buyer Active Assistant"]} /></NavLink></li>
                )}
                {can("Pending Assistant") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/pending-assistant" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Pending - Buyer Assistance<CountBadge value={counts["Pending Assistant"]} /></NavLink></li>
                )}
                {can("Buyer Assistant Viewed") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/get-all-buyerlist-viewed" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Buyer Assistant Viewed User</NavLink></li>
                )}
                {can("Expired Assistant") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/expired-assistant" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Expired Assistant<CountBadge value={counts["Expired Assistant"]} /></NavLink></li>
                )}
                {can("Removed Buyer Assistant") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/removed-buyer-assistant" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Removed Buyer Assistant<CountBadge value={counts["Removed Buyer Assistant"]} /></NavLink></li>
                )}
                {can("All Buyer Bills") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/all-buyer-bills" className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Get All Buyer Office Bills</NavLink></li>
                )}
                {can("BaFree Bills") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/ba-free-bills" className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Buyer Free Office Bills</NavLink></li>
                )}
                {can("BaPaid Bill") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/ba-paid-bills" className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Buyer Paid Office Bills</NavLink></li>
                )}
              </ul>
            </>
          )}

          {/* ── PPC PROPERTY ── */}
          {sectionVisible(["Search Property", "Pricing Info", "Add Property", "Bulk Upload Property", "Manage Property", "Approved Property", "PreApproved Property", "Pending Property", "Removed Property", "Expire Property", "Delete Properties", "Feature Property", "Paid Property", "Free Property", "Set Property Message", "Fetch All Address", "Get All Property Datas"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("PPCProperty")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaBuilding size={20} style={{ marginRight: "10px" }} /> PPC Property
              </li>
              <ul className={openSection === "PPCProperty" ? "show" : "collapse"}>
                {can("Search Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/searchcar" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaSearch /> Search Property</NavLink></li>
                )}
                {can("Pricing Info") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/pricing-info" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaMoneyBillAlt /> Pricing Info</NavLink></li>
                )}
                {can("Add Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/add-car" className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaPlusCircle /> Add Property</NavLink></li>
                )}
                {(can("Add Property") || can("Bulk Upload Property")) && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/bulk-upload-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Bulk Upload Property</NavLink></li>
                )}
                {can("Manage Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/property-list" className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaPlusCircle /> Manage Properties</NavLink></li>
                )}
                {can("Approved Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/approved-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUserCheck /> Approved Property<CountBadge value={counts["Approved Property"]} /></NavLink></li>
                )}
                {can("PreApproved Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/preapproved-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUserCheck /> PreApproved Property<CountBadge value={counts["PreApproved Property"]} /></NavLink></li>
                )}
                {can("Pending Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/pending-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUserClock /> Pending Property<CountBadge value={counts["Pending Property"]} /></NavLink></li>
                )}
                {can("Removed Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/removed-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaTrashAlt /> Removed Property<CountBadge value={counts["Removed Property"]} /></NavLink></li>
                )}
                {can("Expire Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/expire-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUserTimes /> Expired Property</NavLink></li>
                )}
                {can("Delete Properties") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/deleted-properties" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaTrashAlt /> Permanent Deleted Property</NavLink></li>
                )}
                {can("Feature Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/feature-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Featured Property<CountBadge value={counts["Feature Property"]} /></NavLink></li>
                )}
                {can("Paid Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/paid-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Paid Property<CountBadge value={counts["Paid Property"]} /></NavLink></li>
                )}
                {can("Free Property") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/free-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Free Property<CountBadge value={counts["Free Property"]} /></NavLink></li>
                )}
                {can("Set Property Message") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/set-property-message" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Set Property Message</NavLink></li>
                )}
                {can("Fetch All Address") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/fetch-all-address" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser /> Get All Properties Address</NavLink></li>
                )}
                {can("Get All Property Datas") && (
                  <li className="p-0 mt-2"><NavLink to="/dashboard/get-all-property-datas" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser /> Get All Property Datas</NavLink></li>
                )}
              </ul>
            </>
          )}

          {/* ── PPC PROP ACCOUNTS ── */}
          {sectionVisible(["Free Bills", "Paid Bills", "Payment Success", "Payment Failed", "Payment PayNow", "Payment PayLater", "All Bills", "Upload Groom", "Upload Bride", "Upload Ads Images", "Upload Detail Ads Images"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("Accounts")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaCar style={{ marginRight: "10px" }} /> PPC prop Accounts
              </li>
              <ul className={openSection === "Accounts" ? "show" : "collapse"}>
                {can("Free Bills") && (<li className="p-0 mt-2"><NavLink to="/dashboard/free-bills" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Free Bills</NavLink></li>)}
                {can("Paid Bills") && (<li className="p-0 mt-2"><NavLink to="/dashboard/paid-bills" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Paid Bills</NavLink></li>)}
                {can("Payment Success") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-success" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Payment Paid Success</NavLink></li>)}
                {can("Payment Failed") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-failed" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Payment Paid Failed</NavLink></li>)}
                {can("Payment PayNow") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-paynow" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Payment Pay Now</NavLink></li>)}
                {can("Payment PayLater") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-paylater" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Payment Pay Later</NavLink></li>)}
                {can("All Bills") && (<li className="p-0 mt-2"><NavLink to="/dashboard/all-bills" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> All Bills Datas</NavLink></li>)}
                {can("Upload Groom") && (<li className="p-0 mt-2"><NavLink to="/dashboard/upload-images-groom" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaImages /> Upload Groom</NavLink></li>)}
                {can("Upload Bride") && (<li className="p-0 mt-2"><NavLink to="/dashboard/upload-images-bride" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaImages /> Upload Bride</NavLink></li>)}
                {can("Upload Ads Images") && (<li className="p-0 mt-2"><NavLink to="/dashboard/upload-images-ads" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaImages /> Upload Ads Images</NavLink></li>)}
                {can("Upload Detail Ads Images") && (<li className="p-0 mt-2"><NavLink to="/dashboard/upload-images-ads-detail" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaImages /> Upload Detail Ads Images</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── POINTS PRICING ── */}
          {sectionVisible(["Points Plans", "Points Users", "Points Transactions", "Points PayLater", "Points PayU", "Points Settings", "Points Refunds"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("PointsPricing")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <RiHandCoinFill size={20} style={{ marginRight: "10px" }} /> Points Pricing
              </li>
              <ul className={openSection === "PointsPricing" ? "show" : "collapse"}>
                {can("Points Plans") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-plans" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiTicket2Fill size={20} /> Points Plans - List</NavLink></li>)}
                {can("Points Users") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-users" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiGroupFill size={20} /> Points Users &amp; Balance</NavLink></li>)}
                {can("Points Transactions") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-transactions" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiFileListFill size={20} /> Points Transactions</NavLink></li>)}
                {can("Points PayLater") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-paylater" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiNewspaperFill size={20} /> Points Pay Later Leads</NavLink></li>)}
                {can("Points PayU") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-payu" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiBankCard2Fill size={20} /> Points PayU Records</NavLink></li>)}
                {can("Points Refunds") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-refunds" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiExchangeFill size={20} /> Points Refund Requests</NavLink></li>)}
                {can("Points Settings") && (<li className="p-0 mt-2"><NavLink to="/dashboard/points-settings" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiSettings5Fill size={20} /> Points Settings</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── CUSTOMER CARE ── */}
          {sectionVisible(["Customer Care", "Help Request Table", "Report Property Table", "SoldOut Table", "CalledList Datas"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("CustomerCare")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaPhone style={{ marginRight: "10px" }} /> Customer Care
              </li>
              <ul className={openSection === "CustomerCare" ? "show" : "collapse"}>
                {can("Customer Care") && (<li className="p-0 mt-2"><NavLink to="/dashboard/customer-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Customer Care</NavLink></li>)}
                {can("Help Request Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/needhelp-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received Need Help</NavLink></li>)}
                {can("Report Property Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/report-property-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received Report Property</NavLink></li>)}
                {can("SoldOut Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/soldout-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received SoldOut Request</NavLink></li>)}
                {can("CalledList Datas") && (<li className="p-0 mt-2"><NavLink to="/dashboard/call-exprience" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> User Called Experience Datas</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── PROPERTY LIST ── */}
          {sectionVisible(["Developer Property", "Owner Property", "Promotor Property", "Agent Property", "PostBy Property", "Py Property"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("PropertyList")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaCar style={{ marginRight: "10px" }} /> Property List
              </li>
              <ul className={openSection === "PropertyList" ? "show" : "collapse"}>
                {can("Developer Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/developer-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Developer Property</NavLink></li>)}
                {can("Owner Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/dealer-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Owner Property</NavLink></li>)}
                {can("Promotor Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/promotor-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Promotor Property</NavLink></li>)}
                {can("Agent Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/agent-car" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Agent Property</NavLink></li>)}
                {can("PostBy Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/postby-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser /> PostedBy Properties</NavLink></li>)}
                {can("Py Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/py-properties" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaListAlt /> Py Properties</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── BUYER PAYU ── */}
          {sectionVisible(["Buyer Payment Success", "Buyer Payment Failed", "Buyer Payment PayNow", "Buyer Payment PayLater"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("BuyerPayU")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaCar style={{ marginRight: "10px" }} /> Buyer PayU
              </li>
              <ul className={openSection === "BuyerPayU" ? "show" : "collapse"}>
                {can("Buyer Payment Success") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-success-buyer" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Buyer Assistant Paid Success</NavLink></li>)}
                {can("Buyer Payment Failed") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-failed-buyer" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Buyer Assistant Paid Failed</NavLink></li>)}
                {can("Buyer Payment PayNow") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-paynow-buyer" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Buyer Assistant Pay Now</NavLink></li>)}
                {can("Buyer Payment PayLater") && (<li className="p-0 mt-2"><NavLink to="/dashboard/payment-paylater-buyer" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Buyer Assistant Pay Later</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── CUSTOMER DIRECT PAYU ── */}
          {sectionVisible(["Customer Direct Paid", "Customer Direct Failed"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("CustomerDirectPayU")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaFileInvoice style={{ marginRight: "10px" }} /> Customer direct PayU
              </li>
              <ul className={openSection === "CustomerDirectPayU" ? "show" : "collapse"}>
                {can("Customer Direct Paid") && (<li className="p-0 mt-2"><NavLink to="/dashboard/customer-direct-paid" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Paid</NavLink></li>)}
                {can("Customer Direct Failed") && (<li className="p-0 mt-2"><NavLink to="/dashboard/customer-direct-failed" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> Failed</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── BUSINESS SUPPORT ── */}
          {sectionVisible(["Search Data", "BuyerList Interest", "Interest Table", "Contact Table", "Called List", "ShortList Favorite Table", "ShortList FavoriteRemoved Table", "Viewed Property Table", "Matched Property Table", "LastViewed Property", "Offers Raised Table", "PhotoRequest Table", "Address Request", "All Views Datas"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("BusinessSupport")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaUser style={{ marginRight: "10px" }} /> Bussiness Support prop
              </li>
              <ul className={openSection === "BusinessSupport" ? "show" : "collapse"}>
                {can("Search Data") && (<li className="p-0 mt-2"><NavLink to="/dashboard/searched-data" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaClipboardList /> Searched Data</NavLink></li>)}
                {can("BuyerList Interest") && (<li className="p-0 mt-2"><NavLink to="/dashboard/buyerlist-interest" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaListAlt /> Buyers List - Interest</NavLink></li>)}
                {can("Interest Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/interest-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received Interest</NavLink></li>)}
                {can("Contact Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/contact-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received Contact Request Datas</NavLink></li>)}
                {can("Called List") && (<li className="p-0 mt-2"><NavLink to="/dashboard/called-list-datas" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Called List Datas</NavLink></li>)}
                {can("ShortList Favorite Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/favorite-table" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received Favorite Datas</NavLink></li>)}
                {can("ShortList FavoriteRemoved Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/favorite-removed" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Received Favorite Removed datas</NavLink></li>)}
                {can("Viewed Property Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/viewed-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUsers /> Viewed Properties</NavLink></li>)}
                {can("Matched Property Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/get-matched-properties" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser /> Matched Properties</NavLink></li>)}
                {can("LastViewed Property") && (<li className="p-0 mt-2"><NavLink to="/dashboard/last-viewed-property" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaCar /> Last Viewed Property</NavLink></li>)}
                {can("Offers Raised Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/offers-raised" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileAlt /> Offers Raised</NavLink></li>)}
                {can("PhotoRequest Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/photo-request" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaRegQuestionCircle /> Photo Request</NavLink></li>)}
                {can("Address Request") && (<li className="p-0 mt-2"><NavLink to="/dashboard/get-all-address-request" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser /> Get Address Request Datas</NavLink></li>)}
                {can("All Views Datas") && (<li className="p-0"><NavLink to="/dashboard/all-views-datas" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaDownload /> All Views Datas</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── LEAD MENU ── */}
          {sectionVisible(["BaLoan Lead", "Buyer Assistance Loan Lead", "Help LoanLead", "New Property Lead", "FreeUser Lead", "Groom Click Datas", "Bride Click Datas"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("LeadMenu")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <RiBankCard2Fill size={20} style={{ marginRight: "10px" }} /> Lead Menu
              </li>
              <ul className={openSection === "LeadMenu" ? "show" : "collapse"}>
                {can("BaLoan Lead") && (<li className="p-0 mt-2"><NavLink to="/dashboard/property-loan-lead" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiRoadMapFill size={20} /> Property Loan Lead</NavLink></li>)}
                {can("Buyer Assistance Loan Lead") && (<li className="p-0 mt-2"><NavLink to="/dashboard/ba-loan-lead" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiTicket2Fill size={20} /> Buyer Assistance Loan Lead</NavLink></li>)}
                {can("Help LoanLead") && (<li className="p-0 mt-2"><NavLink to="/dashboard/help-loan-lead" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiQuestionAnswerFill size={20} /> Help Loan Lead</NavLink></li>)}
                {can("New Property Lead") && (<li className="p-0 mt-2"><NavLink to="/dashboard/new-car-lead" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiCarFill size={20} /> New Property Lead</NavLink></li>)}
                {can("FreeUser Lead") && (<li className="p-0 mt-2"><NavLink to="/dashboard/free-user-lead" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiUserFill size={20} /> Free User Lead</NavLink></li>)}
                {can("Groom Click Datas") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/groom-click-datas" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <span style={{ position: "relative", display: "inline-block", width: "20px", height: "20px" }}>
                        <FaUser style={{ position: "absolute", top: 0, left: 0, fontSize: "18px", color: "white" }} />
                        <FaPhotoFilm style={{ position: "absolute", bottom: -2, right: -2, fontSize: "13px", color: "white" }} />
                      </span>
                      User Click Groom Datas
                    </NavLink>
                  </li>
                )}
                {can("Bride Click Datas") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/bride-click-datas" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <span style={{ position: "relative", display: "inline-block", width: "20px", height: "20px" }}>
                        <FaUser style={{ position: "absolute", top: 0, left: 0, fontSize: "18px", color: "white" }} />
                        <FaPhotoFilm style={{ position: "absolute", bottom: -2, right: -2, fontSize: "13px", color: "white" }} />
                      </span>
                      User Click Bride Datas
                    </NavLink>
                  </li>
                )}
              </ul>
            </>
          )}

          {/* ── NO PROPERTY USERS ── */}
          {sectionVisible(["Without Property User", "Without 30 Days User", "Without All Statics"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("NoPropertyUsers")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaBuilding style={{ marginRight: "10px" }} /> No Property Users
              </li>
              <ul className={openSection === "NoPropertyUsers" ? "show" : "collapse"}>
                {can("Without Property User") && (<li className="p-0 mt-2"><NavLink to="/dashboard/without-property-user" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser size={20} /> Per Day Datas</NavLink></li>)}
                {can("Without 30 Days User") && (<li className="p-0 mt-2"><NavLink to="/dashboard/without-30-days-user" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser size={20} /> Get 30 Days Datas</NavLink></li>)}
                {can("Without All Statics") && (<li className="p-0 mt-2"><NavLink to="/dashboard/without-all-statics" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaUser size={20} /> Fetch All Statics</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── BUSINESS STATICS ── */}
          {sectionVisible(["Property Statics", "BuyerStatics", "PPCId Statics", "Usage Statics", "User Log", "Contact Usage", "Daily Usage"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("BusinessStatics")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <FaChartLine style={{ marginRight: "10px" }} /> Business Statics
              </li>
              <ul className={openSection === "BusinessStatics" ? "show" : "collapse"}>
                {can("Property Statics") && (<li className="p-0 mt-2"><NavLink to="/dashboard/carstatics" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiCarFill size={20} /> Property Statics</NavLink></li>)}
                {can("BuyerStatics") && (<li className="p-0 mt-2"><NavLink to="/dashboard/buyers-statics" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiGroupFill size={20} /> Buyers Statics</NavLink></li>)}
                {can("PPCId Statics") && (<li className="p-0 mt-2"><NavLink to="/dashboard/ppcid-statics" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiGroupFill size={20} /> PPC ID Statics</NavLink></li>)}
                {can("Usage Statics") && (<li className="p-0 mt-2"><NavLink to="/dashboard/usage-statics" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiBarChart2Fill size={20} /> Usage Statics</NavLink></li>)}
                {can("User Log") && (<li className="p-0 mt-2"><NavLink to="/dashboard/user-log" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiFileListFill size={20} /> User Log</NavLink></li>)}
                {can("Contact Usage") && (<li className="p-0 mt-2"><NavLink to="/dashboard/contact-usage" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiBarChart2Fill size={20} /> Contact Usage</NavLink></li>)}
                {can("Daily Usage") && (<li className="p-0 mt-2"><NavLink to="/dashboard/daily-usage" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiBarChart2Fill size={20} /> Daily Usage</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── FOLLOW UPS ── */}
          {sectionVisible(["Property FllowUp", "All Property FollowUp", "Buyer FllowUp", "Transfer FllowUps", "Transfer Assistant"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("FollowUps")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <RiNewspaperFill size={20} style={{ marginRight: "10px" }} /> Follow Ups
              </li>
              <ul className={openSection === "FollowUps" ? "show" : "collapse"}>
                {can("Property FllowUp") && (<li className="p-0 mt-2"><NavLink to="/dashboard/car-follow-ups" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiCaravanFill size={20} /> Property Follow Ups</NavLink></li>)}
                {can("All Property FollowUp") && (<li className="p-0 mt-2"><NavLink to="/dashboard/followup-list" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaFileInvoice /> All Property FollowUps Data</NavLink></li>)}
                {can("Buyer FllowUp") && (<li className="p-0 mt-2"><NavLink to="/dashboard/buyers-follow-ups" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiGroupFill size={20} /> All Buyers FollowUps Data</NavLink></li>)}
                {can("Transfer FllowUps") && (<li className="p-0 mt-2"><NavLink to="/dashboard/transfer-follow-ups" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiExchangeFill size={20} /> Transfer FollowUps</NavLink></li>)}
                {can("Transfer Assistant") && (<li className="p-0 mt-2"><NavLink to="/dashboard/transfer-assistant" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiHandCoinFill size={20} /> Transfer Assistant</NavLink></li>)}
              </ul>
            </>
          )}

          {/* ── SETTINGS ── */}
          {sectionVisible(["User Roles", "Admin OTP Number", "Limits", "Admin Views Table", "Profile"]) && (
            <>
              <li className="p-3 mt-2 text-white" onClick={() => toggleSection("Settings")}
                style={{ borderRadius: "5px", background: "#8BC34A", cursor: "pointer" }}>
                <RiSettings5Fill size={20} style={{ marginRight: "10px" }} /> Settings
              </li>
              <ul className={openSection === "Settings" ? "show" : "collapse"}>
                {can("User Roles") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/user-rolls" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <MdSecurity size={20} /> Roles &amp; Access
                    </NavLink>
                  </li>
                )}
                {can("Admin OTP Number") && (
                  <li className="p-0 mt-2">
                    <NavLink to="/dashboard/otp-numbers" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}>
                      <FaPhone size={20} /> Admin OTP Number
                    </NavLink>
                  </li>
                )}
                {can("Limits") && (<li className="p-0 mt-2"><NavLink to="/dashboard/limits" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiLayoutFill size={20} /> Limits</NavLink></li>)}
                {can("Admin Views Table") && (<li className="p-0 mt-2"><NavLink to="/dashboard/admin-views" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><FaEye size={20} /> Admin Views Table</NavLink></li>)}
                {can("Profile") && (<li className="p-0 mt-2"><NavLink to="/dashboard/profile" onClick={toggleSidebar} className={({ isActive }) => isActive ? "active-link rounded" : ""}><RiAccountCircleFill size={20} /> Profile</NavLink></li>)}
              </ul>
            </>
          )}

        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;