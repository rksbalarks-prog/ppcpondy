


import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaMapMarkerAlt, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import indianprice from '../Assets/Indian Rupee-01.png'
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import myImage from '../Assets/Rectangle 146.png'; // Correct path
import myImage1 from '../Assets/Rectangle 145.png'; // Correct path
import pic from '../Assets/default.png'; // Correct path
import { 
  FaCamera,
  FaEye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PropertyWithLocation = ({phoneNumber}) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

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
    const fetchLocationApplied = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-location-applied-properties`
        );
        setProperties(res.data.properties || []);
      } catch (err) {
        setMessage({ text: "Failed to fetch location properties", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchLocationApplied();
  }, []);
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
  
  const handleCardClick = (ppcId, phoneNumber) => {
    navigate(`/detail/${ppcId}`, { state: { phoneNumber } });
  };
  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
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
 <div className="container d-flex align-items-center justify-content-center p-0">
          <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' ,fontFamily: 'Inter, sans-serif'}}>

      <div className="row g-2 w-100">
        <div className="d-flex align-items-center justify-content-start w-100"  style={{
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
            </button><h3 className="m-0 " style={{fontSize:"20px"}}>Propety With Location </h3> </div>
           
          <div className="w-100">
      {message.text && (
        <div className={`alert alert-${message.type === "error" ? "danger" : "success"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : properties.length === 0 ? (
             <div className="text-center my-4 "
                        style={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                  
                        }}>
                <img src={NoData} alt="" width={100}/>      
        <p>No properties with location found.</p>
                </div>              
      ) : (
          <div className="w-100">
          {properties.map((property, index) => (
           <div 
                         key={property._id}
                         className="card mb-3 shadow rounded-4"
                         style={{ width: '100%', height: 'auto', background: '#F9F9F9', overflow:'hidden' }}
                         onClick={() => handleCardClick(property.ppcId, phoneNumber)}
                       >
                          <div className="row g-0 ">
              <div className="col-md-4 col-4 d-flex flex-column align-items-center">
           
      <div style={{ position: "relative", width: "100%",height: window.innerWidth <= 640 ? "180px" : "170px",  }}>
         {/* Image */}
  
      
                   
<img
  src={
    property.photos && property.photos.length > 0
      ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
      : pic
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

     
         {/* Icons */}
         <div
           style={{
             position: "absolute",
             bottom: "0px",
             width: "100%",
             display: "flex",
             justifyContent: "space-between",
           }}
         >
           <span
             className="d-flex justify-content-center align-items-center"
             style={{
               color: "#fff",
               backgroundImage: `url(${myImage})`,
               backgroundSize: "cover",
               width: "45px",
               height: "20px",
             }}
           >
             <FaCamera className="me-1" size={13}/>  <span style={{fontSize:"11px"}}>{imageCounts[property.ppcId] || 0}</span>
           </span>
           <span
             className="d-flex justify-content-center align-items-center"
             style={{
               color: "#fff",
               backgroundImage: `url(${myImage1})`,
               backgroundSize: "cover",
               width: "45px",
               height: "20px",
             }}
           >
             <FaEye className="me-1" size={15} /> <span style={{fontSize:"11px"}}> {property.views}  </span>
           </span>
         </div>
       </div>
              </div>
              <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px"}}>
               <div className="d-flex justify-content-start"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 }}>{property.propertyMode
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
                      {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}

             {idx < arr.length - 1 ? ", " : ""}
           </span>
         ));
       })()}
     </p>
                <div className="card-body ps-2 m-0 pt-0 pe-2 pb-0 d-flex flex-column justify-content-center" style={{background:"#FAFAFA"}}>
                  <div className="row">
                    <div className="col-6 d-flex align-items-center mt-1 mb-1 p-0">
                       <img src={totalarea} alt="" width={12} className="me-2"/>
                      <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>{property.totalArea || 'N/A'} {property.areaUnit
       ? property.areaUnit.charAt(0).toUpperCase() + property.areaUnit.slice(1)
       : 'N/A'}
     
                       
                      </span>
                    </div>
                    <div className="col-6 d-flex align-items-center mt-1 mb-1 p-0">
                       <img src={bed} alt="" width={12} className="me-2"/>
                      <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>{property.bedrooms || 'N/A'} BHK</span>
                    </div>
                    <div className="col-6 d-flex align-items-center mt-1 mb-1 p-0">
                       <img src={postedby} alt="" width={12} className="me-2"/>
                      <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                      {property.ownership
       ? property.ownership.charAt(0).toUpperCase() + property.ownership.slice(1)
       : 'N/A'}
                      </span>
                    </div>
                    <div className="col-6 d-flex align-items-center mt-1 mb-1 p-0">
                      <img src={calendar} alt="" width={12} className="me-2"/>
                       <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                       {property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-IN', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
       }) : 'N/A'}
     
                       </span>
                    </div>
                    <div className="col-12 d-flex flex-col align-items-center mt-1 mb-1 ps-1">
                     <h6 className="m-0">
                     <span style={{ fontSize:'15px', color:'#2F747F', fontWeight:600, letterSpacing:"1px" }}> 
                        <img src={
                         indianprice
                       } alt="" width={8}  className="me-2"/>
         {property.price
               ? formatPrice(property.price)
               : 'N/A'}                 </span> 
                     <span style={{ color:'#2F747F', marginLeft:"5px",fontSize:'11px',}}> 
                     {property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}                </span> 
                       </h6>
                    </div>
                   </div>
                 </div>
               </div>
            </div>
     
                       </div>
          ))}
        </div>
      )}
    </div>
        </div>
    </div>
    </div>

  );
};

export default PropertyWithLocation;
