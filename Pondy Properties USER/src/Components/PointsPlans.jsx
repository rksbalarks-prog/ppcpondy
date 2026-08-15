import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaCrown, FaHistory, FaWallet, FaBolt } from 'react-icons/fa';
import { GiTwoCoins, GiDiamondHard } from 'react-icons/gi';
import { HiSparkles } from 'react-icons/hi2';
import { IoMdRocket } from 'react-icons/io';

const API = process.env.REACT_APP_API_URL;
const POINTS_PER_REVEAL = 10;
const MOBILE_MAX = 480;

const PointsPlans = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phoneNumber || localStorage.getItem('phoneNumber') || '';

  const [plans, setPlans] = useState([]);
  const [balance, setBalance] = useState(0);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // `buyingPlanId` doubles as both a "request in-flight" guard and a way to
  // show the spinner on the exact card that was clicked. `buyError` surfaces
  // any failure as a small popup so the user is not silently stranded.
  const [buyingPlanId, setBuyingPlanId] = useState(null);
  const [buyError, setBuyError] = useState('');
  const scrollRef = useRef(null);
  // Guards the one-shot auto-buy so it can't fire twice if `plans` re-renders.
  const autoBuyTriggered = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(`${API}/points-plans`)
      .then((r) => {
        if (cancelled) return;
        const list = Array.isArray(r.data) ? r.data : [];
        setPlans(list);
        setLoadError('');
      })
      .catch(() => {
        if (cancelled) return;
        setPlans([]);
        setLoadError('Could not load plans. Please try again.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!phone) return;
    axios.get(`${API}/points-balance/${phone}`)
      .then((r) => setBalance(r.data?.balance ?? 0))
      .catch(() => setBalance(0));
  }, [phone]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth } = el;
    setActive(Math.round(scrollLeft / clientWidth));
  };

  // Inline PayU "Pay Now" handoff — the intermediate /payu-points-form page
  // used to collect Full Name + Email before posting to PayU, but those
  // fields were just synthetic defaults ("User" + a generated gmail address)
  // that the user typically did not edit, so we skip that page entirely and
  // submit straight to PayU when "BUY POINTS" is tapped. Mirrors the Pay Now
  // sequence in PayUPointsForm.handlePayNow.
  const submitToPayU = (payuData) => {
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

  const onBuyClick = async (p) => {
    if (buyingPlanId) return;        // already a request in-flight
    if (!phone)       return setBuyError('Phone number is missing. Please log in again.');
    if (!p?._id)      return setBuyError('Plan is missing.');
    if (!p?.price)    return setBuyError('Plan price is missing.');

    const txnid     = 'points_' + Date.now();
    const firstname = 'User';
    const email     = `user${Date.now()}@gmail.com`;

    setBuyingPlanId(p._id);
    try {
      await axios.post(`${API}/select-points-plan`, {
        phoneNumber: phone,
        planId: p._id,
        points: p.points,
        amount: p.price,
      });

      const res = await axios.post(`${API}/payu/points-payment`, {
        txnid,
        amount: String(p.price),
        productinfo: 'Points Plan',
        firstname,
        email,
        phone,
        payustatususer: 'pay now',
        planName: p.name,
        planId: p._id,
        points: p.points,
      });

      submitToPayU(res.data);
      // Don't clear buyingPlanId here — the browser is mid-redirect to PayU
      // and clearing it would briefly re-enable the button.
    } catch (e) {
      setBuyError(e?.response?.data?.message || e.message || 'Could not start payment.');
      setBuyingPlanId(null);
    }
  };

  // Auto-buy: when the InsufficientPointsModal sends the user here with an
  // `autoBuy` request, find the matching pack (₹100 / 100 points) and kick off
  // the same PayU handoff straight away, so the user lands on the payment page
  // without having to pick a plan.
  useEffect(() => {
    if (autoBuyTriggered.current) return;
    const auto = location.state?.autoBuy;
    if (!auto || loading || !plans.length || buyingPlanId) return;

    const wantPrice = Number(auto.price);
    const wantPoints = Number(auto.points);
    const target =
      plans.find((p) => Number(p.price) === wantPrice && Number(p.points) === wantPoints) ||
      plans.find((p) => Number(p.price) === wantPrice) ||
      plans.find((p) => Number(p.points) === wantPoints);

    if (target) {
      autoBuyTriggered.current = true;
      onBuyClick(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, loading, plans, buyingPlanId]);

  const baseRate = useMemo(() => {
    if (!plans.length) return null;
    const rates = plans.map((p) => (p.points > 0 ? p.price / p.points : Infinity));
    return Math.min(...rates);
  }, [plans]);

  const savingsPct = (p) => {
    if (!baseRate || !p.points) return 0;
    const rate = p.price / p.points;
    if (rate >= baseRate) return 0;
    return Math.round(((baseRate - rate) / baseRate) * 100);
  };

  const planIcon = (idx) => {
    if (idx === 0) return <GiTwoCoins size={26} />;
    if (idx === 1) return <HiSparkles size={26} />;
    if (idx === 2) return <IoMdRocket size={26} />;
    return <GiDiamondHard size={26} />;
  };

  // Auto-buy hand-off: while we resolve the ₹100 plan and redirect to PayU,
  // show a plain "redirecting" screen instead of flashing the plan carousel.
  // The auto-buy effect above still runs, so the redirect happens normally.
  // If something fails, `buyError` is set and we fall through to the full page.
  if (location.state?.autoBuy && !buyError) {
    return (
      <div style={{
        minHeight: '100vh', background: '#070512', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{`@keyframes ppFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
        <div style={{ fontSize: 40, animation: 'ppFloat 1.4s ease-in-out infinite' }}>🪙</div>
        <div style={{ marginTop: 14, fontSize: 15, opacity: 0.85 }}>
          Redirecting to secure payment…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070512' }}>
      <style>{`
        .pp-carousel::-webkit-scrollbar{display:none}

        @keyframes ppShift {
          0%,100% { background-position: 0% 0%, 100% 100%, 50% 50%; }
          50%     { background-position: 100% 50%, 0% 50%, 50% 50%; }
        }
        @keyframes ppFloat {
          0%,100% { transform: translateY(0) }
          50%     { transform: translateY(-6px) }
        }
        @keyframes ppSpin { from { transform: rotateY(0) } to { transform: rotateY(360deg) } }
        @keyframes ppShine {
          0%   { transform: translateX(-120%) skewX(-20deg); }
          60%  { transform: translateX(220%)  skewX(-20deg); }
          100% { transform: translateX(220%)  skewX(-20deg); }
        }
        @keyframes ppGlowBorder {
          0%,100% { box-shadow: 0 0 0 1px rgba(157,92,255,0.45), 0 0 24px rgba(157,92,255,0.35), 0 14px 40px rgba(0,0,0,0.55); }
          50%     { box-shadow: 0 0 0 1px rgba(255,200,87,0.55),  0 0 28px rgba(255,200,87,0.45), 0 14px 40px rgba(0,0,0,0.55); }
        }
        @keyframes ppGlowSoft {
          0%,100% { box-shadow: 0 8px 22px rgba(26,124,62,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset; }
          50%     { box-shadow: 0 8px 30px rgba(34,211,238,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset; }
        }
        @keyframes ppPopIn {
          from { opacity: 0; transform: scale(0.94) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ppBlobShift {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(20px,-30px) scale(1.1); }
        }

        .pp-bg {
          background:
            radial-gradient(800px 400px at 80% -10%, rgba(157,92,255,0.40), transparent 60%),
            radial-gradient(700px 500px at -10% 30%, rgba(34,211,238,0.20), transparent 60%),
            radial-gradient(600px 500px at 50% 110%, rgba(255,200,87,0.18), transparent 60%),
            linear-gradient(160deg,#0B0820 0%,#150C2E 40%,#1E0F44 100%);
          background-size: 200% 200%, 200% 200%, 200% 200%, 100% 100%;
          animation: ppShift 24s ease-in-out infinite;
        }

        .pp-card {
          position: relative;
          background: linear-gradient(155deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow:
            0 0 0 1px rgba(157,92,255,0.18),
            0 14px 40px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.10);
          transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, opacity .25s ease;
        }
        .pp-card.is-active { box-shadow:
          0 0 0 1px rgba(157,92,255,0.35),
          0 0 36px rgba(157,92,255,0.30),
          0 18px 50px rgba(0,0,0,0.6),
          inset 0 1px 0 rgba(255,255,255,0.14);
        }
        .pp-card-popular {
          animation: ppGlowBorder 4s ease-in-out infinite;
          border-color: rgba(255,200,87,0.55);
        }
        .pp-card-popular::after {
          content:'';
          position:absolute; inset:0; border-radius:inherit;
          overflow:hidden; pointer-events:none;
        }
        .pp-shine-sweep {
          position:absolute; top:0; bottom:0; left:0; width:35%;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
          animation: ppShine 4.5s ease-in-out infinite;
          pointer-events:none;
          mix-blend-mode: overlay;
          border-radius: inherit;
        }

        .pp-buy {
          position: relative;
          transition: transform .12s ease, box-shadow .25s ease, filter .2s ease;
        }
        .pp-buy:hover  { transform: translateY(-2px); filter: brightness(1.07); }
        .pp-buy:active { transform: scale(0.97); }
        .pp-buy-green  { animation: ppGlowSoft 3.2s ease-in-out infinite; }
        .pp-buy-gold {
          background: linear-gradient(135deg,#FFC857 0%,#FF7A45 100%);
          box-shadow: 0 10px 30px rgba(255,122,69,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset;
        }

        .pp-tag-icon {
          background: linear-gradient(135deg,#9D5CFF,#22D3EE);
          color: #fff;
          box-shadow: 0 8px 24px rgba(157,92,255,0.55), 0 0 0 1px rgba(255,255,255,0.14) inset;
        }
        .pp-tag-icon-gold {
          background: linear-gradient(135deg,#FFC857,#FF7A45);
          color: #2A1500;
          box-shadow: 0 8px 24px rgba(255,200,87,0.55), 0 0 0 1px rgba(255,255,255,0.16) inset;
        }
        .pp-coin-spin { display:inline-block; animation: ppSpin 5s linear infinite; transform-style: preserve-3d; }
        .pp-pop-in   { animation: ppPopIn .55s cubic-bezier(.2,.9,.2,1) both; }
        .pp-blob-a   { animation: ppBlobShift 12s ease-in-out infinite; }
        .pp-blob-b   { animation: ppBlobShift 16s ease-in-out infinite reverse; }

        .pp-back-btn { transition: transform .15s ease, background .2s ease; }
        .pp-back-btn:hover { background: rgba(255,255,255,0.22); transform: translateX(-2px); }

        .pp-history-pill { transition: transform .15s ease, box-shadow .25s ease; }
        .pp-history-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(34,211,238,0.45);
        }

        .pp-price-glow {
          background: linear-gradient(135deg,#C77DFF 0%,#9D5CFF 50%,#22D3EE 100%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
          filter: drop-shadow(0 2px 12px rgba(157,92,255,0.45));
        }
      `}</style>

      <div className="pp-bg" style={{
        maxWidth: MOBILE_MAX, margin: '0 auto', width: '100%', minHeight: '100vh',
        position: 'relative', padding: '20px 0 36px', overflow: 'hidden',
      }}>
        <div className="pp-blob-a" style={{ position:'absolute', top:-80, right:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,200,87,0.35), transparent 70%)', filter:'blur(36px)', pointerEvents:'none' }} />
        <div className="pp-blob-b" style={{ position:'absolute', top:200, left:-100, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,211,238,0.25), transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(244,114,182,0.20), transparent 70%)', filter:'blur(48px)', pointerEvents:'none' }} />

        <button onClick={() => navigate(-1)} aria-label="Back" className="pp-back-btn" style={{
          position: 'absolute', top: 14, left: 12,
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 5,
        }}>
          <FaArrowLeft size={16} />
        </button>

        <div className="pp-pop-in" style={{ color: '#fff', textAlign: 'center', padding: '8px 16px 0', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 999,
            background: 'linear-gradient(90deg, rgba(157,92,255,0.25), rgba(34,211,238,0.20))',
            border: '1px solid rgba(255,255,255,0.16)',
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            backdropFilter: 'blur(8px)',
          }}>
            <HiSparkles color="#FFC857" /> POINTS STORE
          </div>
          <h2 style={{
            margin: '14px 0 6px', fontSize: 30, letterSpacing: -0.6, fontWeight: 800,
            background: 'linear-gradient(135deg,#fff,#C9C2FF 60%,#22D3EE)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>Buy Points</h2>
          <p style={{ opacity: 0.75, marginTop: 2, fontSize: 13 }}>
            {POINTS_PER_REVEAL} points unlocks one owner contact reveal
          </p>
        </div>

        <div className="pp-pop-in" style={{
          marginTop: 14, marginInline: 16,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(16px)',
          borderRadius: 22, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14, color: '#fff',
          boxShadow: '0 0 0 1px rgba(157,92,255,0.18), 0 16px 48px rgba(0,0,0,0.45)',
        }}>
          <div className="pp-tag-icon-gold" style={{
            width: 52, height: 52, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ppFloat 3s ease-in-out infinite',
          }}>
            <span className="pp-coin-spin"><GiTwoCoins size={26} /></span>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Current balance</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="pp-price-glow" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{balance}</span>
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.75 }}>pts</span>
            </div>
          </div>
          <button onClick={() => navigate('/points-history')} className="pp-history-pill" style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(157,92,255,0.18))',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}>
            <FaHistory size={11} /> History
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: '60px 16px', opacity: 0.85 }}>
            <div style={{ fontSize: 30, animation: 'ppFloat 1.4s ease-in-out infinite' }}>🪙</div>
            <div style={{ marginTop: 10, fontSize: 14 }}>Loading plans…</div>
          </div>
        ) : plans.length === 0 ? (
          <div className="pp-card pp-pop-in" style={{
            margin: '24px 16px', borderRadius: 22, padding: 32, textAlign: 'center', color: '#fff',
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🪙</div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>No plans available</h4>
            <p style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>
              {loadError || 'Plans haven’t been published yet. Please check back later.'}
            </p>
          </div>
        ) : (
          <div ref={scrollRef} onScroll={handleScroll} className="pp-carousel"
               style={{
                 display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                 gap: 14, padding: '24px 16px 8px', scrollBehavior: 'smooth',
                 scrollbarWidth: 'none',
               }}>
            {plans.map((p, i) => {
              const isActive = i === active;
              const save = savingsPct(p);
              const isPopular = !!p.popular;
              return (
                <div key={p._id}
                  className={`pp-card ${isActive ? 'is-active' : ''} ${isPopular ? 'pp-card-popular' : ''}`}
                  style={{
                    flex: '0 0 84%', maxWidth: 360, scrollSnapAlign: 'center',
                    borderRadius: 22, padding: 22, color: '#fff',
                    transform: isActive ? 'scale(1)' : 'scale(0.93)',
                    opacity: isActive ? 1 : 0.85,
                    overflow: 'hidden',
                  }}>
                  {isPopular && <div className="pp-shine-sweep" />}
                  {isPopular && (
                    <div style={{
                      position:'absolute', top:14, right:-36, transform:'rotate(35deg)',
                      background:'linear-gradient(90deg,#FFC857,#FF7A45)',
                      color:'#2A1500', padding:'3px 38px',
                      fontSize:10, fontWeight:900, letterSpacing:1,
                      boxShadow:'0 4px 14px rgba(255,122,69,0.55)',
                    }}>POPULAR</div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <div className={isPopular ? 'pp-tag-icon-gold' : 'pp-tag-icon'} style={{
                      width: 48, height: 48, borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isPopular ? <FaCrown size={22} /> : planIcon(i)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        margin: 0, fontSize: 22, letterSpacing: -0.3, fontWeight: 800,
                        background: isPopular
                          ? 'linear-gradient(135deg,#FFE9B3,#FFC857)'
                          : 'linear-gradient(135deg,#fff,#C9C2FF)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                      }}>{p.name}</h3>
                      {p.description && (
                        <small style={{ color: 'rgba(255,255,255,0.65)', display: 'block', marginTop: 2, fontSize: 12 }}>
                          {p.description}
                        </small>
                      )}
                    </div>
                  </div>

                  <hr style={{ border: 0, borderTop: '1px dashed rgba(255,255,255,0.14)', margin: '14px 0' }} />

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>₹</span>
                    <span className="pp-price-glow" style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
                      {p.price}
                    </span>
                    {save > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        background: 'linear-gradient(135deg,#22D3EE,#9D5CFF)',
                        color: '#fff',
                        padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                        boxShadow: '0 6px 18px rgba(34,211,238,0.45)',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}><FaBolt size={10} /> SAVE {save}%</span>
                    )}
                  </div>

                  <div style={{
                    marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'linear-gradient(90deg, rgba(255,200,87,0.25), rgba(255,122,69,0.18))',
                    color: '#FFE9B3',
                    padding: '5px 12px', borderRadius: 999,
                    fontWeight: 700, fontSize: 14,
                    border: '1px solid rgba(255,200,87,0.35)',
                  }}>
                    <GiTwoCoins size={14} /> {p.points} points
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <FaCheckCircle color="#22D3EE" /> ≈ {Math.floor((p.points || 0) / POINTS_PER_REVEAL)} owner contact reveals
                    </li>
                    {p.durationDays > 0 && (
                      <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <FaCheckCircle color="#22D3EE" /> Valid for {p.durationDays} days
                      </li>
                    )}
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaCheckCircle color="#22D3EE" /> Instant credit after payment
                    </li>
                  </ul>

                  <button onClick={() => onBuyClick(p)}
                    disabled={!!buyingPlanId}
                    className={`pp-buy ${isPopular ? 'pp-buy-gold' : 'pp-buy-green'}`}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                      background: isPopular ? undefined : 'linear-gradient(135deg,#1a7c3e,#27AE60)',
                      color: '#fff', fontWeight: 800, marginTop: 16,
                      cursor: buyingPlanId ? 'wait' : 'pointer',
                      opacity: buyingPlanId && buyingPlanId !== p._id ? 0.6 : 1,
                      fontSize: 14, letterSpacing: 0.6,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <FaWallet size={14} />
                    {buyingPlanId === p._id ? 'REDIRECTING…' : 'BUY POINTS'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {plans.length > 1 && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            {plans.map((_, i) => (
              <span key={i} style={{
                display: 'inline-block', height: 6, borderRadius: 3, margin: '0 3px',
                width: i === active ? 24 : 6,
                background: i === active
                  ? 'linear-gradient(90deg,#9D5CFF,#22D3EE)'
                  : 'rgba(255,255,255,0.30)',
                boxShadow: i === active ? '0 0 12px rgba(157,92,255,0.55)' : 'none',
                transition: 'width .25s ease, background .25s ease',
              }} />
            ))}
          </div>
        )}

        <div style={{
          marginTop: 22, color: 'rgba(255,255,255,0.65)', fontSize: 12,
          textAlign: 'center', padding: '0 24px',
        }}>
          🔒 Secure PayU checkout · Points credit instantly on success
        </div>
      </div>

      {buyError && (
        <div
          onClick={() => setBuyError('')}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', maxWidth: 360, padding: 22, borderRadius: 12, textAlign: 'center' }}
          >
            <p style={{ color: '#c0392b', fontWeight: 600 }}>{buyError}</p>
            <button
              onClick={() => setBuyError('')}
              style={{
                padding: '8px 18px', borderRadius: 6, border: 'none',
                background: '#4F4B7E', color: '#fff', marginTop: 6, cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsPlans;
