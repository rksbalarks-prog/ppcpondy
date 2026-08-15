// ============================================================
// PaymentFailurePoints.jsx — PayU failure redirect handler.
// Summarises the txn and offers Try Again.
// ============================================================

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const useQuery = () => new URLSearchParams(useLocation().search);

const PaymentFailurePoints = () => {
  const q = useQuery();
  const navigate = useNavigate();

  const txnid = q.get('txnid');
  const amount = q.get('amount');
  const status = q.get('status');

  const wrap = { background: '#f3f4f6', minHeight: '100vh' };
  const phoneCol = { maxWidth: 480, margin: '0 auto', width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg,#4F4B7E 0%,#764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const card = { background: '#fff', maxWidth: 420, width: '90%', padding: 28, borderRadius: 14, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' };

  return (
    <div style={wrap}>
      <div style={phoneCol}>
      <div style={card}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 14px', borderRadius: '50%',
          background: '#c0392b', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, fontWeight: 800,
        }}>✕</div>
        <h3 style={{ marginTop: 0, color: '#c0392b' }}>Payment failed</h3>
        <p style={{ color: '#666' }}>We could not complete your payment.</p>
        <p style={{ fontSize: 14, color: '#666' }}>
          Txn: <code>{txnid || '—'}</code><br />
          Amount: ₹{amount || 0}<br />
          Status: {status || 'failure'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => navigate('/points-plans')} style={{
            flex: 1, padding: 12, borderRadius: 8, border: '1px solid #4F4B7E',
            background: '#fff', color: '#4F4B7E', fontWeight: 600,
          }}>Back to plans</button>
          <button onClick={() => navigate(-1)} style={{
            flex: 1, padding: 12, borderRadius: 8, border: 'none',
            background: '#1a7c3e', color: '#fff', fontWeight: 700,
          }}>Try Again</button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PaymentFailurePoints;
