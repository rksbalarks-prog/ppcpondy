
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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { RiEdit2Fill } from "react-icons/ri";
import PrivacyPolicyWeb from './PrivacyPolicyWeb';
import AboutMobile from './AboutMobile';
import { FaArrowLeft } from 'react-icons/fa';

const WebLogin = ({ onLogin }) => {
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

  const storedPhoneNumber = useSelector(state => state.phoneNumber);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const countryCodes = [
    { code: '+1', country: 'USA', flag: 'US' },
    { code: '+44', country: 'UK', flag: 'GB' },
    { code: '+91', country: 'IN', flag: 'IN' },
    { code: '+61', country: 'Australia', flag: 'AU' },
    { code: '+81', country: 'Japan', flag: 'JP' },
  ];

  useEffect(() => {
    const checkLoggedIn = async () => {
      const storedPhone = localStorage.getItem('phoneNumber');
      
      if (storedPhone) {
        dispatch(setPhoneNumber(storedPhone));
        navigate('/mobileviews', { state: { phoneNumber: phoneNumber } });
      }
    };

    checkLoggedIn();
  }, [dispatch, navigate]);

  


  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    setIsDisabled(!checked);
  };

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

  // OTP timer
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

    // 1. Check if user is directly verified
    const directCheck = await axios.get(`${process.env.REACT_APP_API_URL}/user/direct-verified-users`);
    const matchedUser = directCheck.data.users.find(
      (u) => u.phone === plainPhoneDigits && u.directVerified
    );

    if (matchedUser) {
      toast.success('User is directly verified. Logging in...', {
        position: 'top-center',
        autoClose: 5000,
      });

      localStorage.setItem('phoneNumber', fullPhoneNumber);
      dispatch(setPhoneNumber(fullPhoneNumber));
      navigate('/mobileviews');
      return; // Skip OTP
    }

    // 2. If not directly verified, send OTP
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-otp`, {
      phoneNumber: fullPhoneNumber,
      loginMode: loginMode,
      countryCode: countryCode
    });

    const generatedOtp = response.data.result?.otp;

    if (generatedOtp) {
      toast.success('OTP Sent Successfully!', {
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



  const handleVerifyOtp = async (e) => {
  e.preventDefault();

  if (!otp) {
    toast.error('Please enter the OTP.');
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-otp`, {
      phoneNumber: `${countryCode}${phoneNumber}`,
      otp: otp,
    });

    if (response.status === 200) {
      toast.success('OTP verified successfully!');
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      localStorage.setItem('phoneNumber', fullPhoneNumber);
      dispatch(setPhoneNumber(fullPhoneNumber));
navigate('/mobileviews');

      // navigate('/mobileviews');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'OTP verification failed!';
    toast.error(errorMessage);
  }
};


  
  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-otp`, {
        phoneNumber: `${countryCode}${phoneNumber}`,
        loginMode: loginMode,
        countryCode: countryCode
      });

      const newOtp = response.data.result?.otp;

      if (newOtp) {
        toast.success(`OTP resent!`, {
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

  if (storedPhoneNumber) {
    return null;
  }

  return (
    <div
      style={{
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Left: Form Section */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '30px 25px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {!isOtpSent ? (
            <>
              <h2 style={{ color: '#001F3F', fontWeight: '700', marginBottom: '10px' }}>
                Hello!
              </h2>
              <p style={{ color: '#666', marginBottom: '35px', fontSize: '16px' }}>
                Sign in to your account
              </p>

              <Form onSubmit={handleSendOtp}>
                <Form.Group controlId="phoneInput" className="mb-4">
                  <InputGroup>
                    <InputGroup.Text
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid #2563eb',
                      }}
                    >
                      <Flag
                        code={selectedCountry}
                        style={{ width: '20px', marginRight: '8px' }}
                      />
                    </InputGroup.Text>
                    <Form.Select
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      style={{
                        width: 'auto',
                        maxWidth: '70px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid #2563eb',
                        color: '#666',
                        fontWeight: '600',
                      }}
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.flag}>
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
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid #2563eb',
                        color: '#666',
                        fontWeight: '600',
                        outline: 'none',
                      }}
                    />
                  </InputGroup>
                </Form.Group>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px',
                    fontSize: '14px',
                  }}
                >
                  <label style={{ marginBottom: '0', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginRight: '8px' }} />
                    <span style={{ color: '#666' }}>Remember me</span>
                  </label>
                  <a
                    href="#!"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: '600',
                    }}
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                  }}
                >
                  LOGIN
                </Button>

                <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                  Don't have an account?{' '}
                  <a
                    href="#!"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: '700',
                    }}
                  >
                    Create
                  </a>
                </p>
              </Form>
            </>
          ) : (
            <>
              <h3
                style={{
                  color: '#001F3F',
                  fontWeight: '700',
                  marginBottom: '30px',
                  textAlign: 'center',
                }}
              >
                Verify OTP
              </h3>

              <p
                style={{
                  textAlign: 'center',
                  color: '#666',
                  marginBottom: '20px',
                  fontSize: '14px',
                }}
              >
                Login Number: {phoneNumber}{' '}
                <span
                  type="button"
                  onClick={handleEdit}
                  style={{ cursor: 'pointer', marginLeft: '10px' }}
                >
                  <RiEdit2Fill
                    color="#2563eb"
                    size={20}
                    style={{ fontWeight: 'bold' }}
                  />
                </span>
              </p>

              <Form onSubmit={handleVerifyOtp}>
                <Form.Group className="mb-4" controlId="otp">
                  <Form.Control
                    type="number"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isDisabled}
                    required
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: '2px solid #2563eb',
                      color: '#666',
                      fontWeight: '600',
                      outline: 'none',
                      padding: '10px 0',
                    }}
                  />
                </Form.Group>

                {canResendOtp && (
                  <Button
                    onClick={handleResendOtp}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'transparent',
                      border: '2px solid #2563eb',
                      color: '#2563eb',
                      borderRadius: '8px',
                      fontWeight: '600',
                      marginBottom: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    RESEND OTP
                  </Button>
                )}
                {otpTimer > 0 && !canResendOtp && (
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#2563eb',
                      marginBottom: '20px',
                      fontSize: '13px',
                    }}
                  >
                    Resend OTP in {otpTimer} seconds
                  </p>
                )}

                <Button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                  }}
                >
                  VERIFY OTP
                </Button>

                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <label style={{ marginRight: '8px' }}>
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
                      fontSize: '13px',
                      color: '#666',
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
                        overflow: 'hidden',
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
            </>
          )}

          <ToastContainer />
        </div>

        {/* Right: Welcome Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 25px',
            color: 'white',
            minHeight: 'auto',
          }}
        >
          <style>
            {`
              @keyframes floatingAnimation {
                0%, 100% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-15px);
                }
              }
              .floating-icon {
                animation: floatingAnimation 2s ease-in-out infinite;
              }
            `}
          </style>
          <div
            className="floating-icon"
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '30px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <circle cx="7" cy="12" r="4" />
              <path d="M11 12h8M18 9l3-3" />
              <path d="M21 6l0 4l-4 0" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            Welcome Back!
          </h2>

          <p
            style={{
              fontSize: '16px',
              textAlign: 'center',
              lineHeight: '1.6',
              opacity: '0.9',
            }}
          >
            Find Your Perfect Home in Pondy.. No Brokers. No Stress. Just Easy
            Rentals.
          </p>
        </div>
      </div>
    </div>
  );
};


export default WebLogin;