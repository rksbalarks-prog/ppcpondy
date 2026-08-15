 



import React, { useState, useEffect } from "react";
import { Navbar, Container, Dropdown } from "react-bootstrap";
import { FaBars, FaTimes, FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAdminBase, adminBaseLabel } from "./utils/adminBase";

const AppNavbar = ({ toggleSidebar }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [adminName, setAdminName] = useState(localStorage.getItem("adminName") || "");

  const navigate = useNavigate();

  const handleToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
    toggleSidebar();
  };

  // ✅ Static helper function
  const ensureSingleRefresh = () => {
    const hasRefreshed = sessionStorage.getItem("navbarRefreshed");
    if (!hasRefreshed) {
      sessionStorage.setItem("navbarRefreshed", "true");
      window.location.reload();
    }
  };

  // 🔄 Auto-refresh (only once per session)
  useEffect(() => {
    ensureSingleRefresh();
  }, []);

  // Fetch profile image
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/all-get-puc-profiles`);
        const matched = res.data.data.find((profile) => profile.name === adminName);
        if (matched && matched.profileImage) {
          setProfileImage(matched.profileImage);
        }
      } catch (err) {
        console.error("Profile fetch error", err);
      }
    };

    if (adminName) {
      fetchProfile();
    }
  }, [adminName]);

  const handleLogout = () => {
    // Clear the full persisted identity so the next load doesn't restore a
    // stale session (App.js rehydrates Redux from adminName/adminRole, and the
    // route guard checks adminToken).
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("rolePermissions");
    sessionStorage.removeItem("navbarRefreshed"); // allow refresh next login
    setAdminName("");
    navigate("/admin"); // redirect to login
  };

  return (
    <Navbar expand="md" className="shadow-sm bg-light p-3 mb-3">
      <Container fluid>
        <Navbar.Brand href="#" className="d-flex align-items-center">
          <span className="fw-bold text-primary"> Pondy Properties | Admin </span>
        </Navbar.Brand>

        <div
          className="d-flex align-items-center"
          style={{ marginLeft: "auto", paddingRight: "1rem", gap: "0.75rem" }}
        >
          {/* Active city scope (ALL / PY / CH) chosen at login. */}
          <span
            className="badge rounded-pill"
            style={{
              background: "#e7f1ff",
              color: "#1a73e8",
              fontWeight: 600,
              fontSize: "0.8rem",
              padding: "0.4rem 0.75rem",
            }}
            title="Active city scope (set at login)"
          >
            📍 {adminBaseLabel(getAdminBase())}
          </span>
          <span>
            Welcome, <strong>{adminName}</strong>
          </span>
        </div>

        <button
          className="border-0 bg-transparent d-md-none"
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <FaTimes size={25} className="text-primary" />
          ) : (
            <FaBars size={25} className="text-primary" />
          )}
        </button>

        {/* Profile Dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="light"
            id="dropdown-profile"
            className="border-0 bg-transparent d-flex align-items-center p-0"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                width="35"
                height="35"
                className="rounded-circle"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <FaUserCircle size={30} className="text-primary" />
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow rounded">
            <Dropdown.Item
              onClick={() => navigate("/dashboard/profile")}
              className="d-flex align-items-center"
            >
              <FaUserCircle className="me-2" /> Profile
            </Dropdown.Item>
            <Dropdown.Item href="#settings" className="d-flex align-items-center">
              <FaCog className="me-2" /> Settings
            </Dropdown.Item>
            <Dropdown.Item
              onClick={handleLogout}
              className="d-flex align-items-center text-danger"
            >
              <FaSignOutAlt className="me-2" /> Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
