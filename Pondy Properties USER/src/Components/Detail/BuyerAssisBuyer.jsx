






import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import profil from "../../Assets/xd_profile.png";
import {
  MdOutlineCall,
  MdOutlineMapsHomeWork,
  MdCalendarMonth,
  MdOutlineBed,
} from "react-icons/md";
import { RiStairsLine } from "react-icons/ri";
import { GoHome } from "react-icons/go";
import { TfiLocationPin } from "react-icons/tfi";
import maxrupe from "../../Assets/Price maxi-01.png";
import minrupe from "../../Assets/Price Mini-01.png";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";



const BuyerAssisBuyer = () => {
  const [assistanceData, setAssistanceData] = useState([]);
  const [removedData, setRemovedData] = useState([]);
  const [expiredData, setExpiredData] = useState([]);
  const [activeTab, setActiveTab] = useState("my-tenant");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedPpcId, setSelectedPpcId] = useState("");
  const [interestData, setInterestData] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const iconContainerRef = useRef(null);
  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber);

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
const handlePayNow = (ba_id, phoneNumber) => {
  if (!ba_id || !phoneNumber) {
    setError("Missing BA ID or Phone Number");
    return;
  }

  navigate("/buyer-plan", {
    state: {
      baId: ba_id,
      phoneNumber,
    },
  });
};

const handleRemove = async (ba_id) => {
  try {
    // Find the item and move to removed
    const itemToRemove = assistanceData.find(item => item.ba_id === ba_id);
    if (itemToRemove) {
      setAssistanceData(assistanceData.filter(item => item.ba_id !== ba_id));
      setRemovedData([...removedData, itemToRemove]);
      setMessage("Buyer assistance removed successfully!");
    }
  } catch (error) {
    setMessage("Failed to remove buyer assistance.");
  }
};

const handleUndoRemove = async (ba_id) => {
  try {
    // Find the item and move back to assistance data
    const itemToRestore = removedData.find(item => item.ba_id === ba_id);
    if (itemToRestore) {
      setRemovedData(removedData.filter(item => item.ba_id !== ba_id));
      setAssistanceData([itemToRestore, ...assistanceData]);
      setMessage("Buyer assistance restored successfully!");
    }
  } catch (error) {
    setMessage("Failed to restore buyer assistance.");
  }
};

const openConfirmation = (action, data) => {
  setConfirmAction(action);
  setConfirmData(data);
  setShowConfirmation(true);
};

const handleConfirmationResult = (confirmed) => {
  setShowConfirmation(false);
  
  if (confirmed) {
    if (confirmAction === "remove") {
      handleRemove(confirmData);
    } else if (confirmAction === "payNow") {
      handlePayNow(confirmData.ba_id, confirmData.phoneNumber);
    } else if (confirmAction === "undo") {
      handleUndoRemove(confirmData);
    }
  }
  
  setConfirmAction(null);
  setConfirmData(null);
};

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Buyer Assis Buyer",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

 

     const handleViewMore = (phoneNumber, ppcId) => {
      navigate(`/detail/${ppcId}`, { state: {phoneNumber } });

    };
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
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchAllAssistanceData = async () => {
      try {
     

        const interestResponse = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-interests`);
        const sortedInterestData = interestResponse.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setInterestData(sortedInterestData);
      } catch (err) {
        setError("Error fetching assistance data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllAssistanceData();
  }, [phoneNumber]);


  useEffect(() => {
  const fetchAllAssistanceData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/buyer-assistance-with-payment/${phoneNumber}`
      );
      
   

const sortedData =response.data.data.sort(
  (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
);


      setAssistanceData(sortedData);
    } catch (err) {
      setError("Error fetching assistance data");
    } finally {
      setLoading(false);
    }
  };

  fetchAllAssistanceData();
}, [phoneNumber]);


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

  if (loading) return <p>Loading...</p>;


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
    <div
      className="d-flex flex-column justify-content-center align-items-center p-0"
      style={{ padding: "10px", gap: "15px", borderRadius: "10px", overflowY: "auto" }}
      onWheel={handleWheelScroll}
      ref={scrollContainerRef}
    >
         <div className='d-flex flex-column ' style={{maxWidth:"500px", width:"100%"}}>
    <div className="d-flex align-items-center justify-content-start w-100 pt-2 pb-2"     style={{
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
            
               <h3 className="m-0 ms-3" style={{fontSize:"15px", fontWeight:"bold"}}>MY BUYER ASSISTANCE</h3> </div>

      <div className="d-flex w-100 p-2" style={{ maxWidth: "500px", background: "#E8E8E8", borderRadius: "8px", marginTop: "10px", gap: "8px" }}>
        <button
          onClick={() => setActiveTab("my-tenant")}
          className="btn px-2 py-2 flex-grow-1"
          style={{
            background: activeTab === "my-tenant" ? "#3D3D5C" : "#D3D3D3",
            color: activeTab === "my-tenant" ? "white" : "black",
            fontSize: "12px",
            fontWeight: activeTab === "my-tenant" ? "bold" : "normal",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            flex: 1
          }}
        >
          My Tenant ({assistanceData.length})
        </button>
        <button
          onClick={() => setActiveTab("removed")}
          className="btn px-2 py-2 flex-grow-1"
          style={{
            background: activeTab === "removed" ? "#3D3D5C" : "#D3D3D3",
            color: activeTab === "removed" ? "white" : "black",
            fontSize: "12px",
            fontWeight: activeTab === "removed" ? "bold" : "normal",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            flex: 1
          }}
        >
          Removed ({removedData.length})
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className="btn px-2 py-2 flex-grow-1"
          style={{
            background: activeTab === "expired" ? "#3D3D5C" : "#D3D3D3",
            color: activeTab === "expired" ? "white" : "black",
            fontSize: "12px",
            fontWeight: activeTab === "expired" ? "bold" : "normal",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            flex: 1
          }}
        >
          Expired ({expiredData.length})
        </button>
        <button
          onClick={() => navigate(`/buyer-assistance/${phoneNumber}`)}
          className="btn px-2 py-2 flex-grow-1"
          style={{
            background: "#28a745",
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            flex: 1
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#218838";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#28a745";
            e.target.style.transform = "scale(1)";
          }}
        >
          + Add Tenant
        </button>
      </div>

      {message && <div className="alert text-success fw-bold">{message}</div>}


      
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
      </div>      ) : (() => {
        const currentData = activeTab === "my-tenant" ? assistanceData : activeTab === "removed" ? removedData : expiredData;
        return currentData.length > 0 ? (
        currentData.map((card) => (
          <div
            key={card._id}
            className="card p-1 mt-1 mb-3"
            style={{ width: '100%', background: '#F9F9F9', overflow: 'hidden' }}
          >
            <div className="row d-flex align-items-center">
              <div className="col-3 d-flex flex-column align-items-center justify-content-center mb-1">
  <img
    src={profil}
    alt="Profile"
    className="rounded-circle mt-2"
    style={{ width: "60px", height: "60px", objectFit: "cover" }}
  />
  <span className="text-center" style={{color:"blue" , fontSize:"11px" , fontWeight:500}}>{card.ba_status}</span>
</div>

              <div className="p-0" style={{ background: "#707070", width: "1px", height: "80px" }}></div>
              <div className="col-7 p-0 ms-4">
                <div className="d-flex justify-content-between">
                  <p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: "500" }}>
                    BA ID: {card.ba_id}
                  </p>
               
<p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: "500" }}>
  <MdCalendarMonth size={12} className="me-2" color="#019988" />
  {
    card.updatedAt && card.updatedAt !== card.createdAt
      ? new Date(card.updatedAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : new Date(card.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
  }
</p>


                </div>
                <h5 className="mb-1" style={{ fontSize: "16px", color: "#000", fontWeight: "500" }}>
                  {card.baName || "N/A"}{" "}
                  <span className="text-muted" style={{ fontSize: "12px" }}>| Buyer</span>
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
              >
                <div className="d-flex align-items-center me-3">
                  <GoHome size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyMode || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineMapsHomeWork size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyType || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdCalendarMonth size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.paymentType || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineBed size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.bedrooms || "N/A"} BHK</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <RiStairsLine size={12} className="me-2" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyAge || "N/A"}</p>
                </div>
              </div>

              <div className="mb-0 mt-1">
                <p className="mb-0 fw-semibold" style={{ fontSize: "12px" }}>
                  <TfiLocationPin size={16} className="me-2" color="#019988" />
                  {card.area || "N/A"}, {card.state || "N/A"}
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


                <div className="d-flex">
          

{activeTab === "my-tenant" && (
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
                
                  }} 
                  onClick={() => navigate(`/detail-buyer-assis/${card.ba_id}`)}
                  >
                  View
                </button>
)}

