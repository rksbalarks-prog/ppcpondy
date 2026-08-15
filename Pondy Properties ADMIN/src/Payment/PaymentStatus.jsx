import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const PaymentStatus = () => {
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('order_id');
        
        if (!orderId) throw new Error('Order ID not found');
        
        const response = await axios.get(
          `http://localhost:3001/api/payments/orders/${orderId}/verify`
        );
        
        setStatus(response.data.data.payment_status.toLowerCase());
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [location.search]);

  return (
    <div className="payment-status">
      {status === 'verifying' && <p>Verifying your payment...</p>}
      {status === 'success' && (
        <div className="success">
          <h3>Payment Successful!</h3>
          <p>Thank you for your payment.</p>
        </div>
      )}
      {status === 'failed' && (
        <div className="failed">
          <h3>Payment Failed</h3>
          <p>Please try again.</p>
        </div>
      )}
      {status === 'error' && (
        <div className="error">
          <h3>Error</h3>
          <p>{error || 'Unable to verify payment status'}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;