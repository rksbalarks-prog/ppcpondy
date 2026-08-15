import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaPrint } from 'react-icons/fa';
import { Table, Modal, Button, Form } from 'react-bootstrap';

const TransferFollowupDatas = () => {
  const [followups, setFollowups] = useState([]);
  const [originalFollowups, setOriginalFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const printRef = useRef();

  const [showModal, setShowModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [usernames, setUsernames] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState(null);

  const fetchAllFollowUps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list`);
      setFollowups(res.data.data);
      setOriginalFollowups(res.data.data);
    } catch (error) {
      console.error('Error fetching all follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredFollowUps = async (filterType) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list-today-past?dateFilter=${filterType}`);
      setFollowups(res.data.data);
    } catch (error) {
      console.error(`Error fetching ${filterType} follow-up data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsernames = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-usernames`);
      const uniqueNames = [...new Set(res.data.usernames || [])];
      setUsernames(uniqueNames);
    } catch (err) {
      console.error('Failed to fetch usernames:', err);
    }
  };

  useEffect(() => {
    fetchAllFollowUps();
    fetchUsernames();
  }, []);

  const handleDateFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = originalFollowups.filter((item) => {
      const followUpDate = new Date(item.followupDate);
      return followUpDate >= start && followUpDate <= end;
    });
    setFollowups(filtered);
  };

  const handleFutureFollowups = () => {
    const now = new Date();
    const filtered = originalFollowups.filter((item) => {
      const followUpDate = new Date(item.followupDate);
      return followUpDate > now;
    });
    setFollowups(filtered);
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleTransfer = async () => {
    if (!selectedFollowUp || !selectedUser) return;

    try {
      const body = {
        followupId: selectedFollowUp._id,
        fromAdmin: selectedFollowUp.adminName,
        toAdmin: selectedUser,
      };

      const res = await axios.put(`${process.env.REACT_APP_API_URL}/transfer-admin`, body);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Transferred successfully' });
        fetchAllFollowUps();
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      console.error('Transfer failed:', err);
      setMessage({ type: 'error', text: 'Transfer failed' });
    } finally {
      setShowModal(false);
      setSelectedUser('');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Follow-Up List</h2>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`} role="alert">
          {message.text}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-3 space-x-2">
        <button className="btn btn-secondary ms-2" onClick={fetchAllFollowUps}>All Follow-Up</button>
        <button className="btn btn-success ms-2" onClick={() => fetchFilteredFollowUps('today')}>Today Follow-Up</button>
        <button className="btn btn-warning ms-2" onClick={() => fetchFilteredFollowUps('past')}>Past Follow-Up</button>
        <button className="btn btn-info ms-2" onClick={handleFutureFollowups}>Future Follow-Up</button> {/* ✅ New */}
      </div>

      {/* Date Range Filter */}
      <div
        style={{ boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', padding: '20px', backgroundColor: '#fff' }}
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <label className="mr-2">Start Date:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mr-3" />
        <label className="mr-2">End Date:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mr-3" />
        <button onClick={handleDateFilter} className="btn btn-primary">Filter</button>
      </div>

      {/* Actions */}
      <div className="my-3">
        <button className="bg-success text-white btn me-2" onClick={handlePrint}>
          <FaPrint /> Print All
        </button>
        <button className="bg-info text-white btn" onClick={fetchAllFollowUps}>
          Refresh
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p>Loading...</p>
      ) : followups.length === 0 ? (
        <p>No follow-up records found.</p>
      ) : (
        <div ref={printRef}>
          <h3 className='mt-5 mb-3'>Get Follow-Up Data</h3>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top text-center">
              <tr className="bg-gray-100">
                <th>S.No</th>
                <th>PPC ID</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Type</th>
                <th>Date</th>
                <th>Remark</th>
                <th>Admin</th>
                <th>Transferred From</th>
                <th>Transferred To</th>
                <th>Transfer Date</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((item, index) => {
                const latestTransfer = item.transferHistory?.[item.transferHistory.length - 1] || {};
                return (
                  <tr key={item._id} className="text-center">
                    <td>{index + 1}</td>
                    <td>{item.ppcId}</td>
                    <td>{item.phoneNumber || '-'}</td>
                    <td>{item.followupStatus}</td>
                    <td>{item.followupType}</td>
                    <td>{new Date(item.followupDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'left', maxWidth: '220px', whiteSpace: 'pre-wrap' }}>{item.remarks || '-'}</td>
                    <td>{item.adminName}</td>
                    <td>{latestTransfer.from || '-'}</td>
                    <td>{latestTransfer.to || '-'}</td>
                    <td>{latestTransfer.date ? new Date(latestTransfer.date).toLocaleDateString() : '-'}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button size="sm" variant="info" onClick={() => {
                        setSelectedFollowUp(item);
                        setShowModal(true);
                      }}>
                        Transfer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* Transfer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Follow-Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>PPC ID:</strong> {selectedFollowUp?.ppcId}</p>
          <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">Select User</option>
            {usernames.map((name, i) => (
              <option key={i} value={name}>{name}</option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" disabled={!selectedUser} onClick={handleTransfer}>Confirm Transfer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransferFollowupDatas;
