



import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png';
import { FaCalendarAlt } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const ContactBuyer = () => {
  const { phoneNumber } = useParams();
  const [contactRequests, setContactRequests] = useState([]);
  const [removedContacts, setRemovedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [showFullNumber, setShowFullNumber] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();
  const [statusMap, setStatusMap] = useState({});
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const storedRemovedContacts = JSON.parse(localStorage.getItem("removedContacts")) || [];
    setRemovedContacts(storedRemovedContacts);
  }, []);

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
          viewedFile: "Owner Contact",
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

  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const contactRes = await axios.get(`${process.env.REACT_APP_API_URL}/get-contact-buyer`, {
          params: { postedPhoneNumber: phoneNumber }
        });

        const statusRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);

        if (contactRes.status === 200 && statusRes.status === 200) {
          const statusMap = {};
          statusRes.data.forEach(({ ppcId, status }) => {
            if (ppcId) statusMap[ppcId] = status;
          });
          setStatusMap(statusMap);

          let requestsData = Array.isArray(contactRes.data)
            ? contactRes.data
            : contactRes.data.contactRequestsData || [];

          const transformed = await Promise.all(
            requestsData.flatMap(async (property) => {
              if (!Array.isArray(property.contactRequestersPhoneNumbers)) return [];

              const uniquePhones = [...new Set(property.contactRequestersPhoneNumbers)];
              let propertyMessage = null;

              try {
                const messageRes = await axios.get(
                  `${process.env.REACT_APP_API_URL}/user/property-message/${property.ppcId}`
                );
                propertyMessage = messageRes.data?.data?.message || null;
              } catch {
                propertyMessage = null;
              }

              return uniquePhones
                .filter((phone) => phone && phone !== "undefined" && phone !== "null")
                .map((phone) => ({
                  phoneNumber: phone,
                  ppcId: property.ppcId || "N/A",
                  propertyType: property.propertyType || "N/A",
                  city: property.propertyDetails?.city || "N/A",
                  createdAt: property.createdAt || new Date().toISOString(),
                  updatedAt: property.updatedAt || null,
                  _id: `${property._id}-${phone}`,
                  payuStatus: statusMap[property.ppcId] || "unpaid",
                  propertyDetails: property.propertyDetails || {},
                  propertyMessage,
                }));
            })
          );

          const sortedRequests = transformed
            .flat()
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

          const filteredRequests = sortedRequests.filter(
            contact => !removedContacts.some(removed => removed._id === contact._id)
          );

          setContactRequests(filteredRequests);
          localStorage.setItem("contactedBuyers", JSON.stringify(filteredRequests));
        } else {
          setMessage({ text: "Unable to load contacts", type: "error" });
        }
      } catch (error) {
        console.error("Error fetching contact or payment data:", error);
        setMessage({ text: "Error loading contact requests", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phoneNumber, removedContacts]);

  const handleRemoveContact = (contactId) => {
    confirmAction("Are you sure you want to remove this contact request?", () => {
      const contact = contactRequests.find(req => req._id === contactId);
      if (!contact) return;
      
      const updatedRemovedContacts = [...removedContacts, contact];
      setRemovedContacts(updatedRemovedContacts);
      localStorage.setItem("removedContacts", JSON.stringify(updatedRemovedContacts));
      
      setContactRequests(prev => prev.filter(req => req._id !== contactId));
      
      setMessage({ text: "Contact request removed", type: "success" });
      setShowPopup(false);
    });
  };

  const handleUndoRemove = (contactId) => {
    confirmAction("Do you want to restore this contact request?", () => {
      const contact = removedContacts.find(req => req._id === contactId);
      if (!contact) return;
      
      const updatedRemovedContacts = removedContacts.filter(req => req._id !== contactId);
      setRemovedContacts(updatedRemovedContacts);
      localStorage.setItem("removedContacts", JSON.stringify(updatedRemovedContacts));
      
      setContactRequests(prev => [...prev, contact]);
      
      setMessage({ text: "Contact request restored", type: "success" });
      setShowPopup(false);
    });
  };

  const toggleShowNumber = (id) => {
    setShowFullNumber(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handlePayNow = (ppcId, user) => {
    navigate("/pricing-plans", {
      state: {
        phoneNumber: user,
        ppcId,
      },
    });
  };

  const handleContact = async (ppcId, userPhone) => {
    confirmAction("Do you want to call this buyer?", async () => {
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

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0"
        style={{ maxWidth: '500px', margin: 'auto', width: '100%', background: "#F7F7F7", fontFamily: 'Inter, sans-serif' }}>
        
        <div className="row g-2 w-100">
          <div className="d-flex align-items-center justify-content-start w-100"
            style={{
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
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaArrowLeft style={{ color: '#30747F' }} />
            </button>
            <h3 className="m-0 ms-3" style={{ fontSize: "20px" }}>CONTACTED BUYERS</h3>
          </div>

          <div className="col-6 p-0">
            <button
              style={{
                backgroundColor: activeTab === "all" ? '#30747F' : '#FFFFFF',
                color: activeTab === "all" ? 'white' : 'grey',
                width: "100%", border: "none", padding: "10px", fontWeight: "500"
              }}
              onClick={() => setActiveTab("all")}
            >ALL BUYER</button>
          </div>

          <div className="col-6 p-0">
            <button
              style={{
                backgroundColor: activeTab === "removed" ? '#30747F' : '#FFFFFF',
                color: activeTab === "removed" ? 'white' : 'grey',
                width: "100%", border: "none", padding: "10px", fontWeight: "500"
              }}
              onClick={() => setActiveTab("removed")}
            >REMOVED BUYER</button>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type === "success" ? "success" : message.type === "error" ? "danger" : "info"} mt-2 p-2 text-center`}>
              {message.text}
            </div>
          )}

          <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
            <Modal.Body className="text-center">
              <p className="mb-3">{popupMessage}</p>
              <div className="d-flex justify-content-center">
                <Button style={{ background: "#2F747F", width: "80px", fontSize: "13px", border: "none" }} onClick={popupAction}>Yes</Button>
                <Button className="ms-3" style={{ background: "#FF0000", width: "80px", fontSize: "13px", border: "none" }} onClick={() => setShowPopup(false)}>No</Button>
              </div>
            </Modal.Body>
          </Modal>

          {loading && (
            <div className="text-center my-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <span className="spinner-border text-primary" role="status" />
              <p className="mt-2">Loading contacts...</p>
            </div>
          )}

          {!loading && activeTab === "all" && (
            contactRequests.length > 0 ? (
              contactRequests.map((contact) => {
                const contactId = contact._id;
                const isPaid = statusMap[contact.ppcId] === "paid";

                return (
                  <div key={contactId} className="card p-2 mb-3" onClick={() => navigate(`/detail/${contact.ppcId}`)}
                    style={{ border: "1px solid #ddd", borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>

                    <div className="row d-flex align-items-center">
                      <div className="col-3 d-flex align-items-center justify-content-center mb-1">
                        <img src={profil} alt="Profile" className="rounded-circle mt-2" style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                      </div>
                      <div className='p-0' style={{ background: "#707070", width: "2px", height: "80px" }}></div>
                      <div className="col-7 p-0 ms-4">
                        <div className='text-center rounded-1 w-100 mb-1'
                          style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "13px" }}>
                          BUYER CONTACTED
                        </div>
                        <p className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>
                          PUC- {contact.ppcId}
                        </p>
                        {contact.propertyMessage && (
                          <span 
                            className="me-2" 
                            style={{
                              color: "#FF0000",
                              fontWeight: "bold",
                              fontSize: "12px"
                            }}
                          >
                            {contact.propertyMessage}
                          </span>
                        )}
                        <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
                          {contact.propertyType} | {contact.city}
                        </h5>
                      </div>
                    </div>

                    <div className="p-1">
                      <div className="d-flex align-items-center mb-2">
                        <div className="d-flex flex-row align-items-start justify-content-around w-100">

                          <div className="d-flex align-items-center ms-2">
                            <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                            <div>
                              <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Buyer Phone</h6>
                              <span style={{ color: "#1D1D1D", fontWeight: "500" }}>
                                {contact.phoneNumber
                                  ? (showFullNumber[contactId] || isPaid
                                      ? contact.phoneNumber
                                      : contact.phoneNumber.slice(0, 5) + "*****")
                                  : "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center me-2">
                            <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                            <div>
                              <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>CONTACTED DATE</h6>
                              <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
                                {(contact.updatedAt || contact.createdAt)
                                  ? new Date(contact.updatedAt || contact.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric"
                                  })
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isPaid ? (
                        !showFullNumber[contactId] ? (
                          <button className='w-100 m-0 p-1'
                            onClick={(e) => { e.stopPropagation(); toggleShowNumber(contactId); }}
                            style={{ background: "#2F747F", color: "white", border: "none", borderRadius: "5px" }}>
                            View
                          </button>
                        ) : (
                          <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
                            <button className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                              style={{ background: "#2F747F", fontSize: "13px" }}
                              onClick={(e) => { e.stopPropagation(); handleContact(contact.ppcId, contact.phoneNumber); }}>
                              Call
                            </button>
                            <button className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                              style={{ background: "#FF0000", fontSize: "13px" }}
                              onClick={(e) => { e.stopPropagation(); handleRemoveContact(contact._id); }}>
                              Remove
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
                          <button className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                            style={{ background: "#FFB100", fontSize: "13px" }}
                            onClick={(e) => { e.stopPropagation(); handlePayNow(contact.ppcId, contact.phoneNumber); }}>
                            Pay Now
                          </button>
                          <button className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                            style={{ background: "#FF0000", fontSize: "13px" }}
                            onClick={(e) => { e.stopPropagation(); handleRemoveContact(contact._id); }}>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center my-4"
                style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <img src={NoData} alt="No data" width={100} />
                <p className="mt-2">No contact requests found</p>
              </div>
            )
          )}

          {!loading && activeTab === "removed" && (
            removedContacts.length > 0 ? (
              removedContacts.map((contact) => {
                const contactId = `removed-${contact._id}`;
                return (
                  <div
                    key={contactId}
                    className="card p-2 mb-3"
                    onClick={() => navigate(`/detail/${contact.ppcId}`)}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <div className="row d-flex align-items-center">
                      <div className="col-3 d-flex align-items-center justify-content-center mb-1">
                        <img
                          src={profil}
                          alt="Profile"
                          className="rounded-circle mt-2"
                          style={{ width: "80px", height: "80px", objectFit: "cover" }}
                        />
                      </div>
                      <div className='p-0' style={{ background: "#707070", width: "2px", height: "80px" }}></div>
                      <div className="col-7 p-0 ms-4">
                        <div className='text-center rounded-1 w-100 mb-1' 
                          style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "14px" }}>
                          REMOVED BUYER
                        </div>
                        <p className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>
                          PUC- {contact.ppcId}
                        </p>
                       
                        <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
                          {contact.propertyType} | {contact.city}
                        </h5>
                      </div>
                    </div>
                    <div className="p-1 mt-1">
                      <div className="d-flex align-items-center mb-2">
                        <div className="d-flex flex-row align-items-center justify-content-around w-100">
                          <div className="d-flex align-items-center ms-2">
                            <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                            <div>
                              <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>Buyer Phone</h6>
                              <span className="card-text" style={{ fontWeight: "500" }}>
                                {showFullNumber[contactId] ? contact.phoneNumber : contact.phoneNumber?.slice(0, 5) + "*****"}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center me-2">
                            <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                            <div>
                              <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>REMOVED DATE</h6>
                              <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
                                {new Date().toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn text-white w-100"
                        style={{ background: "green", fontSize: "13px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUndoRemove(contact._id);
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center my-4"
                style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <img src={NoData} alt="No data" width={100} />
                <p className="mt-2">No removed requests found</p>
              </div>
            )
          )}

           
        </div>
      </div>
    </div>
  );
};

export default ContactBuyer;

