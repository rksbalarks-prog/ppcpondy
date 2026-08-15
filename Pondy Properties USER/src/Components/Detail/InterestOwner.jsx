







import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {FaCamera, FaEye , FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { MdCall } from "react-icons/md";
import myImage from '../../Assets/Rectangle 146.png'; 
import myImage1 from '../../Assets/Rectangle 145.png'; 
import pic from '../../Assets/Default image_PP-01.png'; 
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const ConfirmationModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    },
    modal: {
      background: '#fff',
      padding: '20px 30px',
      borderRadius: '10px',
      textAlign: 'center',
      minWidth: '300px'
    },
    buttons: {
      display: 'flex',
       marginTop: '20px'
    },
    yes: {
      background: '#2F747F',
      color: '#fff',
      padding: '8px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    },
    no: {
      background: '#FF4500',
      color: '#fff',
      padding: '8px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginLeft:'10px'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h5>Confirmation</h5>
        <p>{message}</p>
        <div style={styles.buttons}>
        <button style={styles.yes} onClick={onConfirm} 
          onMouseOver={(e) => {
            e.target.style.background = "#029bb3"; 
            e.target.style.fontWeight = 600; 
            e.target.style.transition = "background 0.3s ease"; 
  
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#2F747F"; 
            e.target.style.fontWeight = 400; 
  
          }}
               >Yes</button>
          <button style={styles.no} onClick={onClose}  onMouseOver={(e) => {
          e.target.style.background = "#FF6700"; 
          e.target.style.fontWeight = 600; 
          e.target.style.transition = "background 0.3s ease"; 
        }}
        onMouseOut={(e) => {
          e.target.style.background = "#FF4500"; 
          e.target.style.fontWeight = 400; 

        }}>No</button>
        </div>
      </div>
    </div>
  );
};

 



