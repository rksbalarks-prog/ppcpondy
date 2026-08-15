 


import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaPhone, FaPhoneAlt, FaRegIdCard, FaRupeeSign } from "react-icons/fa";
import { BsBuildings, BsBank } from "react-icons/bs";
import { HiOutlineBuildingOffice2, HiOutlineNewspaper } from "react-icons/hi2";
import { LiaBedSolid, LiaMoneyCheckSolid } from "react-icons/lia";
import { RiCompass3Line } from "react-icons/ri";
import { AiOutlineFileDone } from "react-icons/ai";
import { RxDimensions } from "react-icons/rx";
import { IoLocationOutline } from "react-icons/io5";
import { LuCalendarDays } from "react-icons/lu";
import imge from "../Assets/xd_profile1.png"
import axios from "axios";
import { CgProfile } from "react-icons/cg";

export default function DetailBuyerAssis() {
  const { ba_id } = useParams();  
  const navigate = useNavigate();
  const [buyerAssistance, setBuyerAssistance] = useState(null);
  const [matchedProperties, setMatchedProperties] = useState([]);
   const [noMatchMessage, setNoMatchMessage] = useState("");
 const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem('phoneNumber') || '';
  const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
  const [requestData, setRequestData] = useState(null);
  const [buyerRequests, setBuyerRequests] = useState([]);

  const [planDetails, setPlanDetails] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);  
  const [selectedData, setSelectedData] = useState(null);

   
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
        const timer = setTimeout(() => setMessage(), 3000);
        return () => clearTimeout(timer);
      }
    }, [message]);



 
  useEffect(() => {
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "Detail Buyer Assis",
            viewTime: new Date().toISOString(),
          });
        } catch (err) {
        }
      };
    
      if (phoneNumber) {
        recordDashboardView();
      }
    }, [phoneNumber]);

  const openConfirm = (type, data) => {
    setActionType(type);
    setSelectedData(data);
    setShowConfirm(true);
  };

  const handleMatchClick = () => {
    if (matchedProperties.length > 0) {
      openConfirm("match", {
        phoneNumber: matchedProperties[0].phoneNumber,
        ppcId: matchedProperties[0].ppcId,
      });
    } else {
      setNoMatchMessage("There is no matched properties");
    }
  };

  const handleConfirm = () => {
    if (actionType === "remove" && selectedData) {
      handleRemoveAssistance(selectedData);
    } else if (actionType === "match" && selectedData) {
      handleViewMore(selectedData.phoneNumber, selectedData.ppcId);
    } else if (actionType === "pay" && selectedData) {
     }  else if (actionType === "edit" && selectedData) {
    handleEdit(selectedData.ba_id);
  }
    setShowConfirm(false);
    setActionType(null);
    setSelectedData(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setActionType(null);
    setSelectedData(null);
  };
const handleEdit = (ba_id) => {
  navigate("/edit-buyer-assistance", { state: { ba_id } });
};

  useEffect(() => {
    if (ba_id) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance/${ba_id}`)
        .then((response) => {
          setRequestData(response.data.data);
          setLoading(false);
        })
        .catch((error) => {
          setError('Failed to load Buyer Assistance data.');
          setLoading(false);
        });
    }
  }, [ba_id]);

 


  
    useEffect(() => {
      if (!phoneNumber) return;
  
      const fetchBuyerAssistanceData = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-buyerAssistance?phoneNumber=${phoneNumber}`);
          setPlanDetails(response.data.planDetails);
          setBuyerRequests(response.data.data);
          setLoading(false);
        } catch (err) {
          setError('Failed to load data. Please try again.');
          setLoading(false);
        }
      };
  
      fetchBuyerAssistanceData();
    }, [phoneNumber]);
  
  

    
  const handleRemoveAssistance = async (id) => {
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL}/delete-buyerAssistance/${id}`);
      setMessage("Buyer Assistance request removed successfully!");
      navigate("/buyer-list");  
    } catch (error) {
      setMessage("Failed to delete Buyer Assistance request.");
    }
  };

  
 


   useEffect(() => {
    if (!phoneNumber) return;

    const fetchMatchedProperties = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-owner-matched-properties?phoneNumber=${phoneNumber}`);
        setMatchedProperties(response.data.properties);
      } catch (error) {
       } finally {
        setLoading(false);
      }
    };

    fetchMatchedProperties();
  }, [phoneNumber]);

 

  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!requestData) return <p>No data found.</p>;
  
    const handleViewMore = (phoneNumber, ppcId) => {
       navigate(`/detail/${ppcId}`, { state: {phoneNumber } });

    };


  return (
    <div className='d-flex justify-content-center algin-item-center w-100'>
    
    <div className='d-flex flex-column ' style={{maxWidth:"500px", width:"100%"}}>
    <div className="d-flex align-items-center justify-content-start w-100 pt-2 pb-2"      style={{
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
        e.currentTarget.querySelector('svg').style.color = '#ffffff';  
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f0f0';
        e.currentTarget.querySelector('svg').style.color = '#30747F';
      }}
    >
      <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
    </button> <h3 className="m-0 ms-3" style={{fontSize:"15px", fontWeight:"bold"}}>DETAILED BUYER ASSISTANT</h3> </div>

            {message && <div className="alert text-success text-bold">{message}</div>}



       <div className='d-flex algin-item-center justify-content-center w-100' style={{height:"200px"}}>

        <img src={imge} alt="" style={{width:"200px"}}/></div>
        <div className='d-flex algin-item-center justify-content-center w-100 mt-2'>    
              <div style={{background:"#C5C5C5", height:"2px", width:"90%"}}></div>
        </div>
        <div className="d-flex justify-content-center w-100">

        <div className='row w-100 mt-3 p-0'>
        <h5 className='ps-3 ms-3' style={{ color: "#30747F", fontWeight: "bold", marginBottom: "10px", fontSize:"15px" }}>Buyer Profile</h5>   
            <div className="d-flex align-items-center mb-3">
                      <div className="d-flex  flex-row align-items-start w-100 ps-3">
                      <div className="d-flex align-items-center col-6">
                          <FaRegIdCard color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            BA ID                         </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.ba_id || "N/A"}
                            </span>
                          </div>
                        </div>  
                     
      <div className="d-flex align-items-center col-6">
                          <CgProfile color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            NAME                         </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.baName || "N/A"}
                            </span>
                          </div>
                        </div>  
                        </div>
                        </div>

        <h5 className='ps-3 ms-3' style={{ color: "#30747F", fontWeight: "bold", marginBottom: "10px", fontSize:"15px" }}> Budget</h5>   
            <div className="d-flex align-items-center mb-3">
                      <div className="d-flex  flex-row align-items-start w-100 ps-3">
                      <div className="d-flex align-items-center col-6">
                          <FaRupeeSign color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Minimum Amount                           </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.minPrice || "N/A"}
                            </span>
                          </div>
                        </div>  
                     
      <div className="d-flex align-items-center col-6">
                          <FaRupeeSign color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Maximum Amount                           </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.maxPrice || "N/A"}
                            </span>
                          </div>
                        </div>  
                        </div>
                        </div>
            <h5 className='ps-3 ms-3' style={{ color: "#30747F", fontWeight: "bold", marginBottom: "10px", fontSize:"15px" }}> Looking for</h5>   
            <div className="d-flex align-items-center mb-3">
                      <div className="d-flex  flex-row align-items-start w-100 ps-3">
                      <div className="d-flex align-items-center col-6">
                          <BsBuildings   color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Property Mode                           </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.propertyMode || "N/A"}
                            </span>
                          </div>
                        </div>  
                     
      <div className="d-flex align-items-center col-6">
                          <HiOutlineBuildingOffice2 color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                           Property Type                           </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.propertyType || "N/A"}
                            </span>
                          </div>
                        </div>  
                        </div>
                        </div>
                        
             
            <div className="d-flex align-items-center mb-3">
                      <div className="d-flex  flex-row align-items-start w-100 ps-3">
                      <div className="d-flex align-items-center col-6">
                          <LiaBedSolid color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Min.Bedroom                           </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.bedrooms || "N/A"} BHK
                            </span>
                          </div>
                        </div>  
                     
 

                        <div className="d-flex align-items-center col-6">
                          <RxDimensions color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Minimum Area                             </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.totalArea || "N/A" }{requestData.areaUnit || "N/A"}
                            </span>
                          </div>
                        </div>  
                        </div>
                        </div>
                        
            <div className="d-flex align-items-center mb-3">
                      <div className="d-flex  flex-row align-items-start w-100 ps-3">
                      <div className="d-flex align-items-center col-6">
                          <AiOutlineFileDone   color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Approved                         </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.propertyApproved || "N/A"}
                            </span>
                          </div>
                        </div>  
                     
      <div className="d-flex align-items-center col-6">
                          <BsBank color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Bank Loan                         </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.bankLoan || "N/A"}
                            </span>
                          </div>
                        </div>  
                        </div>
                        </div>
                        
                        
            <div className="d-flex align-items-center mb-3">
                      <div className="d-flex  flex-row align-items-start w-100 ps-3">
                      <div className="d-flex align-items-center col-6">
                          <RiCompass3Line color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                            Select Facing                          </h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500", fontSize:"14px"}}>
                            {requestData.facing || "N/A"}
                            </span>
                          </div>
                        </div>  
                        </div>
                        </div> 
                        
