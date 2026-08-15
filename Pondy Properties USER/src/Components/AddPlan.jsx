

import React, { useState, useEffect } from 'react'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './PricingPlans.css';
import { Button, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentVdo from "../Assets/payment vdo.mp4";
import { FaArrowLeft } from 'react-icons/fa';

export default function AddPricingPlans({ phoneNumber: propPhoneNumber, ppcId: propPpcId, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [cardData, setCardData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState(null);

   const phoneNumber = propPhoneNumber || location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const ppcId = propPpcId || location.state?.ppcId || "";

  useEffect(() => {
    if (phoneNumber) {
      axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
        phoneNumber,
        viewedFile: "Pricing Plans",
        viewTime: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchActivePlans();
  }, []);

   const fetchActivePlans = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/active-plans`);
       const plansWithPpcId = response.data.map(plan => ({
        ...plan,
        ppcId: ppcId,
      }));
      setCardData(plansWithPpcId);
    } catch (err) {
      setMessage({ text: "Failed to load plans", type: "error" });
    }
  };

  const confirmPlanSelection = (card, index) => {
    setSelectedPlan({ card, index });
    setShowPopup(true);
  };



const handleConfirmPlan = async () => {
  if (!selectedPlan) return;
  const { card, index } = selectedPlan;

  const ppcIdNum = Number(card.ppcId);
  if (!phoneNumber || isNaN(ppcIdNum)) {
    setMessage({ text: "Missing or invalid phone number or PPC ID", type: "error" });
    return;
  }

  setLoadingIndex(index);
  setShowPopup(false);

   navigate("/payu-form", {
    state: {
      phoneNumber,
      ppcId: ppcIdNum,
      planName: card.name,
      planId: card._id,
    amount: card.price  
    }
  });
};

  const handleBackNavigation = () => {
    navigate("/mobileviews");
  };


  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="row g-2 w-100">
          <div className="d-flex align-items-center w-100 p-2" style={{ background: "#EFEFEF" }}>
                              <button
                                onClick={handleBackNavigation}
                                className="pe-5"
                                style={{
                                  backgroundColor: '#f0f0f0',
                                  border: 'none',
                                  padding: '10px 20px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <FaArrowLeft style={{ color: '#30747F' }} />
                              </button>
                              <h3 className="m-0" style={{ fontSize: "16px" }}>Upgrade Your Plan</h3>
                            </div>
          <h3 className="m-0 ms-3" style={{ fontSize: "20px" }}>Upgrade Membership</h3>

          <div className="video-container w-100" style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            marginTop: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}>
            <video
              src={paymentVdo}
              controls
              autoPlay
              muted
              loop
              style={{
                width: '100%',
                height: 'auto',
                minHeight: '200px',
                display: 'block',
                objectFit: 'contain'
              }}
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {message && (
            <p className="text-bold mt-2" style={{ color: message.type === "success" ? "green" : "red", textAlign: "center" }}>
              {message.text}
            </p>
          )}

          <div className="text-center mb-3">
            <p className="lead mb-1 pt-3" style={{ fontSize: "16px" }}>Start being a celebrity with our</p>
            <p className="lead" style={{ fontSize: "16px" }}>premium subscription plans</p>
          </div>

          <div className="row justify-content-center">
            {cardData.length === 0 ? (
              <p className="text-center">No active plans available.</p>
            ) : (
              cardData.map((card, index) => {
                const gradients = [
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                ];
                return (
                  <div key={card._id || index} className="col-12 d-flex justify-content-center mb-4 p-0">
                    <div
                      className="card shadow-lg rounded-4 border-0 pricing-card"
                      style={{
                        width: '72%',
                        background: gradients[index % gradients.length],
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: hoverIndex === index
                          ? '0 25px 50px rgba(0, 0, 0, 0.35)'
                          : '0 10px 30px rgba(0, 0, 0, 0.15)',
                        transform: hoverIndex === index ? 'translateY(-12px) scale(1.03)' : 'translateY(0) scale(1)',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoverIndex(index)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      {/* Animated top gradient line */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                        opacity: hoverIndex === index ? 1 : 0.5,
                        transition: 'opacity 0.3s ease'
                      }} />

                      <div className="card-body" style={{
                        background: 'rgba(255, 255, 255, 0.97)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        margin: '12px',
                        position: 'relative',
                        zIndex: 2,
                        padding: '24px'
                      }}>
                        {/* Premium Badge */}
                        {index === 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '-14px',
                            right: '24px',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: '#fff',
                            padding: '8px 18px',
                            borderRadius: '25px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 6px 20px rgba(255, 165, 0, 0.5)',
                            animation: 'floating 3s ease-in-out infinite'
                          }}>
                            ⭐ MOST POPULAR
                          </div>
                        )}

                        {/* Plan Name */}
                        <h4 className="card-title text-start mt-1" style={{
                          color: '#4F4B7E',
                          fontWeight: 'bold',
                          fontSize: '28px',
                          marginBottom: '8px'
                        }}>
                          {card.name}
                        </h4>

                        {/* Service Type */}
                        <p className="text-start" style={{
                          fontSize: "15px",
                          color: '#888',
                          marginBottom: '16px',
                          fontWeight: '500'
                        }}>
                          {card.packageType || 'Premium Service'}
                        </p>

                        {/* Price Section */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          marginBottom: '8px',
                          gap: '8px'
                        }}>
                          <h2 className="text-start m-0" style={{
                            fontSize: '2.5rem',
                            background: 'linear-gradient(135deg, #FF6B6B, #f5576c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold'
                          }}>
                            ₹{card.price}
                          </h2>
                          <span style={{
                            fontSize: '14px',
                            color: '#999',
                            fontWeight: '500',
                            paddingBottom: '8px'
                          }}>
                            per plan
                          </span>
                        </div>

                        {/* Validity Info */}
                        <p className="text-start" style={{
                          fontSize: '14px',
                          color: '#666',
                          marginBottom: '18px',
                          fontWeight: '500',
                          letterSpacing: '0.3px'
                        }}>
                          ✅ Valid for {card.durationDays} Days • {card.numOfCars} Car{card.numOfCars > 1 ? 's' : ''}
                        </p>

                        {/* Featured Ads Section */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(245, 87, 108, 0.08))',
                          padding: '14px',
                          borderRadius: '14px',
                          marginBottom: '20px',
                          border: '1px solid rgba(102, 126, 234, 0.15)',
                          transition: 'all 0.3s ease',
                          transform: hoverIndex === index ? 'scale(1.02)' : 'scale(1)'
                        }}>
                          <h5 className="m-0 text-start" style={{
                            fontSize: '15px',
                            color: '#4F4B7E',
                            fontWeight: '700',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            ✨ Featured Ads
                          </h5>
                          <p className="text-start m-0" style={{
                            color: '#555',
                            fontSize: '14px',
                            fontWeight: '500',
                            lineHeight: '1.5'
                          }}>
                            • {card.featuredAds} Featured Ad{card.featuredAds > 1 ? 's' : ''} Included
                          </p>
                          <p className="text-start m-0 mt-2" style={{
                            fontSize: '14px',
                            color: '#FF6B6B',
                            fontWeight: '700',
                            letterSpacing: '0.5px'
                          }}>
                            🎯 Premium Support Included
                          </p>
                        </div>

                        {/* Call to Action Button */}
                        <div className="d-flex justify-content-center">
                          <button
                            className="pay-button btn pt-3 pb-3 ps-5 pe-5 rounded-pill"
                            style={{
                              background: 'linear-gradient(135deg, #4F4B7E 0%, #764ba2 100%)',
                              color: '#fff',
                              fontSize: "16px",
                              fontWeight: '700',
                              border: 'none',
                              boxShadow: hoverIndex === index && loadingIndex !== index
                                ? '0 15px 35px rgba(79, 75, 126, 0.6)'
                                : '0 8px 20px rgba(79, 75, 126, 0.4)',
                              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              cursor: loadingIndex === index ? 'not-allowed' : 'pointer',
                              opacity: loadingIndex === index ? 0.8 : 1,
                              transform: hoverIndex === index && loadingIndex !== index ? 'scale(1.08)' : 'scale(1)',
                              letterSpacing: '0.5px',
                              minWidth: '200px',
                              width: '100%'
                            }}
                            onClick={() => confirmPlanSelection(card, index)}
                            disabled={loadingIndex === index}
                          >
                            {loadingIndex === index ? '⏳ Processing...' : '🚀 PAY NOW'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

           <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
            <Modal.Body className="text-center" style={{ padding: '30px' }}>
              <h5 style={{ marginBottom: '16px', color: '#2a2a2a', fontWeight: '600' }}>
                Confirm Plan Selection
              </h5>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
                Are you sure you want to select this plan?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button
                  style={{
                    background: "linear-gradient(135deg, #4F4B7E 0%, #764ba2 100%)",
                    fontSize: "14px",
                    border: "none",
                    fontWeight: '600',
                    padding: '8px 24px'
                  }}
                  onClick={handleConfirmPlan}
                >
                  Yes, Confirm
                </Button>
                <Button
                  style={{
                    background: "#E8E8E8",
                    fontSize: "14px",
                    border: "none",
                    color: '#666',
                    fontWeight: '600',
                    padding: '8px 24px'
                  }}
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </Button>
              </div>
            </Modal.Body>
          </Modal>

          {/* CSS Animations */}
          <style>{`
            @keyframes floating {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            
            .pricing-card {
              cursor: pointer;
            }
            
            .pay-button {
              position: relative;
              overflow: hidden;
            }
            
            .pay-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: rgba(255, 255, 255, 0.2);
              transition: left 0.5s ease;
            }
            
            .pay-button:hover::before {
              left: 100%;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
