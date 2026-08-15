


import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaBuilding, FaLightbulb, FaUserCircle, FaRocket, FaCogs, FaInfoCircle, FaRegAddressCard, FaShare, FaStar, FaShieldAlt, FaUsers, FaEnvelope, FaRegBell, FaShippingFast } from 'react-icons/fa';
import logo from "../Assets/ppc logo.jpg";
import { useNavigate, useLocation } from 'react-router-dom';
import { MdClose, MdPolicy } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import { RiApps2AiFill } from 'react-icons/ri';
import { HiDocumentText } from 'react-icons/hi2';
import { BiSolidLogIn } from 'react-icons/bi';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setPhoneNumber } from '../red/userSlice'; // Import your Redux action
import { pathToBase, getActiveBase } from '../utils/cityBase';
import './Navbar.css';




const SidebarApp = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Animated brand's first word follows the active city: 'Chennai' for CH,
  // 'Pondy' for PY. Prefer the URL (/chennai|/pondicherry); fall back to the
  // stored activeBase when the path isn't city-specific.
  const brandCity = (pathToBase(location.pathname) || getActiveBase()) === 'CH' ? 'Chennai' : 'Pondy';
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [notifications, setNotifications] = useState([]);

    const [hasUnread, setHasUnread] = useState(false);
    const [hasClickedBell, setHasClickedBell] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ── Points balance shown in the navbar pill ──────────────────────
    const [pointsBalance, setPointsBalance] = useState(0);

    // Compact "K / M / B" formatter so the pill stays narrow when the balance
    // grows. e.g. 999 → "999", 1500 → "1.5K", 10000 → "10K", 1200000 → "1.2M".
    // We trim trailing ".0" so "10.0K" reads as "10K".
    const formatPoints = (n) => {
      const num = Number(n) || 0;
      if (num < 1000) return String(num);
      const trim = (s) => s.replace(/\.0$/, "");
      if (num < 1_000_000) return trim((num / 1000).toFixed(1)) + "K";
      if (num < 1_000_000_000) return trim((num / 1_000_000).toFixed(1)) + "M";
      return trim((num / 1_000_000_000).toFixed(1)) + "B";
    };
    useEffect(() => {
      const phone = localStorage.getItem('phoneNumber');
      if (!phone) return;
      let cancelled = false;
      const load = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/points-balance/${phone}`)
          .then((r) => { if (!cancelled) setPointsBalance(Number(r.data?.balance || 0)); })
          .catch(() => {});
      };
      load();
      // Refresh when other parts of the app dispatch a 'points:updated' event
      // (fired after a deduct/credit so the navbar stays in sync without a reload).
      const onUpdate = () => load();
      window.addEventListener('points:updated', onUpdate);
      // Also refresh when the user comes back to the tab.
      window.addEventListener('focus', onUpdate);
      return () => {
        cancelled = true;
        window.removeEventListener('points:updated', onUpdate);
        window.removeEventListener('focus', onUpdate);
      };
    }, []);


  const handleMouseEnter = (linkId) => setHoveredLink(linkId);
  const handleMouseLeave = () => setHoveredLink(null);

  // Function to apply bold styling only to the hovered link
  const getLinkStyle = (linkId) => ({
    color: 'black',
    fontWeight: hoveredLink === linkId ? 'bold' : 'normal',
    transition: 'all 0.3s ease-in-out',
    transform: hoveredLink === linkId ? 'scale(1.1)' : 'scale(1)', // Slightly enlarge the link on hover

  });

// ... inside your component ...

const dispatch = useDispatch();

// Send logout notification via WhatsApp
const sendLogoutNotification = async (phoneNumber) => {
  try {
    // Format phone number for WhatsApp (remove non-digits and ensure country code)
    const mobileNumber = String(phoneNumber).replace(/\D/g, ""); // Remove all non-numeric characters
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hi Owner, 👋

🔓 You've Been Logged Out

Your Pondy Property account has been logged out successfully.

If you didn't perform this action, please:
📞 Contact us: +91-8300622013
📧 Email: info.ppc@gmail.com

Stay safe and secure!

– Team Rent Pondy`;

      await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ Logout notification sent successfully to", whatsappNumber);
      return true;
    }
  } catch (whatsAppError) {
    console.log("⚠️ Logout notification delivery failed (non-blocking):", whatsAppError.message);
    // Non-blocking error - continue logout
    return false;
  }
};

