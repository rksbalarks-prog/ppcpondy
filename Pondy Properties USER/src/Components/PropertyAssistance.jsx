



import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
 import imge from "../Assets/ppbuyer.png";
import { RiCloseCircleFill, RiLayoutLine } from 'react-icons/ri';
import { TbArrowLeftRight, TbMapPinCode, TbWorldLongitude } from 'react-icons/tb';
import {FaPhoneAlt, FaRulerCombined,  FaBath, FaChartArea, FaPhone ,FaEdit,FaRoad,FaCreditCard,FaLandmark, FaHome, FaUserAlt, FaEnvelope,  FaRupeeSign , FaFileVideo , FaToilet,FaCar,FaBed,  FaCity , FaTimes, FaArrowRight, FaStreetView, FaSearch} from 'react-icons/fa';
import {  FaRegAddressCard, FaChevronDown } from 'react-icons/fa6';
import { MdLocationOn, MdOutlineMeetingRoom, MdOutlineOtherHouses, MdSchedule , MdStraighten , MdApproval, MdLocationCity , MdAddPhotoAlternate, MdKeyboardDoubleArrowDown, MdOutlineClose} from "react-icons/md";
import { BsBank, BsBuildingsFill, BsFillHouseCheckFill , BsTextareaT} from "react-icons/bs";
import { GiKitchenScale, GiMoneyStack , GiResize , GiGears} from "react-icons/gi";
import { HiUserGroup } from "react-icons/hi";
import { BiBuildingHouse , BiMap, BiWorld} from "react-icons/bi";
import {   FaFileAlt, FaGlobeAmericas, FaMapMarkerAlt, FaMapSigns } from "react-icons/fa";
import {MdElevator ,MdOutlineChair ,MdPhone, MdOutlineAccessTime, MdTimer, MdHomeWork, MdHouseSiding, MdOutlineKitchen, MdEmail, } from "react-icons/md";
import {  BsBarChart, BsGraphUp } from "react-icons/bs";
import { BiBuilding, BiStreetView } from "react-icons/bi";
import { GiStairs, GiForkKnifeSpoon, GiWindow } from "react-icons/gi";
import { AiOutlineEye, AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { BiBed, BiBath, BiCar, BiCalendar, BiUser, BiCube } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import minprice from "../Assets/Price Mini-01.png";
import maxprice from "../Assets/Price maxi-01.png";
import { FcSearch } from "react-icons/fc";
import { toWords } from 'number-to-words';



const PropertyAssistance = ({ phoneNumber, existingData }) => {
    const [hovered, setHovered] = useState(false);
      const [priceInWords, setPriceInWords] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredAreaIndex, setHoveredAreaIndex] = useState(null);
  
      const [citySuggestions, setCitySuggestions] = useState([]);
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const cityTimeoutRef = useRef(null);
  const areaTimeoutRef = useRef(null);
  
    const baseStyle = {
      backgroundColor: "#019988",
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    };
  
    const hoverStyle = {
      backgroundColor: "#017a6e",
    };
      const suggestionListStyle = {
  listStyle: "none",
  margin: 0,
  padding: "5px",
  border: "1px solid #ccc",
  borderTop: "none",
  maxHeight: "150px",
  overflowY: "auto",
  position: "absolute",
  width: "100%",
  background: "#ffffff",
  zIndex: 1000,
};

const suggestionItemStyle = {
  padding: "8px 10px",
  cursor: "pointer",
};

const suggestionItemHoverStyle = {
  backgroundColor: "#f0f0f0",
};
  // Function to handle price selection
  const handlePriceSelect = (priceType, price) => {
    setFormData((prevState) => ({
      ...prevState,
      [priceType]: price,
    }));
    toggleDropdown(null); // Close the dropdown after selecting an option
  };

  const [formData, setFormData] = useState({
    phoneNumber: phoneNumber || "",
    altPhoneNumber: "",
    city: "",
    area: "",
    loanInput: "",
    minPrice: "",
    maxPrice: "",
    totalArea:"",
    areaUnit: "",
    bedrooms: "",
    propertyMode: "",
    propertyType: "",
    propertyAge: "",
    bankLoan: "",
    propertyApproved: "",
    facing: "",
    state: "",
    paymentType: "",
    description: "",
    baName:"",
    alternatePhone:""
  });

useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: " Property Assistance" ,
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
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "Add Buyer Assistance",
            viewTime: new Date().toISOString(),
          });
        } catch (err) {
        }
      };
    
      if (phoneNumber) {
        recordDashboardView();
      }
    }, [phoneNumber]);
  

  const [paymentTypes, setPaymentTypes] = useState([]);
  const fieldIcons = {
    // Contact Details
    phoneNumber: <FaPhone color="#2F747F" />,
    alternatePhone: <FaPhone color="#2F747F" />,
    email: <FaEnvelope color="#2F747F" />,
    propertyType: <MdSchedule color="#2F747F" />,
    
    // Property Location
    rentalPropertyAddress: <MdLocationCity color="#2F747F" />,
    country: <BiWorld color="#2F747F" />,
    state: <MdLocationCity color="#2F747F" />,
    city: <FaCity color="#2F747F" />,
    district: <FaRegAddressCard color="#2F747F" />,
    area: <MdLocationOn color="#2F747F" />,
    streetName: <RiLayoutLine color="#2F747F" />,
    doorNumber: <BiBuildingHouse color="#2F747F" />,
    nagar: <FaRegAddressCard color="#2F747F" />,
  
    // Ownership & Posting Info
    ownerName: <FaUserAlt color="#2F747F" />,
    postedBy: <FaUserAlt color="#2F747F" />,
    ownership: <HiUserGroup color="#2F747F" />,
  
    // Property Details
    propertyMode: <MdApproval color="#2F747F" />,
    propertyType: <MdOutlineOtherHouses color="#2F747F" />,
    propertyApproved: <BsFillHouseCheckFill color="#2F747F" />,
    propertyAge: <MdSchedule color="#2F747F" />,
    description: <BsTextareaT color="#2F747F" />,
  
    // Pricing & Financials
    price: <FaRupeeSign color="#2F747F" />,
    bankLoan: <BsBank color="#2F747F" />,
    negotiation: <GiMoneyStack color="#2F747F" />,
  
    // Measurements
    length: <MdStraighten color="#2F747F" />,
    breadth: <MdStraighten color="#2F747F" />,
    totalArea: <GiResize color="#2F747F" />,
    areaUnit: <FaChartArea color="#2F747F" />,
  
    // Room & Floor Details
    bedrooms: <FaBed color="#2F747F" />,
    kitchen: <GiKitchenScale color="#2F747F" />,
    kitchenType: <GiKitchenScale color="#2F747F" />,
    balconies: <MdOutlineMeetingRoom color="#2F747F" />,
    floorNo: <BsBuildingsFill color="#2F747F" />,
    numberOfFloors: <BsBuildingsFill color="#2F747F" />,
    attachedBathrooms: <FaBath color="#2F747F" />,
    western: <FaToilet  color="#2F747F" />,
  
    // Features & Amenities
    facing: <TbArrowLeftRight color="#2F747F" />,
    salesMode: <GiGears color="#2F747F" />,
    salesType: <MdOutlineOtherHouses color="#2F747F" />,
    furnished: <FaHome color="#2F747F" />,
    lift: <BsBuildingsFill color="#2F747F" />,
    carParking: <FaCar color="#2F747F" />,
  };
  const fieldLabels = {
  propertyMode: "Property Mode",
  propertyType: "Property Type",
  price: "Price",
  propertyAge: "Property Age",
  bankLoan: "Bank Loan",
  negotiation: "Negotiation",
  length: "Length",
  breadth: "Breadth",
  totalArea: "Total Area",
  ownership: "Ownership",
  bedrooms: "Bedrooms",
  kitchen: "Kitchen",
  kitchenType: "Kitchen Type",
  balconies: "Balconies",
  floorNo: "Floor No.",
  areaUnit: "Area Unit",
  propertyApproved: "Property Approved",
  postedBy: "Posted By",
  facing: "Facing",
  salesMode: "Sales Mode",
  salesType: "Sales Type",
  description: "Description",
  furnished: "Furnished",
  lift: "Lift",
  attachedBathrooms: "Attached Bathrooms",
  western: "Western Toilet",
  numberOfFloors: "Number of Floors",
  state: "Car Parking",
  rentalPropertyAddress: "Property Address",
  country: "Country",
  state: "State",
  city: "City",
  district: "District",
  area: "Area",
  streetName: "Street Name",
  doorNumber: "Door Number",
  nagar: "Nagar",
  ownerName: "Owner Name",
    paymentType: "payment Type",

  email: "Email",
  phoneNumber: "Phone Number",
  phoneNumberCountryCode: "Phone Country Code",
  alternatePhone: "Alternate Phone",
  alternatePhoneCountryCode: "Alternate Phone Country Code",
};
const handleFilterChange = (e) => {
    setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }));
  };

