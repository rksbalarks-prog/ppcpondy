






import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTrash, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import moment from 'moment';

const SetPPCID = () => {
  const [ppcId, setPpcId] = useState('');
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState('');
  const [allProperties, setAllProperties] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ── Buyer Assistance PPCID assign (mirrors the property assign above) ──
  const [baId, setBaId] = useState('');
  const [baAssignedPhoneNumber, setBaAssignedPhoneNumber] = useState('');
  const [allBaAssignments, setAllBaAssignments] = useState([]);

  const navigate = useNavigate();

  // ── Permission-based access control ──
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem('adminName');
  const adminRole = reduxAdminRole || localStorage.getItem('adminRole');

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileName = 'Set PPCID'; // current file key from UserRolls.jsx

  // Sync Redux to localStorage
  useEffect(() => {
    if (reduxAdminName) localStorage.setItem('adminName', reduxAdminName);
    if (reduxAdminRole) localStorage.setItem('adminRole', reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  // Record dashboard view
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
          userName: adminName,
          role: adminRole,
          viewedFile: fileName,
          viewTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
      } catch (err) {}
    };

    if (adminName && adminRole) {
      recordDashboardView();
    }
  }, [adminName, adminRole]);

  // Fetch role-based permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const rolePermissions = res.data.find((perm) => perm.role === adminRole);
        const viewed = rolePermissions?.viewedFiles?.map((f) => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    if (adminRole) {
      fetchPermissions();
    }
  }, [adminRole]);

  const handleAssignPhone = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/assign-phone`, {
        ppcId,
        assignedPhoneNumber,
      });
      setMessage(response.data.message);
      setError('');
      fetchAllProperties(); // refresh table
      setPpcId('');
      setAssignedPhoneNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred');
      setMessage('');
    }
  };

  const handleDelete = async (ppcId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/unassign-phone`, { ppcId });
      setMessage('Phone assignment removed temporarily.');
      setError('');
      fetchAllProperties();
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred during delete');
      setMessage('');
    }
  };

  const handleUndo = async (ppcId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/undo-unassign-phone`, { ppcId });
      setMessage('Phone assignment restored.');
      setError('');
      fetchAllProperties();
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred during undo');
      setMessage('');
    }
  };

  const fetchAllProperties = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-property-details`);
      setAllProperties(response.data);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchAllProperties();
  }, []);

  // ── Buyer Assistance assign handlers ──
  const handleAssignBuyerPhone = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/assign-buyer-phone`, {
        ba_id: baId,
        assignedPhoneNumber: baAssignedPhoneNumber,
      });
      setMessage(response.data.message);
      setError('');
      fetchAllBaAssignments();
      setBaId('');
      setBaAssignedPhoneNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred');
      setMessage('');
    }
  };

  const handleBaDelete = async (ba_id) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/unassign-buyer-phone`, { ba_id });
      setMessage('Buyer phone assignment removed temporarily.');
      setError('');
      fetchAllBaAssignments();
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred during delete');
      setMessage('');
    }
  };

  const handleBaUndo = async (ba_id) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/undo-unassign-buyer-phone`, { ba_id });
      setMessage('Buyer phone assignment restored.');
      setError('');
      fetchAllBaAssignments();
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred during undo');
      setMessage('');
    }
  };

  const fetchAllBaAssignments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-buyer-phone-assignments`);
      setAllBaAssignments(response.data);
    } catch (err) {
      // 404 = none assigned yet; treat as empty list.
      setAllBaAssignments([]);
    }
  };

  useEffect(() => {
    fetchAllBaAssignments();
  }, []);


  const handlePermanentDelete = async (ppcId) => {
  const confirmed = window.confirm(`Are you sure you want to permanently delete PPC ID ${ppcId}?`);
  if (!confirmed) return;

  try {
    await axios.delete(`${process.env.REACT_APP_API_URL}/permanent-delete/${ppcId}`);
    setMessage(`Permanently deleted PPC ID ${ppcId}`);
    setError('');
    fetchAllProperties();
  } catch (err) {
    setError(err.response?.data?.error || 'Error during permanent deletion');
    setMessage('');
  }
};
  const tableRef = useRef();

  // Check if user has permission to access this page
  if (loading) return <p>Loading...</p>;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg mt-10">
        Only admin is allowed to view this file.
      </div>
    );
  }

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
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Property Phone Set PPCID Assign</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>PPC ID: </label>
        <input
          type="text"
          value={ppcId}
          onChange={(e) => setPpcId(e.target.value)}
          placeholder="Enter PPC ID"
          style={{ marginRight: '10px' }}
        />

        <label>Assign Phone: </label>
        <input
          type="text"
          value={assignedPhoneNumber}
          onChange={(e) => setAssignedPhoneNumber(e.target.value)}
          placeholder="Enter Phone"
          style={{ marginRight: '10px' }}
        />

        <button className='text-white bg-primary' onClick={handleAssignPhone}>Assign</button>
      </div>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3 style={{ marginTop: '30px' }}>All Property Assignments</h3>
    <div ref={tableRef}> <table border="1" cellPadding="10" style={{ marginTop: '10px', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>PPC ID</th>
            <th>Original Phone Number</th>
            <th>Assigned Phone Number</th>
            <th>Assignment Status</th>
            <th> Date </th>
            <th>Actions</th>
            <th>Permanent</th>
 
          </tr>
        </thead>
        <tbody>
          {allProperties.map((prop, index) => (
            <tr key={prop.ppcId}>
              <td>{index + 1}</td>
              <td style={{cursor: "pointer"}}  onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: prop.ppcId, phoneNumber: prop.phoneNumber },
                              })
                            }>{prop.ppcId}</td>
              <td>{prop.originalPhoneNumber || 'N/A'}</td>
              <td>{prop.assignedPhoneNumber || 'Not Assigned'}</td>
              <td>{prop.setPpcId ? 'Assigned' : 'Unassigned'}</td>
<td>
  {prop.setPpcIdAssignedAt
    ? new Date(prop.setPpcIdAssignedAt).toISOString().split('T')[0]
    : 'N/A'}
</td>              <td>
                {prop.setPpcId ? (
                  <button style={{ background: '#dc3545', color: '#fff' }} onClick={() => handleDelete(prop.ppcId)}>
                    <FaTrash />
                  </button>
                ) : (
                  <button style={{ background: '#28a745', color: '#fff' }} onClick={() => handleUndo(prop.ppcId)}>
                    <FaUndo />
                  </button>
                )}
              </td>

              <td>
  <button
    style={{ background: '#000', color: '#fff' }}
    onClick={() => handlePermanentDelete(prop.ppcId)}
  >
    Permanent Delete
  </button>
</td>
 
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* ── Buyer Assistance Phone Set PPCID Assign ── */}
      <h2 style={{ marginTop: '50px' }}>Buyer Assistance Phone Set PPCID Assign</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>BA ID: </label>
        <input
          type="text"
          value={baId}
          onChange={(e) => setBaId(e.target.value)}
          placeholder="Enter BA ID"
          style={{ marginRight: '10px' }}
        />

        <label>Assign Phone: </label>
        <input
          type="text"
          value={baAssignedPhoneNumber}
          onChange={(e) => setBaAssignedPhoneNumber(e.target.value)}
          placeholder="Enter Phone"
          style={{ marginRight: '10px' }}
        />

        <button className='text-white bg-primary' onClick={handleAssignBuyerPhone}>Assign</button>
      </div>

      <h3 style={{ marginTop: '30px' }}>All Buyer Assistance Assignments</h3>
      <table border="1" cellPadding="10" style={{ marginTop: '10px', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>BA ID</th>
            <th>Buyer Name</th>
            <th>Original Phone Number</th>
            <th>Assigned Phone Number</th>
            <th>Assignment Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allBaAssignments.map((ba, index) => (
            <tr key={ba.ba_id}>
              <td>{index + 1}</td>
              <td>{ba.ba_id}</td>
              <td>{ba.baName || 'N/A'}</td>
              <td>{ba.originalPhoneNumber || 'N/A'}</td>
              <td>{ba.assignedPhoneNumber || 'Not Assigned'}</td>
              <td>{ba.setPpcId ? 'Assigned' : 'Unassigned'}</td>
              <td>
                {ba.setPpcIdAssignedAt
                  ? new Date(ba.setPpcIdAssignedAt).toISOString().split('T')[0]
                  : 'N/A'}
              </td>
              <td>
                {ba.setPpcId ? (
                  <button style={{ background: '#dc3545', color: '#fff' }} onClick={() => handleBaDelete(ba.ba_id)}>
                    <FaTrash />
                  </button>
                ) : (
                  <button style={{ background: '#28a745', color: '#fff' }} onClick={() => handleBaUndo(ba.ba_id)}>
                    <FaUndo />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SetPPCID;


