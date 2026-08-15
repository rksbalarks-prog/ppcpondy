








import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Col, Container, Row } from "react-bootstrap";
import {  useLocation, useNavigate } from "react-router-dom";
import { RiCloseCircleFill, RiLayoutLine } from 'react-icons/ri';
import { TbArrowLeftRight, TbMapPinCode, TbWorldLongitude } from 'react-icons/tb';
import {FaBuilding, FaMoneyBillWave,  FaBath, FaChartArea, FaPhone ,FaEdit,FaRoad,FaDoorClosed,FaMapPin, FaHome, FaUserAlt, FaEnvelope,  FaRupeeSign , FaFileVideo , FaToilet,FaCar,FaBed,  FaCity , FaTimes, FaArrowRight, FaStreetView, FaSearch} from 'react-icons/fa';
import {  FaRegAddressCard, FaRegCircleCheck } from 'react-icons/fa6';
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
import PricingPlans from "./PricingPlans";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { IoCloseCircle } from "react-icons/io5";
import moment from "moment";
import { format } from "date-fns";
import { Spinner } from "react-bootstrap";  
import { useSwipeable } from 'react-swipeable';
import SuccessIcon from '../Assets/Success.png';
import { toWords } from 'number-to-words';
import { FcSearch } from "react-icons/fc";


function AddProps({ phoneNumber }) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
    const [videoloading, setvideoUploading] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);  
    const [swiped, setSwiped] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [missingFields, setMissingFields] = useState([]);
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
      const [isProcessing, setIsProcessing] = useState(false);
      const [isSuccess, setIsSuccess] = useState(false);
      const [showCheckmark, setShowCheckmark] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
const [pendingSubmitEvent, setPendingSubmitEvent] = useState(null);
const [coordinateInput, setCoordinateInput] = useState('');
const [isUploading, setIsUploading] = useState(false);
const [progress, setProgress] = useState(0);
const [photoProgress, setPhotoProgress] = useState(0);
const [photoloading, setPhotoUploading] = useState(false);  
const [uploadSuccess, setUploadSuccess] = useState(false);
const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
const [videoError, setVideoError] = useState("");  
const [compressionStatus, setCompressionStatus] = useState(""); // For compression progress message
const [isVideoCompressing, setIsVideoCompressing] = useState(false);
const [videoCompressionProgress, setVideoCompressionProgress] = useState(0);
const [compressingVideoName, setCompressingVideoName] = useState("");

    const [step, setStep] = useState("form"); 
const [videos, setVideos] = useState([]);

    const handlers = useSwipeable({
      onSwipedRight: () => {
        setSwiped(true);
        handleShowMore();
  
         setTimeout(() => {
          setSwiped(false);
        }, 2000);
      },
      trackMouse: true,
      delta: 40,
    });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const previewRef = useRef(null);

  const fileInputRef = useRef(null); 

  useEffect(() => {
     const timer = setTimeout(() => {
      setIsVisible(true);  
    }, 100);  

     return () => clearTimeout(timer);
  }, []);
  const [ppcId, setPpcId] = useState(null);
   const [priceInWords, setPriceInWords] = useState("");
  const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPlans, setshowPlans] = useState(false);

    const [message, setMessage] = useState({ text: "", type: "" , image: "" });


       useEffect(() => {
        if (message.text) {
          const timer = setTimeout(() => {
            setMessage({ text: "", type: "" });
          }, 3000);
          return () => clearTimeout(timer);
        }
      }, [message]);
    
  

  useEffect(() => {
    if (!phoneNumber) {
      setMessage({ text: "Missing phone number.", type: "error" });
      return;
    }
  
    const handleAddProperty = async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/store-data`, {
          phoneNumber: phoneNumber,
        });
  
        if (response.status === 200 || response.status === 201) {
          setPpcId(response.data.ppcId);  
          setMessage({ 
            text: response.data.message + ` PPC-ID: ${response.data.ppcId}`, 
            type: "success" 
          });
        }
      } catch (error) {
        setMessage({ 
          text: error.response?.data?.message || "Error adding user.", 
          type: "error" 
        });
      }
    };
  
    handleAddProperty();
  }, [phoneNumber]);
  

    const handleCloseAddForm = () => {
      setshowPlans(false);  
    };
 const inputRef = useRef(null);
  const latRef = useRef(null);
  const lngRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
    const coordRef = useRef(null);

   const [formData, setFormData] = useState({
    propertyMode: '',
    propertyType: '',
    price: '',
    propertyAge: '',
    bankLoan: '',
    negotiation: '',
    length: '',
    breadth: '',
    totalArea: '',
    ownership: '',
    bedrooms: '',
    kitchen: '',
    kitchenType: '',
    balconies: '',
    floorNo: '',
    areaUnit: '',
    propertyApproved: '',
    postedBy: '',
    facing: '',
    salesMode: '',
    salesType: '',
    description: '',
    furnished: '',
    lift: '',
    attachedBathrooms: '',
    western: '',
     carParking: '',
    rentalPropertyAddress: '',
    country: '',
    state: '',
    city: '',
    district: '',
    area: '',
    streetName: '',
    doorNumber: '',
    nagar: '',
    ownerName: '',
    email: '',
    countryCode:"+91",
    phoneNumber: "",
  phoneNumberCountryCode: "",
  alternatePhone: "",
  alternatePhoneCountryCode: "",
    bestTimeToCall: '',
    pinCode:"",
    locationCoordinates:''
  });

  useEffect(() => {
  if (step !== "form" || !window.google) return;

  const interval = setInterval(() => {
    if (mapRef.current && inputRef.current) {
      clearInterval(interval);

      mapRef.current.innerHTML = "";

      const map = new window.google.maps.Map(mapRef.current, {
   center: { lat: 11.9416, lng: 79.8083 },
          zoom: 10,
      });

      mapInstance.current = map;

       const geocoder = new window.google.maps.Geocoder();
      map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        updateMap(lat, lng);  

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            const place = results[0];

            const getComponent = (type) => {
              const comp = place.address_components?.find(c => c.types.includes(type));
              return comp?.long_name || '';
            };

            setFormData(prev => ({
            ...prev,
            rentalPropertyAddress: place.formatted_address,
            latitude: lat,
            longitude: lng,
            pinCode: getComponent("postal_code"),
            city: getComponent("locality") || getComponent("administrative_area_level_3"),
            area: getComponent("sublocality") || getComponent("sublocality_level_1"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"),  
          locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`,  

          }));
          }
        });
      });

       const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
      });

      autocomplete.bindTo('bounds', map);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        updateMap(lat, lng);

        const getComponent = (type) => {
          const comp = place.address_components?.find(c => c.types.includes(type));
          return comp?.long_name || '';
        };

    setFormData(prev => ({
            ...prev,
            rentalPropertyAddress: place.formatted_address,
            latitude: lat,
            longitude: lng,
            pinCode: getComponent("postal_code"),
            city: getComponent("locality") || getComponent("administrative_area_level_3"),
            area: getComponent("sublocality") || getComponent("sublocality_level_1"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"),  
          locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`,  

          }));
      });
    }
  }, 100);

  return () => clearInterval(interval);
}, [step]);
useEffect(() => {
  if (!inputRef.current) return;

  const handlePasteOrChange = () => {
    const value = inputRef.current.value;

     const match = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      handleLatLngSearch(lat, lng);  
    }
  };

   inputRef.current.addEventListener('change', handlePasteOrChange);
  inputRef.current.addEventListener('paste', handlePasteOrChange);

   return () => {
    inputRef.current?.removeEventListener('change', handlePasteOrChange);
    inputRef.current?.removeEventListener('paste', handlePasteOrChange);
  };
}, []);
 const updateMap = (lat, lng) => {
  const map = mapInstance.current;
  if (!map) return;

  map.setCenter({ lat, lng });
  map.setZoom(12);

  const position = { lat, lng };

  const geocoder = new window.google.maps.Geocoder();

  if (markerRef.current) {
    markerRef.current.setPosition(position);
  } else {
    markerRef.current = new window.google.maps.Marker({
      position,
      map,
      draggable: true,
    });

     markerRef.current.addListener('dragend', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();

       geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          const place = results[0];
          const getComponent = (type) => {
            const comp = place.address_components?.find(c => c.types.includes(type));
            return comp?.long_name || '';
          };

          setFormData(prev => ({
            ...prev,
            rentalPropertyAddress: place.formatted_address || '',
            latitude: newLat,
            longitude: newLng,
            pinCode: getComponent("postal_code"),
            city: getComponent("sublocality_level_1"),
            area: getComponent("sublocality_level_2"),
            nagar: getComponent("sublocality"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2") || getComponent("locality"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"),
            locationCoordinates: `${newLat.toFixed(6)}° N, ${newLng.toFixed(6)}° E`,
          }));
        }
      });
    });
  }
};


const handleLatLngSearch = (e) => {
  e.preventDefault();

  const input = coordRef.current.value.trim();

   const match = input.match(/([-\d.]+)[^\dNS]*([NS]),\s*([-\d.]+)[^\dEW]*([EW])/i);

  if (!match) {
    alert("Please enter coordinates in the format: 11.7540° N, 79.7619° E");
    return;
  }

  let lat = parseFloat(match[1]);
  let latDir = match[2].toUpperCase();
  let lng = parseFloat(match[3]);
  let lngDir = match[4].toUpperCase();

  if (latDir === "S") lat = -lat;
  if (lngDir === "W") lng = -lng;

  if (!isNaN(lat) && !isNaN(lng)) {
    updateMap(lat, lng);

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const place = results[0];

        const getComponent = (type) => {
          const comp = place.address_components.find(c => c.types.includes(type));
          return comp?.long_name || '';
        };

        setFormData(prev => ({
          ...prev,
          rentalPropertyAddress: place.formatted_address || '',
          latitude: lat,
          longitude: lng,
          pinCode: getComponent("postal_code"),
          city: getComponent("sublocality_level_1"),
          area: getComponent("sublocality_level_2"),
          nagar: getComponent("sublocality"),
          streetName: getComponent("route") || getComponent("premise"),
          district: getComponent("administrative_area_level_2") || getComponent("locality"),
          state: getComponent("administrative_area_level_1"),
          country: getComponent("country"),
          doorNumber: getComponent("street_number"),
          locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this

        }));
      } else {
        alert("Reverse geocoding failed: " + status);
      }
    });
  } else {
    alert("Invalid coordinates.");
  }
};
const [coordValue, setCoordValue] = useState('');
 const handleLatLngAuto = (input) => {
  input = input.trim();

   const matchDecimalDir = input.match(/([-\d.]+)[^\dNS]*([NS]),?\s*([-\d.]+)[^\dEW]*([EW])/i);

  let lat, lng;

  if (matchDecimalDir) {
    lat = parseFloat(matchDecimalDir[1]);
    const latDir = matchDecimalDir[2].toUpperCase();
    lng = parseFloat(matchDecimalDir[3]);
    const lngDir = matchDecimalDir[4].toUpperCase();

    if (latDir === "S") lat = -lat;
    if (lngDir === "W") lng = -lng;
  } else {
     const dmsRegex = /(\d+)[°:\s](\d+)[\'′:\s](\d+(?:\.\d+)?)[\"\″]?\s*([NS])[^0-9]*(\d+)[°:\s](\d+)[\'′:\s](\d+(?:\.\d+)?)[\"\″]?\s*([EW])/i;
    const dmsMatch = input.match(dmsRegex);

    if (dmsMatch) {
      const [
        _full,
        latDeg, latMin, latSec, latDir,
        lngDeg, lngMin, lngSec, lngDir
      ] = dmsMatch;

      lat = dmsToDecimal(+latDeg, +latMin, +latSec, latDir.toUpperCase());
      lng = dmsToDecimal(+lngDeg, +lngMin, +lngSec, lngDir.toUpperCase());
    } else {
       const plainDecimal = input.match(/([-\d.]+)[,\s]+([-\d.]+)/);
      if (plainDecimal) {
        lat = parseFloat(plainDecimal[1]);
        lng = parseFloat(plainDecimal[2]);
      } else {
        return; 
      }
    }
  }

  if (!isNaN(lat) && !isNaN(lng)) {
    updateMap(lat, lng);

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const place = results[0];

        const getComponent = (type) => {
          const comp = place.address_components.find(c => c.types.includes(type));
          return comp?.long_name || '';
        };

        setFormData(prev => ({
          ...prev,
          rentalPropertyAddress: place.formatted_address,
          latitude: lat,
          longitude: lng,
          pinCode: getComponent("postal_code"),
          city: getComponent("locality") || getComponent("administrative_area_level_3"),
          area: getComponent("sublocality") || getComponent("sublocality_level_1"),
          streetName: getComponent("route") || getComponent("premise"),
          district: getComponent("administrative_area_level_2"),
          state: getComponent("administrative_area_level_1"),
          country: getComponent("country"),
          doorNumber: getComponent("street_number"),
          locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`
        }));
      }
    });
  }
};

 const dmsToDecimal = (deg, min, sec, direction) => {
  let decimal = deg + min / 60 + sec / 3600;
  if (["S", "W"].includes(direction)) decimal = -decimal;
  return decimal;
};

