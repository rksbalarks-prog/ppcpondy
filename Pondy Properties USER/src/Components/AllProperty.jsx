

import React, { useEffect, useState , useRef, useMemo} from "react";
import { Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import SeoHeading from './SeoHeading';
import { baseToPath, getActiveBase } from '../utils/cityBase';
import OptionPopup from './OptionPopup';
import { 
  FaFilter, FaHome, FaCity, FaRupeeSign, FaBed, FaCheck, FaTimes, 
  FaTools, FaIdCard, FaCalendarAlt, FaUserAlt, FaRulerCombined, FaBath, 
   FaCar, FaHandshake, FaToilet, 
  FaCamera,
  FaEye
} from "react-icons/fa";
import { TbArrowLeftRight } from "react-icons/tb";
import { AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { BsBank } from "react-icons/bs";
import "swiper/css/navigation";
import "swiper/css/pagination";
import pic from '../Assets/default.png'; 

import { FaKitchenSet, FaPhone } from "react-icons/fa6";
import myImage from '../Assets/Rectangle 146.png'; 
import myImage1 from '../Assets/Rectangle 145.png'; 
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
import PricingInfoMarquee from "./PricingInfoMarquee";
import BuyerBudgetMarquee from "./BuyerBudgetMarquee";
import BuyerSearchPopup from "./BuyerSearchPopup";


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
       
          scale: 8,
          fillColor: '#007BFF',
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: 'white',
            scaledSize: new window.google.maps.Size(40, 40),  

        },
      });

       const label = new window.google.maps.InfoWindow({
        content: `<div style="font-size: 11px; font-weight: bold; color: blue;"><span style={{color:"grey"}}>PPCID:</span>${property.ppcId}</div>`,
        position: {
          lat: coords.lat + 0.0003,  
          lng: coords.lng,
        },
      });
label.open(map, marker);

    

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
// sessionStorage key for the Search Property popup filters. Keeping it
// session-scoped (not localStorage) so the filter clears when the user
// closes the tab, but survives back-nav from /detail/:ppcId.
const AP_FILTERS_SS_KEY = 'allProperty.searchFilters';
const AP_EMPTY_FILTERS = {
  id: '',
  minPrice: '',
  maxPrice: '',
  propertyMode: '',
  city: '',
  propertyType: '',
};
const readPersistedFilters = () => {
  try {
    const raw = sessionStorage.getItem(AP_FILTERS_SS_KEY);
    if (!raw) return AP_EMPTY_FILTERS;
    const parsed = JSON.parse(raw);
    return { ...AP_EMPTY_FILTERS, ...parsed };
  } catch (_) {
    return AP_EMPTY_FILTERS;
  }
};
const hasAnyFilter = (f) =>
  !!(f && (f.id || f.minPrice || f.maxPrice || f.propertyMode || f.propertyType || f.city));