const renderDropdown = (field) => {
  const options = dataList[field] || [];
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(dropdownState.filterText.toLowerCase())
  );

  return (
    <div data-field={field}>
      {dropdownState.activeDropdown === field && (
        <div
          className="popup-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1509,
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <div
            className="dropdown-popup"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              width: '100%',
              maxWidth: '300px',
              padding: '10px',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',
              borderRadius: '18px',
              animation: 'popupOpen 0.3s ease-in-out',
            }}
          >
            <div
              className="p-1"
              style={{
                fontWeight: 500,
                fontSize: '15px',
                marginBottom: '10px',
                textAlign: 'start',
                color: 'grey',
              }}
            >
              Select or Search{' '}
              <span style={{ color: '#0B57CF', fontWeight: 500 }}>
                {fieldLabels[field] || 'Property Field'}
              </span>
            </div>
            <div
              className="mb-1"
              style={{
                position: 'relative',
                width: '100%',
                background: '#EEF4FA',
                borderRadius: '25px',
              }}
            >
              <FcSearch
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'black',
                }}
              />
              <input
                className="m-0 rounded-0 ms-1"
                type="text"
                placeholder="Filter options..."
                value={dropdownState.filterText}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '5px 5px 5px 30px', // left padding for the icon
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
              />
            </div>

            <ul
              style={{
                listStyleType: 'none',
                padding: 0,
                margin: 0,
                overflowY: 'auto',
                maxHeight: '350px',
              }}
            >
              {filteredOptions.map((option, index) => (
                <li
                  key={index}
                onClick={() => {
  setFormData((prevState) => ({
    ...prevState,
    [field]: option,
  }));

  toggleDropdown(field); // Close current dropdown

  const currentIndex = dropdownFieldOrder.indexOf(field);
  if (currentIndex !== -1 && currentIndex < dropdownFieldOrder.length - 1) {
    const nextField = dropdownFieldOrder[currentIndex + 1];

    if (nonDropdownFields.includes(nextField)) {
      // Focus the next input field and scroll to it
      setTimeout(() => {
        const nextInput = document.querySelector(`[name="${nextField}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else {
      // Open next dropdown and scroll it into view
      setTimeout(() => {
        toggleDropdown(nextField);
        setTimeout(() => {
          const el = document.querySelector(`[data-field="${nextField}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }, 0);
    }
  }
}}

                  style={{
                    fontWeight: 300,
                    padding: '5px',
                    cursor: 'pointer',
                    color: 'grey',
                    marginBottom: '5px',
                    borderBottom: '1px solid #D0D7DE',
                  }}
                >
    {(field === 'minPrice' || field === 'maxPrice') ? formatPrice(option) : option}
                </li>
              ))}
            </ul>

            <div className="d-flex justify-content-end">
              <button
                className="me-1"
                type="button"
               onClick={() => {
    toggleDropdown(field); // Close current dropdown

    const currentIndex = dropdownFieldOrder.indexOf(field);

    if (currentIndex > 0) {
      const prevField = dropdownFieldOrder[currentIndex - 1];

      if (nonDropdownFields.includes(prevField)) {
        setTimeout(() => {
          const prevInput = document.querySelector(`[name="${prevField}"]`);
          if (prevInput) {
            prevInput.focus();
            prevInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        setTimeout(() => {
          toggleDropdown(prevField); // Open prev dropdown
          setTimeout(() => {
            const el = document.querySelector(`[data-field="${prevField}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }, 0);
      }
    }
  }}
                style={{
                  background: '#EAEAF6',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#0B57CF',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  fontWeight: 500,
                }}
              >
                Prev
              </button>

              <button
                type="button"
                onClick={() => toggleDropdown(field)}
                style={{
                  background: '#0B57CF',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '10px',
                }}
              >
                Close
              </button>
            </div>

        
          </div>
        </div>
      )}
    </div>
  );
};
  const nonDropdownFields = ["alternatePhone", "totalArea", "baName", "city", "area", "description",];

const dropdownFieldOrder = [
    "minPrice",
  "maxPrice",
   "altPhoneNumber",
  "propertyMode",
  "propertyType",
  "bedrooms",
  "facing",
  "propertyApproved",
  "propertyAge",
  "bankLoan",
    "totalArea",
  "areaUnit",
  "paymentType",
  "baName",
  "state",
  "city",
];

    const fetchCitySuggestions = (input) => {
  clearTimeout(cityTimeoutRef.current);
  cityTimeoutRef.current = setTimeout(async () => {
    if (!input) return setCitySuggestions([]);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/cities?search=${input}`);
      setCitySuggestions(res.data.data);
    } catch (err) {
      setCitySuggestions([]);
    }
  }, 300);
};

const fetchAreaSuggestions = (input) => {
  clearTimeout(areaTimeoutRef.current);
  areaTimeoutRef.current = setTimeout(async () => {
    if (!input) return setAreaSuggestions([]);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/areas?search=${input}`);
      setAreaSuggestions(res.data.data);
    } catch (err) {
      setAreaSuggestions([]);
    }
  }, 300);
};

  useEffect(() => {
    fetchPaymentTypes();
  }, []);
  
  const fetchPaymentTypes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment-all`);
      setPaymentTypes(res.data); // Expected format: [{ paymentType: "Online" }, { paymentType: "Cash" }, ...]
    } catch (error) {
    }
  };
const navigate = useNavigate();
  
  const [dataList, setDataList] = useState({});
  const [dropdownState, setDropdownState] = useState({ activeDropdown: null, filterText: "" });

  const [message, setMessage] = useState("");
const [showPopup, setShowPopup] = useState(false);
const [showConfirmPopup, setShowConfirmPopup] = useState(false);


const handleSubmit = (e) => {
  e.preventDefault();

  const errors = [];

  if (!formData.state) errors.push("State is required");
  if (!formData.propertyType) errors.push("Property Type is required");
  if (!formData.propertyMode) errors.push("Property Mode is required");
  if (!formData.minPrice) errors.push("Min Price is required");
  if (!formData.maxPrice) errors.push("Max Price is required");

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  setShowConfirmPopup(true); // all fields are valid
};




  useEffect(() => {
    fetchDropdownData();
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

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

  const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({ activeDropdown: prevState.activeDropdown === field ? null : field, filterText: "" }));
  };

  const handleDropdownSelect = (field, value) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
    setDropdownState({ activeDropdown: null, filterText: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };
 const handleInputChanges = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));

  if (name === 'city') {
    fetchCitySuggestions(value);
  } else if (name === 'area') {
    fetchAreaSuggestions(value);
  }
};

    const handleFieldChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        
        ...prev,
        [name]: name === "description" && value.length > 0 
          ? value.charAt(0).toUpperCase() + value.slice(1)  // Capitalize only "description"
          : value,
          
      }));
        // Handle price conversion
    if (name === "price") {
      if (value !== "" && !isNaN(value)) {
        setPriceInWords(convertToIndianRupees(value));
      } else {
        setPriceInWords("");
      }
    }
  };
     const convertToIndianRupees = (num) => {
        const number = parseInt(num, 10);
        if (isNaN(number)) return "";
      
        if (number >= 10000000) {
          return (number / 10000000).toFixed(2).replace(/\.00$/, '') + " crores";
        } else if (number >= 100000) {
          return (number / 100000).toFixed(2).replace(/\.00$/, '') + " lakhs";
        } else {
          return toWords(number).replace(/\b\w/g, l => l.toUpperCase()) + " rupees";
        }
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

const handleConfirmSubmit = async () => {
  setShowConfirmPopup(false); // hide the confirm popup

  try {
    let response;

    if (formData._id) {
      // Update existing request
      response = await axios.put(
        `${process.env.REACT_APP_API_URL}/update-buyerAssistance/${formData._id}`,
        formData
      );
      setMessage("Buyer Assistance request updated successfully!");
    } else {
      // Create new request
      response = await axios.post(
        `${process.env.REACT_APP_API_URL}/add-buyerAssistance`,
        formData
      );
      setFormData(response.data.data); // Save returned formData with IDs etc.
      setMessage("Buyer Assistance request added successfully!");
    }

    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      setMessage("");

      // Extract ba_id and phoneNumber from response.data.data (backend sends ba_id)
      const baId = response?.data?.data?.ba_id || formData.ba_id;
      const phone = response?.data?.data?.phoneNumber || formData.phoneNumber || phoneNumber;

      if (baId && phone) {
        navigate("/buyer-plan", {
          state: {
            baId,      // pass buyer assistance ID as baId
            phoneNumber: phone, // pass phone number
          },
        });
      } else {
        setMessage({ text: "Missing buyer assistance ID or phone number", type: "error" });
      }
    }, 3000);
  } catch (error) {
    setMessage({ text: "Please fill all required fields correctly.", type: "error" });
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
      setMessage("");
    }, 3000);
  }
};



  return (
    <div className="property-form-container p-1" style={{  overflowY: "auto",  position: "relative", scrollbarWidth: "none" ,  fontFamily: "Inter, sans-serif",}}>
      <img src={imge} alt="" className="header-image"  style={{width:'100%'}}/>
      <div className="w-100 d-flex justify-content-around align-items-center mt-3">
        <button style={{
          ...baseStyle,
          opacity: 0.6,
          cursor: "not-allowed",
        }}
        disabled
        >Add Buyer Assistant</button>
        <button   style={{
          ...baseStyle,
          ...(hovered ? hoverStyle : {}),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/Buyer-List-Filter`)}

   >view Buyer List</button>

      </div>
      <h4 className="form-title mt-3" style={{color: '#2F747F', fontSize:"15px", fontWeight:"bold"}}>Buyer Assistance</h4>


      <div>
      {message && <div className="alert text-success text-bold">{message}</div>}
      {/* Your existing component structure goes here */}
    </div>

      {showConfirmPopup && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '320px',
        textAlign: 'center',
      }}
    >
      <h5>Do you want to create this Buyer Assistance request?</h5>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-around' }}>
        <button
          onClick={handleConfirmSubmit}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6CBAAF',
            border: 'none',
            color: '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Yes
        </button>
        <button
          onClick={() => setShowConfirmPopup(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ccc',
            border: 'none',
            color: '#333',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}



      <form onSubmit={handleSubmit} className="p-3">
  
    

 <div className="row mb-3 justify-content-around">
 
   
<div className="form-group col-5 p-0 m-0" >
    <label style={{width:'100%'}}>
    <label>minPrice <span style={{ color: 'red' }}>* </span></label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="minPrice"
            value={formData.minPrice || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select minPrice</option>
            {dataList.minPrice?.map((option, index) => (
              <option key={index} value={option}>
               {formatPrice(option)}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("minPrice")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              <img src={minprice} alt="" />
            </span>
{formData.minPrice ? formatPrice(formData.minPrice) : "Select minPrice"}
          </button>

          {renderDropdown("minPrice")}
        </div>
      </div>
    </label>
  </div>
  
    <div className="form-group col-5 p-0 m-0" >
        <label style={{width:'100%'}}>
        <label>maxPrice <span style={{ color: 'red' }}>* </span></label>
    
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: "1" }}>
              <select
                name="maxPrice"
                value={formData.maxPrice || ""}
                onChange={handleFieldChange}
                className="form-control"
                style={{ display: "none" }} // Hide the default <select> dropdown
              >
                <option value="">Select maxPrice</option>
                {dataList.maxPrice?.map((option, index) => (
                  <option key={index} value={option}>
      {formatPrice(option)}
                  </option>
                ))}
              </select>
    
              <button
                className="m-0"
                type="button"
                onClick={() => toggleDropdown("maxPrice")}
                style={{
                  cursor: "pointer",
                  border: "1px solid #2F747F",
                  padding: "10px",
                  background: "#fff",
                  borderRadius: "5px",
                  width: "100%",
                  textAlign: "left",
                  color: "#2F747F",
                }}
              >
                <span style={{ marginRight: "10px" }}>
                   <img src={maxprice} alt="" />
                </span>
{formData.maxPrice ? formatPrice(formData.maxPrice) : "Select maxPrice"}
              </button>
    
              {renderDropdown("maxPrice")}
            </div>
          </div>
        </label>
      </div>
    </div>

      <div className="col-12 mb-3">
        <label  style={{fontWeight:600}}>PhoneNumber</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}>
    <FaPhoneAlt className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input
      type="tel"
      name="phoneNumber"
      value={formData.phoneNumber}
      onChange={handleInputChange}
      className="form-input m-0"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
      readOnly 
      />
  </div>
</div>


<div className="col-12 mb-3">
  <label  style={{fontWeight:600}}>AlternatePhone</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}>
    <FaPhoneAlt className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input
      type="number"
      name="alternatePhone"
      value={formData.alternatePhone}
      onChange={handleInputChange}
      className="form-input m-0"
      placeholder="Enter Your alternatePhone"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
      />
  </div>
</div>

<div className="row justify-content-center">
 
  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Property Mode <span style={{ color: 'red' }}>* </span></label>

      <div style={{ display: "flex", alignItems: "center", width:"100%" }}>
        <div style={{ flex: "1" }}>
          <select
            name="propertyMode"
            value={formData.propertyMode || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }}
          >
            <option value="">Select Property Mode</option>
            {dataList.propertyMode?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            // ref={formRefs.propertyMode} // Attach ref here

            onClick={() => toggleDropdown("propertyMode")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.propertyMode || <FaHome />}
            </span>
            {formData.propertyMode || "Select Property Mode"}
          </button>

          {renderDropdown("propertyMode")}
        </div>
      </div>
    </label>
  </div>
 
  <div className="form-group" >
    <label style={{width:'100%'}}>
    <label>propertyType</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="propertyType"
            value={formData.propertyType || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select propertyType</option>
            {dataList.propertyType?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("propertyType")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.propertyType || <FaHome />}
            </span>
            {formData.propertyType || "Select propertyType"}
          </button>

          {renderDropdown("propertyType")}
        </div>
      </div>
    </label>
  </div>
   
<div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Bedrooms </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="bedrooms"
            value={formData.bedrooms || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select bedrooms</option>
            {dataList.bedrooms?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("bedrooms")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.bedrooms || <FaHome />}
            </span>
            {formData.bedrooms || "Select bedrooms"}
          </button>

          {renderDropdown("bedrooms")}
        </div>
      </div>
    </label>
  </div>

  
  <div className="form-group">

    <label style={{ width: '100%'}}>
    <label>Facing</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="facing"
            value={formData.facing || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select facing</option>
            {dataList.facing?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("facing")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.facing || <FaHome />}
            </span>
            {formData.facing || "Select facing"}
          </button>

          {renderDropdown("facing")}
        </div>
      </div>
    </label>
  </div>


   
  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Property Approved</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="propertyApproved"
            value={formData.propertyApproved || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select propertyApproved</option>
            {dataList.propertyApproved?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("propertyApproved")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.propertyApproved || <FaHome />}
            </span>
            {formData.propertyApproved || "Select propertyApproved"}
          </button>

          {renderDropdown("propertyApproved")}
        </div>
      </div>
    </label>
  </div>
 
   <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Property Age </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="propertyAge"
            value={formData.propertyAge || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select Property Age</option>
            {dataList.propertyAge?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("propertyAge")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.propertyAge || <FaHome />}
            </span>
            {formData.propertyAge || "Select Property Age"}
          </button>

          {renderDropdown("propertyAge")}
        </div>
      </div>
    </label>
  </div>
  
   
  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Bank Loan </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="bankLoan"
            value={formData.bankLoan || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select Bank Loan</option>
            {dataList.bankLoan?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("bankLoan")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.bankLoan || <FaHome />}
            </span>
            {formData.bankLoan || "Select Bank Loan"}
          </button>

          {renderDropdown("bankLoan")}
        </div>
      </div>
    </label>
  </div>

{/* {Total Area} */}
<div className="col-12 mb-3">
  <label  style={{fontWeight:600}}>Total Area</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}>
    <FaRulerCombined className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input
      type="text"
      name="totalArea"
      value={formData.totalArea}
      onChange={handleInputChange}
      className="form-input m-0"
      placeholder="Enter Total Area"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>


 
  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Area Unit</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="areaUnit"
            value={formData.areaUnit || ""}
            onChange={handleFieldChange}
            className="form-control"
            
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select areaUnit</option>
            {dataList.areaUnit?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            // ref={formRefs.areaUnit} // Attach ref here

            onClick={() => toggleDropdown("areaUnit")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.areaUnit || <FaHome />}
            </span>
            {formData.areaUnit || "Select areaUnit"}
          </button>

          {renderDropdown("areaUnit")}
        </div>
      </div>
    </label>
  </div>
   
  <div className="form-group" >
    <label style={{width:'100%'}}>
    <label>paymentType</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="paymentType"
            value={formData.paymentType || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
          >
            <option value="">Select paymentType</option>
            {dataList.paymentType?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("paymentType")}
            style={{
              cursor: "pointer",
              border: "1px solid #2F747F",
              padding: "10px",
              background: "#fff",
              borderRadius: "5px",
              width: "100%",
              textAlign: "left",
              color: "#2F747F",
            }}
          >
            <span style={{ marginRight: "10px" }}>
              {fieldIcons.paymentType || <FaCreditCard />}
            </span>
            {formData.paymentType || "Select paymentType"}
          </button>

          {renderDropdown("paymentType")}
        </div>
      </div>
    </label>
  </div>
</div>
<div className="col-12 mb-3">
  <label  style={{fontWeight:600}}>Owner Name</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}>
    <FaUserAlt className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input
      type="text"
      name="baName"
      value={formData.baName}
      onChange={handleInputChange}
      className="form-input m-0"
      placeholder="Enter Your Name"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

 
  <div className="form-group">
      <label style={{ width: '100%'}}>
      <label>State  <span style={{ color: 'red' }}>* </span></label>
  
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: "1" }}>
            <select
              name="state"
              value={formData.state || ""}
              onChange={handleFieldChange}
              className="form-control"
              style={{ display: "none" }} // Hide the default <select> dropdown
            >
              <option value="">Select state</option>
              {dataList.state?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
  
            <button
              className="m-0"
              type="button"
              onClick={() => toggleDropdown("state")}
              style={{
                cursor: "pointer",
                border: "1px solid #2F747F",
                padding: "10px",
                background: "#fff",
                borderRadius: "5px",
                width: "100%",
                textAlign: "left",
                color: "#2F747F",
              }}
            >
              <span style={{ marginRight: "10px" }}>
                {fieldIcons.state || <FaHome />}
              </span>
              {formData.state || "Select state"}
            </button>
  
            {renderDropdown("state")}
          </div>
        </div>
      </label>
    </div>
 

<div className="col-12 mb-3" style={{ position: 'relative' }}>
  <label style={{ fontWeight: 600 }}>City</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', border: '1px solid #2F747F', background: "#fff" }}>
    <FaCity style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input className="m-0"
      type="text"
      name="city"
      value={formData.city}
      onChange={handleInputChanges}
      placeholder="Enter City"
      style={{ flex: '1', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
 

  {citySuggestions.length > 0 && (
  <ul style={suggestionListStyle}>
    {citySuggestions.map((city, index) => (
      <li
        key={index}
        style={{
          ...suggestionItemStyle,
          ...(hoveredIndex === index ? suggestionItemHoverStyle : {}),
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => {
          setFormData({ ...formData, city: city });
          setCitySuggestions([]);
        }}
      >
        {city}
      </li>
    ))}
  </ul>
)}

</div>

 

<div className="col-12 mb-3" style={{ position: 'relative' }}>
  <label style={{ fontWeight: 600 }}>Area</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', border: '1px solid #2F747F', background: "#fff" }}>
    <FaCity style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input  className="m-0"
      type="text"
      name="area"
      value={formData.area}
      onChange={handleInputChanges}
      placeholder="Enter Area"
      style={{ flex: '1', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
 {areaSuggestions.length > 0 && (
  <ul style={suggestionListStyle}>
    {areaSuggestions.map((area, index) => (
      <li
        key={index}
        style={{
          ...suggestionItemStyle,
          ...(hoveredAreaIndex === index ? suggestionItemHoverStyle : {}),
        }}
        onMouseEnter={() => setHoveredAreaIndex(index)}
        onMouseLeave={() => setHoveredAreaIndex(null)}
        onClick={() => {
          setFormData({ ...formData, area });
          setAreaSuggestions([]);
        }}
      >
        {area}
      </li>
    ))}
  </ul>
)}

</div>

<div className="col-12 mb-3">
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}>
    {/* <FaComment className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} /> */}
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
        resize: 'none',  // Optional: Prevent resizing of the textarea
        minHeight: '100px' // Optional: Set a minimum height
      }}
    />
  </div>
</div>

     
  

        <button type="submit" className="submit-button w-100" style={{ padding: "10px 20px", cursor: "pointer", background:"#6CBAAF", border:'none', color:'#ffffff'}}
        
        onMouseOver={(e) => {
          e.target.style.background = "#017a6e"; // Brighter neon on hover
          e.target.style.fontWeight = 500; // Brighter neon on hover
          e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover

        }}
        onMouseOut={(e) => {
          e.target.style.background = "#6CBAAF"; // Original orange
          e.target.style.fontWeight = 400; // Brighter neon on hover

        }}>
          {formData._id ? "UPDATE PROPERTY ASSISTANCE" : "ADD PROPERTY ASSISTANCE"}
        </button>
      </form>
    </div>
  );
};





export default PropertyAssistance;

















