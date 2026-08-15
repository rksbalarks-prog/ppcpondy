


import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import PhoneCell from "./components/PhoneCell";

const LoginDirectVerifyUser = () => {
  const [phoneInput, setPhoneInput] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowedRoles, setAllowedRoles] = useState([]);

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const fileName = "Login Verify Directly";

  // Sync Redux to localStorage
  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

   // Fetch Verified & Unverified Users
  const fetchVerifiedUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/direct-verified-users`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching verified users", err);
    }
  };

  const fetchUnverifiedUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/unverified-users`);
      setUnverifiedUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching unverified users", err);
    }
  };

  useEffect(() => {
    fetchVerifiedUsers();
    fetchUnverifiedUsers();
  }, []);

  // Handle Verify
  const handlePhoneVerify = async () => {
    if (!phoneInput.trim()) {
      setVerifyError("Phone number is required.");
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/direct-verify`, {
        phone: phoneInput,
        adminName: adminName,
      });

      if (response.status === 200) {
        setIsVerified(true);
        setVerifyError("");
        setMessage("User successfully verified.");
        setPhoneInput("");
        fetchVerifiedUsers();
        fetchUnverifiedUsers();
      } else {
        setVerifyError("Verification failed. Please enter a valid phone number.");
      }
    } catch (err) {
      setVerifyError("Error verifying phone number. Try again.");
    }
  };

  // Handle Unverify
  const handleUnverify = async (phone) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/user/direct-verify`, {
        data: {
          phone: phone,
          adminName: adminName,
        },
      });
      setMessage(`User ${phone} unmarked as verified.`);
      fetchVerifiedUsers();
      fetchUnverifiedUsers();
    } catch (err) {
      setMessage("Error removing verification.");
      console.error(err);
    }
  };

 
  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Login Direct Verify Panel</h2>

      {/* Input Form */}
      <div className="card p-3 shadow-sm mb-4">
        <h5>Enter Phone Number to Verify</h5>
        <div className="d-flex flex-column flex-md-row gap-3 align-items-center">
          <input
            type="number"
            className="form-control"
            style={{ maxWidth: "300px" }}
            placeholder="Enter phone number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handlePhoneVerify}>
            Verify
          </button>
        </div>
        {verifyError && <p className="text-danger mt-2">{verifyError}</p>}
        {message && <p className="text-success mt-2">{message}</p>}
      </div>

      {/* Verified Users */}
      <div className="card p-3 shadow-sm mb-4">
        <h5>Verified Users ({users.length})</h5>
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Phone</th>
                <th>OTP Status</th>
                <th>Verified</th>
                <th>Verified By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No verified users found.</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td><PhoneCell phone={user.phone} type="any" /></td>
                    <td>{user.otpStatus || '—'}</td>
                    <td>{user.directVerified ? "Yes" : "No"}</td>
                    <td>{user.verifiedBy || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleUnverify(user.phone)}>
                        Unverify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unverified Users */}
      <div className="card p-3 shadow-sm">
        <h5>Unverified Users (Deleted) ({unverifiedUsers.length})</h5>
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-secondary">
              <tr>
                <th>#</th>
                <th>Phone</th>
                <th>Deleted Date</th>
                <th>Unverified By</th>
              </tr>
            </thead>
            <tbody>
              {unverifiedUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">No unverified users found.</td>
                </tr>
              ) : (
                unverifiedUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td><PhoneCell phone={user.phone} type="any" /></td>
                    <td>{new Date(user.deletedDate).toLocaleString()}</td>
                    <td>{user.unverifiedBy || '—'}</td>
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

export default LoginDirectVerifyUser;














