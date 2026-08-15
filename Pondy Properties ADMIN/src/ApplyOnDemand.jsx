



import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useSelector } from 'react-redux';

const SetOnDemandPrice = () => {
  const [ppcId, setPpcId] = useState('');
  const [onDemand, setOnDemand] = useState('');
  const [message, setMessage] = useState('');
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterPpcId, setFilterPpcId] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');


 
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
const handleSubmit = async () => {
  if (!ppcId || onDemand === '') {
    setMessage('Please fill in all fields');
    return;
  }

  try {
    const res = await axios.put(`${process.env.REACT_APP_API_URL}/admin/set-on-demand`, {
      ppcId: Number(ppcId),
      onDemand: onDemand === 'true',
      adminName: adminName,
    });

    setMessage(res.data.message);
    fetchOnDemandProperties();
    setPpcId('');
    setOnDemand('');
  } catch (error) {
    setMessage('Error updating on demand setting');
  }
};



const fetchOnDemandProperties = async () => {
  setLoading(true);
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-on-demand-properties`);
    let data = res.data.properties || [];

    // 🔹 Process each property to mask price and ensure onDemandSetBy is defined
    const processed = data.map(property => ({
      ...property,
      price: "On Demand",
      onDemandSetBy: property.onDemandSetBy || { name: 'N/A', date: null }
    }));

    setProperties(processed);
    setFilteredProperties(processed);
  } catch (error) {
    setMessage('Failed to load On Demand properties');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchOnDemandProperties();
  }, []);

  const applyFilters = () => {
    let filtered = properties;

    if (filterPpcId) {
      filtered = filtered.filter(p => p.ppcId?.toString().includes(filterPpcId));
    }

    if (filterPhone) {
      filtered = filtered.filter(p => p.phoneNumber?.toString().includes(filterPhone));
    }

    if (filterFromDate) {
      const from = new Date(filterFromDate);
      filtered = filtered.filter(p => new Date(p.createdAt) >= from);
    }

    if (filterToDate) {
      const to = new Date(filterToDate);
      filtered = filtered.filter(p => new Date(p.createdAt) <= to);
    }

    setFilteredProperties(filtered);
  };

  const resetFilters = () => {
    setFilterPpcId('');
    setFilterPhone('');
    setFilterFromDate('');
    setFilterToDate('');
    setFilteredProperties(properties);
  };


  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const fileName = "Apply OnDemad Property";

  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

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
        console.error("Error recording view:", err);
      }
    };
    if (adminName && adminRole) recordDashboardView();
  }, [adminName, adminRole]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const rolePermissions = res.data.find((perm) => perm.role === adminRole);
        const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch (err) {
        console.error("Error fetching role permissions:", err);
      } finally {
        setLoading(false);
      }
    };
    if (adminRole) fetchPermissions();
  }, [adminRole]);

  if (loading) return <p>Loading...</p>;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-danger fw-bold mt-4">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
       <h4 style={{ marginTop: '30px' }}>Filter Search On Demand Properties</h4>

    <div  className="d-flex flex-row gap-2 align-items-center flex-nowrap"
    style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}>
  <input
    type="text"
    placeholder="Filter by PPC ID"
    value={filterPpcId}
    onChange={(e) => setFilterPpcId(e.target.value)}
    style={inputStyle}
  />
  <input
    type="text"
    placeholder="Filter by Phone Number"
    value={filterPhone}
    onChange={(e) => setFilterPhone(e.target.value)}
    style={inputStyle}
  />
  <input
    type="date"
    placeholder="From Date"
    value={filterFromDate}
    onChange={(e) => setFilterFromDate(e.target.value)}
    style={inputStyle}
  />
  <input
    type="date"
    placeholder="To Date"
    value={filterToDate}
    onChange={(e) => setFilterToDate(e.target.value)}
    style={inputStyle}
  />
  <button onClick={applyFilters} style={{ ...buttonStyle, backgroundColor: '#007bff' }}>
    Search
  </button>
  <button onClick={resetFilters} style={{ ...buttonStyle, backgroundColor: '#6c757d' }}>
    Reset
  </button>
</div>

{message && (
  <div style={{ color: 'green', marginTop: '10px', fontWeight: 'bold' }}>
    {message}
  </div>
)}


      {/* Form to Set On Demand */}
      <div style={{ marginTop: '20px',  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff'  }}>
              <h3 className='fw-bold text-warning'> Set Price to "On Demand"</h3>

        <input
          type="number"
          value={ppcId}
          placeholder="Enter PPC ID (e.g. 2098)"
          onChange={(e) => setPpcId(e.target.value)}
          style={inputStyle}
        />
        <select
          onChange={(e) => setOnDemand(e.target.value)}
          value={onDemand}
          style={inputStyle}
        >
          <option value="">Select Here</option>
          <option value="true">Hide Price (On Demand)</option>
          <option value="false">Show Price</option>
        </select>
        <button onClick={handleSubmit} style={{ ...buttonStyle, backgroundColor: '#007bff' }}>Submit</button>
      </div>

      

             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>

<h3 className='mt-5 mb-4 text-success'> Get All Datas In On Demand Apply properties </h3>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredProperties.length === 0 ? (
        <p>No On Demand properties found.</p>
      ) : (

<div ref={tableRef}>
<table style={tableStyle}>
  <thead>
    <tr style={{ backgroundColor: '#f2f2f2' }}>
      <th style={thStyle}>PPC ID</th>
      <th style={thStyle}>Phone Number</th>
      <th style={thStyle}>Property Mode</th>
      <th style={thStyle}>Property Type</th>
      <th style={thStyle}>City</th>
      <th style={thStyle}>State</th>
      <th style={thStyle}>Price</th>
      <th style={thStyle}>Status</th>
      <th style={thStyle}>Created At</th>
      <th style={thStyle}>Updated At</th>
      <th style={thStyle}>Set By</th> {/* ✅ Admin Name */}
      <th style={thStyle}>Set Date</th> {/* ✅ Date */}
    </tr>
  </thead>
  <tbody>
    {filteredProperties.map((property) => (
      <tr key={property.ppcId}>
        <td style={tdStyle}>{property.ppcId}</td>
        <td style={tdStyle}>{property.phoneNumber}</td>
        <td style={tdStyle}>{property.propertyMode || 'N/A'}</td>
        <td style={tdStyle}>{property.propertyType || 'N/A'}</td>
        <td style={tdStyle}>{property.city || 'N/A'}</td>
        <td style={tdStyle}>{property.state || 'N/A'}</td>
        <td style={{ ...tdStyle, color: '#8C3C2F', fontWeight: 600 }}>On Demand</td>
        <td style={tdStyle}>{property.status || 'N/A'}</td>
        <td style={tdStyle}>
          {property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-IN') : 'N/A'}
        </td>
        <td style={tdStyle}>
          {property.updatedAt ? new Date(property.updatedAt).toLocaleDateString('en-IN') : 'N/A'}
        </td>
        <td style={tdStyle}>
          {property.onDemandSetBy?.name || 'N/A'}
        </td>
        <td style={tdStyle}>
          {property.onDemandSetBy?.date
            ? new Date(property.onDemandSetBy.date).toLocaleDateString('en-IN')
            : 'N/A'}
        </td>
      </tr>
    ))}
  </tbody>
</table>
 </div>
      )}
    </div>
  );
};
const inputStyle = {
  padding: '10px',
  minWidth: '180px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const buttonStyle = {
  padding: '10px 16px',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};


const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '10px',
  fontSize: '14px',
};

const thStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tdStyle = {
  padding: '10px',
  border: '1px solid #ddd',
};

export default SetOnDemandPrice;
