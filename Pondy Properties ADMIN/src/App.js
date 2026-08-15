




import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Admin from "./Admin";
import Dashboard from "./Dashboard";
import EditProperty from "./EditProperty";
import GetForm from "./DataAddAdmin/GetForm";
import AdminSetForm from "./DataAddAdmin/AdminSetForm";
import Plan from "./Plan";
import Detail from "./Detail";
import GetBuyerAssistance from "./GetBuyerAssistance";
import PropertyAssistance from "./PropertyAssistance";
import PublicStaffReport from "./PublicStaffReport";
import RpWfhCallManagement from "./RpWfhCallManagement";
import RpWfhAdmin from "./RpWfhAdmin";
 
import { useDispatch } from 'react-redux';
import { setName } from './redux/adminSlice';
import { setRole } from './redux/adminSlice';
import { isAdminAuthed } from './utils/authToken';

// Route guard: only allow the dashboard / call-management pages when a valid
// (unexpired) admin token is present. Otherwise bounce to the login page.
const RequireAdmin = ({ children }) => {
  if (!isAdminAuthed()) return <Navigate to="/admin" replace />;
  return children;
};





const App = () => {

  
  const dispatch = useDispatch();


  useEffect(() => {
    // Rehydrate the admin identity from localStorage on every load so a page
    // refresh / tab reload doesn't drop the session. The keys MUST be
    // 'adminName' / 'adminRole' — the same keys Admin.jsx writes at login and
    // that the Sidebar/Navbar/table pages read. (The old code read 'name' /
    // 'role', which are never written anywhere, so Redux was never restored
    // and the UI looked logged out after any reload.)
    const name = localStorage.getItem('adminName');
    const role = localStorage.getItem('adminRole');

    if (name) {
      dispatch(setName(name));
    }
    if (role) {
      dispatch(setRole(role));
    }
  }, [dispatch]);
  


  
  return (
   

    <Router basename="/process">
    <Routes>
      <Route path="/admin" element={<Admin />} />
      {/* City-locked login pages, e.g. /login/chennai (CH) or /login/pondicherry (PY).
          The base is forced to that city, so the admin can only sign in to it
          and only sees that city's data. */}
      <Route path="/login/:city" element={<Admin />} />
      {/* PPC Call Management — standalone pages (no dashboard chrome).
          These must be declared BEFORE the catch-all /dashboard/* so React
          Router matches the more specific path and bypasses Dashboard. */}
      <Route path="/dashboard/ppc.wfh" element={<RequireAdmin><RpWfhCallManagement /></RequireAdmin>} />
      <Route path="/dashboard/ppc.wfh-admin" element={<RequireAdmin><RpWfhAdmin /></RequireAdmin>} />
      <Route path="/dashboard/*" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
      {/* Standalone public copy of the PPC Staff Report.
          Lives outside /dashboard/* so it bypasses the dashboard chrome
          (sidebar, header) and the role-permission gating. Anyone with
          the URL can view it. The original page at
          /dashboard/ppc-staff-report is unchanged. */}
      <Route
        path="/ppc-staff-report"
        element={
          <div style={{ padding: "20px", background: "#f3f4f6", minHeight: "100vh" }}>
            {/* Chooser landing — two buttons:
                  • "PPC Staff Report"  → inline render of PPCStaffReport
                                          (cards + action column hidden)
                  • "Rent Staff Report" → external redirect to rentpondy.com */}
            <PublicStaffReport />
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
    </Router>
    
  );
};

export default App;



















