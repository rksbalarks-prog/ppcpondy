 



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaRupeeSign, FaBed,  
  FaCalendarAlt, FaUserAlt, FaRulerCombined,
  FaCamera,
  FaEye,
  FaPhoneAlt
} from "react-icons/fa";
import myImage from '../../Assets/Rectangle 146.png';
import myImage1 from '../../Assets/Rectangle 145.png';
import pic from '../../Assets/Default image_PP-01.png';
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png';
import { TbCameraPlus } from "react-icons/tb";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

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
          viewedFile: "Photo request Buyer",
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

  const handleRemoveProperty = async (ppcId, requesterPhoneNumber) => {
    confirmAction("Are you sure you want to remove this Photo request?", async () => {
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/photo-requests/delete/${ppcId}/${requesterPhoneNumber}`
        );

        if (response.status === 200) {
          setMessage({ text: "Photo request marked as deleted.", type: "success" });

          const deletedRequest = response.data.request;

          setProperties((prev) =>
            prev.filter(
              (prop) =>
                !(prop.ppcId === ppcId && prop.requesterPhoneNumber === requesterPhoneNumber)
            )
          );

          setRemovedProperties((prev) => {
            const updated = [...prev, deletedRequest];
            localStorage.setItem("removedProperties", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Error deleting photo request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handleUndoRemove = async (ppcId, requesterPhoneNumber) => {
    confirmAction("Do you want to restore this Photo request buyer?", async () => {
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/photo-requests/undo/${ppcId}/${requesterPhoneNumber}`
        );

        if (response.status === 200) {
          setMessage({ text: "Photo request restored.", type: "success" });

          const restoredProperty = response.data.request;

          setRemovedProperties((prev) => {
            const updated = prev.filter(
              (prop) =>
                !(prop.ppcId === ppcId && prop.requesterPhoneNumber === requesterPhoneNumber)
            );
            localStorage.setItem("removedProperties", JSON.stringify(updated));
            return updated;
          });

          setProperties((prev) => [...prev, restoredProperty]);
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Error restoring photo request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  useEffect(() => {
    if (!phoneNumber) {
      setMessage({ text: "Phone number is missing.", type: "error" });
      setLoading(false);
      return;
    }

    const fetchPhotoRequestsWithPayuStatus = async () => {
      try {
        setLoading(true);

        const statusRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);
        const photoRes = await axios.get(`${process.env.REACT_APP_API_URL}/photo-requests/buyer/${phoneNumber}`);

        if (statusRes.status === 200 && photoRes.status === 200) {
          const statusMap = {};
          statusRes.data.forEach(({ ppcId, status }) => {
            if (ppcId) statusMap[ppcId] = status;
          });

          const rawData = Array.isArray(photoRes.data) ? photoRes.data : [];

          const enriched = await Promise.all(
            rawData.map(async (property) => {
              let propertyMessage = null;

              try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/property-message/${property.ppcId}`);
                propertyMessage = res.data?.data?.message || null;
              } catch {
                propertyMessage = null;
              }

              return {
                ...property,
                payuStatus: statusMap[property.ppcId] || "unpaid",
                requesterPhoneNumber: property.requesterPhoneNumber || property.phoneNumber,
                propertyMessage,
              };
            })
          );

          const sorted = enriched.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          );

          setProperties(sorted);
          localStorage.setItem("photoRequests", JSON.stringify(sorted));
        } else {
          setMessage({ text: "No photo requests found.", type: "info" });
        }
      } catch (error) {
        console.error("Error loading photo request or PayU data:", error);
        setMessage({ text: "Error fetching photo requests.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoRequestsWithPayuStatus();
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

  const activeProperties = properties.filter(
    (property) =>
      ["photo request pending", "photo send", "photo request rejected"].includes(property.status) &&
      !removedProperties.some(
        (removed) => removed.ppcId === property.ppcId && removed.requesterPhoneNumber === property.requesterPhoneNumber
      )
  );

 


  const PropertyCard = ({ property, onRemove, onUndo }) => {
    const [showFullNumber, setShowFullNumber] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [apiResponse, setApiResponse] = useState(null);
    const navigate = useNavigate();

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
        console.log("API Response:", response.data);
        
        window.location.href = `tel:${property.requesterPhoneNumber}`;
      } catch (error) {
        setMessage({ text: "Something went wrong", type: "error" });
        console.error("API Error:", error);
      }
    };

    const handleUploadPhoto = async (ppcId, requesterPhoneNumber, file) => {
      try {
        const formData = new FormData();
        formData.append("photo", file);
    
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/photos/send/${ppcId}/${requesterPhoneNumber}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
    
        if (response.status === 200) {
          setMessage({ text: "Photo uploaded successfully.", type: "success" });
          setProperties((prevProperties) =>
            prevProperties.map((prop) =>
              prop.ppcId === ppcId && prop.requesterPhoneNumber === requesterPhoneNumber
                ? { 
                    ...prop, 
                    status: "photo send",
                    photos: [...(prop.photos || []), response.data.request.photoPath] 
                  }
                : prop
            )
          );
        }
      } catch (error) {
        setMessage({ text: "Error uploading photo.", type: "error" });
      }
    };

    const handleAcceptPhotoRequest = (ppcId, requesterPhoneNumber) => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          handleUploadPhoto(ppcId, requesterPhoneNumber, file);
        }
      };
      fileInput.click();
    };

    const handleRejectPhotoRequest = async (ppcId, requesterPhoneNumber) => {
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/photo-requests/reject/${ppcId}`,
          { requesterPhoneNumber }
        );

        if (response.status === 200) {
          setMessage({ text: "Photo request rejected.", type: "success" });
          setProperties((prevProperties) =>
            prevProperties.map((prop) =>
              prop.ppcId === ppcId && prop.requesterPhoneNumber === requesterPhoneNumber
                ? { ...prop, status: "photo request rejected" }
                : prop
            )
          );
        }
      } catch (error) {
        setMessage({ text: "Error rejecting photo request.", type: "error" });
      }
    };

    const handlePayNow = (ppcId) => {
      navigate("/pricing-plans", {
        state: {
          phoneNumber: phoneNumber,
          ppcId,
        },
      });
    };

    return (
      
      <div
        key={property.ppcId}
        className="card p-2 w-100"
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
              PHOTO REQUEST
            </div>
            <p className="mb-1 me-3" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>PUC- {property.ppcId}</p>
            
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
            <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
              {property.propertyType || "N/A"} | {property.city || "N/A"}
            </h5>
          </div>
        </div>

        <div className="p-1">
          <div className="d-flex align-items-center mb-2">
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptPhotoRequest(property.ppcId, property.requesterPhoneNumber);
              }}
              className="d-flex col-4 flex-column justify-content-between align-items-center p-3 rounded-3"
              style={{ border: "2px solid #30747F", color: "#30747F", cursor: "pointer" }}
            >
              <span className="rounded-circle p-1 d-flex justify-content-center align-items-center" style={{ background: "#30747F", height: '30px', width: "30px" }}>
                <TbCameraPlus color="white" />
              </span>
              <p className="m-0" style={{ fontSize: "14px" }}>Add Property</p>
              <p className="m-0" style={{ fontSize: "14px" }}>Image</p>
            </div>

            <div className="d-flex flex-column align-items-start justify-content-between ps-3">
              <div className="d-flex align-items-center mb-4">
                <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                <div>
                  <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Photo Requested Date</h6>
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
                  {property.payuStatus === "paid" ? (
                    <span className="card-text" style={{ fontWeight: "500" }}>
                      <a
                        href={`tel:${property.requesterPhoneNumber}`}
                        style={{ textDecoration: "none", color: "#1D1D1D" }}
                        onClick={handleCallClick}
                      >
                        {showFullNumber
                          ? property.requesterPhoneNumber
                          : property.requesterPhoneNumber?.slice(0, 5) + "*****"}
                      </a>
                    </span>
                  ) : (
                    <span style={{ color: "#888" }}>{property.requesterPhoneNumber?.slice(0, 5) + "*****"}</span>
                  )}
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
                    setShowFullNumber(true);
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
                  {property.status !== "photo request rejected" && (
                    <button
                      className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                      style={{ background: "#FF0000", fontSize: "11px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectPhotoRequest(property.ppcId, property.requesterPhoneNumber);
                      }}
                    >
                      Reject
                    </button>
                  )}

                  <button
                    className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                    style={{ background: "#2F747F", fontSize: "13px" }}
                    onClick={handleCallClick}
                    onMouseOver={(e) => {
                      e.target.style.background = "#029bb3";
                      e.target.style.fontWeight = 600;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#2F747F";
                      e.target.style.fontWeight = 400;
                    }}
                  >
                    Call
                  </button>

                  {onRemove && (
                    <button
                      className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                      style={{ background: "#FF4500", fontSize: "13px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(property.ppcId, property.requesterPhoneNumber);
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
                        onUndo(property.ppcId, property.requesterPhoneNumber);
                      }}
                    >
                      Undo
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1 w-100">
                <button
                  className="btn text-white px-3 py-1 mt-2 me-1 w-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayNow(property.ppcId);
                  }}
                  style={{
                    background: "#FFB100",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "14px",
                    marginTop: "5px"
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
                      onRemove(property.ppcId, property.requesterPhoneNumber);
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
                      onUndo(property.ppcId, property.requesterPhoneNumber);
                    }}
                  >
                    Undo
                  </button>
                )}
              </div>
            </>
          )}

          {message.text && (
            <div style={{
              color: message.type === "success" ? "green" : "red",
              fontSize: "12px",
              marginTop: "10px"
            }}>
              {message.text}
            </div>
          )}
 

      
        </div>
      </div>
    );
  };

  const PropertyList = ({ properties, onRemove, onUndo }) => {
    return properties.length === 0 ? (
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
    ) : (
      <div className="row mt-4 w-100">
        {properties.map((property) => (
          <div className="col-12 mb-1 p-0" key={`${property.ppcId}-${property.requesterPhoneNumber}`}>
            <PropertyCard
              property={property}
              onRemove={onRemove}
              onUndo={onUndo}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%', fontFamily: 'Inter, sans-serif'}}>
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
            <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out', background:"transparent" }} />
          </button> 
          <h3 className="m-0" style={{fontSize:"20px"}}>PHOTO REQUESTED BUYERS</h3> 
        </div>
        
        <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#30747F', color: 'white' }} onClick={() => setActiveKey("All")}>
              ALL BUYER
            </button>
          </div>
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#FFFFFF', color: 'grey' }} onClick={() => setActiveKey("Removed")}>
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

          <div className="col-12">
            <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: '500px' }}>
              {loading ? (
                <div className="text-center my-4"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}>
                  <span className="spinner-border text-primary" role="status" />
                  <p className="mt-2">Loading properties...</p>
                </div>
              ) : activeKey === "All" ? (
                <PropertyList
                  properties={activeProperties}
                  onRemove={handleRemoveProperty}
                />
              ) : (
                <PropertyList
                  properties={removedProperties.filter(property => property.status === "deleted")}
                  onUndo={handleUndoRemove}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;