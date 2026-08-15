










import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaPrint } from 'react-icons/fa';
import { Table } from 'react-bootstrap';

const GetBillDatas = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  
              const printRef = useRef();    
      
          const handlePrint = () => {
            const printContents = printRef.current.innerHTML;
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContents;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // reload to restore event bindings
        };


  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/bills`); // Adjust base URL if needed
      setBills(response.data.data);
      setFilteredBills(response.data.data); // Initially display all bills
    } catch (error) {
    }
  };

  const handleDateFilter = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = bills.filter((bill) => {
      const billDate = new Date(bill.billDate);
      return billDate >= start && billDate <= end;
    });

    setFilteredBills(filtered);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">All Bills</h2>
      
      {/* Date Filter Form */}
      <div className="mb-3">
        <label htmlFor="startDate" className="mr-2">Start Date:</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mr-3"
        />
        <label htmlFor="endDate" className="mr-2">End Date:</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mr-3"
        />
        <button onClick={handleDateFilter} className="btn btn-primary">Filter</button>
      </div>

      {/* Bills Table */}
      <div className="table-responsive">
        <p>
                        <button className='bg-success text-white' onClick={handlePrint} style={{ marginRight: '10px' }}>
                            <FaPrint /> Print All
                        </button>
                        {/* <a href="#export">Export All to Excel</a> */}
                    </p>
        
                    <div className="table-container" ref={printRef}>
                    <Table striped bordered hover responsive className="table-sm align-middle">
                    <thead className="sticky-top">
            <tr>
              <th>Admin Office</th>
              <th>Admin Name</th>
              <th>PP ID</th>
              <th>Bill No</th>
              <th>Bill Date</th>
              <th>Owner Phone</th>
              <th>Payment Type</th>
              <th>Plan Name</th>
              <th>Bill Amount</th>
              <th>Validity</th>
              <th>No of Ads</th>
              <th>Featured Amount</th>
              <th>Featured Validity</th>
              <th>Featured Max Ads</th>
              <th>Discount</th>
              <th>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill) => (
              <tr key={bill._id}>
                <td>{bill.adminOffice}</td>
                <td>{bill.adminName}</td>
                <td>{bill.ppId}</td>
                <td>{bill.billNo}</td>
                <td>{new Date(bill.billDate).toLocaleDateString()}</td>
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
              </tr>
            ))}
          </tbody>
        </Table>
        </div>
      </div>
    </div>
  );
};

export default GetBillDatas;
