import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

import profil from "../Assets/xd_profile.png";
import minrupe from "../Assets/Price Mini-01.png";
import maxrupe from "../Assets/Price maxi-01.png";
import NoData from "../Assets/OOOPS-No-Data-Found.png";

import { MdOutlineCall, MdOutlineMapsHomeWork, MdCalendarMonth, MdOutlineBed } from "react-icons/md";
import { RiStairsLine } from "react-icons/ri";
import { GoHome } from "react-icons/go";
import { TfiLocationPin } from "react-icons/tfi";
import { FaArrowLeft } from "react-icons/fa";

const MyInterestSend = () => {
  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber);

  const [assistanceData, setAssistanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedPpcId, setSelectedPpcId] = useState('');

  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout;

    const handleScroll = () => {
      setIsScrolling(true);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150); // Adjust the delay as needed
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const scrollContainerRef = useRef(null);
  const iconContainerRef = useRef(null);

  const navigate = useNavigate();

  const handleConfirmCall = (phone, id) => {
    setSelectedPhone(phone);
    setSelectedPpcId(id);
    setShowPopup(true);
  };

  const handlePopupResponse = async (confirmed) => {
    setShowPopup(false);
    if (confirmed && selectedPhone) {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/contact-send`, {
          phoneNumber: selectedPhone,
        });
        setMessage("Contact request sent successfully!");
        window.location.href = `tel:${selectedPhone}`;
      } catch (error) {
        setMessage("Failed to send contact request.");
      }
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchAssistanceData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-interests-phone`, {
          params: { phone: phoneNumber }
        });
    
        const sorted = response.data.data.sort(
  (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
);

    
        // const sorted = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAssistanceData(sorted);
      } catch (err) {
        setError("No buyer assistance interests.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssistanceData();
  }, [phoneNumber]);

  const handleWheelScroll = (e) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  };

const formatIndianNumber = (x) => {
  x = x.toString();
  const lastThree = x.slice(-3);
  const otherNumbers = x.slice(0, -3);
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherNumbers ? "," : "") + lastThree;
};