const handleLogout = async () => {
  // Get phone number before clearing
  const userPhoneNumber = localStorage.getItem('phoneNumber');
  
  // Send logout notification via WhatsApp (non-blocking)
  if (userPhoneNumber) {
    await sendLogoutNotification(userPhoneNumber);
  }
  
  // Clear Redux store
  dispatch(setPhoneNumber(null)); // Or use a dedicated logout action if you have one
  
  // Clear localStorage
  localStorage.removeItem('phoneNumber');
  
  // Redirect to login page
  navigate('/login');
  
  // Optional: Show logout success message
  // toast.success("Logged out successfully!");
};


  const { phoneNumber: statePhoneNumber, countryCode: stateCountryCode } = location.state || {};
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  // const storedCountryCode = localStorage.getItem('countryCode');

  const phoneNumber = statePhoneNumber || storedPhoneNumber;
  // const countryCode = stateCountryCode || storedCountryCode;

  const fullPhoneNumber = `${phoneNumber}`;

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);





  const fetchUnreadNotifications = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-unread-notifications`, {
        params: { phoneNumber },
      });
      const unread = res.data.notifications || [];

      setNotifications(unread);
      setHasUnread(unread.length > 0);

    } catch (error) {
    }
  };

  useEffect(() => {
    if (phoneNumber) {
      fetchUnreadNotifications();
    }
  }, [phoneNumber]);

  const handleBellClick = () => {
    setHasClickedBell(true);
    navigate('/notification');

    // You can show the notifications dropdown or modal here
  };


  useEffect(() => {
    if (phoneNumber ) {
      localStorage.setItem('phoneNumber', phoneNumber);
      // localStorage.setItem('countryCode', countryCode);
    } else {
    }
  }, [phoneNumber]);

  const handleLinkClick = (path) => {
    navigate(path, { state: { phoneNumber: fullPhoneNumber } });
    closeSidebar();
  };
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        closeSidebar();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSidebarOpen]);







  return (
<div className="d-flex" style={{ fontFamily: "Inter, sans-serif" }}>
  {/* Sidebar */}
  <div
    ref={sidebarRef}
    className={`position-fixed bg-light border-end ${isSidebarOpen ? "d-block" : "d-none"}`}
    style={{
      width: "300px",
      height: "auto", 
      transition: "left 0.3s ease",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden", // Prevents children from exceeding
    }}
  >
    <button
      className="btn position-absolute top-0 end-0 m-0"
      onClick={toggleSidebar}
      aria-label="Close Sidebar"
    >
      <MdClose />
    </button>

    {/* Fixed Header */}
    <div
      style={{
        background: "#30747F",
        flexShrink: 0, // Prevents header from shrinking
        padding: "10px",
      }}
      className="d-flex align-items-center w-100"
    >
      <img
        src={logo}
        alt="Logo"
        style={{ height: "80px", width: "80px" }}
        className="mb-2 mb-md-0 rounded-4"
      />
      <div className="ms-md-3 ms-2">
        <h6 style={{ color: "white" }}>Pondy Property</h6>
        <p style={{ color: "white", fontSize: "13px" }}>
          Buy and sell your Property in Pondicherry
        </p>
        {phoneNumber && (
          <p style={{ color: "white", fontSize: "12px", margin: "0", marginTop: "-8px" }}>
            <FaPhone style={{ marginRight: "6px" }} />
            {fullPhoneNumber}
          </p>
        )}
      </div>
    </div>
    <div className="row g-2 mt-1"
     style={{background:"#ffffff", overflowY: "scroll", scrollbarWidth: "none" , width:"300px", height: "80vh", }}>
    <ul className="nav flex-column pb-5 w-100 ">

      {/* Sidebar links with hover effect */}
    
      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('my-profile')}
          onMouseEnter={() => handleMouseEnter('my-profile')}
          onMouseLeave={handleMouseLeave}
          href={`/my-profile/${phoneNumber}`}
          onClick={() => handleLinkClick(`/my-profile/${phoneNumber}`)}
        >
          <FaUserCircle className="me-2" style={{ color: '#30747F' }} /> My Profile
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('my-property')}
          onMouseEnter={() => handleMouseEnter('my-property')}
          onMouseLeave={handleMouseLeave}
          href="/my-property"
          onClick={() => handleLinkClick("/my-property")}
        >
          <FaBuilding className="me-2" style={{ color: '#30747F' }} /> My Property
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('my-plan')}
          onMouseEnter={() => handleMouseEnter('my-plan')}
          onMouseLeave={handleMouseLeave}
          href={`/my-plan`}
          onClick={() => handleLinkClick(`/my-plan`)}
        >
          <FaLightbulb className="me-2" style={{ color: '#30747F' }} /> My Plan
        </a>
      </li>


    <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('plans')}
          onMouseEnter={() => handleMouseEnter('plans')}
          onMouseLeave={handleMouseLeave}
          href="/add-plan"
          onClick={() => handleLinkClick("/add-plan")}
        >
          <FaRocket className="me-2" style={{ color: '#30747F' }} /> Pricing Plans
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('points plans')}
          onMouseEnter={() => handleMouseEnter('points plans')}
          onMouseLeave={handleMouseLeave}
          href="/points-plans"
          onClick={() => handleLinkClick("/points-plans")}
        >
          <FaRocket className="me-2" style={{ color: '#30747F' }} /> Points Pricing
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('points history')}
          onMouseEnter={() => handleMouseEnter('points history')}
          onMouseLeave={handleMouseLeave}
          href="/points-history"
          onClick={() => handleLinkClick("/points-history")}
        >
          <FaRocket className="me-2" style={{ color: '#30747F' }} /> My Points History
        </a>
      </li>

  <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('buyer plans')}
          onMouseEnter={() => handleMouseEnter('buyer plans')}
          onMouseLeave={handleMouseLeave}
          href="/my-buyer-plan"
          onClick={() => handleLinkClick("/my-buyer-plan")}
        >
          <FaRocket className="me-2" style={{ color: '#30747F' }} />My Buyer Assistant Plan
        </a>
      </li>


      
    <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('owner menu')}
          onMouseEnter={() => handleMouseEnter('owner menu')}
          onMouseLeave={handleMouseLeave}
          href="/owner-menu"
          onClick={() => handleLinkClick("/owner-menu")}
        >
          <FaRocket className="me-2" style={{ color: '#30747F' }} /> Owner Menu
        </a>
      </li> 

  <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('buyer menu')}
          onMouseEnter={() => handleMouseEnter('buyer menu')}
          onMouseLeave={handleMouseLeave}
          href="/buyer-menu"
          onClick={() => handleLinkClick("/buyer-menu")}
        >
          <FaRocket className="me-2" style={{ color: '#30747F' }} /> BuyerMenu
        </a>
      </li>


      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('tabs')}
          onMouseEnter={() => handleMouseEnter('tabs')}
          onMouseLeave={handleMouseLeave}
          href="/tabs"
          onClick={() => handleLinkClick("/tabs")}
        >
          <FaCogs className="me-2" style={{ color: '#30747F' }} /> More
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('contactus')}
          onMouseEnter={() => handleMouseEnter('contactus')}
          onMouseLeave={handleMouseLeave}
          href="/contactus"
          onClick={() => handleLinkClick("/contactus")}
        >
          <FaPhone className="me-2" style={{ color: '#30747F' }} /> Contact Us
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('about-us')}
          onMouseEnter={() => handleMouseEnter('about-us')}
          onMouseLeave={handleMouseLeave}
          href="/about-mobile"
          onClick={() => handleLinkClick("/about-mobile")}
        >
          <FaInfoCircle className="me-2" style={{ color: '#30747F' }} /> About Us
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('refund-policy')}
          onMouseEnter={() => handleMouseEnter('refund-policy')}
          onMouseLeave={handleMouseLeave}
          href="/refund-mobile"
          onClick={() => handleLinkClick("/refund-mobile")}
        >
          <MdPolicy className="me-2" style={{ color: '#30747F' }} /> Refund Policy
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('terms-conditions')}
          onMouseEnter={() => handleMouseEnter('terms-conditions')}
          onMouseLeave={handleMouseLeave}
          href="/terms-conditions"
          onClick={() => handleLinkClick("/terms-conditions")}
        >
          <HiDocumentText  className="me-2" style={{ color: '#30747F' }} /> Terms And Conditions
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('shiping-delivery')}
          onMouseEnter={() => handleMouseEnter('shiping-delivery')}
          onMouseLeave={handleMouseLeave}
          href="/shiping-delivery-app"
          onClick={() => handleLinkClick("/shiping-delivery")}
        >
          <FaShippingFast  className="me-2" style={{ color: '#30747F' }} />Shipping & Delivery
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('more-app')}
          onMouseEnter={() => handleMouseEnter('more-app')}
          onMouseLeave={handleMouseLeave}
          href="https://play.google.com/store/apps/dev?id=5743868169001839900&hl=en"
            target="_blank"
  rel="noopener noreferrer"
          // onClick={() => handleLinkClick("https://play.google.com/store/apps/dev?id=5743868169001839900&hl=en")}
        >
          <RiApps2AiFill className="me-2" style={{ color: '#30747F' }} /> More App
        </a>
      </li>

      <li className="nav-item">
      <a
  className="nav-link"
  style={getLinkStyle('share-app')}
  onMouseEnter={() => handleMouseEnter('share-app')}
  onMouseLeave={handleMouseLeave}
  href="https://play.google.com/store/apps/dev?id=5743868169001839900&hl=en"
  target="_blank"
  rel="noopener noreferrer"
  // onClick={() => handleLinkClick("https://play.google.com/store/apps/dev?id=5743868169001839900&hl=en")}
>
  <FaShare className="me-2" style={{ color: '#30747F' }} /> Share App
</a>

      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('rate-app')}
          onMouseEnter={() => handleMouseEnter('rate-app')}
          onMouseLeave={handleMouseLeave}
          href="https://play.google.com/store/apps/details?id=com.deepseek.chat&hl=en#review"
          target="_blank"
  rel="noopener noreferrer"
          // onClick={() => handleLinkClick("https://play.google.com/store/apps/details?id=com.deepseek.chat&hl=en#review")}
        >
          <FaStar className="me-2" style={{ color: '#30747F' }} /> Rate App
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('business')}
          onMouseEnter={() => handleMouseEnter('business')}
          onMouseLeave={handleMouseLeave}
          href="/business"
          onClick={() => handleLinkClick("/business")}
        >
          <FaShieldAlt className="me-2" style={{ color: '#30747F' }} /> Business Opportunity
        </a>
      </li>

      <li className="nav-item">
        <a
          className="nav-link"
          style={getLinkStyle('our-support')}
          onMouseEnter={() => handleMouseEnter('our-support')}
          onMouseLeave={handleMouseLeave}
          href="/our-support"
          onClick={() => handleLinkClick("/our-support")}
        >
          <FaUsers className="me-2" style={{ color: '#30747F' }} /> Our Support
        </a>
      </li>



 

      <li className="nav-item">
        <button
          className="nav-link border-0 bg-transparent w-100 text-start p-0"
          style={getLinkStyle('logout')}
          onMouseEnter={() => handleMouseEnter('logout')}
          onMouseLeave={handleMouseLeave}
          onClick={() => setShowConfirm(true)} // show popup
        >
          <BiSolidLogIn className="ms-3 me-2" style={{ color: '#30747F' }} />
          Logout
        </button>
      </li>
      {/* Confirmation Popup */}
     {showConfirm && (
  <div
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 3000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
                    minWidth: '280px',

  }}
>
  <div
    style={{
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',

      textAlign: 'center',
    }}
  >
            <h5 className="text-center" style={{fontSize:"13px"}}>Are you sure you want to logout?</h5>
      <div className="d-flex justify-content-between gap-3">
              <button className="btn px-4" style={{background:"blue", color:"#fff"}} onClick={handleLogout}>Yes</button>
              <button className="btn px-4" style={{background:"white", color:"blue",  boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',}} onClick={() => setShowConfirm(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </ul>
    </div>

      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Navbar */}
        <nav
          className="navbar navbar-light bg-light d-flex align-items-center justify-content-between px-3"
          style={{ width: '100%', height: '60px' }}
        >
          <button
            className="btn"
            onClick={toggleSidebar}
            style={{ fontSize: 32, lineHeight: 1, padding: '4px 10px', color: '#30747F' }}
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Animated brand — centered in the navbar. */}
          <div className="navbar-intro-container">
            <div className="house">
              <div className="roof"></div>
              <div className="title">
                <span className="rent">{brandCity}</span>
                <span className="pondy">Property</span>
              </div>
            </div>
          </div>

          {/* Right cluster: points pill, then bell. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <style>{`
              @keyframes pillSpin { from { transform: rotateY(0) } to { transform: rotateY(360deg) } }
              @keyframes pillFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
              @keyframes pillAura {
                0%,100% { box-shadow: 0 0 0 1px rgba(157,92,255,0.45), 0 6px 22px rgba(157,92,255,0.40); }
                50%     { box-shadow: 0 0 0 1px rgba(255,200,87,0.55), 0 6px 22px rgba(255,200,87,0.45); }
              }
              @keyframes pillCoinPulse {
                0%,100% { box-shadow: 0 4px 14px rgba(255,200,87,0.55), 0 0 0 0 rgba(255,200,87,0.55); }
                70%     { box-shadow: 0 4px 14px rgba(255,200,87,0.55), 0 0 0 10px rgba(255,200,87,0); }
                100%    { box-shadow: 0 4px 14px rgba(255,200,87,0.55), 0 0 0 0 rgba(255,200,87,0); }
              }
              .nav-points-pill {
                transition: transform .18s ease, filter .2s ease;
                animation: pillAura 4s ease-in-out infinite;
              }
              .nav-points-pill:hover  { transform: translateY(-1px) scale(1.05); filter: brightness(1.07); }
              .nav-points-pill:active { transform: scale(0.97); }
              .nav-points-coin       { animation: pillSpin 6s linear infinite, pillFloat 3s ease-in-out infinite; }
              .nav-points-coinwrap   { animation: pillCoinPulse 2.4s ease-out infinite; }
            `}</style>
            {/* Points balance pill — tap to view history. */}
            <div
              onClick={() => navigate('/points-history')}
              title="View points history"
              className="nav-points-pill"
              style={{
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 14px 4px 4px', borderRadius: 999,
                background: 'linear-gradient(135deg,#3F2C7E 0%,#5B3F90 50%,#9D5CFF 100%)',
                color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 0.2,
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <span className="nav-points-coinwrap" style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#FFE9B3,#FFC857 50%,#FF7A45)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#2A1500', fontWeight: 900,
                border: '1.5px solid rgba(255,255,255,0.40)',
              }}>
                <span className="nav-points-coin" role="img" aria-label="points" style={{ fontSize: 15, display: 'inline-block' }}>🪙</span>
              </span>
              <span style={{
                background: 'linear-gradient(135deg,#fff,#FFE9B3)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                textShadow: '0 0 12px rgba(255,200,87,0.30)',
              }} title={`${pointsBalance} pts`}>{formatPoints(pointsBalance)}<span style={{ opacity: 0.85, fontWeight: 700, marginLeft: 3, color: '#fff', WebkitTextFillColor: '#fff' }}>pts</span></span>
            </div>

            <div style={{ position: "relative" }}>
              <button className="btn border-0" style={{ fontWeight: "bold" }} onClick={handleBellClick}>
                <FaRegBell color="#30747F" size={24} />
              </button>

              {/* Show red badge only if there are unread notifications AND user hasn’t clicked yet */}
              {hasUnread && !hasClickedBell && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "10px",
                    height: "10px",
                    backgroundColor: "red",
                    borderRadius: "50%",
                    zIndex: 1,
                  }}
                ></span>
              )}
            </div>
          </div>


        </nav>
      </div>
    </div>
  );
};

export default SidebarApp;







