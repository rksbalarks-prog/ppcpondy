




import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import moment from 'moment';
import {
  FaPhone, FaBuilding, FaHome, FaBed, FaCompass,
  FaCheckCircle, FaUniversity, FaClock, FaCity,
  FaMapMarkerAlt, FaLandmark, FaRuler, FaCreditCard,
  FaChevronDown, FaTimes,
  FaArrowLeft
} from 'react-icons/fa';
import imge from "../Assets/ppbuyer.png";
import minprice from "../Assets/Price Mini-01.png";
import maxprice from "../Assets/Price maxi-01.png";


const EditBuyerAssistance = () => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    altPhoneNumber: "",
    city: "",
    area: "",
    loanInput: "",
    minPrice: "",
    maxPrice: "",
    areaUnit: "",
    noOfBHK: "",
    propertyMode: "",
    propertyType: "",
    propertyAge: "",
    bankLoan: "",
    propertyApproved: "",
    facing: "",
    state: "",
    paymentType: "",
    description: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
 const ba_id = Number(location.state?.ba_id); // 🔁 Convert to Number

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [dropdownState, setDropdownState] = useState({ activeDropdown: null, filterText: "" });
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [dataList, setDataList] = useState({});
  const [loading, setLoading] = useState(true);
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Define field order for auto-navigation
  const fieldOrder = [
    "minPrice", "maxPrice", "propertyMode", "propertyType", 
    "noOfBHK", "facing", "propertyApproved", "bankLoan", 
    "propertyAge", "state", "areaUnit", "paymentType"
  ];

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
  // Fetch initial data
  useEffect(() => {
    fetchPaymentTypes();
    fetchDropdownData();
    if (ba_id) {
      fetchBuyerAssistanceData(ba_id);
    }
  }, [ba_id]);

  // Fetch payment types
  const fetchPaymentTypes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment-all`);
      setPaymentTypes(res.data);
    } catch (error) {
    }
  };

  // Fetch dropdown options
  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch`);
      const groupedData = response.data.data.reduce((acc, item) => {
        if (!acc[item.field]) acc[item.field] = [];
        acc[item.field].push(item.value);
        return acc;
      }, {});
      setDataList(groupedData);
    } catch (error) {
    }
  };

  // Fetch buyer assistance data for editing
  const fetchBuyerAssistanceData = async (ba_id) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance/${ba_id}`);
      if (res.data && res.data.data) {
        setFormData(prev => ({ ...prev, ...res.data.data }));
      } else {
      }
    } catch (error) {
    }
  };

  // Handle dropdown toggle
  const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({
      activeDropdown: prevState.activeDropdown === field ? null : field,
      filterText: ""
    }));
  };

  // Handle dropdown selection
  const handleDropdownSelect = (field, value) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
    
    // Find current field index and move to next dropdown field
    const currentIndex = fieldOrder.indexOf(field);
    if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1];
      setDropdownState({ activeDropdown: nextField, filterText: "" });
    } else {
      // If at end of fields, close the dropdown
      setDropdownState({ activeDropdown: null, filterText: "" });
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (ba_id) {
        // ✅ Update existing request
        await axios.put(`${process.env.REACT_APP_API_URL}/update-buyer-Assistance/${ba_id}`, formData);
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate(`/detail-buyer-assis/${ba_id}`);
        }, 1000);
      } else {
        // ✅ Create new request
        await axios.post(`${process.env.REACT_APP_API_URL}/add-buyerAssistance`, formData);
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          setFormData({
            phoneNumber: "",
            altPhoneNumber: "",
            city: "",
            area: "",
            loanInput: "",
            minPrice: "",
            maxPrice: "",
            areaUnit: "",
            noOfBHK: "",
            propertyMode: "",
            propertyType: "",
            propertyAge: "",
            bankLoan: "",
            propertyApproved: "",
            facing: "",
            state: "",
            paymentType: "",
            description: "",
          });
        }, 3000);
      }

     } catch (error) {
      alert("Failed to process the request.");
    }
  };


 


  return (
  <div className="d-flex flex-column mx-auto custom-scrollbar"
    style={{
      maxWidth: '450px',
      height: '100vh',
      overflow: 'auto',
      scrollbarWidth: 'none', 
      msOverflowStyle: 'none', 
      fontFamily: 'Inter, sans-serif'
    }}>

      <div className="d-flex align-items-center justify-content-start w-100"  style={{
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
    </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>Edit Buyer Assistance</h3> </div>      {/* Property Assistance Form */}
      <div className="p-0" style={{ fontFamily: "Inter, sans-serif" }}>
        <img src={imge} alt="" className="header-image" style={{ width: '100%' }} />

        <h4 className="mt-3" style={{ color: "#2F747F" , fontSize:"15px", fontWeight:"bold" }}>
          {ba_id ? "Edit Property Assistance" : "Add Property Assistance"}
        </h4>

        <form onSubmit={handleSubmit} className="m-0 p-3">
          {/* Price Range */}
          <div className="row mb-3 justify-content-between">
            <div className="col-6 pe-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("minPrice")}
                >
                  <img src={minprice} alt="" /> {formData.minPrice || "Select minPrice"}
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>

              {dropdownState.activeDropdown === "minPrice" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Minimum Price</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>

                  <ul className="list-group mt-2 w-100">
                    {(dataList.minPrice || [])
                      .filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase()))
                      .map((option, index) => (
                        <li
                          key={index}
                          className="list-group-item list-group-item-action d-flex align-items-center"
                          onClick={() => handleDropdownSelect("minPrice", option)}
                          style={{
                            padding: '5px',
                            cursor: 'pointer',
                            color: "#26794A",
                            marginBottom: '5px',
                          }}
                        >
                          {option}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="col-6 pe-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("maxPrice")}
                >
                  <img src={maxprice} alt="" /> {formData.maxPrice || "Select maxPrice"}
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "maxPrice" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Maximum Price</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                      className="form-control mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.maxPrice || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("maxPrice", option)}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="col-12 mb-3">
            <div
              className="input-card p-0 rounded-1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                border: '1px solid #2F747F',
                background: "#fff"
              }}
            >
              <FaPhone className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="form-input m-0"
                placeholder="Enter PhoneNumber"
                style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          {/* Property Mode */}
          <div className="row justify-content-center">
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("propertyMode")}
                >
                  <span><FaBuilding className="me-2" color="#2F747F" /> {formData.propertyMode || "Select Property Mode"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>

              {dropdownState.activeDropdown === "propertyMode" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Property Mode</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.propertyMode || [])
                      .filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase()))
                      .map((option, index) => (
                        <li
                          key={index}
                          className="list-group-item list-group-item-action d-flex align-items-center"
                          onClick={() => handleDropdownSelect("propertyMode", option)}
                          style={{
                            padding: '5px',
                            cursor: 'pointer',
                            color: "#26794A",
                            marginBottom: '5px',
                          }}
                        >
                          {option}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Property Type */}
          <div className="row">
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("propertyType")}
                >
                  <span><FaHome className="me-2" color="#2F747F" /> {formData.propertyType || "Select Property Type"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "propertyType" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Property Type</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.propertyType || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("propertyType", option)}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bedrooms */}
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("noOfBHK")}
                >
                  <span><FaBed className="me-2" color="#2F747F" /> {formData.noOfBHK || "Select NoBHK"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "noOfBHK" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Number of Bedrooms</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {[
                      "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK",
                      "6 BHK", "7 BHK", "8 BHK", "9 BHK", "10 BHK"
                    ].filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("noOfBHK", option)}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Facing */}
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("facing")}
                >
                  <span><FaCompass className="me-2" color="#2F747F" /> {formData.facing || "Select Facing"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "facing" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Facing</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.facing || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("facing", option)}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Property Approved */}
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("propertyApproved")}
                >
                  <span><FaCheckCircle className="me-2" color="#2F747F" /> {formData.propertyApproved || "Select Property Approved"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "propertyApproved" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Property Approved</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.propertyApproved || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("propertyApproved", option)}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bank Loan */}
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("bankLoan")}
                >
                  <span><FaUniversity className="me-2" color="#2F747F" /> {formData.bankLoan || "Select Bank Loan"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "bankLoan" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Bank Loan</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.bankLoan || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("bankLoan", option)}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Property Age */}
            <div className="col-12 mb-3">
              <div className="input-group">
                <button
                  type="button"
                  style={{ border: "1px solid #2F747F" }}
                  className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                  onClick={() => toggleDropdown("propertyAge")}
                >
                  <span><FaClock className="me-2" color="#2F747F" /> {formData.propertyAge || "Select Property Age"}</span>
                  <FaChevronDown color="#2F747F" />
                </button>
              </div>
              {dropdownState.activeDropdown === "propertyAge" && (
                <div
                  className="dropdown-popup"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Property Age</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control m-0 mt-2"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                      style={{
                        width: '80%',
                        padding: '5px',
                        background: "#C0DFDA",
                        border: "none",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown()}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2 w-100">
                    {(dataList.propertyAge || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                      <li
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        onClick={() => handleDropdownSelect("propertyAge", option)}
                        style={{
                          padding: '5px',
                          cursor: 'pointer',
                          color: "#26794A",
                          marginBottom: '5px',
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* City */}
          <div className="col-12 mb-3">
            <div
              className="input-card p-0 rounded-1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                border: '1px solid #2F747F',
                background: "#fff"
              }}
            >
              <FaCity className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="form-input m-0"
                placeholder="Enter City"
                style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          {/* State */}
           <div className="col-12 mb-3">
            <div className="input-group">
              <button
                type="button"
                style={{ border: "1px solid #2F747F" }}
                className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                onClick={() => toggleDropdown("state")}
              >
                <span><FaCity className="me-2" color="#2F747F" /> {formData.state || "Select state"}</span>
                <FaChevronDown color="#2F747F" />
              </button>
            </div>
            {dropdownState.activeDropdown === "state" && (
              <div
                className="dropdown-popup"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#E9F7F2',
                  width: '100%',
                  maxWidth: '350px',
                  padding: '10px',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  overflowY: 'auto',
                  maxHeight: '50vh',
                  animation: 'popupOpen 0.3s ease-in-out',
                }}
              >
                <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select State</h6>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control m-0 mt-2"
                    placeholder="Filter options..."
                    value={dropdownState.filterText}
                    onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                    style={{
                      width: '80%',
                      padding: '5px',
                      background: "#C0DFDA",
                      border: "none",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDropdown()}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                    }}
                  >
                    <FaTimes size={18} color="red" />
                  </button>
                </div>
                <ul className="list-group mt-2 w-100">
                  {(dataList.state || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      onClick={() => handleDropdownSelect("state", option)}
                      style={{
                        padding: '5px',
                        cursor: 'pointer',
                        color: "#26794A",
                        marginBottom: '5px',
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Area */}
          <div className="col-12 mb-3">
            <div
              className="input-card p-0 rounded-1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                border: '1px solid #2F747F',
                background: "#fff"
              }}
            >
              <FaLandmark className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="form-input m-0"
                placeholder="Enter Area"
                style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          {/* Area Unit */}
          <div className="col-12 mb-3">
            <div className="input-group">
              <button
                type="button"
                style={{ border: "1px solid #2F747F" }}
                className="btn w-100 d-flex justify-content-between align-items-center m-0 text-muted"
                onClick={() => toggleDropdown("areaUnit")}
              >
                <span><FaRuler className="me-2" color="#2F747F" /> {formData.areaUnit || "Select Area Unit"}</span>
                <FaChevronDown color="#2F747F" />
              </button>
            </div>
            {dropdownState.activeDropdown === "areaUnit" && (
              <div
                className="dropdown-popup"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#E9F7F2',
                  width: '100%',
                  maxWidth: '350px',
                  padding: '10px',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  overflowY: 'auto',
                  maxHeight: '50vh',
                  animation: 'popupOpen 0.3s ease-in-out',
                }}
              >
                <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Area Unit</h6>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control m-0 mt-2"
                    placeholder="Filter options..."
                    value={dropdownState.filterText}
                    onChange={(e) => setDropdownState(prev => ({ ...prev, filterText: e.target.value }))}
                    style={{
                      width: '80%',
                      padding: '5px',
                      background: "#C0DFDA",
                      border: "none",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDropdown()}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                    }}
                  >
                    <FaTimes size={18} color="red" />
                  </button>
                </div>
                <ul className="list-group mt-2 w-100">
                  {(dataList.areaUnit || []).filter(option => option.toLowerCase().includes(dropdownState.filterText.toLowerCase())).map((option, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action d-flex align-items-center"
                      onClick={() => handleDropdownSelect("areaUnit", option)}
                      style={{
                        padding: '5px',
                        cursor: 'pointer',
                        color: "#26794A",
                        marginBottom: '5px',
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Payment Type */}
          <div className="col-12 mb-3">
            <div
              className="input-card p-0 rounded-1"
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                border: '1px solid #2F747F',
                background: '#fff',
                position: 'relative',
              }}
            >
              <div
                className="d-flex align-items-center"
                onClick={() => toggleDropdown("paymentType")}
                style={{ cursor: 'pointer', padding: '8px 10px' }}
              >
                <FaCreditCard style={{ color: '#2F747F', marginRight: '10px' }} />
                <span style={{ flex: 1, color: formData.paymentType ? '#000' : '#6c757d' }}>
                  {formData.paymentType || "Select Payment Type"}
                </span>
                <FaChevronDown style={{ color: '#2F747F' }} />
              </div>

              {dropdownState.activeDropdown === "paymentType" && (
                <div
                  className="dropdown-popup w-100"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#E9F7F2',
                    width: '100%',
                    maxWidth: '350px',
                    padding: '10px',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    overflowY: 'auto',
                    maxHeight: '50vh',
                    animation: 'popupOpen 0.3s ease-in-out',
                  }}
                >
                  <h6 style={{ color: '#2F747F', fontWeight: 'bold', marginBottom: '10px' }}>Select Payment Type</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter options..."
                      value={dropdownState.filterText}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, filterText: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => toggleDropdown('paymentType')}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      <FaTimes size={18} color="red" />
                    </button>
                  </div>
                  <ul className="list-group mt-2">
                    {(paymentTypes || [])
                      .filter((type) =>
                        type.paymentType.toLowerCase().includes(dropdownState.filterText.toLowerCase())
                      )
                      .map((type, index) => (
                        <li
                          key={index}
                          className="list-group-item list-group-item-action"
                          style={{
                            padding: '5px',
                            cursor: 'pointer',
                            color: '#26794A',
                            marginBottom: '5px',
                          }}
                          onClick={() => {
                            handleDropdownSelect("paymentType", type.paymentType);
                            setDropdownState((prev) => ({ ...prev, filterText: "" }));
                          }}
                        >
                          {type.paymentType}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="col-12 mb-3">
            <div
              className="input-card p-0 rounded-1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                border: '1px solid #2F747F',
                background: "#fff"
              }}
            >
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input m-0"
                placeholder="Enter Description"
                style={{
                  flex: '1 0 80%',
                  padding: '8px',
                  fontSize: '14px',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '100px'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button w-100"
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              background: "#6CBAAF",
              border: 'none',
              color: '#ffffff',
              width: '100%',
              borderRadius: '5px',
              marginTop: '10px'
            }}
          >
            {ba_id ? "UPDATE PROPERTY ASSISTANCE" : "ADD PROPERTY ASSISTANCE"}
          </button>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            textAlign: 'center',
            minWidth: '300px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
          <h5 style={{ color: '#2F747F', marginBottom: '10px', fontWeight: 'bold' }}>
            Updated Successfully
          </h5>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '0' }}>
            Your property assistance has been updated.
          </p>
        </div>
      )}
    </div>
  );
};

export default EditBuyerAssistance;