const PropertyCard = ({ property, onRemoveClick, onUndoClick }) => {
  const navigate = useNavigate();
  const { phoneNumber } = useParams();  

  const [message, setMessage] = useState({ text: "", type: "" });
  const [finalContactNumber, setFinalContactNumber] = useState(null);
  const [imageCounts, setImageCounts] = useState({});

   useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);



  const handleRevealClick = () => {
  setFinalContactNumber(property?.postedUserPhoneNumber); 
};

  const handleCardClick = () => {
    if (property?.ppcId) {
      navigate(`/detail/${property.ppcId}`);
    }
  };

  const handleContactClick = async (e) => {
    e.stopPropagation();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/contact-send-property`,
        {
          ppcId: property.ppcId,
          postedUserPhone: property.postedUserPhoneNumber,
          userPhone: phoneNumber,
        }
      );

      const {
        success,
        setPpcId,
        assignedPhoneNumber,
        postedUserPhoneNumber,
      } = response.data;

      if (success) {
        const finalContact = setPpcId ? assignedPhoneNumber : postedUserPhoneNumber;
        setFinalContactNumber(finalContact);
        setMessage({ text: "Contact saved successfully", type: "success" });
      } else {
        setMessage({ text: "Contact failed", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred", type: "error" });
    }
  };

  const fetchImageCount = async (ppcId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/uploads-count`, {
        params: { ppcId },
      });
      return response.data.uploadedImagesCount || 0;
    } catch (error) {
      return 0;
    }
  };

  useEffect(() => {
    const fetchImageCountForProperty = async () => {
      if (property?.ppcId) {
        const count = await fetchImageCount(property.ppcId);
        setImageCounts((prev) => ({
          ...prev,
          [property.ppcId]: count,
        }));
      }
    };
    fetchImageCountForProperty();
  }, [property]);

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

  return (
    <div>
      {message?.text && (
        <p style={{ color: message.type === "success" ? "green" : "red", fontSize: "14px" }}>{message.text}</p>
      )}

      <div
        className="row g-0 rounded-4 mb-2"
        style={{ border: '1px solid #ddd', overflow: "hidden", background: "#EFEFEF" }}
        onClick={handleCardClick}
      >
         <div className="col-md-4 col-4 d-flex flex-column justify-content-between align-items-center">
          <div className="text-white py-1 px-2 text-center" style={{ width: '100%', background: "#2F747F" }}>
            PUC- {property.ppcId}
          </div>

          <div style={{ position: "relative", width: "100%", height: '170px' }}>
            <img
              src={
                property.photos && property.photos.length > 0
                  ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
                  : pic
              }
              alt={`property-${property.ppcId}`}
              className="img-fluid"
              style={{
                objectFit: "cover",
                objectPosition: "center",
                width: "100%",
                height: "160px",
                borderRadius: "15px",
              }}
            />

            <div className="d-flex justify-content-between w-100" style={{ position: "absolute", bottom: "0px" }}>
              <span className="d-flex justify-content-center align-items-center"
                style={{ color: '#fff', background: `url(${myImage})`, backgroundSize: "cover", fontSize: '12px', width: '50px' }}>
                <FaCamera className="me-1" /> {imageCounts[property.ppcId] || 0}
              </span>
              <span className="d-flex justify-content-center align-items-center"
                style={{ color: '#fff', background: `url(${myImage1})`, backgroundSize: "cover", fontSize: '12px', width: '50px' }}>
                <FaEye className="me-1" /> {property.views}
              </span>
            </div>
          </div>
        </div>

         <div className="col-md-8 col-8" style={{ paddingLeft: "10px", background: "#F5F5F5" }}>
          <div className="d-flex justify-content-between">
            <p className="m-0" style={{ color: '#5E5E5E', fontSize: "13px" }}>{property.propertyMode || 'N/A'}</p>

            {property.propertyMessage && (
              <span className="me-2 mt-2" style={{ color: "#FF0000", fontWeight: "bold", fontSize: "12px" }}>
                {property.propertyMessage}
              </span>
            )}

            {onRemoveClick && (
              <p className="m-0 ps-3 pe-3" style={{
                fontSize: "12px",
                background: "#FF4F00", color: "white", cursor: "pointer",
                borderRadius: "0px 0px 0px 15px"
              }}
                onClick={(e) => { e.stopPropagation(); onRemoveClick(property); }}>
                Remove
              </p>
            )}

            {onUndoClick && (
              <p className="m-0 ps-3 pe-3" style={{
                fontSize: "12px",
                background: "green", color: "white", cursor: "pointer",
                borderRadius: "0px 0px 0px 15px"
              }}
                onClick={(e) => { e.stopPropagation(); onUndoClick(property); }}>
                Undo
              </p>
            )}
          </div>

          <p className="fw-bold m-0" style={{ color: '#000000', fontSize: "15px" }}>{property.propertyType || 'N/A'}</p>

          <p className="m-0" style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}>
            {(() => {
              const locs = [property.nagar, property.area, property.city, property.district, property.state]
                .filter(Boolean);
              if (locs.length === 0) return <>N/A, N/A</>;
              return locs.slice(0, 3).map((val, idx) => (
                <span key={idx}>{val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}{idx < 2 ? ", " : ""}</span>
              ));
            })()}
          </p>

          <div className="card-body ps-2 m-0 pt-0 pe-2 d-flex flex-column justify-content-center">
            <div className="row">
              <div className="col-6 d-flex align-items-center p-1">
                <FaRulerCombined className="me-2" color="#2F747F" />
                <span style={{ fontSize: '13px', color: '#5E5E5E' }}>{property.totalArea || 'N/A'}</span>
              </div>
              <div className="col-6 d-flex align-items-center p-1">
                <FaBed className="me-2" color="#2F747F" />
                <span style={{ fontSize: '13px', color: '#5E5E5E' }}>{property.bedrooms || 'N/A'} BHK</span>
              </div>
              <div className="col-6 d-flex align-items-center p-1">
                <FaUserAlt className="me-2" color="#2F747F" />
                <span style={{ fontSize: '13px', color: '#5E5E5E' }}>{property.postedBy || 'N/A'}</span>
              </div>
              <div className="col-6 d-flex align-items-center p-1">
                <FaCalendarAlt className="me-2" color="#2F747F" />
                <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 500 }}>
                  {property.updatedAt
                    ? new Date(property.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                    : new Date(property.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="col-12 d-flex flex-col align-items-center p-1">
                <h6 className="m-0">
                  <span style={{ fontSize: '15px', color: '#2F747F', fontWeight: 'bold', letterSpacing: "1px" }}>
                    <FaRupeeSign className="me-2" color="#2F747F" />
                    {property.price ? formatPrice(property.price) : 'N/A'}
                  </span>
                  <span style={{ color: '#2F747F', fontSize: '11px', marginLeft: "5px" }}>Negotiable</span>
                </h6>
              </div>

      

{finalContactNumber ? (
  <div className="p-1 mt-2 d-flex align-items-center">
    <MdCall className="me-2" color="#2F747F" />
    <a
      href={`tel:${finalContactNumber}`}
      style={{ color: "#2F747F", textDecoration: "none", fontSize: "14px" }}
      onClick={(e) => {
        e.stopPropagation();  
        handleContactClick(e);  
      }}
    >
      {finalContactNumber}
    </a>
  </div>
) : (
  <p
    className="p-1 mt-2 d-flex align-items-center"
    onClick={(e) => {
      e.stopPropagation();  
      handleRevealClick(); 
    }}
    style={{ color: "#2E7480", margin: "0px", cursor: "pointer" }}
  >
    <MdCall className="me-2" color="#2F747F" />
    <span style={{ fontSize: "12px" }}>Click to show number</span>
  </p>
)}



            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyList = ({ properties, onRemoveClick, onUndoClick }) => {
  return properties.length === 0 ? (
<div className="text-center my-4 "
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',

    }}>
<img src={NoData} alt="" width={100}/>      
<p>No properties found.</p>
</div>  ) : (
    <div className="row mt-4 w-100">
      {properties.map((property) => (
        <PropertyCard key={property.ppcId} property={property} onRemoveClick={onRemoveClick} onUndoClick={onUndoClick} />
      ))}
    </div>
  );
};

const App = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState("All");
  const { phoneNumber } = useParams();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [modal, setModal] = useState({ show: false, type: "", property: null });

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
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);



