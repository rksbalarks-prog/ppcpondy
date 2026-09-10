import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { FaPrint } from 'react-icons/fa';
import { Table } from 'react-bootstrap';

/*
 * No Response Followups Data
 * --------------------------
 * Phone-based follow-ups created from the Login (OTP) Report when a caller's
 * Remark Status is "No Response". There is no property (ppcId) or buyer
 * (ba_id) behind these, so the table is keyed purely on the phone number.
 * Backed by the NoResponseFollowUp collection (see PPC/FollowUp).
 *
 * The Status/Type option lists below are the NoResponseFollowUp schema enums —
 * the Ring / Not Interested values plus a literal "No Response" status/type.
 */

const STATUS_OPTIONS = ['Ring', 'Ready To Pay', 'Not Decided', 'No Response', 'Not Interested-Closed', 'Paid Closed'];
const TYPE_OPTIONS = ['Payment Followup', 'Data Followup', 'Enquiry Followup', 'No Response', 'Payment Closed'];

// dd-mm-yyyy hh:mm for the Created At column (this admin has no shared date util).
const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const dedupeFollowups = (arr) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter((item) => {
    const dateKey = item.followupDate ? new Date(item.followupDate).toISOString() : '';
    const key = `${item.phoneNumber}|${dateKey}|${item.followupStatus}|${item.followupType}|${item.adminName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const RemarksInput = ({ value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', color: '#555' }}>
      <span>Remarks:</span>
      <span style={{ fontSize: '12px', fontWeight: 'normal', color: value.length >= 50 ? '#dc3545' : value.length >= 40 ? '#fd7e14' : '#6c757d' }}>
        {value.length}/50
      </span>
    </label>
    <input type="text" name="remarks" value={value} onChange={onChange} maxLength={50}
      placeholder="Enter remarks (max 50 characters)"
      style={{ padding: '10px', width: '100%', fontSize: '14px', borderRadius: '4px', border: `2px solid ${value.length >= 50 ? '#dc3545' : '#ddd'}`, boxSizing: 'border-box' }} />
  </div>
);

const NoResponseFollowUps = () => {
  const [followups, setFollowups] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createdAtStartDate, setCreatedAtStartDate] = useState('');
  const [createdAtEndDate, setCreatedAtEndDate] = useState('');
  const [phoneNumberFilter, setPhoneNumberFilter] = useState('');
  const printRef = useRef();

  // Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ phoneNumber: '', followupStatus: '', followupType: '', followupDate: '', adminName: '', remarks: '' });

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [editForm, setEditForm] = useState({ followupStatus: '', followupType: '', followupDate: '', adminName: '', remarks: '' });

  const fetchAllFollowUps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/noresponse-followup-list`);
      const deduped = dedupeFollowups(res.data.data);
      setFollowups(deduped);
      setAllData(deduped);
    } catch (error) {
      console.error('Error fetching no-response follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredFollowUps = async (filterType) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/noresponse-followup-list-today-past?dateFilter=${filterType}`);
      setFollowups(dedupeFollowups(res.data.data));
    } catch (error) {
      console.error(`Error fetching ${filterType} no-response follow-up data:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFollowUps();
  }, []);

  const handleDateFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    setFollowups(allData.filter((item) => {
      const d = new Date(item.followupDate);
      return d >= start && d <= end;
    }));
  };

  const handleCreatedAtFilter = () => {
    const start = new Date(createdAtStartDate);
    const end = new Date(createdAtEndDate);
    end.setHours(23, 59, 59, 999);
    setFollowups(allData.filter((item) => {
      const d = new Date(item.createdAt);
      return d >= start && d <= end;
    }));
  };

  const handleFutureFollowUps = () => {
    const today = new Date();
    setFollowups(allData.filter((item) => new Date(item.followupDate) > today));
  };

  const handlePhoneNumberFilter = () => {
    if (!phoneNumberFilter.trim()) {
      alert('Please enter a phone number');
      return;
    }
    setFollowups(allData.filter((item) => item.phoneNumber === phoneNumberFilter.trim()));
  };

  const handleClearPhoneNumberFilter = () => {
    setPhoneNumberFilter('');
    setFollowups(allData);
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const getFollowUpDayStatus = (followupDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(followupDate); day.setHours(0, 0, 0, 0);
    if (day.getTime() === today.getTime()) return 'Today';
    return day < today ? 'Past' : 'Future';
  };

  const getDayStatusBadgeColor = (status) => {
    switch (status) {
      case 'Today': return { backgroundColor: '#ffc107', color: '#000', fontWeight: '600' };
      case 'Past': return { backgroundColor: '#dc3545', color: '#fff', fontWeight: '600' };
      case 'Future': return { backgroundColor: '#28a745', color: '#fff', fontWeight: '600' };
      default: return { backgroundColor: '#6c757d', color: '#fff', fontWeight: '600' };
    }
  };

  const getTodayDateString = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };

  // ── Create ──
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'remarks' && value.length > 50) return;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateFollowUp = async () => {
    if (isCreating) return;
    if (!createForm.phoneNumber || !createForm.followupStatus || !createForm.followupType || !createForm.followupDate) {
      alert('⚠️ Please fill all required fields (Phone Number, Status, Type, Date)');
      return;
    }
    setIsCreating(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/noresponse-followup-create`, createForm);
      if (res.status === 201 || res.data?.success) {
        alert('✅ Follow-up created successfully!');
        setShowCreateModal(false);
        setCreateForm({ phoneNumber: '', followupStatus: '', followupType: '', followupDate: '', adminName: '', remarks: '' });
        // Refresh the red/green PhoneCell indicators across the dashboard.
        window.dispatchEvent(new Event('followups-updated'));
        fetchAllFollowUps();
      }
    } catch (error) {
      alert('❌ Failed to create follow-up!\n' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  // ── Edit ──
  const handleEdit = useCallback((followUp) => {
    setEditingFollowUp(followUp);
    setEditForm({
      followupStatus: followUp.followupStatus,
      followupType: followUp.followupType,
      followupDate: followUp.followupDate ? followUp.followupDate.split('T')[0] : '',
      adminName: followUp.adminName || '',
      remarks: followUp.remarks || '',
    });
    setShowEditModal(true);
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'remarks' && value.length > 50) return;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingFollowUp?._id) { alert('Error: Follow-up ID not found'); return; }
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/noresponse-followup-update/${editingFollowUp._id}`, editForm);
      if (res.status === 200) {
        alert('✅ Follow-up updated successfully!');
        setShowEditModal(false);
        setEditingFollowUp(null);
        fetchAllFollowUps();
      }
    } catch (error) {
      alert('❌ Failed to update follow-up!\n' + (error.response?.data?.message || error.message));
    }
  };

  // ── Table ──
  const tableHead = (bg, color) => (
    <tr style={bg ? { backgroundColor: bg, color } : {}} className="text-center">
      <th>S.No</th><th>Phone Number</th><th>Follow-Up Status</th><th>Follow-Up Type</th>
      <th>Follow-Up Date</th><th>Follow-up Day</th><th>Admin Name</th><th>Remarks</th>
      <th>Created At</th><th>Edit Followup</th>
    </tr>
  );

  const renderRow = (item, index, rowBg) => (
    <tr key={item._id} className="text-center" style={rowBg ? { backgroundColor: rowBg } : {}}>
      <td>{index + 1}</td>
      <td>{item.phoneNumber || '-'}</td>
      <td>
        {item.followupStatus === 'Paid Closed' || item.followupStatus === 'Not Interested-Closed' ? (
          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', backgroundColor: item.followupStatus === 'Paid Closed' ? '#28a745' : '#dc3545', color: 'white' }}>
            {item.followupStatus}
          </span>
        ) : item.followupStatus}
      </td>
      <td>{item.followupType}</td>
      <td>{new Date(item.followupDate).toLocaleDateString()}</td>
      <td>
        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', ...getDayStatusBadgeColor(getFollowUpDayStatus(item.followupDate)) }}>
          {getFollowUpDayStatus(item.followupDate)}
        </span>
      </td>
      <td>{item.adminName || '-'}</td>
      <td>
        {item.remarks ? (
          <span style={{ display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#555' }} title={item.remarks}>
            {item.remarks}
          </span>
        ) : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.createdAt)}</td>
      <td><button className="btn btn-sm btn-warning" onClick={() => handleEdit(item)}>✏️ Edit</button></td>
    </tr>
  );

  const openFollowups = followups.filter((i) => i.followupStatus !== 'Not Interested-Closed' && i.followupStatus !== 'Paid Closed');
  const section = (label) => openFollowups.filter((i) => getFollowUpDayStatus(i.followupDate) === label);
  const closed = followups.filter((i) => i.followupStatus === 'Not Interested-Closed' || i.followupStatus === 'Paid Closed');

  return (
    <div className="p-4">
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-50px); } to { opacity: 1; transform: translateY(0); } }
        .toolbar-card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 14px 18px; margin-bottom: 12px; }
        .filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; }
        .filter-label { font-weight: 700; font-size: 13px; color: #444; white-space: nowrap; min-width: 110px; }
        .filter-date-group { display: flex; align-items: center; gap: 6px; flex: 1; }
        .filter-date-group label { font-size: 12px; color: #666; white-space: nowrap; margin: 0; }
        .filter-date-group input[type="date"] { padding: 5px 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 13px; height: 34px; width: 150px; }
        .filter-divider { height: 1px; background: #f0f0f0; margin: 10px 0; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>No Response Follow-Up List</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>+ Open No-Response Follow-Up</button>
      </div>

      {/* Toolbar */}
      <div className="toolbar-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#444', marginRight: '4px' }}>Filter:</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchAllFollowUps}>All</button>
          <button className="btn btn-success btn-sm" onClick={() => fetchFilteredFollowUps('today')}>Today</button>
          <button className="btn btn-warning btn-sm" onClick={() => fetchFilteredFollowUps('past')}>Past</button>
          <button className="btn btn-info btn-sm" onClick={handleFutureFollowUps}>Future</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-success btn-sm" onClick={handlePrint}><FaPrint style={{ marginRight: '4px' }} />Print All</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchAllFollowUps}>↺ Refresh</button>
          </div>
        </div>
        <div className="filter-divider" />
        <div className="filter-row" style={{ marginBottom: '10px' }}>
          <span className="filter-label">📞 Phone Number:</span>
          <div className="filter-date-group">
            <input
              type="text"
              value={phoneNumberFilter}
              onChange={(e) => setPhoneNumberFilter(e.target.value)}
              placeholder="Enter phone number"
              style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px', flex: 1, maxWidth: '200px' }}
            />
            <button onClick={handlePhoneNumberFilter} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>Filter</button>
            <button onClick={handleClearPhoneNumberFilter} className="btn btn-outline-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>Clear</button>
          </div>
        </div>
        <div className="filter-row" style={{ marginBottom: '10px' }}>
          <span className="filter-label">📅 Follow-Up Date:</span>
          <div className="filter-date-group">
            <label>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button onClick={handleDateFilter} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>Filter</button>
          </div>
        </div>
        <div className="filter-row">
          <span className="filter-label">🗓 Created At:</span>
          <div className="filter-date-group">
            <label>From</label>
            <input type="date" value={createdAtStartDate} onChange={(e) => setCreatedAtStartDate(e.target.value)} />
            <label>To</label>
            <input type="date" value={createdAtEndDate} onChange={(e) => setCreatedAtEndDate(e.target.value)} />
            <button onClick={handleCreatedAtFilter} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>Filter</button>
          </div>
        </div>
      </div>

      {/* Tables */}
      {loading ? (
        <p>Loading...</p>
      ) : followups.length === 0 ? (
        <p>No follow-up records found.</p>
      ) : (
        <div ref={printRef}>
          <h5 className="mt-4 mb-2" style={{ fontWeight: '600', color: '#333' }}>All No-Response Followup Data (Today, Future, Past)</h5>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">{tableHead()}</thead>
            <tbody>{openFollowups.map((item, index) => renderRow(item, index))}</tbody>
          </Table>
        </div>
      )}

      {section('Today').length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h5 className="mb-2" style={{ color: '#d39e00', borderBottom: '2px solid #ffc107', paddingBottom: '8px', fontWeight: '700' }}>📅 Today Follow-Ups</h5>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">{tableHead('#fff3cd', '#856404')}</thead>
            <tbody>{section('Today').map((item, index) => renderRow(item, index, '#fffbf0'))}</tbody>
          </Table>
        </div>
      )}

      {section('Future').length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h5 className="mb-2" style={{ color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '8px', fontWeight: '700' }}>➡️ Future Follow-Ups</h5>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">{tableHead('#d4edda', '#155724')}</thead>
            <tbody>{section('Future').map((item, index) => renderRow(item, index, '#f1f9f1'))}</tbody>
          </Table>
        </div>
      )}

      {section('Past').length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h5 className="mb-2" style={{ color: '#dc3545', borderBottom: '2px solid #dc3545', paddingBottom: '8px', fontWeight: '700' }}>⏰ Past Follow-Ups (Overdue)</h5>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">{tableHead('#f8d7da', '#721c24')}</thead>
            <tbody>{section('Past').map((item, index) => renderRow(item, index, '#fff5f5'))}</tbody>
          </Table>
        </div>
      )}

      {closed.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h5 className="mb-2" style={{ color: '#6c757d', borderBottom: '2px solid #6c757d', paddingBottom: '8px', fontWeight: '700' }}>✓ Closed Follow-Ups (Not Interested-Closed / Paid Closed)</h5>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">{tableHead('#e2e3e5', '#383d41')}</thead>
            <tbody>{closed.map((item, index) => renderRow(item, index, '#f8f9fa'))}</tbody>
          </Table>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, overflow: 'auto', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '100%', maxWidth: '550px', margin: 'auto', position: 'relative', animation: 'slideDown 0.3s ease' }}>
            <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'transparent', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666' }}>×</button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333', fontSize: '1.5rem', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Create No-Response Follow-Up</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Phone Number: <span style={{ color: '#dc3545' }}>*</span></label>
              <input type="text" name="phoneNumber" placeholder="Enter phone number" value={createForm.phoneNumber} onChange={handleCreateChange}
                style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
            </div>

            {[{ label: 'Follow-up Status', name: 'followupStatus', options: STATUS_OPTIONS }, { label: 'Follow-up Type', name: 'followupType', options: TYPE_OPTIONS }].map(({ label, name, options }) => (
              <div key={name} style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>{label}: <span style={{ color: '#dc3545' }}>*</span></label>
                <select name={name} value={createForm[name]} onChange={handleCreateChange}
                  style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                  <option value="">Select</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Follow-up Date: <span style={{ color: '#dc3545' }}>*</span></label>
              <input type="date" name="followupDate" value={createForm.followupDate} onChange={handleCreateChange} min={getTodayDateString()}
                style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }} />
            </div>

            <RemarksInput value={createForm.remarks} onChange={handleCreateChange} />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Admin Name:</label>
              <input type="text" name="adminName" placeholder="Enter admin name" value={createForm.adminName} onChange={handleCreateChange}
                style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 25px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleCreateFollowUp} disabled={isCreating}
                style={{ padding: '10px 25px', backgroundColor: isCreating ? '#6c9fd8' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isCreating ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>
                {isCreating ? 'Creating...' : 'Create Follow-Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, overflow: 'auto', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '100%', maxWidth: '550px', margin: 'auto', position: 'relative', animation: 'slideDown 0.3s ease' }}>
            <button onClick={() => setShowEditModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'transparent', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666' }}>×</button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333', fontSize: '1.5rem', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Edit No-Response Follow-Up</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Phone Number:</label>
              <input type="text" value={editingFollowUp?.phoneNumber || ''} disabled
                style={{ padding: '10px', width: '100%', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', color: '#666' }} />
            </div>

            {[{ label: 'Follow-up Status', name: 'followupStatus', options: STATUS_OPTIONS }, { label: 'Follow-up Type', name: 'followupType', options: TYPE_OPTIONS }].map(({ label, name, options }) => (
              <div key={name} style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>{label}:</label>
                <select name={name} value={editForm[name]} onChange={handleEditChange}
                  style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                  <option value="">Select</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Follow-up Date:</label>
              <input type="date" name="followupDate" value={editForm.followupDate} onChange={handleEditChange} min={getTodayDateString()}
                style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }} />
            </div>

            <RemarksInput value={editForm.remarks} onChange={handleEditChange} />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#555' }}>Admin Name:</label>
              <input type="text" name="adminName" value={editForm.adminName} onChange={handleEditChange}
                style={{ padding: '10px', width: '100%', border: '2px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 25px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '10px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoResponseFollowUps;
