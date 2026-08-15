

import React, { useState, useEffect } from 'react'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaArrowLeft, FaRegCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';
import hom from "../Assets/addcarimg.png"
import SuccessIcon from '../Assets/Success.png';

export default function WebPricingPlan() {
  const location = useLocation();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [cardData, setCardData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const phoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";




  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000); // Auto-close after 3 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [message]);

  useEffect(() => {
    fetchActivePlans();
  }, []);
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Add Pricing Plans",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);
 

  const confirmPlanSelection = (card, index) => {
    setSelectedPlan({ card, index });
    setShowPopup(true);
  };

const fetchActivePlans = async () => {
  try {
    // Fetch all plans (optional, if still needed)
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/active-plans`);
    setCardData(response.data);

    // Fetch the latest active plan for the user
    if (phoneNumber) {
      const userPlanResponse = await axios.get(`${process.env.REACT_APP_API_URL}/get-latest-active-plan/${phoneNumber}`);
      setSelectedPlan(userPlanResponse.data); // Store the active plan
    }
  } catch (error) {
    setMessage("You have No active plan!", error);
  }
};


  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    const { card, index } = selectedPlan;

    if (!phoneNumber) {
      setMessage({ text: 'Phone number is missing.', type: 'error' });
      return;
    }

    const planData = {
      phoneNumber,
      planId: card._id,  // Send the plan ID to store phone number with it
    };

    setLoadingIndex(index);
    setShowPopup(false);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/select-plan`, planData);
      if (response.status === 200) {
        setMessage({ text: 'Plan selected successfully!', type: 'success' ,  image: SuccessIcon   });
        setTimeout(() => navigate('/my-plan'), 5000);
      }
    } catch (error) {
      setMessage({ text: 'You already have an active plan!', type: 'info' });
    } finally {
      setLoadingIndex(null);
    }
};

  return (
   
<div className="container p-0">       
  <div className="text-center mb-3">
{message && (
  <div>
    {message.image && (
      <img
        src={message.image}
        alt={message.type}
        style={{ width: 40, height: 40, display: 'block', margin: '0 auto' }}
      />
    )}
    <p
      className='text-bold'
      style={{ color: message.type === 'success' ? 'green' : 'red', marginTop: 10 }}
    >
      {message.text}
    </p>
  </div>
)}


      <div className="text-center mb-3">
      <p style={{ color: "rgb(10, 10, 10)", fontSize: "16px", marginBottom: "10px" }} className="lead mb-1 pt-3">Start being a celebrity with our</p>
      <p style={{ color: "rgb(10, 10, 10)", fontSize: "16px", marginBottom: "10px" }} className="lead">premium subscription plans</p>
      </div>

      <div className="row justify-content-center">
        {cardData.map((card, index) => (
          <div key={index} className="col-lg-4 col-md-6 col-12 d-flex justify-content-center mb-4 p-0" >
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
          <Button style={{ background:  "#2F747F", width: "80px", fontSize: "13px", border:"none" }} onClick={handleConfirmPlan}>Yes</Button>
          <Button className="ms-3" style={{ background:  "#FF0000", width: "80px", fontSize: "13px" , border:"none"}} onClick={() => setShowPopup(false)}>No</Button>
        </Modal.Body>
      </Modal>
      </div>

    </div>

  );
}

