
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import profil from '../../Assets/xd_profile.png'
import { MdCalendarMonth, MdOutlineBed, MdOutlineMapsHomeWork, MdOutlineTimer, MdFamilyRestroom, MdOutlineCall } from 'react-icons/md';
import { GoHome } from 'react-icons/go';
import { LuIndianRupee, LuBriefcaseBusiness } from 'react-icons/lu';
import { RiStairsLine } from 'react-icons/ri';
import { IoFastFoodOutline } from 'react-icons/io5';
import { GiSittingDog } from 'react-icons/gi';
import { GrMapLocation } from 'react-icons/gr';
import { TfiLocationPin } from "react-icons/tfi";
import pricemini from '../../Assets/Price Mini-01.png'
import pricemax from '../../Assets/Price maxi-01.png'
import ConfirmationModal from "../ConfirmationModal";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const MatchedProperties = () => {
  const [matchedData, setMatchedData] = useState([]);
  const [removedProperties, setRemovedProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const navigate = useNavigate();    
  const [activeIndex, setActiveIndex] = useState(null);
  const { phoneNumber } = useParams();
  const [error, setError] = useState("");

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
  const iconContainerRef = useRef(null);
  const handleIconScroll = (e) => {
    if (iconContainerRef.current) {
      e.preventDefault();
      const scrollAmount = e.deltaX || e.deltaY;
      iconContainerRef.current.scrollLeft += scrollAmount;
    }
  };

  
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Matched Owner",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);


  
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [confirmAction, setConfirmAction] = useState(null);  
const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const localStorageKey = `removedProperties_${phoneNumber}`;

   useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      setRemovedProperties(JSON.parse(stored));
    }
  }, [phoneNumber]);

   useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(removedProperties));
  }, [removedProperties, phoneNumber]);

 
 

  const handleRemove = (propertyId) => {
    setRemovedProperties((prev) => {
      const updated = [...prev, propertyId];
      localStorage.setItem(localStorageKey, JSON.stringify(updated)); 
      return updated;
    });
  };

  const handleUndoRemove = (propertyId) => {
    setRemovedProperties((prev) => {
      const updated = prev.filter((id) => id !== propertyId);
      localStorage.setItem(localStorageKey, JSON.stringify(updated)); 
      return updated;
    });
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'remove') {
      handleRemove(selectedPropertyId);
    } else if (confirmAction === 'undo') {
      handleUndoRemove(selectedPropertyId);
    }
    setShowConfirmModal(false);
    setSelectedPropertyId(null);
    setConfirmAction(null);
  };
  

  const confirmRemove = (propertyId) => {
    setSelectedPropertyId(propertyId);
    setConfirmAction('remove');
    setShowConfirmModal(true);
  };
  
  const confirmUndoRemove = (propertyId) => {
    setSelectedPropertyId(propertyId);
    setConfirmAction('undo');
    setShowConfirmModal(true);
  };
  const handleCancelAction = () => {
    setShowConfirmModal(false);
  };

  const filteredData = matchedData.filter((item) => {
    const propertyId = item?.matchedProperties?.[0]?.propertyId;
    if (!propertyId || !item?.buyerAssistanceCard) return false;

    if (activeTab === "ALL") {
      return !removedProperties.includes(propertyId);
    } else {
      return removedProperties.includes(propertyId);
    }
  });

  
  const fetchMatchedData = async () => {
    if (!phoneNumber) return alert("Phone number is required");

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-matched-datas-buyer-payment`, {
        params: { phoneNumber },
      });
      setMatchedData(response.data.data);
    } catch (error) {
    } finally {
    }
  };


  useEffect(() => {
    fetchMatchedData();
  }, [phoneNumber]);

  
const handlePayNow = (ba_id, phoneNumber) => {
  if (!ba_id || !phoneNumber) {
    alert("Missing BA ID or phone number");
    return;
  }

  navigate("/buyer-plan", {
    state: {
      baId: ba_id,
      phoneNumber: phoneNumber,
    },
  });
};


  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
         <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%',  fontFamily: "Inter, sans-serif"}}>
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
        </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}> MATCHED BUYER</h3> </div>
          {/* Tabs */}
          <div className="row g-2 w-100 mb-4">
            <div className="col-6 p-0">
        <button className="w-100"
          style={{
            padding: "10px",
            backgroundColor: activeTab === "ALL" ? "#0f766e" : "#e5e5e5",
            color: activeTab === "ALL" ? "#fff" : "#000",
            border: "none",
          }}
          onClick={() => setActiveTab("ALL")}
        >
          ALL BUYER
        </button>
        </div>
        <div className="col-6 p-0">
        <button className="w-100"
          style={{
            padding: "10px",
            backgroundColor: activeTab === "REMOVED" ? "#FF4D00" : "#e5e5e5",
            color: activeTab === "REMOVED" ? "#fff" : "#000",
            border: "none",
          }}
          onClick={() => setActiveTab("REMOVED")}
        >
          REMOVED BUYER
        </button>
        </div>
        <div className="col-12">
<div className="w-100 d-flex align-items-center justify-content-center">
<div className="row mt-4 w-100">
       {filteredData.length === 0 ? (
<div
  className="text-center my-4"
  style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}
>
  <img src={NoData} alt="No data" width={100} />
  <p>
    {activeTab === "ALL"
      ? "No matched properties found."
      : "No removed properties found."}
  </p>
</div>
      ) : (
        filteredData.map((item, index) => (
          <div className="card w-100"
            key={index}
              style={{
          maxWidth: "100%",
          border: "1px solid #ddd",
          borderRadius: "10px",
          overflow: "hidden",
          padding: "15px",
          marginBottom: "15px",
        }}
          >
                    <div className="row d-flex align-items-center">
           <div className="col-md-3 col-4 d-flex flex-column align-items-center justify-content-center mb-1">
             <img
              src={profil}
              alt="Placeholder"
              className="rounded-circle img-fluid"
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
            <span className=" mt-1 rounded-1" style={{background:"#30747F" , color:"#fff" , fontSize:"8px" , padding:"2px" }}>                BA_ID:  {item?.buyerAssistanceCard?.Ba_Id  || "N/A"}
            </span>
          </div>
          <div className="p-0" style={{ background: "#707070", width: "2px", height: "80px" }}></div>
          <div className="col-md-7 col-6 p-0 ms-4">
            <div className="text-center rounded-1 w-100 mb-1" style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "14px" }}>
              MATCHED BUYER
            </div>
            <div className="d-flex">
              <p className="mb-1 ps-2 px-2 rounded-1" style={{ color: "#30747F", fontWeight: "500", fontSize: "10px" ,border:"1px solid #30747F" }}>
                PPC ID : {item?.matchedProperties[0]?.propertyId || "N/A"}

              </p>
            </div>
            <h5 className="mb-1" style={{ color: "#5E5E5E", fontWeight: "500", fontSize: "12px" }}>
            {item?.buyerAssistanceCard?.propertyMode  || "N/A"}            </h5>
            <h5 className="mb-1" style={{ color: "#000000", fontWeight: "bold", fontSize: "13px" }}>
            {item?.buyerAssistanceCard?.propertyType  || "N/A"}            </h5>
          </div>
        </div>
        <div
       className="d-flex align-items-center overflow-auto mb-1 p-1 rounded-1 w-100"
          style={{
            whiteSpace: "nowrap",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            border: "1px solid #30747F",
          }}
          onWheel={handleIconScroll}
          ref={iconContainerRef}
        >
          <div className="d-flex align-items-center me-3">
            <img src={pricemini} alt="" height={12}/>
             <p className="mb-0 ms-1 small" style={{fontSize:"10px"}}>{item?.buyerAssistanceCard?.minPrice  || "N/A"}</p>
          </div>
          <div className="d-flex align-items-center me-3">
          <img src={pricemax} alt=""  height={12}/>

             <p className="mb-0 ms-1 small" style={{fontSize:"10px"}}>{item?.buyerAssistanceCard?.maxPrice  || "N/A"}</p>
          </div>
          <div className="d-flex align-items-center me-3">
            <GoHome size={14} className="me-2" color="#30747F" />
            <p className="mb-0 small" style={{fontSize:"10px"}}>            {item?.buyerAssistanceCard?.propertyMode  || "N/A"}
            </p>
          </div>
          <div className="d-flex align-items-center me-3">
            <MdOutlineMapsHomeWork size={14} className="me-2" color="#30747F" />
            <p className="mb-0 small" style={{fontSize:"10px"}}>            {item?.buyerAssistanceCard?.propertyType  || "N/A"}
            </p>
          </div>
        </div>

          <p className="mb-0">
            <TfiLocationPin  size={16} className="me-2" color="#30747F" />
            <span style={{  color: "#1D1D1D" , fontSize:"12px", fontWeight:"500"}}>
            {item?.buyerAssistanceCard?.city  || "N/A"}
            </span>
          </p>

        <div className="d-flex justify-content-between align-items-center">
          <p className="mb-0">
            <MdOutlineCall size={16} className="me-2" color="#30747F" />
          <span style={{  color: "#1D1D1D" , fontSize:"12px", fontWeight:"500"}}>Buyer Number :  {activeIndex === index ? item?.buyerAssistanceCard?.phoneNumber: item?.buyerAssistanceCard?.phoneNumber.slice(0, -5) + "*****"}</span> 
          </p>
        </div>
      
        <button className='w-100 m-0 p-1'
      onClick={(e) =>{
        e.stopPropagation();
         setActiveIndex(activeIndex === index ? null : index)}}

      style={{
        background: "#2F747F", 
        color: "white", 
        border: "none", 
        marginLeft: "10px", 
        cursor: "pointer",
        borderRadius: "5px",
        fontSize:"12px"
      }}>
              {activeIndex === index ? "HIDE BUYER NUMBER" : "VIEW BUYER NUMBER"}
              </button>
              {activeIndex === index && (

  <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
 
            {activeTab === "ALL" ? (
                <button
                className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                style={{ background: "#FF0000", color: "white", cursor: "pointer",  fontSize: "13px"}}
                onMouseOver={(e) => {
                  e.target.style.background = "#FF6700"; 
                  e.target.style.fontWeight = 600; 
                  e.target.style.transition = "background 0.3s ease"; 
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "#FF4500"; 
                  e.target.style.fontWeight = 400; 
        
                }}
                
                   onClick={(e) => {
                    e.stopPropagation();
                    confirmRemove(item?.matchedProperties[0]?.propertyId);
                   }}
                  
                >
                  Remove
                </button>
              ) : (
                <button
                className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                style={{ background: "green", color: "white", cursor: "pointer" ,  fontSize: "13px"}}

                              onMouseOver={(e) => {
                                e.target.style.background = "#32cd32"; 
                                e.target.style.fontWeight = 600; 
                                e.target.style.transition = "background 0.3s ease"; 
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = "#39ff14"; 
                                e.target.style.fontWeight = 400; 
                      
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
 
                                confirmUndoRemove(item?.matchedProperties[0]?.propertyId)                    
                                          }}
                              
                 >
                  Undo
                </button>
              )}
   
<button
  className="btn text-white px-3 py-1 flex-grow-1 mx-1"
  style={{background: '#2F747F'
    , width: "80px", fontSize: "13px" }}
  onMouseOver={(e) => {
    e.target.style.background = "#4ba0ad"; 
    e.target.style.fontWeight = 600; 
    e.target.style.transition = "background 0.3s ease"; 
  }}
  onMouseOut={(e) => {
    e.target.style.background = "#2F747F"; 
    e.target.style.fontWeight = 400; 

  }}
 
            onClick={() => navigate(`/detail/${item?.matchedProperties[0]?.propertyId}`)}
 >
  More
</button>

  {item?.buyerAssistanceCard?.payustatususer !== "paid" && (
    <button
      className="btn btn-danger text-white px-3 py-1 mx-1"
      style={{ fontSize: "13px" }}
      onClick={() =>
        handlePayNow(
          item?.buyerAssistanceCard?.Ba_Id,
          item?.buyerAssistanceCard?.phoneNumber
        )
      }
    >
      Pay Now
    </button>
  )}

              </div>
            )}

          </div>
        ))
      )}
   </div>
    </div>
    </div>
    </div>
    </div>

    <ConfirmationModal
  show={showConfirmModal}
  onHide={() => setShowConfirmModal(false)}
  onConfirm={handleConfirmAction}
  onCancel={handleCancelAction}      

  title={confirmAction === 'remove' ? "Remove Property" : "Undo Removal"}
  message={`Are you sure you want to ${confirmAction === 'remove' ? "remove" : "undo removal of"} this property?`}

/>

    </div>

  );
};

export default MatchedProperties;


