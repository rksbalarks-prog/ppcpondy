 


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCalendarAlt } from "react-icons/fa";
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png';
import { TbCameraPlus } from "react-icons/tb";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";
import { FaLocationDot } from 'react-icons/fa6';

const App = () => {
  const [activeKey, setActiveKey] = useState("All");
  const [removedProperties, setRemovedProperties] = useState(() => {
    const storedRemovedProperties = localStorage.getItem("removedProperties");
    return storedRemovedProperties ? JSON.parse(storedRemovedProperties) : [];
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();
  const { phoneNumber } = useParams();
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState({});
  const [apiResponse, setApiResponse] = useState(null);  

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

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Address request Buyer",
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

  const confirmAction = (message, action) => {
    setPopupMessage(message);
    setPopupAction(() => action);
    setShowPopup(true);
  };

  const handleRemoveProperty = async (ppcId) => {
    confirmAction("Are you sure you want to remove this Address request?", async () => {
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/address-requests/delete/${ppcId}`
        );

        if (response.status === 200) {
          setMessage({ text: "Address request marked as deleted.", type: "success" });

          const deletedRequest = response.data.request;
          setProperties((prev) => prev.filter((prop) => prop.ppcId !== ppcId));
          setRemovedProperties((prev) => {
            const updated = [...prev, deletedRequest];
            localStorage.setItem("removedProperties", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Error deleting address request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handleUndoRemove = async (ppcId) => {
    confirmAction("Do you want to restore this Address request buyer?", async () => {
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/address-requests/undo/${ppcId}`
        );

        if (response.status === 200) {
          setMessage({ text: "Address request restored.", type: "success" });
          const restoredProperty = response.data.request;
          setRemovedProperties((prev) => {
            const updated = prev.filter((prop) => prop.ppcId !== ppcId);
            localStorage.setItem("removedProperties", JSON.stringify(updated));
            return updated;
          });
          setProperties((prev) => [...prev, restoredProperty]);
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Error restoring address request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handlePayNow = (ppcId, phoneNumber) => {
    navigate("/pricing-plans", {
      state: {
        phoneNumber,
        ppcId,
      },
    });
  };

  useEffect(() => {
    if (!phoneNumber) {
      setMessage({ text: "Phone number is missing.", type: "error" });
      setLoading(false);
      return;
    }

    const fetchAddressRequestsWithPayuStatus = async () => {
      try {
        setLoading(true);
        setMessage({ text: "", type: "" });

        const statusRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);
        const addressRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/address-requests/buyer/${phoneNumber}`
        );

        if (statusRes.status === 200 && addressRes.status === 200) {
          const statusMap = {};
          statusRes.data.forEach(({ ppcId, status }) => {
            if (ppcId) statusMap[ppcId] = status;
          });

          const rawData = Array.isArray(addressRes.data) ? addressRes.data : [];

          const enriched = await Promise.all(
            rawData.map(async (item) => {
              const property = item.property || {};
              const ppcId = property.ppcId;

              let propertyMessage = null;
              try {
                const msgRes = await axios.get(
                  `${process.env.REACT_APP_API_URL}/user/property-message/${ppcId}`
                );
                propertyMessage = msgRes.data?.data?.message || null;
              } catch {
                propertyMessage = null;
              }

              return {
                ...property,
                ppcId,
                status: item.status,
                requesterPhoneNumber: item.requesterPhoneNumber,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                payuStatus: statusMap[ppcId] || "unpaid",
                propertyMessage,
              };
            })
          );

          const sorted = enriched.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          );

          setProperties(sorted);
          localStorage.setItem("addressRequests", JSON.stringify(sorted));
        }
      } catch (error) {
        console.error("Error loading address requests:", error);
        setMessage({ text: "Error loading address requests.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchAddressRequestsWithPayuStatus();
  }, [phoneNumber]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    localStorage.setItem("removedProperties", JSON.stringify(removedProperties));
  }, [removedProperties]);

  const availableProperties = properties.filter(
    (property) => !removedProperties.some((removed) => removed.ppcId === property.ppcId)
  );

  const toggleShowFullNumber = (ppcId) => {
    setShowFullNumber(prev => ({
      ...prev,
      [ppcId]: !prev[ppcId]
    }));
  };

  if (loading) return (
    <div className="text-center my-4" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <span className="spinner-border text-primary" role="status" />
      <p className="mt-2">Loading properties...</p>
    </div>
  );

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
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
            <FaArrowLeft style={{ color: '#30747F' }} />
          </button> 
          <h3 className="m-0" style={{fontSize:"20px"}}>ADDRESS REQUESTED BUYERS</h3> 
        </div>

         <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button 
              className="w-100 p-1 border-0" 
              style={{ 
                backgroundColor: activeKey === "All" ? '#30747F' : '#FFFFFF', 
                color: activeKey === "All" ? 'white' : 'grey' 
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
                backgroundColor: activeKey === "Removed" ? '#30747F' : '#FFFFFF', 
                color: activeKey === "Removed" ? 'white' : 'grey' 
              }} 
              onClick={() => setActiveKey("Removed")}
            >
              REMOVED BUYER
            </button>
          </div>

          <Modal show={showPopup} onHide={() => setShowPopup(false)}>
            <Modal.Body>
              <p>{popupMessage}</p>
              <Button 
                style={{ background: "#2F747F", width: "80px", fontSize: "13px", border:"none" }} 
                onClick={popupAction}
              >
                Yes
              </Button>
              <Button 
                className="ms-3" 
                style={{ background: "#FF0000", width: "80px", fontSize: "13px", border:"none"}} 
                onClick={() => setShowPopup(false)}
              >
                No
              </Button>
            </Modal.Body>
          </Modal>

           <div className="col-12">
            <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: '500px' }}>
              {activeKey === "All" ? (
                <PropertyList
                  properties={availableProperties}
                  onRemove={handleRemoveProperty}
                  onUndo={null}
                  showFullNumber={showFullNumber}
                  toggleShowFullNumber={toggleShowFullNumber}
                  handlePayNow={handlePayNow}
                  setApiResponse={setApiResponse}
                  setMessage={setMessage}
                />
              ) : (
                <PropertyList
                  properties={removedProperties}
                  onRemove={null}
                  onUndo={handleUndoRemove}
                  showFullNumber={showFullNumber}
                  toggleShowFullNumber={toggleShowFullNumber}
                  handlePayNow={handlePayNow}
                  setApiResponse={setApiResponse}
                  setMessage={setMessage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyList = ({ properties, onRemove, onUndo, showFullNumber, toggleShowFullNumber, handlePayNow, setApiResponse, setMessage }) => {
  const navigate = useNavigate();

  if (properties.length === 0) {
    return (
      <div className="text-center my-4" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <img src={NoData} alt="" width={100}/>      
        <p>No properties found.</p>
      </div>
    );
  }

  return (
    <div className="row mt-4 w-100">
      {properties.map((property) => (
        <PropertyCard
          key={property.ppcId}
          property={property}
          onRemove={onRemove}
          onUndo={onUndo}
          showFullNumber={showFullNumber[property.ppcId] || false}
          toggleShowFullNumber={() => toggleShowFullNumber(property.ppcId)}
          handlePayNow={handlePayNow}
          setApiResponse={setApiResponse}
          setMessage={setMessage}
        />
      ))}
    </div>
  );
};

const PropertyCard = ({ property, onRemove, onUndo, showFullNumber, toggleShowFullNumber, handlePayNow, setApiResponse, setMessage }) => {
  const [localMessage, setLocalMessage] = useState({ text: "", type: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const navigate = useNavigate();

  const handleSendAddress = async (ppcId) => {
    try {
      setLocalMessage({ text: "Sending address...", type: "info" });
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/address-requests/send/${ppcId}`,
        {},  
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        setLocalMessage({ text: "Address sent successfully!", type: "success" });
      } else {
        throw new Error(response.data.message || "Failed to send address");
      }
    } catch (error) {
      console.error("Error sending address:", error);
      setLocalMessage({ 
        text: error.response?.data?.message || "Error sending address", 
        type: "error" 
      });
    }
  };

  const handleAddAddress = (ppcId) => {
    navigate(`/address-edit-form`, { state: { ppcId } });
  };

  const handleAddressAction = (e, ppcId) => {
    e.stopPropagation();
    if (property.address) {
      handleSendAddress(ppcId);
    } else {
      setPendingAction(() => () => handleAddAddress(ppcId));
      setShowConfirmation(true);
    }
  };

  const handleConfirmation = (confirmed) => {
    setShowConfirmation(false);
    if (confirmed && pendingAction) {
      pendingAction();
    }
    setPendingAction(null);
  };

  const handleCallClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
        ppcId: property.ppcId,
        userPhone: property.requesterPhoneNumber,
        postedUserPhone: localStorage.getItem('phoneNumber'),
        status: "contactSend"
      });

       setApiResponse(response.data);
      setMessage({ text: "Contact saved successfully", type: "success" });
      setLocalMessage({ text: "Contact saved successfully", type: "success" });
      
      console.log("API Response:", response.data);
      
       window.location.href = `tel:${property.requesterPhoneNumber}`;
    } catch (error) {
      setMessage({ text: "Something went wrong", type: "error" });
      setLocalMessage({ text: "Something went wrong", type: "error" });
      console.error("API Error:", error);
    }
  };

  return (
    <div
      className="card p-2 w-100 w-md-50 w-lg-33"
      onClick={(e) => {
        const tag = e.target.tagName.toLowerCase();
        if (["button", "svg", "path", "a"].includes(tag)) return;
        navigate(`/detail/${property.ppcId}`);
      }}
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "15px",
        fontFamily: "Inter, sans-serif",
      }}
    >
       <Modal show={showConfirmation} onHide={() => handleConfirmation(false)} centered>
        <Modal.Body className="text-center">
          <p>Are you sure you want to add an address?</p>
          <div className="d-flex justify-content-center">
            <Button 
              variant="primary" 
              className="me-2"
              onClick={() => handleConfirmation(true)}
              style={{ background: "#2F747F", border: "none" }}
            >
              Yes
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleConfirmation(false)}
              style={{ background: "#FF4500", border: "none" }}
            >
              No
            </Button>
          </div>
        </Modal.Body>
      </Modal>

       {localMessage.text && (
        <div 
          className={`alert alert-${localMessage.type} p-2 mb-2 text-center`}
          style={{
            backgroundColor: localMessage.type === "success" ? "#d4edda" : 
                           localMessage.type === "error" ? "#f8d7da" : "#e2e3e5",
            color: localMessage.type === "success" ? "#155724" : 
                  localMessage.type === "error" ? "#721c24" : "#383d41",
            fontSize: "12px"
          }}
        >
          {localMessage.text}
        </div>
      )}

      <div className="row d-flex align-items-center">
        <div className="col-3 d-flex align-items-center justify-content-center mb-1">
          <img
            src={profil}
            alt="Profile"
            className="rounded-circle mt-2"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
        </div>
        <div className="p-0" style={{ background: "#707070", width: "2px", height: "80px" }}></div>
        <div className="col-7 p-0 ms-4">
          <div className="text-center rounded-1 w-100 mb-1" style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "14px" }}>
            ADDRESS REQUEST
          </div>
          <p className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>PUC- {property.ppcId}</p>
         
          {property.propertyMessage && (
            <span 
              className="me-2 mb-2" 
              style={{
                color: "#FF0000",
                fontWeight: "bold",
                fontSize: "12px"
              }}
            >
              {property.propertyMessage}
            </span>
          )}
          
          <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
            {property.propertyType || "N/A"} | {property.city || "N/A"}
          </h5>
        </div>
      </div>

      <div className="p-1">
        <div className="d-flex align-items-center mb-2">
          <div
            onClick={(e) => handleAddressAction(e, property.ppcId)}
            className="d-flex col-4 flex-column justify-content-between align-items-center p-3 rounded-3"
            style={{ 
              border: "2px solid #30747F", 
              color: "#30747F", 
              cursor: "pointer",
              backgroundColor: property.address ? "#e8f4f8" : "white"
            }}
          >
            <span className="rounded-circle p-1 d-flex justify-content-center align-items-center" style={{ background: "#30747F", height: '30px', width: "30px" }}>
              <FaLocationDot color="white" />
            </span>
            <p className="m-0" style={{ fontSize: "14px" }}>
              {property.address ? "Send Address" : "Add Address"}
            </p>
            {property.address && (
              <p className="m-0 text-muted" style={{ fontSize: "10px" }}>
                Click to send
              </p>
            )}
          </div>

          <div className="d-flex flex-column align-items-start justify-content-between ps-3">
            <div className="d-flex align-items-center mb-4">
              <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
              <div>
                <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Address Requested Date</h6>
                <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 500 }}>
                  {new Date(property.updatedAt || property.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center mb-1">
              <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
              <div>
                <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Buyer Phone</h6>
                <span className="card-text" style={{ fontWeight: "500" }}>
                  {property.payuStatus === "paid" ? (
                    <a
                      href={`tel:${property.requesterPhoneNumber}`}
                      style={{ textDecoration: "none", color: "#1D1D1D" }}
                      onClick={handleCallClick}
                    >
                      {showFullNumber
                        ? property.requesterPhoneNumber
                        : property.requesterPhoneNumber?.slice(0, 5) + "*****"}
                    </a>
                  ) : (
                    <span style={{ color: "#888" }}>
                      {property.requesterPhoneNumber?.slice(0, 5) + "*****"}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {property.payuStatus === "paid" ? (
          <>
            {!showFullNumber ? (
              <button
                className="w-100 m-0 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShowFullNumber();
                }}
                style={{
                  background: "#2F747F",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "5px"
                }}
              >
                View
              </button>
            ) : (
              <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
                <button
                  className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                  style={{ background: "#2F747F", fontSize: "13px" }}
                  onClick={handleCallClick}
                >
                  Call
                </button>

                {onRemove && (
                  <button
                    className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                    style={{ background: "#FF4500", fontSize: "13px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(property.ppcId);
                    }}
                  >
                    Remove
                  </button>
                )}

                {onUndo && (
                  <button
                    className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                    style={{ background: "green", fontSize: "13px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUndo(property.ppcId);
                    }}
                  >
                    Undo
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1 w-100">
            <button
              className="btn text-white px-3 py-1 mt-2 me-1 w-100"
              onClick={(e) => {
                e.stopPropagation();
                handlePayNow(property.ppcId, property.requesterPhoneNumber);
              }}
              style={{
                background: "#FFB100",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "14px",
              }}
            >
              Pay Now to Contact
            </button>

            {onRemove && (
              <button
                className="btn text-white px-3 py-1 mt-2 w-100"
                style={{ background: "#FF4500", fontSize: "13px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(property.ppcId);
                }}
              >
                Remove
              </button>
            )}

            {onUndo && (
              <button
                className="btn text-white px-3 py-1 mt-2 w-100"
                style={{ background: "green", fontSize: "13px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo(property.ppcId);
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;