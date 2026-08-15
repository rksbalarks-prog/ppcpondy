 
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MdDeleteForever } from "react-icons/md";
import { FaEdit } from "react-icons/fa";

const SetContactLimit = () => {
  const [phoneNumbersInput, setPhoneNumbersInput] = useState(""); // comma-separated
  const [contactLimitPerDay, setContactLimitPerDay] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const API = process.env.REACT_APP_API_URL;

const fetchUsers = async () => {
  try {
    const res = await axios.get(`${API}/get-all-contact-limits`);

    const sortedUsers = (res.data.users || []).sort((a, b) => {
      const dateA = new Date(a.contactLimitSetDate || 0);
      const dateB = new Date(b.contactLimitSetDate || 0);
      return dateB - dateA; // Most recent first
    });

    setUsers(sortedUsers);
  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  useEffect(() => {
    fetchUsers();
  }, [refresh]);
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage("");
    setError("");

    if (!phoneNumbersInput || !contactLimitPerDay) {
      setError("Phone numbers and limit are required.");
      return;
    }

    const phoneNumbers = phoneNumbersInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      const res = await axios.post(`${API}/set-contact-limit`, {
        phoneNumbers,
        contactLimitPerDay: Number(contactLimitPerDay),
      });

      setResponseMessage(
        `${res.data.message} (${res.data.updatedExisting} updated, ${res.data.newlyCreated} new)`
      );
      setPhoneNumbersInput("");
      setContactLimitPerDay("");
      setRefresh(!refresh);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Something went wrong.";
      setError(errorMsg);
    }
  };

  const handleDelete = async (userPhone) => {
    if (!window.confirm(`Are you sure to delete contact limit for ${userPhone}?`)) return;

    try {
      const res = await axios.delete(`${API}/delete-contact-limit/${userPhone}`);
      setResponseMessage(res.data.message);
      setRefresh(!refresh);
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Admin: Manage Contact Limits (Multiple Users)
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Phone Numbers (comma-separated)</label>
            <textarea
              rows={3}
              value={phoneNumbersInput}
              onChange={(e) => setPhoneNumbersInput(e.target.value)}
              placeholder="Enter Multiple User PhoneNumber Apply Only Comma"
              className="w-100 border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Contact Limit / Day</label>
            <input
              type="number"
              value={contactLimitPerDay}
              onChange={(e) => setContactLimitPerDay(e.target.value)}
              placeholder="e.g., 10, 20"
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Set Contact Limit
        </button>
        {responseMessage && <p className="text-green-600 mt-2">✅ {responseMessage}</p>}
        {error && <p className="text-red-600 mt-2">❌ {error}</p>}
      </form>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h3 className="text-primary mt-3 mb-3"> Get Contact Limit Set User Datas </h3>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Contact Limits Table</h3>
<div ref={tableRef}>          <table className="w-full border">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Phone Number</th>
                <th className="p-2 border">Limit / Day</th>
                <th className="p-2 border">Contacts Today</th>
                                                <th className="p-2 border">Contacts set Date</th>

                <th className="p-2 border">Contacted PPCs (Today)</th>

                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const contactCountToday = user.contactCountPerDay?.[today] || 0;
                  const contactedToday = user.contactedPpcDetailsByDate?.[today] || [];

                  return (
                    <tr key={user.phoneNumber} className="text-sm">
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border">{user.phoneNumber}</td>
                      <td className="p-2 border text-center">{user.contactLimitPerDay}</td>
                      <td className="p-2 border text-center">{contactCountToday}</td>
                                            <td className="p-2 border text-center">{user.contactLimitSetDate}</td>

                      <td className="p-2 border text-left">
                        <ul className="list-disc pl-4">
                          {contactedToday.map((c, i) => (
                            <li key={i}>
                              {c.ppcId} - {new Date(c.contactedAt).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => handleDelete(user.phoneNumber)}
                          className="text-danger "
                          title="Delete"
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
    </div>
  );
};

export default SetContactLimit;
