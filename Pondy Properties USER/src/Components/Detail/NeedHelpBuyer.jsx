




import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png'
import {  FaArrowLeft, FaCalendarAlt } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const HelpRequests = () => {
  const { phoneNumber } = useParams();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [showFullNumber, setShowFullNumber] = useState(false);


  const [helpRequests, setHelpRequests] = useState([]);
  const [removedHelpRequests, setRemovedHelpRequests] = useState([]);
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
  const handleContactCall = async (ppcId, phoneNumber) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
        ppcId,
        phoneNumber,
      });
      setMessage({ text: "Contact saved successfully", type: "success" });
    } catch (error) {
      setMessage({ text: "Something went wrong", type: "error" });
    }
  };
  

  
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Owner NeedHelp",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
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

  const handleRemoveHelpRequest = async (ppcId, requesterPhoneNumber) => {
    confirmAction("Are you sure you want to remove this help request?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/help/delete/${ppcId}/${requesterPhoneNumber}`);
        setHelpRequests(helpRequests.map(property =>
          property.ppcId === ppcId
            ? {
                ...property,
                helpRequestersPhoneNumbers: property.helpRequestersPhoneNumbers.filter(phone => phone !== requesterPhoneNumber)
              }
            : property
        ));
        setRemovedHelpRequests([...removedHelpRequests, { ppcId, requesterPhoneNumber }]);
        setMessage({ text: "Help request removed successfully!", type: "success" });
      } catch (error) {
        setMessage({ text: "Error deleting help request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handleUndoHelpRequest = async (ppcId, requesterPhoneNumber) => {
    confirmAction("Do you want to restore this help request?", async () => {
      try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/help/undo/${ppcId}/${requesterPhoneNumber}`);
        const restoredProperty = response.data.property;
        setRemovedHelpRequests(removedHelpRequests.filter(item => item.requesterPhoneNumber !== requesterPhoneNumber));
        setHelpRequests(prev =>
          prev.map(property =>
            property.ppcId === ppcId
              ? { ...property, helpRequestersPhoneNumbers: restoredProperty.helpRequests.map(req => req.phoneNumber) }
              : property
          )
        );
        setMessage({ text: "Help request restored successfully!", type: "success" });
      } catch (error) {
        setMessage({ text: "Error restoring help request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

   
useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 5000);  
    return () => clearTimeout(timer); 
  }
}, [message]);

  useEffect(() => {
    const storedHelpRequests = JSON.parse(localStorage.getItem("helpRequests")) || [];
    const storedRemovedHelpRequests = JSON.parse(localStorage.getItem("removedHelpRequests")) || [];

    setHelpRequests(storedHelpRequests);
    setRemovedHelpRequests(storedRemovedHelpRequests);
  }, []);

  useEffect(() => {
    localStorage.setItem("helpRequests", JSON.stringify(helpRequests));
  }, [helpRequests]);

  useEffect(() => {
    localStorage.setItem("removedHelpRequests", JSON.stringify(removedHelpRequests));
  }, [removedHelpRequests]);


  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }
  
    const fetchHelpRequests = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-help-as-buyer`, {
          params: { postedPhoneNumber: phoneNumber },
        });
  
        if (response.status === 200) {
          const sortedHelpRequests = response.data.helpRequestsData.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
  
          setHelpRequests(sortedHelpRequests);
          localStorage.setItem("helpRequests", JSON.stringify(sortedHelpRequests));
        }
      } catch (error) {
       } finally {
        setLoading(false);
      }
    };
  
    fetchHelpRequests();
  }, [phoneNumber]);
  

  
const navigate = useNavigate();

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
    <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' , fontFamily: 'Inter, sans-serif'}}>
<div className="d-flex align-items-center justify-content-start w-100"     style={{
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
      <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
    </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>NEEDHELP OWNER</h3> </div>

<div className="row g-2 w-100">

<div className="col-6 p-0">
        <button style={{ backgroundColor: '#30747F', color: 'white' , width:"100%" }} onClick={() => setActiveTab("all")} className={activeTab === "all" ? "active" : ""}>
         ALL BUYER
        </button>
        </div>

        <div className="col-6 p-0">

        <button style={{ backgroundColor: '#FFFFFF', color: 'grey' , width:"100%" }} onClick={() => setActiveTab("removed")} className={activeTab === "removed" ? "active" : ""}>
          REMOVED BUYER
        </button>
      </div>

 
      <div>
      {message && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}
      <Modal show={showPopup} onHide={() => setShowPopup(false)}>
        <Modal.Body>
          <p>{popupMessage}</p>
          <Button variant="success" onClick={popupAction}
             onMouseOver={(e) => {
              e.target.style.background = "#FF6700"; 
              e.target.style.fontWeight = 600; 
              e.target.style.transition = "background 0.3s ease"; 
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#FF4500"; 
              e.target.style.fontWeight = 400; 
    
            }}>Yes</Button>
          <Button variant="danger ms-3" onClick={() => setShowPopup(false)}
              onMouseOver={(e) => {
                e.target.style.background = "#029bb3"; 
                e.target.style.fontWeight = 600; 
                e.target.style.transition = "background 0.3s ease"; 
      
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#2F747F"; 
                e.target.style.fontWeight = 400; 
      
              }}>No</Button>
        </Modal.Body>
      </Modal>
    </div>

   

{loading ? (
      <div className="text-center my-4 "
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',

      }}>
        <span className="spinner-border text-primary" role="status" />
        <p className="mt-2">Loading properties...</p>
      </div>) : activeTab === "all" ? (
  helpRequests.length > 0 ? (
    helpRequests.map(property => (
      <div key={property.ppcId} className="property-card">
        <div className="buyers-list m-0">
          {property.helpRequestersPhoneNumbers.length > 0 &&
            property.helpRequestersPhoneNumbers.map((user, index) => (
              <div
                key={index}
                className="card p-2 w-100 w-md-50 w-lg-33"
                onClick={() => navigate(`/detail/${property.ppcId}`)}

                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginBottom: "10px",
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
                  <div className="p-0" style={{ background: "#707070", width: "2px", height: "80px" }}></div>
                  <div className="col-7 p-0 ms-4">
                    <div className="text-center rounded-1 w-100 mb-1" style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "13px" }}>
                      HELP REQUESTED
                    </div>
                    <div className="d-flex">
                      <p className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>
                        PUC- {property.ppcId}
                      </p>
                    </div>
                    <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
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
                   

<span className="card-text" style={{ fontWeight: "500", cursor: "pointer" }}>
  {showFullNumber[index] ? (
    <span
      onClick={async (e) => {
        e.preventDefault();
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
            ppcId: property.ppcId,
            phoneNumber: user,
          });
          setMessage({ text: "Contact saved successfully", type: "success" });
        } catch (error) {
          setMessage({ text: "Something went wrong", type: "error" });
        } finally {
          window.location.href = `tel:${user}`;
        }
      }}
      style={{ textDecoration: "none", color: "#1D1D1D" }}
    >
      {user}
    </span>
  ) : (
    user?.slice(0, 5) + "*****"
  )}
</span>

                        </div>
                      </div>
                      <div className="d-flex align-items-center ms-3">
                        <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                        <div>
                          <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>
                            Help requested Date
                          </h6>
                          <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
                            {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!showFullNumber[index] ? (
                    <button
                      className="w-100 m-0 p-1"
                      onClick={(e) => 
                        {e.stopPropagation();
                        setShowFullNumber(prev => ({ ...prev, [index]: true }))}}
                      style={{
                        background: "#2F747F",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "5px",
                      }}
                    >
                      View
                    </button>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
           

<button
  className="btn text-white px-3 py-1 flex-grow-1 mx-1"
  style={{ background: "#2F747F", fontSize: "13px" }}
  onClick={async (e) => {
    e.stopPropagation();handleContactCall(property.ppcId, user);
    window.location.href = `tel:${user}`;
  }}
>
  Call
</button>

                      <button
                        className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                        style={{ background: "#FF0000", fontSize: "13px" }}
                        onMouseOver={(e) => {
                          e.target.style.background = "#FF6700"; 
                          e.target.style.fontWeight = 600; 
                          e.target.style.transition = "background 0.3s ease"; 
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "#FF4500"; 
                          e.target.style.fontWeight = 400; 
                
                        }}
                        onClick={(e) =>{e.stopPropagation();
                           handleRemoveHelpRequest(property.ppcId, user)}}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    ))
  ) : (
         <div className="text-center my-4 "
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
          
                }}>
        <img src={NoData} alt="" width={100}/>      
        <p>No help request found.</p>
        </div> 
  )


      ) : (
        removedHelpRequests.length > 0 ? (
          removedHelpRequests.map((property, index) => (
          
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
                <div className='text-center rounded-1 w-100 mb-1' style={{border:"2px solid #30747F", color:"#30747F", fontSize:"14px"}}>HELP REQUESTED </div>
                <div className="d-flex">
                  <p className="mb-1" style={{ color: "#474747", fontWeight: "500",fontSize:"12px" }}>
                  PUC- {property.ppcId}
                  </p>
                </div>    
      
                <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500",fontSize:"16px" }}>
                  {property.propertyType || "N/A"} |{property.city || "N/A"}
                </h5>
             
              </div>
            </div>
      
            <div className="p-1 mt-1">
      
              <div className="d-flex align-items-center mb-2">
              <div className="d-flex  flex-row align-items-start justify-content-between ps-3">
      
              
                <div className="d-flex align-items-center">
                  <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                  <div>
                    <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                       Buyer Phone
                    </h6>
                    <span className="card-text" style={{  fontWeight:"500"}}>
                    <a href={`tel:${property.requesterPhoneNumber}`} style={{ textDecoration: "none", color: "#1D1D1D" }}>
          {showFullNumber
            ? property.requesterPhoneNumber
            : property.requesterPhoneNumber?.slice(0, 5) + "*****"}
        </a>
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center  ms-3">
                  <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                  <div>
                    <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                      Help Received Date
                    </h6>
                    <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500"}}>
                    {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                </div>
                          </div>
              {!showFullNumber && (
          <button className='w-100 m-0 p-1'
            onClick={(e) =>{e.stopPropagation();
               setShowFullNumber(true)}}
            style={{
              background: "#2F747F", 
              color: "white", 
              border: "none", 
             
              marginLeft: "10px", 
              cursor: "pointer",
              borderRadius: "5px"
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#029bb3"; 
              e.target.style.fontWeight = 600; 
              e.target.style.transition = "background 0.3s ease"; 
    
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#2F747F"; 
              e.target.style.fontWeight = 400; 
    
            }}>
            View
          </button>
        )}
          {showFullNumber
            ?  <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
          
                  <button className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                    style={{ background:  "green", width: "80px", fontSize: "13px" }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#32cd32"; 
                      e.target.style.fontWeight = 600; 
                      e.target.style.transition = "background 0.3s ease"; 
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#39ff14"; 
                      e.target.style.fontWeight = 400; 
            
                    }}
                    onClick={(e) =>{e.stopPropagation();
                     handleUndoHelpRequest(property.ppcId, property.requesterPhoneNumber)}}> Undo</button>

            </div>
            : ''}
            </div>
          </div>

          ))
        ) : (
               <div className="text-center my-4 "
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
      )}
           </div>

</div>
    </div>
  );
};

export default HelpRequests;