const formatPrice = (price) => {
  price = Number(price);
  if (isNaN(price)) return 'N/A';

  if (price >= 10000000) {
    return (price / 10000000).toFixed(2) + ' Cr';
  } else if (price >= 100000) {
    return (price / 100000).toFixed(2) + ' Lakhs';
  } else {
    return formatIndianNumber(price);
  }
};

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "My send interest ",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);
  const handleIconScroll = (e) => {
    if (iconContainerRef.current) {
      e.preventDefault();
      const scrollAmount = e.deltaX || e.deltaY;
      iconContainerRef.current.scrollLeft += scrollAmount;
    }
  };

  if (loading) return <p>Loading...</p>;

  
 

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center P-0"
      style={{ gap: "15px", borderRadius: "10px", overflowY: "auto" }}
      onWheel={handleWheelScroll}
      ref={scrollContainerRef}
    >
          <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' , fontFamily: 'Inter, sans-serif'}}>

    <div className="d-flex align-items-center justify-content-start w-100"  style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}>

       <button
                   onClick={() => navigate(-1)}
                   className="pe-5"
                   style={{
                     backgroundColor: '#f0f0f0',
                     border: 'none',
                     padding: '10px 20px',
                     cursor: 'pointer',
                     transition: 'all 0.3s ease-in-out',
                     display: 'flex',
                     alignItems: 'center',
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = '#f0f4f5'; // Change background
                     e.currentTarget.querySelector('svg').style.color = '#00B987'; // Change icon color
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = '#f0f0f0';
                     e.currentTarget.querySelector('svg').style.color = '#30747F';
                   }}
                 >
                   <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
                 </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>My Interest Send  </h3> </div>
        
      {/* <h5>Buyer Assistance Interest List</h5> */}


      {assistanceData.length > 0 ? (
        assistanceData.map((card) => (
          <div
            key={card._id}
            className="card p-1"
            style={{
              width: "450px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              marginBottom: "15px",
              fontFamily: "Inter, sans-serif",
            }}
          >

               {message && <div className="alert text-success text-bold">{message}</div>}
          
          <div>

            <div className="row d-flex align-items-center">
              <div className="col-3 d-flex align-items-center justify-content-center mb-1">
                <img
                  src={profil}
                  alt="Profile"
                  className="rounded-circle mt-2"
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
                />
              </div>
              <div className='p-0' style={{ background: "#707070", width: "1px", height: "80px" }}></div>
              <div className="col-7 p-0 ms-4">
                <div className="d-flex justify-content-between">
                  <p className="m-0" style={{ fontSize: "12px", color: "#5E5E5E", fontWeight: "500" }}>
                    BA ID: {card.ba_id}
                  </p>
          

<p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: "500" }}>
  <MdCalendarMonth size={12} className="me-2" color="#019988" />
  {
    card.updatedAt && card.updatedAt !== card.createdAt
      ? new Date(card.updatedAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : new Date(card.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
  }
</p>

                </div>
                <h5 className="mb-1" style={{ fontSize: "16px", color: "#000", fontWeight: "500" }}>
                  {card.baName || "Unknown Buyer"} <span className="text-muted" style={{ fontSize: "12px" }}>| Buyer</span>
                </h5>
                <div className="d-flex align-items-center col-8">
                  <p className="mb-0 d-flex align-items-center me-3" style={{ fontSize: "12px", fontWeight: 500 }}>
                    <img src={minrupe} alt="min" width={13} className="me-2" />
                    {/* {card.minPrice} */}
                    {formatPrice(card.minPrice)}
                  </p>
                  <p className="mb-0 d-flex align-items-center" style={{ fontSize: "12px", fontWeight: 500 }}>
                    <img src={maxrupe} alt="max" width={13} className="me-2" />
                    {/* {card.maxPrice} */}
                    {formatPrice(card.maxPrice)}
                  </p>
                </div>
              </div>
            </div>
            </div>

            <div className="p-1">
              <div
                className="d-flex align-items-center overflow-auto mb-0 p-1 rounded-1"
                style={{ whiteSpace: "nowrap", overflowX: "auto", border: "1px solid #019988" }}
                onWheel={handleIconScroll}
                ref={iconContainerRef}
              >
                <div className="d-flex align-items-center me-3">
                  <GoHome size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyMode}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineMapsHomeWork size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyType}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdCalendarMonth size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.paymentType}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineBed size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.bedrooms} BHK</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <RiStairsLine size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyAge}</p>
                </div>
              </div>

              <div className="mb-0 mt-1">
                <p className="mb-0" style={{ fontWeight: 600, fontSize: "12px" }}>
                  <TfiLocationPin size={16} className="me-2" color="#019988" />
                  {card.area}, {card.state}
                </p>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="d-flex align-items-center">
                  <MdOutlineCall color="#019988" style={{ fontSize: "12px", marginRight: "8px" }} />
                  <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                    Buyer Phone: {card.phoneNumber ? `${card.phoneNumber.slice(0, -5)}*****` : "N/A"}
                  </h6>
                </div>
                <button
                  className="btn ms-5 text-white px-3 py-1"
                  style={{ background: "orangered", fontSize: "13px" }}
                  onClick={() => navigate(`/detail-buyer-assis-interest/${card.ba_id}`)}
                >
                  More
                </button>
                <button
                  className="btn text-white px-3 py-1"
                  style={{ background: "#2F747F", fontSize: "13px" }}
                  onClick={() => handleConfirmCall(card.phoneNumber, card.ba_id)}
                >
                  Call
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
            <div
              className="text-center my-4"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <img src={NoData} alt="No Data" width={100} />
        <p>No buyer assistance interests found.</p>
            </div>
      )}

      {/* Confirmation Modal */}
      {showPopup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
          <div className="bg-white p-4 rounded" style={{ minWidth: "300px" }}>
            <h6 className="mb-3">Are you sure you want to call this buyer?</h6>
            <div className="d-flex justify-content-between">
              <button className="btn btn-success" onClick={() => handlePopupResponse(true)}>Yes</button>
              <button className="btn btn-danger" onClick={() => handlePopupResponse(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
</div>
  );
};

export default MyInterestSend;
