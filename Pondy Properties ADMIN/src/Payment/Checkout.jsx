import React, { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import axios from 'axios';

const Checkout = () => {
  const [formData, setFormData] = useState({
    amount: '100',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:3001/api/payments/orders',
        formData
      );
      
      setPaymentSessionId(response.data.data.payment_session_id);
      setPaymentReady(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    try {
      const cashfree = await load({
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      });
      
      cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self"
      });
    } catch (err) {
      setError('Failed to initialize payment');
    }
  };

  return (
    <div className="checkout-container">
      <h2>Payment Checkout</h2>
      
      {!paymentReady ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (INR)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </form>
      ) : (
        <div className="payment-ready">
          <p>Ready to proceed with payment</p>
          <button onClick={initiatePayment}>
            Pay Now
          </button>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Checkout;