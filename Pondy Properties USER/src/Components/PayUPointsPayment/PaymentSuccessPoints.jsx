// ============================================================
// PaymentSuccessPoints.jsx
//
// PayU success redirect handler. The backend already credits points in
// /payu/points-success; this page double-guards the credit by calling
// /points-credit with the same mihpayid (idempotent on txnId). Auto-
// redirects back to /points-plans after 4 seconds.
// ============================================================

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const useQuery = () => new URLSearchParams(useLocation().search);

const PaymentSuccessPoints = () => {
  const q = useQuery();
  const navigate = useNavigate();

  const txnid = q.get('txnid');
  const mihpayid = q.get('mihpayid');
  const amount = q.get('amount');
  const planId = q.get('planId');
  const planName = q.get('planName');
  const points = Number(q.get('points')) || 0;
  const phone = q.get('phone') || localStorage.getItem('phoneNumber') || '';

  const [credited, setCredited] = useState(null); // null=loading, true=ok, false=error

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!phone || !points || !mihpayid) { setCredited(true); return; }
        await axios.post(`${API}/points-credit`, {
          phoneNumber: phone,
          points,
          planId,
          planName,
          amount: Number(amount) || 0,
          txnId: mihpayid,
        });
        if (!cancel) setCredited(true);
      } catch (_) {
        if (!cancel) setCredited(false);
      }
    })();

    const t = setTimeout(() => navigate('/points-plans'), 4000);
    return () => { cancel = true; clearTimeout(t); };
    // eslint-disable-next-line
  }, []);

  const wrap = { background: '#f3f4f6', minHeight: '100vh' };
  const phoneCol = { maxWidth: 480, margin: '0 auto', width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg,#4F4B7E 0%,#764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const card = { background: '#fff', maxWidth: 420, width: '90%', padding: 28, borderRadius: 14, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' };

  return (
    <div style={wrap}>
      <div style={phoneCol}>
      <div style={card}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 14px', borderRadius: '50%',
          background: '#1a7c3e', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, fontWeight: 800,
        }}>✓</div>
        <h3 style={{ marginTop: 0, color: '#1a7c3e' }}>Payment successful</h3>
        <p>{points} points credited to <strong>{phone}</strong>.</p>
        <p style={{ color: '#666', fontSize: 14 }}>Plan: {planName} · Amount: ₹{amount}</p>
        {credited === false && (
          <p style={{ color: '#c0392b', fontSize: 13 }}>
            Confirmation call failed. If your balance does not show the points within a minute, contact support — your txn id is <code>{mihpayid}</code>.
          </p>
        )}
        <small style={{ color: '#999' }}>Redirecting to plans in a moment…</small>
        <div style={{ marginTop: 14 }}>
          <button onClick={() => navigate('/points-history')} style={{
            background: '#1a7c3e', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600,
          }}>View My Points</button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPoints;
