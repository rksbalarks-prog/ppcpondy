import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaRegCheckCircle,
  FaShoppingBag, FaEye, FaUndo, FaPlus, FaArrowDown, FaArrowUp, FaCoins,
} from 'react-icons/fa';
import { GiTwoCoins } from 'react-icons/gi';
import { HiSparkles } from 'react-icons/hi2';
import { MdOutlineReceipt } from 'react-icons/md';

const API = process.env.REACT_APP_API_URL;
const MOBILE_MAX = 480;

const useCountUp = (target = 0, duration = 900) => {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  const startedAt = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const start = fromRef.current;
    const end = Number(target) || 0;
    if (start === end) { setVal(end); return; }
    startedAt.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(start + (end - start) * eased);
      setVal(v);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else fromRef.current = end;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
};

const classify = (t) => {
  if ((t.note || '').startsWith('MANUAL-ADJUST')) return 'manual';
  if ((t.note || '').startsWith('REFUND')) return 'refund';
  if (t.type === 'credit' && t.txnId) return 'purchase';
  if (t.type === 'deduct' && t.reason === 'view-owner-contact') return 'reveal';
  if (t.type === 'deduct' && t.reason === 'view-buyer-contact') return 'buyer-reveal';
  return t.type;
};

const tagInfo = (k) => {
  switch (k) {
    case 'purchase': return { ring: 'rgba(34,211,238,0.45)', tint: 'rgba(34,211,238,0.18)', fg: '#7FF1FF', label: 'Purchase',     Icon: FaShoppingBag };
    case 'reveal':   return { ring: 'rgba(255,200,87,0.55)', tint: 'rgba(255,200,87,0.18)', fg: '#FFE9B3', label: 'Owner reveal', Icon: FaEye };
    case 'buyer-reveal': return { ring: 'rgba(255,200,87,0.55)', tint: 'rgba(255,200,87,0.18)', fg: '#FFE9B3', label: 'Buyer reveal', Icon: FaEye };
    case 'manual':   return { ring: 'rgba(157,92,255,0.55)', tint: 'rgba(157,92,255,0.18)', fg: '#D7BBFF', label: 'Adjustment',   Icon: FaCoins };
    case 'refund':   return { ring: 'rgba(45,212,191,0.55)', tint: 'rgba(45,212,191,0.18)', fg: '#9DF5E5', label: 'Refund',       Icon: FaUndo };
    case 'credit':   return { ring: 'rgba(34,197,94,0.55)',  tint: 'rgba(34,197,94,0.18)',  fg: '#86EFAC', label: 'Credit',       Icon: FaArrowUp };
    case 'deduct':   return { ring: 'rgba(244,114,182,0.55)',tint: 'rgba(244,114,182,0.18)',fg: '#F9A8D4', label: 'Deduct',       Icon: FaArrowDown };
    default:         return { ring: 'rgba(255,255,255,0.30)',tint: 'rgba(255,255,255,0.10)',fg: '#fff',    label: k,              Icon: FaCoins };
  }
};

const refundBadgeInfo = (status) => {
  switch (status) {
    case 'pending':  return { bg: 'rgba(255,200,87,0.20)',  fg: '#FFE9B3', label: 'Refund pending',  Icon: FaClock };
    case 'approved': return { bg: 'rgba(34,197,94,0.22)',   fg: '#86EFAC', label: 'Refund approved', Icon: FaCheckCircle };
    case 'rejected': return { bg: 'rgba(244,114,182,0.20)', fg: '#F9A8D4', label: 'Refund rejected', Icon: FaTimesCircle };
    default:         return null;
  }
};