const fetchInterestedProperties = useCallback(async () => {
  if (!phoneNumber) return;

  try {
    setLoading(true);

    const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-interest-owner`, {
      params: { phoneNumber }
    });

    const interestRequests = Array.isArray(data.interestRequestsData)
      ? data.interestRequestsData
      : [];

     const enrichedProperties = await Promise.all(
      interestRequests.map(async (property) => {
        let propertyMessage = null;
        try {
          const msgRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/user/property-message/${property.ppcId}`
          );
          propertyMessage = msgRes.data?.data?.message || null;
        } catch {
          propertyMessage = null;
        }

        return {
          ...property,
          propertyMessage,
        };
      })
    );

     const sortedData = enrichedProperties.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    setProperties(sortedData);
  } catch (error) {
    console.error("Failed to fetch interested properties:", error);
   } finally {
    setLoading(false);
  }
}, [phoneNumber]);

useEffect(() => {
  fetchInterestedProperties();
}, [fetchInterestedProperties]);




   useEffect(() => {
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "Interest Owner",
            viewTime: new Date().toISOString(),
          });
        } catch (err) {
        }
      };
    
      if (phoneNumber) {
        recordDashboardView();
      }
    }, [phoneNumber]);

  const updatePropertyStatus = (ppcId, status) => {
    const updated = properties.map(p => p.ppcId === ppcId ? { ...p, status } : p);
    setProperties(updated);
  };

  const handleRemoveConfirm = async () => {
    const { ppcId } = modal.property;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/delete-detail-property`, { ppcId, phoneNumber });
      updatePropertyStatus(ppcId, "delete");
      setMessage({ text: "Property removed successfully.", type: "success" });
    } catch {
      setMessage({ text: "Error removing property.", type: "error" });
    } finally {
      setModal({ show: false, type: "", property: null });
    }
  };

  const handleUndoConfirm = async () => {
    const { ppcId } = modal.property;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/undo-delete-detail`, { ppcId, phoneNumber });
      updatePropertyStatus(ppcId, "active");
      setMessage({ text: "Property status reverted!", type: "success" });
    } catch {
      setMessage({ text: "Error undoing property.", type: "error" });
    } finally {
      setModal({ show: false, type: "", property: null });
    }
  };

  const activeProperties = properties.filter(p => p.status !== "delete");
  const removedProperties = properties.filter(p => p.status === "delete");
  const navigate = useNavigate();

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' ,fontFamily: 'Inter, sans-serif'}}>
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
    </button>          <h3 className="m-0 ms-3" style={{ fontSize: "20px" }}>MY SEND INTEREST</h3>
        </div>

        <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#30747F', color: 'white' }}
              onClick={() => setActiveKey("All")}>
              All Properties
            </button>
          </div>
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#FFFFFF', color: 'grey' }}
              onClick={() => setActiveKey("Removed")}>
              Removed Properties
            </button>
          </div>

          {message.text && (
            <div className="col-12">
              <div className={`alert alert-${message.type} w-100`}>{message.text}</div>
            </div>
          )}

          <div className="col-12">
          <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: '500px' }}>

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
      </div>            ) : activeKey === "All" ? (
              <PropertyList
                properties={activeProperties}
                onRemoveClick={(property) => setModal({ show: true, type: "remove", property })}
              />
            ) : (
              <PropertyList
                properties={removedProperties}
                onUndoClick={(property) => setModal({ show: true, type: "undo", property })}
              />
            )}
             </div>
          </div>
        </div>

        <ConfirmationModal
          show={modal.show}
          onClose={() => setModal({ show: false, type: "", property: null })}
          onConfirm={modal.type === "remove" ? handleRemoveConfirm : handleUndoConfirm}
          message={modal.type === "remove" ? "Are you sure you want to remove this property?" : "Do you want to undo the removal of this property?"}
        />
      </div>
    </div>
  );
};



export default App;





 

