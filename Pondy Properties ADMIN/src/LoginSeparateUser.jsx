import React, { useState } from 'react';
import axios from 'axios';
import PhoneCell from "./components/PhoneCell";

const LoginSeparateUser = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [data, setData] = useState(null);
  const [viewType, setViewType] = useState(null); // 'perDay' or 'everyDay'
  const [loading, setLoading] = useState(false);
const [phoneFilter, setPhoneFilter] = useState('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [filteredData, setFilteredData] = useState(null);

// Filter handler
const handleFilter = () => {
  if (!data) return;

  if (viewType === 'perDay') {
    if (
      (!phoneFilter || data.phone.includes(phoneFilter)) &&
      (!startDate || new Date(data.date) >= new Date(startDate)) &&
      (!endDate || new Date(data.date) <= new Date(endDate))
    ) {
      setFilteredData(data);
    } else {
      setFilteredData(null);
    }
  } else if (viewType === 'everyDay') {
    const filteredHistory = data.history.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        (!startDate || entryDate >= new Date(startDate)) &&
        (!endDate || entryDate <= new Date(endDate))
      );
    });

    if (!phoneFilter || data.phone.includes(phoneFilter)) {
      setFilteredData({ phone: data.phone, history: filteredHistory });
    } else {
      setFilteredData(null);
    }
  }
};

const handleReset = () => {
  setPhoneFilter('');
  setStartDate('');
  setEndDate('');
  setFilteredData(null);
};

  const handleFetch = async (type) => {
    if (!phoneNumber) {
      alert("Please enter a phone number");
      return;
    }

    setViewType(type);
    setLoading(true);
    setData(null);

    try {
     const endpoint =
  type === 'perDay'
    ? '/user-app-opens-per-day'
    : '/user-app-opens-every-day';


      const response = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        params: { phoneNumber }
      });

      setData(response.data);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };
 
return (
  <div className="container mt-4">

    {/* Filter Section */}
    <div className="card mb-4">
     
      <div style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="card-body">
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="form-label">Phone</label>
            <input
              type="text"
              className="form-control"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Enter phone"
            />
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleFilter}>
              Filter
            </button>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Phone Input & Buttons Section */}
    <div className="card mb-4">
      <div className="card-header text-info fs-5">
        <strong>Get Separate Login User Data</strong>
      </div>
      <div  className="card-body">
        <div  className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <input
              type="text"
              className="form-control"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ minWidth: "250px" }}
            />
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => handleFetch('perDay')}>
              Per Day Data
            </button>
          </div>
          <div>
            <button className="btn btn-success" onClick={() => handleFetch('everyDay')}>
              Every Day History
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Loader */}
    {loading && <p>Loading...</p>}

    {/* Per Day Data Table */}
    {viewType === 'perDay' && (filteredData || data) && (
      <div className="mt-3">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Phone</th>
              <th>Date</th>
              <th>Open Count</th>
              <th>Times Opened</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><PhoneCell phone={(filteredData || data).phone} type="any" /></td>
              <td>{(filteredData || data).date}</td>
              <td>{(filteredData || data).count}</td>
              <td>
                <ul className="mb-0 ps-3">
                  {(filteredData || data).timesOpened.map((time, index) => (
                    <li key={index}>{new Date(time).toLocaleString()}</li>
                  ))}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Every Day History Table */}
    {viewType === 'everyDay' && (filteredData || data) && (
      <div className="mt-3">
        <h5>Phone: <PhoneCell phone={(filteredData || data).phone} type="any" /></h5>
        <table className="table table-bordered mt-2">
          <thead>
            <tr>
              <th>Date</th>
              <th>Open Count</th>
              <th>Times Opened</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || data).history.map((entry, index) => (
              <tr key={index}>
                <td>{entry.date}</td>
                <td>{entry.count}</td>
                <td>
                  <ul>
                    {entry.timesOpened.map((time, idx) => (
                      <li key={idx}>{new Date(time).toLocaleString()}</li>
                    ))}
                  </ul>
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

export default LoginSeparateUser;

