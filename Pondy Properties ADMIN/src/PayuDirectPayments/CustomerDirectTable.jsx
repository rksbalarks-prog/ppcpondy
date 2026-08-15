import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * CustomerDirectTable
 * -------------------
 * Read-only listing for the "Customer direct PayU" admin menu.
 *
 * Direct customer payments come from the user app's floating "Pay Now" button
 * (custom amount above Rs.100). The backend exposes them at:
 *   GET /payu-direct/paid     → successful payments
 *   GET /payu-direct/failed   → failed payments
 *
 * Both Paid and Failed pages reuse this component — only the endpoint, heading
 * and the status badge colour differ.
 */
const CustomerDirectTable = ({ endpoint, heading, statusColor = '#16a34a' }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const tableRef = useRef();

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`);
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error('Error fetching direct payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>${heading}</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h3>${heading}</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesPhone = (payment.phone || '').includes(phoneFilter);
    const createdDate = new Date(payment.createdAt);
    const isAfterStart = startDate ? createdDate >= new Date(startDate) : true;
    const isBeforeEnd = endDate ? createdDate <= new Date(endDate) : true;
    return matchesPhone && isAfterStart && isBeforeEnd;
  });

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return (
    <div className="container mt-4">
      <div
        style={{
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          padding: '20px',
          backgroundColor: '#fff',
        }}
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
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
        <button style={{ background: 'orange' }} onClick={() => { setStartDate(''); setEndDate(''); }}>
          Reset Dates
        </button>
      </div>

      <button
        className="btn btn-secondary mb-3 mt-2"
        style={{ background: 'tomato' }}
        onClick={handlePrint}
      >
        Print
      </button>

      <h2 className="mb-2 mt-4 text-center">{heading}</h2>
      <p className="text-center" style={{ fontWeight: 600 }}>
        Total: {filteredPayments.length} &nbsp;|&nbsp; Amount: ₹{totalAmount.toLocaleString('en-IN')}
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : filteredPayments.length === 0 ? (
        <p>No payment data found.</p>
      ) : (
        <div ref={tableRef}>
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover">
              <thead className="thead-dark">
                <tr>
                  <th>#</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>PayU ID</th>
                  <th>Amount</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr key={payment._id}>
                    <td>{index + 1}</td>
                    <td>
                      <span
                        style={{
                          background: statusColor,
                          color: '#fff',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {payment.payustatususer || payment.status}
                      </span>
                    </td>
                    <td>{payment.txnid}</td>
                    <td>{payment.mihpayid || '-'}</td>
                    <td>₹{payment.amount}</td>
                    <td>{payment.firstname || '-'}</td>
                    <td>{payment.email || '-'}</td>
                    <td>{payment.phone || '-'}</td>
                    <td>{new Date(payment.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectTable;