const AllProperty = ({ freshLogin = false, setActiveContent = null }) => {
  const [properties, setProperties] = useState([]);
   // Hydrate from sessionStorage on first mount so back-nav from /detail
   // restores the user's last search. The same keys are written on search
   // and cleared by the CLEAR button.
   const [filters, setFilters] = useState(() => readPersistedFilters());
  const [hoverSearch, setHoverSearch] = useState(false);
  const [hoverAdvance, setHoverAdvance] = useState(false);
  const [hoverClear, setHoverClear] = useState(false);
  const [hoverSearchBtn, setHoverSearchBtn] = useState(false);
  const [hoverAdvancedSearch, setHoverAdvancedSearch] = useState(false);
  const [hoverHome, setHoverHome] = useState(false);
  const [searchType, setSearchType] = useState('simple');
  const advancedModalBodyRef = useRef(null);
  const [imageCounts, setImageCounts] = useState({});  
  const [loading, setLoading] = useState(true); 
  const [mergedData, setMergedData] = useState([]);
  // Snapshot of the full unfiltered list. Search narrows mergedData; CLEAR
  // restores from this. Kept in sync with the main fetch/merge pipeline.
  const [baseMergedData, setBaseMergedData] = useState([]);
    const [uploads, setUploads] = useState([]);


  const [showMap, setShowMap] = useState(false);
  const [showNoPropertiesModal, setShowNoPropertiesModal] = useState(false);
  const [showPropertyResultModal, setShowPropertyResultModal] = useState(false);
  const [showBuyerAssistancePopup, setShowBuyerAssistancePopup] = useState(false);
  const [showBuyerAssistanceSuccess, setShowBuyerAssistanceSuccess] = useState(false);
  const [searchedProperty, setSearchedProperty] = useState(null);

  const [clickedCar, setClickedCar] = useState([]);
  const location = useLocation();
  
    const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";

      const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
  
  // Role Selection Popup States
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [selectedRole, setSelectedRole] = useState(localStorage.getItem('userRole') || null);
  
  // The search button used to run an 11s cycle that lifted it 50px and swapped
  // the icon for a "Search" label. That lift carried it into the AI assistant
  // button stacked above it, so the button is now static — it keeps the resting
  // appearance (blue, magnifier icon) and never moves. The assistant's vertical
  // offset in assistant/assistant.css is sized against this fixed position.

  // Show role selection popup on successful login
  useEffect(() => {
    // Show popup every time user logs in (fresh login)
    const hasFreshLogin = freshLogin || localStorage.getItem('freshLogin') === 'true';
    
    if (phoneNumber && hasFreshLogin) {
      setShowRolePopup(true);
    }
  }, [phoneNumber, freshLogin]);
  

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "All Property",
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

  // Area search feature states
  const [areaSearchValue, setAreaSearchValue] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [selectedAreaProperties, setSelectedAreaProperties] = useState([]);
  const [areaSearchPerformed, setAreaSearchPerformed] = useState(false);
  const [showNoAreaPropertiesModal, setShowNoAreaPropertiesModal] = useState(false);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  const [nearbyPincodes, setNearbyPincodes] = useState([]);
  const [selectedPincode, setSelectedPincode] = useState('');
  const filtersRef = useRef(null);

  // Filter state variables
  const [selectedPropertyModes, setSelectedPropertyModes] = useState([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState('');
  const [selectedFloors, setSelectedFloors] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showPriceOptions, setShowPriceOptions] = useState(false);
  const [showPropertyTypeOptions, setShowPropertyTypeOptions] = useState(false);
  const [showPropertyModeOptions, setShowPropertyModeOptions] = useState(false);
  const [showBedroomOptions, setShowBedroomOptions] = useState(false);
  const [showFloorOptions, setShowFloorOptions] = useState(false);
  const [showAreaOptions, setShowAreaOptions] = useState(false);

  // Area to Pincode Mapping
  const areaPincodeMap = {
    "Abishegapakkam": "605007",
    "Ariyankuppam": "605007",
    "Arumbarthapuram": "605110",
    "Bahoor": "607402",
    "Bommayarpalayam": "605104",
    "Botanical Garden": "605001",
    "Kalapet": "605014",
    "Courivinatham": "607402",
    "Dhanvantry Nagar": "605006",
    "Embalam": "605106",
    "Irumbai": "605111",
    "Karayamputhur": "605106",
    "Shanmugapuram": "605009",
    "Karikalambakkam": "605007",
    "Kariyamanikam": "605106",
    "Kijour": "605106",
    "Kilpudupattu": "605014",
    "Kilsirivi": "604301",
    "Kirumambakkam": "607402",
    "Korkadu": "605110",
    "Kottakuppam": "605104",
    "Kuilapalayam": "605101",
    "Lawspet": "605008",
    "Maducore": "605105",
    "Manamedu": "607402",
    "Manapeth": "607402",
    "Mandagapet": "605106",
    "Mangalam": "605110",
    "Mannadipattu": "605501",
    "Morattandi": "605101",
    "Mottoupalayam": "605009",
    "Mouroungapakkam": "605004",
    "Moutrepaleam": "605009",
    "Mudaliarpet": "605004",
    "Muthialpet": "605003",
    "Mutrampattu": "605501",
    "Nallavadu": "605007",
    "Nellithoppe": "605005",
    "Nettapakkam": "605106",
    "Odiensalai": "605001",
    "Ozhugarai": "605010",
    "Padmin nagar": "605012",
    "Pakkam": "605106",
    "Pandakkal": "673310",
    "Pillaichavady": "605014",
    "Pillayarkuppam": "607402",
    "Pondicherry": "605001",
    "Pondicherry Bazaar": "605001",
    "Pondicherry Courts": "605001",
    "Pondicherry North": "605001",
    "Pondicherry University": "605014",
    "Pooranankuppam": "605007",
    "Poothurai": "605111",
    "Rayapudupakkam": "605111",
    "Reddiyarpalayam": "605010",
    "Saram(py)": "605013",
    "Sedarapet": "605111",
    "Seliamedu": "607402",
    "Sellipet": "605501",
    "Sri Aurobindo ashram": "605002",
    "Sulthanpet": "605110",
    "Thattanchavadi": "605009",
    "Thengaithittu": "605004",
    "Thimmanaickenpalayam": "605007",
    "Tirukkanur": "605501",
    "Vadhanur": "605501",
    "Veerampattinam": "605007",
    "Venkata Nagar": "605011",
    "Villiyanur": "605110",
    "Vimacoundinpaleam": "605009",
    "Viranam": "605106",
    "Yanam": "533464",
  };

  // Filter options
  const propertyModes = ['Residential', 'Commercial'];
  const propertyTypes = ['House', 'Apartment', 'Villa', 'Farm House', 'Plot', 'Land', 'Hotel', 'Resorts', 'Commercial Building', 'Guest House', 'Godown', 'Industrial Building', 'Shed', 'Agricultural Land', 'Others'];
  const priceRanges = [
    { label: 'Upto 25L', min: 0, max: 2500000 },
    { label: '25L - 50L', min: 2500000, max: 5000000 },
    { label: '50L - 1Cr', min: 5000000, max: 10000000 },
    { label: '1Cr - 2Cr', min: 10000000, max: 20000000 },
    { label: '2Cr - 3Cr', min: 20000000, max: 30000000 },
    { label: '3Cr - 5Cr', min: 30000000, max: 50000000 },
    { label: 'Above 5Cr', min: 50000000, max: Infinity },
  ];
  const bedrooms = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const floors = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const areasList = Object.keys(areaPincodeMap);

   const handleMinBedroomSelect = (value) => {
    setAdvancedFilters(prevState => ({
      ...prevState,
      minBedrooms: value
    }));
    setShowMinBedroomsOptions(false);
  };

   const handleMinAttachedBathroomsSelect = (value) => {
    setAdvancedFilters(prevState => ({
      ...prevState,
      minAttachedBathrooms: value
    }));
    setShowMinAttachedBathroomsOptions(false);
  };

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

       const featuredProperties = featuredRes.data.properties.map((property) => ({
        ...property,
        isFeatured: true,
      }));

      const featuredPpcIds = new Set(featuredProperties.map((p) => p.ppcId));

       const activeProperties = activeRes.data.users
        .filter((property) => !featuredPpcIds.has(property.ppcId))
        .map((property) => ({
          ...property,
          isFeatured: false,
        }));

      const allProperties = [...featuredProperties, ...activeProperties].sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt);
        const bDate = new Date(b.updatedAt || b.createdAt);
        return bDate - aDate;  
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
       
    } finally {
      setLoading(false);  
    }
  };

  // Fetch both
  setLoading(true);
  fetchAllProperties().finally(() => {
    fetchUploadedImages();  
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

     setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }));

  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setFilters({
      id: '',
      propertyMode: '',
      propertyType: '',
      city: '',
      minPrice: '',
      maxPrice: '',
    });
    setAdvancedFilters({});
    setSearchQuery('');
    // Restore the full unfiltered list so the page isn't stuck on a previous
    // search's narrowed view.
    if (baseMergedData.length) setMergedData(baseMergedData);
    // Drop the persisted filter set so future back-nav doesn't re-apply it.
    try { sessionStorage.removeItem(AP_FILTERS_SS_KEY); } catch (_) {}
  };

  const handleAdvancedSearch = () => {
    // Filter mergedData based on advancedFilters
    let filtered = mergedData.filter((property) => {
      // Check phone number
      if (advancedFilters.phoneNumber && property.phoneNumber !== advancedFilters.phoneNumber) {
        return false;
      }
      // Check property mode
      if (advancedFilters.propertyMode && property.propertyMode !== advancedFilters.propertyMode) {
        return false;
      }
      // Check property type
      if (advancedFilters.propertyType && property.propertyType !== advancedFilters.propertyType) {
        return false;
      }
      // Check min price
      if (advancedFilters.minPrice && property.price < advancedFilters.minPrice) {
        return false;
      }
      // Check max price
      if (advancedFilters.maxPrice && property.price > advancedFilters.maxPrice) {
        return false;
      }
      // Check property age
      if (advancedFilters.propertyAge && property.propertyAge !== advancedFilters.propertyAge) {
        return false;
      }
      // Check bank loan
      if (advancedFilters.bankLoan && property.bankLoan !== advancedFilters.bankLoan) {
        return false;
      }
      // Check negotiation
      if (advancedFilters.negotiation && property.negotiation !== advancedFilters.negotiation) {
        return false;
      }
      // Check length
      if (advancedFilters.length && property.length !== advancedFilters.length) {
        return false;
      }
      // Check breadth
      if (advancedFilters.breadth && property.breadth !== advancedFilters.breadth) {
        return false;
      }
      // Check total area
      if (advancedFilters.totalArea && property.totalArea !== advancedFilters.totalArea) {
        return false;
      }
      // Check min total area
      if (advancedFilters.minTotalArea && property.totalArea < advancedFilters.minTotalArea) {
        return false;
      }
      // Check area unit
      if (advancedFilters.areaUnit && property.areaUnit !== advancedFilters.areaUnit) {
        return false;
      }
      // Check ownership
      if (advancedFilters.ownership && property.ownership !== advancedFilters.ownership) {
        return false;
      }
      // Check bedrooms
      if (advancedFilters.bedrooms && property.bedrooms !== advancedFilters.bedrooms) {
        return false;
      }
      // Check min bedrooms
      if (advancedFilters.minBedrooms) {
        const minBeds = Number(advancedFilters.minBedrooms);
        if (minBeds === 5 && property.bedrooms < 5) return false;
        if (minBeds === 6 && property.bedrooms < 6) return false;
        if (minBeds === 10 && property.bedrooms < 10) return false;
        if (minBeds < 5 && property.bedrooms !== minBeds) return false;
      }
      // Check bathrooms
      if (advancedFilters.bathrooms && property.bathrooms !== advancedFilters.bathrooms) {
        return false;
      }
      // Check min attached bathrooms
      if (advancedFilters.minAttachedBathrooms) {
        const minBaths = Number(advancedFilters.minAttachedBathrooms);
        if (minBaths === 5 && property.attachedBathrooms < 5) return false;
        if (minBaths < 5 && property.attachedBathrooms !== minBaths) return false;
      }
      // Check balconies
      if (advancedFilters.balconies && property.balconies !== advancedFilters.balconies) {
        return false;
      }
      // Check floor no
      if (advancedFilters.floorNo && property.floorNo !== advancedFilters.floorNo) {
        return false;
      }
      // Check property approved
      if (advancedFilters.propertyApproved && property.propertyApproved !== advancedFilters.propertyApproved) {
        return false;
      }
      // Check posted by
      if (advancedFilters.postedBy && property.postedBy !== advancedFilters.postedBy) {
        return false;
      }
      // Check facing
      if (advancedFilters.facing && property.facing !== advancedFilters.facing) {
        return false;
      }
      // Check sales mode
      if (advancedFilters.salesMode && property.salesMode !== advancedFilters.salesMode) {
        return false;
      }
      // Check furnished
      if (advancedFilters.furnished && property.furnished !== advancedFilters.furnished) {
        return false;
      }
      // Check lift
      if (advancedFilters.lift && property.lift !== advancedFilters.lift) {
        return false;
      }
      // Check attached bathrooms
      if (advancedFilters.attachedBathrooms && property.attachedBathrooms !== advancedFilters.attachedBathrooms) {
        return false;
      }
      // Check western
      if (advancedFilters.western && property.western !== advancedFilters.western) {
        return false;
      }
      // Check min western
      if (advancedFilters.minWestern) {
        const minWest = Number(advancedFilters.minWestern);
        if (minWest === 5 && property.western < 5) return false;
        if (minWest < 5 && property.western !== minWest) return false;
      }
      // Check number of floors
      if (advancedFilters.numberOfFloors && property.numberOfFloors !== advancedFilters.numberOfFloors) {
        return false;
      }
      // Check car parking
      if (advancedFilters.carParking && property.carParking !== advancedFilters.carParking) {
        return false;
      }
      // Check country
      if (advancedFilters.country && !property.country?.includes(advancedFilters.country)) {
        return false;
      }
      // Check state
      if (advancedFilters.state && !property.state?.includes(advancedFilters.state)) {
        return false;
      }
      // Check city
      if (advancedFilters.city && property.city !== advancedFilters.city) {
        return false;
      }
      // Check district
      if (advancedFilters.district && !property.district?.includes(advancedFilters.district)) {
        return false;
      }
      // Check area
      if (advancedFilters.area && !property.area?.includes(advancedFilters.area)) {
        return false;
      }
      // Check street name
      if (advancedFilters.streetName && !property.streetName?.includes(advancedFilters.streetName)) {
        return false;
      }
      // Check door number
      if (advancedFilters.doorNumber && property.doorNumber !== advancedFilters.doorNumber) {
        return false;
      }
      // Check nagar
      if (advancedFilters.nagar && !property.nagar?.includes(advancedFilters.nagar)) {
        return false;
      }
      // Check best time to call
      if (advancedFilters.bestTimeToCall && property.bestTimeToCall !== advancedFilters.bestTimeToCall) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      setShowNoPropertiesModal(true);
      setSearchType('advanced');
    } else {
      // Store filtered results and close modal to display them
      setMergedData(filtered);
      const modal = document.getElementById('advancedFilterPopup');
      if (modal) {
        const bootstrapModal = window.bootstrap?.Modal?.getInstance(modal);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
      }
    }
  };

  const handleSearchById = () => {
    // Always filter from the full unfiltered list so consecutive searches
    // work — without this, each search narrows the previous result.
    const source = baseMergedData.length ? baseMergedData : mergedData;
    const norm = (v) => String(v ?? "").trim().toLowerCase();
    const minP = filters.minPrice !== "" ? Number(filters.minPrice) : null;
    const maxP = filters.maxPrice !== "" ? Number(filters.maxPrice) : null;

    const filtered = source.filter((property) => {
      // ID — partial / case-insensitive match against ppcId so "32" matches
      // 320, 3204, etc.
      if (filters.id) {
        const searchId = String(filters.id).trim().toLowerCase();
        if (!String(property.ppcId ?? "").toLowerCase().includes(searchId)) {
          return false;
        }
      }
      // Property mode / type / city — case-insensitive comparison so the
      // dropdown value ("House") matches stored values ("house", "HOUSE").
      if (filters.propertyMode && norm(property.propertyMode) !== norm(filters.propertyMode)) {
        return false;
      }
      if (filters.propertyType && norm(property.propertyType) !== norm(filters.propertyType)) {
        return false;
      }
      if (filters.city && !norm(property.city).includes(norm(filters.city))) {
        return false;
      }
      // Price range — cast both sides to numbers so a string filter
      // doesn't trigger lexical "10" < "9" surprises.
      const price = Number(property.price);
      if (minP !== null && Number.isFinite(minP)) {
        if (!Number.isFinite(price) || price < minP) return false;
      }
      if (maxP !== null && Number.isFinite(maxP)) {
        if (!Number.isFinite(price) || price > maxP) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      setShowNoPropertiesModal(true);
      setSearchType('simple');
    } else {
      setMergedData(filtered);
    }

    // Persist the filter set so back-nav from a detail page restores it.
    // Saved unconditionally — even an empty-result search is a legitimate
    // filter the user might want to refine instead of starting over.
    try {
      sessionStorage.setItem(AP_FILTERS_SS_KEY, JSON.stringify(filters));
    } catch (_) {}

    // Always close the Search Property popup after a search runs so the
    // result list is actually visible. Three fallbacks because window.bootstrap
    // isn't exposed in this build (the previous Modal-API attempt silently
    // failed): try Bootstrap's Modal API → click the modal's own dismiss
    // button → tear the modal down manually.
    closeFilterPopup();
  };

  const closeFilterPopup = () => {
    const modal = document.getElementById('filterPopup');
    if (!modal) return;

    // 1) Bootstrap Modal API (if the global is loaded).
    try {
      if (window.bootstrap && window.bootstrap.Modal) {
        const inst =
          window.bootstrap.Modal.getInstance(modal) ||
          window.bootstrap.Modal.getOrCreateInstance(modal);
        if (inst) {
          inst.hide();
          return;
        }
      }
    } catch (_) {}

    // 2) Click the modal's own [data-bs-dismiss="modal"] — Bootstrap's own
    //    event-delegation handles the hide + backdrop cleanup.
    const dismissBtn = modal.querySelector('[data-bs-dismiss="modal"]');
    if (dismissBtn) {
      dismissBtn.click();
      return;
    }

    // 3) Manual teardown — strip the classes/styles Bootstrap would have
    //    cleaned up and remove the backdrop element.
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document
      .querySelectorAll('.modal-backdrop')
      .forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
  };

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
       setAdvancedFilters((prevState) => ({
        ...prevState,
        [field]: option,
      }));
      
       setFilters((prevState) => ({
        ...prevState,
        [field]: option,
      }));
      
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
  const stored = JSON.parse(localStorage.getItem('clickedCar')) || [];
  setClickedCar(stored);
}, []);

// Function to generate nearby pincodes
const getNearbyPincodes = (currentPincode) => {
  // Extract numeric part from pincode
  const numericPincode = parseInt(currentPincode);
  if (isNaN(numericPincode)) return [];

  const nearby = [];
  // Generate pincodes ±1, ±2, ±3
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue; // Skip current pincode
    nearby.push((numericPincode + i).toString().padStart(6, '0'));
  }

  // Map nearby pincodes to areas and count properties
  return nearby.map((pincode) => {
    const areasForPincode = Object.entries(areaPincodeMap)
      .filter(([_, pin]) => pin === pincode)
      .map(([area, _]) => area);

    // Count properties for this pincode
    const count = mergedData.filter((property) => {
      if (property.type === 'upload') return false;
      return areasForPincode.some((area) =>
        (property.area?.toLowerCase() || '').includes(area.toLowerCase()) ||
        (property.city?.toLowerCase() || '').includes(area.toLowerCase())
      );
    }).length;

    return {
      pincode,
      areas: areasForPincode,
      count,
    };
  }).filter((item) => item.count > 0);
};

