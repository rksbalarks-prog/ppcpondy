import axios from 'axios';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Download History — shows every Excel / PDF / CSV file an admin downloaded
// anywhere in the panel. Records are written by the global DownloadTracker.
const DownloadHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    adminName: '',
    fileType: '',
    startDate: '',
    endDate: '',
  });
  const [adminList, setAdminList] = useState([]);

  const tableRef = useRef();

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem('adminName');
  const adminRole = reduxAdminRole || localStorage.getItem('adminRole');

  const [allowedRoles, setAllowedRoles] = useState([]);
  const fileName = 'Download History'; // permission key for this page

  // Sync Redux to localStorage
  useEffect(() => {
    if (reduxAdminName) localStorage.setItem('adminName', reduxAdminName);
    if (reduxAdminRole) localStorage.setItem('adminRole', reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  // Record this page view
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
    if (adminName && adminRole) recordDashboardView();
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
    if (adminRole) fetchPermissions();
    else setLoading(false);
  }, [adminRole]);

  // Fetch download history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-download-history`);
        setHistoryData(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        setError('Failed to fetch download history');
      }
    };
    fetchData();
  }, []);

  // Fetch admin names for the "Admin Name" dropdown (same source as the Users page).
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/admin-all`)
      .then((res) => {
        const names = Array.isArray(res.data)
          ? res.data.map((u) => (u.name || '').trim()).filter(Boolean)
          : [];
        setAdminList([...new Set(names)].sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {});
  }, []);

  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Download History</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h3>Download History</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <p>Loading...</p>;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg mt-10">
        Only admin is allowed to view this file.
      </div>
    );
  }

  // Distinct file types present in the data — drives the Type dropdown.
  const fileTypes = [
    ...new Set(
      historyData.map((r) => (r.fileType || '').toLowerCase()).filter(Boolean)
    ),
  ].sort();

  const filtered = historyData.filter((row) => {
    const { adminName: fName, fileType, startDate, endDate } = filters;

    const matchName = fName
      ? (row.adminName || '').toLowerCase() === fName.toLowerCase()
      : true;
    const matchType = fileType
      ? (row.fileType || '').toLowerCase() === fileType.toLowerCase()
      : true;

    const when = row.downloadedAt ? new Date(row.downloadedAt) : null;
    const matchStart = startDate ? when && when >= new Date(startDate) : true;
    const matchEnd = endDate ? when && when <= new Date(`${endDate}T23:59:59`) : true;

    return matchName && matchType && matchStart && matchEnd;
  });

  return (
    <div style={{ padding: '20px', margin: 'auto' }}>
      <div
        style={{
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          padding: '20px',
          backgroundColor: '#fff',
        }}
        className="d-flex flex-row gap-2 align-items-center flex-wrap"
      >
        <select
          value={filters.adminName}
          onChange={(e) => setFilters({ ...filters, adminName: e.target.value })}
        >
          <option value="">All Admin Names</option>
          {adminList.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={filters.fileType}
          onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
        >
          <option value="">All Types</option>
          {fileTypes.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
        <button
          onClick={() => setFilters({ adminName: '', fileType: '', startDate: '', endDate: '' })}
          style={{
            padding: '4px 10px',
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reset Filters
        </button>
      </div>

      <button
        className="btn btn-secondary mb-3 mt-3"
        style={{ background: 'tomato' }}
        onClick={handlePrint}
      >
        Print
      </button>

      <h2 style={{ textAlign: 'center' }}>Download History</h2>

      {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}

      <div ref={tableRef}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
          border="1"
        >
          <thead style={{ backgroundColor: '#f7f7f7' }}>
            <tr>
              <th>S.No</th>
              <th>Admin Name</th>
              <th>Role</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Page</th>
              <th>Downloaded At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>No download records found.</td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={row._id || idx}>
                  <td>{idx + 1}</td>
                  <td>{row.adminName || 'Unknown'}</td>
                  <td>{row.role || '-'}</td>
                  <td>{row.fileName || '-'}</td>
                  <td>{(row.fileType || '-').toUpperCase()}</td>
                  <td>{row.pageName || '-'}</td>
                  <td>
                    {row.downloadedAt
                      ? new Date(row.downloadedAt).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DownloadHistory;
