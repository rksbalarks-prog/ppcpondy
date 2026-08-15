
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import profil from "../Assets/xd_profile.png";
import {
  MdOutlineCall,
  MdOutlineMapsHomeWork,
  MdCalendarMonth,
  MdOutlineBed,
} from "react-icons/md";
import { RiStairsLine } from "react-icons/ri";
import { GoHome } from "react-icons/go";
import { TfiLocationPin } from "react-icons/tfi";
import maxrupe from "../Assets/Price maxi-01.png";
import minrupe from "../Assets/Price Mini-01.png";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../Assets/OOOPS-No-Data-Found.png";

const BuyerListFilter = () => {
  const [assistanceData, setAssistanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedPpcId, setSelectedPpcId] = useState("");
  const [interestData, setInterestData] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
    const [hovered, setHovered] = useState(false);
    const [matchedProperties, setMatchedProperties] = useState([]);
     const [noMatchMessage, setNoMatchMessage] = useState("");
    const [isScrolling, setIsScrolling] = useState(false);
  const [plans, setPlans] = useState([]);

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
    const baseStyle = {
      backgroundColor: "#019988",
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    };
  
    const hoverStyle = {
      backgroundColor: "#017a6e",
    };
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const iconContainerRef = useRef(null);
  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber);
  // Filters passed by FormComponent (Buyer Assistance Search). When the page
  // is opened directly (no filters) this is just an empty object and every
  // buyer slips through the filter as if no criteria were set.
  const incomingFilters = location.state?.filters || {};
const [accessData, setAccessData] = useState(null);



  const handleConfirmCall = (type, phone, ba_id) => {
    setSelectedType(type);
    setSelectedPhone(phone);
    setSelectedPpcId(ba_id);
    setShowPopup(true);
  };
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Buyer Lists",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);



  const handleSendInterest = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/update-status-buyer-assistance/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ba_status: "buyer-assistance-interest",
            userPhoneNumber: phoneNumber,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage("Interest sent successfully!");
      } else {
        setMessage(`Failed to send interest: ${data.message}`);
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
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
 
useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer); // Clear timeout on unmount or message change
  }
}, [message]);

 

