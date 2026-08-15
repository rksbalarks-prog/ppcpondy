 

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Main from './Main';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import { setActiveBase, baseToPath, baseToCity, syncBaseFromPath, BASES } from '../utils/cityBase';

const MobileView = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  // The active city base is decided by the URL: /chennai => CH, else PY.
  const activeBase = location.pathname.toLowerCase().startsWith('/chennai') ? 'CH' : 'PY';

  // Keep localStorage (read by the axios interceptor) in sync with the URL.
  useEffect(() => {
    syncBaseFromPath(location.pathname);
  }, [location.pathname]);

  // Switch city. A full navigation re-runs app startup so the property feed
  // re-fetches cleanly with the new base (no stale data from the old city).
  const switchCity = (base) => {
    if (base === activeBase) return;
    setActiveBase(base);
    window.location.href = baseToPath(base);
  };

  // Store this so the handler can access it
  const [pendingBack, setPendingBack] = useState(false);
 
  const handlePopState = (e) => {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      e.preventDefault();
      setShowConfirm(true);
      setPendingBack(true);
      window.history.pushState(null, '', window.location.href);
    }
  }; 
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(height);
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
    } else {
      window.addEventListener("resize", updateHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
      } else {
        window.removeEventListener("resize", updateHeight);
      }
    };
  }, []);


  useEffect(() => {
  const queryParams = new URLSearchParams(location.search);
  const urlPhone = queryParams.get('phone');
  const storedFullPhone = localStorage.getItem('phoneNumber');

  const logAppOpen = async (cleanPhone) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/log-app-open`, {
        phoneNumber: cleanPhone,
      });
      console.log("App open logged");
    } catch (err) {
      console.error("Failed to log app open", err);
    }
  };

  if (urlPhone) {
    const cleanPhone = urlPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      setPhoneNumber(cleanPhone);
      localStorage.setItem('phoneNumber', `+91${cleanPhone}`);
      logAppOpen(cleanPhone); // ✅ log app open
    } else {
      navigate('/login');
    }
  } else if (storedFullPhone) {
    const phoneDigits = storedFullPhone.replace(/\D/g, '').slice(-10);
    if (phoneDigits.length === 10) {
      setPhoneNumber(phoneDigits);
      logAppOpen(phoneDigits); // ✅ log app open
    } else {
      navigate('/login');
    }
  } else {
    navigate('/login');
  }

  // Push state for Android back button handling
  window.history.pushState(null, '', window.location.href);
  window.addEventListener('popstate', handlePopState);
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}, [navigate, location]);


  const onConfirmLeave = () => {
    setShowConfirm(false);
    if (pendingBack) {
      window.removeEventListener('popstate', handlePopState);
      window.history.back();
    }
  };

  const onCancelLeave = () => {
    setShowConfirm(false);
    setPendingBack(false);
    window.history.pushState(null, '', window.location.href);
  };

  if (!phoneNumber) return null;

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" 
         style={{ Height: "100vh", background: '#E5E5E5' }}>
      <div style={{ 
        maxWidth: '470px', 
        width: "100%", 
        background: 'white', 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden",
        height: "100vh"
      }}>
        {/* City switcher — lets the user move between Pondicherry and Chennai */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            background: '#4F4B7E',
          }}
        >
          {BASES.map((base) => {
            const isActive = base === activeBase;
            return (
              <button
                key={base}
                type="button"
                onClick={() => switchCity(base)}
                aria-pressed={isActive}
                style={{
                  padding: '4px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isActive ? 'default' : 'pointer',
                  border: '1px solid #ffffff',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#4F4B7E' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
              >
                📍 {baseToCity(base)}
              </button>
            );
          })}
        </div>
        <Main phoneNumber={phoneNumber} viewportHeight={viewportHeight}/>
      </div>
         {showConfirm && (
          <div
          className="popup-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1509,
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <div
            className="dropdown-popup"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              width: '100%',
              maxWidth: '300px',
              padding: '10px',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',
              borderRadius: '18px',
              animation: 'popupOpen 0.3s ease-in-out',
            }}
          >
            <p>Are you sure you want to exit the app?</p>
            <button onClick={onConfirmLeave} style={{background:"blue", color:"#fff"}}>Yes</button>
            <button className='ms-2' onClick={onCancelLeave} style={{background:"white", color:"blue",  boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',}}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileView;





