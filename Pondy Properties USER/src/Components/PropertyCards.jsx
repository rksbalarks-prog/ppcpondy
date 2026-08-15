

import React, { useEffect, useState , useRef, useMemo} from "react";
import { Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { 
  FaFilter, FaHome, FaCity, FaRupeeSign, FaBed, FaCheck, FaTimes, 
  FaTools, FaIdCard, FaCalendarAlt, FaUserAlt, FaRulerCombined, FaBath, 
   FaCar, FaHandshake, FaToilet, 
  FaCamera,
  FaEye,
  FaMapMarkerAlt
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
import { MdLocationOn, MdOutlineMeetingRoom, MdOutlineOtherHouses, MdSchedule , MdApproval, MdLocationCity, MdOutlineStarOutline } from "react-icons/md";
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
import maplocation from "../Assets/maplocation.png";



const FilteredPropertyMap = ({ filteredProperties }) => {
  const mapRef = useRef(null);


  useEffect(() => {
    if (!window.google || !filteredProperties.length) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 0, lng: 0 },
    });

    const bounds = new window.google.maps.LatLngBounds();

    filteredProperties.forEach((property) => {
      const coords = parseCoordinates(property.locationCoordinates);
      if (!coords) return;

      const marker = new window.google.maps.Marker({
        position: coords,
        map,
        icon: {
          // url:'/mapLocation.jpg',
          // path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#007BFF',
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: 'white',
            scaledSize: new window.google.maps.Size(40, 40), // Width x Height in pixels

        },
      });

      // Custom label for property ID, positioned above the marker
      const label = new window.google.maps.InfoWindow({
        content: `<div style="font-size: 11px; font-weight: bold; color: blue;"><span style={{color:"grey"}}>PPCID:</span>${property.ppcId}</div>`,
        position: {
          lat: coords.lat + 0.0003, // Adjust to move the label vertically
          lng: coords.lng,
        },
      });
label.open(map, marker);

      // Open the label when the marker is clicked (optional)
      // marker.addListener('click', () => {
      //   label.open(map, marker);
      // });

      bounds.extend(coords);
    });

    map.fitBounds(bounds);
  }, [filteredProperties]);

  const parseCoordinates = (coordString) => {
    const regex = /([+-]?\d+(\.\d+)?)[^\d+-]+([+-]?\d+(\.\d+)?)/;
    const match = coordString.match(regex);
    if (!match) return null;

    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[3]),
    };
  };
 
  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '300px', marginTop: '20px', borderRadius: '8px' }}
    />
  );
};
const PropertyCards = ({phoneNumber}) => {
  const [properties, setProperties] = useState([]);
  // const [filters, setFilters] = useState({ id: '', price: '', propertyMode: '', city: '' });
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
  const [mergedData, setMergedData] = useState([]);
    const [uploads, setUploads] = useState([]);


  const [showMap, setShowMap] = useState(false);

  const [clickedCards, setClickedCards] = useState([]);


  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Mobile Home",
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


 
useEffect(() => {
  const fetchAllProperties = async () => {
     try {
      const [featuredRes, activeRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/fetch-featured-properties-on-demand`),
        axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-users-on-demand`)
      ]);

      // Add isFeatured flag to featured properties
      const featuredProperties = featuredRes.data.properties.map((property) => ({
        ...property,
        isFeatured: true,
      }));

      const featuredPpcIds = new Set(featuredProperties.map((p) => p.ppcId));

      // Filter out duplicates and mark remaining as non-featured
      const activeProperties = activeRes.data.users
        .filter((property) => !featuredPpcIds.has(property.ppcId))
        .map((property) => ({
          ...property,
          isFeatured: false,
        }));

      const allProperties = [...featuredProperties, ...activeProperties].sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt);
        const bDate = new Date(b.updatedAt || b.createdAt);
        return bDate - aDate; // Newest first
      });

      setProperties(allProperties);
    } catch (error) {
                console.error("Error fetching property data:", error);

    
  };

 };

      const fetchUploadedImages = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-uploadimages-ads`);
      const sortedUploads = res.data.data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setUploads(sortedUploads);
    } catch (err) {
      console.error('Failed to fetch uploaded images:', err);
      // setError('Failed to fetch uploaded images');
    } finally {
      setLoading(false); // You may want to handle loading for both separately
    }
  };

  // Fetch both
  setLoading(true);
  fetchAllProperties().finally(() => {
    fetchUploadedImages(); // Chained to ensure loading ends after both
  });
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
 
  
const numberFields = [
  'length', 'breadth', 'totalArea', 'minTotalArea', 'phoneNumber'
];

const handleAdvancedFilterChange = (e) => {
  const { name, value, type } = e.target;

  setAdvancedFilters((prevState) => ({
    ...prevState,
    [name]: numberFields.includes(name) || type === "number"
      ? (value === '' ? '' : Number(value))
      : value
  }));

  setDropdownState((prevState) => ({
    ...prevState,
    filterText: value
  }));
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
            className="dropdown-popup"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              // backgroundColor: '#fff',
              backgroundColor: '#E9F7F2',

              width: '100%',
              // maxWidth: '400px',
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
                      <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "10px",
            textAlign: "start",
            color: "#019988",
          }}
        >
           {fieldLabels[field] || "Property Field"}
        </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="Filter options..."
                value={dropdownState.filterText}
                onChange={handleFilterChange}
                style={{
                  width: '80%',
                  padding: '5px',
  // marginBottom: '10px',
  background:"#C0DFDA",
  border:"none",
  outline:"none"                }}
              />
              <button
                type="button"
                onClick={() => toggleDropdown(field)}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              >
                <FaTimes size={18} color="red" />
              </button>
            </div>
            <ul
              style={{
                listStyleType: 'none',
                padding: 0,
                margin: 0,
              }}
            >
            
{filteredOptions.map((option, index) => (
  <li
    key={index}
    onClick={() => {
      // Update advanced filters
      setAdvancedFilters((prevState) => ({
        ...prevState,
        [field]: option,
      }));
      
      // Update the filters state
      setFilters((prevState) => ({
        ...prevState,
        [field]: option,
      }));
      
      // Toggle dropdown visibility
      toggleDropdown(field);
    }}
    style={{
      padding: '5px',
      cursor: 'pointer',
      color:"#26794A",
      marginBottom: '5px',
    }}
  >
    {(field === 'minPrice' || field === 'maxPrice') ? formatPrice(option) : option}
  </li>
))}

            </ul>
          </div>
        )
      );
    };

 
   const filteredProperties = properties.filter((property) => { 
  const basicFilterMatch = 
    (filters.id ? property.ppcId === Number(filters.id) : true) &&
    (filters.propertyMode ? property.propertyMode?.toLowerCase().includes(filters.propertyMode.toLowerCase()) : true) &&
    (filters.propertyType ? property.propertyType?.toLowerCase().includes(filters.propertyType.toLowerCase()) : true) &&
    (filters.city ? property.city?.toLowerCase().includes(filters.city.toLowerCase()) : true);

  const priceMatch = 
    (filters.minPrice ? property.price >= Number(filters.minPrice) : true) &&
    (filters.maxPrice ? property.price <= Number(filters.maxPrice) : true);

  const advancedFilterMatch = Object.keys(advancedFilters).every((key) => {
    if (!advancedFilters[key]) return true;

    if (key === "minPrice") {
      return property.price >= advancedFilters[key];
    }
    if (key === "maxPrice") {
      return property.price <= advancedFilters[key];
    }
    if (key === "minTotalArea") {
      return property.totalArea >= advancedFilters[key];
    }
    if (key === "minBedrooms") {
      return property.bedrooms >= advancedFilters[key];
    }
    if (key === "minAttachedBathrooms") {
      return property.attachedBathrooms >= advancedFilters[key];
    }
    if (key === "minWestern") {
      return property.western >= advancedFilters[key];
    }

    // Default: string match
    return property[key]?.toString().toLowerCase()
      .includes(advancedFilters[key].toString().toLowerCase());
  });

  return basicFilterMatch && priceMatch && advancedFilterMatch;
});
  useEffect(() => {
    const backdrop = document.querySelector('.modal-backdrop');
    if (isFilterPopupOpen && backdrop) {
      backdrop.style.pointerEvents = 'none';
    }
  }, [isFilterPopupOpen]);
  
useEffect(() => {
  const stored = JSON.parse(localStorage.getItem('clickedCards')) || [];
  setClickedCards(stored);
}, []);

  const handleCardClick = (ppcId, phoneNumber) => {
   const stored = JSON.parse(localStorage.getItem('clickedCards')) || [];
  if (!stored.includes(ppcId)) {
    stored.push(ppcId);
    localStorage.setItem('clickedCards', JSON.stringify(stored));
  }
      navigate(`/detail/${ppcId}`, { state: { phoneNumber } });

};
const totalUploads = useMemo(() => {
  return uploads.flatMap(upload =>
    (upload.images || []).map(img => ({
      _id: upload._id,
      img,
      type: 'upload'
    }))
  );
}, [uploads]);

useEffect(() => {
  // Avoid running logic if both sources are empty
  if (!filteredProperties?.length && !totalUploads?.length) return;

  const merged = [];
  let propertyCounter = 0;
  let uploadIndex = 0;

  for (let i = 0; i < filteredProperties.length; i++) {
    merged.push({ ...filteredProperties[i], type: 'property' });
    propertyCounter++;

    if (propertyCounter === 8 && uploadIndex < totalUploads.length) {
      merged.push(totalUploads[uploadIndex]);
      uploadIndex++;
      propertyCounter = 0;
    }
  }

  // Append remaining uploads
  if (uploadIndex < totalUploads.length) {
    merged.push(...totalUploads.slice(uploadIndex));
  }

  // Handle case where no filteredProperties, just uploads
  if (filteredProperties.length === 0) {
    merged.push(...totalUploads);
  }

  // Only update state if data actually changed
  setMergedData(prev => {
    const isSame = JSON.stringify(prev) === JSON.stringify(merged);
    return isSame ? prev : merged;
  });

}, [filteredProperties, totalUploads]);
 
  return (
    <Container fluid className="p-0 w-100 d-flex align-items-center justify-content-center ">
      <Helmet>
        <title>Pondy Property | Properties</title>
      </Helmet>
      <Row className="g-3 w-100 ">
        <Col lg={12} className="d-flex align-items-center justify-content-center pt-2 m-0">
        
      <div
  className="d-flex flex-column justify-content-center align-items-center"
  data-bs-toggle="modal"
  data-bs-target="#propertyModal"
  style={{
    height: '50px',
    width: '50px',
    background: '#2F747F',
    borderRadius: '50%',
    position: 'fixed',
    right: 'calc(50% - 187.5px + 10px)', // Center - half of 375px + some offset
    bottom: '15%',
    zIndex: '1',
  }}
>
  <BiSearchAlt fontSize={24} color="#fff" />
</div>

{/* Modal */}
<div
  className="modal fade"
  id="propertyModal"
  tabIndex="-1"
  data-bs-backdrop="false"
  data-bs-keyboard="false"
  style={{  backgroundColor: 'rgba(64, 64, 64, 0.9)', // white with 90% opacity
    backdropFilter: 'blur(1px)', // optional for a frosted-glass effect
}}
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content rounded-5 shadow" 
     style={{
      width: "350px",
      margin: "0 auto", // centers horizontally
     
    }}    >
      <div className="modal-body py-4">
        <div className="d-grid gap-2 mb-2">
          {/* Search Property - Open another popup */}
          <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
            className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
            data-bs-toggle="modal"
            data-bs-target="#filterPopup" // Nested modal
          >
            <FaHome className="me-2" /> Search Property
          </button>

          {/* Tenant Search */}
          <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
          className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
                onClick={() => navigate(`/FormComponent`)}
>
            <FaUsers className="me-2" /> Buyer Search
          </button>

          {/* Quick Sort */}
          <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
          className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
                          onClick={() => navigate(`/Sort-Property`)}
>
            <FaSortAmountDownAlt className="me-2" /> Quick Sort
          </button>

          {/* Property Assistance */}
          <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
          className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
      onClick={() => navigate(`/Property-Assistance-Search/${phoneNumber}`)}
      >
            <FaHeadset className="me-2" /> Property Assistance
          </button>
        </div>

        {/* Cancel */}
        <div className="text-center" >
          <button className="btn btn-primary rounded-2 px-4 mt-2" data-bs-dismiss="modal"
          style={{ fontWeight:500 , fontSize:"10px"}}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Filter Popup (Nested Modal) */}
<div
  className="modal fade"
  id="filterPopup"
  tabIndex="-1"
  aria-labelledby="filterPopupLabel"
  aria-hidden="true"
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content rounded-4 shadow">
      <div className="modal-header">
        <h5 className="modal-title" id="filterPopupLabel">Search Property</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        {/* Filter Form */}
        <div className="form-group">
          <label>ID</label>
          <div
            className="input-card p-0 rounded-1"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              border: '1px solid #2F747F',
              background: '#fff',
            }}
          >
            <FaIdCard className="input-icon" style={{ color: '#2F747F', marginLeft: '10px' }} />
            <input
              type="number"
              name="id"
              value={filters.id}
              onChange={handleFilterChange}
              className="form-input m-0"
              placeholder="ID"
              style={{
                flex: '1 0 80%',
                padding: '8px',
                fontSize: '14px',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>minPrice
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: '1' }}>
        <select
  name="minPrice"
  value={filters.minPrice || ''}
  onChange={handleFilterChange}
  className="form-control"
  style={{ display: 'none' }}
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
                onClick={() => toggleDropdown('minPrice')}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #2F747F',
                  padding: '10px',
                  background: '#fff',
                  borderRadius: '5px',
                  width: '100%',
                  textAlign: 'left',
                  color: '#2F747F',
                }}
              >
                <span style={{ marginRight: '10px' }}>
                <img src={minprice} alt="" />
                </span>
    {filters.minPrice ? formatPrice(filters.minPrice) : 'Select minPrice'}
              </button>

              {renderDropdown('minPrice')}
            </div>
          </div>
        </div>

<div className="form-group">
          <label>maxPrice</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: '1' }}>
              <select
                name="maxPrice"
                value={filters.maxPrice || ''}
                onChange={handleFilterChange}
                className="form-control"
                style={{ display: 'none' }}
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
                onClick={() => toggleDropdown('maxPrice')}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #2F747F',
                  padding: '10px',
                  background: '#fff',
                  borderRadius: '5px',
                  width: '100%',
                  textAlign: 'left',
                  color: '#2F747F',
                }}
              >
                <span style={{ marginRight: '10px' }}>
                <img src={maxprice} alt="" />
                </span>
    {filters.maxPrice ? formatPrice(filters.maxPrice) : 'Select maxPrice'}
              </button>

              {renderDropdown('maxPrice')}
            </div>
          </div>
        </div>
  <div className="form-group">
          <label>Property Mode</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: '1' }}>
              <select
                name="propertyMode"
                value={filters.propertyMode || ''}
                onChange={handleFilterChange}
                className="form-control"
                style={{ display: 'none' }}
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
                onClick={() => toggleDropdown('propertyMode')}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #2F747F',
                  padding: '10px',
                  background: '#fff',
                  borderRadius: '5px',
                  width: '100%',
                  textAlign: 'left',
                  color: '#2F747F',
                }}
              >
                <span style={{ marginRight: '10px' }}>
                  <MdApproval />
                </span>
                {filters.propertyMode || 'Select Property Mode'}
              </button>

              {renderDropdown('propertyMode')}
            </div>
          </div>
        </div>
    
      
        <div className="form-group">
          <label style={{ width: '100%'}}>
      <label>Property Type  </label>
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
         <MdOutlineOtherHouses />
                  </span>
                  {filters.propertyType || "Select Property Type"}
                </button>
      
                {renderDropdown("propertyType")}
              </div>
            </div>
          </label>
        </div>
        <div className="form-group">
          <label>City</label>
          <div
            className="input-card p-0 rounded-1"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              border: '1px solid #2F747F',
              background: '#fff',
            }}
          >
            <FaCity className="input-icon" style={{ color: '#2F747F', marginLeft: '10px' }} />
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              className="form-input m-0"
              placeholder="City"
              style={{
                flex: '1 0 80%',
                padding: '8px',
                fontSize: '14px',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Advance Filter Button */}
        <div className="text-center mt-3 ">
        <button  aria-label="Close"  data-bs-dismiss="modal"
        type="button"
        className="btn w-100"
        style={{
          backgroundColor: hoverSearch ? '#58a09b' : '#6EB7B2',
          color: '#fff',
          border: 'none',
        }}
        onMouseEnter={() => setHoverSearch(true)}
        onMouseLeave={() => setHoverSearch(false)}
       >
        SEARCH
      </button>

      <button
        type="button"
        className="btn w-100 mt-3"
        style={{
          backgroundColor: hoverAdvance ? '#6EB7B2' : 'transparent',
          color: hoverAdvance ? '#fff' : '#6EB7B2',
          border: `1px solid #6EB7B2`,
        }}
        onMouseEnter={() => setHoverAdvance(true)}
        onMouseLeave={() => setHoverAdvance(false)}
        data-bs-toggle="modal"
        data-bs-target="#advancedFilterPopup"
      >
        GO TO ADVANCED SEARCH
      </button>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Advanced Filter Popup */}
