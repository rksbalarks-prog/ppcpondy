
 


import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setPhoneNumber } from '../red/userSlice';
import { Helmet } from 'react-helmet';
import Flag from 'react-world-flags';
import logo from '../Assets/ppc logo.jpg';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { RiEdit2Fill } from "react-icons/ri";
import PrivacyPolicyWeb from './PrivacyPolicyWeb';
import { FaArrowLeft, FaMapMarkerAlt, FaHome, FaKey, FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { setActiveBase, getActiveBase } from '../utils/cityBase';
import { getRentUrl } from '../utils/appLinks';

const Login = ({ onLogin }) => {
  // City-locked login routes: /login/chennai forces Chennai (CH),
  // /login/pondicherry forces Pondicherry (PY). On these routes the city
  // picker is hidden and the base is pinned to that city.
  const { city: cityParam } = useParams();
  const forcedCity =
    cityParam && ['chennai', 'pondicherry'].includes(cityParam.toLowerCase())
      ? cityParam.toLowerCase()
      : null;

  const [phoneNumber, setPhoneNumberState] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [isPhoneNumberEntered, setIsPhoneNumberEntered] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const phoneInputRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [loginMode, setLoginMode] = useState('web');
  const [fcmToken, setFcmToken] = useState('');
  // Selected city decides which city's properties load after login. We drive the
  // app's existing city-base system (PY = Pondicherry, CH = Chennai): the choice
  // is written to activeBase and the user is routed to the matching city path, so
  // the axios interceptor tags every backend call with ?base=PY|CH.
  const [selectedCity, setSelectedCity] = useState(
    forcedCity || (getActiveBase() === 'CH' ? 'chennai' : 'pondicherry')
  );

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setActiveBase(city === 'chennai' ? 'CH' : 'PY');
    // Re-arm the type step whenever the city changes so the user re-confirms.
    setSelectedType(null);
  };

  // After a city, the user picks an app type. 'property' = stay in THIS app
  // (buy/sell). 'rent' = leave to the separate Rent app for the chosen city.
  const [selectedType, setSelectedType] = useState(null);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    if (type === 'rent') {
      const url = getRentUrl(selectedCity);
      if (url) {
        window.location.href = url; // hand off to the Rent app
      } else {
        toast.info('Rent app is coming soon!', { position: 'top-center', autoClose: 4000 });
      }
    }
  };

  // City-scoped route RouterPage renders as MobileViews with the right base.
  const getCityPath = () => (selectedCity === 'chennai' ? '/chennai' : '/pondicherry');

  const storedPhoneNumber = useSelector(state => state.phoneNumber);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // On a city-locked route (/login/chennai etc.), pin the city + base so every
  // API call is city-scoped even before the user finishes logging in.
  useEffect(() => {
    if (forcedCity) {
      setSelectedCity(forcedCity);
      setActiveBase(forcedCity === 'chennai' ? 'CH' : 'PY');
    }
  }, [forcedCity]);

  // Request notification permission and get FCM token
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // Check if browser supports service workers and push notifications
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
              // Register service worker
              const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
              console.log('Service Worker registered');
              
              // Get FCM token using the service worker
              const token = await getFCMToken();
              if (token) {
                setFcmToken(token);
                console.log('FCM Token obtained:', token);
              }
            } catch (error) {
              console.error('Error with service worker registration:', error);
            }
          }
        } else {
          console.log('Notification permission not granted.');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    requestNotificationPermission();
  }, []);

  // Function to get FCM token
  const getFCMToken = async () => {
    try {
      // This would typically be handled by your service worker
      // For now, we'll generate a simple mock token
      const mockToken = `fcm-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return mockToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  // Register FCM token with backend
  const registerFCMToken = async (phoneNumber, token) => {
    try {
      if (!token) return;
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/register-token`, {
        phoneNumber: phoneNumber,
        fcmToken: token
      });
      
      if (response.data.success) {
        console.log('FCM token registered successfully');
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  };

  // Send push notification
  const sendPushNotification = async (phoneNumber, message, type = 'welcome') => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-push-notification`, {
        userPhoneNumber: phoneNumber,
        message: message,
        type: type
      });
      
      if (response.data.success) {
        console.log('Push notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  // const countryCodes = [
  //   { code: '+1', country: 'USA', flag: 'US' },
  //   { code: '+44', country: 'UK', flag: 'GB' },
  //   { code: '+91', country: 'IN', flag: 'IN' },
  //   { code: '+61', country: 'Australia', flag: 'AU' },
  //   { code: '+81', country: 'Japan', flag: 'JP' },
  // ];
const countryCodes = [
  { code: '+93', country: 'Afghanistan', flag: 'AF' },
  { code: '+213', country: 'Algeria', flag: 'DZ' },
  { code: '+54', country: 'Argentina', flag: 'AR' },
  { code: '+61', country: 'Australia', flag: 'AU' },
  { code: '+43', country: 'Austria', flag: 'AT' },
  { code: '+994', country: 'Azerbaijan', flag: 'AZ' },

  { code: '+973', country: 'Bahrain', flag: 'BH' },
  { code: '+880', country: 'Bangladesh', flag: 'BD' },
  { code: '+32', country: 'Belgium', flag: 'BE' },
  { code: '+975', country: 'Bhutan', flag: 'BT' },
  { code: '+55', country: 'Brazil', flag: 'BR' },

  { code: '+1', country: 'Canada', flag: 'CA' },
  { code: '+56', country: 'Chile', flag: 'CL' },
  { code: '+86', country: 'China', flag: 'CN' },
  { code: '+57', country: 'Colombia', flag: 'CO' },
  { code: '+53', country: 'Cuba', flag: 'CU' },

  { code: '+45', country: 'Denmark', flag: 'DK' },

  { code: '+20', country: 'Egypt', flag: 'EG' },

  { code: '+33', country: 'France', flag: 'FR' },

  { code: '+995', country: 'Georgia', flag: 'GE' },
  { code: '+49', country: 'Germany', flag: 'DE' },
  { code: '+30', country: 'Greece', flag: 'GR' },

  { code: '+36', country: 'Hungary', flag: 'HU' },

  { code: '+91', country: 'India', flag: 'IN' },
  { code: '+62', country: 'Indonesia', flag: 'ID' },
  { code: '+98', country: 'Iran', flag: 'IR' },
  { code: '+98', country: 'Iran', flag: 'IR' },
  { code: '+972', country: 'Israel', flag: 'IL' },
  { code: '+39', country: 'Italy', flag: 'IT' },

  { code: '+81', country: 'Japan', flag: 'JP' },

  { code: '+7', country: 'Kazakhstan', flag: 'KZ' },
  { code: '+254', country: 'Kenya', flag: 'KE' },
  { code: '+996', country: 'Kyrgyzstan', flag: 'KG' },

  { code: '+218', country: 'Libya', flag: 'LY' },

  { code: '+60', country: 'Malaysia', flag: 'MY' },
  { code: '+52', country: 'Mexico', flag: 'MX' },
  { code: '+976', country: 'Mongolia', flag: 'MN' },
  { code: '+212', country: 'Morocco', flag: 'MA' },
  { code: '+95', country: 'Myanmar', flag: 'MM' },

  { code: '+977', country: 'Nepal', flag: 'NP' },
  { code: '+31', country: 'Netherlands', flag: 'NL' },
  { code: '+64', country: 'New Zealand', flag: 'NZ' },
  { code: '+234', country: 'Nigeria', flag: 'NG' },
  { code: '+47', country: 'Norway', flag: 'NO' },

  { code: '+968', country: 'Oman', flag: 'OM' },

  { code: '+92', country: 'Pakistan', flag: 'PK' },
  { code: '+970', country: 'Palestine', flag: 'PS' },
  { code: '+51', country: 'Peru', flag: 'PE' },
  { code: '+63', country: 'Philippines', flag: 'PH' },
  { code: '+48', country: 'Poland', flag: 'PL' },

  { code: '+974', country: 'Qatar', flag: 'QA' },

  { code: '+40', country: 'Romania', flag: 'RO' },
  { code: '+7', country: 'Russia', flag: 'RU' },

  { code: '+966', country: 'Saudi Arabia', flag: 'SA' },
  { code: '+65', country: 'Singapore', flag: 'SG' },
  { code: '+27', country: 'South Africa', flag: 'ZA' },
  { code: '+82', country: 'South Korea', flag: 'KR' },
  { code: '+34', country: 'Spain', flag: 'ES' },
  { code: '+94', country: 'Sri Lanka', flag: 'LK' },
  { code: '+94', country: 'Sri Lanka', flag: 'LK' },
  { code: '+46', country: 'Sweden', flag: 'SE' },
  { code: '+41', country: 'Switzerland', flag: 'CH' },

  { code: '+255', country: 'Tanzania', flag: 'TZ' },
  { code: '+66', country: 'Thailand', flag: 'TH' },
  { code: '+216', country: 'Tunisia', flag: 'TN' },
  { code: '+90', country: 'Turkey', flag: 'TR' },
  { code: '+993', country: 'Turkmenistan', flag: 'TM' },

  { code: '+971', country: 'United Arab Emirates', flag: 'AE' },
  { code: '+44', country: 'United Kingdom', flag: 'GB' },
  { code: '+1', country: 'United States', flag: 'US' },
  { code: '+998', country: 'Uzbekistan', flag: 'UZ' },

  { code: '+58', country: 'Venezuela', flag: 'VE' },
  { code: '+84', country: 'Vietnam', flag: 'VN' },
];

  const handleCountryChange = (e) => {
    const selected = e.target.value;
    const country = countryCodes.find(c => c.flag === selected);
    setCountryCode(country.code);
    setSelectedCountry(selected);
  };

  const handlePhoneNumberChange = (e) => {
    const phone = e.target.value;
    setPhoneNumberState(phone);
    setIsPhoneNumberEntered(phone.length > 0);
  };

  // OTP timer logic
  useEffect(() => {
    if (isOtpSent && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
  }, [isOtpSent, otpTimer]);

  // Send OTP via WhatsApp
  const sendWhatsAppOtp = async (phoneNumber, otp) => {
    try {
      // Format phone number for WhatsApp (remove non-digits and ensure country code)
      const mobileNumber = String(phoneNumber).replace(/\D/g, ""); // Remove all non-numeric characters
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi there, 👋

Your OTP for Pondy property login is: ${otp}

⏱️ This OTP expires in 30 minutes.
🔒 Never share this OTP with anyone.

If you didn't request this OTP, please ignore this message.

– Team Pondy Property`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ WhatsApp OTP sent successfully to", whatsappNumber);
        return true;
      }
    } catch (whatsAppError) {
      console.log("⚠️ WhatsApp OTP delivery failed (non-blocking):", whatsAppError.message);
      // Non-blocking error - continue with regular OTP flow
      return false;
    }
  };

  // Send failed OTP attempt notification via WhatsApp
  const sendFailedOtpNotification = async (phoneNumber) => {
    try {
      // Format phone number for WhatsApp (remove non-digits and ensure country code)
      const mobileNumber = String(phoneNumber).replace(/\D/g, ""); // Remove all non-numeric characters
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi Owner, 🔔

⚠️ Login Attempt Failed

We noticed an incorrect OTP was entered during login.

If this wasn't you, please secure your account immediately.

For assistance, contact our support team:
📞 +91-8300622013
📧 info.rentpondy@gmail.com

Stay secure!
– Team Pondy property`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ Failed OTP notification sent successfully to", whatsappNumber);
        return true;
      }
    } catch (whatsAppError) {
      console.log("⚠️ Failed OTP notification delivery failed (non-blocking):", whatsAppError.message);
      // Non-blocking error - continue
      return false;
    }
  };

  // Send successful login notification via WhatsApp
  const sendSuccessLoginNotification = async (phoneNumber) => {
    try {
      // Format phone number for WhatsApp (remove non-digits and ensure country code)
      const mobileNumber = String(phoneNumber).replace(/\D/g, ""); // Remove all non-numeric characters
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi Owner, 👋
Welcome to Pondy Property! 🏡

✅ Login Successful

You can now add, manage, and promote your properties easily.
We're happy to have you with us!

– Team Pondy Property`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ Success login notification sent to", whatsappNumber);
        return true;
      }
    } catch (whatsAppError) {
      console.log("⚠️ Success login notification delivery failed (non-blocking):", whatsAppError.message);
      // Non-blocking error - continue
      return false;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast.error('Please enter a valid phone number.', {
        position: 'top-center',
        autoClose: 5000,
      });
      return;
    }

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const plainPhoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);

      // 1. Admin "direct verify" bypass — if an admin verified this number in
      // the Direct Login panel, skip OTP and log in straight away. Wrapped in
      // its own try/catch so a failed check falls back to the normal OTP flow.
      try {
        const directCheck = await axios.get(`${process.env.REACT_APP_API_URL}/user/direct-verified-users`);
        const matchedUser = directCheck.data?.users?.find(
          (u) => u.phone === plainPhoneDigits && u.directVerified
        );

        if (matchedUser) {
          toast.success('User is directly verified. Logging in...', {
            position: 'top-center',
            autoClose: 5000,
          });
          localStorage.setItem('phoneNumber', fullPhoneNumber);
          localStorage.setItem('freshLogin', 'true');
          dispatch(setPhoneNumber(fullPhoneNumber));
          navigate(getCityPath(), { state: { initialContent: 'bottomHome', freshLogin: true } });
          return; // Skip OTP
        }
      } catch (directErr) {
        console.log('Direct-verify check failed, falling back to OTP:', directErr.message);
      }

      // Register FCM token before sending OTP
      if (fcmToken) {
        await registerFCMToken(fullPhoneNumber, fcmToken);
      }

      // 2. Not directly verified — send OTP
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-otp`, {
        phoneNumber: fullPhoneNumber,
        loginMode: loginMode,
        countryCode: countryCode,
        fcmToken: fcmToken // Send FCM token with OTP request
      });

      const generatedOtp = response.data.result?.otp;

      if (generatedOtp) {
        // Send OTP via WhatsApp (non-blocking)
        await sendWhatsAppOtp(phoneNumber, generatedOtp);

        toast.success('OTP Sent Successfully! Check your WhatsApp and SMS.', {
          position: 'top-center',
          autoClose: 20000,
        });

        setMockOtp(generatedOtp);
        setIsOtpSent(true);
        setOtpTimer(30);
        setCanResendOtp(false);
        setOtp('');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Something went wrong!';
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    setIsDisabled(!checked);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter the OTP.');
      return;
    }

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Verify OTP
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-otp`, {
        phoneNumber: fullPhoneNumber,
        otp: otp,
        fcmToken: fcmToken // Send FCM token with verification request
      });

      if (response.status === 200) {
        toast.success('OTP verified successfully!');
        
        // Send welcome notification after successful verification
        try {
          await sendPushNotification(
            fullPhoneNumber, 
            'Welcome to PPC Pondy! Your account has been successfully verified.', 
            'welcome'
          );
        } catch (notificationError) {
          console.error('Error sending welcome notification:', notificationError);
          // Continue even if notification fails
        }

        // Send successful login notification via WhatsApp (non-blocking)
        await sendSuccessLoginNotification(phoneNumber);
        
        // Store phone number and navigate
        localStorage.setItem('phoneNumber', fullPhoneNumber);
        localStorage.setItem('freshLogin', 'true'); // Set flag for role selection popup
        dispatch(setPhoneNumber(fullPhoneNumber));
        navigate(getCityPath(), { state: { initialContent: 'bottomHome', freshLogin: true } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed!';
      toast.error(errorMessage);
      
      // Send failed OTP notification via WhatsApp (non-blocking)
      await sendFailedOtpNotification(phoneNumber);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Register FCM token again if needed
      if (fcmToken) {
        await registerFCMToken(fullPhoneNumber, fcmToken);
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-otp`, {
        phoneNumber: fullPhoneNumber,
        loginMode: loginMode,
        countryCode: countryCode,
        fcmToken: fcmToken // Include FCM token when resending OTP
      });

      const newOtp = response.data.result?.otp;

      if (newOtp) {
        // Send OTP via WhatsApp (non-blocking)
        await sendWhatsAppOtp(phoneNumber, newOtp);

        toast.success(`OTP resent! Check your WhatsApp and SMS.`, {
          position: 'top-center',
          autoClose: 20000,
        });

        setMockOtp(newOtp);
        setOtpTimer(30);
        setCanResendOtp(false);
        setOtp('');
      }
    } catch (error) {
      toast.error('Failed to resend OTP.');
    }
  };

  const handleEdit = () => {
    setIsOtpSent(false);
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  if (storedPhoneNumber) return null;

  return (
    <>
      <style>{`
        .custom-background::placeholder {
          color: white;
        }
      `}</style>
      <Container fluid className="p-0 d-flex align-items-center justify-content-center">
        <Helmet>
          <title>Login | Property & Rentals</title>
        </Helmet>
        <Row className="g-0">
          <div className="d-flex flex-column justify-content-between align-items-center"
            style={{
              maxWidth: "470px",
              minWidth: "400px",
              width: "100%",
              height: "100vh",
              backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcuV4KOIIk3EuvX9hVPSTszzfiPqalO5Oipbfm5wXCPVFgtWiFpMEiO3K2GpjuV87G61Y&usqp=CAU')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              color: "white",
            }}>
            <div className="d-flex flex-column justify-content-between align-items-center p-2"
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "470px",
                minWidth: "400px",
                backgroundColor: "rgba(49, 49, 49, 0.5)",
                backdropFilter: "blur(3px)",
              }}>

              <div>
                <h1 className="welcome-title text-white mt-5">Welcome Back</h1>
                <p className="subtitle text-white">Login to continue</p>
              </div>

              <div className='d-flex flex-column justify-content-between align-items-center'>
                <img src={logo} alt="Logo" className="login-logo rounded-3" height={40} />
                <p className='m-0'>Property &amp; Rentals</p>
                <p className="description text-center mt-2 mb-5">
                  Buy, sell &amp; rent in{' '}
                  {forcedCity === 'chennai'
                    ? 'Chennai'
                    : forcedCity === 'pondicherry'
                      ? 'Pondicherry'
                      : 'Pondicherry & Chennai'}
                </p>

                {!isOtpSent ? (
                  <Form onSubmit={handleSendOtp}>
                    {/* ───────── STEP 1 · Choose city ─────────
                        Hidden on the city-locked routes (/login/chennai,
                        /login/pondicherry): the city is already fixed by the
                        URL, so there's nothing to choose. */}
                    {!forcedCity && (
                      <div className="mb-4" style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                        <p className="d-flex align-items-center gap-2 mb-2"
                           style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                            background: 'orangered', color: '#fff',
                          }}>1</span>
                          Choose your city
                          {selectedCity && <FaCheckCircle color="#39d98a" style={{ marginLeft: 'auto' }} />}
                        </p>
                        <div className="d-flex gap-2">
                          {[
                            { key: 'pondicherry', label: 'Pondicherry' },
                            { key: 'chennai', label: 'Chennai' },
                          ].map((city) => {
                            const active = selectedCity === city.key;
                            return (
                              <button
                                key={city.key}
                                type="button"
                                onClick={() => handleCitySelect(city.key)}
                                className="flex-fill d-flex align-items-center justify-content-center gap-2"
                                style={{
                                  padding: '10px 6px',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  color: '#fff',
                                  border: active ? '2px solid orangered' : '1.5px solid rgba(255,255,255,0.45)',
                                  background: active ? 'orangered' : 'rgba(255,255,255,0.08)',
                                  boxShadow: active ? '0 4px 14px rgba(255,69,0,0.45)' : 'none',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <FaMapMarkerAlt size={14} /> {city.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ───────── STEP 2 · Choose what you need ─────────
                        "Property" stays in THIS app; "Rent" redirects to the
                        Rent app. Dimmed/disabled until a city is picked. */}
                    <div className="mb-3"
                         style={{
                           width: '100%', maxWidth: '320px', margin: '0 auto',
                           opacity: selectedCity ? 1 : 0.45,
                           pointerEvents: selectedCity ? 'auto' : 'none',
                           transition: 'opacity 0.25s ease',
                         }}>
                      <p className="d-flex align-items-center gap-2 mb-2"
                         style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                          background: 'orangered', color: '#fff',
                        }}>{forcedCity ? '1' : '2'}</span>
                        What do you need?
                      </p>
                      <div className="d-flex gap-2">
                        {[
                          {
                            key: 'property',
                            title: selectedCity === 'chennai' ? 'Chennai Property' : 'Pondy Property',
                            sub: 'Buy & Sell',
                            icon: <FaHome size={20} />,
                          },
                          {
                            key: 'rent',
                            title: selectedCity === 'chennai' ? 'Rent Chennai' : 'Rent Pondy',
                            sub: 'Rentals',
                            icon: <FaKey size={18} />,
                            external: true,
                          },
                        ].map((t) => {
                          const active = selectedType === t.key;
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => handleTypeSelect(t.key)}
                              className="flex-fill d-flex flex-column align-items-center justify-content-center"
                              style={{
                                position: 'relative',
                                padding: '14px 6px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                color: '#fff',
                                border: active ? '2px solid orangered' : '1.5px solid rgba(255,255,255,0.45)',
                                background: active ? 'orangered' : 'rgba(255,255,255,0.08)',
                                boxShadow: active ? '0 4px 14px rgba(255,69,0,0.45)' : 'none',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {t.external && (
                                <FaExternalLinkAlt
                                  size={10}
                                  style={{ position: 'absolute', top: 8, right: 8, opacity: 0.8 }}
                                />
                              )}
                              <span className="mb-1">{t.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.1, textAlign: 'center' }}>
                                {t.title}
                              </span>
                              <span style={{ fontSize: '10px', opacity: 0.85, marginTop: 2 }}>{t.sub}</span>
                            </button>
                          );
                        })}
                      </div>
                      {!selectedType && selectedCity && (
                        <p className="text-center mt-2 mb-0" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                          Pick one to continue
                        </p>
                      )}
                    </div>

                    {/* Phone entry only appears once "Property" is chosen. */}
                    {selectedType === 'property' && (
                      <>
                    <Form.Group className="mb-3" controlId="countryCode">
                      <InputGroup>
                        <InputGroup.Text className="border-0" style={{ backgroundColor: "transparent", }}>
                          <Flag code={selectedCountry} style={{ width: '20px', marginRight: '8px' }} />
                        </InputGroup.Text>
                        <Form.Select
                          value={selectedCountry}
                          onChange={handleCountryChange}
                          aria-label="Select Country"
                          className="custom-background small-input fw-normal "
                          style={{
                            width: 'auto', maxWidth: '70px',
                            backgroundColor: "transparent",
                            outline: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottom: "1px solid white",
                            background: "transparent",
                            color: "white",
                            fontWeight: "bold",
                            borderTop: "none",
                            cursor: "pointer",
                            padding: "5px 5px"
                          }}
                          onFocus={(e) =>
                            Object.assign(e.target.style, {
                              outline: "none",
                              boxShadow: "none",
                              background: "none",
                              color: "white",
                            })
                          }
                        >
                          {countryCodes.map((country) => (
                            <option className="text-dark" key={country.code} value={country.flag}>
                              ({country.country}) {country.code}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control
                          type="number"
                          placeholder="Enter Mobile No"
                          value={phoneNumber}
                          onChange={handlePhoneNumberChange}
                          required
                          ref={phoneInputRef}
                          className="custom-background small-input fw-normal rounded-0"
                          style={{
                            width: 'auto', maxWidth: '140px',
                            backgroundColor: "transparent",
                            outline: "none",
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottom: "1px solid white",
                            background: "transparent",
                            color: "white",
                            fontWeight: "bold",
                            borderTop: "none",
                            cursor: "pointer",
                            appearance: 'textfield',
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none'
                          }}
                          onFocus={(e) =>
                            Object.assign(e.target.style, {
                              outline: "none",
                              boxShadow: "none",
                              background: "none",
                              color: "white",
                            })
                          }
                        />
                      </InputGroup>
                    </Form.Group>
                    <style>
                      {`
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                          -webkit-appearance: none;
                          margin: 0;
                        }
                      `}
                    </style>
                    <div className="d-flex justify-content-center">
                      <Button type="submit" style={{ backgroundColor: "orangered", border: "2px solid orangered" }} className="btn w-50 btn-small mx-2">
                        LOGIN
                      </Button>
                    </div>
                      </>
                    )}
                  </Form>
                ) : (
                  <Form onSubmit={handleVerifyOtp}>
                    <p> Login Number: {phoneNumber}   <span
                      type="button"
                      onClick={handleEdit}
                    >
                      <RiEdit2Fill color="#00FF00" size={28} style={{ fontWeight: "bold" }} />
                      Edit
                    </span></p>

                    <Form.Group className="mb-3" controlId="otp">
                      <Form.Control
                        type="number"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isDisabled}
                        required
                        className="custom-background small-input fw-normal  rounded-0"
                        style={{
                          width: '100%',
                          backgroundColor: "transparent",
                          outline: "none",
                          borderLeft: "none",
                          borderRight: "none",
                          borderBottom: "1px solid #fff",
                          background: "transparent",
                          color: "white",
                          fontWeight: "bold",
                          borderTop: "none",
                          cursor: "pointer",
                          appearance: 'textfield',
                          MozAppearance: 'textfield',
                          WebkitAppearance: 'none'
                        }}
                        onFocus={(e) =>
                          Object.assign(e.target.style, {
                            outline: "none",
                            boxShadow: "none",
                            background: "none",
                            color: "white",
                          })
                        }
                      />
                    </Form.Group>
                    <style>
                      {`
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                          -webkit-appearance: none;
                          margin: 0;
                        }
                      `}
                    </style>

                    {canResendOtp && (
                      <div className="d-flex justify-content-center">
                        <Button style={{ backgroundColor: "white", border: "1px solid orangered", color: "orangered" }} onClick={handleResendOtp} className="w-50 mt-2">
                          RESEND OTP
                        </Button>
                      </div>
                    )}
                    {otpTimer > 0 && !canResendOtp && (
                      <p className="text-center mt-2">Resend OTP in {otpTimer} seconds</p>
                    )}
                    <div className="d-flex justify-content-center">
                      <Button type="submit" style={{ backgroundColor: "orangered", border: "2px solid orangered" }} className="btn-small w-50">
                        VERIFY OTP
                      </Button>
                    </div>
                    <div>
                      <label>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleCheckboxChange}
                        />
                      </label>
                      <span
                        onClick={() => setShowPopup(true)}
                        style={{
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        i agree with terms & conditions Privacy Policy
                      </span>

                      {showPopup && (
                        <div
                          style={{
                            position: 'fixed',
                            top: '0',
                            left: '0',
                            height: '100vh',
                            backgroundColor: '#fff',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              maxHeight: '100%',
                              overflowY: 'auto',
                              width: '100%',
                              padding: '20px',
                              borderRadius: '10px',
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                              minWidth: '300px',
                              textAlign: 'center',
                            }}
                          >
                            <PrivacyPolicyWeb />
                            <button
                              onClick={() => setShowPopup(false)}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                padding: '6px 12px',
                                backgroundColor: '#EFEFEF',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <FaArrowLeft /> <span className="m-0 ms-3">Privacy Policy</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Form>
                )}
              </div>

              <div className='d-flex flex-column align-items-center'>
                <p className="m-0">
                  Buy, Sell &amp; Rent <span style={{ color: "rgb(22, 198, 22)" }} className="highlight fw-bold ms-2">
                    Property &amp; Rentals
                  </span>
                </p>
                <span style={{ borderBottom: "2px solid orangered", width: "40%", marginTop: "15px" }}></span>

                <ToastContainer />
              </div>
            </div>
          </div>
        </Row>
      </Container>
    </>
  );
};

export default Login;