<div className="d-flex align-items-center mb-3">
  <div className="d-flex flex-row align-items-start w-100 ps-3">

     <div className="d-flex align-items-center col-6 mt-2" >
      <FaPhoneAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
      <div>
        <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
          Buyer Phone Number
        </h6>
        <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
          {requestData?.phoneNumber || "N/A"}
        </span>
      </div>
    </div>
    <div className="d-flex align-items-center col-6 mt-2">
  <FaPhoneAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
  <div>
    <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
      Interested User Phone
    </h6>
    <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
      {Array.isArray(requestData?.interestedUserPhone) && requestData?.interestedUserPhone.length > 0
        ? requestData.interestedUserPhone.join(", ")
        : "N/A"}
    </span>
  </div>
</div>

  </div>
</div>

                        <h5 className='ps-3 ms-3' style={{ color: "#30747F", fontWeight: "bold", marginBottom: "10px", fontSize:"15px" }}> Location Preffered</h5>   
                        <div className='ps-3 ms-3 mb-2' style={{ display: 'flex', alignItems: 'center' }}>
  <IoLocationOutline color='#30747F' style={{ fontSize: '24px', flexShrink: 0, marginRight: '8px' }} />
  <p style={{ margin: 0, flex: 1 }}>{requestData.city || "N/A"}</p>