const handleMoreClick = async (ba_id) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/check-user-access-buyer-assistance`,
      { phoneNumber }
    );

    const {
      success,
      userHasProperty,
      userIsPaid,
      allowedBuyerAssistanceViews,
      viewedBuyerAssistances,
      remainingViews,
    } = res.data;

    if (success && userHasProperty && userIsPaid) {
      if (remainingViews > 0) {
         await axios.post(`${process.env.REACT_APP_API_URL}/log-buyer-assist-view`, {
          phoneNumber,
          ba_id,
        });

        navigate(`/detail-buyer-assistance/${ba_id}`);
      } else {
        setMessage(
          `You have reached your limit of 2 views. Please purchase a new plan or add more properties.`
        );
      }
    } else {
      setMessage("You need to add a property and purchase a plan to view buyer assistance details.");
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Something went wrong. Try again.";
    setMessage(errorMsg);
  }
};


useEffect(() => {
  const fetchPaidPlans = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/plans-by-phone-only-paid/${phoneNumber}`);
      setPlans(res.data.plans || []);
    } catch (err) {
     }
  };

  if (phoneNumber) {
    fetchPaidPlans();
  }
}, [phoneNumber]);


  const handlePopupResponse = async (confirmed) => {
    setShowPopup(false);

    if (!confirmed || !selectedPhone || !selectedType) return;

    try {
      if (selectedType === "buyer") {
        await axios.post(`${process.env.REACT_APP_API_URL}/contact-buyer-send`, {
          phoneNumber: selectedPhone,
          ba_id: selectedPpcId,
        });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/contact-send`, {
          phoneNumber: selectedPhone,
        });
      }

      setMessage("Contact request sent successfully!");
      window.location.href = `tel:${selectedPhone}`;
    } catch (error) {
      setMessage("Failed to send contact request.");
    }
  };
    useEffect(() => {
      if (!phoneNumber) return;
  
      const fetchMatchedProperties = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-owner-matched-properties?phoneNumber=${phoneNumber}`);
         } catch (error) {
         } finally {
          setLoading(false);
        }
      };
  
      fetchMatchedProperties();
    }, [phoneNumber]);

  const handleMatchClick = () => { 
  if (matchedProperties.length > 0) {
    const matchData = {
      type: "match",
      phoneNumber: matchedProperties[0].phoneNumber,
      ppcId: matchedProperties[0].ppcId,
    };
    
     console.log("Matched data:", matchData);

  } else {
    setNoMatchMessage("There is no matched properties");
  }
};

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  useEffect(() => {
    const fetchAllAssistanceData = async () => {
      try {
         const assistanceResponse = await axios.get(`${process.env.REACT_APP_API_URL}/get-buyerAssistances`);
        const sortedAssistanceData = assistanceResponse.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
  
      
        setAssistanceData(sortedAssistanceData);  
   
      } catch (err) {
        setError("");
      } finally {
        setLoading(false);
      }
    };
  
    fetchAllAssistanceData();
},[]);

  // Apply the filters that FormComponent passed in. Each field is checked
  // independently; an empty filter value means "no constraint" so users get
  // the full list back if they leave everything blank.
  const filteredAssistance = React.useMemo(() => {
    const f = incomingFilters || {};
    const txt = (v) => String(v ?? "").trim().toLowerCase();
    const has = (rowVal, q) =>
      q ? txt(rowVal).includes(txt(q)) : true;

    const minPriceFilter = f.minPrice !== "" && f.minPrice != null ? Number(f.minPrice) : null;
    const maxPriceFilter = f.maxPrice !== "" && f.maxPrice != null ? Number(f.maxPrice) : null;
    const bedroomsFilter = f.bedrooms ? Number(f.bedrooms) : null;
    const floorNoFilter  = f.floorNo  ? Number(f.floorNo)  : null;
    const idFilter       = f.id ? String(f.id).trim() : "";

    return (assistanceData || []).filter((card) => {
      // ID — match against ba_id (numeric) as a "contains" check so partial
      // IDs work; "352" matches BA ID 352 and 3521.
      if (idFilter && !String(card.ba_id ?? "").includes(idFilter)) return false;

      // Buyer budget overlaps with the requested price band.
      const buyerMin = Number(card.minPrice);
      const buyerMax = Number(card.maxPrice);
      if (minPriceFilter !== null && Number.isFinite(buyerMax) && buyerMax < minPriceFilter) {
        return false;
      }
      if (maxPriceFilter !== null && Number.isFinite(buyerMin) && buyerMin > maxPriceFilter) {
        return false;
      }

      if (bedroomsFilter !== null) {
        const cardBhk = Number(card.bedrooms);
        if (!Number.isFinite(cardBhk) || cardBhk !== bedroomsFilter) return false;
      }
      if (floorNoFilter !== null) {
        const cardFloor = Number(card.floorNo);
        if (!Number.isFinite(cardFloor) || cardFloor !== floorNoFilter) return false;
      }

      if (!has(card.propertyMode, f.propertyMode)) return false;
      if (!has(card.propertyType, f.propertyType)) return false;
      if (!has(card.state, f.state)) return false;
      if (!has(card.city,  f.city))  return false;
      if (!has(card.area,  f.area))  return false;
      return true;
    });
  }, [assistanceData, incomingFilters]);

  const handleWheelScroll = (e) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  };

  const handleIconScroll = (e) => {
    if (iconContainerRef.current) {
      e.preventDefault();
      const scrollAmount = e.deltaX || e.deltaY;
      iconContainerRef.current.scrollLeft += scrollAmount;
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
    <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%',fontFamily: 'Inter, sans-serif'}}>
    <div className="row g-2 w-100">
<div className="d-flex align-items-center justify-content-start w-100"      style={{
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
    </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>Buyer Lists </h3> </div>
     
       <div
      className="d-flex flex-column justify-content-center align-items-center w-100"
      style={{ padding: "10px", gap: "15px", borderRadius: "10px", overflowY: "auto" }}
      onWheel={handleWheelScroll}
      ref={scrollContainerRef}
    >
       <div className="w-100 d-flex justify-content-around align-items-center m-0">
        <button   style={{
          ...baseStyle,
          ...(hovered ? hoverStyle : {}),
        }}
         onClick={() => navigate(`/buyer-assistance/${phoneNumber}`)}
        
        >Add Buyer Assistant</button>
        <button 
        style={{
          ...baseStyle,
          opacity: 0.6,
          cursor: "not-allowed",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
 disabled
   >view Buyer List</button>

      </div>
      {message && <div className="alert text-success fw-bold">{message}</div>}

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
) :filteredAssistance.length > 0 ? (
        filteredAssistance.map((card) => (
  
          <div
  key={card._id}
  className="card p-1"
  style={{ width: '100%', height: 'auto', background: '#F9F9F9', overflow:'hidden' }}

>
  

            <div className="row d-flex align-items-center">
              <div className="col-3 d-flex align-items-center justify-content-center mb-1">
                <img
                  src={profil}
                  alt="Profile"
                  className="rounded-circle mt-2"
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
                />
              </div>
              <div className="p-0" style={{ background: "#707070", width: "1px", height: "80px" }}></div>
              <div className="col-7 p-0 ms-4">
                <div className="d-flex justify-content-between">
                  <p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: "500" }}>
                    BA ID: {card.ba_id}
                  </p>
                  <p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: "500" }}>
                    <MdCalendarMonth size={12} className="me-2" color="#019988" />
                    {card.createdAt.slice(0, 10)}
                  </p>
                </div>
                <h5 className="mb-1" style={{ fontSize: "16px", color: "#000", fontWeight: "500" }}>
                  {card.baName || "N/A"}{" "}
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    | Buyer
                  </span>
                </h5>
                <div className="d-flex align-items-center justify-content-between col-8">
                  <p className="mb-0 me-3 d-flex align-items-center" style={{ fontSize: "12px", fontWeight: 500 }}>
                    <img src={minrupe} alt="min" width={13} className="me-2" />
{formatPrice(card.minPrice)}
                  </p>
                  <p className="mb-0 d-flex align-items-center" style={{ fontSize: "12px", fontWeight: 500 }}>
                    <img src={maxrupe} alt="max" width={13} className="me-2" />
                    {formatPrice(card.maxPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-1">
            <div
                className="d-flex align-items-center overflow-auto mb-0 p-1 rounded-1"
                style={{
                  whiteSpace: "nowrap",
                  minWidth: "100%",
                  overflowX: "auto",
                  scrollbarWidth: "none", 
                  msOverflowStyle: "none",
                  border: "1px solid #019988",
                }}
                onWheel={handleIconScroll}
                ref={iconContainerRef}
                >                <div className="d-flex align-items-center me-3">
                  <GoHome size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyMode}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineMapsHomeWork size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyType}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdCalendarMonth size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.paymentType}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineBed size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.bedrooms} BHK</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <RiStairsLine size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyAge}</p>
                </div>
              </div>

              <div className="mb-0 mt-1">
                <p className="mb-0 fw-semibold" style={{ fontSize: "12px" }}>
                  <TfiLocationPin size={16} className="me-2" color="#019988" />
                  {card.area}, {card.city}
                </p>
              </div>


<div className="d-flex justify-content-between align-items-center mt-2">
  <div className="d-flex align-items-center">
    <MdOutlineCall color="#019988" style={{ fontSize: "12px", marginRight: "8px" }} />
    <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
      {card.phoneNumber
        ? `Buyer Phone: ${card.phoneNumber.slice(0, -5)}*****`
        : "Phone: N/A"}
    </h6>
  </div>
</div>
<div className="d-flex justify-content-end align-items-center m-0">


<button
  className="btn text-white px-3 py-1 mx-1"
  style={{ background: "#3660FF", fontSize: "13px" }}
  onMouseOver={(e) => {
    e.target.style.background = "#0739f5"; 
    e.target.style.fontWeight = 500; 
    e.target.style.transition = "background 0.3s ease"; 

  }}
  onMouseOut={(e) => {
    e.target.style.background = "#3660FF"; 
    e.target.style.fontWeight = 400; 

  }}  onClick={() => handleSendInterest(card._id)}
>
  Send Interest
</button>


<button
  className="btn text-white px-3 py-1 mx-1"
  style={{ background: "#2F747F", fontSize: "13px" }}
  onMouseOver={(e) => {
    e.target.style.background = "#029bb3"; 
    e.target.style.fontWeight = 600; 
    e.target.style.transition = "background 0.3s ease"; 

  }}
  onMouseOut={(e) => {
    e.target.style.background = "#2F747F"; 
    e.target.style.fontWeight = 400; 

  }}
  onClick={() => navigate(`/detail-buyer-assistance/${card.ba_id}`)}

>
  More
</button>
 
  <button
        onClick={handleMatchClick}
        className="btn text-white px-3 py-1 mx-1"
        style={{ background: "#2F747F", fontSize: "13px" }}
      >
        Match Prop
      </button>
        {noMatchMessage && (
        <div
          style={{
             position: 'fixed',
              top: '15%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            backgroundColor: "#fff0f0",
            color: "red",
            border: "1px solid #ffcccc",
            borderRadius: "4px",
            padding: "8px 12px",
            fontSize: "14px",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
            zIndex: 999,
            marginTop: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "max-content",
          }}
        >
          <span>{noMatchMessage}</span>
          <button
            onClick={() => setNoMatchMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "red",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            
          </button>
        </div>
      )}
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
<img src={NoData} alt="" width={100}/>      
<p>No buyer assistance interests found.</p>
</div>
      )}

      {showPopup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
          <div className="bg-white p-4 rounded" style={{ minWidth: "300px" }}>
            <h6 className="mb-3">Are you sure you want to call this buyer?</h6>
            <div className="d-flex justify-content-between">
              <button className="btn btn-success" onClick={() => handlePopupResponse(true)}>Yes</button>
              <button className="btn btn-danger" onClick={() => handlePopupResponse(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
    </div>

  );
};

export default BuyerListFilter;

