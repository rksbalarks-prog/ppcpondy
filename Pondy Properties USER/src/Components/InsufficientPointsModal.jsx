import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GiTwoCoins } from 'react-icons/gi';
import { FaWallet, FaTimes } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

const InsufficientPointsModal = ({ open, onClose, balance = 0, required = 10, contactLabel = 'owner' }) => {
  const navigate = useNavigate();
  if (!open) return null;

  const phone = localStorage.getItem('phoneNumber') || '';
  const goPlans = () => {
    onClose && onClose();
    // Skip the plan picker — jump straight to PayU for the ₹100 / 100-point
    // pack. PointsPlans reads `autoBuy` and triggers the purchase on load.
    navigate('/points-plans', {
      state: { phoneNumber: phone, autoBuy: { price: 100, points: 100 } },
    });
  };

  const needed = Math.max(0, required - balance);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,4,20,0.65)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <style>{`
        @keyframes ipmPop  { from { opacity: 0; transform: scale(0.92) translateY(14px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes ipmFloat { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-8px) rotate(6deg) } }
        @keyframes ipmGlowAura {
          0%,100% { box-shadow: 0 0 0 1px rgba(157,92,255,0.45), 0 0 60px rgba(157,92,255,0.45), 0 30px 80px rgba(0,0,0,0.55); }
          50%     { box-shadow: 0 0 0 1px rgba(255,200,87,0.55), 0 0 70px rgba(255,200,87,0.50), 0 30px 80px rgba(0,0,0,0.55); }
        }
        @keyframes ipmBtnPulse {
          0%,100% { box-shadow: 0 10px 30px rgba(34,197,94,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset; }
          50%     { box-shadow: 0 10px 36px rgba(34,211,238,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset; }
        }
        .ipm-aura { animation: ipmGlowAura 4s ease-in-out infinite; }
        .ipm-cta  { animation: ipmBtnPulse 2.6s ease-in-out infinite; transition: transform .12s ease, filter .2s ease; }
        .ipm-cta:hover  { transform: translateY(-1px); filter: brightness(1.07); }
        .ipm-cta:active { transform: scale(0.97); }
        .ipm-close { transition: background .2s ease, transform .15s ease; }
        .ipm-close:hover { background: rgba(255,255,255,0.30); transform: rotate(90deg); }
      `}</style>

      <div onClick={(e) => e.stopPropagation()}
        className="ipm-aura"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.14)',
          maxWidth: 380, width: '100%',
          borderRadius: 24, padding: 0, overflow: 'hidden',
          color: '#fff',
          animation: 'ipmPop 0.3s cubic-bezier(0.34,1.56,0.64,1), ipmGlowAura 4s ease-in-out infinite',
        }}>
        <div style={{
          position: 'relative', height: 150,
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,200,87,0.30), transparent 60%),
            radial-gradient(circle at 75% 70%, rgba(157,92,255,0.40), transparent 60%),
            linear-gradient(135deg,#1B0E3F 0%,#3A1B73 50%,#150C2E 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:140, height:140, borderRadius:'50%', background:'rgba(245,197,66,0.25)', filter:'blur(28px)' }} />
          <div style={{ position:'absolute', bottom:-30, left:-20, width:160, height:160, borderRadius:'50%', background:'rgba(157,92,255,0.30)', filter:'blur(36px)' }} />
          <button onClick={onClose} aria-label="Close" className="ipm-close" style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.20)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}>
            <FaTimes size={13} />
          </button>
          <div style={{
            width: 92, height: 92, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FFC857,#FF7A45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 18px 40px rgba(255,122,69,0.55), 0 0 0 6px rgba(255,200,87,0.18), 0 0 50px rgba(255,200,87,0.30)',
            color: '#2A1500', position: 'relative',
            animation: 'ipmFloat 2.6s ease-in-out infinite',
          }}>
            <GiTwoCoins size={48} />
          </div>
        </div>

        <div style={{ padding: '20px 22px 24px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(255,200,87,0.15)', color: '#FFE9B3',
            fontSize: 11, fontWeight: 800, letterSpacing: 0.7,
            border: '1px solid rgba(255,200,87,0.35)',
          }}>
            <HiSparkles /> NOT ENOUGH POINTS
          </div>
          <h3 style={{
            margin: '12px 0 6px', fontSize: 22, letterSpacing: -0.3, fontWeight: 800,
            background: 'linear-gradient(135deg,#fff,#C9C2FF 60%,#22D3EE)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>
            Need {needed} more points
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
            You need <strong style={{ color: '#fff' }}>{required} points</strong> to unlock the {contactLabel}'s contact.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 14, padding: 14, marginTop: 16,
          }}>
            <div style={{ textAlign: 'left' }}>
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Your balance</small>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#D7BBFF', textShadow: '0 0 14px rgba(157,92,255,0.55)' }}>{balance} pts</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>You need</small>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F9A8D4', textShadow: '0 0 14px rgba(244,114,182,0.55)' }}>{required} pts</div>
            </div>
          </div>

          <button onClick={goPlans} className="ipm-cta" style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#1a7c3e,#27AE60)',
            color: '#fff', fontWeight: 900, marginTop: 18, cursor: 'pointer',
            fontSize: 15, letterSpacing: 0.5,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <FaWallet size={14} /> Buy Points Now
          </button>

          <button onClick={onClose} style={{
            marginTop: 12, background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>Maybe later</button>
        </div>
      </div>
    </div>
  );
};

export default InsufficientPointsModal;