</div>


                        <h5 className='ps-3 ms-3' style={{ color: "#30747F", fontWeight: "bold", marginBottom: "10px", fontSize:"15px" }}>Description</h5>   

<div className=' ms-3 mb-3' style={{ display: 'flex', alignItems: 'center' }}>
  <HiOutlineNewspaper color='#30747F' style={{ fontSize: '24px', flexShrink: 0, marginRight: '8px' }} />
  <p style={{ margin: 0, flex: 1 }}>{requestData.description || "No Description Available"}</p>
  
</div>

         


<div className="d-flex align-items-center mb-3">
  <div className="d-flex flex-row align-items-start w-100 ps-3">
     <div className="d-flex align-items-center col-6">
      <LiaMoneyCheckSolid color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
      <div>
        <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
          Plan Name
        </h6>
        <span
          className="card-text"
          style={{ color: "#1D1D1D", fontWeight: "500", fontSize: "14px" }}
        >
          {planDetails?.planName || "N/A"}
        </span>
        
      </div>
    </div>

     <div className="d-flex align-items-center col-6">
      <LuCalendarDays color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
      <div>
        <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
          Expire Date
        </h6>
        <span
          className="card-text"
          style={{ color: "#1D1D1D", fontWeight: "500", fontSize: "14px" }}
        >
          {planDetails?.planExpiryDate || "N/A"}
        </span>
      </div>
    </div>
  </div>
</div>


  

                        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-5 mb-5 col-12">
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

 
 
    <button className="btn text-white px-3 py-1 mx-1" style={{ background: "#ECA129", fontSize: "13px" }}
         onClick={() => openConfirm("edit", requestData)}

 onMouseOver={(e) => {
      e.target.style.background = "#E47900";  
    }}
    onMouseOut={(e) => {
      e.target.style.background = "#ECA129";  
    }}>
    Edit
  </button>
   
</div>
{showConfirm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="bg-white p-4 rounded shadow" style={{ width: "300px" }}>
            <h6 className="mb-3">
              {actionType === "remove" && "Are you sure you want to remove?"}
              {actionType === "match" && "Do you want to view matching property?"}
              {actionType === "pay" && "Proceed with payment?"}
              {actionType === "edit" && "Are you sure you want to edit?"}

            </h6>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={handleCancel}>
                No
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
       </div>
       </div>

    </div>
</div>
  );
}



