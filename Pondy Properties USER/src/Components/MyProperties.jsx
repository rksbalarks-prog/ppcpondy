

import React, { useState, useEffect } from "react";
import { FaRulerCombined, FaBed, FaCalendarAlt, FaUserAlt, FaRupeeSign, FaArrowLeft } from "react-icons/fa";
import { Button, Nav, Tab, Row, Col, Container } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import axios from "axios";
import './MyProperty.css';
import EditForm from "./EditForm"; 
import AddProps from "./AddProps"; 
import ConfirmationModal from "./ConfirmationModal";
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import indianprice from '../Assets/Indian Rupee-01.png'
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import ExpiredPlans from "./ExpiredPlans";
import pic from '../Assets/default.png'; // Correct path
import PremiumPropertyCard from "./PremiumPropertyCard";

const MyProperty = () => {
  const location = useLocation();
  const { phoneNumber: statePhoneNumber} = location.state || {};
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const [loading, setLoading] = useState(true);

  const phoneNumber = statePhoneNumber || storedPhoneNumber;

  const [activeKey, setActiveKey] = useState("property");
  const [propertyUsers, setPropertyUsers] = useState([]);
  const [removedUsers, setRemovedUsers] = useState([]);
  const [editData, setEditData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [ppcId, setPpcId] = useState(null);
  const [message, setMessage] = useState("");
  const [modalData, setModalData] = useState({ show: false, action: null, payload: null, message: "" });
  const [hover, setHover] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);
  const [hoverEdit, setHoverEdit] = useState(false);
  const [properties,setProperties]= useState('');

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
 

const fetchPropertyData = async (phone) => {
  setLoading(true);
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-status-with-payment`, {
      params: { phoneNumber: phone }
    });

    const apiData = response.data?.data;
    if (Array.isArray(apiData)) {
      const sorted = apiData.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      setPropertyUsers(sorted);
    } else {
      setPropertyUsers([]);
    }
  } catch (error) {
    console.error("Error fetching property data:", error);
    setPropertyUsers([]);
  } finally {
    setLoading(false);
  }
};


 

  useEffect(() => {
    if (phoneNumber) {
      fetchPropertyData(phoneNumber);
      fetchDeletedProperties(phoneNumber);
    }
  }, [activeKey, phoneNumber]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);
 

const fetchRemovedData = () => {
  if (phoneNumber) {
    fetchDeletedProperties(phoneNumber);
  }
};

useEffect(() => {
  if (activeKey === "removed") {
    fetchRemovedData(); // ✅ Now it will call the actual API
  }
}, [activeKey]);



  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000); // Auto-close after 3 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [message]);

  const handleModalConfirm = () => {
    const { action, payload } = modalData;
  
    if (action === "delete") handleDelete(payload);
    else if (action === "undo") handleUndo(payload);
    else if (action === "edit") handleEdit(payload);
  
    setModalData({ show: false, action: null, payload: null, message: "" });
  };
  
  const handleModalCancel = () => {
    setModalData({ show: false, action: null, payload: null, message: "" });
  };
  
  const confirmDelete = (ppcId) => {
    setModalData({
      show: true,
      action: "delete",
      payload: ppcId,
      message: "Are you sure you want to delete this property?"
    });
  };
  
  const confirmUndo = (ppcId) => {
    setModalData({
      show: true,
      action: "undo",
      payload: ppcId,
      message: "Are you sure you want to undo the deletion?"
    });
  };
  
  const confirmEdit = (user) => {
    setModalData({
      show: true,
      action: "edit",
      payload: user,
      message: "Do you want to edit this property?"
    });
  };
  

  useEffect(() => {
    if (activeKey === "property" && phoneNumber) {
      fetchPropertyData(phoneNumber);
      fetchDeletedProperties(phoneNumber);
    }
  }, [activeKey, phoneNumber]);

  const fetchDeletedProperties = async (phoneNumber) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-delete-status`, {
        params: { phoneNumber },
      });

      if (response.status === 200) {
        setRemovedUsers(response.data.users);
      }
    } catch (error) {
      // setMessage("Error fetching deleted properties.");
    } finally {
      setLoading(false);
    }
  };

 


  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "MyProperty",
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
  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-users`);
      const allProperties = response.data.users;

      // Sort by createdAt in descending order (newest first)
      // const sortedProperties = allProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          const sortedProperties =allProperties.sort(
  (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
);

      setProperties(sortedProperties);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  fetchProperties();
}, []);

  const handleDelete = async (ppcId) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/delete-property`, {
        ppcId,
        phoneNumber,
      });

      if (response.status === 200) {
        setMessage("Property deleted successfully!");
        setPropertyUsers((prev) => prev.filter((user) => user.ppcId !== ppcId));
        setRemovedUsers((prev) => [...prev, { ...response.data.user }]);
      }
    } catch (error) {
      setMessage("Error deleting property.");
    }
  };

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

  const handleEdit = (user) => {
    setEditData({ 
      ppcId: user.ppcId || "",  
      phoneNumber: user.phoneNumber || ""  
    }); 
  };

  const handleCloseEditForm = () => {
    setEditData(null); 
  };

 

  const handleAddProperty = async () => {
    if (!phoneNumber) {
      setMessage('Missing phone number or country code.');
      return;
    }
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/store-data`, {
        phoneNumber: `${phoneNumber}`,
      });
  
      if (response.status === 201) {
        setPpcId(response.data.ppcId);
        setMessage(`User added successfully! PPC-ID: ${response.data.ppcId}`);
      }
    } catch (error) {
      setMessage('Error adding user. Please try again.');
    }
  
    // Move this line outside the try-catch block to ensure the form opens
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };
  const navigate = useNavigate();
const handleCardClick = (ppcId) => {

  navigate(`/detail/${ppcId}`);
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
const itemStyle = {
  flex: 1,
  textAlign: 'center',
  // padding: '12px',
  fontWeight: '500',
  border: '1px solid #ddd',
  borderBottom: 'none',
  cursor: 'pointer',
};

const linkStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  textAlign: 'center',
  borderRadius:"0px",
  fontSize:"14px",
  padding:"8px"
};

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
          <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' ,fontFamily: 'Inter, sans-serif'}}>
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
              onClick={() => navigate('/mobileviews')}
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
            </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>MyProperty</h3> </div>
            <Helmet>
        <title>Pondy Property | Properties</title>
      </Helmet>

      {editData ? (
  <EditForm ppcId={editData.ppcId} phoneNumber={editData.phoneNumber} onClose={handleCloseEditForm} />
) : showAddForm ? (
  <AddProps phoneNumber={`${phoneNumber}`} onClose={handleCloseAddForm} />
) : (
  // Other content here

       <Tab.Container activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
         
          <Row className="g-3 w-100">
          
            <Col lg={12} className="p-1 d-flex flex-column align-items-center">
            
       
<Nav variant="tabs" className="mb-1 d-flex flex-row w-100 flex-nowrap">
  <Nav.Item style={itemStyle}>
    <Nav.Link style={linkStyle} eventKey="property">Property</Nav.Link>
  </Nav.Item>
  <Nav.Item style={itemStyle}>
    <Nav.Link style={linkStyle} eventKey="removed">Removed</Nav.Link>
  </Nav.Item>
  <Nav.Item style={itemStyle}>
    <Nav.Link style={linkStyle} eventKey="expired">Expired</Nav.Link>
  </Nav.Item>
  <Nav.Item style={itemStyle}>
    <Nav.Link style={linkStyle} eventKey="add-prop" onClick={() => setShowAddForm(true)}>
      Add Property
    </Nav.Link>
  </Nav.Item>
</Nav>




              <div>
      {message && <div className="alert text-success text-bold">{message}</div>}
      {/* Your existing component structure goes here */}
    </div>


    <ConfirmationModal
  show={modalData.show}
  message={modalData.message}
  onConfirm={handleModalConfirm}
  onCancel={handleModalCancel}
/>


 <Tab.Content className="pt-3 w-100">
            <Tab.Pane eventKey="property">
              {loading ? (
                <div className="text-center my-4">
                  <span className="spinner-border text-primary" />
                  <p>Loading properties...</p>
                </div>
              ) : propertyUsers.length > 0 ? (
                propertyUsers.map((user) => (
                  <PremiumPropertyCard
                    key={user.ppcId}
                    user={user}
                    onCardClick={() => handleCardClick(user.ppcId)}
                    onRemove={() => confirmDelete(user.ppcId)}
                    onEdit={() => confirmEdit(user)}
                    onPay={() => {
                      if (user.status === "incomplete") {
                        setEditData({
                          ppcId: user.ppcId,
                          phoneNumber: user.phoneNumber,
                        });
                      } else {
                        navigate("/pricing-plans", {
                          state: {
                            phoneNumber: user.phoneNumber,
                            ppcId: user.ppcId,
                          },
                        });
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-center my-4">
                  <img src={NoData} width={100} alt="No Data" />
                  <p>No properties found.</p>
                </div>
              )}
            </Tab.Pane>


<Tab.Pane eventKey="removed">
                {removedUsers.length > 0 ? (
                  removedUsers.map((user) => {
                    const isPaid = user.payustatususer === "paid";
                    return (
<div
className="row g-0 rounded-4 mb-2"
style={{
  border: isPaid ? "2px solid #16a34a" : "1px solid #ddd",
  overflow: "hidden",
  background: "#EFEFEF",
  boxShadow: isPaid
    ? "0 0 0 2px rgba(22,163,74,0.20), 0 0 16px rgba(22,163,74,0.55)"
    : "none",
  transition: "box-shadow 0.25s ease, border-color 0.25s ease",
}}
onClick={() => handleCardClick(user.ppcId)}

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
      src={user.photos?.length ? `https://ppcpondy.com/PPC/${user.photos[0]}` : pic}

               alt={
    `${user.ppcId || 'N/A'}-${user.propertyMode || 'N/A'}-${user.propertyType || 'N/A'}-rs-${user.price || '0'}
    -in-${user.city || ''}-${user.area || ''}-${user.state || ''}`
      .replace(/\s+/g, "-")
      .replace(/,+/g, "-")
      .toLowerCase()
  }
      className="img-fluid"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />

    {isPaid && (
      <div style={{
        position: "absolute",
        top: 0,
        width: "100%",
        background: "#16a34a",
        color: "#fff",
        textAlign: "center",
        fontWeight: 600,
      }}>
        Paid
      </div>
    )}

    <div>
    <div className="d-flex justify-content-between w-100 text-center" style={{ position: "absolute",
          bottom: "0px" , background: '#3F8D99', color: '#fff'}}>

            <span className="w-100 text-center"> {user.displayStatus}  </span>

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
                  <img src={totalarea} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>{user.totalArea || 'N/A'} {user.areaUnit
  ? user.areaUnit.charAt(0).toUpperCase() + user.areaUnit.slice(1)
  : 'N/A'}

                  
                 </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1">
                  <img src={bed} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>{user.bedrooms || 'N/A'} BHK </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                  <img src={postedby} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                 {user.ownership
  ? user.ownership.charAt(0).toUpperCase() + user.ownership.slice(1)
  : 'N/A'}
                 </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1">
                 <img src={calendar} alt="" width={12} className="me-2"/>
                  <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                     year: 'numeric',
                                                     month: 'short',
                                                     day: 'numeric'
                                                   }) : 'N/A'}
                  </span>
               </div>
               <div className="col-12 d-flex flex-col align-items-center mt-1 mb-1 ps-1">
                <h6 className="m-0">
                <span style={{ fontSize:'15px', color:'#2F747F', fontWeight:600, letterSpacing:"1px" }}> 
                  {/* <FaRupeeSign className="me-2" color="#2F747F"/> */}
                  <img src={
                    indianprice
                  } alt="" width={8}  className="me-2"/>
     {user.price
          ? formatPrice(user.price)
          : 'N/A'}                 </span> 
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
      onClick={(e) => {
        e.stopPropagation();
        confirmUndo(user.ppcId);
      }}
        // onClick={() => confirmUndo(user.ppcId)}
      >
        Undo
      </button>


                              </div>
              </div>
            </div>
</div>
</div>
                    );
                  })
                ) : (
                  <div className="text-center my-4 "
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                
                  }}>
                <img src={NoData} alt="" width={100}/>      
                <p>No Removed Property Data Found.</p>
                </div> 
               
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="expired">
                <ExpiredPlans />

              </Tab.Pane>

              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      )}
          </div>

    </div>
  );
};

export default MyProperty;























 