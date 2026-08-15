 



import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import PhoneCell from "./components/PhoneCell";

const WithOutUsersTable = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRow, setOpenRow] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-users-without-posted-properties-plans`
        );
        console.log("Fetched Users:", response.data.usersWithoutPostedProperties);
        setUsers(response.data.usersWithoutPostedProperties);
        setFilteredUsers(response.data.usersWithoutPostedProperties);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleRow = (index) => {
    setOpenRow(openRow === index ? null : index);
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
  const handleFilter = () => {
    let filtered = [...users];

    if (searchPhone.trim()) {
      filtered = filtered.filter(user =>
        user.phoneNumber.includes(searchPhone.trim())
      );
    }

    if (startDate) {
      filtered = filtered.filter(user =>
        new Date(user.loginDate) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(user =>
        new Date(user.loginDate) <= new Date(endDate)
      );
    }

    setFilteredUsers(filtered);
    setOpenRow(null);
  };

  const handleReset = () => {
    setSearchPhone('');
    setStartDate('');
    setEndDate('');
    setFilteredUsers(users);
    setOpenRow(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h2 className="mb-4">Users Without Posted Properties</h2>

      {/* Filter Form */}
      <div className="card p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-control"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button className="btn btn-primary w-100" onClick={handleFilter}>Search</button>
            <button className="btn btn-secondary w-100" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h3 className='mb-3 mt-3'>Without Property User Views And Contact Data</h3>

      {/* Table */}
<div ref={tableRef}>        <table className="table table-striped table-hover table-bordered">
          <thead className="table-dark">
            <tr>
              <th></th>
              <th>S.No</th>
              <th>Phone Number</th>
              <th>Login Date</th>
              <th>Plan Name</th>
              <th>Plan Start</th>
              <th>Plan Duration Days</th>
              <th>Plan Expiry</th>
              <th>Views Today</th>
              <th>Views Remaining</th>
              <th>Contacts Today</th>
              <th>Contacts Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <React.Fragment key={index}>
                  <tr onClick={() => toggleRow(index)} style={{ cursor: 'pointer' }}>
                    <td>
                      <i className={`bi bi-chevron-${openRow === index ? 'up' : 'down'}`}></i>
                    </td>
                    <td>{index + 1}</td>
                    <td><PhoneCell phone={user.phoneNumber} display={user.phoneNumber || 'N/A'} type="any" /></td>
                    <td>{user.loginDate ? new Date(user.loginDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{user.planName || 'N/A'}</td>
                    <td>{user.planCreatedDate ? new Date(user.planCreatedDate).toLocaleDateString() : 'N/A'}</td>
                                       <td>{user.durationDays || 'N/A'}</td>

<td>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{user.viewsToday ?? 0}</td>
                    <td>{user.viewsRemaining ?? 0}</td>
                    <td>{user.contactsToday ?? 0}</td>
                    <td>{user.contactsRemaining ?? 0}</td>
                  </tr>

                  {/* Expand Row */}
                  <tr>
                    <td colSpan="11" className="p-0">
                      <div className={`collapse ${openRow === index ? 'show' : ''}`}>
                        <div className="p-3 bg-light">
                          <div className="row">
                            <div className="col-md-6 mb-3 mb-md-0">
                              <h5>Viewed Properties</h5>
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>PPC ID</th>
                                    <th>Owner Phone</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {user.viewedPpcIds && user.viewedPpcIds.length > 0 ? (
                                    user.viewedPpcIds.map((view, idx) => (
                                      <tr key={idx}>
                                        <td>{view.ppcId}</td>
                                        <td><PhoneCell phone={view.ownerPhone} type="any" /></td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="2" className="text-muted">No properties viewed today</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div className="col-md-6">
                              <h5>Contacted Properties</h5>
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>PPC ID</th>
                                    <th>Owner Phone</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {user.contactedPpcIds && user.contactedPpcIds.length > 0 ? (
                                    user.contactedPpcIds.map((contact, idx) => (
                                      <tr key={idx}>
                                        <td>{contact.ppcId}</td>
                                        <td><PhoneCell phone={contact.ownerPhone} type="any" /></td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="2" className="text-muted">No contacts made today</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center text-muted">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WithOutUsersTable;


