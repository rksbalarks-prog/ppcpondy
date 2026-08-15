 

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaPrint } from 'react-icons/fa';
import { Table } from 'react-bootstrap';

const FollowUpBuyerGetTable = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const printRef = useRef();
  const [allData, setAllData] = useState([]); // store unfiltered data for future use

  // Fetch all followups
  const fetchAllFollowUps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list-buyer`);
      setFollowups(res.data.data);
      setAllData(res.data.data);
    } catch (error) {
      console.error('Error fetching all follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch followups based on dateFilter (today/past)
  const fetchFilteredFollowUps = async (filterType) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/followup-list-today-past-buyer?dateFilter=${filterType}`);
      setFollowups(res.data.data);
    } catch (error) {
      console.error(`Error fetching ${filterType} follow-up data:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllFollowUps();
  }, []);

  // Date range filter
  const handleDateFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = allData.filter((item) => {
      const followUpDate = new Date(item.followupDate);
      return followUpDate >= start && followUpDate <= end;
    });
    setFollowups(filtered);
  };

  // Future follow-up filter
  const handleFutureFollowUps = () => {
    const today = new Date();
    const filtered = allData.filter((item) => {
      const followUpDate = new Date(item.followupDate);
      return followUpDate > today;
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Buyer Follow-Up List</h2>

      {/* Filter Buttons */}
      <div className="mb-3 space-x-2">
        <button className="btn btn-secondary ms-2" onClick={fetchAllFollowUps}>All Follow-Up</button>
        <button className="btn btn-success ms-2" onClick={() => fetchFilteredFollowUps('today')}>Today Follow-Up</button>
        <button className="btn btn-warning ms-2" onClick={() => fetchFilteredFollowUps('past')}>Past Follow-Up</button>
        <button className="btn btn-info ms-2" onClick={handleFutureFollowUps}>Future Follow-Up</button>
      </div>

      {/* Date Range Filter */}
      <div style={{
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        backgroundColor: '#fff'
      }} className="d-flex flex-row gap-2 align-items-center flex-nowrap mb-3">
        <label className="mr-2">Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="form-control mr-2"
        />
        <label className="mr-2">End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="form-control mr-2"
        />
        <button onClick={handleDateFilter} className="btn btn-primary">Filter</button>
      </div>

      {/* Actions */}
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={handlePrint}>
          <FaPrint /> Print All
        </button>
        <button className="btn btn-info" onClick={fetchAllFollowUps}>
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
          <h3 className='mt-5 mb-3'>Buyer Follow-Up Data</h3>
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">
              <tr className="bg-gray-100 text-center">
                <th>S.No</th>
                <th>BA ID</th>
                <th>Phone Number</th>
                <th>Follow-Up Status</th>
                <th>Follow-Up Type</th>
                <th>Follow-Up Date</th>
                <th>Admin Name</th>
                <th>Remark</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((item, index) => (
                <tr key={item._id} className="text-center">
                  <td>{index + 1}</td>
                  <td>{item.ba_id}</td>
                  <td>{item.phoneNumber || '-'}</td>
                  <td>{item.followupStatus}</td>
                  <td>{item.followupType}</td>
                  <td>{new Date(item.followupDate).toLocaleDateString()}</td>
                  <td>{item.adminName}</td>
                  <td style={{ textAlign: "left", maxWidth: "220px", whiteSpace: "pre-wrap" }}>{item.remarks || '-'}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FollowUpBuyerGetTable;
