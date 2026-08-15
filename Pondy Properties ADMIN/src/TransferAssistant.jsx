 

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaPrint } from 'react-icons/fa';
import { Table, Modal, Button, Form } from 'react-bootstrap';
import PhoneCell from "./components/PhoneCell";

const FollowUpBuyerGetTable = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const printRef = useRef();
  const [allData, setAllData] = useState([]);
  const [message, setMessage] = useState('');

  // Transfer modal
  const [showModal, setShowModal] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchAllFollowUps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/followup-list-buyer`);
      setFollowups(res.data.data || []);
      setAllData(res.data.data || []);
    } catch (error) {
      console.error('Error fetching follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminList = async () => {
    try {
      const res = await axios.get(`${API_URL}/get-all-usernames`);
      setAdminList(res.data.usernames || []);
    } catch (error) {
      console.error('Error fetching admin list:', error);
    }
  };

  useEffect(() => {
    fetchAllFollowUps();
    fetchAdminList();
  }, []);

  const fetchFilteredFollowUps = async (type) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/followup-list-today-past-buyer?dateFilter=${type}`);
      setFollowups(res.data.data || []);
    } catch (err) {
      console.error('Error filtering follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = allData.filter((item) => {
      const date = new Date(item.followupDate);
      return date >= start && date <= end;
    });
    setFollowups(filtered);
  };

  const handleFutureFollowUps = () => {
    const today = new Date();
    const filtered = allData.filter((item) => new Date(item.followupDate) > today);
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

  const openTransferModal = (followup) => {
    setSelectedFollowup(followup);
    setSelectedAdmin('');
    setShowModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedFollowup || !selectedAdmin) return;

    try {
      const body = {
        followupId: selectedFollowup._id,
        fromAdmin: selectedFollowup.adminName,
        toAdmin: selectedAdmin,
      };

      const res = await axios.put(`${API_URL}/transfer-admin-buyer`, body);
      setMessage(res.data.message);
      setShowModal(false);
      fetchAllFollowUps();
    } catch (error) {
      console.error('Transfer Error:', error);
      setMessage(error.response?.data?.message || 'Transfer failed');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Buyer Follow-Up List</h2>

      {message && <div className="alert alert-info">{message}</div>}

      {/* Filters */}
      <div className="mb-3 space-x-2">
        <button className="btn btn-secondary" onClick={fetchAllFollowUps}>All Follow-Up</button>
        <button className="btn btn-success ms-2" onClick={() => fetchFilteredFollowUps('today')}>Today</button>
        <button className="btn btn-warning ms-2" onClick={() => fetchFilteredFollowUps('past')}>Past</button>
        <button className="btn btn-info ms-2" onClick={handleFutureFollowUps}>Future</button>
      </div>

      {/* Date Filter */}
      <div className="d-flex align-items-center gap-2 mb-3 p-3 shadow-sm bg-light">
        <label>Start:</label>
        <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>End:</label>
        <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="btn btn-primary" onClick={handleDateFilter}>Apply</button>
      </div>

      {/* Print + Refresh */}
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={handlePrint}><FaPrint /> Print All</button>
        <button className="btn btn-info" onClick={fetchAllFollowUps}>Refresh</button>
      </div>

      {/* Main Table */}
      {loading ? (
        <p>Loading...</p>
      ) : followups.length === 0 ? (
        <p>No follow-up records found.</p>
      ) : (
        <div ref={printRef}>
          <Table striped bordered hover responsive>
            <thead>
              <tr className="text-center bg-secondary text-white">
                <th>#</th>
                <th>BA ID</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Type</th>
                <th>Follow-Up Date</th>
                <th>Remark</th>
                <th>Admin</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((item, index) => (
                <React.Fragment key={item._id}>
                  <tr className="text-center">
                    <td>{index + 1}</td>
                    <td>{item.ba_id}</td>
                    <td><PhoneCell phone={item.phoneNumber} type="tenant" ba_id={item.ba_id} /></td>
                    <td>{item.followupStatus}</td>
                    <td>{item.followupType}</td>
                    <td>{new Date(item.followupDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'left', maxWidth: '220px', whiteSpace: 'pre-wrap' }}>{item.remarks || '-'}</td>
                    <td>{item.adminName}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button size="sm" variant="warning" onClick={() => openTransferModal(item)}>
                        Transfer
                      </Button>
                    </td>
                  </tr>

                  {/* Transfer History Sub-Table */}
                  {item.transferHistory && item.transferHistory.length > 0 && (
                    <tr>
                      <td colSpan="10">
                        <h6>Transfer History:</h6>
                        <Table bordered size="sm" className="mb-0">
                          <thead>
                            <tr className="text-center bg-light">
                              <th>#</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.transferHistory.map((history, idx) => (
                              <tr className="text-center" key={history._id || idx}>
                                <td>{idx + 1}</td>
                                <td>{history.from}</td>
                                <td>{history.to}</td>
                                <td>{new Date(history.date).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Transfer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Follow-Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>From:</strong> {selectedFollowup?.adminName}</p>
          <Form.Group>
            <Form.Label>To Admin</Form.Label>
            <Form.Select value={selectedAdmin} onChange={(e) => setSelectedAdmin(e.target.value)}>
              <option value="">Select Admin</option>
              {adminList
                .filter((admin) => admin !== selectedFollowup?.adminName)
                .map((admin, idx) => (
                  <option key={idx} value={admin}>{admin}</option>
                ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleTransfer}>Transfer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FollowUpBuyerGetTable;
