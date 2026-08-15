



import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap';

const PayuBuyerPaylater = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
const [phoneFilter, setPhoneFilter] = useState('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payments-with-plan/pay-later-buyer`);
      setPayments(res.data.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
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
const filteredPayments = payments.filter(payment => {
  const matchesPhone = payment.phone.includes(phoneFilter);
  const createdDate = new Date(payment.createdAt);

  const isAfterStart = startDate ? createdDate >= new Date(startDate) : true;
  const isBeforeEnd = endDate ? createdDate <= new Date(endDate) : true;

  return matchesPhone && isAfterStart && isBeforeEnd;
});
  return (
    <div className="container mt-4">
            <div  className="d-flex flex-row gap-2 align-items-center flex-nowrap"
    style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}>
  <input
    type="text"
    placeholder="Filter by phone"
    value={phoneFilter}
    onChange={(e) => setPhoneFilter(e.target.value)}
    style={{ marginRight: '10px' }}
  />
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    style={{ marginRight: '10px' }}
  />
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    style={{ marginRight: '10px' }}
  />
  <button style={{background:"orange"}} onClick={() => { setStartDate(''); setEndDate(''); }}>
    Reset Dates
  </button>
</div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 className="mb-4 text-center">Pay Later Payments with Plan Details</h2>
      {loading ? (
        <p>Loading...</p>
      ) : filteredPayments.length === 0 ? (
        <p>No payment data found.</p>
      ) : (
  <div ref={tableRef}>       
     <Table striped bordered hover responsive className="table-sm align-middle">
                 <thead className="sticky-top">
              <tr>
                <th>#</th>                    
                <th>Transaction ID</th>
                                 <th>PayU User Status</th>
                <th>Amount</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Plan Name</th>
                <th>Package Type</th>
                <th>Price</th>
                <th>Used Cars</th>
                <th>Remaining Cars</th>
                <th>Duration (Days)</th>
                <th>Expiry Date</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment._id}>
                  <td>{index + 1}</td>
                  <td>{payment.txnid}</td>
                                     <td>{payment.payustatususer}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.firstname}</td>
                  <td>{payment.email}</td>
                  <td>{payment.phone}</td>
                  <td>{payment.planName || '-'}</td>
                  <td>{payment.planDetails?.packageType || '-'}</td>
                  <td>{payment.planDetails?.price || 0}</td>
                  <td>{payment.planDetails?.usedCars || 0}</td>
                  <td>{payment.planDetails?.remainingCars || 0}</td>
                  <td>{payment.planDetails?.durationDays || 0}</td>
                  <td>{payment.planDetails?.expiryDate || '-'}</td>
                  <td>{new Date(payment.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PayuBuyerPaylater;