const handleClear = () => {
  if (coordRef.current) {
    coordRef.current.value = '';  
  }
  setCoordValue('');  

   setFormData(prev => ({
    ...prev,
    rentalPropertyAddress: '',
    latitude: '',
    longitude: '',
    pinCode: '',
    city: '',
    area: '',
    nagar: '',
    streetName: '',
    district: '',
    state: '',
    country: '',
    doorNumber: '',
    locationCoordinates:'',
  }));
};

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Add Property",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);


  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [video, setVideo] = useState(null);
  const [isPreview, setIsPreview] = useState(true);

  const navigate = useNavigate();

  
  const formattedDate = formData.createdAt 
  ? new Date(formData.createdAt).toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    }) 
  : "N/A";

   
const formattedCreatedAt = Date.now
? moment(formData.createdAt).format("DD-MM-YYYY") 
: "N/A";



 
  const formRefs = {
    propertyMode: useRef(null),
    propertyType: useRef(null),
    price: useRef(null),
    totalArea: useRef(null),
    areaUnit: useRef(null),
    salesType: useRef(null),
    postedBy: useRef(null),
  };
 
  const handlePreview = () => {
    const requiredFields = Object.keys(formRefs);
  
  
    setStep("preview");
    setIsPreviewOpen(true);
  
     setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  const propertyDetailsList = [
    { heading: true, label: "Basic Property Info" },
    { icon: <MdHomeWork />, label: "Property Mode", value:  formData.propertyMode},
    { icon: <MdHouseSiding />, label: "Property Type", value: formData.propertyType },
 
    { icon: <AiOutlineColumnWidth />, label: "Length", value: formData.length },
    { icon: <AiOutlineColumnHeight />, label: "Breadth", value: formData.breadth  },
     {
      icon: <RiLayoutLine />,
      label: "Total Area",
      value: `${formData.totalArea} ${formData.areaUnit}`,  
    },
     { icon: <FaUserAlt />, label: "Ownership", value: formData.ownership },
    { icon: <MdApproval />, label: "Property Approved", value: formData.propertyApproved },
    { icon: <MdTimer />, label: "Property Age", value: formData.propertyAge },
    { icon: <BsBank />, label: "Bank Loan", value: formData.bankLoan },


    { heading: true, label: "Property Features" },
    { icon: <BiBed />, label: "Bedrooms", value: formData.bedrooms },

    { icon: <GiStairs />, label: "Floor No", value:formData.floorNo },
    { icon: <GiForkKnifeSpoon />, label: "Kitchen", value: formData.kitchen},
     { icon: <GiWindow />, label: "Balconies", value: formData.balconies},
 { label: "western", value: formData.western, icon: <BiBath /> },
{ label: "attached", value: formData.attachedBathrooms, icon: <BiBath /> },

    { icon: <BiCar />, label: "Car Park", value: formData.carParking },
    { icon: <MdElevator />, label: "Lift", value: formData.lift },
    { heading: true, label: "Other details" },  

    { icon: <MdOutlineChair />, label: "Furnished", value: formData.furnished },
    { icon: <TbArrowLeftRight />, label: "Facing", value: formData.facing },

    { icon: <BsGraphUp />, label: "Sale Mode", value: formData.salesMode },
    { icon: <BsBarChart />, label: "Sales Type", value: formData.salesType },
    { icon: <BiUser />, label: "Posted By", value: formData.postedBy },
     { icon: <BiCalendar />, label: "Posted On", value:formattedCreatedAt },
    { heading: true, label: "Description" },  
    { icon: <FaFileAlt />, label: "Description" , value: formData.description },
  
    { heading: true, label: "Property Location Info" },  
  
     { icon: <FaGlobeAmericas />, label: "Country", value: formData.country },
    { icon: <BiBuilding />, label: "State", value: formData.state },
    { icon: <MdLocationCity />, label: "City", value: formData.city },
    { icon: <FaMapMarkerAlt />, label: "District", value:  formData.district},
          { icon: <MdLocationOn />, label: "Area", value: formData.area },
   
    { icon: <FaMapSigns />, label: "Nagar", value: formData.nagar },
    { icon: <FaRoad />, label: "Street Name", value: formData.streetName },

    { icon: <FaDoorClosed />, label: "Door Number", value: formData.doorNumber },
    { icon: <TbMapPinCode />, label: "pinCode", value: formData.pinCode },
    { icon: <TbWorldLongitude  />, label: "location Coordinates", value: formData.locationCoordinates },

    { heading: true, label: "Contact Info" },  
   
    { icon: <FaUserAlt />, label: "Owner Name", value: formData.ownerName },
    { icon: <MdEmail />, label: "Email", value: formData.email },

    { icon: <MdPhone  />, label: "Phone Number", value: phoneNumber },
    { icon: <MdPhone  />, label: "alternate Phone", value: formData.alternatePhone },

    { icon: <MdOutlineAccessTime />, label: "Best Time To Call", value: formData.bestTimeToCall },
 
  ];
  const [dropdownState, setDropdownState] = useState({
    activeDropdown: null,
    filterText: "",
  });

   const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({
      activeDropdown: prevState.activeDropdown === field ? null : field,
      filterText: "",
    }));
  };

   const handleDropdownSelect = (field, value) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
    setDropdownState({ activeDropdown: null, filterText: "" });
  };

   const handleFilterChange = (e) => {
    setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }));
  };

 


  const [countryCodes, setCountryCodes] = useState([
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+86', country: 'China' },
    { code: '+39', country: 'Italy' },
    { code: '+7', country: 'Russia/Kazakhstan' },
   ]);
  const [alternateCountryCodes, setAlternateCountryCodes] = useState([
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+86', country: 'China' },
    { code: '+39', country: 'Italy' },
    { code: '+7', country: 'Russia/Kazakhstan' },
  ]);
  
  
  // Indian States and Union Territories
  const indianStatesAndUT = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
  ];

  const [dataList, setDataList] = useState({});

  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch`);
      const groupedData = response.data.data.reduce((acc, item) => {
        if (!acc[item.field]) acc[item.field] = [];
        acc[item.field].push(item.value);
        return acc;
      }, {});
      // Add states to the dataList
      groupedData['state'] = indianStatesAndUT;
      setDataList(groupedData);
    } catch (error) {
      // Fallback: still set states even if API fails
      setDataList({ state: indianStatesAndUT });
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      fileInputRef.current.click();
      setLoading(false);
    }, 1000);
  };
 
// Compress image to target file size (30KB) with progress tracking
const compressImageToSize = (blob, targetSizeKB = 30, onProgressUpdate = null) => {
  return new Promise((resolve) => {
    let quality = 0.9;
    const targetSizeBytes = targetSizeKB * 1024;
    let currentBlob = blob;
    const initialSize = blob.size;
    let iterationCount = 0;
    const maxIterations = 8; // quality goes from 0.9 to 0.1 (8 steps)

    const compressRecursive = () => {
      if (currentBlob.size <= targetSizeBytes || quality <= 0.1) {
        if (onProgressUpdate) onProgressUpdate(100);
        resolve(currentBlob);
        return;
      }

      quality -= 0.1;
      iterationCount++;

      // Calculate progress (0-100)
      const compressionProgress = Math.min(50 + (iterationCount / maxIterations) * 50, 99);
      if (onProgressUpdate) onProgressUpdate(compressionProgress);

      const canvas = document.createElement('canvas');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            currentBlob = blob;
            compressRecursive();
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(currentBlob);
    };

    if (currentBlob.size > targetSizeBytes) {
      if (onProgressUpdate) onProgressUpdate(50); // Initial progress
      compressRecursive();
    } else {
      if (onProgressUpdate) onProgressUpdate(100);
      resolve(currentBlob);
    }
  });
};

const handlePhotoUpload = async (e) => {
  const files = Array.from(e.target.files);
  const maxSize = 10 * 1024 * 1024;  

  if (!files.length) return;

   for (let file of files) {
    if (file.size > maxSize) {
      alert("File size exceeds the 10MB limit");
      return;
    }
  }

   if (photos.length + files.length > 15) {
    alert("Maximum 15 photos can be uploaded.");
    return;
  }

  setPhotoUploading(true);
  setPhotoProgress(0);
  setPhotoUploadSuccess(false);
  setCompressionStatus("Preparing images...");  

  try {
     let percent = 0;
    const interval = setInterval(() => {
      percent += 5;
      if (percent >= 45) {
        clearInterval(interval);
        setCompressionStatus("Adding watermark...");
      } else {
        setPhotoProgress(percent);
      }
    }, 150);

    await new Promise((resolve) => setTimeout(resolve, 1500));  

     const watermarkedImages = await Promise.all(
      files.map((file) => {
        return new Promise(async (resolve) => {
          const reader = new FileReader();

          reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              canvas.width = img.width;
              canvas.height = img.height;

              ctx.drawImage(img, 0, 0);

               const watermarkText = "PPC Pondy";
              const fontSize = Math.max(24, Math.floor(canvas.width / 15));
              ctx.font = `bold ${fontSize}px Arial`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;

               ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 4;
              ctx.strokeText(watermarkText, centerX, centerY);

               ctx.fillStyle = "rgba(224, 223, 223, 0.9)";
              ctx.fillText(watermarkText, centerX, centerY);

              canvas.toBlob(async (blob) => {
                // Compress the watermarked image to 200KB with progress tracking
                setCompressionStatus("Compressing image...");
                const compressedBlob = await compressImageToSize(blob, 200, (progress) => {
                  const totalProgress = Math.min(45 + (progress / 2), 99);
                  setPhotoProgress(totalProgress);
                  
                  // Update status based on compression progress
                  if (progress < 30) {
                    setCompressionStatus("Compressing image... (30%)");
                  } else if (progress < 60) {
                    setCompressionStatus("Compressing image... (60%)");
                  } else if (progress < 90) {
                    setCompressionStatus("Compressing image... (90%)");
                  } else {
                    setCompressionStatus("Finalizing...");
                  }
                });
                const watermarkedFile = new File([compressedBlob], file.name, {
                  type: 'image/jpeg',
                });
                resolve(watermarkedFile);
              }, 'image/jpeg', 0.9);
            };

            img.src = event.target.result;
          };

          reader.readAsDataURL(file);
        });
      })
    );

    setPhotos([...photos, ...watermarkedImages]);
    setSelectedFiles(watermarkedImages);
    setSelectedPhotoIndex(0);
    setPhotoProgress(100);
    setCompressionStatus("");

     setPhotoUploadSuccess(true);
    setTimeout(() => setPhotoUploadSuccess(false), 2000);
  } catch (error) {
    console.error("Photo upload failed:", error);
    setCompressionStatus("");
  } finally {
    setPhotoUploading(false);
  }
};

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (index === selectedPhotoIndex) {
      setSelectedPhotoIndex(0);
    }
  };
 
const handleVideoChange = async (e) => {
  const selectedFiles = Array.from(e.target.files);
  const maxSize = 50 * 1024 * 1024;  
  const intimationSize = 10 * 1024 * 1024;  
  const validFiles = [];

  setVideoError("");  
  for (let file of selectedFiles) {
     if (file.size > intimationSize && file.size <= maxSize) {
      alert(`${file.name} is above 10MB. Large files may take longer to upload.`);
    }

     if (file.size > maxSize) {
      setVideoError(`${file.name} exceeds the 50MB size limit.`);
      continue;
    }

     let compressedFile = file;
    try {
      setIsVideoCompressing(true);
      setCompressingVideoName(file.name);
      setVideoCompressionProgress(0);
      
      compressedFile = await compressVideo(file);
      
      setIsVideoCompressing(false);
      setVideoCompressionProgress(0);
      setCompressingVideoName("");
    } catch (err) {
      console.warn("Compression failed, using original file", err);
      setIsVideoCompressing(false);
      setVideoCompressionProgress(0);
      setCompressingVideoName("");
    }

    validFiles.push(compressedFile);
  }

  if (!validFiles.length) return;

   setvideoUploading(true);
  setProgress(0);
  setUploadSuccess(false);

   let percent = 0;
  const interval = setInterval(() => {
    percent += 10;
    setProgress(percent);

    if (percent >= 100) {
      clearInterval(interval);

      setVideos((prev) => [...prev, ...validFiles].slice(0, 3));
      setvideoUploading(false);
      setUploadSuccess(true);

      setTimeout(() => setUploadSuccess(false), 2000);
    }
  }, 300);
};
 const compressVideo = async (file) => {
  try {
    const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = createFFmpeg({ log: false });
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    const inputName = "input.mp4";
    const outputName = "output.mp4";

    // Write input file
    ffmpeg.FS("writeFile", inputName, await fetchFile(file));
    const inputData = ffmpeg.FS("readFile", inputName);
    const inputSize = inputData.length;
    console.log(`Original file size: ${(inputSize / 1024).toFixed(2)}KB`);

    setVideoCompressionProgress(10);

    // Target: 200KB = 200 * 1024 bytes = 204800 bytes
    const targetSizeBytes = 200 * 1024;
    
    // Try first pass - aggressive compression
    let attempt = 1;
    let compressedSize = 0;
    let success = false;

    while (attempt <= 3 && !success) {
      console.log(`Compression attempt ${attempt}...`);
      
      // Clean up previous output if exists
      try {
        ffmpeg.FS("unlink", outputName);
      } catch (e) {
        // File doesn't exist, that's OK
      }

      // Aggressive bitrate calculation
      let videoBitrate, audioBitrate;
      
      if (attempt === 1) {
        // First attempt: Standard aggressive compression
        videoBitrate = 100; // 100k video bitrate
        audioBitrate = 32;  // 32k audio bitrate
      } else if (attempt === 2) {
        // Second attempt: More aggressive
        videoBitrate = 64;  // 64k video bitrate
        audioBitrate = 16;  // 16k audio bitrate
      } else {
        // Third attempt: Ultra aggressive
        videoBitrate = 32;  // 32k video bitrate
        audioBitrate = 8;   // 8k audio bitrate
      }

      setVideoCompressionProgress(20 + (attempt * 20));

      // Run ffmpeg with compression parameters
      await ffmpeg.run(
        "-i", inputName,
        "-vcodec", "libx264",
        "-crf", `${32 + (attempt * 2)}`, // Increase CRF (quality loss) with each attempt
        "-preset", "ultrafast",
        "-vf", attempt === 1 ? "scale=480:-1" : attempt === 2 ? "scale=360:-1" : "scale=280:-1",
        "-b:v", `${videoBitrate}k`,
        "-b:a", `${audioBitrate}k`,
        "-ac", "1", // Mono
        "-ar", "22050", // 22kHz sample rate
        "-bufsize", "100k",
        "-maxrate", `${videoBitrate + 10}k`,
        "-y", // Overwrite output
        outputName
      );

      // Check output size
      const outputData = ffmpeg.FS("readFile", outputName);
      compressedSize = outputData.length;
      console.log(`Attempt ${attempt}: ${(compressedSize / 1024).toFixed(2)}KB`);

      if (compressedSize <= targetSizeBytes) {
        console.log(`✓ Compression successful! Final size: ${(compressedSize / 1024).toFixed(2)}KB`);
        setVideoCompressionProgress(100);
        return new File(
          [outputData.buffer],
          file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp4",
          { type: "video/mp4" }
        );
      }

      attempt++;
    }

    // If we get here, we couldn't compress enough, return the last attempt anyway
    const finalData = ffmpeg.FS("readFile", outputName);
    console.log(`Final compressed size (may exceed 200KB): ${(finalData.length / 1024).toFixed(2)}KB`);
    setVideoCompressionProgress(100);
    return new File(
      [finalData.buffer],
      file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp4",
      { type: "video/mp4" }
    );

  } catch (error) {
    console.error("Video compression error:", error);
    setVideoCompressionProgress(0);
    throw new Error(`Video compression failed: ${error.message}`);
  }
};

const removeVideo = (indexToRemove) => {
  setVideos(prev => prev.filter((_, index) => index !== indexToRemove));
};

  const handlePhotoSelect = (index) => {
    setSelectedPhotoIndex(index);
  };

  const nonDropdownFields = ["price", "length", "totalArea", "description", "city",  "area", "alternatePhone",];

const dropdownFieldOrder = [
  "propertyMode",
  "propertyType",
  "price",
  "negotiation",
  "length",
  "breadth",
  "totalArea",
  "areaUnit",
  "ownership",
  "bedrooms",
  "kitchen",
   "balconies",
  "floorNo",
  "propertyApproved",
  "propertyAge",
  "bankLoan",
    "facing",
  "salesMode",
  "salesType",
  "postedBy",
  "description",
  "furnished",
  "lift",
  "attachedBathrooms",
  "western",
   "carParking",
  "YourProperty",
  "state",
   "city",
  "district",
  "area",
    "alternatePhone",

  "bestTimeToCall"
];

 
  const handleFieldChange = (e) => {
  const { name, value } = e.target;

  let updatedValue = value;

  if (name === "description" && value.length > 0) {
    updatedValue = value.charAt(0).toUpperCase() + value.slice(1);
  }

  if (name === "price" && value !== "" && !isNaN(value)) {
    setPriceInWords(convertToIndianRupees(value));
  } else if (name === "price" && value === "") {
    setPriceInWords("");
  }

  // Handle area suggestions
  if (name === 'area') {
    if (value.trim() !== '') {
      const filtered = Object.keys(areaPincodeMap).filter(area =>
        area.toLowerCase().includes(value.toLowerCase())
      );
      setAreaSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowAreaSuggestions(true);
    } else {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
    }
  }

  // Handle pincode suggestions (reverse lookup from pincode to areas)
  if (name === 'pinCode') {
    if (value.trim() !== '') {
      const filtered = Object.entries(areaPincodeMap)
        .filter(([area, pincode]) => pincode.includes(value))
        .map(([area, pincode]) => area);
      setPincodeSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowPincodeSuggestions(true);
    } else {
      setPincodeSuggestions([]);
      setShowPincodeSuggestions(false);
    }
  }

      setFormData((prev) => ({
      ...prev,
      [name]: value,  
    }));
    
};

// Description-specific change handler to enforce 200 char limit and show counter/alerts
const handleDescriptionChange = (e) => {
  let value = e.target.value || "";
  // Prevent typing beyond 200 characters
  if (value.length > 200) {
    value = value.slice(0, 200);
    setMessage({ text: "Maximum 200 characters allowed.", type: "error", field: "description" });
  } else {
    // clear description-related message if any
    if (message?.field === "description") {
      setMessage({ text: "", type: "", field: "" });
    }
  }

  setFormData((prev) => ({ ...prev, description: value }));
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
  
  const areaPincodeMap = {
    "Abishegapakkam": "605007",
    "Ariyankuppam": "605007",
    "Arumbarthapuram" : "605110",
    "Bahour": "605101",
    "Bommaiyarpalayam": "605106",
    "Cathedral": "605001",
    "Chinna Kalapet": "605014",
    "Chinna Veerampatinam": "605007",
    "Dharmapuri": "605003",
    "Dupleix Nagar": "605001",
    "Embalam": "605106",
    "Heritage Town": "605001",
    "Iyyanar Koil": "605013",
    "Jipmer Campus": "605006",
    "Kadirkamam": "605009",
    "Kalapet": "605014",
    "Kanniakoil": "605010",
    "Karayamputhur": "605106",
    "Karuvadikuppam": "605008",
    "Katterikuppam": "605009",
    "Kirumampakkam": "605502",
    "Koodapakkam": "605502",
    "Korkadu": "605501",
    "Kottakuppam": "605104",
    "Kottakuppam Puduthurai": "605007",
    "Kunichempet": "605006",
    "Kuruvinatham": "605007",
    "Kurusukuppam": "605012",
    "Lawspet": "605008",
    "Madukarai": "605107",
    "Madagadipet": "605107",
    "Manalipet": "605010",
    "Manapattu": "605105",
    "Mangalam": "605004",
    "Mannadipet": "605501",
    "Mettupalayam": "605009",
    "MG Road": "605001",
    "Mission Street": "605001",
    "Moolakulam": "605010",
    "Mudaliarpet": "605004",
    "Murungapakkam": "605004",
    "Nallambal": "605006",
    "Natesan Nagar": "605005",
    "Nellithope": "605005",
    "Olandai Keerapalayam": "605010",
    "Orleanpet": "605001",
    "Osudu": "605110",
    "Ousteri": "605009",
    "Pillaiyarkuppam (Ariyankuppam)": "605007",
    "Pillaiyarkuppam (Bahour)": "605101",
    "Pondicherry University": "605014",
    "Pudhu Nagar": "605010",
    "Rainbow Nagar": "605011",
    "Reddiarpalayam": "605010",
    "Sanjay Gandhi Nagar": "605005",
    "Saram": "605013",
    "Seedhankuppam": "605005",
    "Seliamedu": "605106",
    "Sita Nagar": "605013",
    "Solai Nagar": "605010",
    "Sri Aurobindo Ashram": "605002",
    "Subbaiah Salai": "605001",
    "Sultanpet": "605003",
    "Thavalakuppam": "605009",
    "Thengaithittu": "605004",
    "Thondamanatham": "605502",
    "Thirubuvanai": "605107",
    "Thirukanchi": "605009",
    "Thiruthani": "605006",
    "Vaithikuppam": "605012",
    "Vadhanur": "605111",
    "Veerampattinam": "605007",
    "Velrampet": "605004",
    "Villianur": "605110",
    "White Town": "605001"
    
  };

  const handleAreaSelect = (selectedArea) => {
    const pincode = areaPincodeMap[selectedArea];
    setFormData((prev) => ({
      ...prev,
      area: selectedArea,
      pinCode: pincode,
    }));
    setShowAreaSuggestions(false);
    setAreaSuggestions([]);
  };

  const handlePincodeSelect = (selectedArea) => {
    const pincode = areaPincodeMap[selectedArea];
    setFormData((prev) => ({
      ...prev,
      area: selectedArea,
      pinCode: pincode,
    }));
    setShowPincodeSuggestions(false);
    setPincodeSuggestions([]);
  };

  const requiredFieldsByStep = {
    1: ['propertyMode', 'propertyType' , 'price'],
    2: ['totalArea', 'areaUnit'],
    4: ['salesType', 'postedBy'],
    6: ['state', 'city', 'area', 'pinCode'],
  };
  const stepRefs = {
    1: useRef(null),
    2: useRef(null),
    3: useRef(null),
    4: useRef(null),
    5: useRef(null),
    6: useRef(null),
      7: useRef(null), 

  };
  const scrollToStep = (step) => {
    const element = stepRefs[step]?.current;
    const scrollContainer = document.querySelector(".flex-grow-1.mx-auto");  
  
    if (element && scrollContainer) {
      const offsetTop = element.offsetTop;
      const offset = 144;  
  
      scrollContainer.scrollTo({
        top: offsetTop - offset,
        behavior: "smooth",
      });
    }
  };
  
  


  const scrollFieldContentUp = () => {
    const fieldContent = document.querySelector(".fieldcontent");
    if (fieldContent) {
      fieldContent.scrollIntoView({
        behavior: "smooth",
        block: "start",  
      });
    }
  }; 
   const handleShowMore = async (e) => {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const stepRequiredFields = requiredFieldsByStep[currentStep] || [];
  const missing = stepRequiredFields.filter(field => !formData[field]);

  if (missing.length > 0) {
    setMissingFields(missing);
    setShowPopup(true);

    const firstMissingField = missing[0];
    const fieldRef = formRefs[firstMissingField];

    if (fieldRef?.current) {
      fieldRef.current.focus();
      setTimeout(() => {
        fieldRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }

    return;
  }

  if (!ppcId) {
    alert("PPC-ID is required. Please refresh or try again.");
    return;
  }

  const formDataToSend = new FormData();
  formDataToSend.append("ppcId", ppcId);
  Object.keys(formData).forEach((key) => {
    formDataToSend.append(key, formData[key]);
  });
  photos.forEach((photo) => {
    formDataToSend.append("photos", photo);
  });
  videos.forEach(file => {
    formDataToSend.append("video", file);
  });

  try {
    setIsUploading(true);  
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/update-property`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data', 
      },
    });
    setCurrentStep(currentStep + 1);
    scrollFieldContentUp();
  } catch (error) {
    console.error("Upload error", error);
  } finally {
    setIsUploading(false);  
  }
};

 
  useEffect(() => {
    scrollToStep(currentStep);
  }, [currentStep]);

