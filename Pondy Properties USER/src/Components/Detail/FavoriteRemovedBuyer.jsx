


import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MdCalendarMonth, MdOutlineBed, MdOutlineMapsHomeWork, MdOutlineTimer, MdFamilyRestroom, MdOutlineCall, MdCall } from 'react-icons/md';
import { GoHome } from 'react-icons/go';
import { LuIndianRupee, LuBriefcaseBusiness } from 'react-icons/lu';
import { RiStairsLine } from 'react-icons/ri';
import { IoFastFoodOutline } from 'react-icons/io5';
import { GiSittingDog } from 'react-icons/gi';
import { GrMapLocation } from 'react-icons/gr';
import profil from '../../Assets/xd_profile.png'
import { FaArrowLeft, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { TfiLocationPin } from "react-icons/tfi";
import pricemini from '../../Assets/Price Mini-01.png'
import pricemax from '../../Assets/Price maxi-01.png'
import NoData from "../../Assets/OOOPS-No-Data-Found.png";

const FavoriteRemovedBuyer = () => {
  const { phoneNumber } = useParams();
  const [removedFavorites, setRemovedFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [activeIndex, setActiveIndex] = useState(null);

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
    if (!phoneNumber) return;

    const fetchRemovedFavoritesBuyer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/remove-favorite-buyer`, {
          params: { postedPhoneNumber: phoneNumber },
        });

        if (response.status === 200) {
          setRemovedFavorites(response.data.favoriteRemovedData || []);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRemovedFavoritesBuyer();
  }, [phoneNumber]);

     useEffect(() => {
        const recordDashboardView = async () => {
          try {
            await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
              phoneNumber: phoneNumber,
              viewedFile: "Favorite Removed Buyer",
              viewTime: new Date().toISOString(),
            });
          } catch (err) {
          }
        };
      
        if (phoneNumber) {
          recordDashboardView();
        }
      }, [phoneNumber]);
  const handleDelete = async (ppcId, favoriteUserPhone) => {
  
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/favoriteRemoved/delete/${ppcId}/${favoriteUserPhone}`
      );
  
       setRemovedFavorites((prevFavorites) =>
        prevFavorites
          .map((property) =>
            property.ppcId === ppcId
              ? {
                  ...property,
                  removedFavoriteUserPhoneNumbers: property.removedFavoriteUserPhoneNumbers.filter(
                    (user) => user.phoneNumber !== favoriteUserPhone
                  ),
                }
              : property
          )
          .filter((property) => property.removedFavoriteUserPhoneNumbers.length > 0)
      );
  
      setMessage({ text: "Removed successfully.", type: "success" });
    } catch (error) {
      setMessage({ text: "Error removing favorite request.", type: "error" });
    }
  };
  
  const handleUndo = async (ppcId, favoriteUserPhone) => {
  
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/favoriteRemoved/undo/${ppcId}/${favoriteUserPhone}`);
  
       setRemovedFavorites((prevFavorites) =>
        prevFavorites
          .map((property) =>
            property.ppcId === ppcId
              ? {
                  ...property,
                  removedFavoriteUserPhoneNumbers: property.removedFavoriteUserPhoneNumbers.filter(
                    (user) => user.phoneNumber !== favoriteUserPhone
                  ),
                }
              : property
          )
          .filter((property) => property.removedFavoriteUserPhoneNumbers.length > 0)
      );
  
      setMessage({ text: "Restored successfully.", type: "success" });
    } catch (error) {
      setMessage({ text: "Error restoring favorite request.", type: "error" });
    }
  };

    const navigate = useNavigate();

    const handlePageNavigation = () => {
      navigate('/mobileviews');  
    };
  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
    <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%',  fontFamily: "Inter, sans-serif", }}>
      <div className="d-flex align-items-center justify-content-start w-100"     style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}>
              <button className="pe-5" onClick={handlePageNavigation}><FaArrowLeft color="#30747F"/> 
            </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>REMOVED FAVORITE BUYER</h3> </div>
      
    <div className="row g-2 w-100 mb-4">
    <div className="col-6 p-0">
          <button
            style={{ backgroundColor: "#4F4B7E", color: "white", width: "100%" }}
            onClick={() => setActiveTab("all")}
            className={activeTab === "all" ? "active" : ""}
          >
            ALL BUYER
          </button>
        </div>
        <div className="col-6 p-0">
          <button
            style={{ backgroundColor: "#FF0000", color: "white", width: "100%" }}
            onClick={() => setActiveTab("removed")}
            className={activeTab === "removed" ? "active" : ""}
          >
            REMOVED BUYER
          </button>
        </div>      
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      
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
      </div>      ) : removedFavorites.length > 0 ? (
        removedFavorites.map((property) => (
          <div key={property.ppcId} className="property-card">
            <div className="buyers-list">
              {property.removedFavoriteUserPhoneNumbers.length > 0 ? (
                property.removedFavoriteUserPhoneNumbers.map((user, index) => (
                 
                  <div
                  key={index}
              className="card w-100"
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
                 </div>
                <div className="p-0" style={{ background: "#707070", width: "2px", height: "80px" }}></div>
                <div className="col-md-7 col-6 p-0 ms-4">
                  <div className="text-center rounded-1 w-100 mb-1" style={{ border: "2px solid #30747F", color: "#30747F", fontSize: "14px" }}>
                    REMOVED FAVORITE BUYER
                  </div>
                  <div className="d-flex">
                    <p className="mb-1 ps-2 px-2 rounded-1" style={{ color: "#30747F", fontWeight: "500", fontSize: "12px" ,border:"1px solid #30747F" }}>
                      PP ID: {property.ppcId}
                    </p>
                  </div>
                  <h5 className="mb-1" style={{ color: "#5E5E5E", fontWeight: "500", fontSize: "16px" }}>
                    {property.propertyType || "N/A"} 
                  </h5>
                  <h5 className="mb-1" style={{ color: "#000000", fontWeight: "bold", fontSize: "16px" }}>
                    {property.propertyMode || "N/A"} 
                  </h5>
                </div>
              </div>
      
          
        <div className="d-flex align-items-center mb-2">
                            <div className="d-flex  flex-row align-items-start justify-content-between ps-3">
                    
                             
                              <div className="d-flex align-items-center ">
                                <MdCall color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                                <div>
                                  <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>
                                     Buyer Phone
                                  </h6>
                                  <span className="card-text" style={{  fontWeight:"500"}}>
                                  <a href={`tel:${user}`} style={{ textDecoration: "none", color: "#1D1D1D" }}>
                                  {activeIndex === index ? user.phoneNumber : user.phoneNumber.slice(0, -5) + "*****"}
                      </a>
                                  </span>
                                </div>
                              </div>
                              <div className="d-flex align-items-center ms-3">
                                <FaCalendarAlt color="#30747F" style={{ fontSize: "20px", marginRight: "8px" }} />
                                <div>
                                  <h6 className="m-0 text-muted" style={{ fontSize: "11px" }}>
                                  Favorite Requested Date                            </h6>
                                  <span className="card-text" style={{ color: "#1D1D1D", fontWeight:"500"}}>
                                  {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              </div>
                                        </div>
          <button className='w-100 m-0 p-1'
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
 
            style={{
              background: "#2F747F", 
              color: "white", 
              border: "none", 
             
              marginLeft: "10px", 
              cursor: "pointer",
              borderRadius: "5px"
            }}>
                    {activeIndex === index ? "HIDE BUYER NUMBER" : "VIEW BUYER NUMBER"}
                    </button>
        {activeIndex === index && (
      
        <div className="d-flex justify-content-between align-items-center ps-2 pe-2 mt-1">
         {activeTab === "all" ? (
                      <button
                      className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                      style={{ background: "#FF0000", color: "white", cursor: "pointer",  fontSize: "13px"}}
                      onClick={() => handleDelete(property.ppcId, user.phoneNumber)}
                      >
                        Delete
                      </button>
                     ) : ( 
                      <button
                      className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                      style={{ background: "green", color: "white", cursor: "pointer" ,  fontSize: "13px"}}
                      onClick={() => handleUndo(property.ppcId, user.phoneNumber)}
                      >
                        Undo 
                      </button>
                     )} 
                    <button
                    className="btn text-white px-3 py-1 flex-grow-1 mx-1"
                    style={{ background:  "#2F747F", width: "80px", fontSize: "13px" }}
                 >
                    Call
                  </button> 
                    </div>
                  )}
      
            </div>
                ))
              ) : (
                <p></p>
              )}
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
        <p>No removed favorite requests found.</p>
        </div> 
      )}
                </div>

          </div>

    </div>
  );
};

export default FavoriteRemovedBuyer;
