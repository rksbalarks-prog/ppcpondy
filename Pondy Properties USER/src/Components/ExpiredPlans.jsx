

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import pic from '../Assets/Default image_PP-01.png';
import myImage from '../Assets/Rectangle 146.png'; // Correct path
import myImage1 from '../Assets/Rectangle 145.png'; // Correct path
import indianprice from '../Assets/Indian Rupee-01.png'
import {FaCamera, FaEye , FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { MdCall } from "react-icons/md";
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import NoData from "../Assets/OOOPS-No-Data-Found.png";

const ExpiredPlans = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const phoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [planData, setPlanData] = useState(null);

  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: "", property: null });
  const [message, setMessage] = useState("");



  const [expiredPlans, setExpiredPlans] = useState([]);
  const [expiredCount, setExpiredCount] = useState(0);
  
 const fetchExpiredPlanData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/expired-plans-by-phone`, {
        params: { phoneNumber },
      });

      if (response.status === 200) {
        const { expiredPlans = [] } = response.data;

        const enriched = expiredPlans.map((item) => ({
          ...item.propertyData,
          expireDate: item.expireDate,
          expiryMessage: item.expiryMessage,
          paymentData: item.paymentData,
        }));

        setProperties(enriched);
      }
    } catch (error) {
      console.error("Error fetching expired plans:", error);
    } finally {
      setLoading(false);
    }
  };



  
  useEffect(() => {
    if (phoneNumber) {
      fetchExpiredPlanData();
    }
  }, [phoneNumber]);
  
  

    
  const [warningMessage, setWarningMessage] = useState("");
  // After your fetchPlanDetails effect, add:
  useEffect(() => {
    if (!planData?.planExpiryDate) return;      // nothing to do if we haven’t loaded planData
  
    // planData.planExpiryDate comes in as "dd-mm-yyyy"
    const [dd, mm, yyyy] = planData.planExpiryDate.split('-');
    const expiryDate = new Date(`${yyyy}-${mm}-${dd}`); // parse as ISO string
    const today = new Date();
    
    const diffMs    = expiryDate.getTime() - today.getTime();
    const daysLeft  = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
    if (daysLeft > 0 && daysLeft <= 10) {
      setWarningMessage(`Your plan will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`);
    } else if (daysLeft <= 0) {
      setWarningMessage("Your plan has expired.");
    } else {
      setWarningMessage(""); // no warning if >10 days
    }
  
  }, [planData]);
  

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer); // Cleanup on unmount or message change
    }
  }, [message]);
  

  const [imageCounts, setImageCounts] = useState({}); // Store image count for each property

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
    
      // Fetch image counts for all properties
      useEffect(() => {
        const fetchAllImageCounts = async () => {
          const counts = {};
          await Promise.all(
            properties.map(async (property) => {
              const count = await fetchImageCount(property.ppcId);
              counts[property.ppcId] = count;
            })
          );
          setImageCounts(counts);
        };
    
        if (properties.length > 0) {
          fetchAllImageCounts();
        }
      }, [properties]);


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
 
useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Expired Plan",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ maxWidth: "500px", margin: "auto" }}>
      
        <div className="col-12">
        <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: '500px' }}>
        <div className="row mt-4 w-100">

        {message && <div className="alert alert-info mt-2">{message}</div>}


{warningMessage && (
  <div className="alert alert-warning w-100 mt-2" role="alert">
    {warningMessage}
  </div>
)}

        {loading ? (
  <div className="text-center my-4"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    }}>
    <span className="spinner-border text-primary" role="status" />
    <p className="mt-2">Loading properties...</p>
  </div>
) : properties.length > 0 ? (
   properties.map((property) => (
    <div key={property._id} 
    className="row g-0 rounded-4 mb-2"
    style={{
      border: "1px solid #ddd",
      overflow: "hidden",
      background: "#EFEFEF",
    }}
    >
  <div className="col-md-4 col-4 d-flex flex-column justify-content-between align-items-center">
  <div
    className="text-white py-1 px-2 text-center"
    style={{ width: "100%", background: "#2F747F" }}
  >
    PUC- {property.ppcId}
  </div>
    <div style={{ position: "relative", width: "100%", height: '200px' }}>
      <img
        src={property.photos?.length ? `https://ppcpondy.com/PPC/${property.photos[0]}` : pic}
        alt="Property"
        className="img-fluid"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div className="d-flex justify-content-between w-100" style={{ position: "absolute", bottom: "0px" }}>
        <span className="d-flex justify-content-center align-items-center" style={{ color: '#fff', background: `url(${myImage}) no-repeat center center`, backgroundSize: "cover", fontSize: '12px', width: '50px' }}>
          <FaCamera className="me-1" /> {imageCounts[property.ppcId] || 0}
        </span>
        <span className="d-flex justify-content-center align-items-center" style={{ color: '#fff', background: `url(${myImage1}) no-repeat center center`, backgroundSize: "cover", fontSize: '12px', width: '50px' }}>
          <FaEye className="me-1" /> {property.views || 0}
        </span>
      </div>
    </div>
    </div>

    <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px" ,background:"#FAFAFA"}}>
      <div>          <div className="d-flex justify-content-start"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 }}>{property.propertyMode
  ? property.propertyMode.charAt(0).toUpperCase() + property.propertyMode.slice(1)
  : 'N/A'}
