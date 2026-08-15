 
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
import imge from "./Assets/xd_profile1.png"
import axios from "axios";
import { CgProfile } from "react-icons/cg";
import PhoneCell from "./components/PhoneCell";

export default function ViewBuyerAssistance() {
    const location = useLocation();
    const ba_id = location.state?.ba_id;  const navigate = useNavigate();
  const [buyerAssistance, setBuyerAssistance] = useState(null);
  const [matchedProperties, setMatchedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem('phoneNumber') || '';
  const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
  const [requestData, setRequestData] = useState(null);
  const [buyerRequests, setBuyerRequests] = useState([]);

  const [planDetails, setPlanDetails] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
    const [actionType, setActionType] = useState(null); // "remove" | "match" | "pay"
    const [selectedData, setSelectedData] = useState(null);

    
 const [message, setMessage] = useState({ text: "", type: "" });

   // Auto-clear message after 3 seconds
   useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const openConfirm = (type, data) => {
    setActionType(type);
    setSelectedData(data);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (actionType === "interest" && selectedData) {
      handleSendInterest(selectedData);
    } else if (actionType === "match" && selectedData) {
      handleViewMore(selectedData.phoneNumber, selectedData.ppcId);
    } else if (actionType === "pay" && selectedData) {
      // handlePay(selectedData);
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
  
  

  // Fetch matched properties based on the phone number
  useEffect(() => {
    if (!phoneNumber) return;

    const fetchMatchedProperties = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-owner-matched-properties?phoneNumber=${phoneNumber}`);
        setMatchedProperties(response.data.properties);
      } catch (error) {
        setError('Failed to load matched properties.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedProperties();
  }, [phoneNumber]);

 
const handleSendInterest = async (id) => {   // ✅ receive id (not _id)
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/update-status-buyer-assistance/${id}`,  // ✅ use id
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ba_status: 'buyer-assistance-interest',
          userPhoneNumber: phoneNumber,  // ✅ phoneNumber you already have in state
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      setMessage('Interest Sent Successfully!');
    } else {
      setMessage(`Failed to send interest: ${data.message}`);
    }
  } catch (error) {
    setError('Failed to load matched properties.');

  }
};


  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!requestData) return <p>No data found.</p>;
  
    const handleViewMore = (phoneNumber, ppcId) => {
      // navigate("/detail", { state: { ppcId, phoneNumber } });
      navigate(`/detail/${ppcId}`, { state: {phoneNumber } });

    };


  return (
    <div className='d-flex justify-content-center algin-item-center w-100'>
    
    <div className='d-flex flex-column ' style={{maxWidth:"500px", width:"100%"}}>
    <div className="d-flex align-items-center justify-content-start w-100 pt-2 pb-2" style={{background:"#EFEFEF" }}>
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
        e.currentTarget.querySelector('svg').style.color = '#ffffff'; // Change icon color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f0f0';
        e.currentTarget.querySelector('svg').style.color = '#30747F';
      }}
    >
      <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
    </button> <h3 className="m-0 ms-3" style={{fontSize:"15px", fontWeight:"bold"}}>DETAILED BUYER ASSISTANT</h3> </div>

{message.text && (
  <div style={{ margin: "10px 0", color: message.type === "error" ? "red" : "green" }}>
    {message.text}
  </div>
)}



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
           {/* Lookin for */}
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

    {/* Buyer Phone Number */}
    <div className="d-flex align-items-center col-6 mt-2" >
      <FaPhoneAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
      <div>
        <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
          Buyer Phone Number
        </h6>
        <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
          <PhoneCell phone={requestData?.phoneNumber} display={requestData?.phoneNumber || "N/A"} type="tenant" ba_id={requestData?.ba_id} />
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
    {/* Plan Name */}
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

    {/* Expire Date */}
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
  className="btn text-white px-3 py-1 mx-1"
  style={{ background: "#3660FF", fontSize: "13px" }}
  onMouseOver={(e) => {
    e.target.style.background = "#017a6e"; // Brighter neon on hover
    e.target.style.fontWeight = 600; // Brighter neon on hover
    e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover

  }}
  onMouseOut={(e) => {
    e.target.style.background = "#3660FF"; // Original orange
    e.target.style.fontWeight = 400; // Brighter neon on hover

  }}  
   onClick={() => openConfirm("interest", requestData._id)}

>
  Send Interest
</button>



{matchedProperties.length > 0 ? (
    <button
   
      onClick={() =>
        openConfirm("match", {
          phoneNumber: matchedProperties[0].phoneNumber,
          ppcId: matchedProperties[0].ppcId,
        })
      }
      className="btn text-white px-3 py-1 mx-1"
      style={{ background: "#2F747F",  fontSize: "13px" }}
      
    >
      Match Prop
    </button>
  ) : null}
 
  <button className="btn text-white px-3 py-1 mx-1" style={{ background: "#0F9F2C", fontSize: "13px" }}
         onClick={() => openConfirm("pay", requestData)}

 onMouseOver={(e) => {
      e.target.style.background = "#32cd32"; // Neon green on hover
    }}
    onMouseOut={(e) => {
      e.target.style.background = "green"; // Original green
    }}>
    PAY
  </button>
</div>
{showConfirm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="bg-white p-4 rounded shadow" style={{ width: "300px" }}>
            <h6 className="mb-3">
              {actionType === "interest" && "Are you sure you want to Send Interest?"}
              {actionType === "match" && "Do you want to view matching property?"}
              {actionType === "pay" && "Proceed with payment?"}
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


