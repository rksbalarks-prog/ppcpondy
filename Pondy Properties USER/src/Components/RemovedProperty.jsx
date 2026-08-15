import React, { useState, useEffect } from "react";
import { FaRulerCombined, FaBed, FaCalendarAlt, FaUserAlt, FaRupeeSign, FaArrowLeft } from "react-icons/fa";
import { Col, Container } from "react-bootstrap";
import { Helmet } from "react-helmet";
import axios from "axios";
import "./MyProperty.css";
import { useNavigate } from "react-router-dom";
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import indianprice from '../Assets/Indian Rupee-01.png'
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import pic from '../Assets/default.png'; // Correct path

const RemovedProperty = () => {
  const phoneNumber = localStorage.getItem("phoneNumber"); // Get phone number from localStorage
  const [removedUsers, setRemovedUsers] = useState([]); // Store deleted properties
    const [message, setMessage] = useState("");
      const [propertyUsers, setPropertyUsers] = useState([]);
    
    const [loading, setLoading] = useState(true);
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
      if (message) {
        const timer = setTimeout(() => setMessage(""), 3000); // Auto-close after 3 seconds
        return () => clearTimeout(timer); // Cleanup timer
      }
    }, [message]);
    

   // Fetch removed properties when component loads
   useEffect(() => {
    if (phoneNumber) {
      fetchDeletedProperties(phoneNumber);
    }
  }, [phoneNumber]);
  
  const fetchDeletedProperties = async (phoneNumber) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-delete-status`, {
        params: { phoneNumber },
      });
  
      if (response.status === 200) {
        // Sort by createdAt (new to old)
        const sortedUsers = response.data.users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRemovedUsers(sortedUsers);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "Removed Property",
            viewTime: new Date().toISOString(),
          });
        } catch (err) {
        }
      };
    
      if (phoneNumber) {
        recordDashboardView();
      }
    }, [phoneNumber]);
  const handleUndo = async (ppcId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/undo-delete`, {
        ppcId,
        phoneNumber,
      });

      if (response.status === 200) {
        setMessage("Property status reverted successfully!");
        setRemovedUsers((prev) => prev.filter((user) => user.ppcId !== ppcId));
        setPropertyUsers((prev) => [...prev, { ...response.data.user }]);
      }
    } catch (error) {
      setMessage("Error undoing property status.");
    } 
  };

  const navigate = useNavigate();


 
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
    
    <div 
        className="d-flex flex-column align-items-center justify-content-center m-0"
        style={{maxWidth:"500px", width:"100%"}}>
    <div className="row m-0 w-100">
      <Helmet>
        <title>Pondy Property | Removed Properties</title>
      </Helmet>

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
               </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>Removed Properties </h3> </div>

          <div className="fw-bold">
      {message && <div className="alert text-success text-bold">{message}</div>}
      {/* Your existing component structure goes here */}
    </div>
    
    <Col lg={12} className="d-flex flex-column align-items-center">

      
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
      </div>            ) :removedUsers.length > 0 ? (
        removedUsers.map((user) => (
          <div 
          className="row g-0 rounded-4 mb-2 mt-2"
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
              PUC- {user.ppcId}
            </div>
          
            <div style={{ position: "relative", width: "100%", height: "180px" }}>
   

                           
<img
  src={
    user.photos && user.photos.length > 0
      ? `https://ppcpondy.com/PPC/${user.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
      : pic
  }
  alt={(
    `${user.ppcId || 'N/A'}-${user.propertyMode || 'N/A'}-${user.propertyType || 'N/A'}-rs-${user.price || '0'}
    -in-${user.city || ''}-${user.area || ''}-${user.state || ''}`
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

          
              <div>
              <div className="d-flex justify-content-between w-100 text-center" style={{ position: "absolute",
                    bottom: "0px" , background: '#3F8D99', color: '#fff'}}>
                  
                      <span className="w-100 text-center"> {user.status}  </span>
          
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px" ,background:"#FAFAFA"}}>
                    <div className="d-flex justify-content-start"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 }}>{user.propertyMode
            ? user.propertyMode.charAt(0).toUpperCase() + user.propertyMode.slice(1)
            : 'N/A'}
          </p> 
                    </div>
                     <p className="fw-bold m-0 " style={{ color:'#000000' }}>{user.propertyType 
            ? user.propertyType.charAt(0).toUpperCase() + user.propertyType.slice(1) 
            : 'N/A'}
          </p>
  <p
  className="m-0"
  style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}
>
  {(() => {
    const locs = [ user.nagar, user.area, user.city, user.district, user.state ]
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
                     <div className="card-body ps-2 m-0 pt-0 pe-2 pb-0 d-flex flex-column justify-content-center" >
                       <div className="row">
                         <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1">
                           {/* <FaRulerCombined className="me-2" color="#2F747F" /> */}
                           <img src={totalarea} alt="" width={12} className="me-2"/>
                           <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>{user.totalArea || 'N/A'} {user.areaUnit
            ? user.areaUnit.charAt(0).toUpperCase() + user.areaUnit.slice(1)
            : 'N/A'}
          
                            
                           </span>
                         </div>
                         <div className="col-6 d-flex align-items-center mt-1 mb-1">
                           {/* <FaBed className="me-2" color="#2F747F"/> */}
                           <img src={bed} alt="" width={12} className="me-2"/>
                           <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>{user.bedrooms || 'N/A'}</span>
                         </div>
                         <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                           {/* <FaUserAlt className="me-2" color="#2F747F"/> */}
                           <img src={postedby} alt="" width={12} className="me-2"/>
                           <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                           {user.ownership
            ? user.ownership.charAt(0).toUpperCase() + user.ownership.slice(1)
            : 'N/A'}
                           </span>
                         </div>
                 


                        <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
  <img src={calendar} alt="" width={12} className="me-2" />
  <span style={{ fontSize:'13px', color:'#5E5E5E', fontWeight: 500 }}>
    {
      user.updatedAt && user.updatedAt !== user.createdAt
        ? ` ${new Date(user.updatedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}`
        : ` ${new Date(user.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}`
    }
  </span>
</div>

                         <div className="col-12 d-flex flex-col align-items-center mt-1 mb-1 ps-1">
                          <h6 className="m-0">
                          <span style={{ fontSize:'15px', color:'#2F747F', fontWeight:600, letterSpacing:"1px" }}> 
                            {/* <FaRupeeSign className="me-2" color="#2F747F"/> */}
                            <img src={
                              indianprice
                            } alt="" width={8}  className="me-2"/>
                            {/* {user.price ? user.price.toLocaleString('en-IN') : 'N/A'} */}
                          
                              {user.price
          ? formatPrice(user.price)
          : 'N/A'} </span> 
                          <span style={{ color:'#2F747F', marginLeft:"5px",fontSize:'11px',}}> 
                          {user.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}                </span> 
                            </h6>
                         </div>
                                                   <div className="d-flex justify-content-center mt-2">
          
                <button
                  className="btn btn-sm"
                  style={{
                    background: '#2F747F',
                    color: '#fff',
                    width: '40%',
                    marginLeft: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#4ba0ad"; // Brighter neon on hover
                    e.target.style.fontWeight = 600; // Brighter neon on hover
                    e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#2F747F"; // Original orange
                    e.target.style.fontWeight = 400; // Brighter neon on hover
          
                  }}
                  onClick={() => handleUndo(user.ppcId)}
                >
                  Undo
                </button>
          
          
                                        </div>
                        </div>
                      </div>
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
                        <img src={NoData} alt="" width={100} />      
                        <p>No Removed Property Data Found.</p>
                        </div> 
       
      )}
       </Col> 
       </div> 


 </div> 
 </div> );
};

export default RemovedProperty;
