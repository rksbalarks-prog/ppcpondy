 

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function WithOutUserStatics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [filters, setFilters] = useState({
  phoneNumber: '',
  startDate: '',
  endDate: '',
});

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get-user-no-complete-activity`)
      .then(res => {
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch');
        setLoading(false);
      });
  }, []);

  const navigate = useNavigate();

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
const filteredData = data.filter((user) => {
  const matchPhone = user.phoneNumber.includes(filters.phoneNumber);
  const loginDate = user.loginDate ? new Date(user.loginDate) : null;
  const start = filters.startDate ? new Date(filters.startDate) : null;
  const end = filters.endDate ? new Date(filters.endDate) : null;

  const matchStartDate = start ? loginDate && loginDate >= start : true;
  const matchEndDate = end ? loginDate && loginDate <= end : true;

  return matchPhone && matchStartDate && matchEndDate;
});



  if (loading) return <p>Loading user activity data...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px' }}>
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
      <h2>User Activity</h2>
      <div ref={tableRef}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          marginTop: '10px',
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>S.No</th>
            <th style={thStyle}>Phone Number</th>
            <th style={thStyle}>Interest Count</th>
            <th style={thStyle}>Contact Count</th>
            <th style={thStyle}>Favorite Count</th>
            <th style={thStyle}>Photo Request Count</th>
            <th style={thStyle}>Offer Count</th>
            <th style={thStyle}>Help Request Count</th>
            <th style={thStyle}>Report Count</th>
                        <th style={thStyle}>Views Count</th>
            <th style={thStyle}>Login Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 && (
            <tr>
              <td colSpan="12" style={{ padding: '10px', textAlign: 'center' }}>
                No user activity data found.
              </td>
            </tr>
          )}
          {filteredData.map((user, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={tdStyle}>{idx+1}</td>
              <td style={tdStyle}>{user.phoneNumber}</td>
              <td style={tdStyle}>{user.interestCount}</td>
              <td style={tdStyle}>{user.contactCount}</td>
              <td style={tdStyle}>{user.favoriteCount}</td>
              <td style={tdStyle}>{user.photoRequestCount}</td>
              <td style={tdStyle}>{user.offerCount}</td>
              <td style={tdStyle}>{user.helpRequestCount}</td>
              <td style={tdStyle}>{user.reportCount}</td>
                <td style={tdStyle}>{user.viewsCount}</td>
              <td style={tdStyle}>
                {user.loginDate ? new Date(user.loginDate).toLocaleString() : '-'}
              </td>
              
           <td>
        <button
          onClick={() =>
            navigate(`/dashboard/all-property-statics?phoneNumber=${encodeURIComponent(user.phoneNumber)}`)
          }
          style={{
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Expand
        </button>
        </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const thStyle = {
  borderBottom: '2px solid #000',
  padding: '8px',
  backgroundColor: '#f0f0f0',
};

const tdStyle = {
  padding: '8px',
};

export default WithOutUserStatics;
