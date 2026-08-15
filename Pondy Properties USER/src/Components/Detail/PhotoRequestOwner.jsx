

import React, { useState, useEffect } from 'react'; 
import { Tab, Nav, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";
import pic from '../../Assets/Default image_PP-01.png'; 
import myImage from '../../Assets/Rectangle 766.png'; 
import myImage1 from '../../Assets/Rectangle 145.png'; 
import {FaCamera, FaEye , FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign } from 'react-icons/fa';
import { MdCall } from 'react-icons/md';
import NoData from "../../Assets/OOOPS-No-Data-Found.png";


const PropertyCard = ({ property , onRemove , onUndo }) => {

 const [message, setMessage] = useState({ text: "", type: "" });

  const { phoneNumber } = useParams();  
  
        const handleRevealClick = () => {
      setFinalContactNumber(property?.postedUserPhoneNumber);  
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
    
  
   useEffect(() => {
   if (message.text) {
     const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
     return () => clearTimeout(timer);
   }
 }, [message]);
    

  const navigate = useNavigate();


  const handleCardClick = () => {
    if (confirmAction) return; 
    if (property?.ppcId) {
       navigate(`/detail/${property.ppcId}`, { state: { photoURL: property.photoURL } });

  }
 };
     
  
  const [imageCounts, setImageCounts] = useState({});  

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
  
 
  const [finalContactNumber, setFinalContactNumber] = useState(null);
 


  const [properties, setProperties] = useState([]);

 
  const [confirmAction, setConfirmAction] = useState(null); 

  const handleClick = (action) => {
    setConfirmAction(action); 
  };

  const handleConfirmYes = () => {
    if (confirmAction === 'remove') {
      onRemove(property.ppcId);
    } else if (confirmAction === 'undo') {
      onUndo(property.ppcId);
    }
    setConfirmAction(null);
  };

  const handleConfirmNo = () => {
    setConfirmAction(null);
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
  return (
    <div>
     <div className="row g-0 rounded-4 mb-2" style={{ border: '1px solid #ddd', overflow: "hidden", background: "#EFEFEF" }}
    onClick={handleCardClick}
>
    <div className="col-md-4 col-4 d-flex flex-column justify-content-between align-items-center">
      <div className="text-white py-1 px-2 text-center" style={{ width: '100%', background: "#2F747F" }}>
        PUC- {property.ppcId}
      </div>
   

<div style={{ position: "relative", width: "100%", height:'160px'}}>
            <img
                                        src={property.photoURL ? property.photoURL : pic}  
                                    
                                          alt={
    `${property.ppcId || 'N/A'}-${property.propertyMode || 'N/A'}-${property.propertyType || 'N/A'}-rs-${property.price || '0'}
    -in-${property.city || ''}-${property.area || ''}-${property.state || ''}`
      .replace(/\s+/g, "-")
      .replace(/,+/g, "-")
      .toLowerCase()
  }
                                        className="img-fluid"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />

          <div >
          <div className="d-flex justify-content-between w-100" style={{ position: "absolute",
          bottom: "0px"}}>
                              
<span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaCamera className="me-1"/> {imageCounts[property.ppcId] || 0}
          </span>
          <span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage1}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaEye className="me-1" />{property.views}
          </span>
          </div>
          </div>
          </div>
    </div>
    <div className="col-md-8 col-8" style={{paddingLeft:"10px", background:"#F5F5F5"}}>
    <div className="d-flex justify-content-between">
        <p className="m-0" style={{ color: '#5E5E5E', fontWeight: 'normal' }}>
          {property.propertyMode || 'N/A'}
        </p>

    {property.propertyMessage && (
    <span 
      className=" mt-2" 
      style={{
        color: "#FF0000",
        fontWeight: "bold",
        fontSize: "12px"
      }}
    >
      {property.propertyMessage}
    </span>
  )}


{onRemove ? (
        <p
          className="mb-0 ps-3 pe-3 text-center pt-1"
          style={{
            fontSize: "12px",

            background: "#FF4F00",  
            color: "white",
            cursor: "pointer",
            borderRadius: "0px 0px 0px 15px",
            transition: "all 0.2s ease-in-out",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#ff7300";  
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#FF4F00";  
          }}
          onClick={(e) => {
            e.stopPropagation(); 
            handleClick('remove');
          }}
        >
          REMOVE
        </p>
      ) : (
        <p
          className="mb-0 ps-3 pe-3 text-center pt-1"
          style={{
            background: "green",  
            color: "white",
            cursor: "pointer",
            borderRadius: "0px 0px 0px 15px",
            transition: "all 0.2s ease-in-out",
            fontSize: "12px",

          }}
          onMouseOver={(e) => {
            e.target.style.background = "#32cd32";  
          }}
          onMouseOut={(e) => {
            e.target.style.background = "green";  
          }}
          onClick={(e) => {
            e.stopPropagation();  
            handleClick('undo');
          }}        >
          UNDO
        </p>
      )}
      {confirmAction && (
        <div
          style={{
            position: "fixed",
            background: "white",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            width: "400px",
            height:"100px",
            textAlign: "center"
          }}
        >
          <p style={{
            color:"#007C7C", fontSize:"12px"
          }}>Are you sure you want to {confirmAction} this Property?</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button className='p-1' style={{ background:  "#2F747F", width: "80px", fontSize: "13px", border:"none" }} onClick={handleConfirmYes}   onMouseOver={(e) => {
          e.target.style.background = "#029bb3";
          e.target.style.fontWeight = 600;
          e.target.style.transition = "background 0.3s ease";

        }}
        onMouseOut={(e) => {
          e.target.style.background = "#2F747F"; 
          e.target.style.fontWeight = 400;

        }}>Yes</button>
            <button className="ms-3 p-1" style={{ background:  "#FF0000", width: "80px", fontSize: "13px" , border:"none"}} onClick={handleConfirmNo}    onMouseOver={(e) => {
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
      )}
      </div>
      <p className="fw-bold m-0" style={{ color: '#000000', fontSize:"15px" }}>{property.propertyType || 'N/A'}</p>
<p
  className="m-0"
  style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}
>
  {(() => {
    const locs = [ property.nagar, property.area, property.city, property.district, property.state ]
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (locs.length === 0) {
       return <>N/A, N/A</>;
    }

     return locs.slice(0, 3).map((val, idx, arr) => (
      <span key={idx}>
                 {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}

        {idx < arr.length - 1 ? ", " : ""}
      </span>
    ));
  })()}
</p>      <div className="card-body ps-2 m-0 pt-0 pe-2 d-flex flex-column justify-content-center">
      <div className="row">
                       <div className="col-6 d-flex align-items-center  p-1">
          <FaRulerCombined className="me-2" color="#2F747F" />
          <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 'medium' }}>
            {property.totalArea || 'N/A'}
          </span>
        </div>
                       <div className="col-6 d-flex align-items-center  p-1">
          <FaBed className="me-2" color="#2F747F" />
          <span style={{ fontSize: '13px', color: '#5E5E5E' }}>
            {property.bedrooms || 'N/A'} BHK
          </span>
        </div>
                       <div className="col-6 d-flex align-items-center  p-1">
          <FaUserAlt className="me-2" color="#2F747F" />
          <span style={{ fontSize: '13px', color: '#5E5E5E' }}>
            {property.postedBy || 'N/A'}
          </span>
        </div>
 

                            <div className="col-6 d-flex align-items-center p-1">
  <FaCalendarAlt className="me-2" color="#2F747F" />
  <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 500 }}>
    {
      property.updatedAt && property.updatedAt !== property.createdAt
        ? new Date(property.updatedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : new Date(property.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
    }
  </span>
</div>


                            <div className="col-12 d-flex flex-col align-items-center p-1">
                            <h6 className="m-0">
            <span style={{ fontSize: '17px', color: '#2F747F', fontWeight: 'bold', letterSpacing: "1px" }}>
              <FaRupeeSign className="me-2" color="#2F747F" />
    {property.price
          ? formatPrice(property.price)
          : 'N/A'}             </span>
            <span style={{ color: '#2F747F', fontSize: '13px', marginLeft: "5px", fontSize: '11px' }}>
              {property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}
            </span>
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
<div className='text-center' style={{border:"2px solid #2F747F", borderRadius:"0px 0px 15px 15px",  overflow: "hidden", fontSize:"14px", color:"grey"}}>{property.status || 'N/A'} : <span>  {property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-IN') : 'N/A'} </span></div>
  </div>
  </div>

  
  );
};

const PhotoRequestOwner = ({ properties, onRemove }) => {
  const filteredProperties = properties.filter((property) => property.status !== 'deleted');
  
  return (
    <div className="container">
      <div className="row rounded-4 p-1">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.ppcId} property={property} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};

const RemovedProperties = ({ removedProperties, onUndo }) => {

  return (
    <div className="container">
      <div className="row rounded-4 p-1">
      {removedProperties.map((property) => (
          <PropertyCard key={property.ppcId} property={property} onUndo={onUndo} />
        ))}
      </div>
    </div>
  );
};


const App = () => {
  const { phoneNumber } = useParams();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const [activeKey, setActiveKey] = useState('All');
  const [removedProperties, setRemovedProperties] = useState(() => {
    const storedRemovedProperties = localStorage.getItem('removedProperties');
    return storedRemovedProperties ? JSON.parse(storedRemovedProperties) : [];
  });
  const [properties, setProperties] = useState([]);


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
          viewedFile: "Photo request Owner Property",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);


 


  useEffect(() => {
  const fetchProperties = async () => {
    if (!phoneNumber) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/photo-requests/owner/${phoneNumber}`);

      if (response.status === 200) {
        const properties = Array.isArray(response.data) ? response.data : [];

         const enrichedProperties = await Promise.all(
          properties.map(async (property) => {
            try {
              const msgRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/user/property-message/${property.ppcId}`
              );
              return {
                ...property,
                propertyMessage: msgRes.data?.data?.message || null,
              };
            } catch {
              return {
                ...property,
                propertyMessage: null,
              };
            }
          })
        );

         const sortedProperties = enrichedProperties.sort(
          (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );

        setProperties(sortedProperties);
      } else {
        setMessage("No properties found.");
      }
    } catch (error) {
      console.error("Photo request fetch error:", error);
      setMessage("Error fetching properties.");
    }
  };

  fetchProperties();
}, [phoneNumber]);


