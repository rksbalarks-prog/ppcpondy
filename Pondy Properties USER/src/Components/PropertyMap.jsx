

import React, { useEffect, useState , useRef} from "react";
import { Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { 
  FaFilter, FaHome, FaCity, FaRupeeSign, FaBed, FaCheck, FaTimes, 
  FaTools, FaIdCard, FaCalendarAlt, FaUserAlt, FaRulerCombined, FaBath, 
   FaCar, FaHandshake, FaToilet, 
  FaCamera,
  FaEye,
  FaSearch,
  FaArrowUp
} from "react-icons/fa";
import { TbArrowLeftRight } from "react-icons/tb";
import { AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { BsBank } from "react-icons/bs";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { FaKitchenSet, FaPhone } from "react-icons/fa6";
import myImage from '../Assets/Rectangle 146.png'; // Correct path
import myImage1 from '../Assets/Rectangle 145.png'; // Correct path
import pic from '../Assets/default.png'; // Correct path
import {FaChartArea, FaMapPin, FaDoorClosed , FaRoad ,FaRegAddressCard } from 'react-icons/fa6';
import { MdLocationOn, MdOutlineMeetingRoom, MdOutlineOtherHouses, MdSchedule , MdApproval, MdLocationCity } from "react-icons/md";
import { BsBuildingsFill, BsFillHouseCheckFill } from "react-icons/bs";
import { GiKitchenScale,  GiResize , GiGears} from "react-icons/gi";
import { HiUserGroup } from "react-icons/hi";
import { BiSearchAlt,  BiWorld} from "react-icons/bi";
import {  MdElevator   } from "react-icons/md";
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import indianprice from '../Assets/Indian Rupee-01.png'
import {
  
  FaUsers,
  FaSortAmountDownAlt,
  FaHeadset,
} from 'react-icons/fa';
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import minprice from "../Assets/Price Mini-01.png";
import maxprice from "../Assets/Price maxi-01.png";
import { FcSearch } from "react-icons/fc";
import { GrPowerReset } from "react-icons/gr";
import PondyIcon from '../Assets/pondyMa.png';
import MarkerClusterer from '@googlemaps/markerclustererplus';
 

const FilteredPropertyMap = ({ filteredProperties , resetSearchFlag }) => {
  const mapRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic based on all fields
  const filteredByLocation = filteredProperties.filter((property) => {
    const term = searchTerm.toLowerCase();
    return (
      property.city?.toLowerCase().includes(term) ||
      property.area?.toLowerCase().includes(term) ||
      property.nagar?.toLowerCase().includes(term) ||
      property.streetName?.toLowerCase().includes(term) ||
      property.district?.toLowerCase().includes(term) ||
      property.state?.toLowerCase().includes(term)
    );
  });



 const location = useLocation();
  
    const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";

      const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
  

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Property Map",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);



const loadGoogleMapsScript = (callback) => {
  if (window.google) {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
};
 useEffect(() => {
  loadGoogleMapsScript(() => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = { lat: 11.9416, lng: 79.8083 };
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
    });

    const bounds = new window.google.maps.LatLngBounds();
    const markers = [];

    filteredByLocation.forEach((property) => {
      const coords = parseCoordinates(property.locationCoordinates);
      if (!coords) return;

      const marker = new window.google.maps.Marker({
        position: coords,
        icon: {
          url: PondyIcon,
          scaledSize: new window.google.maps.Size(20, 20),
        },
      });

      const label = new window.google.maps.InfoWindow({
        content: `
          <div style="font-size: 12px; font-family: Inter, sans-serif; max-width: 220px;">
            <div style="font-weight: bold; color: #014378; margin-bottom: 5px;">
              <span style="color: grey;">PPCID:</span> ${property.ppcId}
            </div>
            <div style="margin-bottom: 4px;">
              <strong style="color: grey;">Price:</strong> ₹${property.price ? property.price.toLocaleString('en-IN') : 'N/A'}
            </div>
            <div style="margin-bottom: 4px;">
              <strong style="color: grey;">Type:</strong> ${property.propertyType || 'N/A'}
            </div>
            <div>
              <a href="/detail/${property.ppcId}" style="color: #FF4920; text-decoration: underline;">More</a>
            </div>
          </div>
        `,
        position: {
          lat: coords.lat + 0.0003,
          lng: coords.lng,
        },
      });

      marker.addListener('click', () => {
        label.open(map, marker);
      });
marker.addListener('dblclick', () => {
  map.setZoom(18); // Or any zoom level you prefer
  map.setCenter(marker.getPosition());
});

      markers.push(marker);
      bounds.extend(coords);
    });

    if (markers.length > 0) {
      map.fitBounds(bounds);
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(13);
    }

    // ✅ Add clustering here
    new MarkerClusterer(map, markers, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    });
  });
}, [filteredByLocation]);

  const parseCoordinates = (coordString) => {
    const regex = /([+-]?\d+(\.\d+)?)[^\d+-]+([+-]?\d+(\.\d+)?)/;
    const match = coordString.match(regex);
    if (!match) return null;

    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[3]),
    };
  };

  useEffect(() => {
    setSearchTerm('');
  }, [resetSearchFlag]);
  return (
    <>
      <div style={{ position: 'relative', width: '100%' }}>
        <FcSearch
          size={16}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color:"black",
          }}
        />
        <input
          className="m-0 rounded-0 ms-1"
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 5px 5px 30px', // left padding for the icon
            background: "#fff",
            border: "none",
            outline: "none",
            borderBottom: '1px solid #D0D7DE'
          }}
        />
      </div>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '400px', marginTop: '20px', borderRadius: '8px' }}
      />
 

    </>
  );
};


