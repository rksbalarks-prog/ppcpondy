


import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AllBillsTable = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
const [filters, setFilters] = useState({
  billNo: '',
  billDate: '',
  ppId: '',
  planName: ''
});

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bills`);
      if (response.data.success) {
        setBills(response.data.data);
      } else {
        throw new Error('Failed to fetch bills');
      }
    } catch (err) {
      setError(err.message || 'Error fetching bills');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = (type, ppcId) => {
    if (type === 'Bill' && ppcId) {
      navigate(`/dashboard/edit-bill/${ppcId}`);
    }
  };
  const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilters((prev) => ({ ...prev, [name]: value }));
};

const handleResetFilters = () => {
  setFilters({ billNo: '', billDate: '', ppId: '', planName: '' });
};
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
const filteredBills = bills.filter((bill) => {
  return (
    (!filters.billNo || bill.billNo?.toLowerCase().includes(filters.billNo.toLowerCase())) &&
    (!filters.ppId || bill.ppId?.toLowerCase().includes(filters.ppId.toLowerCase())) &&
    (!filters.planName || bill.planName?.toLowerCase().includes(filters.planName.toLowerCase())) &&
    (!filters.billDate || bill.billDate === filters.billDate)
  );
});

  if (loading) return <p>Loading bills...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="container mt-4">
      <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="row mb-3">
  <div className="col-md-2">
    <input
      type="text"
      name="billNo"
      value={filters.billNo}
      onChange={handleFilterChange}
      className="form-control"
      placeholder="Bill No"
    />
  </div>
  <div className="col-md-2">
    <input
      type="text"
      name="ppId"
      value={filters.ppId}
      onChange={handleFilterChange}
      className="form-control"
      placeholder="PP ID"
    />
  </div>
  <div className="col-md-2">
    <input
      type="text"
      name="planName"
      value={filters.planName}
      onChange={handleFilterChange}
      className="form-control"
      placeholder="Plan Name"
    />
  </div>
  <div className="col-md-2">
    <input
      type="date"
      name="billDate"
      value={filters.billDate}
      onChange={handleFilterChange}
      className="form-control"
    />
  </div>
  <div className="col-md-2">
    <button className="btn btn-secondary w-100" onClick={handleResetFilters}>
      Reset
    </button>
  </div>
</div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 className="mb-3">All Bills</h2>
      <div className="table-responsive" ref={tableRef}>
        <table className="table table-bordered table-striped table-hover">
          <thead className="thead-dark">
            <tr>
              <th>#</th>
              <th>Bill No</th>
              <th>Bill Date</th>
              <th>Bill Created By</th>
              <th>Admin Name</th>
              <th>Admin Office</th>
              <th>PP ID</th>
              <th>Owner Phone</th>
              <th>Payment Type</th>
              <th>Plan Name</th>
              <th>Bill Amount</th>
              <th>Validity (days)</th>
              <th>No. of Ads</th>
              <th>Featured Amount</th>
              <th>Featured Validity</th>
              <th>Featured Max Ads</th>
              <th>Discount</th>
              <th>Net Amount</th>
              <th>Created At</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan="20" className="text-center">No bills found</td>
              </tr>
            ) : (
              filteredBills.map((bill, index) => (
                <tr key={bill._id}>
                  <td>{index + 1}</td>
                  <td>{bill.billNo}</td>
                  <td>{bill.billDate}</td>
                  <td>{bill.billCreatedBy}</td>
                  <td>{bill.adminName}</td>
                  <td>{bill.adminOffice}</td>
                  <td>{bill.ppId}</td>
                  <td>{bill.ownerPhone}</td>
                  <td>{bill.paymentType}</td>
                  <td>{bill.planName}</td>
                  <td>{bill.billAmount}</td>
                  <td>{bill.validity}</td>
                  <td>{bill.noOfAds}</td>
                  <td>{bill.featuredAmount}</td>
                  <td>{bill.featuredValidity}</td>
                  <td>{bill.featuredMaxAds}</td>
                  <td>{bill.discount}</td>
                  <td>{bill.netAmount}</td>
                  <td>{new Date(bill.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleCreateBill('Bill', bill.ppId)}
                    >
                      Edit Bill
                    </button>
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

export default AllBillsTable;
