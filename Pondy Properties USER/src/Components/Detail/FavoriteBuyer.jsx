






import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MdCall } from 'react-icons/md';
import profil from '../../Assets/xd_profile.png';
import { FaCalendarAlt } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const FavoriteBuyer = () => {
  const { phoneNumber } = useParams();
  const [favorites, setFavorites] = useState([]);
  const [removedFavorites, setRemovedFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [showFullNumber, setShowFullNumber] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();
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
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Owner ShortList",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error recording view:", err);
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

  const confirmAction = (message, action) => {
    setPopupMessage(message);
    setPopupAction(() => action);
    setShowPopup(true);
  };

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favoriteProperties")) || [];
    const storedRemovedFavorites = JSON.parse(localStorage.getItem("removedFavoriteProperties")) || [];
    setFavorites(storedFavorites);
    setRemovedFavorites(storedRemovedFavorites);
  }, []);

  useEffect(() => {
    localStorage.setItem("favoriteProperties", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("removedFavoriteProperties", JSON.stringify(removedFavorites));
  }, [removedFavorites]);

  useEffect(() => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const favoriteRes = await axios.get(`${process.env.REACT_APP_API_URL}/get-favorite-buyer`, {
          params: { postedPhoneNumber: phoneNumber },
        });

        const statusRes = await axios.get(`${process.env.REACT_APP_API_URL}/payustatus-users`);

        if (favoriteRes.status === 200 && statusRes.status === 200) {
          const statusMap = {};
          statusRes.data.forEach(({ ppcId, status }) => {
            if (ppcId) statusMap[ppcId] = status;
          });

          const rawFavorites = favoriteRes.data.favoriteRequestsData || [];

          const finalFavorites = await Promise.all(
            rawFavorites.map(async (fav) => {
              let propertyMessage = null;
              try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/property-message/${fav.ppcId}`);
                propertyMessage = res.data?.data?.message || null;
              } catch (error) {
                propertyMessage = null;
              }

              return {
                ...fav,
                payuStatus: statusMap[fav.ppcId] || "unpaid",
                propertyMessage,
              };
            })
          );

          finalFavorites.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          );

          setFavorites(finalFavorites);
          localStorage.setItem("favoriteProperties", JSON.stringify(finalFavorites));
        }
      } catch (error) {
        console.error("Error fetching favorites or payment statuses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phoneNumber]);

  const handlePayNow = (ppcId, user) => {
    navigate("/pricing-plans", {
      state: {
        phoneNumber: user,
        ppcId,
      },
    });
  };

  const handleContact = async (ppcId, userPhone) => {
    confirmAction("Do you want to call this buyer?", async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact-send-property`, {
          ppcId,
          userPhone,   
          postedUserPhone: phoneNumber,   
        });

        if (response.data.success) {
          setMessage({ text: "Contact saved successfully", type: "success" });
          window.location.href = `tel:${userPhone}`;
        } else {
          setMessage({ text: response.data.message || "Contact failed", type: "error" });
        }
      } catch (error) {
        setMessage({ 
          text: error.response?.data?.message || "An error occurred", 
          type: "error" 
        });
      }
      setShowPopup(false);
    });
  };

  const handleRemoveFavorite = async (ppcId, favoriteUser) => {
    confirmAction("Are you sure you want to remove this favorite request?", async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/favorite/delete/${ppcId}/${favoriteUser}`);
        const updatedFavorites = favorites.map((property) =>
          property.ppcId === ppcId
            ? { ...property, favoritedUsersPhoneNumbers: property.favoritedUsersPhoneNumbers.filter((user) => user !== favoriteUser) }
            : property
        );
        setFavorites(updatedFavorites);
        setRemovedFavorites([...removedFavorites, { ppcId, favoriteUser }]);
        setMessage({ text: "Favorite removed successfully", type: "success" });
      } catch (error) {
        setMessage({ text: "Error removing favorite request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  const handleUndoRemove = async (ppcId, favoriteUser) => {
    confirmAction("Do you want to restore this favorite request?", async () => {
      try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/favorite/undo/${ppcId}/${favoriteUser}`);
        setRemovedFavorites(removedFavorites.filter((item) => item.favoriteUser !== favoriteUser));
        setFavorites((prev) =>
          prev.map((property) =>
            property.ppcId === ppcId
              ? { ...property, favoritedUsersPhoneNumbers: [...property.favoritedUsersPhoneNumbers, favoriteUser] }
              : property
          )
        );
        setMessage({ text: "Favorite request restored successfully!", type: "success" });
      } catch (error) {
        setMessage({ text: "Error restoring favorite request.", type: "error" });
      }
      setShowPopup(false);
    });
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validRemovedFavorites = removedFavorites.filter(property => property.favoriteUser);

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" 
           style={{ maxWidth: '500px', margin: 'auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
        
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
            <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' }} />
          </button>
          <h3 className="m-0 ms-3" style={{ fontSize: "15px" }}>SHORTLISTED BUYERS</h3>
        </div>

         <div className="row g-2 w-100">
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0"
              style={{ backgroundColor: activeTab === "all" ? '#30747F' : '#FFFFFF', color: activeTab === "all" ? 'white' : 'grey' }}
              onClick={() => setActiveTab("all")}
            >
              ALL BUYER
            </button>
          </div>
          <div className="col-6 p-0">
            <button className="w-100 p-1 border-0"
              style={{ backgroundColor: activeTab === "removed" ? '#30747F' : '#FFFFFF', color: activeTab === "removed" ? 'white' : 'grey' }}
              onClick={() => setActiveTab("removed")}
            >
              REMOVED BUYER
            </button>
          </div>
        </div>

         {message.text && <p style={{ color: message.type === "success" ? "green" : "red" }}>{message.text}</p>}

         <Modal show={showPopup} onHide={() => setShowPopup(false)}>
          <Modal.Body>
            <p>{popupMessage}</p>
            <Button style={{ background: "#2F747F", width: "80px", fontSize: "13px", border: "none" }} onClick={popupAction}>Yes</Button>
            <Button className="ms-3" style={{ background: "#FF0000", width: "80px", fontSize: "13px", border: "none" }} onClick={() => setShowPopup(false)}>No</Button>
          </Modal.Body>
        </Modal>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center my-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <span className="spinner-border text-primary" role="status" />
            <p className="mt-2">Loading properties...</p>
          </div>
        ) : activeTab === "all" ? (
          favorites.length > 0 ? (
            favorites.map((property, propertyIndex) => (
              property.favoritedUsersPhoneNumbers.map((user, userIndex) => (
                <div key={`${property.ppcId}-${user}`} className="card p-2 w-100 mt-1">
                  <div className="row d-flex align-items-center">
                    <div className="col-3 d-flex justify-content-center">
                      <img src={profil} alt="Profile" className="rounded-circle" style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                    </div>
                    <div className="p-0" style={{ background: "#707070", width: "2px", height: "80px" }}></div>
                    <div className="col-7 p-0 ms-4">
                      <div className="text-center rounded-1 w-100 mb-1" style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "13px" }}>FAVORITE BUYER</div>
                      <p className="mb-1" style={{ fontSize: "12px", fontWeight: "500" }}>PUC- {property.ppcId}</p>
                        
                      {property.propertyMessage && (
                        <span className="me-2" style={{ color: "#FF0000", fontWeight: "bold", fontSize: "12px" }}>
                          {property.propertyMessage}
                        </span>
                      )}
                      <h5 style={{ fontSize: "16px", fontWeight: "500" }}>{property.propertyType || "N/A"} | {property.state || "N/A"}</h5>
                    </div>
                  </div>

                  <div className="px-2 mt-2">
                    <div className="d-flex align-items-center mb-2">
                      <div className="d-flex flex-row align-items-start justify-content-between ps-3">
                        <div className="d-flex align-items-center mb-2">
                          <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Buyer Phone</h6>
                            {property.payuStatus === "paid" ? (
                              <span style={{ color: "#1D1D1D", cursor: "pointer" }}>
                                {showFullNumber[`${propertyIndex}-${userIndex}`]
                                  ? user
                                  : user?.slice(0, 5) + "*****"}
                              </span>
                            ) : (
                              <span style={{ color: "#999" }}>{user?.slice(0, 5) + "*****"}</span>
                            )}
                          </div>
                        </div>

                        <div className="d-flex align-items-center mb-2 ms-3">
                          <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                          <div>
                            <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Favorite Requested Date</h6>
                            <span className="card-text" style={{ color: "#1D1D1D", fontWeight: "500" }}>
                              {new Date(property.updatedAt || property.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                     {property.payuStatus === "paid" ? (
                      !showFullNumber[`${propertyIndex}-${userIndex}`] ? (
                        <button
                          className="w-100 m-0 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFullNumber((prev) => ({ ...prev, [`${propertyIndex}-${userIndex}`]: true }));
                          }}
                          style={{ background: "#2F747F", color: "white", border: "none", borderRadius: "5px" }}
                        >
                          View
                        </button>
                      ) : (
                        <div className="d-flex justify-content-around mt-2">
                          <button
                            className="btn text-white px-3 py-1 w-100"
                            style={{ background: "#2F747F", fontSize: "13px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContact(property.ppcId, user);
                            }}
                          >
                            Call
                          </button>
                          <button
                            className="btn text-white px-3 py-1 w-100"
                            style={{ background: "#FF0000", fontSize: "13px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFavorite(property.ppcId, user);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <button
                          className="btn text-white px-3 py-1 w-50 me-1"
                          style={{ background: "#FFB100", fontSize: "13px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePayNow(property.ppcId, user);
                          }}
                        >
                          Pay Now
                        </button>
                        <button
                          className="btn text-white px-3 py-1 50"
                          style={{ background: "#FF0000", fontSize: "13px", width: "50%" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(property.ppcId, user);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ))
          ) : (
            <div className="text-center my-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <img src={NoData} alt="" width={100} />
              <p>No properties found.</p>
            </div>
          )
        ) : (
          validRemovedFavorites.length > 0 ? (
            validRemovedFavorites.map((property, index) => (
              <div
                key={property.ppcId}
                className="card p-2 w-100 mt-1"
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
                  <div className='p-0' style={{background:"#707070", width:"2px", height:"80px"}}></div>
                  <div className="col-7 p-0 ms-4">
                    <div className='text-center rounded-1 w-100 mb-1' style={{border:"2px solid #30747F", color:"#30747F", fontSize:"14px"}}>FAVORITE BUYER</div>
                    <p className="mb-1" style={{ color: "#474747", fontWeight: "500",fontSize:"12px" }}>
                      PUC- {property.ppcId}
                    </p>
                    <h5 className="mb-1" style={{ color: "#474747", fontWeight: "500",fontSize:"16px" }}>
                      {property.propertyType || "N/A"} | {property.city || "N/A"}
                    </h5>
                  </div>
                </div>

                <div className="p-1">
                  <div className="d-flex align-items-center mb-2">
                    <div className="d-flex flex-column align-items-start justify-content-between ps-3">
                      <div className="d-flex align-items-center mb-4">
                        <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                        <div>
                          <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Favorite Requested Date</h6>
                          <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500"}}>
                            {property.updatedAt && property.updatedAt !== property.createdAt
                              ? new Date(property.updatedAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : new Date(property.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-1">
                        <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                        <div>
                          <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>Buyer Phone</h6>
                          <span className="card-text" style={{ fontWeight:"500"}}>
                            <a href={`tel:${property.favoriteUser}`} style={{ textDecoration: "none", color: "#1D1D1D" }}>
                              {showFullNumber
                                ? property.favoriteUser
                                : property.favoriteUser?.slice(0, 5) + "*****"}
                            </a>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    className='w-100 m-0 p-1'
                    style={{ background: "#2F747F", fontSize: "13px" }}
                    onClick={(e) => { 
                      e.stopPropagation();
                      handleUndoRemove(property.ppcId, property.favoriteUser);
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#32cd32";
                      e.target.style.fontWeight = 600;
                      e.target.style.transition = "background 0.3s ease";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#2F747F";
                      e.target.style.fontWeight = 400;
                    }}
                  >
                    UNDO
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center my-4" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <img src={NoData} alt="" width={100} />
              <p>No removed properties found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FavoriteBuyer;