// Area Search Handlers
const handleAreaInputChange = (value) => {
  setAreaSearchValue(value);
  
  if (value.trim() === '') {
    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
  } else {
    const trimmedValue = value.toLowerCase();
    const isNumericInput = /^\d+$/.test(trimmedValue);
    
    let filtered = [];
    
    if (isNumericInput) {
      // Search by pincode
      filtered = Object.entries(areaPincodeMap)
        .filter(([_, pincode]) => pincode.includes(trimmedValue))
        .map(([area, pincode]) => `${area} (${pincode})`);
    } else {
      // Search by area name
      filtered = Object.keys(areaPincodeMap)
        .filter((area) => area.toLowerCase().includes(trimmedValue))
        .map((area) => `${area} (${areaPincodeMap[area]})`);
    }
    
    setAreaSuggestions(filtered);
    setShowAreaSuggestions(filtered.length > 0);
  }
};

const handleAreaSelect = (suggestion) => {
  // Extract area name from suggestion (format: "Area Name (pincode)")
  const match = suggestion.match(/^(.+)\s\(([^)]+)\)$/);
  const areaName = match ? match[1] : suggestion;
  const pincode = match ? match[2] : '';
  
  setAreaSearchValue(areaName);
  setSelectedAreaName(areaName);
  setShowAreaSuggestions(false);
  handleAreaSearch(areaName);
};