const PropertyMap = ({phoneNumber}) => {
  const [properties, setProperties] = useState([]);
   const [filters, setFilters] = useState({ 
    id: '', 
    minPrice: '', 
    maxPrice: '', 
    propertyMode: '', 
    city: '' ,
     propertyType: ''
  });
  const [hoverSearch, setHoverSearch] = useState(false);
  const [hoverAdvance, setHoverAdvance] = useState(false);
  const [imageCounts, setImageCounts] = useState({}); // Store image count for each property
  const [loading, setLoading] = useState(true); 
  const [resetSearchFlag, setResetSearchFlag] = React.useState(false);


  const [showMap, setShowMap] = useState(false);

  

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Property Map",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);




  const [advancedFilters, setAdvancedFilters] = useState({
    propertyMode: '', propertyType: '', minPrice: '', maxPrice: '', propertyAge: '', bankLoan: '',
    negotiation: '', length: '', breadth: '', totalArea: '', minTotalArea: '', ownership: '', bedrooms: '',
    minBedrooms: '', kitchen: '', kitchenType: '', balconies: '', floorNo: '', areaUnit: '', propertyApproved: '',
    facing: '', salesMode: '', furnished: '', lift: '', attachedBathrooms: '', minAttachedBathrooms: '',
    western: '', minWestern: '', numberOfFloors: '', carParking: '', city: '', phoneNumber: ''
  });


  const handleReset = () => {
    setAdvancedFilters(prev => Object.fromEntries(Object.keys(prev).map(key => [key, ''])));
    setFilters(prev => Object.fromEntries(Object.keys(prev).map(key => [key, ''])));
    setResetSearchFlag(prev => !prev); // Toggle to notify child to reset search
  };
    const activeFilterCount = [
    ...Object.values(filters),
    ...Object.values(advancedFilters)
  ].filter((val) => val !== '').length;

  const shouldShowButton = activeFilterCount >= 2;

  const [showMinBedroomsOptions, setShowMinBedroomsOptions] = useState(false);
  const [showMinAttachedBathroomsOptions, setShowMinAttachedBathroomsOptions] = useState(false);
  const [showMinWesternOptions, setShowMinWesternOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle change for minBedrooms
  const handleMinBedroomSelect = (value) => {
    setAdvancedFilters(prevState => ({
      ...prevState,
      minBedrooms: value
    }));
    setShowMinBedroomsOptions(false);
  };

  // Handle change for minAttachedBathrooms
  const handleMinAttachedBathroomsSelect = (value) => {
    setAdvancedFilters(prevState => ({
      ...prevState,
      minAttachedBathrooms: value
    }));
    setShowMinAttachedBathroomsOptions(false);
  };

  // Handle change for minWestern
  const handleMinWesternSelect = (value) => {
    setAdvancedFilters(prevState => ({
      ...prevState,
      minWestern: value
    }));
    setShowMinWesternOptions(false);
  };

  const closeMinBedroomsOptions = () => {
    setShowMinBedroomsOptions(false);
  };

  const closeMinAttachedBathroomsOptions = () => {
    setShowMinAttachedBathroomsOptions(false);
  };

  const closeMinWesternOptions = () => {
    setShowMinWesternOptions(false);
  };

  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [isAdvancedPopupOpen, setIsAdvancedPopupOpen] = useState(false);
  const navigate = useNavigate();


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
  
    // Fetch image counts for all properties
    useEffect(() => {
      const fetchAllImageCounts = async () => {
        const counts = {};
        await Promise.all(
          properties.map(async (property) => {
            const count = await fetchImageCount(property.ppcId);
            counts[property.ppcId] = count;
          })
        );
        setImageCounts(counts);
      };
  
      if (properties.length > 0) {
        fetchAllImageCounts();
      }
    }, [properties]);
  



    

useEffect(() => {
  const fetchProperties = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-users`);
      const allProperties = response.data.users;

      // Sort by createdAt in descending order (newest first)
      const sortedProperties = allProperties.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setProperties(sortedProperties);
    } catch (error) {
    } finally {
      setLoading(false); // Stop loading
    }
  };

  fetchProperties();
}, []);

    
    const [dropdownState, setDropdownState] = useState({
      activeDropdown: null,
      filterText: "",
      position: { top: 0, left: 0 },
    });
  const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({
      activeDropdown: prevState.activeDropdown === field ? null : field,
      filterText: "",
    }));
  };


  
    const [dataList, setDataList] = useState({});
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
  
    useEffect(() => {
      fetchDropdownData();
    }, []);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevState) => ({ ...prevState, [name]: value }));

    // setFilters({ ...filters, [name]: value });
    setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }));

  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter options based on search query
  const filterOptions = (options) => {
    return options.filter(option => option.toString().includes(searchQuery));
  };
  const handleAdvancedFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters((prevState) => ({ ...prevState, [name]: value }));
    setDropdownState((prevState) => ({ ...prevState, filterText: value }));
  };
  const fieldLabels = {
    propertyMode: "Property Mode",
    propertyType: "Property Type",
    price: "Price",
    minPrice: 'minPrice', 
    maxPrice: 'maxPrice', 
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
    carParking: "Car Parking",
    country: "Country",
    state: "State",
    city: "City",
    district: "District",
    area: "Area",
    streetName: "Street Name",
    doorNumber: "Door Number",
    nagar: "Nagar",
    ownerName: "Owner Name",
    email: "Email",
    phoneNumber: "Phone Number",
    phoneNumberCountryCode: "Phone Country Code",
    alternatePhone: "Alternate Phone",
    alternatePhoneCountryCode: "Alternate Phone Country Code",
    bestTimeToCall: "Best Time to Call",
  };
  
    
    const renderDropdown = (field) => {
      const options = dataList[field] || [];
      const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(dropdownState.filterText.toLowerCase())
      );
  
      return (
        dropdownState.activeDropdown === field && (
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
    animation: 'fadeIn 0.3s ease-in-out'
  }}
><div
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
                <div className="p-1"
          style={{
            fontWeight: 500,
            fontSize: "15px",
            marginBottom: "10px",
            textAlign: "start",
                color: "grey",
          }}
        >
           Select or Search <span style={{color:"black"}}>{fieldLabels[field] || "Property Field"}</span>
        </div>
<div className="mb-1"
 style={{ 
  position: 'relative',
  width: '100%' ,
   background:"#EEF4FA",
    borderRadius:"25px"}}>
  <FcSearch
    size={16}
    style={{
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color:"black",
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
      background: "transparent",
      border: "none",
      outline: "none",
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
  // Update advanced filters 
   setAdvancedFilters((prevState) => ({ ...prevState, [field]: option, })); 
   // Update the filters state
     setFilters((prevState) => ({ ...prevState, [field]: option, })); 
     // Toggle dropdown visibility
       toggleDropdown(field); }}

                  style={{
                    fontWeight:300,
                    padding: '5px',
                    cursor: 'pointer',
                    color:"grey",
                    marginBottom: '5px',
                    borderBottom:'1px solid #D0D7DE'
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
            <div className="d-flex justify-content-end">
        
              <button
                type="button"
                onClick={() => toggleDropdown(field)}
                style={{
                  background: '#0B57CF',
                  cursor: 'pointer',
                  border: 'none',
                  color:'#fff',
                  borderRadius:"10px"
                }}
              >Close
              </button>
            </div>
          </div></div>
        )
      );
    };
 

 
  const filteredProperties = properties.filter((property) => { 
    const basicFilterMatch = 
      (filters.id ? property.ppcId?.toString().includes(filters.id) : true) &&
      (filters.propertyMode ? property.propertyMode?.toLowerCase().includes(filters.propertyMode.toLowerCase()) : true) &&
      (filters.propertyType ? property.propertyType?.toLowerCase().includes(filters.propertyType.toLowerCase()) : true) &&
      (filters.city ? property.city?.toLowerCase().includes(filters.city.toLowerCase()) : true);
  
    const priceMatch = 
      (filters.minPrice ? property.price >= Number(filters.minPrice) : true) &&
      (filters.maxPrice ? property.price <= Number(filters.maxPrice) : true);
  
    const advancedFilterMatch = Object.keys(advancedFilters).every((key) => {
      if (!advancedFilters[key]) return true;
  
      if (key === "minPrice") {
        return property.price >= Number(advancedFilters[key]);
      }
      if (key === "maxPrice") {
        return property.price <= Number(advancedFilters[key]);
      }
      if (key === "minTotalArea") {
        return property.totalArea >= Number(advancedFilters[key]);
      }
      if (key === "minBedrooms") {
        return property.bedrooms >= Number(advancedFilters[key]);
      }
      if (key === "minAttachedBathrooms") {
        return property.attachedBathrooms >= Number(advancedFilters[key]);
      }
      if (key === "minWestern") {
        return property.western >= Number(advancedFilters[key]);
      }
  
      // Default behavior for other fields (string matching)
      return property[key]?.toString()?.toLowerCase()?.includes(advancedFilters[key]?.toLowerCase());
    });
  
    return basicFilterMatch && priceMatch && advancedFilterMatch;
  });
  
  useEffect(() => {
    const backdrop = document.querySelector('.modal-backdrop');
    if (isFilterPopupOpen && backdrop) {
      backdrop.style.pointerEvents = 'none';
    }
  }, [isFilterPopupOpen]);
  


  return (
    <Container fluid className="p-0 w-100 d-flex align-items-center justify-content-center ">
      <Helmet>
        <title>Pondy Property | Properties</title>
      </Helmet>
      <Row className="g-3 w-100 ">
        <Col lg={12} className="d-flex align-items-center justify-content-center pt-2 m-0">
         <div className="suggection m-0"
      style={{
        width:"100%",
      display: 'flex',
    overflowX: 'auto',
    gap: '1rem',
    whiteSpace: 'nowrap',
    marginBottom: '1rem',
      }}
    >
              <style jsx>{`
   .suggection::-webkit-scrollbar {
  height: 3px; 
}

.suggection::-webkit-scrollbar-thumb {
  background-color: #6CBAAF; 
  /* border-radius: 4px;  */
}
.suggection::-webkit-scrollbar-thumb:hover {
  background-color: #6CBAAF; 
  cursor: pointer;
}

.suggection::-webkit-scrollbar-track {
  background-color: rgb(244, 235, 235); 
}
  `}</style>

   <div className="form-group m-0">
          <label style={{ width: '100%'}}>      
            <div style={{ display: "flex", alignItems: "center", width:"100%" }}>
              <div style={{ flex: "1" }}>
      
                <button
                  className="m-0 p-2"
                  type="button"
 onClick={handleReset}                  style={{
                    cursor: "pointer",
                    border: "none",
                    padding: "10px",
                    background: "#2F747F",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#fff",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
            <GrPowerReset />
                  </span>
Clear                </button>
                    </div>
            </div>
          </label>
        </div>

        <div className="form-group m-0">
          <label style={{ width: '100%'}}>      
            <div style={{ display: "flex", alignItems: "center", width:"100%" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyMode"
                  value={advancedFilters.propertyMode || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select Property Mode</option>
                  {dataList.propertyMode?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0 p-2"
                  type="button"
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
            <MdApproval />
                  </span>
                  {advancedFilters.propertyMode || "Select Property Mode"}
                </button>
      
                {renderDropdown("propertyMode")}
              </div>
            </div>
          </label>
        </div>
      
      
        <div className="form-group m-0">
          <label style={{ width: '100%'}}>
            <div style={{ display: "flex", alignItems: "center"}}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyType"
                  value={advancedFilters.propertyType || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select property Type</option>
                  {dataList.propertyType?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0 p-2"
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
         <MdOutlineOtherHouses />
                  </span>
                  {advancedFilters.propertyType || "Select Property Type"}
                </button>
      
                {renderDropdown("propertyType")}
              </div>
            </div>
          </label>
        </div>
       <div className="form-group m-0">
          <label style={{ width: '100%'}}>
            <div style={{ display: "flex", alignItems: "center"}}>
              <div style={{ flex: "1" }}>
                <select
                  name="minPrice"
                  value={advancedFilters.minPrice || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select minPrice</option>
                  {dataList.minPrice?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0 p-2"
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
<img src={minprice} alt="" />                   </span>
                  {advancedFilters.minPrice || "Select minPrice"}
                </button>
      
                {renderDropdown("minPrice")}
              </div>
            </div>
          </label>
        </div>
       
    <div className="form-group m-0">
          <label style={{ width: '100%'}}>
            <div style={{ display: "flex", alignItems: "center"}}>
              <div style={{ flex: "1" }}>
                <select
                  name="minPrice"
                  value={advancedFilters.maxPrice || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select maxPrice</option>
                  {dataList.maxPrice?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0 p-2"
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
 <img src={maxprice} alt="" />                </span>
                  {advancedFilters.maxPrice || "Select maxPrice"}
                </button>
      
                {renderDropdown("maxPrice")}
              </div>
            </div>
          </label>
        </div>
     
    

      </div>
        </Col>
     
  
 

          <div className="w-100 m-0">
 
        {filteredProperties.length > 0 && (
  <div className="mt-4">
      <FilteredPropertyMap filteredProperties={filteredProperties} resetSearchFlag={resetSearchFlag} />
  </div>
)}
            </div>

      
      </Row>

   


    </Container>
  );
};

export default PropertyMap;
