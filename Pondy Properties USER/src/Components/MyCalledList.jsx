




import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaBed, FaCalendarAlt, FaCamera, FaEye, FaRulerCombined, FaRupeeSign, FaUserAlt } from "react-icons/fa";
import { MdCall } from "react-icons/md";

import myImage from '../Assets/Rectangle 146.png';
import myImage1 from '../Assets/Rectangle 145.png';
import pic from '../Assets/Default image_PP-01.png';
import ConfirmationModal from './ConfirmationModal'; // Make sure this path is correct
import NoData from "../Assets/OOOPS-No-Data-Found.png";



const MyCalledList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber.replace("+", ""));
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [removedItems, setRemovedItems] = useState(
    JSON.parse(localStorage.getItem("removedProperties")) || []
  );

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});
  const [message, setMessage] = useState(null);

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
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "My Called List ",
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
    if (phoneNumber) {
      fetchCalledUserProperties();
    }
  }, [phoneNumber]);



  const fetchCalledUserProperties = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user-call/property-owner/${phoneNumber}`
      );
  
      // 🔃 Sort from newest to oldest based on createdAt timestamp
      const sortedCalls = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
  
      setCalls(sortedCalls);
    } catch (err) {
      // setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };
  

useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 3000); // Auto-close after 3 seconds
    return () => clearTimeout(timer); // Cleanup timer
  }
}, [message]);

  const handleRemove = async (id) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/user-call/soft-delete/${id}`);
      const updated = [...removedItems, id];
      setRemovedItems(updated);
      localStorage.setItem("removedProperties", JSON.stringify(updated));
      fetchCalledUserProperties();
      setMessage({ text: "Interest deleted successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to delete interest.", type: "error" });
    }
  };

  const handleUndo = async (id) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/user-call/undo-delete/${id}`);
      const updated = removedItems.filter((itemId) => itemId !== id);
      setRemovedItems(updated);
      localStorage.setItem("removedProperties", JSON.stringify(updated));
      fetchCalledUserProperties();
      setMessage({ text: "Interest restored successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to restore interest.", type: "error" });
    }
  };
  
  

  const confirmRemove = (id) => {
    setModalMessage("Are you sure you want to remove this property?");
    setOnConfirmAction(() => () => handleRemove(id));
    setShowModal(true);
  };

  const confirmUndo = (id) => {
    setModalMessage("Are you sure you want to undo the removal?");
    setOnConfirmAction(() => () => handleUndo(id));
    setShowModal(true);
  };

  const filteredCalls =
    activeTab === "all"
      ? calls.filter((item) => !removedItems.includes(item._id))
      : calls.filter((item) => removedItems.includes(item._id));


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
    <div className="container d-flex align-items-center justify-content-center p-0" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>

        {/* Header */}
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
           </button>
          <h3 className="m-0 ms-3" style={{ fontSize: "20px" }}>MY CALLED LIST</h3>
        </div>

    
           {/* Tabs */}
      <div className="row g-2 w-100">
      <div className="col-6 p-0">
        <button style={{ backgroundColor: '#4F4B7E', color: 'white' , width:"100%" }}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        </div>

        <div className="col-6 p-0">

        <button style={{ backgroundColor: '#FF0000', color: 'white' , width:"100%" }}
          onClick={() => setActiveTab("removed")}
        >
          Removed
        </button>
      </div>
      </div>

        {message && (
  <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"} mt-2`}>
    {message.text}
  </div>
)}


        {/* Loader / Error / Empty */}
        {loading &&   <div className="text-center my-4"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    }}>
    <span className="spinner-border text-primary" role="status" />
    <p className="mt-2">Loading properties...</p>
  </div>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && filteredCalls.length === 0 && (
          <p>{activeTab === "all" ?        <div className="text-center my-4 "
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
          
            }}>
          <img src={NoData} alt="" width={100}/>      
          <p>No properties found</p>
          </div>  :        <div className="text-center my-4 "
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
          
            }}>
          <img src={NoData} alt="" width={100}/>      
          <p>No Removed Property Data Found.</p>
          </div> }</p>
        )}

        {/* Property Cards */}
        {filteredCalls.map((property) => (
          <div key={property._id} className="col-12 mb-2 mt-2">
            <div className="row g-0 rounded-4 w-100" style={{ border: '1px solid #ddd', background: "#EFEFEF", overflow: "hidden" }}>
              {/* Image */}
              <div className="col-4 d-flex flex-column">
                <div className="text-white py-1 px-2 text-center" style={{ width: '100%', background: "#2F747F" }}>
                  PUC- {property.ppcId}
                </div>
                <div style={{ position: "relative", width: "100%", height: '175px' }}>
          

  <img
  src={
    property.photos && property.photos.length > 0
      ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
      : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
  }
  alt={(
    `${property.ppcId || 'N/A'}-${property.propertyMode || 'N/A'}-${property.propertyType || 'N/A'}-rs-${property.price || '0'}
    -in-${property.city || ''}-${property.area || ''}-${property.state || ''}`
  )
    .replace(/\s+/g, "-")
    .replace(/,+/g, "-")
    .toLowerCase()
  }
  className="img-fluid"
  style={{
    objectFit: "cover",
    objectPosition: "center",
    width: "100%",
    height: "100%",
    borderRadius: "15px",
  }}
/>

                  <div className="d-flex justify-content-between w-100" style={{ position: "absolute", bottom: "0px" }}>
                    <span className="d-flex justify-content-center align-items-center"
                      style={{
                        color: '#fff',
                        background: `url(${myImage}) no-repeat center center`,
                        backgroundSize: "cover",
                        fontSize: '12px', width: '50px'
                      }}>
                      <FaCamera className="me-1" />1
                    </span>
                    <span className="d-flex justify-content-center align-items-center"
                      style={{
                        color: '#fff',
                        background: `url(${myImage1}) no-repeat center center`,
                        backgroundSize: "cover",
                        fontSize: '12px', width: '50px'
                      }}>
                      <FaEye className="me-1" />1
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="col-8 ps-2">
                <div className="d-flex justify-content-between">
                  <p className="mb-1 fw-bold" style={{ color: '#5E5E5E' }}>{property.propertyMode || 'N/A'}</p>
                  {activeTab === "all" ? (
                    <p className="m-0 ps-3 pe-3" style={{ background: "#FF0000", color: "white", cursor: "pointer", borderRadius: '0px 0px 0px 15px' }} onClick={() => confirmRemove(property._id)}>Remove</p>
                  ) : (
                    <p className="m-0 ps-3 pe-3" style={{ background: "green", color: "white", cursor: "pointer", borderRadius: '0px 0px 0px 15px' }} onClick={() => confirmUndo(property._id)}>Undo</p>
                  )}
                </div>
                <p className="fw-bold m-0">{property.propertyType}</p>
<p
  className="m-0"
  style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}
>
  {(() => {
    const locs = [ property.nagar, property.area, property.city, property.district, property.state ]
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (locs.length === 0) {
      // All null/empty — show two N/A
      return <>N/A, N/A</>;
    }

    // Show first 3 valid values, capitalized, separated by commas
    return locs.slice(0, 3).map((val, idx, arr) => (
      <span key={idx}>
        {/* {val.charAt(0).toUpperCase() + val.slice(1)} */}
                {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}

        {idx < arr.length - 1 ? ", " : ""}
      </span>
    ));
  })()}
</p>                <div className="card-body ps-2 m-0 pt-0 pe-2">
                  <div className="row">
                    <div className="col-6 d-flex align-items-center mt-1 mb-1">
                      <FaRulerCombined className="me-2" color="#2F747F" /> {property.totalArea}
                    </div>
                    <div className="col-6 d-flex align-items-center mt-1 mb-1">
                      <FaBed className="me-2" color="#2F747F" /> {property.bedrooms}
                    </div>
                    <div className="col-6 d-flex align-items-center mt-1 mb-1">
                      <FaUserAlt className="me-2" color="#2F747F" /> {property.ownership}
                    </div>
                    <div className="col-6 d-flex align-items-center mt-1 mb-1">
                      <FaCalendarAlt className="me-2" color="#2F747F" /> {property.date ? new Date(property.date).toLocaleString() : "N/A"}
                    </div>
                    <div className="col-12 d-flex align-items-center mt-1 mb-1">
                      <h6 className="m-0">
                        <span style={{ color: '#2F747F', fontSize: '17px', fontWeight: 'bold' }}>
                          <FaRupeeSign className="me-2" />    {property.price
          ? formatPrice(property.price)
          : 'N/A'} 
                        </span>
                        <span style={{ fontSize: '11px', marginLeft: '5px', color: '#2F747F' }}>Negotiable</span>
                      </h6>
                    </div>
                    <p style={{ color: "#2E7480", margin: "0px" }}>
                      <a href={`tel:${property.interestedUser}`} style={{ textDecoration: "none", color: "#2E7480" }}>
                        <MdCall className="me-2" /> {property.phoneNumber || 'N/A'}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Confirmation Modal */}
        <ConfirmationModal
          show={showModal}
          message={modalMessage}
          onConfirm={() => {
            onConfirmAction();
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      </div>
    </div>
  );
};

export default MyCalledList;