const handleAreaSearch = (areaName) => {
  if (!areaName) return;

  // set the currently searched area name
  setSelectedAreaName(areaName);

  const filteredByArea = mergedData.filter((property) => {
    if (property.type === 'upload') return false;
    
    const propertyArea = property.area?.toLowerCase() || '';
    const propertyCity = property.city?.toLowerCase() || '';
    const searchArea = areaName.toLowerCase();

    return propertyArea.includes(searchArea) || propertyCity.includes(searchArea);
  });

  setSelectedAreaProperties(filteredByArea);
  setAreaSearchPerformed(true);

  // reset filter selections when a new area search occurs
  setSelectedPropertyModes([]);
  setSelectedPropertyTypes([]);
  setSelectedPriceRange('');
  setSelectedBedrooms('');
  setSelectedFloors('');
  setSelectedAreas([]);
  setFiltersApplied(false);

  // Get the pincode for selected area
  const selectedPincode = areaPincodeMap[areaName];
  if (selectedPincode) {
    setSelectedPincode(selectedPincode);
    const nearby = getNearbyPincodes(selectedPincode);
    setNearbyPincodes(nearby);
  }

  if (filteredByArea.length === 0) {
    setShowNoAreaPropertiesModal(true);
  }
};

const handleSearchAgain = () => {
  setAreaSearchValue('');
  setSelectedAreaProperties([]);
  setAreaSearchPerformed(false);
  setShowNoAreaPropertiesModal(false);
  setSelectedAreaName('');
  setAreaSuggestions([]);
  setNearbyPincodes([]);
  setSelectedPincode('');
  // Reset all filters as well
  setSelectedPropertyModes([]);
  setSelectedPropertyTypes([]);
  setSelectedPriceRange('');
  setSelectedBedrooms('');
  setSelectedFloors('');
  setSelectedAreas([]);
  setFiltersApplied(false);
};

const handleHomeClick = () => {
  handleSearchAgain();
  // Return to the city base the user entered from (/pondicherry or /chennai),
  // not the generic '/' landing.
  navigate(baseToPath(getActiveBase()));
};

