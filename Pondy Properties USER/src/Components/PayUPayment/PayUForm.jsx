 

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const PayUForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    planName = '',
    amount = '',
    phoneNumber = '',
    planId = '',
    ppcId = ''
  } = location.state || {};

  const [form, setForm] = useState({
    txnid: 'txn_' + Date.now(),
    amount: '',
    productinfo: 'Subscription Plan',
    firstname: 'Owner',
    email: `owner${Date.now()}@gmail.com`,
    phone: '',
    planName: '',
    planId: '',
    ppcId: ''
  });

  const [popup, setPopup] = useState({ visible: false, message: '', type: '', planName: '' });
  const [loading, setLoading] = useState(false);

  
  const [hoverLater, setHoverLater] = useState(false);
  const [hoverNow, setHoverNow] = useState(false);

  const payLaterStyle = {
    flex: 1,
    margin: '0 5px',
    background: hoverLater ? '#E6F7FF' : 'white',
    color: '#00ADF2',
    border: '1px solid #00ADF2',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const payNowStyle = {
    flex: 1,
    margin: '0 5px',
    background: hoverNow ? '#0095C5' : '#00ADF2',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      planName,
      amount,
      phone: phoneNumber,
      planId,
      ppcId
    }));
  }, [planName, amount, phoneNumber, planId, ppcId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
 
  const initiatePayUPayment = async () => {
  try {
    const postData = { 
      ...form, 
      payustatususer: 'pay now',
      productinfo: form.planName  
    };
    
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/payu/payment`, postData);
    const payuData = response.data;

     const formElement = document.createElement('form');
    formElement.method = 'POST';
    formElement.action = 'https://secure.payu.in/_payment';
    formElement.style.display = 'none';

    Object.entries(payuData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      formElement.appendChild(input);
    });

    document.body.appendChild(formElement);
    formElement.submit();

  } catch (error) {
    console.error('Payment initiation error:', error);
    setPopup({ 
      visible: true, 
      message: 'Failed to initialize payment. Please try again.', 
      type: 'error' 
    });
  }
};

 

  const handlePayNow = async () => {
  const requiredFields = ['amount', 'firstname', 'email', 'phone', 'planName', 'planId', 'ppcId'];
  const missingFields = requiredFields.filter(field => !form[field]);
  
  if (missingFields.length > 0) {
    setPopup({ 
      visible: true, 
      message: `Please fill all required fields. Missing: ${missingFields.join(', ')}`, 
      type: 'error' 
    });
    return;
  }

    try {
      setLoading(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/select-plan`, {
        phoneNumber: form.phone,
        planId: form.planId,
        ppcId: form.ppcId
      });

      await initiatePayUPayment();
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Something went wrong.';
      if (errMsg.includes('already selected')) {
        setPopup({
          visible: true,
          message: `You have already selected ${form.planName} plan. Please complete payment.`,
          planName: form.planName,
          type: 'info'
        });
      } else {
        setPopup({ visible: true, message: errMsg, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayLater = async () => {
    if (!form.planId || !form.ppcId || !form.phone) {
      setPopup({ visible: true, message: 'Missing planId, ppcId or phone number.', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${process.env.REACT_APP_API_URL}/select-plan`, {
        phoneNumber: form.phone,
        planId: form.planId,
        ppcId: form.ppcId
      });

      const postData = { ...form, payustatususer: 'pay later' };
      await axios.post(`${process.env.REACT_APP_API_URL}/payu/payment-later`, postData);

      setPopup({
        visible: true,
        message: 'Your request to pay later has been saved successfully.',
        type: 'success'
      });

      setForm((prev) => ({
        ...prev,
        txnid: 'txn_' + Date.now(),
        email: `owner${Date.now()}@gmail.com`
      }));

      setTimeout(() => {
        navigate('/mobileviews');
      }, 3000);

    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Failed to process pay later request.';
      setPopup({ visible: true, message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setPopup({ visible: false, message: '', type: '', planName: '' });
    await initiatePayUPayment();
  };

  const handleRemove = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/plans/remove-phone/${form.phone}`);
      setPopup({ visible: true, message: 'Phone number removed from selected plan.', type: 'success', planName: '' });
      setTimeout(() => {
        navigate('/pricing-plans');
      }, 2500);
    } catch (err) {
      setPopup({ visible: true, message: 'Failed to remove phone number. Please try again.', type: 'error' });
    }
  };

const rowStyle = { display: 'flex', alignItems: 'center', marginBottom: '12px' };
const labelStyle = { width: '120px', fontWeight: 600 };  
const inputStyle = { flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '14px' };

  return (
    <div style={{ maxWidth: '420px', margin: '50px auto', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px', color: 'rgb(47,116,127)', fontSize: '24px', fontWeight: 'bold' }}>PayU Payment</h2>
      <form>
        <div style={rowStyle}>
          <label style={labelStyle}>Plan</label>
          <input type="text" value={form.planName} readOnly style={inputStyle} />
        </div>
        <div style={rowStyle}>
          <label style={labelStyle}>Amount</label>
          <input type="number" value={form.amount} readOnly style={inputStyle} />
        </div>
        <div style={rowStyle}>
          <label style={labelStyle}>PPC ID</label>
          <input type="text" value={form.ppcId} readOnly style={inputStyle} />
        </div>
        <div style={rowStyle}>
          <label style={labelStyle}>Phone</label>
        <input type="tel" value={form.phone} readOnly style={inputStyle} />
</div>
        <div style={rowStyle}>
        <label style={labelStyle}>Full Name</label>
        <input type="text" name="firstname" value={form.firstname} onChange={handleChange} style={inputStyle} />
</div><div style={rowStyle}>
        <label style={labelStyle}>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />
</div>
       
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <button
          type="button"
          onClick={handlePayLater}
          disabled={loading}
          onMouseEnter={() => setHoverLater(true)}
          onMouseLeave={() => setHoverLater(false)}
          style={payLaterStyle}
        >
          Pay Later
        </button>
        <button
          type="button"
          onClick={handlePayNow}
          disabled={loading}
          onMouseEnter={() => setHoverNow(true)}
          onMouseLeave={() => setHoverNow(false)}
          style={payNowStyle}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
      
      </form>

      {popup.visible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff', padding: 20, borderRadius: 10,
            textAlign: 'center', maxWidth: 320, color: popup.type === 'error' ? 'red' : '#333'
          }}>
            <p>{popup.message}</p>
            {popup.planName ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <button onClick={handleContinue}
                  style={{ background: '#00ADF2', color: 'white', padding: '6px 12px', borderRadius: 6, fontWeight: '600' }}>
                  Continue to Pay
                </button>
                <button onClick={handleRemove}
                  style={{ background: 'white', color: '#00ADF2', boxShadow: '0 4px 8px rgba(0, 123, 255, 0.2)', padding: '6px 12px', borderRadius: 6, fontWeight: '600' }}>
                  Remove
                </button>
              </div>
            ) : (
              <button onClick={() => setPopup({ visible: false, message: '', type: '', planName: '' })}
                style={{ marginTop: 10, padding: '6px 12px', background: '#00ADF2', color: 'white', borderRadius: '6px', border: 'none' }}>
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayUForm;
