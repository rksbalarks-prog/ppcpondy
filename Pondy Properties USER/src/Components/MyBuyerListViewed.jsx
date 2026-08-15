
 
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdOutlineCall,
  MdOutlineMapsHomeWork,
  MdCalendarMonth,
  MdOutlineBed,
} from "react-icons/md";
import { RiStairsLine } from "react-icons/ri";
import { GoHome } from "react-icons/go";
import { TfiLocationPin } from "react-icons/tfi";
import profil from "../Assets/xd_profile.png";
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import maxrupe from "../Assets/Price maxi-01.png";
import minrupe from "../Assets/Price Mini-01.png";
import { FaArrowLeft } from "react-icons/fa";


export default function MyBuyerListViewed() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const iconContainerRef = useRef(null);

  // Grab phoneNumber
  const storedPhoneNumber =
    location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber);

  // Data states
  const [assistanceData, setAssistanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedBaId, setSelectedBaId] = useState("");

  // Record dashboard view
  useEffect(() => {
    if (!phoneNumber) return;
    axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
      phoneNumber,
      viewedFile: "Buyer Lists",
      viewTime: new Date().toISOString(),
    });
  }, [phoneNumber]);

  // Fetch viewed BA IDs then their details
  useEffect(() => {
    const fetchViewedAndDetails = async () => {
      try {
        const viewsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-buyer-assist-views`,
          { params: { phoneNumber } }
        );
        if (!viewsRes.data.success) {
          setError("Could not load your viewed records.");
          return;
        }
        const viewedList = viewsRes.data.views; // array of { ba_id, viewedAt, ... }
        if (viewedList.length === 0) {
          setAssistanceData([]);
          return;
        }
        const detailPromises = viewedList.map(v =>
          axios.get(
            `${process.env.REACT_APP_API_URL}/fetch-buyerAssistance/${v.ba_id}`
          )
        );
        const detailResponses = await Promise.all(detailPromises);
        const combined = viewedList.map(v => {
          const match = detailResponses.find(r => r.data.data.ba_id === v.ba_id);
          return { ...match.data.data, viewedAt: v.viewedAt };
        });
        combined.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
        setAssistanceData(combined);
      } catch (err) {
        console.error(err);
        setError("Error loading viewed list.");
      } finally {
        setLoading(false);
      }
    };

    if (phoneNumber) fetchViewedAndDetails();
    else {
      setLoading(false);
      setError("No phone number found.");
    }
  }, [phoneNumber]);

  // Confirm Call popup
  const handleConfirmCall = (phone, ba_id) => {
    setSelectedPhone(phone);
    setSelectedBaId(ba_id);
    setShowPopup(true);
  };
  const handlePopupResponse = async confirmed => {
    setShowPopup(false);
    if (!confirmed) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/contact-buyer-send`, {
        phoneNumber: selectedPhone,
        ba_id: selectedBaId,
      });
      setMessage("Contact request sent! Calling now...");
      window.location.href = `tel:${selectedPhone}`;
    } catch {
      setMessage("Failed to send contact request.");
    }
  };

  // Auto-clear message
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  // Scroll handlers
  const handleWheelScroll = e => {
    e.preventDefault();
    scrollContainerRef.current.scrollTop += e.deltaY;
  };
  const handleIconScroll = e => {
    e.preventDefault();
    iconContainerRef.current.scrollLeft += e.deltaX || e.deltaY;
  };

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div
        className="d-flex flex-column align-items-center justify-content-center m-0"
        style={{
          maxWidth: "500px",
          width: "100%",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Sticky Header with Back Arrow */}
        <div
          className="d-flex align-items-center w-100"
          style={{
            background: "#EFEFEF",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            padding: "10px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: "#f0f0f0",
              border: "none",
              padding: "8px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#f0f4f5";
              e.currentTarget.querySelector("svg").style.color = "#00B987";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.querySelector("svg").style.color = "#30747F";
            }}
          >
            <FaArrowLeft style={{ color: "#30747F" }} />
          </button>
          <h3 className="ms-3 m-0" style={{ fontSize: "20px" }}>
          My BuyerList Viewed 
          </h3>
        </div>

 

         <div
      className="scroll-container d-flex flex-column w-100"
      style={{
        padding: "10px",
        gap: "15px",
        overflowY: "hidden",            // always-on scrollbar
        height: "calc(100vh - 80px)",
      }}
      onWheel={handleWheelScroll}
      ref={scrollContainerRef}
    >

      {/* Inline scrollbar styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Chrome, Safari, Edge, Opera */
            .scroll-container::-webkit-scrollbar {
              width: 8px;
            }
            .scroll-container::-webkit-scrollbar-track {
              background: transparent;
            }
            .scroll-container::-webkit-scrollbar-thumb {
              background-color: #bbb;
              border-radius: 4px;
            }

            /* Firefox */
            .scroll-container {
              scrollbar-width: thin;
              scrollbar-color: #bbb transparent;
            }
          `,
        }}
      />

  
          {message && (
            <div className="alert alert-success text-center">{message}</div>
          )}

          {loading ? (
            <div className="text-center my-4">
              <span className="spinner-border" role="status" />
              <p>Loading your viewed list…</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : assistanceData.length === 0 ? (
            <div className="text-center my-4">
              <img src={NoData} alt="No data" width={100} />
              <p>No viewed Buyer Assistance records.</p>
            </div>
          ) : (
            assistanceData.map(card => (
              <div
                key={card._id}
                className="card p-2"
                style={{ background: "#F9F9F9" }}
              >
                <div className="d-flex align-items-center">
                  <img
                    src={profil}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "cover",
                      marginRight: 12,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">BA ID: {card.ba_id}</small>
                      <small className="text-muted">
                        <MdCalendarMonth size={14} />{" "}
                        {new Date(card.viewedAt).toLocaleDateString()}
                      </small>
                    </div>
                    <h5 style={{ fontSize: 16, margin: 0 }}>
                      {card.baName || "N/A"}{" "}
                      <small className="text-muted">| Buyer</small>
                    </h5>
                  </div>
                </div>

                <div className="d-flex mt-2">
                  <small className="me-3 d-flex align-items-center">
                    <img src={minrupe} width={12} className="me-1" />
                    {card.minPrice}
                  </small>
                  <small className="d-flex align-items-center">
                    <img src={maxrupe} width={12} className="me-1" />
                    {card.maxPrice}
                  </small>
                </div>

                <div
                  className="d-flex overflow-auto mt-2 p-1"
                  style={{ border: "1px solid #019988" }}
                  ref={iconContainerRef}
                  onWheel={handleIconScroll}
                >
                  <div className="me-3 d-flex align-items-center">
                    <GoHome size={14} color="#019988" className="me-1" />
                    <small>{card.propertyMode}</small>
                  </div>
                  <div className="me-3 d-flex align-items-center">
                    <MdOutlineMapsHomeWork
                      size={14}
                      color="#019988"
                      className="me-1"
                    />
                    <small>{card.propertyType}</small>
                  </div>
                  <div className="me-3 d-flex align-items-center">
                    <MdCalendarMonth
                      size={14}
                      color="#019988"
                      className="me-1"
                    />
                    <small>{card.paymentType}</small>
                  </div>
                  <div className="me-3 d-flex align-items-center">
                    <MdOutlineBed size={14} color="#019988" className="me-1" />
                    <small>{card.bedrooms} BHK</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <RiStairsLine
                      size={14}
                      color="#019988"
                      className="me-1"
                    />
                    <small>{card.propertyAge}</small>
                  </div>
                </div>

                <p className="mt-2 mb-1" style={{ fontSize: 14 }}>
                  <TfiLocationPin
                    size={16}
                    color="#019988"
                    className="me-1"
                  />
                  {card.area}, {card.city}
                </p>

                <div className="d-flex align-items-center justify-content-between mt-2">
                  <div className="d-flex align-items-center">
                    <MdOutlineCall
                      color="#019988"
                      size={16}
                      className="me-1"
                    />
                    <small>{card.phoneNumber || "N/A"}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() =>
                      handleConfirmCall(card.phoneNumber, card.ba_id)
                    }
                  >
                    Call Buyer
                  </button>
                  
<button
  className="btn text-white px-3 py-1 mx-1"
  style={{ background: "#2F747F", fontSize: "13px" }}
  onMouseOver={(e) => {
    e.target.style.background = "#029bb3"; // Brighter neon on hover
    e.target.style.fontWeight = 600; // Brighter neon on hover
    e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover

  }}
  onMouseOut={(e) => {
    e.target.style.background = "#2F747F"; // Original orange
    e.target.style.fontWeight = 400; // Brighter neon on hover

  }}
  onClick={() => navigate(`/my-buyer-list-viewed-detail/${card.ba_id}`)}

>
  More
</button>
                </div>
              </div>
            ))
          )}

          {showPopup && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center">
              <div className="bg-white p-4 rounded">
                <h6>Call this buyer?</h6>
                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="btn btn-success"
                    onClick={() => handlePopupResponse(true)}
                  >
                    Yes
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handlePopupResponse(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
