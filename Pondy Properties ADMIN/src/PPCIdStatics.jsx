



import axios from 'axios';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 50;

const PPCIdStatics = () => {
  const [activityData, setActivityData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPpcId, setSearchPpcId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get-ppcid-activity-counts`);
        if (!response.ok) throw new Error(` ${response.status}`);
        const result = await response.json();
        if (result.data) {
          setActivityData(result.data);
          setFilteredData(result.data);
        } else {
          setActivityData([]);
          setFilteredData([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
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
  // Filter by PPC ID
  useEffect(() => {
    const filtered = activityData.filter((item) =>
      searchPpcId ? item.ppcId.toString().includes(searchPpcId) : true
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchPpcId, activityData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <p style={{ textAlign: 'center' }}>Loading activity counts...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', margin: 'auto' }}>
      <div style={{
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        backgroundColor: '#fff'
      }} className="d-flex flex-row gap-2 align-items-center flex-nowrap">
        <input
          type="text"
          placeholder="Search by PPC ID"
          value={searchPpcId}
          onChange={(e) => setSearchPpcId(e.target.value)}
        />
      </div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 style={{ textAlign: 'center' }}>User Property Activity Counts</h2>
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
            <th>PPC ID</th>
            <th>Interest Count</th>
            <th>Contact Count</th>
            <th>Favorite Count</th>
            <th>Photo Request Count</th>
            <th>Offer Count</th>
                        <th>Views Count</th>
            <th>Called List Count</th>
            <th>Status</th>

           
          </tr>
        </thead>
        <tbody>
          {paginatedData.map(({
            ppcId, interestCount, contactCount, favoriteCount,
            photoRequestCount, offerCount,viewCount,callCount, createdAt, updatedAt, status
          }, idx) => (
            <tr key={ppcId}>
              <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
              <td>{ppcId}</td>
              <td>{interestCount}</td>
              <td>{contactCount}</td>
              <td>{favoriteCount}</td>
              <td>{photoRequestCount}</td>
              <td>{offerCount}</td>
                            <td>{viewCount}</td>
              <td>{callCount}</td>
                            <td>{status}</td>


            
            </tr>
          ))}
        </tbody>
      </table>
</div>
      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          style={{ marginRight: '10px', padding: '6px 12px' }}
        >
          ⬅ Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          style={{ marginLeft: '10px', padding: '6px 12px' }}
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default PPCIdStatics;












