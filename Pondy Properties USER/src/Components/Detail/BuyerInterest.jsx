


import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png'
import { FaCalendarAlt } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const App = () => {
  const { phoneNumber } = useParams();
  const [properties, setProperties] = useState([]);
  const [removedProperties, setRemovedProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [showFullNumber, setShowFullNumber] = useState(false);
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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertyRes = await axios.get(`${process.env.REACT_APP_API_URL}/get-interest-buyers`, {
          params: { postedPhoneNumber: phoneNumber },
        });

        const statusRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);

        if (propertyRes.status === 200 && statusRes.status === 200) {
          const statusMap = {};
          statusRes.data.forEach(({ ppcId, status }) => {
            statusMap[ppcId] = status;
          });

          let transformedProperties = propertyRes.data.propertiesData.map((property) => ({
            ...property,
            interestedUsers: property.interestedUsers.filter((user) => user && user !== "undefined"),
            payuStatus: statusMap[property.ppcId] || "unpaid",
          }));

          const propertiesWithMessages = await Promise.all(
            transformedProperties.map(async (property) => {
              try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/property-message/${property.ppcId}`);
                return {
                  ...property,
                  propertyMessage: res.data?.data?.message || null,
                };
              } catch {
                return property;
              }
            })
          );

          propertiesWithMessages.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          );

          setProperties(propertiesWithMessages);
          localStorage.setItem("interestProperties", JSON.stringify(propertiesWithMessages));
        }
      } catch (error) {
        console.error("Error fetching properties or statuses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phoneNumber]);
  
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Buyer Interest",
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
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const confirmAction = (message, action) => {
    setPopupMessage(message);
    setPopupAction(() => action);
    setShowPopup(true);
  };

  const handleRemoveProperty = async (ppcId, interestedUser) => {
    confirmAction("Are you sure you want to remove this interest?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/interest/delete/${ppcId}/${interestedUser}`);

        const updatedProperties = properties.map((property) =>
          property.ppcId === ppcId
            ? {
                ...property,
                interestedUsers: property.interestedUsers.filter((user) => user !== interestedUser),
              }
            : property
        );

        const removedItem = {
          ppcId,
          interestedUser,
        };

        setProperties(updatedProperties);
        setMessage({ text: "Interest Deleted successfully!", type: "success" });
        setRemovedProperties([...removedProperties, removedItem]);
      } catch (error) {
        setMessage({ text: "Error deleting interest.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handleUndoRemove = async (ppcId, interestedUser) => {
    confirmAction("Do you want to restore this interest?", async () => {
      try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interest/undo/${ppcId}/${interestedUser}`);
        const restoredProperty = response.data.property;

        setRemovedProperties(removedProperties.filter((item) => item.interestedUser !== interestedUser));
        setProperties((prev) =>
          prev.map((property) =>
            property.ppcId === ppcId
              ? { ...property, interestedUsers: restoredProperty.interestRequests.map(req => req.phoneNumber) }
              : property
          )
        );

        setMessage({ text: "Interest restored successfully!", type: "success" });
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Error restoring interest.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handleContact = async (ppcId, userPhone) => {
    confirmAction("Do you want to call this user?", async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
          ppcId,
          userPhone,  
          postedUserPhone: phoneNumber,  
        });

        if (response.data.success) {
          setMessage({ text: "Contact saved successfully", type: "success" });
          window.location.href = `tel:${userPhone}`;
        } else {
          setMessage({ text: response.data.message || "Contact failed", type: "error" });
        }
      } catch (error) {
        setMessage({ 
          text: error.response?.data?.message || "An error occurred", 
          type: "error" 
        });
      }
      setShowPopup(false);
    });
  };

  const navigate = useNavigate();

  const handlePayNow = (ppcId, user) => {
    navigate("/pricing-plans", {
      state: {
        phoneNumber: user.phoneNumber,
        ppcId,
      },
    });
  };

  return (
    <div className="container d-flex align-items-center justify-content-center p-0" style={{fontFamily:"Inter, sans-serif"}}>
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f4f5';
              e.currentTarget.querySelector('svg').style.color = '#00B987';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.querySelector('svg').style.color = '#30747F';
            }}
          >
            <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out', background:"transparent"}} />
          </button> 
          <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>BUYER INTEREST</h3> 
        </div>

        {/* Tabs */}
        <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button style={{ backgroundColor: '#30747F', color: 'white', width:"100%" }} onClick={() => setActiveTab("all")} className={`p-1 border-0 ${activeTab === "all" ? "active" : ""}`}>
              ALL BUYER
            </button>
          </div>

          <div className="col-6 p-0">
            <button style={{ backgroundColor: '#FFFFFF', color: 'grey', width:"100%" }} onClick={() => setActiveTab("removed")} className={`p-1 border-0 ${activeTab === "removed" ? "active" : ""}`}>
              REMOVED BUYER
            </button>
          </div>

          <div>
            {message.text && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}
            <Modal show={showPopup} onHide={() => setShowPopup(false)}>
              <Modal.Body>
                <p>{popupMessage}</p>
                <Button 
                  style={{ background: "#2F747F", width: "80px", fontSize: "13px", border:"none" }} 
                  onClick={popupAction}
                  onMouseOver={(e) => {
                    e.target.style.background = "#FF6700";
                    e.target.style.fontWeight = 600;
                    e.target.style.transition = "background 0.3s ease";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#FF4500";
                    e.target.style.fontWeight = 400;
                  }}
                >
                  Yes
                </Button>
                <Button 
                  className="ms-3" 
                  style={{ background: "#FF0000", width: "80px", fontSize: "13px", border:"none"}} 
                  onClick={() => setShowPopup(false)}
                  onMouseOver={(e) => {
                    e.target.style.background = "#029bb3";
                    e.target.style.fontWeight = 600;
                    e.target.style.transition = "background 0.3s ease";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#2F747F";
                    e.target.style.fontWeight = 400;
                  }}
                >
                  No
                </Button>
              </Modal.Body>
            </Modal>
          </div>
          
          {loading ? (
            <div className="text-center my-4" style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <span className="spinner-border text-primary" role="status" />
              <p className="mt-2">Loading properties...</p>
            </div>
          ) : activeTab === "all" ? (
            properties.length > 0 ? (
              properties.map((property, index) => (
                <div 
                  key={property.ppcId}               
                  onClick={() => navigate(`/detail/${property.ppcId}`)}
                  className="property-card"
                >
                  <div className="buyers-list">
                    {Array.isArray(property.interestedUsers) && property.interestedUsers.length > 0 ? (
                      property.interestedUsers.map((user, index) => (
                        <div
                          key={index}
                          className="card p-2 w-100 w-md-50 w-lg-33"
                          style={{
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            overflow: "hidden",
                            marginBottom: "15px",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          <div className="row d-flex align-items-center">
                            <div className="col-3 d-flex align-items-center justify-content-center mb-1">
                              <img
                                src={profil}
                                alt="Placeholder"
                                className="rounded-circle mt-2"
                                style={{ width: "80px", height: "80px", objectFit: "cover" }}
                              />
                            </div>
                            <div className='p-0' style={{background:"#707070", width:"2px", height:"80px"}}></div>
                            <div className="col-7 p-0 ms-4">
                              <div className='text-center rounded-1 w-100 mb-1' style={{border:"2px solid #30747F", color:"#30747F", fontSize:"13px"}}>
                                INTERESTED BUYER
                              </div>
                              <div className="d-flex align-items-center">
                                <p className="mb-1 me-3" style={{ color: "#474747", fontWeight: "500", fontSize:"12px" }}>
                                  PUC- {property.ppcId}
                                </p>
                                {property.propertyMessage && (
                                  <span 
                                    className="me-2" 
                                    style={{
                                      color: "#FF0000",
                                      fontWeight: "bold",
                                      fontSize: "12px"
                                    }}
                                  >
                                    {property.propertyMessage}
                                  </span>
                                )}
                              </div>
                              <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize:"16px" }}>
                                {property.propertyType || "N/A"} | {property.city || "N/A"}
                              </h5>
                            </div>
                          </div>
            
                          <div className="p-1">
                            <div className="d-flex align-items-center mb-2">
                              <div className="d-flex flex-row align-items-start justify-content-between ps-3">
                                <div className="d-flex align-items-center">
                                  <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                                  <div>
                                    <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>
                                      Buyer Phone
                                    </h6>
                                    <span className="card-text" style={{ fontWeight: "500" }}>
                                      {property.payuStatus === "paid" ? (
                                        <a href={`tel:${user}`} style={{ textDecoration: "none", color: "#1D1D1D" }}>
                                          {showFullNumber ? user : user.slice(0, 5) + "*****"}
                                        </a>
                                      ) : (
                                        <span style={{ color: "#999" }}>{user.slice(0, 5) + "*****"}</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
            
                                <div className="d-flex align-items-center ms-3">
                                  <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                                  <div>
                                    <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>
                                      Interest Received Date
                                    </h6>
                                    <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
                                      {(property.updatedAt || property.createdAt)
                                        ? new Date(property.updatedAt || property.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
            
                            {property.payuStatus === "paid" ? (
                              <>
                                {!showFullNumber && (
                                  <button
                                    className='w-100 m-0 p-1'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowFullNumber(true);
                                    }}
                                    style={{
                                      background: "#2F747F",
                                      color: "white",
                                      border: "none",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                      borderRadius: "5px"
                                    }}>
                                    View
                                  </button>
                                )}
            
                                {showFullNumber && (
                                  <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
                                    <button
                                      className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                                      style={{ background: "#2F747F", width: "80px", fontSize: "13px" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContact(property.ppcId, user);
                                      }}
                                    >
                                      Call
                                    </button>
                                    <button
                                      className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                                      style={{
                                        background: "#FF4500",
                                        color: '#fff',
                                        width: "80px",
                                        fontSize: "13px",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveProperty(property.ppcId, user);
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
                                  <button
                                    className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                                    style={{ background: "#FFB100", width: "80px", fontSize: "13px" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePayNow(property.ppcId, user);
                                    }}
                                  >
                                    Pay Now
                                  </button>
                                  <button
                                    className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                                    style={{
                                      background: "#FF4500",
                                      color: '#fff',
                                      width: "80px",
                                      fontSize: "13px",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveProperty(property.ppcId, user);
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p></p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center my-4"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}>
                <img src={NoData} alt="" width={100}/>      
                <p>No properties found.</p>
              </div>       
            )
          ) : (
            removedProperties.length > 0 ? (
              removedProperties.map((property, index) => (
                <div
                  key={property.ppcId}
                  className="card p-2 w-100 w-md-50 w-lg-33"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginBottom: "15px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <div className="row d-flex align-items-center">
                    <div className="col-3 d-flex align-items-center justify-content-center mb-1">
                      <img
                        src={profil}
                        alt="Placeholder"
                        className="rounded-circle mt-2"
                        style={{ width: "80px", height: "80px", objectFit: "cover" }}
                      />
                    </div>
                    <div className='p-0' style={{background:"#707070", width:"2px", height:"80px"}}></div>
                    <div className="col-7 p-0 ms-4">
                      <div className='text-center rounded-1 w-100 mb-1' style={{border:"2px solid #30747F", color:"#30747F", fontSize:"14px"}}>Buyer Interest</div>
                      <div className="d-flex">
                        <p className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize:"12px" }}>
                          PUC- {property.ppcId}
                        </p>
                      </div>    
        
                      <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize:"16px" }}>
                        {property.propertyType || "N/A"} | {property.city || "N/A"}
                      </h5>
                    </div>
                  </div>
        
                  <div className="p-1 mt-1">
                    <div className="d-flex align-items-center mb-2">
                      <div className="d-flex flex-row align-items-start justify-content-between ps-3">
                        <div className="d-flex align-items-center">
                          <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                              Buyer Phone
                            </h6>
                            <span className="card-text" style={{ fontWeight:"500"}}>
                              <a href={`tel:${property.interestedUser}`} style={{ textDecoration: "none", color: "#1D1D1D" }}>
                                {showFullNumber
                                  ? property.interestedUser
                                  : property.interestedUser?.slice(0, 5) + "*****"}
                              </a>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!showFullNumber && (
                      <button className='w-100 m-0 p-1'
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullNumber(true);
                        }}
                        style={{
                          background: "#2F747F", 
                          color: "white", 
                          border: "none", 
                          marginLeft: "10px", 
                          cursor: "pointer",
                          borderRadius: "5px"
                        }}>
                        View
                      </button>
                    )}
                    {showFullNumber && (
                      <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
                        <button
                          className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                          style={{ background: "#2F747F", width: "80px", fontSize: "13px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${property.interestedUser}`;
                          }}
                        >
                          Call
                        </button>   
                        <button
                          className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                          style={{
                            background: "#19575f",
                            color: '#fff',
                            width: "80px", 
                            fontSize: "13px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUndoRemove(property.ppcId, property.interestedUser);
                          }}
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center my-4"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}>
                <img src={NoData} alt="" width={100}/>      
                <p>No removed properties found.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default App;