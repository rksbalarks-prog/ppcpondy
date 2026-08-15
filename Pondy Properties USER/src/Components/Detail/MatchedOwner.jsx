











import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTelegramPlane } from "react-icons/fa";
import calendar from '../../Assets/Calender-01.png'
import bed from '../../Assets/BHK-01.png'
import totalarea from '../../Assets/Total Area-01.png'
import postedby from '../../Assets/Posted By-01.png'
import indianprice from '../../Assets/Indian Rupee-01.png'
import pic from '../../Assets/Default image_PP-01.png';
import ConfirmationModal from "../ConfirmationModal";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const MatchedProperties = () => {
  const [matchedData, setMatchedData] = useState([]);
  const [removedProperties, setRemovedProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const { phoneNumber } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", type: "" });
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

  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const confirmAction = (propertyId, action) => {
    setSelectedPropertyId(propertyId);
    setModalAction(action);
    setShowModal(true);
  };

  const handleConfirmedAction = () => {
    if (modalAction === "remove") {
      handleRemove(selectedPropertyId);
      setMessage({ text: "Property removed successfully", type: "success" });
    } else if (modalAction === "undo") {
      handleUndoRemove(selectedPropertyId);
      setMessage({ text: "Undo successful", type: "success" });
    }
    setShowModal(false);
  };

  const handleCancelAction = () => {
    setShowModal(false);
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
        console.error(err);
      }
    };

    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (phoneNumber) {
      fetchMatchedData();
    }
    const storedRemovedProperties = JSON.parse(localStorage.getItem('removedProperties')) || [];
    setRemovedProperties(storedRemovedProperties);
  }, [phoneNumber]);

  const fetchMatchedData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-matched-data-owner`, {
        params: { phoneNumber },
      });

      const sortedData = response.data.data.sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      setMatchedData(sortedData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemove = (propertyId) => {
    const updated = [...removedProperties, propertyId];
    setRemovedProperties(updated);
    localStorage.setItem("removedMatchedProperties", JSON.stringify(updated));
  };
  
  const handleUndoRemove = (propertyId) => {
    const updated = removedProperties.filter((id) => id !== propertyId);
    setRemovedProperties(updated);
    localStorage.setItem("removedMatchedProperties", JSON.stringify(updated));
  };

  const filteredData = matchedData.filter((item) => {
    const propertyId = item?.propertyDetails?.propertyId;
    if (!propertyId) return false;
    if (activeTab === "ALL") {
      return !removedProperties.includes(propertyId);
    } else {
      return removedProperties.includes(propertyId);
    }
  });

  const formatPrice = (price) => {
    price = Number(price);
    if (isNaN(price)) return 'N/A';

    if (price >= 10000000) {
      return (price / 10000000).toFixed(2) + ' Cr';
    } else if (price >= 100000) {
      return (price / 100000).toFixed(2) + ' Lakhs';
    } else {
      return price.toLocaleString('en-IN');
    }
  };

   const renderMatchedCards = (item) => {
    if (!item.matchedBuyerRequests || item.matchedBuyerRequests.length === 0) {
      return (
        <div className="row g-0 rounded-4 mb-2" style={{ border: '1px solid #ddd', overflow: "hidden", background:"#EFEFEF"}}>
          {renderPropertyDetails(item)}
        </div>
      );
    }

    return item.matchedBuyerRequests.map((buyer, buyerIndex) => (
      <div className="row g-0 rounded-4 mb-2" style={{ border: '1px solid #ddd', overflow: "hidden", background:"#EFEFEF"}} key={`${item.propertyDetails.propertyId}-${buyerIndex}`}>
        {renderPropertyDetails(item)}
        <div className='text-center' style={{border:"2px solid #2F747F", borderRadius:"0px 0px 15px 15px", overflow: "hidden", fontSize:"14px", color:"grey"}}>
          <span
            onClick={() => navigate(`/detail-buyer-assistance/${buyer.Ba_Id}`)}  
            style={{
              cursor: "pointer",
              display: "block",
              padding: "8px"
            }}
          >
            Matched to BA ID: {buyer.Ba_Id || 'N/A'}
            <span
              style={{
                marginLeft: "10px",
                background: "none",
                border: "none",
                color: "#0f766e",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation(); 
                navigate(`/detail-buyer-assistance/${buyer.Ba_Id}`);
              }}
            >
              Expand <FaTelegramPlane />
            </span>
          </span>
        </div>
      </div>
    ));
  };

   const renderPropertyDetails = (item) => (
    <>
      <div className="col-md-4 col-4 d-flex flex-column justify-content-between align-items-center">
        <div className="text-white py-1 px-2 text-center" style={{ width: '100%', background: "#2F747F" }}>
          PP ID : {item.propertyDetails.propertyId}
        </div>
        <div style={{ position: "relative", width: "100%", height:'160px'}}>
   

    <img
  src={
    item.propertyDetails.photos?.length
      ? `https://ppcpondy.com/PPC/${item.propertyDetails.photos[0]
          .replace(/\\/g, "/")
          .replace(/^\/+/, "")
          .trim()}`
      : pic
  }
  alt={(
    `${item.propertyDetails.ppcId || 'N/A'}-${item.propertyDetails.propertyMode || 'N/A'}-${item.propertyDetails.propertyType || 'N/A'}-rs-${item.propertyDetails.price || '0'}
    -in-${item.propertyDetails.city || ''}-${item.propertyDetails.area || ''}-${item.propertyDetails.state || ''}`
  )
    .replace(/\s+/g, "-")
    .replace(/,+/g, "-")
    .toLowerCase()}
  className="img-fluid"
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>


  

        </div>
      </div>
      <div className="col-md-8 col-8" style={{paddingLeft:"10px", background:"#F5F5F5"}}>
        <div className="d-flex justify-content-between">
          <p className="m-0 " style={{ color:'#0f766e', fontSize:"13px" }}>PP ID : {item.propertyDetails.propertyId}</p>

          {activeTab === "ALL" ? (
            <p className="m-0 ps-3 pe-3" 
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
                onClick={() => confirmAction(item.propertyDetails.propertyId, "remove")}
                >
              Remove
            </p>
          ) : (
            <p className="m-0 ps-3 pe-3"
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
                onClick={() => confirmAction(item.propertyDetails.propertyId, "undo")}
                >
              Undo
            </p>
          )}
        </div>
      
        <p className="m-0 " style={{ color:'#5E5E5E', fontSize:"13px" }}>{item.propertyDetails.propertyMode} </p>
        <p className="fw-bold m-0" style={{ color:'#000000' , fontSize:"13px"}}>{item.propertyDetails.propertyType}</p>
        <p className=" m-0" style={{ color:'#5E5E5E', fontSize:"13px"}}>{item.propertyDetails.area}, {item.propertyDetails.city}</p>
        <div className="card-body ps-2 m-0 pt-0 pe-2 pb-0 d-flex flex-column justify-content-center" style={{background:"#FAFAFA"}}>
          <div className="row">
            <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1">
              <img src={totalarea} alt="" width={12} className="me-2"/>
              <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>
                {item.propertyDetails.totalArea} {item.propertyDetails.areaUnit}
              </span>
            </div>
            <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
              <img src={bed} alt="" width={12} className="me-2"/>
              <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                {item.propertyDetails.bedrooms} BHK
              </span>
            </div>
            <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
              <img src={postedby} alt="" width={12} className="me-2"/>
              <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                {item.propertyDetails.postedBy}
              </span>
            </div>
            <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
              <img src={calendar} alt="calendar" width={12} className="me-2" />
              <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 500 }}>
                {
                  item.propertyDetails.updatedAt &&
                  item.propertyDetails.updatedAt !== item.propertyDetails.createdAt
                    ? new Date(item.propertyDetails.updatedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : new Date(item.propertyDetails.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                }
              </span>
            </div>
            <div className="col-12 d-flex flex-col align-items-center mt-1 mb-1 ps-1">
              <h6 className="m-0">
                <span style={{ fontSize:'15px', color:'#2F747F', fontWeight:600, letterSpacing:"1px" }}> 
                  <img src={indianprice} alt="" width={8} className="me-2"/>
                  {item.propertyDetails.price
                    ? formatPrice(item.propertyDetails.price)
                    : 'N/A'} 
                </span> 
              </h6>
            </div>
          </div>
        </div>
      </div>
    </>
  );

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
            <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out', background:"transparent"}} />
          </button>          
          <h3 className="m-0" style={{fontSize:"20px"}}>MY MATCHED PROPERTIES</h3> 
        </div>
        
        <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button className="w-100"
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: activeTab === "ALL" ? "#0f766e" : "#e5e5e5",
                color: activeTab === "ALL" ? "#fff" : "#000",
                border: "none",
              }}
              onClick={() => setActiveTab("ALL")}
            >
              ALL
            </button>
          </div>

          <div className="col-6 p-0">
            <button className="w-100"
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: activeTab === "REMOVED" ? "#FF4D00" : "#e5e5e5",
                color: activeTab === "REMOVED" ? "#fff" : "#000",
                border: "none",
              }}
              onClick={() => setActiveTab("REMOVED")}
            >
              REMOVED
            </button>
          </div>
        </div>
        
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
                <div key={`property-${index}`}>
                  {renderMatchedCards(item)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleConfirmedAction}
        onCancel={handleCancelAction}
        title="Confirm Action"
        message={`Are you sure you want to ${modalAction} this property?`}
      />
    </div>
  );
};

export default MatchedProperties;