{activeTab === "my-tenant" && card.showPayNowButton && card.ba_id && card.phoneNumber && (
  <button
    className="btn btn-success text-white px-3 py-1 mx-1"
    style={{ fontSize: "13px" }}
    onClick={() => openConfirmation("payNow", { ba_id: card.ba_id, phoneNumber: card.phoneNumber })}
  >
    Pay Now
  </button>
)}

{activeTab === "my-tenant" && (
  <button
    className="btn text-white px-3 py-1 mx-1"
    style={{ background: "#FF6B6B", fontSize: "13px" }}
    onMouseOver={(e) => {
      e.target.style.background = "#E63946";
      e.target.style.fontWeight = 500;
      e.target.style.transition = "background 0.3s ease";
    }}
    onMouseOut={(e) => {
      e.target.style.background = "#FF6B6B";
      e.target.style.fontWeight = 400;
    }}
    onClick={() => openConfirmation("remove", card.ba_id)}
  >
    Remove
  </button>
)}

{activeTab === "removed" && (
  <button
    className="btn text-white px-3 py-1 mx-1"
    style={{ background: "#28a745", fontSize: "13px" }}
    onMouseOver={(e) => {
      e.target.style.background = "#218838";
      e.target.style.fontWeight = 500;
      e.target.style.transition = "background 0.3s ease";
    }}
    onMouseOut={(e) => {
      e.target.style.background = "#28a745";
      e.target.style.fontWeight = 400;
    }}
    onClick={() => openConfirmation("undo", card.ba_id)}
  >
    Undo
  </button>
)}

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
<img src={NoData} alt="" width={100}/>      
<p>No {activeTab === "my-tenant" ? "buyer assistance" : activeTab === "removed" ? "removed items" : "expired items"} found.</p>
</div>
      );
      })()}

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

      {showConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
          <div className="bg-white p-4 rounded" style={{ minWidth: "300px" }}>
            <h6 className="mb-3">
              {confirmAction === "remove" && "Are you sure you want to remove this buyer assistance?"}
              {confirmAction === "payNow" && "Do you want to proceed with payment?"}
              {confirmAction === "undo" && "Are you sure you want to restore this buyer assistance?"}
            </h6>
            <div className="d-flex justify-content-end gap-2">
              <button 
                className="btn btn-secondary" 
                onClick={() => handleConfirmationResult(false)}
              >
                No
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleConfirmationResult(true)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default BuyerAssisBuyer;