const handleRemoveProperty = async (ppcId) => {
  if (!ppcId) {
    setMessage("Invalid property ID.");
    return;
  }
  try {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/photo-requests/delete/${ppcId}`);
    if (response.status === 200) {
      setMessage('Photo request marked as deleted.');

       const originalProperty = properties.find((property) => property.ppcId === ppcId);

       setProperties((prevProperties) => {
        const updatedProperties = prevProperties.map((property) =>
          property.ppcId === ppcId ? { ...property, status: 'deleted' } : property
        );
        localStorage.setItem('properties', JSON.stringify(updatedProperties)); 
        return updatedProperties;
      });

       if (originalProperty) {
        const propertyWithOriginalStatus = {
          ...originalProperty,
          originalStatus: originalProperty.status
        };

        setRemovedProperties((prevRemovedProperties) => {
          const updatedRemovedProperties = [...prevRemovedProperties, propertyWithOriginalStatus];
          localStorage.setItem('removedProperties', JSON.stringify(updatedRemovedProperties));
          return updatedRemovedProperties;
        });
      }
    }
  } catch (error) {
    setMessage(error.response?.data?.message || 'Error deleting photo request.');
  }
};

const handleUndoRemove = async (ppcId) => {
  if (!ppcId) {
    setMessage("Invalid property ID.");
    return;
  }
  try {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/photo-requests/undo/${ppcId}`);
    if (response.status === 200) {
      setMessage("Photo request restored.");

      const restoredProperty = removedProperties.find((property) => property.ppcId === ppcId);
      if (restoredProperty) {
         setProperties((prevProperties) => {
          const updatedProperties = prevProperties.map((property) =>
            property.ppcId === ppcId
              ? { ...property, status: restoredProperty.originalStatus || 'active' }
              : property
          );
          localStorage.setItem('properties', JSON.stringify(updatedProperties));
          return updatedProperties;
        });

        const updatedRemoved = removedProperties.filter((property) => property.ppcId !== ppcId);
        setRemovedProperties(updatedRemoved);
        localStorage.setItem('removedProperties', JSON.stringify(updatedRemoved));
      }
    }
  } catch (error) {
    setMessage("Error restoring photo request.");
  }
};


  const navigate = useNavigate();


  return (
    <div style={{ maxWidth: '500px', margin: 'auto', fontFamily: 'Inter, sans-serif' }}>
      <Tab.Container activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
        <Row className="g-3">
          <Col lg={12} className="d-flex flex-column align-items-center">
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
    </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>MY PHOTO REQUESTS </h3> </div>


            <Nav variant="tabs" className="mb-3" style={{ width: '100%' }}>
              <Nav.Item style={{ flex: '1' }}>
                <Nav.Link eventKey="All" style={{ backgroundColor: '#30747F', color: 'white', textAlign: 'center' }}>
                  All
                </Nav.Link>
              </Nav.Item>
              <Nav.Item style={{ flex: '1' }}>
                <Nav.Link eventKey="removed" style={{ backgroundColor: '#FFFFFF', color: 'grey', textAlign: 'center' }}>
                  Removed
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="All">
                  {loading ? (
    <div
      className="text-center my-4"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span className="spinner-border text-primary" role="status" />
      <p className="mt-2">Loading properties...</p>
    </div>
  ) : properties.length > 0 ? (
                <PhotoRequestOwner properties={properties} onRemove={handleRemoveProperty} />

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
      <p>No properties found.</p>
    </div>
  )
}
               </Tab.Pane>
              <Tab.Pane eventKey="removed">
                 {
  loading ? (
    <div
      className="text-center my-4"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span className="spinner-border text-primary" role="status" />
      <p className="mt-2">Loading properties...</p>
    </div>
  ) : removedProperties.length > 0 ? (
    <RemovedProperties
      removedProperties={removedProperties}
      onUndo={handleUndoRemove}
    />
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
      <p>No properties found.</p>
    </div>
  )
}

              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

          {message.text && (
            <div className="col-12">
              <div className={`alert alert-${message.type} w-100`}>{message.text}</div>
            </div>
          )}

    </div>
  );
};

export default App;





































