const PointsHistory = () => {
  const navigate = useNavigate();
  const phone = localStorage.getItem('phoneNumber') || '';

  const [balance, setBalance] = useState({ balance: 0, totalEarned: 0, totalSpent: 0, totalPaid: 0 });
  const [txns, setTxns] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [refundFor, setRefundFor] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');

  const reload = async () => {
    if (!phone) { setLoading(false); return; }
    try {
      const [bRes, tRes, rRes] = await Promise.all([
        axios.get(`${API}/points-balance/${phone}`),
        axios.get(`${API}/points-transactions/${phone}?limit=200`),
        axios.get(`${API}/points-refund-requests/${phone}?limit=200`).catch(() => ({ data: { requests: [] } })),
      ]);
      setBalance({
        balance:     bRes.data.balance     ?? 0,
        totalEarned: bRes.data.totalEarned ?? 0,
        totalSpent:  bRes.data.totalSpent  ?? 0,
        totalPaid:   bRes.data.totalPaid   ?? 0,
      });
      setTxns(tRes.data.transactions || []);
      setRefunds(rRes.data.requests || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [phone]);

  const balanceN     = useCountUp(balance.balance);
  const earnedN      = useCountUp(balance.totalEarned);
  const spentN       = useCountUp(balance.totalSpent);
  const paidN        = useCountUp(balance.totalPaid);

  const refundByTxn = useMemo(() => {
    const m = new Map();
    const rank = (s) => (s === 'pending' ? 3 : s === 'approved' ? 2 : 1);
    refunds.forEach((r) => {
      const id = String(r.transactionId);
      const prev = m.get(id);
      if (!prev || rank(r.status) > rank(prev.status)) m.set(id, r);
    });
    return m;
  }, [refunds]);

  const grouped = useMemo(() => {
    const out = {};
    txns.forEach((t) => {
      const day = (t.createdAt || '').slice(0, 10);
      if (!out[day]) out[day] = [];
      out[day].push(t);
    });
    return Object.entries(out).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [txns]);

  const openRefund = (txn) => {
    setRefundFor(txn);
    setRefundReason('');
    setRefundError('');
  };
  const submitRefund = async () => {
    if (!refundFor) return;
    // A valid reason is mandatory — the admin needs context to review.
    const reason = refundReason.trim();
    if (reason.length < 5) {
      setRefundError('Please enter a valid reason for the refund (at least 5 characters).');
      return;
    }
    setRefundSubmitting(true);
    setRefundError('');
    try {
      await axios.post(`${API}/points-refund-request`, {
        phoneNumber: phone,
        transactionId: refundFor._id,
        reason,
      });
      setRefundFor(null);
      await reload();
    } catch (e) {
      setRefundError(e?.response?.data?.message || e.message || 'Failed to submit');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const friendlyDay = (d) => {
    if (!d) return '';
    const today = new Date(); today.setHours(0,0,0,0);
    const dayDate = new Date(d); dayDate.setHours(0,0,0,0);
    const diff = (today - dayDate) / 86400000;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070512' }}>
      <style>{`
        @keyframes phShift {
          0%,100% { background-position: 0% 0%, 100% 100%; }
          50%     { background-position: 100% 50%, 0% 50%; }
        }
        @keyframes phFloat   { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-6px) rotate(3deg) } }
        @keyframes phSpin    { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        @keyframes phGlow {
          0%,100% { box-shadow: 0 0 0 1px rgba(255,200,87,0.45), 0 0 30px rgba(255,200,87,0.30), 0 14px 40px rgba(0,0,0,0.55) }
          50%     { box-shadow: 0 0 0 1px rgba(157,92,255,0.55), 0 0 36px rgba(157,92,255,0.45), 0 14px 40px rgba(0,0,0,0.55) }
        }
        @keyframes phPopIn { from { opacity: 0; transform: translateY(12px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes phSheetIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes phBlobShift { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(20px,-30px) scale(1.1) } }

        .ph-bg {
          background:
            radial-gradient(800px 400px at 80% -10%, rgba(157,92,255,0.40), transparent 60%),
            radial-gradient(700px 500px at -10% 30%, rgba(34,211,238,0.20), transparent 60%),
            radial-gradient(600px 500px at 50% 110%, rgba(255,200,87,0.18), transparent 60%),
            linear-gradient(160deg,#0B0820 0%,#150C2E 40%,#1E0F44 100%);
          background-size: 200% 200%, 200% 200%, 200% 200%, 100% 100%;
          animation: phShift 24s ease-in-out infinite;
        }
        .ph-pop-in   { animation: phPopIn .55s cubic-bezier(.2,.9,.2,1) both; }
        .ph-sheet-in { animation: phSheetIn .35s cubic-bezier(.2,.9,.2,1) both; }
        .ph-blob-a   { animation: phBlobShift 12s ease-in-out infinite; }
        .ph-blob-b   { animation: phBlobShift 16s ease-in-out infinite reverse; }

        .ph-glass {
          background: linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 0 0 1px rgba(157,92,255,0.18), 0 18px 50px rgba(0,0,0,0.55);
        }

        .ph-hero { animation: phGlow 5s ease-in-out infinite; }
        .ph-coin-spin { display: inline-block; animation: phSpin 8s linear infinite; }
        .ph-coin-float { animation: phFloat 3s ease-in-out infinite; }

        .ph-row { transition: transform .12s ease, background .2s ease; border-radius: 14px; }
        .ph-row:hover { background: rgba(255,255,255,0.04); transform: translateX(2px); }

        .ph-icon {
          position: relative;
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .ph-icon::after {
          content:''; position: absolute; inset:-3px; border-radius: 14px;
          box-shadow: 0 0 18px var(--ring); pointer-events:none;
        }

        .ph-buy-btn { transition: transform .12s ease, filter .2s ease, box-shadow .25s ease; }
        .ph-buy-btn:hover  { transform: translateY(-1px); filter: brightness(1.07); }
        .ph-buy-btn:active { transform: scale(0.97); }

        .ph-refund-btn { transition: all .15s ease; }
        .ph-refund-btn:hover {
          background: linear-gradient(135deg,#9D5CFF,#22D3EE) !important;
          color: #fff !important;
          border-color: transparent !important;
          box-shadow: 0 8px 22px rgba(157,92,255,0.45);
        }

        .ph-back-btn { transition: transform .15s ease, background .2s ease; }
        .ph-back-btn:hover { background: rgba(255,255,255,0.22); transform: translateX(-2px); }

        .ph-balance-num {
          background: linear-gradient(135deg,#FFE9B3 0%,#FFC857 50%,#FF9A3C 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          filter: drop-shadow(0 2px 16px rgba(255,200,87,0.45));
        }
      `}</style>

      <div className="ph-bg" style={{
        maxWidth: MOBILE_MAX, margin: '0 auto', width: '100%', minHeight: '100vh',
        position: 'relative', paddingBottom: 30,
      }}>
        <div className="ph-blob-a" style={{ position:'absolute', top:-50, right:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,200,87,0.30), transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div className="ph-blob-b" style={{ position:'absolute', top:200, left:-100, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(157,92,255,0.25), transparent 70%)', filter:'blur(48px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)', filter:'blur(50px)', pointerEvents:'none' }} />

        <button onClick={() => navigate(-1)} aria-label="Back" className="ph-back-btn" style={{
          position: 'absolute', top: 14, left: 12,
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 5,
        }}>
          <FaArrowLeft size={16} />
        </button>

        <div className="ph-pop-in" style={{ color: '#fff', textAlign: 'center', padding: '20px 16px 0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 999,
            background: 'linear-gradient(90deg, rgba(157,92,255,0.25), rgba(34,211,238,0.20))',
            border: '1px solid rgba(255,255,255,0.16)',
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            backdropFilter: 'blur(8px)',
          }}>
            <HiSparkles color="#FFC857" /> WALLET
          </div>
          <h2 style={{
            margin: '10px 0 0', fontSize: 28, letterSpacing: -0.6, fontWeight: 800,
            background: 'linear-gradient(135deg,#fff,#C9C2FF 60%,#22D3EE)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>My Points</h2>
        </div>

        <div className="ph-glass ph-hero ph-pop-in" style={{
          margin: '16px', borderRadius: 22, padding: 22, color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', right:-20, top:-30, opacity: 0.10, fontSize: 150, lineHeight: 1, transform:'rotate(-15deg)' }}>🪙</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div className="ph-coin-float" style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg,#FFC857,#FF7A45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(255,122,69,0.55), 0 0 0 1px rgba(255,255,255,0.16) inset',
              color: '#2A1500',
            }}>
              <span className="ph-coin-spin"><GiTwoCoins size={32} /></span>
            </div>
            <div style={{ flex: 1 }}>
              <small style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 11, fontWeight: 700 }}>Current balance</small>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="ph-balance-num" style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, letterSpacing: -1.5 }}>{balanceN}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>pts</span>
              </div>
            </div>
            <button onClick={() => navigate('/points-plans')} className="ph-buy-btn"
              style={{
                background: 'linear-gradient(135deg,#1a7c3e,#27AE60)', color: '#fff',
                border: 'none', padding: '10px 14px', borderRadius: 12,
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 8px 22px rgba(34,197,94,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset',
              }}>
              <FaPlus size={11} /> Buy more
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
            marginTop: 18, paddingTop: 14, borderTop: '1px dashed rgba(255,255,255,0.14)',
            position: 'relative',
          }}>
            <StatTile color="#86EFAC" tint="rgba(34,197,94,0.18)" Icon={FaArrowUp} label="Earned" value={earnedN} />
            <StatTile color="#F9A8D4" tint="rgba(244,114,182,0.18)" Icon={FaArrowDown} label="Spent"  value={spentN} />
            <StatTile color="#7FF1FF" tint="rgba(34,211,238,0.18)" prefix="₹"             label="Paid"   value={paidN} />
          </div>
        </div>

        <div className="ph-glass ph-pop-in" style={{
          margin: '0 16px 30px', borderRadius: 22, padding: '18px 16px 22px', color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(157,92,255,0.25), rgba(34,211,238,0.20))',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MdOutlineReceipt size={18} color="#fff" />
            </div>
            <h5 style={{ margin: 0, fontWeight: 800, letterSpacing: -0.2 }}>Recent activity</h5>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Loading…</div>
          ) : grouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: 38, opacity: 0.6 }}>🪙</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>No activity yet</div>
              <small style={{ opacity: 0.7 }}>Start by buying a points pack and viewing owner contacts.</small>
            </div>
          ) : grouped.map(([day, items]) => (
            <div key={day} style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 6,
              }}>{friendlyDay(day)}</div>

              {items.map((t) => {
                const k = classify(t);
                const meta = tagInfo(k);
                const isReveal = k === 'reveal' || k === 'buyer-reveal';
                const refund = refundByTxn.get(String(t._id));
                const rb = refund ? refundBadgeInfo(refund.status) : null;
                const isCredit = t.type === 'credit';

                return (
                  <div key={t._id} className="ph-row" style={{
                    padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <div className="ph-icon" style={{
                      background: meta.tint,
                      border: `1px solid ${meta.ring}`,
                      color: meta.fg,
                      '--ring': meta.ring,
                    }}>
                      <meta.Icon size={16} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>
                          {meta.label}
                        </div>
                        <div style={{
                          fontWeight: 900, fontSize: 14,
                          color: isCredit ? '#86EFAC' : '#F9A8D4',
                          whiteSpace: 'nowrap',
                          textShadow: isCredit ? '0 0 14px rgba(34,197,94,0.55)' : '0 0 14px rgba(244,114,182,0.45)',
                        }}>
                          {isCredit ? '+' : '−'}{t.points} pts
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                        {t.planName || (t.rentId
                          ? `${k === 'buyer-reveal' ? 'Buyer' : 'Property'} ${t.rentId}`
                          : (t.reason || 'Activity'))}
                      </div>

                      {isReveal && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                          {rb && (
                            <span style={{
                              background: rb.bg, color: rb.fg,
                              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              border: '1px solid rgba(255,255,255,0.10)',
                            }}>
                              <rb.Icon size={11} /> {rb.label}
                            </span>
                          )}
                          {!refund && (
                            <button className="ph-refund-btn" onClick={() => openRefund(t)} style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1.5px solid rgba(157,92,255,0.55)',
                              color: '#D7BBFF',
                              padding: '5px 12px', borderRadius: 999,
                              fontSize: 12, fontWeight: 800, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}>
                              <FaUndo size={10} /> Refund
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {refundFor && (
        <div onClick={() => !refundSubmitting && setRefundFor(null)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8,4,20,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999, padding: 16,
        }}>
          <div onClick={(e) => e.stopPropagation()} className="ph-glass ph-sheet-in" style={{
            maxWidth: 420, width: '100%',
            borderRadius: '22px 22px 14px 14px', padding: 22,
            color: '#fff', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: -1, borderRadius: 'inherit', boxShadow: '0 0 60px rgba(45,212,191,0.30) inset', pointerEvents: 'none' }} />
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg,#2DD4BF,#22D3EE)',
                color: '#072B26',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(45,212,191,0.50)',
              }}>
                <FaUndo size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Request refund</h4>
                <small style={{ color: 'rgba(255,255,255,0.65)' }}>An admin will review your request.</small>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14, padding: 12, fontSize: 13, marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>Points to refund</span>
                <strong style={{ color: '#9DF5E5' }}>+{refundFor.points} pts</strong>
              </div>
              {refundFor.rentId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>Property</span>
                  <code style={{ color: '#fff' }}>{refundFor.rentId}</code>
                </div>
              )}
            </div>

            {refundError && (
              <div style={{
                background: 'rgba(244,114,182,0.18)', color: '#F9A8D4',
                padding: '10px 12px', borderRadius: 12, fontSize: 13, marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(244,114,182,0.40)',
              }}>
                <FaTimesCircle /> {refundError}
              </div>
            )}

            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              Why do you want a refund? <span style={{ color: '#F9A8D4' }}>*</span>
            </label>
            <textarea value={refundReason} onChange={(e) => { setRefundReason(e.target.value); if (refundError) setRefundError(''); }}
              placeholder="e.g. Property already sold, owner not responding"
              rows={3}
              style={{
                width: '100%', padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${refundError ? 'rgba(244,114,182,0.7)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 12, fontSize: 14, marginTop: 6, outline: 'none',
                resize: 'vertical', color: '#fff',
              }}
              onFocus={(e) => e.target.style.borderColor = '#9D5CFF'}
              onBlur={(e) => e.target.style.borderColor = refundError ? 'rgba(244,114,182,0.7)' : 'rgba(255,255,255,0.12)'}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={() => setRefundFor(null)} disabled={refundSubmitting} style={{
                flex: 1, padding: 13, borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                fontWeight: 700, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={submitRefund} disabled={refundSubmitting} className="ph-buy-btn" style={{
                flex: 1.4, padding: 13, borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#2DD4BF,#22D3EE)',
                color: '#072B26', fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 10px 28px rgba(45,212,191,0.45)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {refundSubmitting ? 'Submitting…' : (<><FaRegCheckCircle size={14} /> Submit request</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatTile = ({ color, tint, Icon, prefix, label, value }) => (
  <div style={{
    background: tint,
    border: `1px solid ${color}40`,
    borderRadius: 14, padding: '10px 8px', textAlign: 'center',
    boxShadow: `0 0 18px ${color}25 inset`,
  }}>
    {Icon ? <Icon size={11} color={color} /> : <span style={{ fontSize: 11, color, fontWeight: 800 }}>{prefix}</span>}
    <div style={{ fontSize: 18, fontWeight: 900, color, marginTop: 2, textShadow: `0 0 10px ${color}55` }}>
      {prefix === '₹' && '₹'}{value}
    </div>
    <small style={{ color, fontWeight: 700, fontSize: 11, opacity: 0.85 }}>{label}</small>
  </div>
);

export default PointsHistory;
