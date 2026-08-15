 

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { MdDeleteForever } from 'react-icons/md';
import { Table, Button } from 'react-bootstrap';

const DetailedViewsTable = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchDetailedViews = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-views-admin`, { params });
      setData(response.data);
      setCurrentPage(1); // Reset to first page on search
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDetailedViews();
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
  const handleSearch = () => {
    fetchDetailedViews();
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/delete-view/${id}`);
      fetchDetailedViews();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">User File Views with Timestamps</h2>

      <div className="d-flex flex-row gap-2 align-items-center flex-nowrap"
        style={{
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          padding: '20px',
          backgroundColor: '#fff'
        }}>
        <div>
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button style={{ background: "blue" }}
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
                     <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      </div>
<div ref={tableRef}>
      <Table striped bordered hover responsive className="table-sm align-middle mt-4">
        <thead className="sticky-top bg-light">
          <tr>
            <th className="border px-4 py-2">User Name</th>
            <th className="border px-4 py-2">Viewed File</th>
            <th className="border px-4 py-2">View Time</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentData.length > 0 ? (
            currentData.map((entry, index) => (
              <tr key={index} className="text-center">
                <td className="border px-4 py-2">{entry.userName || 'N/A'}</td>
                <td className="border px-4 py-2">{entry.viewedFile || 'N/A'}</td>
                <td className="border px-4 py-2">{moment(entry.viewTime).format('YYYY-MM-DD ,  hh:mm A')}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="text-danger fs-5"
                  >
                    <MdDeleteForever />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-3">No data available</td>
            </tr>
          )}
        </tbody>
      </Table>
</div>
      {data.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button onClick={handlePrevious} className='bg-primary' disabled={currentPage === 1}>Previous</Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button onClick={handleNext} className='bg-success' disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default DetailedViewsTable;
