 





import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function AllViewsDatas() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [expandedPhone, setExpandedPhone] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    ppcId: "",
    phoneNumber: "",
    startDate: "",
    endDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/user-viewed-list`);
        setUsers(res.data);
        setFilteredUsers(res.data);
      } catch (err) {
        setError("Failed to load users.");
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  const handleExpand = async (phoneNumber) => {
    if (expandedPhone === phoneNumber) {
      setExpandedPhone(null);
      return;
    }

    setLoadingDetails(true);
    setError(null);
    try {
      const [todayDetailsRes, tenDaysDataRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/get-user-today-viewed-details`, {
          params: { phoneNumber },
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/get-user-viewed-last-10-days-data`, {
          params: { phoneNumber },
        }),
      ]);

      setUserDetails((prev) => ({
        ...prev,
        [phoneNumber]: {
          ...todayDetailsRes.data.data,
          last10DaysData: tenDaysDataRes.data.data,
        },
      }));

      setExpandedPhone(phoneNumber);
    } catch (err) {
      setError("Failed to load details.");
    }
    setLoadingDetails(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
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
  const applyFilters = () => {
    let filtered = [...users];

    if (filters.phoneNumber.trim()) {
      filtered = filtered.filter((user) =>
        user.phoneNumber.includes(filters.phoneNumber.trim())
      );
    }

    if (filters.ppcId.trim()) {
      filtered = filtered.filter((user) => {
        const details = userDetails[user.phoneNumber];
        return (
          details?.viewedProperties?.some((v) =>
            v.ppcId?.toString().includes(filters.ppcId.trim())
          )
        );
      });
    }

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((user) => {
        const viewDate = new Date(user.lastViewDate);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        return (!start || viewDate >= start) && (!end || viewDate <= end);
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page
  };

  const resetFilters = () => {
    setFilters({ ppcId: "", phoneNumber: "", startDate: "", endDate: "" });
    setFilteredUsers(users);
    setCurrentPage(1);
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "auto" }}>
      <h2>User Viewed Properties</h2>

      <div    className="d-flex flex-row gap-2 align-items-center flex-nowrap"

      style={{ boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', padding: 20, backgroundColor: '#fff' }}>
        <input type="text" name="phoneNumber" placeholder="Phone Number" value={filters.phoneNumber} onChange={handleInputChange} />
        {/* <input type="text" name="ppcId" placeholder="PPC ID" value={filters.ppcId} onChange={handleInputChange} /> */}
        <input type="date" name="startDate" value={filters.startDate} onChange={handleInputChange} />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleInputChange} />
        <button style={{background:"blue"}} onClick={applyFilters}>Search</button>
        <button style={{background:"red"}} onClick={resetFilters}>Reset</button>
      </div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loadingUsers ? (
        <p>Loading users...</p>
      ) : (
        <>
        <div ref={tableRef}>
          <table border="1" cellPadding="8" width="100%">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Phone Number</th>
                <th>Daily Views Count</th>
                <th>View Limit</th>
                <th>Last View Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, index) => {
                const isExpanded = expandedPhone === user.phoneNumber;
                const details = userDetails[user.phoneNumber];
                return (
                  <React.Fragment key={user.phoneNumber}>
                    <tr>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{user.phoneNumber}</td>
                      <td>{user.dailyViewsCount}</td>
                      <td>{user.viewLimitPerDay}</td>
                      <td>{new Date(user.lastViewDate).toLocaleString()}</td>
                      <td>
                        <button className="bg-primary" onClick={() => handleExpand(user.phoneNumber)}>
                          {isExpanded ? "Collapse" : "Expand"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="6">
                          {loadingDetails ? (
                            <p>Loading...</p>
                          ) : (
                            <>
                              <h4>Today's Viewed Properties</h4>
                              <ul>
                                {details.viewedProperties.map((v) => (
                                  <li key={v._id}>
                                    {v.ppcId || v.rentId} - {new Date(v.viewedAt).toLocaleString()}
                                  </li>
                                ))}
                              </ul>
                              <h4>Contacted Properties</h4>
                              <ul>
                                {details.contactedProperties.map((c, i) => (
                                  <li key={i}>
                                    {c.ppcId || c.rentId} - {new Date(c.contactedAt || c.createdAt).toLocaleString()}
                                  </li>
                                ))}
                              </ul>
                              <h4>Last 10 Days Summary</h4>
                              <table border="1" cellPadding="6" style={{ marginTop: 10 }}>
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>View Count</th>
                                    <th>Contact Count</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.keys(details.last10DaysData.dailyViewCounts).map((date) => (
                                    <tr key={date}>
                                      <td>{date}</td>
                                      <td>{details.last10DaysData.dailyViewCounts[date]}</td>
                                      <td>{details.last10DaysData.dailyContactCounts[date]}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
</div>
          {/* Pagination */}
          <div className="d-flex justify-content-between mt-3">
            <button
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
