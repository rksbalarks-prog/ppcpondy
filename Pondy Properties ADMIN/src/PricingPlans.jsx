
import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import 'bootstrap/dist/css/bootstrap.min.css';
import { FaArrowLeft, FaRegCheckCircle } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';

export default function PricingPlans({ phoneNumber }) {
  const location = useLocation();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [cardData, setCardData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Pricing Plan",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000); // Auto-close after 3 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [message]);

  useEffect(() => {
    fetchActivePlans();
  }, []);

  const fetchActivePlans = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/active-plans`);
      setCardData(response.data);
    } catch (error) {
    }
  };

  const confirmPlanSelection = (card, index) => {
    setSelectedPlan({ card, index });
    setShowPopup(true);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    const { card, index } = selectedPlan;

    if (!phoneNumber) {
      setMessage({ text: 'Phone number is missing.', type: 'error' });
      return;
    }

    const planData = {
      name: card.name,
      packageType: card.packageType,
      unlimitedAds: card.unlimitedAds,
      price: card.price,
      durationDays: card.durationDays,
      numOfCars: card.numOfCars,
      featuredAds: card.featuredAds,
      description: card.description,
      phoneNumber
    };

    setLoadingIndex(index);
    setShowPopup(false);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/register-plan`, planData);
      if (response.status === 201) {
        setMessage({ text: 'Plan added successfully!', type: 'success' });
        setTimeout(() => navigate('/my-property'), 5000);

      }
    } catch (error) {
      setMessage({ text: 'Error adding plan. Please try again.', type: 'error' });
    } finally {
      setLoadingIndex(null);
    }
  };


  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
          <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>

      
      
       {message && (
        <p className='text-bold' style={{ color: message.type === 'success' ? 'green' : 'red', textAlign: 'center' }}>
          {message.text}
        </p>
      )}
      
      <div className="text-center mb-5">
      <h4 style={{ color: "rgb(10, 10, 10)", fontWeight: "bold", marginBottom: "10px" }}> Upgrade Membership</h4>     
      <p style={{ color: "rgb(10, 10, 10)", fontSize: "16px",}} className="lead mb-1 pt-3">Start being a celebrity with our</p>
      <p style={{ color: "rgb(10, 10, 10)", fontSize: "16px", marginBottom: "10px" }} className="lead">premium subscription plans</p>

      </div>

      <div className="row justify-content-center">
        {cardData.map((card, index) => (
          <div key={index} className="col-12 d-flex justify-content-center mb-4">
            <div 
              className="card shadow-lg rounded-3 border-0" 
              style={{
                width: '72%',
                backgroundColor:'#ADD9E6' ,
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title text-start" style={{color:"#ffffff"}}><strong>{card.name}</strong></h4>
                </div>
                <p style={{fontSize:"19px", color:"#646464"}} className="card-subtitle mb-1 text-muted text-start">{card.packageType}</p>
                <p style={{fontSize:"19px", color:"#646464"}} className="card-subtitle mb-2 text-muted text-start">UNLIMITED Property Leads</p>
                <h3 className="display-4 m-0 text-start" style={{ fontSize: '1.5rem', color:"red", fontWeight:"400" }}>₹ {card.price}</h3>
                <p className="text-start mb-4" style={{ fontSize: '14px', color:"#fff" }}>/{card.durationDays} Days / {card.numOfCars} Car{card.numOfCars > 1 ? 's' : ''}</p>
                <h3 className="mb-2 text-start" style={{ fontSize: '20px', color:"black" }}> Featured Ads</h3>
                <p className="card-subtitle mb-3 text-muted text-start">{card.description}</p>
                <h3 className="display-4 mb-4 text-start" style={{ fontSize: '16px', color:"#fff" }}>{card.featuredAds} FEATURED ADS</h3>
                <div className="d-flex justify-content-center">
                  <button 
                    className="btn pt-1 pb-1 ps-3 pe-3 rounded-2" 
                    style={{ background: '#4F4B7E', color: '#fff', fontSize:"14px"}}
                    onClick={() => confirmPlanSelection(card, index)}
                    disabled={loadingIndex === index}
                  >
                    {loadingIndex === index ? 'Posting...' : 'UPGRADE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Popup */}
      <Modal show={showPopup} onHide={() => setShowPopup(false)}>
        <Modal.Body>
          <p>Are you sure you want to post this ad?</p>
          <Button style={{ background:  "#2F747F", width: "80px", fontSize: "13px", border:"none" }}  onClick={handleConfirmPlan}>Yes</Button>
          <Button className="ms-3" style={{ background:  "#FF0000", width: "80px", fontSize: "13px" , border:"none"}} onClick={() => setShowPopup(false)}>No</Button>
        </Modal.Body>
      </Modal>
      </div>

    </div>
  );
}
