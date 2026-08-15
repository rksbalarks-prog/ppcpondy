 

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PhoneCell from "./components/PhoneCell";

const LoginUserDatas = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedPhones, setExpandedPhones] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 30;

  const handleReset = () => {
    setPhoneFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  // Toggle table visibility for a phone number
  const togglePhoneTable = (phone) => {
    setExpandedPhones(prev => ({
      ...prev,
      [phone]: !prev[phone]
    }));
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
  // Filter data based on search criteria
  const filteredData = data.filter((user) => {
    const phoneMatch = phoneFilter
      ? user.phone.toString().includes(phoneFilter)
      : true;

    const activityMatch = dateFilter
      ? user.activity.some((entry) => entry.date.includes(dateFilter))
      : true;

    return phoneMatch && activityMatch;
  });

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const fetchAppOpens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/all-app-opens`);
      setData(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch app opens:', error);
      alert('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppOpens();
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="mb-4">All User App & Web Opens Report</h3>

      {/* Search Filter Card */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Search Filters</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-3 flex-wrap align-items-end">
            <div className="flex-grow-1">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={phoneFilter}
                onChange={(e) => {
                  setPhoneFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by phone number"
              />
            </div>
            <div className="flex-grow-1">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <button 
                className="btn btn-secondary" 
                onClick={handleReset}
              >
                Reset Filters
              </button>
            </div>
                  <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
          </div>
        </div>
      </div>

      {/* Data Display Section */}
      <div className="card">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">App Open Records</h5>
          <div>
            <span className="badge bg-primary">
              Total Records: {filteredData.length}
            </span>
          </div>
        </div>
        <div className="card-body">
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading data...</p>
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="alert alert-info">No data available.</div>
          )}

          {!loading && data.length > 0 && filteredData.length === 0 && (
            <div className="alert alert-warning">No matching records found.</div>
          )}

          {!loading && currentRecords.length > 0 && (
            <div className="accordion" id="phoneAccordion">
              {currentRecords.map((user, userIdx) => (
                <div key={userIdx} className="accordion-item mb-3">
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${expandedPhones[user.phone] ? '' : 'collapsed'}`}
                      type="button"
                      onClick={() => togglePhoneTable(user.phone)}
                      aria-expanded={expandedPhones[user.phone]}
                    >
                      <div className="d-flex justify-content-between w-100">
                        <span className="fw-bold">Phone: <PhoneCell phone={user.phone} type="any" /></span>
                        <span className="badge bg-secondary ms-2">
                          {user.activity.length} days
                        </span>
                      </div>
                    </button>
                  </h2>
                  <div
                    className={`accordion-collapse collapse ${expandedPhones[user.phone] ? 'show' : ''}`}
                  >
                    <div className="accordion-body p-0">
                      <div ref={tableRef}>

                      <div className="table-responsive">
                        <table className="table table-bordered table-striped table-hover mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th>Date</th>
                              <th>Open Count</th>
                              <th>Times Opened</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.activity
                              .filter(entry => 
                                !dateFilter || entry.date.includes(dateFilter)
                              )
                              .map((entry, idx) => (
                                <tr key={idx}>
                                  <td>{entry.date}</td>
                                  <td>{entry.count}</td>
                                  <td>
                                    <ul className="mb-0 ps-3">
                                      {entry.timesOpened.map((time, tIdx) => (
                                        <li key={tIdx}>
                                          {new Date(time).toLocaleString()}
                                        </li>
                                      ))}
                                    </ul>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                 </div>

                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredData.length > recordsPerPage && (
            <nav aria-label="Page navigation" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li 
                    key={page} 
                    className={`page-item ${currentPage === page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginUserDatas;