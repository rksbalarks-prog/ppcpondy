




import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import myImage from '../../Assets/Rectangle 146.png'; 
import myImage1 from '../../Assets/Rectangle 145.png'; 
import pic from '../../Assets/Default image_PP-01.png'; 
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png'
import {  FaCalendarAlt } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";
import InsufficientPointsModal from "../InsufficientPointsModal";

const POINTS_PER_BUYER_CONTACT = 20;


const PropertyCard = ({
  property,
  onRemove,
  onUndo,
  isRemovedTab,
  ownerPhone,
  pointsBalance,
  pointsRequired = 20,
  onRequestReveal,
}) => {
  const [showFullNumber, setShowFullNumber] = useState(false);
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [revealing, setRevealing] = useState(false);

  // Per-(owner, property, buyer) reveal flag persisted in localStorage so that
  // a refresh doesn't re-charge the user. Reason key mirrors the deduct
  // transaction's `rentId` for traceability.
  const revealKey = `points-revealed-buyer-${ownerPhone || "_"}-${property.ppcId}-${property.viewerPhoneNumber}`;
  const [pointsRevealed, setPointsRevealed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(revealKey) === "1"
  );



  
 const handleContactLog = async () => {
  try {
     await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
      ppcId: property.ppcId,
      viewerPhoneNumber: property.viewerPhoneNumber,
      uniqueId: property.uniqueId,
    });
    setMessage({ text: "Contact logged successfully", type: "success" });

     window.location.href = `tel:${property.viewerPhoneNumber}`;
  } catch (error) {
    setMessage({ text: "Failed to log contact", type: "error" });
  }
};


const handlePayNow = (ppcId, user) => {
  navigate("/pricing-plans", {
    state: {
      phoneNumber: user.phoneNumber,
      ppcId,
    },
  });
};

 

return (
  <div
    className="card p-2 w-100 w-md-50 w-lg-33"
    onClick={() => !isRemovedTab && navigate(`/details/${property.ppcId}`)}
    style={{
      border: "1px solid #ddd",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "15px",
      fontFamily: "Inter, sans-serif",
    }}
  >
     <div className="row d-flex align-items-center">
      <div className="col-3 d-flex align-items-center justify-content-center mb-1">
        <img
          src={profil}
          alt="Placeholder"
          className="rounded-circle mt-2"
          style={{ width: "80px", height: "80px", objectFit: "cover" }}
        />
      </div>
      <div className="p-0" style={{ background: "#707070", width: "2px", height: "80px" }}></div>
      <div className="col-7 p-0 ms-4">
        <div className="text-center rounded-1 w-100 mb-1" style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "13px" }}>
          VIEWS RECEIVED BUYER
        </div>
        {message && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}
        <p className="mb-1 me-3" style={{ color: "#474747", fontWeight: "500", fontSize: "12px" }}>PUC- {property.ppcId}</p>

          {property.propertyMessage && (
    <span 
      className="me-2" 
      style={{
        color: "#FF0000",
        fontWeight: "bold",
        fontSize: "12px"
      }}
    >
      {property.propertyMessage}
    </span>
  )}
        <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500", fontSize: "16px" }}>
          {property.propertyType || "N/A"} | {property.city || "N/A"}
        </h5>
      </div>
    </div>

     <div className="p-1">
      <div className="d-flex align-items-center mb-2">
        <div className="d-flex flex-row align-items-start justify-content-between ps-3">
          <div className="d-flex align-items-center">
            <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
            <div>
              <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Buyer Phone</h6>
              <span className="card-text" style={{ fontWeight: "500" }}>
                {(property.payuStatus === "paid" && showFullNumber) || pointsRevealed ? (
                  <a
                    href={`tel:${property.viewerPhoneNumber}`}
                    onClick={handleContactLog}
                    style={{ textDecoration: "none", color: "#1D1D1D" }}
                  >
                    {property.viewerPhoneNumber}
                  </a>
                ) : (
                  <span style={{ color: "#888" }}>
                    {property.viewerPhoneNumber?.slice(0, 5) + "*****"}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center ms-3">
            <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
            <div>
              <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Views Received Date</h6>
              <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
                {(property.updatedAt || property.viewedAt)
                  ? new Date(property.updatedAt || property.viewedAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

       {isRemovedTab ? (
         <div className="d-flex justify-content-end align-items-center ps-2 pe-2 mt-1">
          {onUndo && (
            <button
              className="btn text-white px-3 py-1 flex-grow-1 mx-1"
              style={{ background: "green", fontSize: "13px" }}
              onClick={(e) => {
                e.stopPropagation();
                onUndo(property.ppcId, property.viewerPhoneNumber, property.uniqueId);
              }}
            >
              Undo
            </button>
          )}
        </div>
      ) : onUndo ? (
         <div className="d-flex justify-content-end align-items-center ps-2 pe-2 mt-1">
          <button
            className="btn text-white px-3 py-1 flex-grow-1 mx-1"
            style={{ background: "#39ff14", fontSize: "13px" }}
            onClick={(e) => {
              e.stopPropagation();
              onUndo(property.ppcId, property.viewerPhoneNumber, property.uniqueId);
            }}
          >
            Undo
          </button>
        </div>
      ) : property.payuStatus === "paid" ? (
        !showFullNumber ? (
           <button
            className="w-100 m-0 p-1"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullNumber(true);
            }}
            style={{
              background: "#2F747F",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            View
          </button>
        ) : (
           <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
            <button
              className="btn text-white px-3 py-1 flex-grow-1 mx-1"
              style={{ background: "#2F747F", fontSize: "13px" , border:"none", color:"#fff" , borderRadius: "5px"}}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
                    ppcId: property.ppcId,
                    phoneNumber: property.viewerPhoneNumber,
                  });
                  setMessage({ text: "Contact logged successfully", type: "success" });
                  window.location.href = `tel:${property.viewerPhoneNumber}`;
                } catch {
                  setMessage({ text: "Error logging contact", type: "error" });
                }
              }}
            >
              Call
            </button>
            {onRemove && (
              <button
                className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                style={{ background: "#FF4500", fontSize: "13px" , border:"none", color:"#fff" , borderRadius: "5px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(property.ppcId, property.viewerPhoneNumber, property.uniqueId);
                }}
              >
                Remove
              </button>
            )}
          </div>
        )
      ) : pointsRevealed ? (
        /* Owner already spent points to reveal this buyer's contact —
           same Call + Remove pair the PayU "view" branch uses. */
        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
          <button
            className="btn text-white px-3 py-1 flex-grow-1 mx-1"
            style={{ background: "#2F747F", fontSize: "13px", border: "none", color: "#fff", borderRadius: "5px" }}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
                  ppcId: property.ppcId,
                  phoneNumber: property.viewerPhoneNumber,
                });
                setMessage({ text: "Contact logged successfully", type: "success" });
                window.location.href = `tel:${property.viewerPhoneNumber}`;
              } catch {
                setMessage({ text: "Error logging contact", type: "error" });
              }
            }}
          >
            Call
          </button>
          {onRemove && (
            <button
              className="btn text-white px-3 py-1 flex-grow-1 mx-1"
              style={{ background: "#FF4500", fontSize: "13px", border: "none", color: "#fff", borderRadius: "5px" }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(property.ppcId, property.viewerPhoneNumber, property.uniqueId);
              }}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        /* Default branch — points-gated reveal. 20 pts unlocks the contact
           for this buyer; subsequent loads remember it via localStorage. */
        <div className="d-flex flex-row align-items-center mt-2">
          <button
            className="w-50 m-0 p-1 d-flex flex-column align-items-center justify-content-center"
            disabled={revealing}
            onClick={async (e) => {
              e.stopPropagation();
              if (revealing || !onRequestReveal) return;
              setRevealing(true);
              try {
                const ok = await onRequestReveal(property);
                if (ok) {
                  localStorage.setItem(revealKey, "1");
                  setPointsRevealed(true);
                }
              } finally {
                setRevealing(false);
              }
            }}
            style={{
              background: "linear-gradient(135deg, #2F747F, #226069)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              lineHeight: 1.15,
              padding: "6px 4px",
              opacity: revealing ? 0.7 : 1,
            }}
          >
            <span>{revealing ? "Unlocking…" : "👁 View Contact"}</span>
            <span style={{ fontSize: "10px", opacity: 0.9, marginTop: 1 }}>
              {pointsRequired} pts{typeof pointsBalance === "number" ? ` · You have ${pointsBalance}` : ""}
            </span>
          </button>

          {onRemove && (
            <button
              className="w-50 m-0 p-1 ms-1"
              style={{ background: "#FF4500", fontSize: "13px", border: "none", color: "#fff", borderRadius: "5px" }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(property.ppcId, property.viewerPhoneNumber, property.uniqueId);
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

  
 
};



 
const PropertyList = ({
  properties,
  onRemove,
  onUndo,
  isRemovedTab,
  ownerPhone,
  pointsBalance,
  pointsRequired,
  onRequestReveal,
}) => {
  return properties.length === 0 ? (
    <div className="text-center my-4"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
      <img src={NoData} alt="" width={100}/>      
      <p>No properties found.</p>
    </div>
  ) : (
    <div className="row mt-4 w-100">
      {properties.map((property) => (
        <PropertyCard
          key={property.uniqueId || property.ppcId}
          property={property}
          onRemove={onRemove}
          onUndo={onUndo}
          isRemovedTab={isRemovedTab}
          ownerPhone={ownerPhone}
          pointsBalance={pointsBalance}
          pointsRequired={pointsRequired}
          onRequestReveal={onRequestReveal}
        />
      ))}
    </div>
  );
};


const App = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const { phoneNumber } = useParams();
  const [activeKey, setActiveKey] = useState("All");

  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");

  const [isScrolling, setIsScrolling] = useState(false);

  // Points-gated contact reveal — costs POINTS_PER_BUYER_CONTACT (20 pts).
  const [pointsBalance, setPointsBalance] = useState(0);
  const [showInsufficient, setShowInsufficient] = useState(false);

  // Initial balance + refresh whenever any tab/component fires points:updated.
  useEffect(() => {
    if (!phoneNumber) return;
    const fetchBalance = async () => {
      try {
        const r = await axios.get(
          `${process.env.REACT_APP_API_URL}/points-balance/${phoneNumber}`
        );
        setPointsBalance(Number(r.data?.balance || 0));
      } catch (_) {
        /* non-blocking */
      }
    };
    fetchBalance();
    const onUpdated = () => fetchBalance();
    window.addEventListener("points:updated", onUpdated);
    return () => window.removeEventListener("points:updated", onUpdated);
  }, [phoneNumber]);

  // Called by PropertyCard when the owner clicks "View Contact (20 pts)".
  // Returns true iff the deduct succeeded so the card can flip to revealed.
  const handleRequestReveal = useCallback(
    async (property) => {
      if (!phoneNumber) return false;
      try {
        // Re-fetch balance to avoid acting on stale state.
        const balRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/points-balance/${phoneNumber}`
        );
        const bal = Number(balRes.data?.balance || 0);
        setPointsBalance(bal);
        if (bal < POINTS_PER_BUYER_CONTACT) {
          setShowInsufficient(true);
          return false;
        }
        const dRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/points-deduct`,
          {
            phoneNumber,
            points: POINTS_PER_BUYER_CONTACT,
            rentId: `${property.ppcId}-${property.viewerPhoneNumber}`,
            reason: "view-buyer-contact",
          }
        );
        if (!dRes.data?.success) {
          setPointsBalance(Number(dRes.data?.balance || 0));
          setShowInsufficient(true);
          return false;
        }
        setPointsBalance(Number(dRes.data.balance));
        window.dispatchEvent(new Event("points:updated"));
        return true;
      } catch (err) {
        setMessage({
          text: "Could not verify your points balance. Please try again.",
          type: "error",
        });
        return false;
      }
    },
    [phoneNumber]
  );

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
  const confirmAction = (message, action) => {
    setPopupMessage(message);
    setPopupAction(() => action);
    setShowPopup(true);
  };

   useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Viewed Buyer",
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
    const storedProperties = localStorage.getItem("viewedProperties");
    if (storedProperties) {
      setProperties(JSON.parse(storedProperties));
    }
  }, []);

   useEffect(() => {
    if (properties.length > 0) {
      localStorage.setItem("viewedProperties", JSON.stringify(properties));
    }
  }, [properties]);



 
useEffect(() => {
  if (!phoneNumber) return;

  const fetchViewedProperties = async () => {
    setLoading(true);
    try {
       const viewRes = await axios.get(`${process.env.REACT_APP_API_URL}/property-buyer-viewed`, {
        params: { phoneNumber },
      });

      const viewedUsers = viewRes.data.viewedUsers || [];

       const payuRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);
      const statusMap = {};
      if (Array.isArray(payuRes.data)) {
        payuRes.data.forEach(({ ppcId, status }) => {
          if (ppcId) statusMap[ppcId] = status;
        });
      }

       const allProperties = await Promise.all(
        viewedUsers.flatMap((user, index) =>
          user.viewedProperties.map(async (property, propIndex) => {
            const details = property.propertyDetails || {};
            let propertyMessage = null;

            try {
              const msgRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/user/property-message/${details.ppcId}`
              );
              propertyMessage = msgRes.data?.data?.message || null;
            } catch {
              propertyMessage = null;
            }

            return {
              ...details,
              viewerPhoneNumber: user.viewerPhoneNumber,
              uniqueId: `${index}-${propIndex}`,
              status: "active",
              viewedAt: property.viewedAt || new Date(),
              payuStatus: statusMap[details.ppcId] || "unpaid",
              propertyMessage,
            };
          })
        )
      );

       const sortedApiProperties = allProperties.sort(
        (a, b) =>
          new Date(b.updatedAt || b.viewedAt) - new Date(a.updatedAt || a.viewedAt)
      );

      // Dedupe by viewerPhoneNumber. The list is already sorted newest-first,
      // so the FIRST entry per phone wins — that's the most recent view.
      // Showing each buyer once prevents the owner from spending 20 pts more
      // than once on the same contact via duplicate cards.
      const seenPhones = new Set();
      const dedupedProperties = sortedApiProperties.filter((p) => {
        const key = String(p.viewerPhoneNumber || "");
        if (!key) return true;
        if (seenPhones.has(key)) return false;
        seenPhones.add(key);
        return true;
      });

       const storedProperties = JSON.parse(localStorage.getItem("viewedProperties")) || [];
      const mergedProperties = dedupedProperties.map((apiProp) => {
        const storedProp = storedProperties.find((sp) => sp.uniqueId === apiProp.uniqueId);
        return storedProp || apiProp;
      });

      setProperties(mergedProperties);
      localStorage.setItem("viewedProperties", JSON.stringify(mergedProperties));
    } catch (err) {
      console.error("Error fetching viewed properties or PayU status:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchViewedProperties();
}, [phoneNumber]);


const handleRemoveProperty = async (ppcId, phoneNumber, uniqueId) => {
  confirmAction("Are you sure you want to remove this viewd buyer ?", async () => {

  try {
    await axios.put(`${process.env.REACT_APP_API_URL}/delete-view-property`, { ppcId, phoneNumber });

     const updatedProperties = properties.map((property) =>
      property.uniqueId === uniqueId
        ? { ...property, status: "delete" }  
        : property
    );

    setProperties(updatedProperties);
    localStorage.setItem("viewedProperties", JSON.stringify(updatedProperties));

    setMessage({ text: "Interest removed successfully.", type: "success" });
  } catch (error) {
    setMessage({ text: "Error removing interest.", type: "error" });
  }
  setShowPopup(false);
});
};



const handleUndoRemove = async (ppcId, phoneNumber, uniqueId) => {
  confirmAction("Do you want to restore this viewed buyer?", async () => {

  try {
    await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-view`, { ppcId, phoneNumber });

     const updatedProperties = properties.map((property) =>
      property.uniqueId === uniqueId
        ? { ...property, status: "active" }  
        : property
    );

    setProperties(updatedProperties);
    localStorage.setItem("viewedProperties", JSON.stringify(updatedProperties));

    setMessage({ text: "Interest restored successfully!", type: "success" });
  } catch (error) {
    setMessage({ text: "Error restoring interest.", type: "error" });
  }
  setShowPopup(false);
});
};


   const updatePropertyStatus = (ppcId, status) => {
    const updatedProperties = properties.map((property) =>
      property.ppcId === ppcId ? { ...property, status } : property
    );
    setProperties(updatedProperties);
    localStorage.setItem("viewedProperties", JSON.stringify(updatedProperties));  
  };

   const activeProperties = properties.filter((property) => property.status !== "delete");
  const removedProperties = properties.filter((property) => property.status === "delete");
  

  const navigate = useNavigate();


  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" 
        style={{ maxWidth: '500px', margin: 'auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
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
    </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>VIEWED BUYERS </h3> </div>
         <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#30747F', color: 'white' }} 
              onClick={() => setActiveKey("All")}>
              ALL BUYER
            </button>
          </div>
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0" style={{ backgroundColor: '#FFFFFF', color: 'grey' }} 
              onClick={() => setActiveKey("Removed")}>
             REMOVED BUYER
            </button>
          </div>

           <div>
      {message && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}
      <Modal show={showPopup} onHide={() => setShowPopup(false)}>
        <Modal.Body>
          <p>{popupMessage}</p>
          <Button style={{ background:  "#2F747F", width: "80px", fontSize: "13px", border:"none" }} onClick={popupAction}
             onMouseOver={(e) => {
              e.target.style.background = "#FF6700"; 
              e.target.style.fontWeight = 600; 
              e.target.style.transition = "background 0.3s ease"; 
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#FF4500"; 
              e.target.style.fontWeight = 400; 
    
            }}>Yes</Button>
          <Button className="ms-3" style={{ background:  "#FF0000", width: "80px", fontSize: "13px" , border:"none"}} onClick={() => setShowPopup(false)}
              onMouseOver={(e) => {
                e.target.style.background = "#029bb3"; 
                e.target.style.fontWeight = 600; 
                e.target.style.transition = "background 0.3s ease"; 
      
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#2F747F"; 
                e.target.style.fontWeight = 400; 
      
              }}>No</Button>
        </Modal.Body>
      </Modal>
    </div>


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
      </div>    ) : activeKey === "All" ? (
      <PropertyList
        key="activeProperties"
        properties={activeProperties}
        onRemove={handleRemoveProperty}
        ownerPhone={phoneNumber}
        pointsBalance={pointsBalance}
        pointsRequired={POINTS_PER_BUYER_CONTACT}
        onRequestReveal={handleRequestReveal}
      />
    ) : (
      <PropertyList
        key="removedProperties"
        properties={removedProperties}
        onUndo={handleUndoRemove}
        ownerPhone={phoneNumber}
        pointsBalance={pointsBalance}
        pointsRequired={POINTS_PER_BUYER_CONTACT}
        onRequestReveal={handleRequestReveal}
        isRemovedTab
      />
    )}
  </div>

  <InsufficientPointsModal
    open={showInsufficient}
    onClose={() => setShowInsufficient(false)}
    balance={pointsBalance}
    required={POINTS_PER_BUYER_CONTACT}
    contactLabel="buyer"
  />
</div>


        </div>

      </div>
    </div>
  );
};

export default App;







