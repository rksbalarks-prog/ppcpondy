 




import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { MdCall } from "react-icons/md";
import profil from '../../Assets/xd_profile.png';
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const App = () => {
  const [offers, setOffers] = useState([]);
  const [removedOffers, setRemovedOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeKey, setActiveKey] = useState("All");
  const { phoneNumber } = useParams();
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const confirmAction = (message, action) => {
    setPopupMessage(message);
    setPopupAction(() => action);
    setShowPopup(true);
  };

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Owner Offer",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error recording view:", err);
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const storedOffers = JSON.parse(localStorage.getItem("offers")) || [];
    const storedRemovedOffers = JSON.parse(localStorage.getItem("removedOffers")) || [];
    setOffers(storedOffers);
    setRemovedOffers(storedRemovedOffers);
  }, []);

  useEffect(() => {
    localStorage.setItem("offers", JSON.stringify(offers));
    localStorage.setItem("removedOffers", JSON.stringify(removedOffers));
  }, [offers, removedOffers]);

  useEffect(() => {
    const fetchOffersAndStatuses = async () => {
      if (!phoneNumber) return;
      setLoading(true);

      try {
        const offerRes = await axios.get(`${process.env.REACT_APP_API_URL}/offers/buyer/${phoneNumber}`);
        const statusRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);

        if (offerRes.status === 200 && statusRes.status === 200) {
          const fetchedOffers = offerRes.data.offers || [];
          const statusMap = {};
          
          statusRes.data.forEach(({ ppcId, status }) => {
            if (ppcId) statusMap[ppcId] = status;
          });

          const enrichedOffers = await Promise.all(
            fetchedOffers.map(async (offer) => {
              let propertyMessage = null;
              try {
                const msgRes = await axios.get(`${process.env.REACT_APP_API_URL}/user/property-message/${offer.ppcId}`);
                propertyMessage = msgRes.data?.data?.message || null;
              } catch (error) {
                propertyMessage = null;
              }

              return {
                ...offer,
                payuStatus: statusMap[offer.ppcId] || "unpaid",
                propertyMessage,
              };
            })
          );

          enrichedOffers.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          );

          setOffers(enrichedOffers);
        }
      } catch (error) {
        console.error("Failed to fetch offers or PayU status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffersAndStatuses();
  }, [phoneNumber]);

  const handleRemoveProperty = async (ppcId, buyerPhoneNumber) => {
    confirmAction("Are you sure you want to remove this offer?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/offers/delete/${ppcId}/${buyerPhoneNumber}`);
        
        const propertyToRemove = offers.find(
          p => p.ppcId === ppcId && p.buyerPhoneNumber === buyerPhoneNumber
        );
        
        if (propertyToRemove) {
          setRemovedOffers(prev => [...prev, propertyToRemove]);
          setOffers(prev => prev.filter(p => 
            !(p.ppcId === ppcId && p.buyerPhoneNumber === buyerPhoneNumber)
          ));
          setMessage({ text: "Property removed successfully", type: "success" });
        }
      } catch (error) {
        setMessage({ text: "Error removing property", type: "danger" });
      }
      setShowPopup(false);
    });
  };

  const handleUndoRemove = async (ppcId, buyerPhoneNumber) => {
    confirmAction("Do you want to restore this offer?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/offers/undo/${ppcId}/${buyerPhoneNumber}`);
  
        const propertyToUndo = removedOffers.find(
          p => p.ppcId === ppcId && p.buyerPhoneNumber === buyerPhoneNumber
        );
  
        if (propertyToUndo) {
          setOffers(prev => [...prev, propertyToUndo]);
          setRemovedOffers(prev => prev.filter(p => 
            !(p.ppcId === ppcId && p.buyerPhoneNumber === buyerPhoneNumber)
          ));
          setMessage({ text: "Property restored successfully", type: "success" });
        }
      } catch (error) {
        setMessage({ text: "Error restoring property", type: "danger" });
      }
      setShowPopup(false);
    });
  };

  const handleAcceptOffer = async (ppcId, buyerPhoneNumber) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/accept-offer`, {
        ppcId,
        buyerPhoneNumber,
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Offer Accepted!",
          text: "The offer has been successfully accepted.",
          icon: "success",
          confirmButtonColor: "#2294B1",
        });

        setOffers(prev => prev.map(p => 
          p.ppcId === ppcId ? { ...p, status: "accept" } : p
        ));
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "There was an error accepting the offer.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleRejectOffer = async (ppcId, buyerPhoneNumber) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/reject-offer`, {
        ppcId,
        buyerPhoneNumber,
      });

      if (response.status === 200) {
        Swal.fire({
          title: "Offer Rejected!",
          text: "The offer has been successfully rejected.",
          icon: "info",
          confirmButtonColor: "#2294B1",
        });

        setOffers(prev => prev.map(p => 
          p.ppcId === ppcId ? { ...p, status: "reject" } : p
        ));
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "There was an error rejecting the offer.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleContact = async (ppcId, buyerPhoneNumber) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
        ppcId,
        userPhone: buyerPhoneNumber,
        postedUserPhone: phoneNumber,
      });

      if (response.data.success) {
        setMessage({ text: "Contact saved successfully", type: "success" });
        window.location.href = `tel:${buyerPhoneNumber}`;
      } else {
        setMessage({ text: response.data.message || "Contact failed", type: "error" });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || "An error occurred", 
        type: "error" 
      });
    }
  };

  const activeProperties = offers.filter(p => p.status !== "delete");
  const removedProperties = removedOffers;
  const navigate = useNavigate();

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" 
           style={{ maxWidth: '500px', margin: 'auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
        <div className="d-flex align-items-center justify-content-start w-100" style={{
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
          >
            <FaArrowLeft style={{ color: '#30747F', background:"transparent"}} />
          </button> 
          <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>OFFER FROM BUYERS</h3> 
        </div>
        
        <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button 
              className="w-100 p-1 border-0" 
              style={{ 
                backgroundColor: activeKey === "All" ? "#30747F" : "#FFFFFF", 
                color: activeKey === "All" ? "#FFFFFF" : "#000000"
              }} 
              onClick={() => setActiveKey("All")}
            >
              ALL BUYER
            </button>
          </div>
          <div className="col-6 p-0">
            <button 
              className="w-100 p-1 border-0" 
              style={{ 
                backgroundColor: activeKey === "Removed" ? "#FF4D00" : "#FFFFFF", 
                color: activeKey === "Removed" ? "#FFFFFF" : "#000000"
              }} 
              onClick={() => setActiveKey("Removed")}
            >
              REMOVED BUYER
            </button>
          </div>

          <div>
            {message.text && (
              <div className={`alert alert-${message.type === "success" ? "success" : "danger"}`}>
                {message.text}
              </div>
            )}
            <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
              <Modal.Body className="text-center">
                <p className="mb-4">{popupMessage}</p>
                <div className="d-flex justify-content-center">
                  <Button 
                    variant="primary" 
                    className="me-2"
                    style={{ 
                      backgroundColor: '#2F747F', 
                      border: 'none',
                      minWidth: '80px'
                    }}
                    onClick={popupAction}
                  >
                    Yes
                  </Button>
                  <Button 
                    variant="secondary"
                    style={{ 
                      backgroundColor: '#6c757d', 
                      border: 'none',
                      minWidth: '80px'
                    }}
                    onClick={() => setShowPopup(false)}
                  >
                    No
                  </Button>
                </div>
              </Modal.Body>
            </Modal>
          </div>

          <div className="col-12">
            <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: '500px' }}>
              {loading ? (
                <div className="text-center my-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2">Loading properties...</p>
                </div>
              ) : activeKey === "All" ? (
                <PropertyList 
                  properties={activeProperties} 
                  onRemove={handleRemoveProperty}  
                  onAccept={handleAcceptOffer} 
                  onReject={handleRejectOffer} 
                  onContact={handleContact}
                  isRemovedTab={false}
                />
              ) : (
                <PropertyList 
                  properties={removedProperties} 
                  onUndo={handleUndoRemove} 
                  onContact={handleContact}
                  isRemovedTab={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyList = ({ properties, onRemove, onUndo, onAccept, onReject, onContact, isRemovedTab }) => {
  const navigate = useNavigate();

  return properties.length === 0 ? (
    <div className="text-center my-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <img src={NoData} alt="No data" width={100} />
      <p className="mt-2">No properties found.</p>
    </div>
  ) : (
    <div className="row mt-4 w-100">
      {properties.map((property) => (
        <div className="col-12 mb-3 p-0" key={`${property.ppcId}-${property.buyerPhoneNumber}`} onClick={() => navigate(`/detail/${property.ppcId}`)}>
          <PropertyCard
            property={property}
            onRemove={onRemove}
            onUndo={onUndo}
            onAccept={onAccept}
            onReject={onReject}
            onContact={onContact}
            isRemovedTab={isRemovedTab}
          />
        </div>
      ))}
    </div>
  );
};

const PropertyCard = ({ property, onRemove, onUndo, onAccept, onReject, onContact, isRemovedTab }) => {
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const formatPrice = (originalPrice) => {
    if (!originalPrice) return 'N/A';
    originalPrice = Number(originalPrice);

    if (originalPrice >= 10000000) {
      return (originalPrice / 10000000).toFixed(2) + ' Cr';
    } else if (originalPrice >= 100000) {
      return (originalPrice / 100000).toFixed(2) + ' Lakhs';
    } else {
      return originalPrice.toLocaleString('en-IN');
    }
  };

  const handlePayNow = (ppcId) => {
    navigate("/pricing-plans", {
      state: {
        phoneNumber: property.phoneNumber,
        ppcId: ppcId,
      },
    });
  };

  const handleCall = async (e) => {
    e.stopPropagation();
    try {
      await onContact(property.ppcId, property.buyerPhoneNumber);
    } catch (error) {
      setMessage({ text: "Failed to initiate call", type: "error" });
    }
  };

  return (
    <div className="card p-3 w-100" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      {message.text && (
        <div className={`alert alert-${message.type === "success" ? "success" : "danger"} py-1 mb-2`}>
          {message.text}
        </div>
      )}

      <div className="row d-flex align-items-center mb-3">
        <div className="col-3 d-flex justify-content-center">
          <img
            src={profil}
            alt="Profile"
            className="rounded-circle"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
        </div>
        <div className="col-1 d-flex justify-content-center">
          <div style={{ background: "#707070", width: "2px", height: "80px" }}></div>
        </div>
        <div className="col-8">
          <div className='text-center rounded-1 w-100 mb-2 py-1' style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "13px" }}>
            INTERESTED BUYER
          </div>
          <div className="d-flex">
            <p className="mb-1 me-3" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>
              PUC- {property.ppcId}
            </p>
            
            {property.propertyMessage && (
              <span className="me-2" style={{ color: "#FF0000", fontWeight: "bold", fontSize: "12px" }}>
                {property.propertyMessage}
              </span>
            )}
          </div>
          <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
            {property.propertyType || "N/A"} | {property.city || "N/A"}
          </h5>
          <p className="mb-1 text-primary" style={{ fontWeight: "500", fontSize: "15px" }}>
            {property.status}
          </p>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 d-flex align-items-center">
          <FaRupeeSign color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
          <div>
            <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Your Price</h6>
            <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
              {formatPrice(property.originalPrice)}
            </span>
          </div>
        </div>
        <div className="col-6 d-flex align-items-center">
          <FaRupeeSign color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
          <div>
            <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Offered Price</h6>
            <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
              {property.offeredPrice?.toLocaleString("en-IN") || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6 d-flex align-items-center">
          <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
          <div>
            <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Buyer Phone</h6>
            <span className="card-text" style={{ fontWeight: "500" }}>
              {property.payuStatus === "paid" ? (
                <span
                  style={{ color: "#1D1D1D", cursor: "pointer" }}
                  onClick={handleCall}
                >
                  {property.buyerPhoneNumber}
                </span>
              ) : (
                property.buyerPhoneNumber?.slice(0, 5) + "*****"
              )}
            </span>
          </div>
        </div>
        <div className="col-6 d-flex align-items-center">
          <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
          <div>
            <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Offered Date</h6>
            <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
              {(property.updatedAt || property.offerDate)
                ? new Date(property.updatedAt || property.offerDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {!isRemovedTab && !showFullNumber && (
        <button 
          className='w-100 mb-3 py-2'
          onClick={(e) => {
            e.stopPropagation();
            setShowFullNumber(true);
          }}
          style={{
            background: "#2F747F", 
            color: "white", 
            border: "none", 
            borderRadius: "8px",
            fontWeight: "500"
          }}
        >
          View Details
        </button>
      )}

      {(showFullNumber || isRemovedTab) && (
        <div className="d-flex justify-content-between">
          {isRemovedTab ? (
            <button 
              className="btn text-white px-3 py-2 flex-grow-1 me-2"
              style={{ background: "#4CAF50", borderRadius: "8px", fontWeight: "500" }}
              onClick={(e) => {
                e.stopPropagation();
                onUndo(property.ppcId, property.buyerPhoneNumber);
              }}
            >
              Undo
            </button>
          ) : (
            <>
              {property.payuStatus === "paid" ? (
                <>
                  <button
                    className="btn text-white px-3 py-2 flex-grow-1 me-2"
                    style={{ background: "#2F747F", borderRadius: "8px", fontWeight: "500" }}
                    onClick={handleCall}
                  >
                    Call
                  </button>
                  <button
                    className="btn text-white px-3 py-2 flex-grow-1 me-2"
                    style={{ background: "#4CAF50", borderRadius: "8px", fontWeight: "500" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept(property.ppcId, property.buyerPhoneNumber);
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="btn text-white px-3 py-2 flex-grow-1 me-2"
                    style={{ background: "#FF5733", borderRadius: "8px", fontWeight: "500" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(property.ppcId, property.buyerPhoneNumber);
                    }}
                  >
                    Reject
                  </button>
                  <button
                    className="btn text-white px-3 py-2 flex-grow-1"
                    style={{ background: "#FF0000", borderRadius: "8px", fontWeight: "500" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(property.ppcId, property.buyerPhoneNumber);
                    }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn text-white px-3 py-2 flex-grow-1 me-2"
                    style={{ background: "#FFB100", borderRadius: "8px", fontWeight: "500" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayNow(property.ppcId);
                    }}
                  >
                    Pay Now
                  </button>
                  <button
                    className="btn text-white px-3 py-2 flex-grow-1"
                    style={{ background: "#FF0000", borderRadius: "8px", fontWeight: "500" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(property.ppcId, property.buyerPhoneNumber);
                    }}
                  >
                    Remove
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;