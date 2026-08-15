// ============================================================
// PayUPointsForm.jsx — Pay Now / Pay Later for points purchase.
//
// Pay Now flow:
//   POST /select-points-plan
//   POST /payu/points-payment   → returns { key, txnid, hash, surl, furl, udf1..5, ... }
//   Build a hidden HTML form with the response fields and submit to PayU.
//
// Pay Later flow:
//   POST /select-points-plan
//   POST /payu/points-payment-later
// ============================================================

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

const PayUPointsForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const incoming = location.state || {};

  const [form, setForm] = useState({
    txnid: 'points_' + Date.now(),
    productinfo: 'Points Plan',
    firstname: 'User',
    email: `user${Date.now()}@gmail.com`,
    phone: incoming.phoneNumber || localStorage.getItem('phoneNumber') || '',
    planName: incoming.planName || '',
    planId: incoming.planId || '',
    price: incoming.price || '',
    points: incoming.points || 0,
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ open: false, type: 'info', message: '' });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      planName: incoming.planName || f.planName,
      planId: incoming.planId || f.planId,
      price: incoming.price ?? f.price,
      points: incoming.points ?? f.points,
      phone: incoming.phoneNumber || f.phone,
    }));
    // eslint-disable-next-line
  }, [incoming.planId]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.planId)   return 'Plan is missing.';
    if (!form.price)    return 'Price is missing.';
    if (!form.phone)    return 'Phone is missing.';
    if (!form.firstname.trim()) return 'Name is required.';
    if (!form.email.trim())     return 'Email is required.';
    return null;
  };

  const submitPayUForm = (payuData) => {
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = 'https://secure.payu.in/_payment';
    f.style.display = 'none';
    Object.entries(payuData).forEach(([k, v]) => {
      const i = document.createElement('input');
      i.type = 'hidden';
      i.name = k;
      i.value = v ?? '';
      f.appendChild(i);
    });
    document.body.appendChild(f);
    f.submit();
  };

  const handlePayNow = async () => {
    const err = validate();
    if (err) return setPopup({ open: true, type: 'error', message: err });

    setLoading(true);
    try {
      await axios.post(`${API}/select-points-plan`, {
        phoneNumber: form.phone,
        planId: form.planId,
        points: form.points,
        amount: form.price,
      });

      const res = await axios.post(`${API}/payu/points-payment`, {
        txnid: form.txnid,
        amount: String(form.price),
        productinfo: form.productinfo,
        firstname: form.firstname,
        email: form.email,
        phone: form.phone,
        payustatususer: 'pay now',
        planName: form.planName,
        planId: form.planId,
        points: form.points,
      });

      submitPayUForm(res.data);
    } catch (e) {
      setPopup({ open: true, type: 'error', message: e?.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePayLater = async () => {
    const err = validate();
    if (err) return setPopup({ open: true, type: 'error', message: err });

    setLoading(true);
    try {
      await axios.post(`${API}/select-points-plan`, {
        phoneNumber: form.phone,
        planId: form.planId,
        points: form.points,
        amount: form.price,
      });
      await axios.post(`${API}/payu/points-payment-later`, {
        txnid: form.txnid,
        amount: String(form.price),
        productinfo: form.productinfo,
        firstname: form.firstname,
        email: form.email,
        phone: form.phone,
        payustatususer: 'pay later',
        planName: form.planName,
        planId: form.planId,
        points: form.points,
      });
      setPopup({ open: true, type: 'success', message: 'Pay Later request saved. Our team will contact you shortly.' });
      setTimeout(() => navigate('/points-plans'), 3000);
    } catch (e) {
      setPopup({ open: true, type: 'error', message: e?.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };

  // Outer = neutral page background. Gradient lives on the centered phone column.
  const wrap = { minHeight: '100vh', background: '#f3f4f6', padding: '40px 0' };
  const phoneCol = { maxWidth: 480, margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 80px)', background: 'linear-gradient(135deg,#4F4B7E 0%,#764ba2 100%)', padding: '20px 16px', borderRadius: 0 };
  const card = { maxWidth: 420, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };
  const row = { display: 'flex', alignItems: 'center', marginBottom: 12 };
  const label = { width: 110, fontWeight: 600, color: '#444' };
  const input = { flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 14 };

  return (
    <div style={wrap}>
      <div style={phoneCol}>
        <div style={card}>
          <h3 style={{ textAlign: 'center', color: '#4F4B7E', marginBottom: 18 }}>Points Payment</h3>

          <div style={row}><label style={label}>Plan</label><input style={input} value={form.planName} readOnly /></div>
          <div style={row}><label style={label}>Points</label><input style={input} value={form.points} readOnly /></div>
          <div style={row}><label style={label}>Amount</label><input style={input} value={`₹${form.price}`} readOnly /></div>
          <div style={row}><label style={label}>Phone</label><input style={input} value={form.phone} readOnly /></div>
          <div style={row}><label style={label}>Full Name</label><input style={input} value={form.firstname} onChange={(e) => setField('firstname', e.target.value)} /></div>
          <div style={row}><label style={label}>Email</label><input style={input} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={handlePayLater} disabled={loading} style={{
              flex: 1, padding: 12, borderRadius: 8, border: '1px solid #4F4B7E',
              background: '#fff', color: '#4F4B7E', fontWeight: 600, cursor: 'pointer',
            }}>Pay Later</button>
            <button onClick={handlePayNow} disabled={loading} style={{
              flex: 1, padding: 12, borderRadius: 8, border: 'none',
              background: '#1a7c3e', color: '#fff', fontWeight: 700, cursor: 'pointer',
            }}>{loading ? 'Processing…' : 'Pay Now'}</button>
          </div>
        </div>
      </div>

      {popup.open && (
        <div onClick={() => setPopup((p) => ({ ...p, open: false }))} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', maxWidth: 360, padding: 22, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ color: popup.type === 'error' ? '#c0392b' : '#1a7c3e', fontWeight: 600 }}>{popup.message}</p>
            <button onClick={() => setPopup((p) => ({ ...p, open: false }))} style={{
              padding: '8px 18px', borderRadius: 6, border: 'none', background: '#4F4B7E', color: '#fff', marginTop: 6,
            }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayUPointsForm;