<div
  className="modal fade"
  id="advancedFilterPopup"
  tabIndex="-1"
  aria-labelledby="advancedFilterPopupLabel"
  aria-hidden="true"
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content rounded-4 shadow">
      <div className="modal-header">
        <h5 className="modal-title" id="advancedFilterPopupLabel">Advanced Search</h5>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div className="modal-body">
        {/* Add Advanced Filter Fields Here */}
    
        <div>
        <div className="form-group">
  <label>Phone Number:</label>
  <div
    className="input-card p-0 rounded-1"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}
  >
    <FaPhone   className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input
      type="number"
      name="phoneNumber"
      value={advancedFilters.phoneNumber}
      onChange={handleAdvancedFilterChange}
      className="form-input m-0"
      placeholder="Phone Number"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

        {/* Property Mode */}
        <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>Property Mode  </label>
      
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
                  className="m-0"
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
      
      
        <div className="form-group">
          <label style={{ width: '100%'}}>
      <label>Property Type  </label>
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
         <MdOutlineOtherHouses />
                  </span>
                  {advancedFilters.propertyType || "Select Property Type"}
                </button>
      
                {renderDropdown("propertyType")}
              </div>
            </div>
          </label>
        </div>
        {/* Price */}
       
       <div className="form-group m-0">
              <label>Min Price </label>

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
      {formatPrice(option)}
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
    {advancedFilters.minPrice ? formatPrice(advancedFilters.minPrice) : 'Select minPrice'}
                </button>
      
                {renderDropdown("minPrice")}
              </div>
            </div>
          </label>
        </div>
       
    <div className="form-group m-0">
            <label>Max Price  </label>

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
      {formatPrice(option)}
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
    {advancedFilters.maxPrice ? formatPrice(advancedFilters.maxPrice) : 'Select maxPrice'}
                </button>
      
                {renderDropdown("maxPrice")}
              </div>
            </div>
          </label>
        </div>
        {/* Property Age */}
        <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>Property Age </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyAge"
                  value={advancedFilters.propertyAge || ""}
                  onChange={handleAdvancedFilterChange}
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
            <MdSchedule />
                  </span>
                  {advancedFilters.propertyAge || "Select Property Age"}
                </button>
      
                {renderDropdown("propertyAge")}
              </div>
            </div>
          </label>
        </div>
      
        {/* Bank Loan */}
      
        <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>Bank Loan </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="bankLoan"
                  value={advancedFilters.bankLoan || ""}
                  onChange={handleAdvancedFilterChange}
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
             <BsBank />
                  </span>
                  {advancedFilters.bankLoan || "Select Bank Loan"}
                </button>
      
                {renderDropdown("bankLoan")}
              </div>
            </div>
          </label>
        </div>
      
        </div>
       
      
                       <div>
        {/* Negotiation */}
      
        <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>Negotiation </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="negotiation"
                  value={advancedFilters.negotiation || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select negotiation</option>
                  {dataList.negotiation?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("negotiation")}
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
           <FaHandshake />
                  </span>
                  {advancedFilters.negotiation || "Selectnegotiation"}
                </button>
      
                {renderDropdown("negotiation")}
              </div>
            </div>
          </label>
        </div>
      
        {/* Length */} 
        <div className="form-group">
        <label>length:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <AiOutlineColumnHeight className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="number"
            name="length"
            value={advancedFilters.length}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="length"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* Breadth */}
        <div className="form-group">
        <label>breadth:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <AiOutlineColumnWidth className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="number"
            name="breadth"
            value={advancedFilters.breadth}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="breadth"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
        {/* Total Area */}
        <div className="form-group">
        <label>Total Area:  </label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <GiResize className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="number"
            name="totalArea"
            value={advancedFilters.totalArea}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="totalArea"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
        <div className="form-group">
  <label>Min Total Area:</label>
  <div
    className="input-card p-0 rounded-1"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background: "#fff" }}
  >
    <GiResize className="input-icon" style={{ color: '#2F747F', marginLeft: "10px" }} />
    <input
      type="number"
      name="minTotalArea"
      value={advancedFilters.minTotalArea}
      onChange={handleAdvancedFilterChange}
      className="form-input m-0"
      placeholder="Min Total Area"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

          {/* areaUnit */}
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>Area Unit  </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="areaUnit"
                  value={advancedFilters.areaUnit || ""}
                  onChange={handleAdvancedFilterChange}
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
                   <FaChartArea />
                  </span>
                  {advancedFilters.areaUnit || "Select areaUnit"}
                </button>
      
                {renderDropdown("areaUnit")}
              </div>
            </div>
          </label>
        </div>
      
        {/* Ownership */}
        <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>Ownership </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="ownership"
                  value={advancedFilters.ownership || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select ownership</option>
                  {dataList.ownership?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("ownership")}
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
             <HiUserGroup />
                  </span>
                  {advancedFilters.ownership || "Select ownership"}
                </button>
      
                {renderDropdown("ownership")}
              </div>
            </div>
          </label>
        </div>
      
        </div>
      
      
                      <div>
        {/* Bedrooms */}
      
      <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>bedrooms </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="bedrooms"
                  value={advancedFilters.bedrooms || ""}
                  onChange={handleAdvancedFilterChange}
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
          <FaBed />
                  </span>
                  {advancedFilters.bedrooms || "Select bedrooms"}
                </button>
      
                {renderDropdown("bedrooms")}
              </div>
            </div>
          </label>
        </div>

          
        <div className="form-group">
      <label style={{ width: '100%' }}>
        <label>Min Bedrooms</label>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: "1", position: "relative" }}>
            <select
              name="minBedrooms"
              value={advancedFilters.minBedrooms || ""}
              onChange={handleAdvancedFilterChange}
              className="form-control"
              style={{ display: "none" }}
            >
              <option value="">Select min bedrooms</option>
              {filterOptions(["1", "2", "3", "4", "5", "6", "10"]).map((value, index) => (
                  <div
                    key={index}
                    style={{ padding: "10px", cursor: "pointer" }}
                    onClick={() => handleMinBedroomSelect(value)}
                  >
                    {value === "5" ? "5+ Bedrooms" :
                     value === "6" ? "6+ Bedrooms" :
                     value === "10" ? "10+ Bedrooms" :
                     `${value} Bedroom${value !== "1" ? "s" : ""}`}
                  </div>
                ))}
            </select>

            <button
              className="m-0"
              type="button"
              onClick={() => setShowMinBedroomsOptions(!showMinBedroomsOptions)}
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
                <FaBed />
              </span>
              {advancedFilters.minBedrooms || "Select min bedrooms"}
            </button>

            {showMinBedroomsOptions && (
              <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                // backgroundColor: '#fff',
                backgroundColor: '#E9F7F2',
  
                width: '100%',
                // maxWidth: '400px',
                maxWidth: '350px',
  
                padding: '10px',
                zIndex: 10,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                overflowY: 'auto',
                maxHeight: '50vh',
                animation: 'popupOpen 0.3s ease-in-out',
                 scrollbarWidth:"none"
              }}
              >
                  <label       style={{
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "10px",
            textAlign: "start",
            color: "#019988",
          }}> Min Bedrooms </label>
                    <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search options"
                  style={{
                    width: '80%',
                    padding: '5px',
    // marginBottom: '10px',
    background:"#C0DFDA",
    border:"none",
    outline:"none"   
                  }}
                />
                      <button
                type="button"
                onClick={closeMinBedroomsOptions}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              >
                <FaTimes size={18} color="red" />
              </button>
              {filterOptions(["1", "2", "3", "4", "5", "6", "10"]).map((value, index) => (
                  <div
                    key={index}
                    style={{ padding: "10px", cursor: "pointer" , scrollbarWidth:"none" }}
                    onClick={() => handleMinBedroomSelect(value)}
                  >
                    {value === "5" ? "5 Bedrooms" :
                     value === "6" ? "6 Bedrooms" :
                     value === "10" ? "10 Bedrooms" :
                     `${value} Bedroom${value !== "1" ? "s" : ""}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </label>
    </div>

        {/* kitchen */}
        <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>kitchen </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="kitchen"
                  value={advancedFilters.kitchen || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select kitchen</option>
                  {dataList.kitchen?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("kitchen")}
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
               <GiKitchenScale />
                  </span>
                  {advancedFilters.kitchen || "Select kitchen"}
                </button>
      
                {renderDropdown("kitchen")}
              </div>
            </div>
          </label>
        </div>
          {/* kitchenType */}
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>kitchenType </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="kitchenType"
                  value={advancedFilters.kitchenType || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select kitchenType</option>
                  {dataList.kitchenType?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("kitchenType")}
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
                 <FaKitchenSet />
                  </span>
                  {advancedFilters.kitchenType || "Select kitchenType"}
                </button>
      
                {renderDropdown("kitchenType")}
              </div>
            </div>
          </label>
        </div>
          {/* balconies */}
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>balconies </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="balconies"
                  value={advancedFilters.balconies || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select balconies</option>
                  {dataList.balconies?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("balconies")}
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
              <MdOutlineMeetingRoom />
                  </span>
                  {advancedFilters.balconies || "Select balconies"}
                </button>
      
                {renderDropdown("balconies")}
              </div>
            </div>
          </label>
        </div>
          {/* floorNo */}
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>floorNo </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="floorNo"
                  value={advancedFilters.floorNo || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select floorNo</option>
                  {dataList.floorNo?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("floorNo")}
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
              <BsBuildingsFill />
                  </span>
                  {advancedFilters.floorNo || "Select floorNo"}
                </button>
      
                {renderDropdown("floorNo")}
              </div>
            </div>
          </label>
        </div>
        </div>
        
      
                      <div>
          {/* propertyApproved */}
      
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>property Approved</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyApproved"
                  value={advancedFilters.propertyApproved || ""}
                  onChange={handleAdvancedFilterChange}
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
                    <BsFillHouseCheckFill />
                  </span>
                  {advancedFilters.propertyApproved || "Select propertyApproved"}
                </button>
      
                {renderDropdown("propertyApproved")}
              </div>
            </div>
          </label>
        </div>
      
          {/* postedBy */}
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>postedBy  </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="postedBy"
                  value={advancedFilters.postedBy || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select postedBy</option>
                  {dataList.postedBy?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("postedBy")}
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
              <FaUserAlt />
                  </span>
                  {advancedFilters.postedBy || "Select postedBy"}
                </button>
      
                {renderDropdown("postedBy")}
              </div>
            </div>
          </label>
        </div>
          {/* facing */}
          <div className="form-group">
      
          <label style={{ width: '100%'}}>
          <label>facing</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="facing"
                  value={advancedFilters.facing || ""}
                  onChange={handleAdvancedFilterChange}
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
               <TbArrowLeftRight />
                  </span>
                  {advancedFilters.facing || "Select facing"}
                </button>
      
                {renderDropdown("facing")}
              </div>
            </div>
          </label>
        </div>
          {/* salesMode */}
      
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>sales Mode</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="salesMode"
                  value={advancedFilters.salesMode || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select salesMode</option>
                  {dataList.salesMode?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("salesMode")}
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
                  <GiGears />
                  </span>
                  {advancedFilters.salesMode || "Select salesMode"}
                </button>
      
                {renderDropdown("salesMode")}
              </div>
            </div>
          </label>
        </div>
          {/* salesType */}
       
        </div>
      
      
     
      
                      <div>
        {/* furnished */}
        <div className="form-group">
          <label style={{width:"100%"}}>
          <label>furnished</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="furnished"
                  value={advancedFilters.furnished || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select furnished</option>
                  {dataList.furnished?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("furnished")}
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
                     <FaHome />
                  </span>
                  {advancedFilters.furnished || "Select furnished"}
                </button>
      
                {renderDropdown("furnished")}
              </div>
            </div>
          </label>
        </div>
          {/*lift */}
          <div className="form-group">
          <label style={{ width: '100%'}}>
            <label>lift</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="lift"
                  value={advancedFilters.lift || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select lift</option>
                  {dataList.lift?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("lift")}
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
                    <MdElevator />
                  </span>
                  {advancedFilters.lift || "Select lift"}
                </button>
      
                {renderDropdown("lift")}
              </div>
            </div>
          </label>
        </div>
      
            {/*attachedBathrooms */}
            <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>attached Bathrooms</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="attachedBathrooms"
                  value={advancedFilters.attachedBathrooms || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select attachedBathrooms</option>
                  {dataList.attachedBathrooms?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("attachedBathrooms")}
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
                   <FaBath />
                  </span>
                  {advancedFilters.attachedBathrooms || "Select attachedBathrooms"}
                </button>
      
                {renderDropdown("attachedBathrooms")}
              </div>
            </div>
          </label>
        </div>

        <div className="form-group">
        <label>Min Attached Bathrooms</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: "1", position: "relative" }}>
            <select
              name="minAttachedBathrooms"
              value={advancedFilters.minAttachedBathrooms || ""}
              onChange={(e) => handleMinAttachedBathroomsSelect(e.target.value)}
              className="form-control"
              style={{ display: "none" }}
            >
              <option value="">Select min attached bathrooms</option>
              {filterOptions(["1", "2", "3", "4", "5"]).map((value, index) => (
                <option key={index} value={value}>
                  {value === "5" ? "5+ Bathrooms" : `${value} Bathroom${value !== "1" ? "s" : ""}`}
                </option>
              ))}
            </select>
            <button
              className="m-0"
              type="button"
              onClick={() => setShowMinAttachedBathroomsOptions(!showMinAttachedBathroomsOptions)}
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
                <FaBath />
              </span>
              {advancedFilters.minAttachedBathrooms || "Select min attached bathrooms"}
            </button>
            {showMinAttachedBathroomsOptions && (
              <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                // backgroundColor: '#fff',
                backgroundColor: '#E9F7F2',
  
                width: '100%',
                // maxWidth: '400px',
                maxWidth: '350px',
  
                padding: '10px',
                zIndex: 10,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                overflowY: 'auto',
                maxHeight: '50vh',
                animation: 'popupOpen 0.3s ease-in-out',
                 scrollbarWidth:"none"
              }}
              >
                <label       style={{
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "10px",
            textAlign: "start",
            color: "#019988",
          }}> Min Attached Bathrooms</label>
                  <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search options"
                  style={{
                    width: '80%',
                    padding: '5px',
    // marginBottom: '10px',
    background:"#C0DFDA",
    border:"none",
    outline:"none"   
                  }}
                />
                    <button
                type="button"
                onClick={closeMinAttachedBathroomsOptions}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              >
                <FaTimes size={18} color="red" />
              </button>
               
             {filterOptions(["1", "2", "3", "4", "5"]).map((value, index) => (
                  <div
                    key={index}
                    style={{ padding: "10px", cursor: "pointer" }}
                    onClick={() => handleMinAttachedBathroomsSelect(value)}
                  >
                    {value === "5" ? "5 Bathrooms" : `${value} Bathroom${value !== "1" ? "s" : ""}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

          {/* western */}
          <div className="form-group">
      
          <label style={{ width: '100%'}}>
          <label  >western</label>
      
            <div style={{ display: "flex", alignItems: "center"}}>
              <div style={{ flex: "1" }}>
                <select
                  name="western"
                  value={advancedFilters.western || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select western</option>
                  {dataList.western?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("western")}
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
                     <FaToilet />
                  </span>
                  {advancedFilters.western || "Select western"}
                </button>
      
                {renderDropdown("western")}
              </div>
            </div>
          </label>
        </div>
        <div className="form-group">

        <label style={{ width: '100%' }}>
        <label>Min Western</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: "1", position: "relative" }}>
            <select
              name="minWestern"
              value={advancedFilters.minWestern || ""}
              onChange={(e) => handleMinWesternSelect(e.target.value)}
              className="form-control"
              style={{ display: "none" }}
            >
              <option value="">Select min western</option>
              {filterOptions(["1", "2", "3", "4", "5"]).map((value, index) => (
                <option key={index} value={value}>
                  {value === "5" ? "5+ Western" : `${value} Western`}
                </option>
              ))}
            </select>
            <button
              className="m-0"
              type="button"
              onClick={() => setShowMinWesternOptions(!showMinWesternOptions)}
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
                <FaBath />
              </span>
              {advancedFilters.minWestern || "Select min western"}
            </button>
            {showMinWesternOptions && (
              <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                // backgroundColor: '#fff',
                backgroundColor: '#E9F7F2',
  
                width: '100%',
                // maxWidth: '400px',
                maxWidth: '350px',
  
                padding: '10px',
                zIndex: 10,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                overflowY: 'auto',
                maxHeight: '50vh',
                animation: 'popupOpen 0.3s ease-in-out',
                scrollbarWidth:"none"
              }}
              >  <label       style={{
                fontWeight: "bold",
                fontSize: "16px",
                marginBottom: "10px",
                textAlign: "start",
                color: "#019988",
              }}> Min Western Bathrooms</label>
                      <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search options"
                  style={{
                    width: '80%',
                    padding: '5px',
    // marginBottom: '10px',
    background:"#C0DFDA",
    border:"none",
    outline:"none"   
                  }}
                />
                    <button
                type="button"
                onClick={closeMinWesternOptions}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              >
                <FaTimes size={18} color="red" />
              </button>
             {filterOptions(["1", "2", "3", "4", "5"]).map((value, index) => (
  <div
    key={index}
    style={{ padding: "10px", cursor: "pointer" }}
    onClick={() => handleMinWesternSelect(value)}
  >
    {value === "5" ? "5 Western" : `${value} Western`}
  </div>
))}

              </div>
            )}
          </div>
        </div>
      </label>
      </div>

          {/* numberOfFloors */}
          <div className="form-group">
      
          <label style={{ width: '100%'}}>
          <label>number Of Floors</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="numberOfFloors"
                  value={advancedFilters.numberOfFloors || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select numberOfFloors</option>
                  {dataList.numberOfFloors?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("numberOfFloors")}
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
                     <BsBuildingsFill />
                  </span>
                  {advancedFilters.numberOfFloors || "Select numberOfFloors"}
                </button>
      
                {renderDropdown("numberOfFloors")}
              </div>
            </div>
          </label>
        </div>
          {/* carParking */}
      
          <div className="form-group">
          <label style={{ width: '100%'}}>
          <label>car Parking</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="carParking"
                  value={advancedFilters.carParking || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select carParking</option>
                  {dataList.carParking?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("carParking")}
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
                    <FaCar />
                  </span>
                  {advancedFilters.carParking || "Select carParking"}
                </button>
      
                {renderDropdown("carParking")}
              </div>
            </div>
          </label>
        </div>
        </div>
      
      
      <div>
     
      
        {/* country */}
      
        <div className="form-group">
        <label>country:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <BiWorld className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="country"
            value={advancedFilters.country}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="country"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
        
        {/* State */}
      
      <div className="form-group">
        <label>State:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <MdLocationCity className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="state"
            value={advancedFilters.state}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="State"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* City */}
      
      <div className="form-group">
        <label>City:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaCity className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="city"
            value={advancedFilters.city}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="City"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
      
        {/* district */}
        <div className="form-group">
        <label>District:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaRegAddressCard className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="district"
            value={advancedFilters.district}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="District"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* area */}
        <div className="form-group">
        <label>Area:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <MdLocationOn className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="area"
            value={advancedFilters.area}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Area"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* streetName */}
        <div className="form-group">
        <label>Street Name:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaRoad className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="streetName"
            value={advancedFilters.streetName}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Street Name"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* doorNumber */}
        <div className="form-group">
        <label>Door Number:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaDoorClosed className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="doorNumber"
            value={advancedFilters.doorNumber}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Door Number"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
      
        {/* Nagar */}
        <div className="form-group">
        <label>Nagar:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaMapPin className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="nagar"
            value={advancedFilters.nagar}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Nagar"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
      
        
    

        {/* Best Time to Call */}
        <div className="form-group" >
          <label style={{width:'100%'}}>
          <label>best Time To Call</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="bestTimeToCall"
                  value={advancedFilters.bestTimeToCall || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select bestTimeToCall</option>
                  {dataList.bestTimeToCall?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("bestTimeToCall")}
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
                    <FaHome />
                  </span>
                  {advancedFilters.bestTimeToCall || "Select bestTimeToCall"}
                </button>
      
                {renderDropdown("bestTimeToCall")}
              </div>
            </div>
          </label>
        </div>

        </div>
        <div className="text-center mt-3 ">
        <button
                  data-bs-dismiss="modal"

          type="button"
          className="btn w-100"
          style={{
            backgroundColor: hoverSearch ? '#58a09b' : '#6EB7B2',
            color: '#fff',
            border: 'none',
          }}
          onMouseEnter={() => setHoverSearch(true)}
          onMouseLeave={() => setHoverSearch(false)}          // onClick={applyAdvancedFilters}
        >
          SEARCH
        </button>
      <button
          type="button"
          className="btn w-100 mt-3"
          style={{
            backgroundColor: hoverAdvance ? '#6EB7B2' : 'transparent',
            color: hoverAdvance ? '#fff' : '#6EB7B2',
            border: `1px solid #6EB7B2`,
          }}
          onMouseEnter={() => setHoverAdvance(true)}
          onMouseLeave={() => setHoverAdvance(false)}          data-bs-toggle="modal"
          data-bs-target="#filterPopup" // Nested modal
          >
          GO TO SIMPLE SEARCH
        </button>
        <button 
        style={{color:"#019988"}}
          type="button"
          className="btn w-100 mt-3"
          data-bs-dismiss="modal"
        >
          HOME
        </button>
        </div>

      </div>

   
    </div>
  </div>
</div>



          <div className="w-100">
            <div style={{ overflowY: 'auto', fontFamily:"Inter, sans-serif" }}>
         {loading ? (
  <div
    className="text-center my-4"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
    }}
  >
    <span className="spinner-border text-primary" role="status" />
    <p className="mt-2">Loading properties...</p>
  </div>
) : mergedData.length === 0 ? (
  <div
    className="text-center my-4"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  >
    <img src={NoData} alt="No data" width={100} />
    <p>No properties found.</p>
  </div>
) : (
  <div className="col-12">
    {mergedData.map((property, index) => {
      if (property.type === 'upload') {
        return (
          <div key={`upload-${property._id}-${index}`} className="col-12 p-0 mb-3">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <img
                                src={`https://ppcpondy.com/PPC/${property.img.replace(/\\/g, '/')}`}

                // src={`${process.env.REACT_APP_IMAGE_URL}/${property.img}`}
                alt="Ad"
 style={{
                    height: "180px",
                    width: '100%',
                    objectFit: 'fill',
                    borderRadius: '15px',
                    boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
                    cursor: 'pointer'
                  }}              />
            </div>
          </div>
        );
      } else {
        return (
          <>
        <div 
                    key={property._id}
                    className="card mb-3 shadow rounded-4"
                    style={{ width: '100%', height: 'auto', background: '#F9F9F9', overflow:'hidden' }}
                    onClick={() => handleCardClick(property.ppcId, phoneNumber)}
                  >
                     <div className="row g-0 align-items-stretch">
         <div className="col-md-4 col-4 d-flex flex-column align-items-center">
      
 <div style={{ position: "relative", width: "100%",height: "100%",  }}>
    {property.isFeatured && (
        <span
          className="m-0 ps-1 pe-2"
          style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            fontSize: "12px",
            background: "linear-gradient(to right,rgba(255, 200, 0, 0.91),rgb(251, 182, 6))",
            color: "black",
            cursor: "pointer",
            borderRadius: "0px 0px 0px 15px",
            zIndex: 2,
          }}
        >
          <MdOutlineStarOutline /> Featured
        </span>
      )}
  

      <img
  src={
    property.photos && property.photos.length > 0
      ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
      : pic
  }
  alt={(
    `${property.ppcId || 'N/A'}-${property.propertyMode || 'N/A'}-${property.propertyType || 'N/A'}-rs-${property.price || '0'}
    -in-${property.city || ''}-${property.area || ''}-${property.state || ''}`
  )
    .replace(/\s+/g, "-")
    .replace(/,+/g, "-")
    .toLowerCase()
  }
  className="img-fluid"
  style={{
    objectFit: "cover",
    objectPosition: "center",
    width: "100%",
    height: "160px",
    borderRadius: "15px",
  }}
/>

  


    <div
      style={{
        position: "absolute",
        bottom: "0px",
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span
        className="d-flex justify-content-center align-items-center"
        style={{
          color: "#fff",
          backgroundImage: `url(${myImage})`,
          backgroundSize: "cover",
          width: "45px",
          height: "20px",
        }}
      >
        <FaCamera className="me-1" size={13}/>  <span style={{fontSize:"11px"}}>{imageCounts[property.ppcId] || 0}</span>
      </span>
      <span
        className="d-flex justify-content-center align-items-center"
        style={{
          color: "#fff",
          backgroundImage: `url(${myImage1})`,
          backgroundSize: "cover",
          width: "45px",
          height: "20px",
        }}
      >
        <FaEye className="me-1" size={15} /> <span style={{fontSize:"11px"}}> {property.views}  </span>
      </span>
    </div>
  </div>
         </div>
         <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px" , background: clickedCards.includes(property.ppcId) ? "#ffffff" : "#F9F9F9",}}>
          <div className="d-flex justify-content-between"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 , fontSize:"13px"}}>{property.propertyMode
  ? property.propertyMode.charAt(0).toUpperCase() + property.propertyMode.slice(1)
  : 'N/A'} 
</p> 
 <p className="m-0 pe-2">{property.locationCoordinates ? <img src={maplocation} alt="" width={15} /> : ""}</p>
          </div>
           <p className="fw-bold m-0 " style={{ color:clickedCards.includes(property.ppcId) ? "#F76F00" : "#000000", fontSize:"15px" }}>{property.propertyType 
  ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) 
  : 'N/A'}
</p>
 <p
  className="m-0"
  style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}
>
  {(() => {
    const locs = [ property.nagar, property.area, property.city, property.district, property.state ]
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (locs.length === 0) {
      // All null/empty — show two N/A
      return <>N/A, N/A</>;
    }

    // Show first 3 valid values, capitalized, separated by commas
    return locs.slice(0, 3).map((val, idx, arr) => (
      <span key={idx}>
                {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}

        {idx < arr.length - 1 ? ", " : ""}
      </span>
    ));
  })()}
</p>
           <div className="card-body ps-2 m-0 pt-0 pe-2 pb-0 d-flex flex-column justify-content-center">
             <div className="row">
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1">
                 <img src={totalarea} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>{property.totalArea || 'N/A'} {property.areaUnit
  ? property.areaUnit.charAt(0).toUpperCase() + property.areaUnit.slice(1)
  : 'N/A'}

                  
                 </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 <img src={bed} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>{property.bedrooms || 'N/A'} BHK</span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 <img src={postedby} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                 {property.ownership
  ? property.ownership.charAt(0).toUpperCase() + property.ownership.slice(1)
  : 'N/A'}
                 </span>
               </div>



                            <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
  <img src={calendar} alt="" width={12} className="me-2" />
  <span style={{ fontSize:'13px', color:'#5E5E5E', fontWeight: 500 }}>
    {
      property.updatedAt && property.updatedAt !== property.createdAt
        ? ` ${new Date(property.updatedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}`
        : ` ${new Date(property.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}`
    }
  </span>
</div>

               <div className="col-12 d-flex flex-col align-items-center mt-1 mb-1 ps-1">
                <h6 className="m-0">
       


<span
  style={{
    fontSize: '15px',
    color: property.price === 'On Demand' ? '#8C3C2F' : '#2F747F', 
    fontWeight: 600,
    letterSpacing: '1px',
  }}
>
  <img src={indianprice} alt="" width={8} className="me-2" />
  {typeof property.price === 'string' && property.price === 'On Demand'
    ? 'On Demand'
    : property.price
      ? formatPrice(property.price)
      : 'N/A'}
</span>



                <span style={{ color:'#2F747F', marginLeft:"5px",fontSize:'11px',}}> 
                {property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}
               </span> 
                  </h6>
               </div>
              </div>
            </div>
          </div>
       </div>

                  </div>
                    

                  </>
        );
      }
    })}
  </div>
)}
            </div>
          </div>

        </Col>
      </Row>

   


    </Container>
  );
};

export default PropertyCards;
 