 
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { MdDeleteForever } from "react-icons/md";
import { FaEdit } from "react-icons/fa";

const SetViewLimit = () => {
  const [phoneNumbersInput, setPhoneNumbersInput] = useState("");
  const [viewLimit, setViewLimit] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [allLimits, setAllLimits] = useState([]);
  const [editMode, setEditMode] = useState(null);

  const API = process.env.REACT_APP_API_URL;

  // Submit handler for bulk view limits
  const handleSetLimit = async () => {
    const phoneNumbers = phoneNumbersInput
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean);

    if (!phoneNumbers.length || !viewLimit) {
      setResponseMessage("Please enter valid phone numbers and view limit.");
      return;
    }

    try {
      const res = await axios.post(`${API}/set-limit`, {
        phoneNumbers,
        viewLimitPerDay: parseInt(viewLimit),
      });
      setResponseMessage(
        `✅ View limit set for ${res.data.totalApplied} phone number(s).`
      );
      setPhoneNumbersInput("");
      setViewLimit("");
      fetchAllLimits();
    } catch (err) {
      console.error(err);
      setResponseMessage("❌ Failed to set limits.");
    }
  };

  const handleDeleteLimit = async (phone) => {
    if (window.confirm(`Remove limit for ${phone}?`)) {
      try {
        await axios.delete(`${API}/delete-limit/${phone}`);
        setResponseMessage(`✅ Limit deleted for ${phone}`);
        fetchAllLimits();
      } catch (err) {
        console.error(err);
        setResponseMessage("❌ Failed to delete limit.");
      }
    }
  };

  const fetchAllLimits = async () => {
    try {
      const res = await axios.get(`${API}/get-all-user-limits`);
      const sorted = (res.data.users || []).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      setAllLimits(sorted);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAllLimits();
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
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileName = "Daily Usage";

  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${API}/record-view`, {
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
        const res = await axios.get(`${API}/get-role-permissions`);
        const rolePerms = res.data.find((perm) => perm.role === adminRole);
        setAllowedRoles(rolePerms?.viewedFiles?.map((f) => f.trim()) || []);
      } catch {} finally {
        setLoading(false);
      }
    };

    if (adminRole) fetchPermissions();
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
    <div style={{ maxWidth: 800, margin: "30px auto", padding: 20, border: "1px solid #ccc" }}>
      <h2>Admin – Bulk Set Daily View Limits</h2>
            <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <label>Phone Numbers (comma-separated):</label>
      <textarea
        rows={3}
        value={phoneNumbersInput}
        onChange={(e) => setPhoneNumbersInput(e.target.value)}
        placeholder="Limit Apply Multiple User Phonenumber"
        style={{ width: "100%", marginBottom: 10 }}
      />

      <label>View Limit Per Day:</label>
      <input
        type="number"
        value={viewLimit}
        onChange={(e) => setViewLimit(e.target.value)}
        placeholder="e.g. 10, 20"
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button className="bg-primary text-white" onClick={handleSetLimit}>
        {editMode ? "Update Limit" : "Set Limit"}
      </button>
 
      {responseMessage && <p style={{ marginTop: 10 }}>{responseMessage}</p>}

      <hr style={{ marginTop: 30 }} />
      <h3>All View Limits (Recent First)</h3>
<div ref={tableRef}>
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
    

        <thead>
  <tr>
    <th>Phone Number</th>
    <th>Plan</th>
    <th>View Limit/Day</th>
    <th>Views Today</th>
    <th>Viewed PPCs (Today)</th>
    <th>Contacts Today</th>
    <th>Contacted PPCs (Today)</th>
    <th>Total Contacts</th>
    <th>Actions</th>
  </tr>
</thead>
<tbody>
  {allLimits.length === 0 ? (
    <tr><td colSpan="9">No limits set yet.</td></tr>
  ) : (
    allLimits.map((user) => {
      const today = new Date().toISOString().slice(0, 10);
      const contactCountToday = user.contactCountPerDay?.[today] || 0;
      const contactedToday = user.contactedPpcDetailsByDate?.[today] || [];
      const viewedToday = user.viewedPpcDetailsByDate?.[today] || [];

      const totalContacts = Object.values(user.contactCountPerDay || {}).reduce(
        (sum, count) => sum + count,
        0
      );

      return (
        <tr key={user.phoneNumber}>
          <td>{user.phoneNumber}</td>
          <td>{user.planName || "-"}</td>
          <td>{user.viewLimitPerDay ?? "-"}</td>
          <td>{user.dailyViewsCount ?? 0}</td>
          {/* <td>{viewedToday.map((v) => v.ppcId).join(", ") || "-"}</td> */}
  <td>
  {viewedToday.length > 0 ? (
    viewedToday.map((v, i) => (
      <span key={i}>
        <strong>{v.ppcId}</strong> ({new Date(v.viewedAt).toLocaleString()})
        {i < viewedToday.length - 1 ? ', ' : ''}
      </span>
    ))
  ) : (
    "-"
  )}
</td>


          <td>{contactCountToday}</td>
          <td>{contactedToday.map((c) => c.ppcId).join(", ") || "-"}</td>
          <td>{totalContacts}</td>
          <td>
            <button
              className="text-info"
              onClick={() => {
                setPhoneNumbersInput(user.phoneNumber);
                setViewLimit(user.viewLimitPerDay);
                setEditMode(user.phoneNumber);
              }}
              style={{ marginRight: 5 }}
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDeleteLimit(user.phoneNumber)}
              style={{ color: "red" }}
            >
              <MdDeleteForever />
            </button>
          </td>
        </tr>
      );
    })
  )}
</tbody>

     
      </table>
      </div>
    </div>
  );
};

export default SetViewLimit;
