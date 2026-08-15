 

import React, { useEffect, useRef, useState } from "react";
import PhoneCell from "./components/PhoneCell";

const WithoutProperty30DaysUser = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  phoneNumber: '',
  startDate: '',
  endDate: '',
});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get-users-without-posted-properties-30days`);
      const data = await response.json();

      console.log("API Response:", data);

      if (data.users && data.users.length > 0) {
        setUsers(data.users);
        setMessage("");
      } else {
        setUsers([]);
        setMessage("No users found.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Failed to fetch users data.");
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
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
const filteredUsers = users.filter((user) => {
  const matchPhone = user.phoneNumber.includes(filters.phoneNumber);
  const loginDate = new Date(user.loginDate);
  const start = filters.startDate ? new Date(filters.startDate) : null;
  const end = filters.endDate ? new Date(filters.endDate) : null;

  const matchStartDate = start ? loginDate >= start : true;
  const matchEndDate = end ? loginDate <= end : true;

  return matchPhone && matchStartDate && matchEndDate;
});

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  const groupDates = (items, dateKey) => {
    const counts = {};
    items.forEach((item) => {
      const dateStr = formatDate(item[dateKey]);
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="container">
      <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="d-flex flex-row gap-2 align-items-center flex-nowrap">
  <input
    type="text"
    placeholder="Filter by Phone Number"
    value={filters.phoneNumber}
    onChange={(e) => setFilters({ ...filters, phoneNumber: e.target.value })}
    style={{ marginRight: '10px' }}
  />

  <input
    type="date"
    value={filters.startDate}
    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
    style={{ marginRight: '10px' }}
  />

  <input
    type="date"
    value={filters.endDate}
    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
    style={{ marginRight: '10px' }}
  />

  <button style={{background:"orange"}} onClick={() => setFilters({ phoneNumber: '', startDate: '', endDate: '' })}>
    Reset
  </button>
</div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2>Users Without Posted Properties (Last 30 Days)</h2>

      {loading && <p>Loading...</p>}

      {!loading && message && (
        <div style={{ color: "red", marginBottom: "10px" }}>{message}</div>
      )}

      {!loading && users.length > 0 && (
        <div ref={tableRef}>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Phone Number</th>
              <th>Login Date</th>
              <th>Views (30 Days)</th>
              <th>Viewed Dates</th>
              <th>Contacts (30 Days)</th>
              <th>Contacted Dates</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => {
              const viewedDateCounts = groupDates(user.viewedPpcDetails || [], "viewedAt");
              const contactedDateCounts = groupDates(user.contactedPpcDetails || [], "contactedAt");

              return (
                <tr key={index}>
                  <td>{index+1}</td>
                  <td><PhoneCell phone={user.phoneNumber} type="any" /></td>
                  <td>{new Date(user.loginDate).toLocaleString()}</td>
                  <td>{user.viewsInLast30Days}</td>
                  <td>
                    {Object.entries(viewedDateCounts).map(([date, count], i) => (
                      <div key={i}>
                        {date} — {count} viewed
                      </div>
                    ))}
                  </td>
                  <td>{user.contactsInLast30Days}</td>
                  <td>
                    {Object.entries(contactedDateCounts).map(([date, count], i) => (
                      <div key={i}>
                        {date} — {count} contacted
                      </div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default WithoutProperty30DaysUser;