const handleCombinedClick = async (e) => {
  e.preventDefault();  
  await handleAnim();  
  handleSubmit(e);     
};
const hiddenPropertyTypes = ['Plot', 'Land', 'Agricultural Land'];

const fieldsToHideForPlot = [
  'furnished',
  'lift',
  'attachedBathrooms',
  'western',
   'carParking',
  'bedrooms',
  'kitchen',
  'kitchenType',
  'balconies',
  'floorNo',
];

const shouldHideField = (fieldName) =>
  hiddenPropertyTypes.includes(formData.propertyType) &&
  fieldsToHideForPlot.includes(fieldName);

  const filteredDropdownFieldOrder = dropdownFieldOrder.filter(
  (field) => !shouldHideField(field)
);

const step3Fields = [
  'bedrooms',
  'kitchen',
  'kitchenType',
  'balconies',
  'floorNo'
];

const isStep3AllFieldsHidden = step3Fields.every(shouldHideField);

useEffect(() => {
  if (currentStep === 3 && isStep3AllFieldsHidden) {
    setCurrentStep(4);  
  }
}, [currentStep, formData.propertyType]);
 const handleAnim = () => {
  return new Promise((resolve) => {
    setIsProcessing(true);
    setIsSuccess(false);
    setShowCheckmark(false);

     setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

       setTimeout(() => {
        setShowCheckmark(true);  

         setTimeout(() => {
          resolve(); 
        }, 2000);
      }, 100);  
    }, 2000);  
  });
};

 
const handleSubmit = async (e) => {
  e.preventDefault();

  // Property description is now optional

  const finalFormData = {
    ...formData,
    ownerName: formData.ownerName.trim() === "" ? "Owner" : formData.ownerName,
  };

  if (!ppcId) {
    setMessage({ text: "PPC-ID is required. Please refresh or try again.", type: "error" });
    return;
  }

  // Determine status based on validation
  const requiredFieldsForAddProps = [
    { name: 'propertyMode', label: 'Property Mode' },
    { name: 'propertyType', label: 'Property Type' },
    { name: 'price', label: 'Price' },
    { name: 'totalArea', label: 'Total Area' },
    { name: 'areaUnit', label: 'Area Unit' },
    { name: 'postedBy', label: 'Posted By' },
    { name: 'salesType', label: 'Sales Type' },
    { name: 'state', label: 'State' },
    { name: 'city', label: 'City' },
    { name: 'area', label: 'Area' },
    { name: 'pinCode', label: 'Pin Code' },
  ];

  const validationErrors = [];
  requiredFieldsForAddProps.forEach(field => {
    if (!finalFormData[field.name] || finalFormData[field.name].toString().trim() === '') {
      validationErrors.push(field.label);
    }
  });

  // Show validation popup if there are missing fields
  if (validationErrors.length > 0) {
    setMissingFields(validationErrors);
    setShowPopup(true);
    return;
  }

  const status = validationErrors.length === 0 ? 'complete' : 'incomplete';

  const formDataToSend = new FormData();
  formDataToSend.append("ppcId", ppcId);
  Object.keys(finalFormData).forEach((key) => {
    formDataToSend.append(key, finalFormData[key]);
  });

  // Append status
  formDataToSend.append('status', status);

  photos.forEach((photo) => {
    formDataToSend.append("photos", photo);
  });
  videos.forEach(file => {
    formDataToSend.append("video", file);
  });

  try {
    setIsUploading(true);  
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/update-property`,
      formDataToSend,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setMessage({ text: "Property Added successfully!", type: "success", image: SuccessIcon });

    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 5000);

    setShowConfirmation(true);
  } catch (error) {
    setMessage({
      text: error.response?.data?.message || "Error saving property data.",
      type: "error"
    });
  } finally {
    setIsUploading(false);  
  }
};

const confirmStepSubmit = () => {
  setShowConfirmation(false);
  // Navigate to pricing plans with phoneNumber and ppcId
  navigate("/pricing-plans", {
    state: {
      phoneNumber: phoneNumber,
      ppcId: ppcId,
    },
  });
};

const cancelStepSubmit = () => {
  setShowConfirmation(false);
  // Navigate to MyProperty after canceling payment
  navigate("/myproperty", {
    state: {
      phoneNumber: phoneNumber,
    },
  });
};


const confirmAndProceed = async () => {
  setShowConfirmation(false);  

  setStep("submitted");        

  await handleAnim();         
  handleSubmit(pendingSubmitEvent);  
};


 

const fieldIcons = {
   phoneNumber: <FaPhone color="#2F747F" />,
  alternatePhone: <FaPhone color="#2F747F" />,
  email: <FaEnvelope color="#2F747F" />,
  bestTimeToCall: <MdSchedule color="#2F747F" />,
  
   rentalPropertyAddress: <MdLocationCity color="#2F747F" />,
  country: <BiWorld color="#2F747F" />,
  state: <MdLocationCity color="#2F747F" />,
  city: <FaCity color="#2F747F" />,
  district: <FaRegAddressCard color="#2F747F" />,
  area: <MdLocationOn color="#2F747F" />,
  streetName: <RiLayoutLine color="#2F747F" />,
  doorNumber: <BiBuildingHouse color="#2F747F" />,
  nagar: <FaRegAddressCard color="#2F747F" />,

   ownerName: <FaUserAlt color="#2F747F" />,
  postedBy: <FaUserAlt color="#2F747F" />,
  ownership: <HiUserGroup color="#2F747F" />,

   propertyMode: <MdApproval color="#2F747F" />,
  propertyType: <MdOutlineOtherHouses color="#2F747F" />,
  propertyApproved: <BsFillHouseCheckFill color="#2F747F" />,
  propertyAge: <MdSchedule color="#2F747F" />,
  description: <BsTextareaT color="#2F747F" />,

   price: <FaRupeeSign color="#2F747F" />,
  bankLoan: <BsBank color="#2F747F" />,
  negotiation: <GiMoneyStack color="#2F747F" />,

   length: <MdStraighten color="#2F747F" />,
  breadth: <MdStraighten color="#2F747F" />,
  totalArea: <GiResize color="#2F747F" />,
  areaUnit: <FaChartArea color="#2F747F" />,

   bedrooms: <FaBed color="#2F747F" />,
  kitchen: <GiKitchenScale color="#2F747F" />,
  kitchenType: <GiKitchenScale color="#2F747F" />,
  balconies: <MdOutlineMeetingRoom color="#2F747F" />,
  floorNo: <BsBuildingsFill color="#2F747F" />,
   attachedBathrooms: <FaBath color="#2F747F" />,
  western: <FaToilet  color="#2F747F" />,

   facing: <TbArrowLeftRight color="#2F747F" />,
  salesMode: <GiGears color="#2F747F" />,
  salesType: <MdOutlineOtherHouses color="#2F747F" />,
  furnished: <FaHome color="#2F747F" />,
  lift: <BsBuildingsFill color="#2F747F" />,
  carParking: <FaCar color="#2F747F" />,
};

useEffect(() => {
  if (formData.length && formData.breadth) {
    const total = Number(formData.length) * Number(formData.breadth);
    setFormData(prev => ({
      ...prev,
      totalArea: total
    }));
  }
}, [formData.length, formData.breadth]);

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
   carParking: "Car Parking",
  rentalPropertyAddress: "Property Address",
  country: "Country",
  state: "State/Union Territory",
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
  // Special rendering for the description field (textarea + counter + validation)
  if (field === "description") {
    const descriptionCount = formData.description ? formData.description.length : 0;
    let counterColor = '#28a745'; // green
    if (descriptionCount >= 151 && descriptionCount <= 199) counterColor = '#ff9800';
    if (descriptionCount >= 200) counterColor = '#dc3545';

    return (
      <div data-field={field} className="description-field" style={{ position: 'relative' }}>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Enter property description (max 200 characters)"
          maxLength={200}
          rows={4}
          style={{ width: '100%', padding: '12px', borderRadius: 8, resize: 'vertical' }}
        />

        <div style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 12, color: counterColor }}>
          {descriptionCount} / 200
        </div>

        {/* Show max-length alert when reached */}
        {descriptionCount >= 200 && (
          <div style={{ marginTop: 8, color: '#dc3545', fontSize: 13 }}>
            Maximum 200 characters allowed.
          </div>
        )}

        {/* Custom popup for required validation or other description errors */}
        {message?.field === 'description' && message?.type === 'error' && message?.text && (
          <div style={{ marginTop: 8, background: '#fff5f5', border: '1px solid #ffd2d2', padding: '8px 10px', borderRadius: 8, color: '#b02a37' }}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

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
                  padding: '5px 5px 5px 30px',  
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

  toggleDropdown(field);  
  const currentIndex = filteredDropdownFieldOrder.indexOf(field);
if (currentIndex !== -1 && currentIndex < filteredDropdownFieldOrder.length - 1) {
  const nextField = filteredDropdownFieldOrder[currentIndex + 1];

  if (nonDropdownFields.includes(nextField)) {
     setTimeout(() => {
      const nextInput = document.querySelector(`[name="${nextField}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  } else {
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
                  {option}
                </li>
              ))}
            </ul>

            <div className="d-flex justify-content-end">
              <button
                className="me-1"
                type="button"
               onClick={() => {
    toggleDropdown(field);  
    const currentIndex = filteredDropdownFieldOrder.indexOf(field);
if (currentIndex > 0) {
  const prevField = filteredDropdownFieldOrder[currentIndex - 1];

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
      toggleDropdown(prevField);
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
  onClick={() => {
    toggleDropdown(field);  
    const currentIndex = filteredDropdownFieldOrder.indexOf(field);

if (currentIndex !== -1 && currentIndex < filteredDropdownFieldOrder.length - 1) {
  const nextField = filteredDropdownFieldOrder[currentIndex + 1];

  if (nonDropdownFields.includes(nextField)) {
    setTimeout(() => {
      const nextInput = document.querySelector(`[name="${nextField}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  } else {
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
                   background: '#EAEAF6',
                   cursor: 'pointer',
                   border: 'none',
                   color: '#0B57CF',
                   borderRadius: '10px',
                   padding: '5px 10px',
                   fontWeight: 500,
                   marginRight:"5px"
                 }}
>
  skip
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

            {[
              'negotiation',
              'ownership',
              'floorNo',
              'postedBy',
              'carParking',
              'bestTimeToCall',
            ].includes(field) && (
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid #ccc',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#555',
                    marginBottom: '8px',
                  }}
                >
                  Swipe through options to continue
                </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



const fields = [
  { name: "propertyMode", type: "select" },
  { name: "propertyType", type: "select" },
  { name: "price", type: "input" },
  { name: "propertyAge", type: "select" },
  { name: "bankLoan", type: "select" },
  { name: "negotiation", type: "select" },
  { name: "length", type: "input" },
  { name: "breadth", type: "input" },
  { name: "totalArea", type: "input" },
  { name: "ownership", type: "select" },
  { name: "bedrooms", type: "select" },
  { name: "kitchen", type: "select" },
  { name: "kitchenType", type: "select" },
  { name: "balconies", type: "select" },
  { name: "floorNo", type: "select" },
  { name: "areaUnit", type: "select" },
  { name: "propertyApproved", type: "select" },
  { name: "postedBy", type: "select" },
  { name: "facing", type: "select" },
  { name: "salesMode", type: "select" },
  { name: "salesType", type: "select" },
  { name: "description", type: "input" },
  { name: "furnished", type: "select" },
  { name: "lift", type: "select" },
  { name: "attachedBathrooms", type: "select" },
  { name: "western", type: "select" },
   { name: "carParking", type: "select" },
  { name: "rentalPropertyAddress", type: "input" },
  { name: "country", type: "input" },
  { name: "state", type: "select" },
  { name: "city", type: "input" },
  { name: "district", type: "input" },
  { name: "area", type: "input" },
  { name: "streetName", type: "input" },
  { name: "doorNumber", type: "input" },
  { name: "nagar", type: "input" },
  { name: "ownerName", type: "input" },
  { name: "email", type: "input" },
  { name: "phoneNumber", type: "input" },
  { name: "alternatePhone", type: "input" },
  { name: "bestTimeToCall", type: "select" },
];

const handleEdit = () => {
   setStep("form");  

};



  return (
    <Container fluid className="p-0 my-3 d-flex align-items-center justify-content-center" 
    style={{ width: "100%", overflowY: 'auto'
      ,    overflowX: 'hidden',   

    }}
    >
          <Row className="g-3 w-100">
          <Col lg={12} className="p-1 d-flex flex-column align-items-center justify-content-center">


{message.text && (
 <div
 style={{
   padding: "10px",
   backgroundColor:
     message.type === "success" ? "lightgreen" :
     message.type === "error" ? "lightcoral" :
     message.type === "warning" ? "khaki" :
     message.type === "info" ? "lightblue" :
     message.type === "update" ? "#d1ecf1" :
     message.type === "deleted" ? "#f8d7da" :
     "white",
   color: "black",
   margin: "10px 0",
   borderRadius: "5px",
   display: "flex",
   flexDirection: "column",   
   alignItems: "center",       
   textAlign: "center",       
   gap: "10px"
 }}
>
 {message.image && (
   <img
     src={message.image}
     alt="icon"
     style={{ width: "40px", height: "40px", objectFit: "contain" }}
   />
 )}
 <span>{message.text}</span>
</div>

)}

      {step === "submitted" ?  (
            <PricingPlans phoneNumber={phoneNumber}  ppcId={ppcId}
 onClose={handleCloseAddForm}/>
    ) : step === "form" ?  (
<form className="p-2 w-100" onSubmit={handleSubmit} style={{ fontFamily: "Inter, sans-serif"}}>
{isUploading && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',  
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,  
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        borderRadius: '10px',
        color: 'blue',
        fontWeight: 'bold',
        fontSize: '18px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
      }}
    >
      Please wait, processing your data...
    </div>
  </div>
)}


<h4 style={{ color: "rgb(10, 10, 10)", fontWeight: "bold", marginBottom: "10px" }}>Property Management</h4>             

        <p className="p-3" style={{ color: "white", backgroundColor: "rgb(47,116,127)" }}>PPC-ID: {ppcId}</p>
                        <h3 style={{ color: "rgb(47,116,127)", fontSize: "24px", marginBottom: "10px" }}> Property Images  </h3>

  <div className="form-group photo-upload-container mt-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handlePhotoUpload}
        name="photos"
        className="photo-upload-input"
        style={{ display: "none" }}
      />
      <label className="photo-upload-label fw-normal m-0">
        <button className="m-0 p-0"
          type="button"
          onClick={handleClick}
          style={{
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color:"black"
          }}
        >
        
                <MdAddPhotoAlternate
      style={{
        color: 'white',
        backgroundColor: '#2e86e4',
        padding: '5px',
        fontSize: '30px',
        borderRadius: '50%',
        marginRight: '5px',
      }}
    />
  
   {photoloading ? (
  <>
    <Spinner
      animation="border"
      size="sm"
      style={{ color: "#2e86e4", marginRight: "5px" }}
    />
    <div>Uploading... {photoProgress}%</div>
  </>
) : photoUploadSuccess ? (
  <span style={{ color: "green" }}>✅ Successfully uploaded</span>
) : (
  "Upload Your Property Images"
)}
 </button>
      </label>
      
      {/* Compression Progress Bar - Below Button */}
      {photoloading && compressionStatus && (
        <div style={{ 
          marginTop: '16px',
          backgroundColor: '#E3F2FD',
          padding: '14px 16px',
          borderRadius: '8px',
          border: '1px solid #BBDEFB'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#1976D2'
          }}>
            <span style={{ fontSize: '20px' }}>📷</span>
            {compressionStatus === 'Finalizing...' ? 'All images compressed and ready!' : compressionStatus}
          </div>
          <div style={{ 
            width: '100%', 
            height: '7px', 
            backgroundColor: '#BBDEFB', 
            borderRadius: '4px', 
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${photoProgress}%`,
              backgroundColor: '#1976D2',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#1565C0',
            fontWeight: '500'
          }}>
            {photoProgress}%
          </div>
        </div>
      )}
    </div>
        {photos.length > 0 && (
          <div className="uploaded-photos position-relative">
            <h4>Uploaded Photos</h4>
            <div className="uploaded-photos-grid" >
              {photos.map((photo, index) => (
                <div key={index} className="uploaded-photo-item">
                  <input
                    type="radio"
                    name="selectedPhoto"
                    className="position-absolute"
                    style={{ top: '-10px' }}

                    checked={selectedPhotoIndex === index}
                    onChange={() => handlePhotoSelect(index)}
                  />
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="Uploaded"
                    className="uploaded-photo m-2"
                  />
                  <button 
                  style={{border:"none"}}
            className="position-absolute top-0 end-0 btn m-0 p-1"
    onClick={() => removePhoto(index)}
                  >
                    <IoCloseCircle size={20} color="#F22952"/>

                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

   

   <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>
  Property Videos
</h4>

<div className="form-group">


  <input
  type="file"
  name="video"   
  multiple
  accept="video/*"
  onChange={handleVideoChange}
      id="videoUpload"
    className="d-none"

/>

  <label htmlFor="videoUpload" className="file-upload-label fw-normal">
    <span className="pt-5">
      <FaFileVideo
        style={{
          color: 'white',
          backgroundColor: '#2e86e4',
          padding: '5px',
          fontSize: '30px',
          marginRight: '5px',
        }}
      />
 

{videoloading ? (
  <>
    <Spinner
      animation="border"
      size="sm"
      style={{ color: "#2e86e4", marginRight: "5px" }}
    />
    Uploading... {progress}%
  </>
) : uploadSuccess ? (
  <span style={{ color: "green" }}>✅ Successfully uploaded</span>
) : videoError ? (
  <span style={{ color: "red", fontSize:"11px" }}>{videoError}</span>   
) : (
  "Upload Property Videosss"
)}
    </span>
  </label>

  {/* Video Compression Progress Bar */}
  {isVideoCompressing && (
    <div style={{
      marginTop: '15px',
      padding: '16px',
      backgroundColor: '#fff3e0',
      borderRadius: '8px',
      border: '1px solid #ffb74d'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <FaFileVideo
          style={{
            color: '#f57c00',
            fontSize: '20px',
            marginRight: '8px'
          }}
        />
        <span style={{
          color: '#f57c00',
          fontWeight: '600',
          fontSize: '15px'
        }}>
          {videoCompressionProgress === 100
            ? 'Video compressed and ready!'
            : `Compressing... ${videoCompressionProgress}%`}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#ffb74d',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${videoCompressionProgress}%`,
          backgroundColor: '#f57c00',
          transition: 'width 0.3s ease',
          borderRadius: '3px'
        }}></div>
      </div>
      <div style={{
        marginTop: '8px',
        color: '#666',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {compressingVideoName && `Compressing ${compressingVideoName}...`}
      </div>
    </div>
  )}

   {videos.length > 0 && (
    <div className="selected-video-container mt-3">
      <h5 className="text-start">Selected Videos:</h5>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {videos.map((video, index) => (
          <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
            <video width="200" height="200" controls>
              <source src={URL.createObjectURL(video)} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <Button
              variant="danger"
              onClick={() => removeVideo(index)}
              style={{ border: 'none', background: "transparent" }}
              className="position-absolute top-0 end-0 m-1 p-1"
            >
              <IoCloseCircle size={20} color="#F22952" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )}
</div>



{currentStep >= 1 && (
        <div 
         >
  <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property OverView  </h4>             

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
            required
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
            ref={formRefs.propertyMode} 

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

  <div className="form-group">
    <label style={{ width: '100%'}}>
<label>Property Type <span style={{ color: 'red' }}>* </span> </label>
      <div style={{ display: "flex", alignItems: "center"}}>
        <div style={{ flex: "1" }}>
          <select
            name="propertyType"
            value={formData.propertyType || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} 
            required
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
            ref={formRefs.propertyType} 
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
            {formData.propertyType || "Select Property Type"}
          </button>

          {renderDropdown("propertyType")}
        </div>
      </div>
    </label>
  </div>
  
  <div className="form-group">
  <label>Price <span style={{ color: 'red' }}>* </span> </label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaRupeeSign className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="number"
      name="price"
      value={formData.price}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Price"
      required
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  {priceInWords && (
        <p style={{ fontSize: "14px", color: "#2F747F", marginTop: "5px" }}>
          {priceInWords}
        </p>
      )}
  </div>

  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Negotiation  </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="negotiation"
            value={formData.negotiation || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.negotiation || <FaHome />}
            </span>
            {formData.negotiation || "Selectnegotiation"}
          </button>

          {renderDropdown("negotiation")}
        </div>
      </div>
    </label>
  </div>


  </div>
 )}


{currentStep >= 2 && (
        <div className="fieldcontent p-0" ref={stepRefs[2]}>
   <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}> Basic Property Info  </h4>             

 
   <div className="form-group">
  <label>Length</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <AiOutlineColumnHeight className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="number"
      name="length"
      value={formData.length}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Length"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
   <div className="form-group">
  <label>Breadth:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <AiOutlineColumnWidth className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="number"
      name="breadth"
      value={formData.breadth}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Breadth"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>
   <div className="form-group">
  <label>Total Area: <span style={{ color: 'red' }}>* </span> </label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <RiLayoutLine className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="number"
      name="totalArea"
      value={formData.totalArea}
 
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Total Area"
      required
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>

     <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Area Unit <span style={{ color: 'red' }}>* </span> </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="areaUnit"
            value={formData.areaUnit || ""}
            onChange={handleFieldChange}
            className="form-control"
            required
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
            ref={formRefs.areaUnit} 

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

   <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Ownership </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="ownership"
            value={formData.ownership || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.ownership || <FaHome />}
            </span>
            {formData.ownership || "Select ownership"}
          </button>

          {renderDropdown("ownership")}
        </div>
      </div>
    </label>
  </div>

  </div>
 )}


{currentStep >= 3 && (
          <div className="fieldcontent p-0" ref={stepRefs[3]}>
   {!shouldHideField("bedrooms") && (
    <>
  <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property details  </h4>             

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
              {fieldIcons.bedrooms || <FaHome />}
            </span>
            {formData.bedrooms || "Select bedrooms"}
          </button>

          {renderDropdown("bedrooms")}
        </div>
      </div>
    </label>
  </div>
  </>
  )}
    {!shouldHideField("kitchen") && (
  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>kitchen </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="kitchen"
            value={formData.kitchen || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.kitchen || <FaHome />}
            </span>
            {formData.kitchen || "Select kitchen"}
          </button>

          {renderDropdown("kitchen")}
        </div>
      </div>
    </label>
  </div>
   )}
   
    {!shouldHideField("balconies") && (
    <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Balconies </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="balconies"
            value={formData.balconies || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.balconies || <FaHome />}
            </span>
            {formData.balconies || "Select balconies"}
          </button>

          {renderDropdown("balconies")}
        </div>
      </div>
    </label>
  </div>
  )}
     {!shouldHideField("floorNo") && (
    <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>FloorNo </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="floorNo"
            value={formData.floorNo || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.floorNo || <FaHome />}
            </span>
            {formData.floorNo || "Select floorNo"}
          </button>

          {renderDropdown("floorNo")}
        </div>
      </div>
    </label>
  </div>
  )}
  </div>
 )}
  

{currentStep >= 4 && (
        <div className="fieldcontent p-0" ref={stepRefs[4]}>

<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Other Details  </h4>             

 
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
              {fieldIcons.bankLoan || <FaHome />}
            </span>
            {formData.bankLoan || "Select Bank Loan"}
          </button>

          {renderDropdown("bankLoan")}
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
    <label>Sales Mode</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="salesMode"
            value={formData.salesMode || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.salesMode || <FaHome />}
            </span>
            {formData.salesMode || "Select salesMode"}
          </button>

          {renderDropdown("salesMode")}
        </div>
      </div>
    </label>
  </div>
    <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Sale Type <span style={{ color: 'red' }}>* </span></label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="salesType"
            value={formData.salesType || ""}
            onChange={handleFieldChange}
            className="form-control"
            required
            style={{ display: "none" }} 
          >
            <option value="">Select salesType</option>
            {dataList.salesType?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            ref={formRefs.salesType}
            onClick={() => toggleDropdown("salesType")}
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
              {fieldIcons.salesType || <FaHome />}
            </span>
            {formData.salesType || "Select salesType"}
          </button>

          {renderDropdown("salesType")}
        </div>
      </div>
    </label>
  </div>
    
   <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>PostedBy <span style={{ color: 'red' }}>* </span> </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="postedBy"

            value={formData.postedBy || ""}
            onChange={handleFieldChange}
            className="form-control"
            required
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
            ref={formRefs.postedBy} 

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
              {fieldIcons.postedBy || <FaHome />}
            </span>
            {formData.postedBy || "Select postedBy"}
          </button>

          {renderDropdown("postedBy")}
        </div>
      </div>
    </label>
  </div>

  </div>
)} 



{currentStep >= 5 && (
        <div className="fieldcontent p-0" ref={stepRefs[5]}>
<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property Description   </h4>             

<div className="form-group">
  <label>Description</label>
  {renderDropdown("description")}
</div>


   {!shouldHideField("furnished") && (
  <div className="form-group">
    <label style={{width:"100%"}}>
    <label>Furnished</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="furnished"
            value={formData.furnished || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.furnished || <FaHome />}
            </span>
            {formData.furnished || "Select furnished"}
          </button>

          {renderDropdown("furnished")}
        </div>
      </div>
    </label>
  </div>
  )}
     {!shouldHideField("lift") && (
    <div className="form-group">
    <label style={{ width: '100%'}}>
      <label>Lift</label>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="lift"
            value={formData.lift || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.lift || <FaHome />}
            </span>
            {formData.lift || "Select lift"}
          </button>

          {renderDropdown("lift")}
        </div>
      </div>
    </label>
  </div>
)}
       {!shouldHideField("attachedBathrooms") && (
      <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Attached Bathrooms</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="attachedBathrooms"
            value={formData.attachedBathrooms || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.attachedBathrooms || <FaHome />}
            </span>
            {formData.attachedBathrooms || "Select attachedBathrooms"}
          </button>

          {renderDropdown("attachedBathrooms")}
        </div>
      </div>
    </label>
  </div>
  )}
     {!shouldHideField("western") && (
    <div className="form-group">

    <label style={{ width: '100%'}}>
    <label>Western</label>

      <div style={{ display: "flex", alignItems: "center"}}>
        <div style={{ flex: "1" }}>
          <select
            name="western"
            value={formData.western || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.western || <FaHome />}
            </span>
            {formData.western || "Select western"}
          </button>

          {renderDropdown("western")}
        </div>
      </div>
    </label>
  </div>
  )}
   
{!shouldHideField("carParking") && (
    <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Car Parking</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="carParking"
            value={formData.carParking || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.carParking || <FaHome />}
            </span>
            {formData.carParking || "Select carParking"}
          </button>

          {renderDropdown("carParking")}
        </div>
      </div>
    </label>
  </div>
)}
  </div>
 )} 




   {currentStep >= 6 && (
        <div className="fieldcontent p-0" ref={stepRefs[6]}>

<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property Address   </h4>             


<div className="form-group">
 
<div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background:"#fff"}}>
    <FcSearch  className="input-icon" 
    style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
    name="YourProperty"
      ref={inputRef}
      id="pac-input"
      className="form-input m-0"
      placeholder="Search Enter Your Property"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
<div
  ref={mapRef}
  id="map"
  style={{ height: "200px", width: "100%" }}
></div>
<div className="mt-3 w-100 d-flex gap-2 mb-2">

  <input
  ref={coordRef}
  placeholder="Enter Your Property Coordinates"
  className="form-control m-0"
    onChange={(e) => setCoordinateInput(e.target.value)}

 />
<button className="btn btn-primary m-0 border-0"
     style={{ whiteSpace: 'nowrap', background:"#6CBAAF" ,  }}
 onClick={() => handleLatLngAuto(coordinateInput)}>
  Go
</button>

  <button
    onClick={handleClear}
    type="button"
    className="btn btn-primary m-0 border-0"
    style={{ whiteSpace: 'nowrap', background:"#B1D3C0" ,  }}
  >
    <MdOutlineClose color="white"/>
  </button>

</div>


<p className="mt-1" style={{color:"#0597FF" , fontSize:"13px"}}>IF YOU CAN'T FIND THE ADDRESS PLEASE ENTER MANUALLY</p>
  

  <div className="form-group">
  <label>country:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <BiWorld className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="country"
      value={formData.country}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Country"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>
  
 
<div className="form-group">
  <label style={{width:'100%'}}>
    <label>State:<span style={{ color: 'red', marginLeft: '4px' }}>*</span></label>
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ flex: "1" }}>
        <select
          name="state"
          value={formData.state || ""}
          onChange={handleFieldChange}
          className="form-control"
          style={{ display: "none" }} 
        >
          <option value="">Select State</option>
          {indianStatesAndUT?.map((option, index) => (
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
            {fieldIcons.state || <MdLocationCity />}
          </span>
          {formData.state || "Select State/Union Territory"}
        </button>

        {renderDropdown("state")}
      </div>
    </div>
  </label>
</div>
 
<div className="form-group">
  <label>City:<span style={{ color: 'red', marginLeft: '4px' }}>*</span></label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaCity className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="city"
      value={formData.city}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="City"
      required
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

  <div className="form-group" >
    <label style={{width:'100%'}}>
    <label>District</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="district"
            value={formData.district || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} 
          >
            <option value="">Select District</option>
            {dataList.district?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            className="m-0"
            type="button"
            onClick={() => toggleDropdown("district")}
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
              {fieldIcons.district || <FaHome />}
            </span>
            {formData.district || "Select District"}
          </button>

          {renderDropdown("district")}
        </div>
      </div>
    </label>
  </div>

   <div className="form-group" style={{ position: 'relative' }}>
  <label>Area:<span style={{ color: 'red', marginLeft: '4px' }}>*</span></label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <MdLocationOn className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="area"
      value={formData.area}
      onChange={handleFieldChange}
      onFocus={() => formData.area && setShowAreaSuggestions(true)}
      onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)}
      className="form-input m-0"
      placeholder="Area"
      required
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  {showAreaSuggestions && areaSuggestions.length > 0 && (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      border: '1px solid #2F747F',
      borderTop: 'none',
      borderRadius: '0 0 5px 5px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {areaSuggestions.map((suggestion, index) => (
        <div
          key={index}
          onClick={() => handleAreaSelect(suggestion)}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
            borderBottom: '1px solid #eee',
            color: '#2F747F',
            fontSize: '14px',
            transition: 'backgroundColor 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e8f4f8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : '#fff'}
        >
          <div style={{ fontWeight: '500' }}>{suggestion}</div>
          <div style={{ fontSize: '12px', color: '#7a7a7a' }}>Pincode: {areaPincodeMap[suggestion]}</div>
        </div>
      ))}
    </div>
  )}
</div>
   <div className="form-group">
  <label>Nagar:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaMapPin className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="nagar"
      value={formData.nagar}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Nagar"
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
      value={formData.streetName}
      onChange={handleFieldChange}
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
      type="number"
      name="doorNumber"
      value={formData.doorNumber}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Door Number"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>


<div className="form-group" style={{ position: 'relative' }}>
  <label>Pin Code:<span style={{ color: 'red', marginLeft: '4px' }}>*</span></label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <TbMapPinCode  className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="pinCode"
      value={formData.pinCode}
      onChange={handleFieldChange}
      onFocus={() => formData.pinCode && setShowPincodeSuggestions(true)}
      onBlur={() => setTimeout(() => setShowPincodeSuggestions(false), 200)}
      className="form-input m-0"
      placeholder="Pin Code"
      required
      autoComplete="off"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      border: '1px solid #2F747F',
      borderTop: 'none',
      borderRadius: '0 0 5px 5px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginTop: '-5px'
    }}>
      {pincodeSuggestions.map((suggestion, index) => (
        <div
          key={index}
          onClick={() => handlePincodeSelect(suggestion)}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
            borderBottom: '1px solid #eee',
            color: '#2F747F',
            fontSize: '14px',
            transition: 'backgroundColor 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e8f4f8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : '#fff'}
        >
          <div style={{ fontWeight: '500' }}>{suggestion}</div>
          <div style={{ fontSize: '12px', color: '#7a7a7a' }}>Pincode: {areaPincodeMap[suggestion]}</div>
        </div>
      ))}
    </div>
  )}
</div>
<div className="form-group">
  <label>Location Coordinates:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <TbWorldLongitude  className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="locationCoordinates"
      value={formData.locationCoordinates}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Location Coordinates"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Owner Details   </h4>             
 
<div className="form-group">
  <label>Owner Name:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaUserAlt className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="ownerName"
      value={formData.ownerName}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Owner Name"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

   <div className="form-group">
  <label>Email:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaEnvelope className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Email"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
 
<div className="form-group">
<label>Phone Number:</label>

  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaPhone className="input-icon" style={{ color: '#2F747F', marginLeft:"10px" }} />
    
     
    <div style={{ flex: '0 0 10%' }}>
  <label>
    <select
      name="countryCode"
      value={"+91"}
      readOnly
      onChange={handleFieldChange}
      className="form-control mt-1 pt-2"
      style={{ width: '100%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    >
      {countryCodes.map((item, index) => (
        <option key={index} value={item.code}>
          {item.code} {item.country}
        </option>
      ))}
    </select>
  </label>
</div>


    <input
      type="text"
      name="phoneNumber"
      value={phoneNumber}
      readOnly
      className="form-input m-0"
      placeholder="Phone Number"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
 
<div className="form-group">
<label>Alternate number:</label>

  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaPhone className="input-icon" style={{ color: '#2F747F', marginLeft:"10px" }} />
    
    <div style={{ flex: '0 1 10%' }}>
      <label>
        <select
          name="countryCode"
          value={formData.countryCode || ""}
          onChange={handleFieldChange}
          className="form-control m-0"
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
        >
          <option value="">Select Country Code</option>
          {countryCodes.map((item, index) => (
            <option key={index} value={item.code}>
              {item.code} {item.country}
            </option>
          ))}
        </select>
      </label>
    </div>

    <input
      type="number"
      name="alternatePhone"
      value={formData.alternatePhone}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="Alternate Phone Number"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
 
  <div className="form-group" >
    <label style={{width:'100%'}}>
    <label>Best Time To Call</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="bestTimeToCall"
            value={formData.bestTimeToCall || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.bestTimeToCall || <FaHome />}
            </span>
            {formData.bestTimeToCall || "Select bestTimeToCall"}
          </button>

          {renderDropdown("bestTimeToCall")}
        </div>
      </div>
    </label>
  </div>
  </div>
)}



      {currentStep <= 6 && (

<div className="d-flex justify-content-center align-items-center">
  <style>
    {`
 

      @keyframes pulseIcon {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.15);
        }
        100% {
          transform: scale(1);
        }
      }
    `}
  </style>

  <div
    {...handlers}
 
    style={{
width: window.innerWidth < 450 ? '80%' : '70%' ,
      height: '50px',
      borderRadius: '50px',
      background: swiped
        ? 'linear-gradient(to right, #1dd1a1, #10ac84)'
        : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: swiped ? 'flex-end' : 'flex-start',
      padding: '5px',
      cursor: 'pointer',
      transition: 'all 0.4s ease-in-out',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      position: 'relative',
      overflow: 'hidden',

    }}
  >

<span className={`btn-shine ${swiped ? 'active' : ''}`}
style={{ userSelect: 'none' }}>
  Swipe To Save & Continue
</span>

<style jsx>{`
  .btn-shine {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 12px 48px;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    background: linear-gradient(
      90deg,
      #4d4d4d 0%,
      #4d4d4d 40%,
      #ffffff 50%,
      #4d4d4d 60%,
      #4d4d4d 100%
    );
    background-size: 200% auto;
    color: #fff;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 2s linear infinite;
    text-decoration: none;
  }

  

@media (max-width: 450px) {
    .btn-shine {
      font-size: 13px;
}
}

  @keyframes shine {
    0% {
          background-position: 100% center;

    }
    100% {
          background-position: -100% center;

    }
  }
`}</style>

    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        height: '40px',
        width: '40px',
        borderRadius: '50%',
        backgroundColor: swiped ? '#fff' : '#006993',
        transition: 'all 0.4s ease-in-out',
        animation: swiped ? 'pulseIcon 1.5s infinite' : 'none',
      }}
    >
      <FaArrowRight
        style={{
          color: swiped ? '#1dd1a1' : '#fff',
          fontSize: '20px',
          margin: 'auto',
          transition: 'all 0.4s ease-in-out',
          animation: 'moveLeftRight 1s infinite',

        }}
      />


    </div>
            <style jsx>{`
    @keyframes moveLeftRight {
      0% {
        transform: translateX(0);
        color: #ffffff;
      }
      50% {
        transform: translateX(8px);
       }
      100% {
        transform: translateX(0);
        color: #ffffff;
      }
    }
  `}</style>
  </div>
</div>
)}

 
               {currentStep > 6 && (
                  <div className="w-100" ref={stepRefs[7]}>

                <Button className="w-100"
                  type="submit"
                  style={{ marginTop: '15px', backgroundColor: "rgb(47,116,127)" }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#029bb3"; 
                    e.target.style.fontWeight = 600; 
                    e.target.style.transition = "background 0.3s ease"; 
          
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#2F747F"; 
                    e.target.style.fontWeight = 400; 
          
                  }}
                  onClick={handlePreview}
                >
                  PreView
                </Button>
                </div>
           )} 
{showPopup && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1509,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.3s ease-in-out',
  }}>
    <div style={{
      backgroundColor: '#FFF5F7',
      width: '90%',
      maxWidth: '420px',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'popupOpen 0.3s ease-in-out',
      position: 'relative',
    }}>
      <button
        type="button"
        onClick={() => setShowPopup(false)}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#999',
          padding: '0',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>
      <h5 style={{
        color: '#E84C5D',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '20px',
        marginTop: '0'
      }}>
        Please complete required fields:
      </h5>
      <ul style={{
        listStyle: 'none',
        padding: '0',
        margin: '0 0 20px 0'
      }}>
        {missingFields.map((field, index) => (
          <li key={index} style={{
            color: '#E84C5D',
            fontSize: '14px',
            marginBottom: '10px',
            paddingLeft: '20px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              left: '0',
              top: '0'
            }}>•</span>
            {fieldLabels[field] || field} is required
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setShowPopup(false)}
        style={{
          backgroundColor: '#E84C5D',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

      </form>
      
      ) :  (

<div ref={previewRef} className="preview-section w-100 ">
<div className="mb-4">
      
       <div className="preview-section row d-flex align-items-center justify-content-center">
       {photos.length > 0 || video ? (
         <Swiper navigation={{
          prevEl: ".swiper-button-prev-custom",
          nextEl: ".swiper-button-next-custom",
        }}  modules={[Navigation]} className="swiper-container">
           {photos.map((photo, index) => (
             <SwiperSlide key={index}
             className="d-flex justify-content-center align-items-center"
             style={{
               height: "200px",
               width: "100%",
               overflow: "hidden",
               borderRadius: "8px",
               margin: "auto",
               boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
               cursor: "pointer",
             }}>
               <img
                 src={URL.createObjectURL(photo)}
                 alt={`Preview ${index + 1}`}
                 className="preview-image"
                 style={{
                   height: "100%",
                   width: "100%",
                   objectFit: "cover",
                 }}
               />
             </SwiperSlide>
           ))}
           {video && (
             <SwiperSlide>
               <div
             className="d-flex justify-content-center align-items-center"
             style={{
               height: "200px",
               width: "100%",
               overflow: "hidden",
               borderRadius: "8px",
               margin: "auto",
               boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
               cursor: "pointer",
             }}
           >
               <video controls className="preview-video" style={{ width: "100%", height: "200px", objectFit: "cover" }}>
                 <source src={URL.createObjectURL(video)} type={video.type} />
                 Your browser does not support the video tag.
               </video>
               </div>
             </SwiperSlide>
           )}
         </Swiper>
       ) : (
         <p>No media uploaded.</p>
       )}
    <style>
      {`
        .swiper-button-next, .swiper-button-prev {
          color: white !important;
          font-size: 24px !important;
        }
          
      `}
    </style>
    <div className="row d-flex align-items-center w-100">
    <div className="d-flex col-12 justify-content-end">  
      <button className="swiper-button-prev-custom m-1 w-30" style={{background:"#019988", border:"none" , color:"#fff"}}>❮</button>
      <button className="swiper-button-next-custom m-1 w-30"style={{background:"#019988", border:"none", color:"#fff"}}>❯</button>
    </div>
  </div>
  </div>
  </div>

<div className="row w-100"
 style={{paddingLeft:"10px", paddingRight:"10px"}}
 >
<p className="m-0" style={{
        color: "#4F4B7E",
        fontWeight: 'bold',
        fontSize: "26px"
      }}>
        <FaRupeeSign size={26} /> {formData.price ? Number(formData.price).toLocaleString('en-IN') : 'N/A'}
    
        <span style={{ fontSize: '14px', color: "#30747F", marginLeft: "10px" }}>
           Negotiation: {formData.negotiation || "N/A"}
        </span>
      </p>
      {priceInWords && (
            <p style={{ fontSize: "14px", color: "#2F747F", marginTop: "5px" }}>
              {priceInWords}
            </p>
 )}
{isUploading && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',  
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,  
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        borderRadius: '10px',
        color: 'blue',
        fontWeight: 'bold',
        fontSize: '18px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
      }}
    >
      Please wait, processing your data...
    </div>
  </div>
)}

{propertyDetailsList.map((detail, index) => {
   if (detail.heading) {
    return (
      <div key={index} className="col-12">
        <h4
          className="m-0 fw-bold"
          style={{ color: "#000000", fontFamily: "Inter, sans-serif", fontSize: "16px" }}
        >
          {detail.label}
        </h4>
      </div>
    );
  }

   const fieldLabelToKeyMap = {
    "Furnished": "furnished",
    "Lift": "lift",
    "attached": "attachedBathrooms",
    "western": "western",
    "Floor No": "floorNo",
    "Car Park": "carParking",
    "Bedrooms": "bedrooms",
    "Kitchen": "kitchen",
    "Balconies": "balconies",
     "Property Features": "propertyFeatures"
  };

  const fieldKey = fieldLabelToKeyMap[detail.label];
  if (shouldHideField(fieldKey)) return null;  



  const isDescription = detail.label === "Description";
  const isEmail = detail.label === "Email";   
  const columnClass = isDescription || isEmail ? "col-12" : "col-6";   

  return (
    <div key={index} className={columnClass}>
      <div
        className="d-flex align-items-center border-0 rounded p-1 mb-1"
        style={{
          width: "100%",
          height: isDescription ? "auto" : "55px",
          wordBreak: "break-word",
        }}
      >
        <span className="me-3 fs-3" style={{ color: "#30747F" }}>
          {detail.icon}
        </span>
        <div>
          {!isDescription && !isEmail && (
            <span className="mb-1" style={{ fontSize: "12px", color: "grey" }}>
              {detail.label || "N/A"}
            </span>
          )}
          <p
            className="mb-0 p-0"
            style={{
              fontSize: "14px",
              color: "grey",
              fontWeight: "600",
              padding: "10px",
              borderRadius: "5px",
              width: "100%",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "normal",
            }}
          >

    {detail.value
  ? typeof detail.value === "string"
    ? detail.value
    : JSON.stringify(detail.value)
  : "N/A"}
             </p>
        </div>
      </div>
    </div>
  );
})}


</div>

<div className="col-12"
        style={{paddingLeft:"10px" }}
>
        <div style={{ textAlign: "start", marginTop: "50px", position: "relative" }}>
       
  
            <style>
              {`
                @keyframes moveBar {
                  0% { background-position: 0 0; }
                  100% { background-position: 40px 0; }
                }
      
                @keyframes slideUp {
                  0% {
                    transform: translateY(20px);
                    opacity: 0;
                  }
                  100% {
                    transform: translateY(0);
                    opacity: 1;
                  }
                }
              `}
            </style>
          </div>
               <div style={{ display: 'flex', gap: '20px' }}>
            <button
   onClick={handleEdit}
  style={{
    fontWeight:500,
    border:"2px solid #1882F6",
    padding: "12px 20px",
    fontSize: "16px",
    borderRadius: "25px",
    color: "#1882F6",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    width: "80px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)",
  }}
>
  EDIT
 
</button>

        <button className="submit-button"
        onClick={handleCombinedClick}
              disabled={isProcessing}
                        style={{
                padding: "12px 20px",
                fontSize: "16px",
                borderRadius: "25px",
                 border: "none",
  background: 'linear-gradient(145deg, #4a90e2, #007bff)',
          color: "#ffffff",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                width: "150px",
                height: "40px",
                  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)',
              }}>
                   {isProcessing ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: "25px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `repeating-linear-gradient(
                90deg,
                rgba(0, 224, 198, 0.1) 0px,
                rgba(0, 224, 198, 0.1) 6px,
                rgba(0, 224, 198, 0.5) 6px,
                rgba(0, 224, 198, 0.5) 12px
              )`,
              animation: "moveBar 1s linear infinite",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
          }}
        >
          {showCheckmark ? (
      <div style={{
        display: 'flex',
        justifyContent: 'center',  
        alignItems: 'center',       
        height: '100px'           
      }}>
        <span style={{ animation: "slideUp 0.5s ease", fontSize: "20px" }}>
          <FaRegCircleCheck className="me-1"/> SUBMIT
        </span>
      </div>
          ) : (
            "SUBMIT"
          )}
        </div>
      )}
          <div className="shine-overlay"></div>
        </button>



      </div>
        {showConfirmation && (
  <div style={{    position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1509,
            animation: 'fadeIn 0.3s ease-in-out',}}>
    <div className="custom-popup"
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
      <h6 style={{ color: '#0B57CF', fontWeight: 500 }}>For instant Approval and Better Response, Pay Now</h6>
      <div className="d-flex justify-content-end gap-2 mt-4">
              <button className="btn btn-danger"   style={{
                  background: '#EAEAF6',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#0B57CF',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  fontWeight: 500,
                }} onClick={cancelStepSubmit}>Cancel</button>

            <button className="btn btn-success"  style={{
                  background: '#0B57CF',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '10px',
                }} onClick={confirmStepSubmit}>Yes, Continue</button>

      </div>
    </div>
  </div>
)}
      <style>
        {`
          .submit-button,
          .edit-button {
            position: relative;
            border: none;
            border-radius: 12px;
            padding: 12px 24px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            overflow: hidden;
          }

          .submit-button {
            background: linear-gradient(145deg, #4a90e2, #007bff);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3), 0 4px 6px rgba(0,0,0,0.1);
          }

          .edit-button {
            background: linear-gradient(145deg, #ffa94d, #ff7f0e);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3), 0 4px 6px rgba(0,0,0,0.1);
          }

          .shine-overlay {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.5) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-20deg);
            animation: shine 2s infinite;
            pointer-events: none;
          }

          @keyframes shine {
            from { left: -100%; }
            to { left: 100%; }
          }
        `}
      </style>
      </div>
      </div>
      )
    }

     </Col>
    </Row></Container>

  );
}

export default AddProps;
