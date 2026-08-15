
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap';
import './App.css'
const LoginReport = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterNumber, setFilterNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);

  // Fetch data using Axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://ppcpondy.com/PPC/user/all');
        
        if (response.status === 200 && Array.isArray(response.data.data)) {
          // Ensure the response data is an array
          setData(response.data.data);
          setFilteredData(response.data.data);
        } else {
          setError('Error: Invalid response structure or empty data');
        }
      } catch (err) {
        // Handle and log error
        setError('Error fetching data. Please check your API or network.');
      }
    };

    fetchData();
  }, []);

  // Filter data whenever the inputs change
  useEffect(() => {
    const result = data.filter(
      (item) =>
        (!filterNumber || item.phone.toString().includes(filterNumber)) &&
        (!startDate || new Date(item.loginDate) >= new Date(startDate)) &&
        (!endDate || new Date(item.loginDate) <= new Date(endDate))
    );
    setFilteredData(result);
  }, [filterNumber, startDate, endDate, data]);

  return (
    <div>
      {/* Filter Section */}
      <div className="d-flex mb-3 mt-5 p-4 loginformsearch" style={{ background: "transparent", borderRadius: '45px', border: '2px solid #1b2559' }}>
        <input
          type="number"
          placeholder="Number"
          value={filterNumber}
          onChange={(e) => setFilterNumber(e.target.value)}
          style={{
            background: 'transparent',
            outline: 'none',
            border: 'none',
            color: '#1b2559',
            fontWeight: 'bold',
            padding: '8px 10px',
          }}
          className="loginform form-control me-2"
        />
            <input
      type="number"
      placeholder="Number"
      value={filterNumber}
      onChange={(e) => setFilterNumber(e.target.value)}
      style={{
        background: 'transparent',
        outline: 'none',
        border: 'none',
        color: '#1b2559',
        fontWeight: 'bold',
        padding: '8px 10px',
      }}
      onFocus={(e) => {
        e.target.style.outline = "none";
        e.target.style.border = "none";
      }}
      onBlur={(e) => {
        e.target.style.outline = "none";
        e.target.style.border = "none";
      }}
      className="loginform form-control me-2"
    />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            background: 'transparent',
            outline: 'none',
            border: 'none',
            color: '#1b2559',
            fontWeight: 'bold',
            padding: '8px 10px',
          }}
          className="loginform form-control me-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            background: 'transparent',
            outline: 'none',
            border: 'none',
            color: '#1b2559',
            fontWeight: 'bold',
            padding: '8px 10px',
          }}
          className="loginform form-control"
        />
      </div>

      {/* Table Section */}
      <div className="table-responsive p-5">
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <Table className='fixed-table'
          >
            <thead style={{ backgroundColor: '#f4f7fa' }}>
              <tr>
                <th>S.No</th>
                <th>Phone</th>
                <th>OTP</th>
                <th>Login Date</th>
                <th>OTP Status</th>
                <th>Country Code</th>
                <th>Login Mode</th>
                <th>Report Date</th>
                <th>Deleted Date</th>
                <th>Version</th>
                <th>Staff Name</th>
                <th>Remarks</th>
                <th>Banned Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>{item.phone}</td>
                    <td>{item.otp}</td>
                    <td>
                      {new Date(item.loginDate).toLocaleDateString()}
                    </td>
                    <td>{item.otpStatus}</td>
                    <td>{item.countryCode}</td>
                    <td>{item.loginMode}</td>
                    <td>
                      {item.reportDate ? new Date(item.reportDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      {item.deletedDate ? new Date(item.deletedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>{item.version || 'N/A'}</td>
                    <td>{item.staffName || 'N/A'}</td>
                    <td>{item.remarks || 'N/A'}</td>
                    <td>
                      {item.bannedDate ? new Date(item.bannedDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
      
    </div>
  );
};

export default LoginReport;