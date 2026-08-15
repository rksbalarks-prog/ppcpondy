




import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {FaCamera, FaEye , FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { MdCall } from "react-icons/md";
import myImage from '../../Assets/Rectangle 766.png'; 
import myImage1 from '../../Assets/Rectangle 145.png'; 
import pic from '../../Assets/Default image_PP-01.png'; 
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const App = () => {
  const [offers, setOffers] = useState([]);  
  const [removedOffers, setRemovedOffers] = useState([]);  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeKey, setActiveKey] = useState("All");
  const { phoneNumber } = useParams();
  const [localProperties, setLocalProperties] = useState([]);
  const [properties, setProperties] = useState([]);
  const [confirmation, setConfirmation] = useState({
    show: false,
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "Offer Owner",
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
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
  
      return () => clearTimeout(timer);  
    }
  }, [message]);
   useEffect(() => {
    const storedOffers = JSON.parse(localStorage.getItem("offers")) || [];
    const storedRemovedOffers = JSON.parse(localStorage.getItem("removedOffers")) || [];

    setOffers(storedOffers);
    setRemovedOffers(storedRemovedOffers);
  }, []);

   useEffect(() => {
    localStorage.setItem("offers", JSON.stringify(offers));
    localStorage.setItem("removedOffers", JSON.stringify(removedOffers));
  }, [offers, removedOffers]);

  

