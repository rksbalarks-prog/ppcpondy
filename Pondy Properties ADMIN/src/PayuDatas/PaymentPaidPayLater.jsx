 

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const PaymentPaidPayNow = () => {
  const [payments, setPayments] = useState([]);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [captcha, setCaptcha] = useState(null);
  const [ppcIdToPay, setPpcIdToPay] = useState(null);
  const [userInput, setUserInput] = useState("");
  const tableRef = useRef();

  useEffect(() => {
    fetchPayments();
  }, []);

  // Fetch all payments
  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payments/pay-later`);
      setPayments(res.data.payments || res.data.data || []);
    } catch (error) {
      console.error("Error fetching pay-now payments:", error);
    }
  };


  // Handle Pay Now with confirmation + captcha modal
  const handlePayNow = (ppcId) => {
    const confirmAction = window.confirm(`Are you sure you want to pay for PPC ID: ${ppcId}?`);
    if (!confirmAction) return;

    // Generate simple captcha
    const newCaptcha = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptcha(newCaptcha);
    setPpcIdToPay(ppcId);
  };

  const confirmCaptcha = async () => {
    if (userInput !== captcha) {
      alert("Wrong captcha! Payment cancelled.");
      setCaptcha(null);
      setUserInput("");
      setPpcIdToPay(null);
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/pay-now/${ppcIdToPay}`);
      if (res.data.status === "success") {
        alert(`✅ Payment updated for PPC ID: ${ppcIdToPay}`);
        fetchPayments(); // Refresh the table
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Error updating payment");
    } finally {
      setCaptcha(null);
      setUserInput("");
      setPpcIdToPay(null);
    }
  };

  // Filter payments (exclude already paid)
  const filteredPayments = payments
    .filter((payment) => payment.payustatususer !== "paid")
    .filter((payment) => {
      const matchesPhone = payment.phone?.includes(phoneFilter);
      const createdDate = new Date(payment.createdAt);
      const isAfterStart = startDate ? createdDate >= new Date(startDate) : true;
      const isBeforeEnd = endDate ? createdDate <= new Date(endDate) : true;
      return matchesPhone && isAfterStart && isBeforeEnd;
    });

  // Handle table printing
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
          <h3>Filtered Payments</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container mt-4">
      {/* Filters */}
      <div
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff",
        }}
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <input
          type="text"
          placeholder="Filter by phone"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button
          style={{ background: "orange", color: "#fff" }}
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
        >
          Reset Dates
        </button>
      </div>

      {/* Print Button */}
      <button
        className="btn btn-secondary mb-3 mt-3"
        style={{ background: "tomato", color: "#fff" }}
        onClick={handlePrint}
      >
        Print
      </button>

      <h2 className="mb-4 text-center">Pay Now Payments with Plan Details</h2>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <p>No payment data found.</p>
      ) : (
        <div className="table-responsive" ref={tableRef}>
          <table className="table table-bordered table-striped table-hover">
            <thead className="thead-dark">
              <tr>
                <th>#</th>
                <th>Transaction ID</th>
                <th>PayU User Status</th>
                <th>Amount</th>
                <th>Name</th>
                <th>PPC ID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Plan Name</th>
                <th>Package Type</th>
                <th>Price</th>
                <th>Used Cars</th>
                <th>Remaining Cars</th>
                <th>Duration (Days)</th>
                <th>Expiry Date</th>
                <th>Payu Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment._id}>
                  <td>{index + 1}</td>
                  <td>{payment.txnid}</td>
                  <td>{payment.payustatususer || "-"}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.firstname}</td>
                  <td>{payment.ppcId}</td>
                  <td>{payment.email}</td>
                  <td>{payment.phone}</td>
                  <td>{payment.planName || "-"}</td>
                  <td>{payment.planDetails?.packageType || "-"}</td>
                  <td>{payment.planDetails?.price || 0}</td>
                  <td>{payment.planDetails?.usedCars || 0}</td>
                  <td>{payment.planDetails?.remainingCars || 0}</td>
                  <td>{payment.planDetails?.durationDays || 0}</td>
                  <td>{payment.planDetails?.expiryDate || "-"}</td>
                  <td>{new Date(payment.payUdate).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handlePayNow(payment.ppcId)}
                    >
                      Pay Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Captcha Modal */}
      {captcha && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "300px",
            }}
          >
            <p>
              Enter the captcha to confirm: <b>{captcha}</b>
            </p>
            <input
              type="text"
              className="form-control"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter captcha"
            />
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <button className="btn btn-success" onClick={confirmCaptcha}>
                Submit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setCaptcha(null);
                  setUserInput("");
                  setPpcIdToPay(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPaidPayNow;