const handleNearbyPincodeClick = (nearbyPincode, areas) => {
  // Filter properties by the nearby pincode's areas
  const filteredByNearby = mergedData.filter((property) => {
    if (property.type === 'upload') return false;
    return areas.some((area) =>
      (property.area?.toLowerCase() || '').includes(area.toLowerCase()) ||
      (property.city?.toLowerCase() || '').includes(area.toLowerCase())
    );
  });

  setSelectedAreaProperties(filteredByNearby);
  setSelectedAreaName(areas.join(', '));
  setSelectedPincode(nearbyPincode);
  setAreaSearchPerformed(true);
  setAreaSearchValue('');
  setShowAreaSuggestions(false);
  setAreaSuggestions([]);
  // clear filters when switching to nearby pincode
  setSelectedPropertyModes([]);
  setSelectedPropertyTypes([]);
  setSelectedPriceRange('');
  setSelectedBedrooms('');
  setSelectedFloors('');
  setSelectedAreas([]);
  setFiltersApplied(false);

  if (filteredByNearby.length === 0) {
    setShowNoAreaPropertiesModal(true);
  }
};

  // Filter handlers
  const handlePropertyModeSelect = (values) => {
    setSelectedPropertyModes(values);
    setShowPropertyModeOptions(false);
    
    // Cascade to Property Type popup if Residential is selected
    if (values.includes('Residential')) {
      setTimeout(() => {
        setShowPropertyTypeOptions(true);
      }, 100);
    }
  };

  const handlePropertyTypeSelect = (values) => {
    setSelectedPropertyTypes(values);
    setShowPropertyTypeOptions(false);
    
    // Cascade to Price Range if property types selected
    if (values.length > 0) {
      setTimeout(() => {
        setShowPriceOptions(true);
      }, 100);
    }
  };

  const handlePriceRangeSelect = (range) => {
    setSelectedPriceRange(range.label);
    setShowPriceOptions(false);
    
    // Cascade to Bedroom selection
    setTimeout(() => {
      setShowBedroomOptions(true);
    }, 100);
  };

  const handleBedroomSelect = (value) => {
    const bhkNumber = value.split(' ')[0];
    setSelectedBedrooms(bhkNumber);
    setShowBedroomOptions(false);
    
    // Cascade to Floor selection
    setTimeout(() => {
      setShowFloorOptions(true);
    }, 100);
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloors(floor);
    setShowFloorOptions(false);
  };

  const handleSearchFilters = () => {
    // Show buyer assistance confirmation popup
    setShowBuyerAssistancePopup(true);
  };

  const handleBuyerAssistanceYes = async () => {
    setShowBuyerAssistancePopup(false);
    
    try {
      // Get min and max price from selected price range
      let minPrice = '';
      let maxPrice = '';
      if (selectedPriceRange) {
        const priceRange = priceRanges.find(r => r.label === selectedPriceRange);
        if (priceRange) {
          minPrice = priceRange.min;
          maxPrice = priceRange.max === Infinity ? '' : priceRange.max;
        }
      }
      
      // Prepare filter data
      const filterData = {
        propertyMode: selectedPropertyModes.length > 0 ? selectedPropertyModes[0] : 'N/A',
        propertyType: selectedPropertyTypes.length > 0 ? selectedPropertyTypes[0] : 'N/A',
        minPrice: minPrice || 'N/A',
        maxPrice: maxPrice || 'N/A',
        BHK: selectedBedrooms || 'N/A',
        floorNo: selectedFloors || 'N/A',
        area: selectedAreaName || 'N/A',
        phoneNumber: phoneNumber || 'N/A',
        baName: 'N/A',
        state: 'N/A',
        pinCode: 'N/A',
      };
      
      // Create buyer assistance directly via API
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/add-buyerAssistance`,
        filterData
      );
      
      if (response.data?.data) {
        // Show success popup
        setShowBuyerAssistanceSuccess(true);
      }
    } catch (error) {
      console.error('Error creating buyer assistance:', error);
      alert('Error creating buyer assistance. Please try again.');
    }
  };

  const handleBuyerAssistanceNo = () => {
    setShowBuyerAssistancePopup(false);
    // Apply filters and show properties
    applyFilters();
  };

  const handleBuyerAssistanceSuccessOK = () => {
    setShowBuyerAssistanceSuccess(false);
    // Apply filters and show the filtered properties
    applyFilters();
  };

  const getOrdinalFloor = (floor) => {
    if (floor === '1') return '1st';
    if (floor === '2') return '2nd';
    if (floor === '3') return '3rd';
    return floor + 'th';
  };

  // Role Selection Handlers
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    localStorage.setItem('userRole', role);
    localStorage.removeItem('freshLogin');
    setShowRolePopup(false);

    // Show appropriate content based on selected role - staying in same frame
    if (role === 'Seller') {
      // Show add property form for sellers within the same mobile frame
      if (setActiveContent) {
        setActiveContent('bottomAddSeller');
      } else {
        navigate('/add-form');
      }
    } else if (role === 'Buyer') {
      // Show buyer assistance for buyers within the same mobile frame
      if (setActiveContent) {
        setActiveContent('bottomBuyerAssistance');
      } else {
        const phoneNum = phoneNumber.replace(/\+/g, '') || storedPhoneNumber.replace(/\+/g, '');
        navigate(`/buyer-assistance/${phoneNum}`);
      }
    } else if (role === 'Visitor') {
      // Visitor stays on properties page
      if (setActiveContent) {
        setActiveContent('bottomHome');
      }
      setShowRolePopup(false);
    }
  };

  const handleRolePopupClose = () => {
    // Can close without selecting, stays on properties page
    localStorage.removeItem('freshLogin');
    setShowRolePopup(false);
    
    // Keep showing AllProperty page if setActiveContent callback is available
    if (setActiveContent) {
      setActiveContent('bottomHome');
    }
  };

  const handlePropertyModeChange = (mode) => {
    setSelectedPropertyModes(
      selectedPropertyModes.includes(mode)
        ? selectedPropertyModes.filter((m) => m !== mode)
        : [...selectedPropertyModes, mode]
    );
  };

  const handlePropertyTypeChange = (type) => {
    setSelectedPropertyTypes(
      selectedPropertyTypes.includes(type)
        ? selectedPropertyTypes.filter((t) => t !== type)
        : [...selectedPropertyTypes, type]
    );
  };

  const handleAreaChange = (area) => {
    setSelectedAreas(
      selectedAreas.includes(area)
        ? selectedAreas.filter((a) => a !== area)
        : [...selectedAreas, area]
    );
  };

  const applyFilters = () => {
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setSelectedPropertyModes([]);
    setSelectedPropertyTypes([]);
    setSelectedPriceRange('');
    setSelectedBedrooms('');
    setSelectedFloors('');
    setSelectedAreas([]);
    setFiltersApplied(false);
    // Also reset area search
    setAreaSearchValue('');
    setSelectedAreaProperties([]);
    setAreaSearchPerformed(false);
    setSelectedAreaName('');
    setAreaSuggestions([]);
    setNearbyPincodes([]);
    setSelectedPincode('');
  };

  const getFilteredProperties = () => {
    let filtered = areaSearchPerformed ? selectedAreaProperties : mergedData;

    // Filter by property mode
    if (selectedPropertyModes.length > 0) {
      filtered = filtered.filter((property) =>
        selectedPropertyModes.includes(property.propertyMode)
      );
    }

    // Filter by property type
    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter((property) =>
        selectedPropertyTypes.includes(property.propertyType)
      );
    }

    // Filter by price range
    if (selectedPriceRange) {
      const range = priceRanges.find((r) => r.label === selectedPriceRange);
      if (range) {
        filtered = filtered.filter((property) => {
          const price = property.price;
          return typeof price === 'number' && price >= range.min && price <= range.max;
        });
      }
    }

    // Filter by bedrooms
    if (selectedBedrooms) {
      filtered = filtered.filter((property) =>
        property.bedrooms === parseInt(selectedBedrooms)
      );
    }

    // Filter by floors
    if (selectedFloors) {
      filtered = filtered.filter((property) =>
        property.floor === parseInt(selectedFloors)
      );
    }

    // Filter by areas
    if (selectedAreas.length > 0) {
      filtered = filtered.filter((property) =>
        selectedAreas.some((area) =>
          (property.area?.toLowerCase() || '').includes(area.toLowerCase())
        )
      );
    }

    return filtered;
  };

  // Send property visit notification to user via WhatsApp
  const sendUserPropertyNotification = async (userPhone, property) => {
    try {
      // Format phone number for WhatsApp (remove non-digits and ensure country code)
      const mobileNumber = String(userPhone).replace(/\D/g, ""); // Remove all non-numeric characters
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi There 👋

✅ Your currently visit the property!

🆔 Rent ID: ${property.ppcId}
📍 Location: ${property.location || 'N/A'}
👨‍💼 Owner: ${property.ownerName || 'Owner'}
📱 Phone: ${property.phoneNumber || 'N/A'}

❤️ We'll notify the owner about your action

Thank you for using Pondy Property🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ User property visit notification sent to", whatsappNumber);
        return true;
      }
    } catch (whatsAppError) {
      console.log("⚠️ User notification delivery failed (non-blocking):", whatsAppError.message);
      return false;
    }
  };

  // Send property visited notification to owner via WhatsApp
  const sendOwnerPropertyNotification = async (ownerPhone, userPhone, property) => {
    try {
      // Format phone number for WhatsApp (remove non-digits and ensure country code)
      const mobileNumber = String(ownerPhone).replace(/\D/g, ""); // Remove all non-numeric characters
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi There 👋

✅ Your property has been viewed by ${userPhone}

🏠 Property: ${property.propertyName || 'Farm House'} (Rent ID: ${property.ppcId})
📍 Location: ${property.location || 'N/A'}
👨‍💼 Owner: ${property.ownerName || 'Owner'}

Thank you for using Pondy property 🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ Owner property visit notification sent to", whatsappNumber);
        return true;
      }
    } catch (whatsAppError) {
      console.log("⚠️ Owner notification delivery failed (non-blocking):", whatsAppError.message);
      return false;
    }
  };

  // Force-close the Search / Advanced Search popups and clear any leftover
  // Bootstrap modal artefacts (backdrop, body classes) so nothing lingers
  // on top of the page we navigate to.
  const closeSearchPopups = () => {
    ['filterPopup', 'advancedFilterPopup'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const inst =
        window.bootstrap?.Modal?.getInstance?.(el) ||
        window.bootstrap?.Modal?.getOrCreateInstance?.(el);
      if (inst) {
        inst.hide();
      } else {
        el.classList.remove('show');
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document
      .querySelectorAll('.modal-backdrop')
      .forEach((backdrop) => backdrop.remove());
  };

  const handleCardClick = async (ppcId, phoneNumber) => {
    // Hide the Search Property popup before opening the detail page.
    closeSearchPopups();

    const stored = JSON.parse(localStorage.getItem('clickedCar')) || [];
    if (!stored.includes(ppcId)) {
      stored.push(ppcId);
      localStorage.setItem('clickedCar', JSON.stringify(stored));
    }

    // Find the property details
    const property = filteredProperties.find(p => p.ppcId === ppcId);
    
    // Send notifications to both user and owner (non-blocking)
    if (property) {
      // Send user notification
      if (phoneNumber) {
        await sendUserPropertyNotification(phoneNumber, property);
      }
      
      // Send owner notification
      if (property.phoneNumber) {
        await sendOwnerPropertyNotification(property.phoneNumber, phoneNumber, property);
      }
    }

    navigate(`/detail/${ppcId}`, { state: { phoneNumber, properties: filteredProperties } });
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

   if (uploadIndex < totalUploads.length) {
    merged.push(...totalUploads.slice(uploadIndex));
  }

   if (filteredProperties.length === 0) {
    merged.push(...totalUploads);
  }

   setMergedData(prev => {
    const isSame = JSON.stringify(prev) === JSON.stringify(merged);
    return isSame ? prev : merged;
  });
   setBaseMergedData(prev => {
    const isSame = JSON.stringify(prev) === JSON.stringify(merged);
    return isSame ? prev : merged;
  });

}, [filteredProperties, totalUploads]);

  // Re-apply persisted Search Property filters once the unfiltered list
  // (baseMergedData) finishes loading. Runs at most once per mount so a
  // later refresh of baseMergedData (e.g. realtime updates) doesn't undo
  // the user's CLEAR action. If no filters were saved, this is a no-op.
  const apReapplyDoneRef = useRef(false);
  useEffect(() => {
    if (apReapplyDoneRef.current) return;
    if (!baseMergedData.length) return;
    if (!hasAnyFilter(filters)) return;
    apReapplyDoneRef.current = true;
    handleSearchById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMergedData]);

  useEffect(() => {
    // Scroll to filters section when area search is performed
    if (areaSearchPerformed && filtersRef.current) {
      setTimeout(() => {
        filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [areaSearchPerformed]);

    return (
    <Container fluid className="p-0 w-100 d-flex align-items-center justify-content-center ">
      {/* Title/description/canonical for this route come from RouteSeo (see
          utils/seoRoutes.js). This supplies the page's one crawlable <h1>. */}
      <SeoHeading>
        All Properties for Sale in Pondicherry and Chennai
      </SeoHeading>

      {/* Role Selection Popup */}
      {showRolePopup && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px 30px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <style>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>

            {/* Close Button */}
            <button
              onClick={handleRolePopupClose}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ✕
            </button>

            {/* Popup Title */}
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px',
              }}
            >
              Select Your Role
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '30px',
              }}
            >
              Choose how you'd like to use Pondy Property
            </p>

            {/* Role Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Buyer Button */}
              <button
                onClick={() => handleRoleSelect('Buyer')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#007BFF',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0056b3';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#007BFF';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                }}
              >
                🏠 Buyer
              </button>

              {/* Seller Button */}
              <button
                onClick={() => handleRoleSelect('Seller')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1e7e34';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#28a745';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                }}
              >
                🏘️ Seller
              </button>

              {/* Visitor Button */}
              <button
                onClick={() => handleRoleSelect('Visitor')}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#545b62';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(108, 117, 125, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6c757d';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
                }}
              >
                👤 Visitor
              </button>
            </div>
          </div>
        </div>
      )}

      <Row className="g-3 w-100 ">
        <Col lg={12} className="d-flex align-items-center justify-content-center pt-2 m-0">
        
      <div
  className="d-flex flex-column justify-content-center align-items-center"
  data-bs-toggle="modal"
  data-bs-target="#propertyModal"
  style={{
    height: '50px',
    width: '50px',
    background: '#0066FF',
    borderRadius: '50%',
    position: 'fixed',
    right: 'calc(50% - 187.5px + 10px)',
    bottom: '15%',
    zIndex: '1',
    cursor: 'pointer',
    border: '4px solid white',
    boxShadow: '0 0 30px rgba(0, 102, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.2)',
  }}
>
  <BiSearchAlt fontSize={32} color="#fff" />
</div>

{/* Modal */}
<div
  className="modal fade"
  id="propertyModal"
  tabIndex="-1"
  data-bs-backdrop="false"
  data-bs-keyboard="false"
  style={{  backgroundColor: 'rgba(64, 64, 64, 0.9)', 
    backdropFilter: 'blur(1px)',  
}}
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content rounded-5 shadow" 
     style={{
      width: "350px",
      margin: "0 auto", 
     
    }}    >
      <div className="modal-body py-4">
        <div className="d-grid gap-2 mb-2">
           <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
            className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
            data-bs-toggle="modal"
            data-bs-target="#filterPopup"  
          >
            <FaHome className="me-2" /> Search Property
          </button>

          {/* Buyer Search — opens BuyerSearchPopup modal */}
          <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
          className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
            data-bs-toggle="modal"
            data-bs-target="#buyerSearchPopup"
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

           <button style={{background:"#DFDFDF" , color:"#5E5E5E" , fontWeight:600 , fontSize:"15px"}}
          className="btn btn-light border rounded-2 py-2 d-flex align-items-center justify-content-start ps-3 mb-3"
      onClick={() => navigate(`/Property-Assistance-Search/${phoneNumber}`)}
      >
            <FaHeadset className="me-2" /> Property Assistance
          </button>
        </div>

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

 {/* Buyer Search modal — opened by Buyer Search button above */}
 <BuyerSearchPopup />

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
                  style={{ display: "none" }} 
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

         <div className="text-center mt-3 ">
        {/* Clear and Search Buttons Row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            type="button"
            className="btn flex-grow-1"
            style={{
              backgroundColor: hoverClear ? '#dc3545' : '#6EB7B2',
              color: '#fff',
              border: 'none',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={() => setHoverClear(true)}
            onMouseLeave={() => setHoverClear(false)}
            onClick={handleClearSearch}
          >
            CLEAR
          </button>

          <button
            type="button"
            className="btn flex-grow-1"
            style={{
              backgroundColor: hoverSearchBtn ? '#28a745' : '#6EB7B2',
              color: '#fff',
              border: 'none',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={() => setHoverSearchBtn(true)}
            onMouseLeave={() => setHoverSearchBtn(false)}
            onClick={handleSearchById}
          >
            SEARCH
          </button>
        </div>

        {/* Advanced Search Button */}
        <button
          type="button"
          className="btn w-100 mt-3"
          style={{
            backgroundColor: hoverAdvancedSearch ? '#6EB7B2' : 'transparent',
            color: hoverAdvancedSearch ? '#fff' : '#6EB7B2',
            border: `1px solid #6EB7B2`,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          onMouseEnter={() => setHoverAdvancedSearch(true)}
          onMouseLeave={() => setHoverAdvancedSearch(false)}
          data-bs-toggle="modal"
          data-bs-target="#advancedFilterPopup"
        >
          GO TO ADVANCED SEARCH
        </button>

        {/* Home Button */}
        <button
          type="button"
          className="btn w-100 mt-3"
          style={{
            backgroundColor: hoverHome ? '#6EB7B2' : 'transparent',
            color: hoverHome ? '#fff' : '#6EB7B2',
            border: `1px solid #6EB7B2`,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
          onMouseEnter={() => setHoverHome(true)}
          onMouseLeave={() => setHoverHome(false)}
          data-bs-dismiss="modal"
        >
          SET HOME
        </button>
        </div>
      </div>
    </div>
  </div>
</div>

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
      <div className="modal-body" ref={advancedModalBodyRef}>
     
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
        
        </div>
      
      
     
      
                      <div>
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
                  style={{ display: "none" }} 
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
        {/* Clear and Search Buttons Row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            type="button"
            className="btn flex-grow-1"
            style={{
              backgroundColor: hoverClear ? '#dc3545' : '#6EB7B2',
              color: '#fff',
              border: 'none',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={() => setHoverClear(true)}
            onMouseLeave={() => setHoverClear(false)}
            onClick={() => {
              setAdvancedFilters({});
              setSearchQuery('');
              // Scroll to top of advanced modal
              if (advancedModalBodyRef.current) {
                advancedModalBodyRef.current.scrollTop = 0;
              }
            }}
          >
            CLEAR
          </button>

          <button
            type="button"
            className="btn flex-grow-1"
            style={{
              backgroundColor: hoverSearchBtn ? '#28a745' : '#6EB7B2',
              color: '#fff',
              border: 'none',
              transition: 'background-color 0.3s ease',
            }}
            onMouseEnter={() => setHoverSearchBtn(true)}
            onMouseLeave={() => setHoverSearchBtn(false)}
            onClick={handleAdvancedSearch}
          >
            SEARCH
          </button>
        </div>

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
          data-bs-target="#filterPopup"  
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
              {/* Area Search Bar — type an area name or pincode to filter properties */}
              <div style={{ position: 'relative', padding: '0 14px 2px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #B7DCDE',
                  background: 'linear-gradient(180deg,#F6FBFB 0%,#EAF5F5 100%)',
                  borderRadius: '999px',
                  padding: '2px 6px 2px 12px',
                  boxShadow: '0 2px 6px rgba(47,116,127,0.08)',
                }}>
                  <BiSearchAlt style={{ color: '#2F747F', fontSize: 15, marginRight: 6, flexShrink: 0 }} />
                  <input
                    type="text"
                    value={areaSearchValue}
                    onChange={(e) => handleAreaInputChange(e.target.value)}
                    placeholder="Search area or pincode"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '5px 2px',
                      fontSize: 12.5,
                      background: 'transparent',
                      color: '#1f3a3f',
                    }}
                  />
                  {areaSearchValue ? (
                    <button
                      type="button"
                      onClick={handleSearchAgain}
                      style={{
                        background: '#2F747F',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        flexShrink: 0,
                      }}
                      aria-label="Clear area search"
                    >
                      <FaTimes />
                    </button>
                  ) : null}
                </div>

                {showAreaSuggestions && areaSuggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute',
                    top: 'calc(100% - 2px)',
                    left: 14,
                    right: 14,
                    background: '#fff',
                    border: '1px solid #B7DCDE',
                    borderRadius: '14px',
                    margin: '4px 0 0',
                    padding: '4px 0',
                    listStyle: 'none',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 6px 18px rgba(47,116,127,0.12)',
                  }}>
                    {areaSuggestions.map((suggestion) => (
                      <li
                        key={suggestion}
                        onClick={() => handleAreaSelect(suggestion)}
                        style={{
                          padding: '6px 14px',
                          cursor: 'pointer',
                          fontSize: 12.5,
                          color: '#1f3a3f',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#EAF5F5')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Running pricing-info ticker — counts mirror the admin Pricing Info page */}
              <PricingInfoMarquee />
              {/* Running strip of Buyer Budget by Price boxes */}
              <BuyerBudgetMarquee />
              {/* Filters Section - Only show after area search */}
              {areaSearchPerformed && (
              <div ref={filtersRef} style={{
                padding: '20px',
                marginBottom: '20px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              }}>
                <h5 style={{
                  color: '#2F747F',
                  fontWeight: 700,
                  marginBottom: '15px',
                  fontSize: '16px',
                }}>Filters {selectedAreaName ? `for ${selectedAreaName}` : ''}</h5>

                {/* Filter Pills Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  marginBottom: '15px',
                }}>
                  {/* Property Mode Filter Pill */}
                  <button
                    onClick={() => {
                      setShowPriceOptions(false);
                      setShowPropertyTypeOptions(false);
                      setShowBedroomOptions(false);
                      setShowFloorOptions(false);
                      setShowPropertyModeOptions(!showPropertyModeOptions);
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#2F747F',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F5F3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  >
                    Property Mode({selectedPropertyModes.length}) ▼
                  </button>

                  {/* Property Type Filter Pill */}
                  <button
                    onClick={() => {
                      setShowPropertyModeOptions(false);
                      setShowPriceOptions(false);
                      setShowBedroomOptions(false);
                      setShowFloorOptions(false);
                      setShowPropertyTypeOptions(!showPropertyTypeOptions);
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#2F747F',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F5F3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  >
                    Property Type({selectedPropertyTypes.length}) ▼
                  </button>

                  {/* Price Range Filter Pill */}
                  <button
                    onClick={() => {
                      setShowPropertyModeOptions(false);
                      setShowPropertyTypeOptions(false);
                      setShowBedroomOptions(false);
                      setShowFloorOptions(false);
                      setShowPriceOptions(!showPriceOptions);
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#2F747F',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F5F3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  >
                    Rent ({selectedPriceRange ? 1 : 0}) ▼
                  </button>

                  {/* Bedroom Filter Pill */}
                  <button
                    onClick={() => {
                      setShowPropertyModeOptions(false);
                      setShowPropertyTypeOptions(false);
                      setShowPriceOptions(false);
                      setShowFloorOptions(false);
                      setShowBedroomOptions(!showBedroomOptions);
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#2F747F',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F5F3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  >
                    Bedroom({selectedBedrooms ? 1 : 0}) ▼
                  </button>

                  {/* Floor Filter Pill */}
                  <button
                    onClick={() => {
                      setShowPropertyModeOptions(false);
                      setShowPropertyTypeOptions(false);
                      setShowPriceOptions(false);
                      setShowBedroomOptions(false);
                      setShowFloorOptions(!showFloorOptions);
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#2F747F',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F5F3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  >
                    Floor({selectedFloors ? 1 : 0}) ▼
                  </button>
                </div>

                {/* Property Mode Popup */}
                {showPropertyModeOptions && (
                  <OptionPopup
                    title="Select Property Mode"
                    options={propertyModes}
                    selectedValues={selectedPropertyModes}
                    isMultiSelect={true}
                    onSelect={handlePropertyModeSelect}
                    onNext={() => setShowPropertyTypeOptions(true)}
                    onSearch={handleSearchFilters}
                    onClose={() => setShowPropertyModeOptions(false)}
                  />
                )}

                {/* Property Type Popup */}
                {showPropertyTypeOptions && (
                  <OptionPopup
                    title="Select Property Type"
                    options={propertyTypes}
                    selectedValues={selectedPropertyTypes}
                    isMultiSelect={true}
                    onSelect={handlePropertyTypeSelect}
                    onNext={() => setShowPriceOptions(true)}
                    onSearch={handleSearchFilters}
                    onClose={() => setShowPropertyTypeOptions(false)}
                  />
                )}

                {showPriceOptions && (
                  <OptionPopup
                    title="Select Rent"
                    options={priceRanges.map(range => range.label)}
                    selectedValues={selectedPriceRange}
                    isMultiSelect={false}
                    onSelect={(label) => {
                      const range = priceRanges.find(r => r.label === label);
                      if (range) {
                        handlePriceRangeSelect(range);
                      }
                    }}
                    onNext={() => setShowBedroomOptions(true)}
                    onSearch={handleSearchFilters}
                    onClose={() => setShowPriceOptions(false)}
                  />
                )}

                {showBedroomOptions && (
                  <OptionPopup
                    title="Select BHK (Bedrooms)"
                    options={bedrooms.map(br => `${br} BHK`)}
                    selectedValues={selectedBedrooms ? `${selectedBedrooms} BHK` : ''}
                    isMultiSelect={false}
                    onSelect={handleBedroomSelect}
                    onNext={() => setShowFloorOptions(true)}
                    onSearch={handleSearchFilters}
                    onClose={() => setShowBedroomOptions(false)}
                  />
                )}

                {showFloorOptions && (
                  <OptionPopup
                    title="Select Floor"
                    options={floors.map(floor => getOrdinalFloor(floor))}
                    selectedValues={selectedFloors ? getOrdinalFloor(selectedFloors) : ''}
                    isMultiSelect={false}
                    onSelect={(ordinalFloor) => {
                      const floorNumber = ordinalFloor.replace(/st|nd|rd|th/, '');
                      setSelectedFloors(floorNumber);
                    }}
                    onSearch={handleSearchFilters}
                    onClose={() => setShowFloorOptions(false)}
                  />
                )}

                {/* Buyer Assistance Confirmation Popup */}
                {showBuyerAssistancePopup && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10000,
                      animation: 'fadeIn 0.3s ease-in',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        textAlign: 'center',
                        animation: 'slideUp 0.3s ease-out',
                      }}
                    >
                      <h3
                        style={{
                          color: '#2F747F',
                          marginBottom: '20px',
                          fontSize: '18px',
                          fontWeight: 600,
                        }}
                      >
                        Find the right property
                      </h3>
                      <p
                        style={{
                          color: '#666',
                          marginBottom: '30px',
                          fontSize: '14px',
                        }}
                      >
                        Get expert guidance to find your perfect property match
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={handleBuyerAssistanceNo}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#f0f0f0',
                            color: '#333',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            flex: 1,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#e0e0e0')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = '#f0f0f0')
                          }
                        >
                          No
                        </button>
                        <button
                          onClick={handleBuyerAssistanceYes}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#6CBAAF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            flex: 1,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#5a9a95')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = '#6CBAAF')
                          }
                        >
                          Continue
                          
                        </button>
                      </div>
                    </div>

                    <style>{`
                      @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                      }
                      @keyframes slideUp {
                        from {
                          transform: translateY(30px);
                          opacity: 0;
                        }
                        to {
                          transform: translateY(0);
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                )}

                {/* Buyer Assistance Success Popup */}
                {showBuyerAssistanceSuccess && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10001,
                      animation: 'fadeIn 0.3s ease-in',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        padding: '40px 30px',
                        width: '90%',
                        maxWidth: '420px',
                        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
                        textAlign: 'center',
                        animation: 'slideUp 0.3s ease-out',
                      }}
                    >
                      {/* Success Icon */}
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          backgroundColor: '#E8F5F3',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '40px',
                            color: '#6CBAAF',
                          }}
                        >
                          ✓
                        </span>
                      </div>

                      <h3
                        style={{
                          color: '#2F747F',
                          marginBottom: '12px',
                          fontSize: '20px',
                          fontWeight: 700,
                        }}
                      >
                        Buyer Assistance Created!
                      </h3>
                      <p
                        style={{
                          color: '#666',
                          marginBottom: '30px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                        }}
                      >
                        Your buyer assistance request has been created successfully. Now let's find your perfect property from the filtered results.
                      </p>

                      <button
                        onClick={handleBuyerAssistanceSuccessOK}
                        style={{
                          width: '100%',
                          padding: '14px 24px',
                          backgroundColor: '#6CBAAF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#5a9a95')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = '#6CBAAF')
                        }
                      >
                        View Filtered Properties
                      </button>
                    </div>

                    <style>{`
                      @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                      }
                      @keyframes slideUp {
                        from {
                          transform: translateY(30px);
                          opacity: 0;
                        }
                        to {
                          transform: translateY(0);
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                )}

                {/* Selected Items Display */}
                {(selectedPropertyModes.length > 0 || selectedPropertyTypes.length > 0 || selectedPriceRange || selectedBedrooms || selectedFloors) && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#E8F5F3',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    border: '1px solid #6EB7B2',
                  }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedPropertyModes.map((mode) => (
                        <span key={mode} style={{
                          backgroundColor: '#6EB7B2',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {mode} <button onClick={() => handlePropertyModeChange(mode)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                        </span>
                      ))}
                      {selectedPropertyTypes.map((type) => (
                        <span key={type} style={{
                          backgroundColor: '#6EB7B2',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {type} <button onClick={() => handlePropertyTypeChange(type)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                        </span>
                      ))}
                      {selectedPriceRange && (
                        <span style={{
                          backgroundColor: '#6EB7B2',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {selectedPriceRange} <button onClick={() => setSelectedPriceRange('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                        </span>
                      )}
                      {selectedBedrooms && (
                        <span style={{
                          backgroundColor: '#6EB7B2',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {selectedBedrooms} BHK <button onClick={() => setSelectedBedrooms('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                        </span>
                      )}
                      {selectedFloors && (
                        <span style={{
                          backgroundColor: '#6EB7B2',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {selectedFloors === '1' ? '1st' : selectedFloors === '2' ? '2nd' : selectedFloors === '3' ? '3rd' : selectedFloors + 'th'} Floor <button onClick={() => setSelectedFloors('')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Filter Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSearchFilters}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6EB7B2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      flex: 1,
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a9a95'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6EB7B2'}
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#fff',
                      color: '#6EB7B2',
                      border: '2px solid #6EB7B2',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      flex: 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F0F9F7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              )}

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
    {/* No Area Properties Modal */}
    {showNoAreaPropertiesModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={() => setShowNoAreaPropertiesModal(false)}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '20px' }}>
            <BiSearchAlt size={50} color="#999" style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ color: '#2F747F', marginBottom: '10px', fontWeight: 600 }}>
            No Properties Found
          </h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Sorry, we couldn't find any properties in <strong>{selectedAreaName}</strong>. 
            Try searching another area or refining your search criteria.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleSearchAgain}
              style={{
                backgroundColor: '#6EB7B2',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                flex: 1,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a9a95'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6EB7B2'}
            >
              Search Again
            </button>
            <button
              onClick={handleHomeClick}
              style={{
                backgroundColor: '#fff',
                color: '#6EB7B2',
                border: '2px solid #6EB7B2',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                flex: 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6EB7B2';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#6EB7B2';
              }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    )}

    {(filtersApplied ? getFilteredProperties() : (areaSearchPerformed && selectedAreaProperties.length > 0 ? selectedAreaProperties : mergedData)).map((property, index) => {
      if (property.type === 'upload') {
        return (
          <div key={`upload-${property._id}-${index}`} className="col-12 p-0 mb-3">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <img
                src={`https://ppcpondy.com/PPC/${property.img.replace(/\\/g, '/')}`}
                alt="Ad"
                style={{
                  height: "180px",
                  width: '100%',
                  objectFit: 'fill',
                  borderRadius: '15px',
                  boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
                  cursor: 'pointer'
                }}
              />
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
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
                <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px" , background: clickedCar.includes(property.ppcId) ? "#ffffff" : "#F9F9F9",}}>
          <div className="d-flex justify-content-between"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 , fontSize:"13px"}}>{property.propertyMode
  ? property.propertyMode.charAt(0).toUpperCase() + property.propertyMode.slice(1)
  : 'N/A'} 
</p>  
<p className="m-0 pe-5">{property.locationCoordinates ? <img src={maplocation} alt="" width={15} /> : ""}</p>
          </div>
       <p className="fw-bold m-0 " style={{ color:clickedCar.includes(property.ppcId) ? "#F76F00" : "#000000", fontSize:"15px" }}>{property.propertyType 
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
                {property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}                </span> 
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

    {/* Nearby Pincodes Section */}
  </div>
)}
            </div>
          </div>

        </Col>
      </Row>

      {/* No Properties Found Modal */}
      {showNoPropertiesModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowNoPropertiesModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: '#2F747F', marginBottom: '15px', fontWeight: 600 }}>
              No Properties Found
            </h4>
            <p
              style={{
                color: '#5E5E5E',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '25px',
              }}
            >
              No properties match your search criteria. Would you like to continue searching with different filters?
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: '#6EB7B2',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 25px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a9a95')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#6EB7B2')}
                onClick={() => {
                  setShowNoPropertiesModal(false);
                  if (searchType === 'advanced') {
                    // Open advanced search modal
                    const advancedModal = document.getElementById('advancedFilterPopup');
                    if (advancedModal && window.bootstrap?.Modal) {
                      const modal = new window.bootstrap.Modal(advancedModal);
                      modal.show();
                    }
                  } else {
                    // Open simple search modal
                    setFilters({
                      id: '',
                      propertyMode: '',
                      propertyType: '',
                      city: '',
                      minPrice: '',
                      maxPrice: '',
                    });
                    setAdvancedFilters({});
                    setSearchQuery('');
                    try { sessionStorage.removeItem(AP_FILTERS_SS_KEY); } catch (_) {}
                    const searchModalButton = document.querySelector('[data-bs-target="#filterPopup"]');
                    if (searchModalButton) {
                      searchModalButton.click();
                    }
                  }
                }}
              >
                Yes, Search Again
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: '#fff',
                  color: '#6EB7B2',
                  border: '2px solid #6EB7B2',
                  padding: '10px 25px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6EB7B2';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.color = '#6EB7B2';
                }}
                onClick={() => {
                  setShowNoPropertiesModal(false);
                  // Return to the city base the user entered from
                  // (/pondicherry or /chennai), not the generic '/' landing.
                  navigate(baseToPath(getActiveBase()));
                }}
              >
                No, Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Result Modal */}
      {showPropertyResultModal && searchedProperty && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflowY: 'auto',
          }}
          onClick={() => setShowPropertyResultModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              margin: '20px auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ color: '#2F747F', margin: 0, fontWeight: 600 }}>
                Property Found
              </h4>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => setShowPropertyResultModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
              <p style={{ color: '#5E5E5E', fontSize: '13px', marginBottom: '10px' }}>
                <strong>Property ID:</strong> {searchedProperty.ppcId}
              </p>
              <p style={{ color: '#5E5E5E', fontSize: '13px', marginBottom: '10px' }}>
                <strong>Type:</strong> {searchedProperty.propertyType || 'N/A'}
              </p>
              <p style={{ color: '#5E5E5E', fontSize: '13px', marginBottom: '10px' }}>
                <strong>City:</strong> {searchedProperty.city || 'N/A'}
              </p>
              <p style={{ color: '#5E5E5E', fontSize: '13px', marginBottom: '10px' }}>
                <strong>Price:</strong> {typeof searchedProperty.price === 'string' && searchedProperty.price === 'On Demand'
                  ? 'On Demand'
                  : searchedProperty.price
                    ? formatPrice(searchedProperty.price)
                    : 'N/A'}
              </p>
              <p style={{ color: '#5E5E5E', fontSize: '13px', marginBottom: '15px' }}>
                <strong>Bedrooms:</strong> {searchedProperty.bedrooms || 'N/A'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn flex-grow-1"
                style={{
                  backgroundColor: '#6EB7B2',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a9a95')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#6EB7B2')}
                onClick={() => {
                  setShowPropertyResultModal(false);
                  handleCardClick(searchedProperty.ppcId, phoneNumber);
                }}
              >
                View Details
              </button>
              <button
                type="button"
                className="btn flex-grow-1"
                style={{
                  backgroundColor: '#fff',
                  color: '#6EB7B2',
                  border: '2px solid #6EB7B2',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6EB7B2';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.color = '#6EB7B2';
                }}
                onClick={() => setShowPropertyResultModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </Container>
  );
};

export default AllProperty;



 

