</p> 
          </div>
           <p className="fw-bold m-0 " style={{ color:'#000000' }}>{property.propertyType 
  ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) 
  : 'N/A'}
</p>
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
</p>
             </div>

             <div className="card-body ps-2 m-0 pt-0 pe-2 pb-0 d-flex flex-column justify-content-center" >
             <div className="row">
             <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1">
                 {/* <FaRulerCombined className="me-2" color="#2F747F" /> */}
                 <img src={totalarea} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>{property.totalArea || 'N/A'} {property.areaUnit
  ? property.areaUnit.charAt(0).toUpperCase() + property.areaUnit.slice(1)
  : 'N/A'}

                  
                 </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 {/* <FaBed className="me-2" color="#2F747F"/> */}
                 <img src={bed} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>{property.bedrooms || 'N/A'} BHK</span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 {/* <FaUserAlt className="me-2" color="#2F747F"/> */}
                 <img src={postedby} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                 {property.ownership
  ? property.ownership.charAt(0).toUpperCase() + property.ownership.slice(1)
  : 'N/A'}
                 </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 <img src={calendar} alt="" width={12} className="me-2"/>
                  {/* <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                  {property.planCreatedAt ? new Date(property.planCreatedAt).toLocaleDateString('en-IN', {
                                                     year: 'numeric',
                                                     month: 'short',
                                                     day: 'numeric'
                                                   }) : 'N/A'}
                  </span> */}

                   <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 500 }}>
   {property.planCreatedAt || 'N/A'}
  </span>
               </div>

          <div className="col-12 d-flex flex-col align-items-center p-1">
            <h6 className="m-0">
              <span style={{ fontSize: '15px', color: '#2F747F', fontWeight: 'bold', letterSpacing: "1px" }}>
                <img src={indianprice} alt="" width={8} className="me-1" />
    {property.price
          ? formatPrice(property.price)
          : 'N/A'}               </span>
              <span style={{ color: '#2F747F', fontSize: '11px', marginLeft: "5px" }}>{property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}</span>
            </h6>
          </div>
          <div className="col-12 d-flex align-items-center p-1">
                             <span style={{ fontSize:'13px', color:'red' ,fontWeight: 500, marginRight:"30px" }}>{property.status || 'N/A'}</span>

   

        

<button
  className="btn btn-sm"
  style={{
    background: '#2F747F',
    color: '#fff',
    width: '40%',
    marginLeft: '8px',
    transition: 'all 0.3s ease'
  }}
  onClick={(e) => {
    e.stopPropagation();
    navigate('/plans', {
      state: {
       phoneNumber: property.phoneNumber,
ppcId: property.ppcId,
     }
    });
  }}
  onMouseOver={(e) => {
    e.target.style.background = "#4ba0ad";
    e.target.style.fontWeight = 600;
  }}
  onMouseOut={(e) => {
    e.target.style.background = "#2F747F";
    e.target.style.fontWeight = 400;
  }}
>
  Pay Now
</button>
          </div>
        </div>
      </div>
    </div>
  </div>

))) : (
  <div className="text-center my-4 "
  style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',

  }}>
<img src={NoData} alt="" width={100} />      
<p>No properties found.</p>
</div>              )}



        {/* Modal */}

        {modal.show && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1050,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
    tabIndex="-1"
  >
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "500px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #dee2e6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h5 style={{ margin: 0 }}>
          {modal.type === "remove" ? "Confirm Removal" : "Undo Removal"}
        </h5>
        <button
          onClick={() =>
            setModal({ show: false, type: "", property: null })
          }
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            lineHeight: "1",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
      </div>
      <div style={{ padding: "16px" }}>
        <p>
          Are you sure you want to{" "}
          {modal.type === "remove" ? "remove" : "undo"} this property?
        </p>
      </div>
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #dee2e6",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setModal({ show: false, type: "", property: null })}
          style={{
            padding: "6px 12px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
      
          style={{
            padding: "6px 12px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {modal.type === "remove" ? "Remove" : "Undo"}
        </button>
      </div>
    </div>
  </div>
)}

      
</div>

      </div>
    </div>
    </div>
    </div>

  );
};

export default ExpiredPlans;