useEffect(() => {
  const fetchOffers = async () => {
    if (!phoneNumber) return;

    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/offers/owner/${phoneNumber}`);

      if (response.status === 200) {
        const fetchedOffers = response.data.offers || [];

         const enrichedOffers = await Promise.all(
          fetchedOffers.map(async (offer) => {
            let propertyMessage = null;
            try {
              const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/user/property-message/${offer.ppcId}`
              );
              propertyMessage = res.data?.data?.message || null;
            } catch {
              propertyMessage = null;
            }

            return {
              ...offer,
              propertyMessage,
            };
          })
        );

         const sortedOffers = enrichedOffers.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );

        setOffers(sortedOffers);  
      } else {
        setMessage({ text: "No owners found for this offer user.", type: "danger" });
      }
    } catch (error) {
      console.error("Offer fetch error:", error);
      setMessage({ text: "No Offer Properties Found", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  fetchOffers();
}, [phoneNumber]);




  const handleRemoveProperty = (ppcId, buyerPhoneNumber) => {
    showConfirmation("Are you sure you want to remove this offer?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/offers/delete/${ppcId}/${buyerPhoneNumber}`);

        const updatedOffers = offers.filter(
          (property) => property.ppcId !== ppcId || property.buyerPhoneNumber !== buyerPhoneNumber
        );

        const propertyToRemove = offers.find(
          (property) => property.ppcId === ppcId && property.buyerPhoneNumber === buyerPhoneNumber
        );

        if (propertyToRemove) {
          const updatedRemovedOffers = [...removedOffers, propertyToRemove];
          setRemovedOffers(updatedRemovedOffers);
          localStorage.setItem("removedOffers", JSON.stringify(updatedRemovedOffers));
        }

        setOffers(updatedOffers);
        localStorage.setItem("offers", JSON.stringify(updatedOffers));

        setMessage({ text: "Property removed successfully", type: "success" });
      } catch (error) {
        setMessage({ text: "Error removing property", type: "danger" });
      }
    });
  };

  const handleUndoRemove = (ppcId, buyerPhoneNumber) => {
    showConfirmation("Do you want to restore this offer?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/offers/undo/${ppcId}/${buyerPhoneNumber}`);

        const propertyToUndo = removedOffers.find(
          (property) => property.ppcId === ppcId && property.buyerPhoneNumber === buyerPhoneNumber
        );

        if (propertyToUndo) {
          const updatedProperty = { ...propertyToUndo };

          setOffers((prev) => {
            const updated = [...prev, updatedProperty];
            localStorage.setItem("offers", JSON.stringify(updated));
            return updated;
          });

          setRemovedOffers((prev) => {
            const updatedRemoved = prev.filter(
              (property) => property.ppcId !== ppcId || property.buyerPhoneNumber !== buyerPhoneNumber
            );
            localStorage.setItem("removedOffers", JSON.stringify(updatedRemoved));
            return updatedRemoved;
          });

          setMessage({ text: "Property restored successfully", type: "success" });
        }
      } catch (error) {
        setMessage({ text: "Error restoring property", type: "danger" });
      }
    });
  };

  
 
  useEffect(() => {
    setProperties((prev) => [...prev]);  
  }, [localProperties]);
  
  
  const showConfirmation = (message, onConfirm) => {
    setConfirmation({
      show: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmation({ ...confirmation, show: false });  
      },
    });
  };
      
   const activeProperties = offers.filter((property) => property.status !== "delete");
  const removedProperties = removedOffers;
  const navigate = useNavigate();

  
  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>
         <div className="d-flex align-items-center justify-content-start w-100" style={{background:"#EFEFEF" }}>
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
</button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>  MY OFFERS</h3> </div>
        <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#30747F', color: 'white' }} onClick={() => setActiveKey("All")}>
              All Properties
            </button>
          </div>
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#FFFFFF', color: 'grey' }} onClick={() => setActiveKey("Removed")}>
              Removed Properties
            </button>
          </div>

           {message.text && (
            <div className="col-12">
              <div className={`alert alert-${message.type} w-100`}>{message.text}</div>
            </div>
          )}

           <div className="col-12">
            <div className="w-100 d-flex align-items-center justify-content-center" style={{ maxWidth: '500px' }}>
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
      </div>              ) : activeKey === "All" ? (
                <PropertyList properties={activeProperties} onRemove={handleRemoveProperty} 
                    />
              ) : (
                <PropertyList properties={removedProperties} onUndo={handleUndoRemove} />
              )}
            </div>
          </div>
        </div>
        <ConfirmationModal
        show={confirmation.show}
        message={confirmation.message}
        onClose={() => setConfirmation({ ...confirmation, show: false })}
        onConfirm={confirmation.onConfirm}
      />
      </div>
    </div>
  );
};
const ConfirmationModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    },
    modal: {
      background: '#fff',
      padding: '20px 30px',
      borderRadius: '10px',
      textAlign: 'center',
      minWidth: '300px'
    },
    buttons: {
      display: 'flex',
      marginTop: '20px'
    },
    yes: {
      background: '#2F747F',
      color: '#fff',
      padding: '8px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    },
    no: {
      background: '#FF4500',
      color: '#fff',
      padding: '8px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginLeft: '10px'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h5>Confirmation</h5>
        <p>{message}</p>
        <div style={styles.buttons}>
          <button
            style={styles.yes}
            onClick={onConfirm}
            onMouseOver={(e) => {
              e.target.style.background = "#029bb3";
              e.target.style.fontWeight = 600;
              e.target.style.transition = "background 0.3s ease";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#2F747F";
              e.target.style.fontWeight = 400;
            }}
          >
            Yes
          </button>
          <button
            style={styles.no}
            onClick={onClose}
            onMouseOver={(e) => {
              e.target.style.background = "#FF6700";
              e.target.style.fontWeight = 600;
              e.target.style.transition = "background 0.3s ease";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#FF4500";
              e.target.style.fontWeight = 400;
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};
const PropertyList = ({ properties, onRemove, onUndo, onAccept, onReject }) => {
  return properties.length === 0 ? (
<div className="text-center my-4 "
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',

    }}>
<img src={NoData} alt="" width={100}/>      
<p>No properties found.</p>
</div>  ) : (
    <div className="row mt-4 w-100">
      {properties.map((property) => (
        <div className="col-12 mb-1 p-0" key={property.ppcId}>
          <PropertyCard
            property={property}
            onRemove={onRemove}
            onUndo={onUndo}
            onAccept={onAccept}
            onReject={onReject}
          />
        </div>
      ))}
    </div>
  );
};


const PropertyCard = ({ property, onRemove, onUndo, onAccept, onReject }) => {
  const [activeButton, setActiveButton] = useState(property.status || null);
 const navigate = useNavigate();
  const [modal, setModal] = useState({ show: false, type: "", property: null }); 

   const [message, setMessage] = useState({ text: "", type: "" });
  
  
    const { phoneNumber } = useParams();  
  
        const handleRevealClick = () => {
      setFinalContactNumber(property?.postedUserPhoneNumber);  
    };
    
      const handleContactClick = async (e) => {
        e.stopPropagation();
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/contact-send-property`,
            {
              ppcId: property.ppcId,
              postedUserPhone: property.postedUserPhoneNumber,
              userPhone: phoneNumber,
            }
          );
    
          const {
            success,
            setPpcId,
            assignedPhoneNumber,
            postedUserPhoneNumber,
          } = response.data;
    
          if (success) {
            const finalContact = setPpcId ? assignedPhoneNumber : postedUserPhoneNumber;
            setFinalContactNumber(finalContact);
            setMessage({ text: "Contact saved successfully", type: "success" });
          } else {
            setMessage({ text: "Contact failed", type: "error" });
          }
        } catch (error) {
          setMessage({ text: "An error occurred", type: "error" });
        }
      };
    
  
     useEffect(() => {
     if (message.text) {
       const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
       return () => clearTimeout(timer);
     }
   }, [message]);
      
  
  const handleCardClick = () => {

    if (property?.ppcId) {
      navigate(`/detail/${property.ppcId}`);
    }
  };
  
  const [finalContactNumber, setFinalContactNumber] = useState(null);
 
  
  const [imageCounts, setImageCounts] = useState({});  

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
    const fetchImageCountForProperty = async () => {
      if (property?.ppcId) {
        const count = await fetchImageCount(property.ppcId);
        setImageCounts((prev) => ({
          ...prev,
          [property.ppcId]: count,
        }));
      }
    };
  
    fetchImageCountForProperty();
  }, [property]);
  


  
  return (
    <div>
    {message && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}

    <div className="row g-0 rounded-4 mb-2" style={{ border: '1px solid #ddd', overflow: "hidden", background: "#EFEFEF" }}
      onClick={handleCardClick}
    >       
      <div className="col-md-4 col-4 d-flex flex-column align-items-center">
        <div className="text-white py-1 px-2 text-center" style={{ width: "100%", background: "#2F747F" }}>
          PUC- {property.ppcId || "N/A"}
        </div>

      
 <div style={{ position: "relative", width: "100%", height:'190px'}}>
          

                                      <img
  src={
    property.photos?.length
      ? `https://ppcpondy.com/PPC/${property.photos[0]
          .replace(/\\/g, "/")  
          .replace(/^\/+/, "") 
          .trim()}`
      : pic
  }
  alt={(
    `${property.ppcId || 'N/A'}-${property.propertyMode || 'N/A'}-${property.propertyType || 'N/A'}-rs-${property.price || '0'}
    -in-${property.city || ''}-${property.area || ''}-${property.state || ''}`
  )
    .replace(/\s+/g, "-")
    .replace(/,+/g, "-")
    .toLowerCase()}
  className="img-fluid"
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>

          
          <div >
          <div className="d-flex justify-content-between w-100" style={{ position: "absolute",
          bottom: "0px"}}>
                         
<span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaCamera className="me-1"/> {imageCounts[property.ppcId] || 0}
          </span>
          <span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage1}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaEye className="me-1" />{property.views}
          </span>
          </div>
          </div>
          </div>
      </div>

       <div className="col-md-8 col-8" style={{paddingLeft:"10px", background:"#F5F5F5"}}>
      <div className="d-flex justify-content-between">
          <p className="m-0" style={{ color: "#5E5E5E" , fontSize:"13px"}}>{property.propertyMode || "N/A"}</p>

             {property.propertyMessage && (
    <span 
      className=" mt-2" 
      style={{
        color: "#FF0000",
        fontWeight: "bold",
        fontSize: "12px"
      }}
    >
      {property.propertyMessage}
    </span>
  )}

          {onRemove && (
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
            onClick={(e) => {
              e.stopPropagation();  
              onRemove(property.ppcId, property.buyerPhoneNumber);
            }}               >Remove</p>
          )}
          {onUndo && (
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
            onClick={(e) => {
              e.stopPropagation(); 
              onUndo(property.ppcId, property.buyerPhoneNumber);
            }}            >Undo</p>
          )}
        </div>

        <p className="fw-bold m-0" style={{ color: "#000000" , fontSize:"15px"}}>{property.propertyType || "N/A"}</p>
<p
  className="m-0"
  style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}
>
  {(() => {
    const locs = [ property.nagar, property.area, property.city, property.district, property.state ]
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (locs.length === 0) {
       return <>N/A, N/A</>;
    }

     return locs.slice(0, 3).map((val, idx, arr) => (
      <span key={idx}>
                 {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}

        {idx < arr.length - 1 ? ", " : ""}
      </span>
    ));
  })()}
</p>
         <div className="card-body ps-2 m-0 pt-0 pe-2 d-flex flex-column justify-content-center">
          <div className="row">
        <div className="col-6 d-flex align-items-center  p-1">
              <FaRulerCombined className="me-2" color="#2F747F" /> <span style={{ fontSize: "13px", color: "#5E5E5E" }}>{property.totalArea || "N/A"} {property.areaUnit || "N/A"}</span>
            </div>
        <div className="col-6 d-flex align-items-center  p-1">
              <FaBed className="me-2" color="#2F747F" /> <span style={{ fontSize: "13px", color: "#5E5E5E" }}>{property.bedrooms || "N/A"} BHK</span>
            </div>
        <div className="col-6 d-flex align-items-center  p-1">
              <FaUserAlt className="me-2" color="#2F747F" /> <span style={{ fontSize: "13px", color: "#5E5E5E" }}>{property.ownership || "N/A"}</span>
            </div>
 

            <div className="col-6 d-flex align-items-center p-1">
  <FaCalendarAlt className="me-2" color="#2F747F" />
  <span style={{ fontSize: '13px', color: '#5E5E5E', fontWeight: 500 }}>
    {
      property.updatedAt && property.updatedAt !== property.offerDate
        ? new Date(property.updatedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : new Date(property.offerDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
    }
  </span>
</div>


             <div className="col-12 d-flex flex-col align-items-center p-1">
            <h6 className="m-0">
                 <span style={{ fontSize: "17px", color: "#2F747F", fontWeight: "bold", letterSpacing: "1px" }}>
                                  <FaRupeeSign className="me-2" color="#2F747F" />
                                  {property.originalPrice ? property.originalPrice : "N/A"}
                                </span>
                <span style={{ color: "#2F747F", fontSize: "11px", marginLeft: "5px" }}>Negotiable</span>
              </h6>
            </div>
          

            

           {finalContactNumber ? (
             <div className="p-1 mt-2 d-flex align-items-center">
               <MdCall className="me-2" color="#2F747F" />
               <a
                 href={`tel:${finalContactNumber}`}
                 style={{ color: "#2F747F", textDecoration: "none", fontSize: "14px" }}
                 onClick={(e) => {
                   e.stopPropagation();  
                   handleContactClick(e);  
                 }}
               >
                 {finalContactNumber}
               </a>
             </div>
           ) : (
             <p
               className="p-1 mt-2 d-flex align-items-center"
               onClick={(e) => {
                 e.stopPropagation();  
                 handleRevealClick();  
               }}
               style={{ color: "#2E7480", margin: "0px", cursor: "pointer" }}
             >
               <MdCall className="me-2" color="#2F747F" />
               <span style={{ fontSize: "12px" }}>Click to show number</span>
             </p>
           )}
         
          </div>

       

 
 <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
          <span style={{ color: property.status === "accept" ? "green" : "blue" }}>{property.status}</span>
       </div>
        </div>
      </div>
      <div className="col-12 " style={{ border:"2px solid #2F747F", borderRadius:"0px 0px 50px 50px", overflow:'hidden'}}>   {property.offeredPrice ? (
  <div className="w-100 d-flex flex-col align-items-center justify-content-center">
    <h6 className="m-0">
      <span
        style={{
          fontSize: "17px",
          color: "#2F747F",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        <FaRupeeSign className="me-2" color="#2F747F" />
        {property.offeredPrice.toLocaleString("en-IN")}
      </span>
      <span style={{ color: "#2F747F", fontSize: "11px", marginLeft: "5px" }}>
        Offered Price
      </span>
    </h6>
  </div>
) : (
  <div className="w-100 d-flex flex-col align-items-center justify-content-center">
    <h6 className="m-0" style={{ color: "#FF0000" }}>
      Offered Price Not Available
    </h6>
  </div>
)}
</div>

    
    </div>
    </div>
  );
};

export default App;










