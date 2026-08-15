import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import PhoneCell from "./components/PhoneCell";

const DirectLogoutUsers = () => {
  const [phoneInput, setPhoneInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoutUsers, setLogoutUsers] = useState([]);
  const [revokedUsers, setRevokedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const fileName = "Direct Logout Users";
  const [allowedRoles, setAllowedRoles] = useState([]);

  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  useEffect(() => {
    const recordView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
          userName: adminName,
          role: adminRole,
          viewedFile: fileName,
          viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } catch {}
    };

    if (adminName && adminRole) recordView();
  }, [adminName, adminRole]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const rolePerms = res.data.find((perm) => perm.role === adminRole);
        const viewed = rolePerms?.viewedFiles?.map((f) => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch {}
      finally {
        setLoading(false);
      }
    };

    if (adminRole) fetchPermissions();
  }, [adminRole]);

  const fetchLogoutUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/force-logout-users`);
      setLogoutUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching logged out users", err);
    }
  };

  const fetchRevokedUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/revoked-logout-users`);
      setRevokedUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching revoked users", err);
    }
  };

  useEffect(() => {
    fetchLogoutUsers();
    fetchRevokedUsers();
  }, []);

  const handleForceLogout = async () => {
    if (!phoneInput.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/force-logout`, {
        phone: phoneInput,
        adminName,
      });

      if (res.status === 200) {
        setMessage("User forcibly logged out.");
        setPhoneInput("");
        setError("");
        fetchLogoutUsers();
        fetchRevokedUsers();
      }
    } catch (err) {
      setError("Error forcing logout.");
    }
  };

  const handleRevokeLogout = async (phone) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/user/force-logout`, {
        data: {
          phone,
          adminName,
        },
      });
      setMessage(`Logout revoked for ${phone}`);
      fetchLogoutUsers();
      fetchRevokedUsers();
    } catch (err) {
      setError("Error revoking logout.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-danger fw-bold mt-5">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Force Logout Manager</h2>

      <div className="card p-3 shadow-sm mb-4">
        <h5>Enter Phone Number to Force Logout</h5>
        <div className="d-flex flex-column flex-md-row gap-3 align-items-center">
          <input
            type="number"
            className="form-control"
            placeholder="Enter phone number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            style={{ maxWidth: "300px" }}
          />
          <button className="btn btn-warning" onClick={handleForceLogout}>
            Force Logout
          </button>
        </div>
        {error && <p className="text-danger mt-2">{error}</p>}
        {message && <p className="text-success mt-2">{message}</p>}
      </div>

      <div className="card p-3 shadow-sm mb-4">
        <h5>Forced Logout Users ({logoutUsers.length})</h5>
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Phone</th>
                <th>Logout Date</th>
                <th>Logged Out By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logoutUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No forced logouts.</td>
                </tr>
              ) : (
                logoutUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td><PhoneCell phone={user.phone} type="any" /></td>
                    <td>{moment(user.logoutDate).format("YYYY-MM-DD HH:mm")}</td>
                    <td>{user.loggedOutBy || '—'}</td>
                    <td>
                      <button className="btn btn-success btn-sm" onClick={() => handleRevokeLogout(user.phone)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-3 shadow-sm">
        <h5>Revoked Logouts ({revokedUsers.length})</h5>
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-secondary">
              <tr>
                <th>#</th>
                <th>Phone</th>
                <th>Unlogged Out By</th>
                 <th>Revoked Date</th>
              </tr>
            </thead>
            <tbody>
              {revokedUsers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">No revoked users.</td>
                </tr>
              ) : (
                revokedUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td><PhoneCell phone={user.phone} type="any" /></td>
                    <td>{user.unLoggedOutBy || '—'}</td>
                    <td>{user.revokedDate ? new Date(user.revokedDate).toLocaleString() : '—'}</td> 
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DirectLogoutUsers;
