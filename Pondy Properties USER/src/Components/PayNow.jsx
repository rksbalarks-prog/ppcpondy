import React, { useState } from 'react';
import axios from 'axios';

/**
 * PayNow
 * -------
 * A self-contained floating "Pay Now" action for the user app.
 *
 * The user taps the floating button, types any amount (must be GREATER than
 * ₹100), and taps Pay. We reuse the existing, already-wired PayU buyer
 * endpoint (`/payu/payment-buyer`) which generates the hash + saves the row,
 * then we post the returned fields to PayU's secure checkout exactly the way
 * PayUBuyerForm already does. No existing code/route is modified.
 */
const PayNow = ({ phoneNumber }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MIN_AMOUNT = 100; // amount must be ABOVE this

  const reset = () => {
    setAmount('');
    setError('');
    setLoading(false);
  };

  const closeModal = () => {
    if (loading) return; // don't allow closing mid-redirect
    setOpen(false);
    reset();
  };

  // Keep only digits + a single decimal point while typing.
  const handleAmountChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setAmount(cleaned);
    if (error) setError('');
  };

  const handlePay = async () => {
    const amt = Number(amount);

    if (!amount || isNaN(amt)) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amt <= MIN_AMOUNT) {
      setError(`Amount must be greater than ₹${MIN_AMOUNT}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        txnid: 'txn_' + Date.now(),
        amount: amt,
        productinfo: 'Pondy Properties Payment',
        firstname: 'User',
        email: `user${Date.now()}@ppcpondy.com`,
        phone: phoneNumber || '',
        payustatususer: 'pay now',
        planName: 'Custom Payment',
        // Backend's PayuBuyer model requires ba_id (Number) and it is UNIQUE.
        // Direct/custom payments aren't tied to a Buyer Assistance record, so
        // we send a unique timestamp-based id to satisfy the constraint.
        ba_id: Date.now(),
      };

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/payu/payment-buyer`,
        payload
      );

      // Build a hidden form and hand off to PayU's secure checkout.
      const formEl = document.createElement('form');
      formEl.method = 'POST';
      formEl.action = 'https://secure.payu.in/_payment';

      Object.entries(data).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        formEl.appendChild(input);
      });

      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Failed to start the payment. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handlePay();
  };

  return (
    <>
      {/* Animations for the floating Pay Now button */}
      <style>{`
        @keyframes payNowGlow {
          0%   { box-shadow: 0 6px 18px rgba(124, 58, 237, 0.45), 0 0 0 0 rgba(236, 72, 153, 0.55); }
          70%  { box-shadow: 0 10px 26px rgba(124, 58, 237, 0.55), 0 0 0 14px rgba(236, 72, 153, 0); }
          100% { box-shadow: 0 6px 18px rgba(124, 58, 237, 0.45), 0 0 0 0 rgba(236, 72, 153, 0); }
        }
        @keyframes payNowShimmer {
          0%   { transform: translateX(-130%) skewX(-20deg); }
          60%  { transform: translateX(230%) skewX(-20deg); }
          100% { transform: translateX(230%) skewX(-20deg); }
        }
        @keyframes payNowFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .pay-now-fab {
          position: relative;
          overflow: hidden;
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%);
          background-size: 200% 200%;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.3px;
          cursor: pointer;
          animation: payNowGlow 2.2s ease-in-out infinite, payNowFloat 3s ease-in-out infinite;
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .pay-now-fab:hover { transform: scale(1.06); filter: brightness(1.05); }
        .pay-now-fab:active { transform: scale(0.97); }
        .pay-now-fab::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 35%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: payNowShimmer 3.2s ease-in-out infinite;
        }
        .pay-now-fab .pay-now-label { position: relative; z-index: 1; }
        .pay-now-fab .pay-now-icon  { position: relative; z-index: 1; font-size: 17px; line-height: 1; }
      `}</style>

      {/* Floating button — pinned to the bottom-left of the 470px app frame,
          sitting just above the bottom navigation. */}
      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '470px',
          zIndex: 1060,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            paddingLeft: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pay-now-fab"
            aria-label="Pay Now"
          >
            <span className="pay-now-icon" aria-hidden="true">💳</span>
            <span className="pay-now-label">Pay Now</span>
          </button>
        </div>
      </div>

      {/* Amount modal */}
      {open && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '340px',
              margin: '0 16px',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              fontFamily: 'Segoe UI, sans-serif',
            }}
          >
            <h3
              style={{
                margin: '0 0 6px',
                textAlign: 'center',
                color: 'rgb(47, 116, 127)',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              Pay Now
            </h3>
            <p
              style={{
                margin: '0 0 18px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#666',
              }}
            >
              Enter the amount you want to pay (above ₹{MIN_AMOUNT}).
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #ccc',
                borderRadius: '10px',
                padding: '0 12px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={handleAmountChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter amount"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '12px 8px',
                  fontSize: '16px',
                  background: 'transparent',
                }}
              />
            </div>

            {error && (
              <p
                style={{
                  margin: '0 0 8px',
                  color: '#e53935',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  border: '1px solid #00ADF2',
                  background: '#fff',
                  color: '#00ADF2',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading ? '#7fd4f7' : '#00ADF2',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Processing…' : 'Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PayNow;
