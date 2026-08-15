




import { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";

import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import myImage from '../Assets/Rectangle 146.png'; // Correct path
import myImage1 from '../Assets/Rectangle 145.png'; // Correct path
import pic from '../Assets/Mask Group 3@2x.png'; // Correct path
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import indianprice from '../Assets/Indian Rupee-01.png'

import { 
  FaRupeeSign, FaBed, FaCalendarAlt, FaUserAlt, FaRulerCombined,
  FaCamera,
  FaEye
} from "react-icons/fa";
import { BiSearchAlt } from "react-icons/bi";
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import { MdOutlineStarOutline } from "react-icons/md";
import maplocation from "../Assets/maplocation.png";
import PricingInfoMarquee from "./PricingInfoMarquee";
import BuyerBudgetMarquee from "./BuyerBudgetMarquee";

const PyProperty = () => {
    const [imageCounts, setImageCounts] = useState({}); // Store image count for each property
  
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
    const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
    const [clickedProperties, setclickedProperties] = useState([]);
    const [areaSearchValue, setAreaSearchValue] = useState('');
    const [areaSuggestions, setAreaSuggestions] = useState([]);
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
    const [selectedAreaProperties, setSelectedAreaProperties] = useState([]);
    const [areaSearchPerformed, setAreaSearchPerformed] = useState(false);
    const [showNoAreaPropertiesModal, setShowNoAreaPropertiesModal] = useState(false);
    const [selectedAreaName, setSelectedAreaName] = useState('');
    const [nearbyPincodes, setNearbyPincodes] = useState([]);
    const [selectedPincode, setSelectedPincode] = useState('');
  
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
  
    const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
    const filtersRef = useRef(null);
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Py Property",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

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
  // // Fetch Puducherry properties

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

  // Function to generate nearby pincodes
  const getNearbyPincodes = (currentPincode) => {
    const numericPincode = parseInt(currentPincode);
    if (isNaN(numericPincode)) return [];

    const nearby = [];
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      nearby.push((numericPincode + i).toString().padStart(6, '0'));
    }

    return nearby.map((pincode) => {
      const areasForPincode = Object.entries(areaPincodeMap)
        .filter(([_, pin]) => pin === pincode)
        .map(([area, _]) => area);

      const count = properties.filter((property) => {
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

    const filteredByArea = properties.filter((property) => {
      const propertyArea = property.area?.toLowerCase() || '';
      const propertyCity = property.city?.toLowerCase() || '';
      const searchArea = areaName.toLowerCase();

      return propertyArea.includes(searchArea) || propertyCity.includes(searchArea);
    });

    setSelectedAreaProperties(filteredByArea);
    setAreaSearchPerformed(true);
    // Reset filters when new area is searched
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
    // Reset all filters when search is cleared
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
    navigate('/');
  };

  const handleNearbyPincodeClick = (nearbyPincode, areas) => {
    // Filter properties by the nearby pincode's areas
    const filteredByNearby = properties.filter((property) => {
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
    // Reset filters when new area is selected
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
  };

  const getFilteredProperties = () => {
    let filtered = areaSearchPerformed ? selectedAreaProperties : properties;

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


  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const [pondyRes, featuredRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/fetch-Pudhucherry-properties-on-demand`),
          axios.get(`${process.env.REACT_APP_API_URL}/fetch-featured-properties-on-demand`)
        ]);

        const pondy = pondyRes.data.data || [];
        const featured = featuredRes.data.properties?.map((property) => ({
          ...property,
          isFeatured: true
        })) || [];

        const combined = [...pondy, ...featured];
        const sorted = combined.sort(
          (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );

        setProperties(sorted);
        setError("");
      } catch (err) {
        console.error(err);
        // setError("Failed to fetch Pondy or featured properties.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);


  const handleCardClick = (ppcId, phoneNumber) => {
      if (!clickedProperties.includes(ppcId)) {
    const updatedClickedProperties = [...clickedProperties, ppcId];
    setclickedProperties(updatedClickedProperties);
    localStorage.setItem('clickedProperties', JSON.stringify(updatedClickedProperties));
  }
    // navigate("/detail", { state: { ppcId, phoneNumber } });
    navigate(`/detail/${ppcId}`, { state: {phoneNumber } });

  };
useEffect(() => {
  const stored = JSON.parse(localStorage.getItem('clickedProperties')) || [];
  setclickedProperties(stored);
}, []);


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
    // Scroll to filters section when area search is performed
    if (areaSearchPerformed && filtersRef.current) {
      setTimeout(() => {
        filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [areaSearchPerformed]);

  return (
    <Container fluid className="p-0 w-100 d-flex align-items-center justify-content-center ">
      <Row className="g-3 w-100 ">
        <Col lg={12} className="d-flex align-items-center justify-content-center">
      
 
      <div className="w-100">
 
      <div style={{ overflowY: 'auto', fontFamily:"Inter, sans-serif" }}>
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

          {/* Expanded Options Sections */}
          {showPropertyModeOptions && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#F0F9F7',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}>
              <h6 style={{ color: '#2F747F', marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>Property Mode</h6>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {propertyModes.map((mode) => (
                  <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedPropertyModes.includes(mode)}
                      onChange={() => handlePropertyModeChange(mode)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#2F747F', fontSize: '13px' }}>{mode}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showPropertyTypeOptions && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#F0F9F7',
              borderRadius: '8px',
              border: '1px solid #ddd',
              maxHeight: '250px',
              overflowY: 'auto',
            }}>
              <h6 style={{ color: '#2F747F', marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>Property Type</h6>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
              }}>
                {propertyTypes.map((type) => (
                  <label key={type} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    backgroundColor: selectedPropertyTypes.includes(type) ? '#E8F5F3' : '#fff',
                    borderRadius: '6px',
                    border: selectedPropertyTypes.includes(type) ? '1px solid #6EB7B2' : '1px solid #ddd',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedPropertyTypes.includes(type)}
                      onChange={() => handlePropertyTypeChange(type)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: '#2F747F', fontSize: '12px' }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showPriceOptions && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#F0F9F7',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}>
              <h6 style={{ color: '#2F747F', marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>Rent</h6>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                gap: '8px',
              }}>
                {priceRanges.map((range) => (
                  <div
                    key={range.label}
                    onClick={() => {
                      setSelectedPriceRange(range.label);
                      setShowPriceOptions(false);
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 8px',
                      borderRadius: '6px',
                      border: selectedPriceRange === range.label ? '2px solid #6EB7B2' : '1px solid #ddd',
                      backgroundColor: selectedPriceRange === range.label ? '#E8F5F3' : '#fff',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '3px' }}>💰</div>
                    <div style={{
                      fontSize: '11px',
                      color: '#2F747F',
                      fontWeight: 500,
                    }}>
                      {range.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showBedroomOptions && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#F0F9F7',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}>
              <h6 style={{ color: '#2F747F', marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>Bedroom</h6>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '8px',
              }}>
                {bedrooms.map((br) => (
                  <button
                    key={br}
                    onClick={() => setSelectedBedrooms(br)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: selectedBedrooms === br ? '2px solid #6EB7B2' : '1px solid #ddd',
                      backgroundColor: selectedBedrooms === br ? '#E8F5F3' : '#fff',
                      color: '#2F747F',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {br} BHK
                  </button>
                ))}
              </div>
            </div>
          )}

          {showFloorOptions && (
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#F0F9F7',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}>
              <h6 style={{ color: '#2F747F', marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>Floor</h6>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '8px',
              }}>
                {floors.map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setSelectedFloors(floor)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: selectedFloors === floor ? '2px solid #6EB7B2' : '1px solid #ddd',
                      backgroundColor: selectedFloors === floor ? '#E8F5F3' : '#fff',
                      color: '#2F747F',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {floor === '1' ? '1st' : floor === '2' ? '2nd' : floor === '3' ? '3rd' : floor + 'th'}
                  </button>
                ))}
              </div>
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
              onClick={applyFilters}
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
  <div className="text-center my-4"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    }}>
    <span className="spinner-border text-primary" role="status" />
    <p className="mt-2">Loading properties...</p>
  </div>
) : properties.length === 0 ? (
  <div className="text-center my-4" style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    <img src={NoData} alt="No data" width={100} />
    <p>No properties found.</p>
  </div>
) : (() => {
  const displayProperties = filtersApplied ? getFilteredProperties() : (areaSearchPerformed && selectedAreaProperties.length > 0 ? selectedAreaProperties : properties);
  return displayProperties.length === 0 ? (
    <div className="text-center my-4" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <img src={NoData} alt="No data" width={100} />
      <p>{filtersApplied ? 'No properties match your filters.' : 'No properties found.'}</p>
    </div>
  ) : (
  <>
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

    {displayProperties.map((property) => (
         
          <div 
          key={property._id}
          className="card mb-3 shadow rounded-4"
          style={{ width: '100%', height: 'auto', background: '#F9F9F9', overflow:'hidden' }}
          onClick={() => handleCardClick(property.ppcId, property.phoneNumber)}
        >
           <div className="row g-0 align-items-stretch">
<div className="col-md-4 col-4 d-flex flex-column align-items-center">

<div style={{ position: "relative", width: "100%",height: '100%', }}>
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

{/* Image */}
      <img
  src={
    property.photos && property.photos.length > 0
      ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
      : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
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

  


{/* Icons */}
<div
style={{
position: "absolute",
bottom: "0px",
width: "100%",
display: "flex",
justifyContent: "space-between",
}}
>
                             
<span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaCamera className="me-1"/> {imageCounts[property.ppcId] || 0}
          </span>
          <span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage1}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaEye className="me-1" />{property.views}
          </span>
</div>
</div>
</div>
         <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px" , background: clickedProperties.includes(property.ppcId) ? "#ffffff" : "#F9F9F9",}}>
            <div className="d-flex justify-content-between"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 , fontSize:"13px"}}>{property.propertyMode
  ? property.propertyMode.charAt(0).toUpperCase() + property.propertyMode.slice(1)
  : 'N/A'} 
</p>  <p className="m-0 pe-5">{property.locationCoordinates ? <img src={maplocation} alt="" width={15} /> : ""}</p>
          </div>
         <p className="fw-bold m-0 " style={{ color:clickedProperties.includes(property.ppcId) ? "#F76F00" : "#000000", fontSize:"15px" }}>{property.propertyType 
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
                {property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}                </span> 
                  </h6>
               </div>
              </div>
            </div>
          </div>
        </div>

        </div>
        ))}

  </>
)

})()}
      </div>
      </div>
      </Col>
      </Row>
      </Container>
  );
};

export default PyProperty;