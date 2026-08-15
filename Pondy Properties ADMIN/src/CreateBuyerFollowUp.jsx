 


import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";

// Today's date in `YYYY-MM-DD` shape for the `<input type="date">` default.
const todayDateString = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Combine a YYYY-MM-DD date with the current local time-of-day. The recorded
// followupDate is the user's chosen day + the actual save moment.
const combineWithCurrentTime = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${dateStr}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

function CreateBuyerFollowUp() {
  // Pre-fill the date with today; user can change to schedule a future day.
  // The time portion is appended at submit so it reflects the actual save.
  const [formData, setFormData] = useState({
    followupStatus: "",
    followupType: "",
    followupDate: todayDateString(),
    remarks: "",
  });

  const location = useLocation();
  const { ba_id, phoneNumber } = location.state || {};

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const navigate = useNavigate();
  const fileName = "CreateBuyerFollowUp"; // for dashboard view

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
      } catch (err) {
        console.error("Error recording dashboard view:", err);
      }
    };

    if (adminName && adminRole) {
      recordDashboardView();
    }
  }, [adminName, adminRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ba_id,
        phoneNumber,
        ...formData,
        // The user picked the date; append the current time at submit so the
        // saved followupDate is the chosen day + actual save moment.
        followupDate: combineWithCurrentTime(formData.followupDate),
        adminName,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/followup-create-buyer`,
        payload
      );

      if (response.data.success) {
        alert("Follow-up created successfully!");
        setTimeout(() => {
          navigate(-1); // go back to previous page
        }, 1000);
      } else {
        alert("Failed to create follow-up: " + response.data.message);
      }
    } catch (err) {
      console.error("Error while submitting follow-up:", err);
      alert("Failed to create follow-up!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>BA_ID:</label>
        <input type="text" value={ba_id || "N/A"} disabled />
      </div>

      <div>
        <label>Phone Number:</label>
        <input type="text" value={phoneNumber || "N/A"} disabled />
      </div>

      <div>
        <label>Follow-up Status:</label>
        <select name="followupStatus" onChange={handleInputChange} required>
          <option value="">Select Status</option>
          <option value="Ring">Ring</option>
          <option value="Ready To Pay">Ready To Pay</option>
          <option value="Not Decided">Not Decided</option>
          <option value="Not Interested-Closed">Not Interested-Closed</option>
          <option value="Paid Closed">Paid Closed</option>
        </select>
      </div>

      <div>
        <label>Follow-up Type:</label>
        <select name="followupType" onChange={handleInputChange} required>
          <option value="">Select Type</option>
          <option value="Payment Followup">Payment Followup</option>
          <option value="Data Followup">Data Followup</option>
          <option value="Enquiry Followup">Enquiry Followup</option>
        </select>
      </div>

      <div>
        <label>
          Follow-up Date{" "}
          <span style={{ color: "#888", fontSize: "12px" }}>
            (time auto-captured at save)
          </span>
          :
        </label>
        {/* User picks the date; the time is appended at submit. */}
        <input
          type="date"
          name="followupDate"
          value={formData.followupDate}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label>Remark:</label>
        <textarea
          name="remarks"
          placeholder="Enter remark (optional)"
          value={formData.remarks}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      <button type="submit">Create Follow-up</button>
    </form>
  );
}

export default CreateBuyerFollowUp;
