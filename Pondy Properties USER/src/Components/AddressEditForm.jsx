


import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { RiLayoutLine } from 'react-icons/ri';
import { TbArrowLeftRight, TbMapPinCode, TbWorldLongitude } from 'react-icons/tb';
import {FaBuilding, FaMoneyBillWave,  FaBath, FaChartArea, FaPhone ,FaEdit,FaRoad,FaDoorClosed,FaMapPin, FaHome, FaUserAlt, FaEnvelope,  FaRupeeSign , FaFileVideo , FaToilet,FaCar,FaBed,  FaCity , FaTimes, FaClock, FaMapMarkedAlt, FaExchangeAlt, FaCompass, FaHandshake, FaTag, FaPhoneAlt, FaSpinner, FaArrowLeft} from 'react-icons/fa';
import {  FaRegAddressCard, FaRegCircleCheck } from 'react-icons/fa6';
import { MdLocationOn, MdOutlineMeetingRoom, MdOutlineOtherHouses, MdSchedule , MdStraighten , MdApproval, MdLocationCity , MdAddPhotoAlternate, MdKeyboardDoubleArrowDown, MdOutlineBathroom, MdDoorFront, MdOutlineClose} from "react-icons/md";
import { BsBank, BsBuildingsFill, BsFillHouseCheckFill , BsTextareaT} from "react-icons/bs";
import { GiKitchenScale, GiMoneyStack , GiResize , GiGears} from "react-icons/gi";
import { HiUserGroup } from "react-icons/hi";
import { BiBuildingHouse , BiMap, BiWorld} from "react-icons/bi";
import {   FaFileAlt, FaGlobeAmericas, FaMapMarkerAlt, FaMapSigns } from "react-icons/fa";
import {MdOutlineCurrencyRupee , MdElevator ,MdOutlineChair ,MdPhone, MdOutlineAccessTime, MdTimer, MdHomeWork, MdHouseSiding, MdOutlineKitchen, MdEmail, } from "react-icons/md";
import {  BsBarChart, BsGraphUp } from "react-icons/bs";
import { BiBuilding, BiStreetView } from "react-icons/bi";
import { GiStairs, GiForkKnifeSpoon, GiWindow } from "react-icons/gi";
import { AiOutlineEye, AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { BiBed, BiBath, BiCar, BiCalendar, BiUser, BiCube } from "react-icons/bi";
import './AddProperty.css';
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import { IoCloseCircle } from "react-icons/io5";
import { GrSteps } from "react-icons/gr";
import moment from "moment";
import { toWords } from 'number-to-words';
import { FcSearch } from "react-icons/fc";




function AddressEditForm() {
  
    const location = useLocation();
  const { ppcId, phoneNumber } = location.state || {};

    const previewRef = useRef(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [priceInWords, setPriceInWords] = useState("");
    const [loading, setLoading] = useState(false);
        const [videoloading, setvideoUploading] = useState(false);
    const [progress, setProgress] = useState(0);
const [photoProgress, setPhotoProgress] = useState(0);
const [photoloading, setPhotoUploading] = useState(false); // ⬅️ add this at top if not already
const [uploadSuccess, setUploadSuccess] = useState(false);
const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
const [videoError, setVideoError] = useState(""); // ⬅️ new state

    const [step, setStep] = useState("form");
    const [isPreview, setIsPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
      const [isSuccess, setIsSuccess] = useState(false);
      const [showCheckmark, setShowCheckmark] = useState(false);
    const [coordinateInput, setCoordinateInput] = useState('');
      const [selectedFiles, setSelectedFiles] = useState([]); // Store selected files
          const [videos, setVideos] = useState([]);
    
    const [currentStep, setCurrentStep] = useState(1);
      
    const [isScrolling, setIsScrolling] = useState(false);
const [isUploading, setIsUploading] = useState(false); // ⬅️ add this at top if not already

    
  

    
    const swiperRef = useRef(null);

    const navigate = useNavigate();
      const inputRef = useRef(null);
      const latRef = useRef(null);
      const lngRef = useRef(null);
      const mapRef = useRef(null);
      const mapInstance = useRef(null);
      const markerRef = useRef(null);
        const coordRef = useRef(null);
      useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputRef.current.focus();
    }
  }, []); // Empty dependency to run once on mount

 
      useEffect(() => {
        const recordDashboardView = async () => {
          try {
            await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
              phoneNumber: phoneNumber,
              viewedFile: "Edit Form",
              viewTime: new Date().toISOString(),
            });
          } catch (err) {
          }
        };
      
        if (phoneNumber) {
          recordDashboardView();
        }
      }, [phoneNumber]);
      // const [p
const [formData, setFormData] = useState({
    ppcId: "",
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
    numberOfFloors: '',
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
    description:'',
    pinCode: "",
    countryCode:"+91",
    phoneNumber: phoneNumber || "", 
  phoneNumberCountryCode: "",
  alternatePhone: "",
  alternatePhoneCountryCode: "",
    bestTimeToCall: '',
    createdAt:"",
   locationCoordinates:''

  });
  useEffect(() => {
    if (isPreview || !window.google) return;
  
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

        updateMap(lat, lng); // optional: show marker

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
            doorNumber: getComponent("street_number"), // ✅ added here
          locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this

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
            rentalPropertyAddress: place.formatted_address || '',
            latitude: lat,
            longitude: lng,
            pinCode: getComponent("postal_code"),
          
            // City is usually in 'locality', fallback to district-level if missing
            city: getComponent("sublocality_level_1"),
          
            // Area is more granular, typically sublocality levels
            area: getComponent("sublocality_level_2"),          
            // Optional: Nagar name, generally from level 1
            nagar: getComponent("sublocality"),
          
            // Street name or building/premise
            streetName: getComponent("route") || getComponent("premise"),
          
            // District is administrative_area_level_2 in most cases
            district: getComponent("administrative_area_level_2") || getComponent("locality"),
                      locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this

            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"),    }));
            
        });
      }
    }, 100);
  
    return () => clearInterval(interval);
  }, [isPreview]); // 👈 Re-run effect when preview mode changes
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

    // ✅ Listen to dragend event only once when marker is created
    markerRef.current.addListener('dragend', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();

      // Update map and form on drag end
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
const [coordValue, setCoordValue] = useState('');
 const handleLatLngAuto = (input) => {
  input = input.trim();

  // 1. Match decimal with N/S, E/W (e.g., 11.778068° N, 79.735691° E)
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
    // 2. Match DMS (e.g., 11°55'13.3"N 79°47'24.2"E)
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
      // 3. Match plain decimal format: "11.778068, 79.735691"
      const plainDecimal = input.match(/([-\d.]+)[,\s]+([-\d.]+)/);
      if (plainDecimal) {
        lat = parseFloat(plainDecimal[1]);
        lng = parseFloat(plainDecimal[2]);
      } else {
        return; // No valid format matched
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

// Helper to convert DMS to decimal
const dmsToDecimal = (deg, min, sec, direction) => {
  let decimal = deg + min / 60 + sec / 3600;
  if (["S", "W"].includes(direction)) decimal = -decimal;
  return decimal;
};

const handleClear = () => {
  if (coordRef.current) {
    coordRef.current.value = ''; // Clear the actual input field
  }
  setCoordValue(''); // Reset state if needed

  // Reset formData fields
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
  const handleLatLngSearch = (e) => {
    e.preventDefault();

    const lat = parseFloat(latRef.current.value);
    const lng = parseFloat(lngRef.current.value);
  
    if (!isNaN(lat) && !isNaN(lng)) {
      updateMap(lat, lng);
  
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };
  
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
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
          
            // City is usually in 'locality', fallback to district-level if missing
            city: getComponent("sublocality_level_1"),
          
            // Area is more granular, typically sublocality levels
            area: getComponent("sublocality_level_2"),          
            // Optional: Nagar name, generally from level 1
            nagar: getComponent("sublocality"),
          
            // Street name or building/premise
            streetName: getComponent("route") || getComponent("premise"),
          
            // District is administrative_area_level_2 in most cases
            district: getComponent("administrative_area_level_2") || getComponent("locality"),
          
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"),  }));
        } else {
          alert('Reverse geocoding failed: ' + status);
        }
      });
    } else {
      alert("Enter valid coordinates");
    }
  };
  

  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [video, setVideo] = useState(null);

  // const handlePreview = () => {
  //   setIsPreview(!isPreview);
  // };
  const handlePreview = () => {
    setIsPreview(!isPreview);
    setIsPreviewOpen(true); // Open the preview
  
    // Scroll to the preview section
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  


      const [message, setMessage] = useState({ text: "", type: "" });
  
  
       // Auto-clear message after 3 seconds
        useEffect(() => {
          if (message.text) {
            const timer = setTimeout(() => {
              setMessage({ text: "", type: "" });
            }, 3000);
            return () => clearTimeout(timer);
          }
        }, [message]);
      

  
const formattedCreatedAt = Date.now
? moment(formData.createdAt).format("DD-MM-YYYY") 
: "N/A";


const formattedUpdatedAt = formData.updatedAt
  ? moment(formData.updatedAt).format("DD-MM-YYYY")
  : "N/A";


  
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-data?ppcId=${ppcId}`);
        const data = response.data.user;
        setPhotos(
          Array.isArray(data.photos) 
            // ? data.photos.map(photo => (typeof photo === "string" ? photo : photo.photo)) 
            ? data.photos.map(photo => (typeof photo === "string" ? photo : photo.photoUrl)) 

            : []
        ); 
      setVideos(Array.isArray(data.video) ? data.video : []);

        // setVideo(data.video || null);
        setFormData({
          propertyMode: data.propertyMode || '',
          propertyType: data.propertyType || '',
          price: data.price || '',
          propertyAge: data.propertyAge || '',
          bankLoan: data.bankLoan || '',
          negotiation: data.negotiation || '',
          length: data.length || '',
          breadth: data.breadth || '',
          totalArea: data.totalArea || '',
          ownership: data.ownership || '',
          bedrooms: data.bedrooms || '',
          kitchen: data.kitchen || '',
          kitchenType: data.kitchenType || '',
          balconies: data.balconies || '',
          floorNo: data.floorNo || '',
          areaUnit: data.areaUnit || '',
          propertyApproved: data.propertyApproved || '',
          postedBy: data.postedBy || '',
          facing: data.facing || '',
          salesMode: data.salesMode || '',
          salesType: data.salesType || '',
          description: data.description || '',
          furnished: data.furnished || '',
          lift: data.lift || '',
          attachedBathrooms: data.attachedBathrooms || '',
          western: data.western || '',
          numberOfFloors: data.numberOfFloors || '',
          carParking: data.carParking || '',
          rentalPropertyAddress: data.rentalPropertyAddress || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          district: data.district || '',
          area: data.area || '',
          streetName: data.streetName || '',
          doorNumber: data.doorNumber || '',
          nagar: data.nagar || '',
          pinCode:data.pinCode || '',
          ownerName: data.ownerName || '',
          alternatePhone: data.alternatePhone || '',
          email: data.email || '',
          bestTimeToCall: data.bestTimeToCall || '',
          locationCoordinates: data.locationCoordinates || ''

        });
        
        setPhotos(data.photos || []);
        setVideo(data.video || null);
      } catch (error) {
      }
    };
    if (ppcId) {
      fetchPropertyData();

    }
  }, [ppcId]);


  const propertyDetailsList = [
    { heading: true, label: "Basic Property Info" }, // Heading 1
    { icon: <MdHomeWork />, label: "Property Mode", value:  formData.propertyMode},
    { icon: <MdHouseSiding />, label: "Property Type", value: formData.propertyType },
    { icon: <MdOutlineCurrencyRupee />, label: "Price", value: formData.price },
    { icon: <AiOutlineColumnWidth />, label: "Length", value: formData.length },
    { icon: <AiOutlineColumnHeight />, label: "Breadth", value: formData.breadth  },
    {
      icon: <RiLayoutLine />,
      label: "Total Area",
      value: `${formData.totalArea} ${formData.areaUnit}`, // Combined value
    },
    
    { icon: <FaUserAlt />, label: "Ownership", value: formData.ownership },
    { icon: <MdApproval />, label: "Property Approved", value: formData.propertyApproved },
    { icon: <MdTimer />, label: "Property Age", value: formData.propertyAge },
    { icon: <BsBank />, label: "Bank Loan", value: formData.bankLoan },


    { heading: true, label: "Property Features" }, // Heading 1
    { icon: <BiBed />, label: "Bedrooms", value: formData.bedrooms },

    { icon: <GiStairs />, label: "Floor No", value:formData.floorNo },
    { icon: <GiForkKnifeSpoon />, label: "Kitchen", value: formData.kitchen},
    // { icon: <GiKitchenScale />, label: "Kitchen Type", value: formData.kitchenType },
    { icon: <GiWindow />, label: "Balconies", value: formData.balconies},
    { icon: <GrSteps   />, label: "Floors", value: formData.numberOfFloors },
{ label: "western", value: formData.western, icon: <MdOutlineBathroom /> },
{ label: "attached", value: formData.attachedBathrooms, icon: <BiBath /> },

    { icon: <BiCar />, label: "Car Park", value: formData.carParking },
    { icon: <MdElevator />, label: "Lift", value: formData.lift },
    { heading: true, label: "Other details" }, // Heading 2

    { icon: <MdOutlineChair />, label: "Furnished", value: formData.furnished },
    { icon: <TbArrowLeftRight />, label: "Facing", value: formData.facing },

    { icon: <BsGraphUp />, label: "Sale Mode", value: formData.salesMode },
    { icon: <BsBarChart />, label: "Sales Type", value: formData.salesType },
    { icon: <BiUser />, label: "Posted By", value: formData.postedBy },
    { icon: <BiCalendar />, label: "Posted On",value:formattedCreatedAt},
    { icon: <BiCalendar />, label: "Update On",value:formattedUpdatedAt},

    { heading: true, label: "Description" }, // Heading 3
    { icon: <FaFileAlt />, label: "Description" ,value: formData.description },
  
    { heading: true, label: "Property Location Info" }, // Heading 4
  
    { icon: <FaGlobeAmericas />, label: "Country", value: formData.country },
    { icon: <BiBuilding />, label: "State", value: formData.state },
    { icon: <MdLocationCity />, label: "City", value: formData.city },
    { icon: <FaMapMarkerAlt />, label: "District", value:  formData.district},
       { icon: <MdLocationOn />, label: "Area", value: formData.area },
   
    { icon: <FaMapSigns />, label: "Nagar", value: formData.nagar },
       { icon: <FaRoad />, label: "Street Name", value: formData.streetName },
   
    { icon: <FaDoorClosed />, label: "Door Number", value: formData.doorNumber },
    { icon: <TbMapPinCode />, label: "pinCode", value: formData.pinCode },
    { icon: <TbWorldLongitude />, label: "locationCoordinates", value: formData.locationCoordinates },

    { heading: true, label: "Contact Info" }, // Heading 5
   
    { icon: <FaUserAlt />, label: "Owner Name", value: formData.ownerName },
    { icon: <MdPhone  />, label: "Phone Number", value: phoneNumber },
    { icon: <MdPhone  />, label: "alternate Phone", value: formData.alternatePhone },

    { icon: <MdEmail />, label: "Email", value: formData.email },
    { icon: <MdOutlineAccessTime />, label: "Best Time To Call", value: formData.bestTimeToCall },
 
  ];
  const [dropdownState, setDropdownState] = useState({
    activeDropdown: null,
    filterText: "",
  });

  // Toggle dropdown visibility
  const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({
      activeDropdown: prevState.activeDropdown === field ? null : field,
      filterText: "",
    }));
  };

  // Handle dropdown selection
  const handleDropdownSelect = (field, value) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
    setDropdownState({ activeDropdown: null, filterText: "" });
  };

  // Handle filter input change for dropdown
  const handleFilterChange = (e) => {
    setDropdownState((prevState) => ({ ...prevState, filterText: e.target.value }));
  };
  // const [ppcId, setPpcId] = useState(null);

 


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
    { code: '+82', country: 'South Korea' },
    { code: '+46', country: 'Sweden' },
    { code: '+31', country: 'Netherlands' },
    { code: '+41', country: 'Switzerland' },
    { code: '+32', country: 'Belgium' },
    { code: '+47', country: 'Norway' },
    { code: '+358', country: 'Finland' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+48', country: 'Poland' },
    { code: '+30', country: 'Greece' },
    { code: '+351', country: 'Portugal' },
    { code: '+20', country: 'Egypt' },
    { code: '+27', country: 'South Africa' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+971', country: 'UAE' },
    { code: '+90', country: 'Turkey' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+64', country: 'New Zealand' },
    { code: '+856', country: 'Laos' },
    { code: '+66', country: 'Thailand' },
    { code: '+84', country: 'Vietnam' },
    { code: '+92', country: 'Pakistan' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+972', country: 'Israel' },
    { code: '+56', country: 'Chile' },
    { code: '+54', country: 'Argentina' },
    { code: '+595', country: 'Paraguay' },
    { code: '+57', country: 'Colombia' },
    { code: '+505', country: 'Nicaragua' },
    { code: '+503', country: 'El Salvador' },
    { code: '+509', country: 'Haiti' },
    { code: '+213', country: 'Algeria' },
    { code: '+216', country: 'Tunisia' },
    { code: '+225', country: 'Ivory Coast' },
    { code: '+234', country: 'Nigeria' },
    { code: '+254', country: 'Kenya' },
    { code: '+255', country: 'Tanzania' },
    { code: '+256', country: 'Uganda' },
    { code: '+591', country: 'Bolivia' },
    { code: '+593', country: 'Ecuador' },
    { code: '+375', country: 'Belarus' },
    { code: '+373', country: 'Moldova' },
    { code: '+380', country: 'Ukraine' }
  ]);
 
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
 const handlePhotoUpload = async (e) => {
  const files = Array.from(e.target.files);
  const maxSize = 50 * 1024 * 1024; // 10MB

  if (!files.length) return;

  // Check size
  for (let file of files) {
    if (file.size > maxSize) {
      alert("File size exceeds the 10MB limit");
      return;
    }
  }

  // Check total photo count
  if (photos.length + files.length > 15) {
    alert("Maximum 15 photos can be uploaded.");
    return;
  }

  setPhotoUploading(true);
  setPhotoProgress(0);
  setPhotoUploadSuccess(false); // reset

  try {
    // Simulate upload progress (replace with API later)
    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      setPhotoProgress(percent);

      if (percent >= 100) {
        clearInterval(interval);
      }
    }, 200);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate delay

    // Watermarking
    const watermarkedImages = await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();

          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              canvas.width = img.width;
              canvas.height = img.height;

              ctx.drawImage(img, 0, 0);

              // Watermark settings
              const watermarkText = "PPC Pondy";
              const fontSize = Math.max(24, Math.floor(canvas.width / 15));
              ctx.font = `bold ${fontSize}px Arial`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;

              // White outline
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 4;
              ctx.strokeText(watermarkText, centerX, centerY);

              // Black fill
              ctx.fillStyle = "rgba(224, 223, 223, 0.9)";
              ctx.fillText(watermarkText, centerX, centerY);

              canvas.toBlob((blob) => {
                const watermarkedFile = new File([blob], file.name, {
                  type: file.type,
                });
                resolve(watermarkedFile);
              }, file.type);
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

    // Success message
    setPhotoUploadSuccess(true);
    setTimeout(() => setPhotoUploadSuccess(false), 2000);
  } catch (error) {
    console.error("Photo upload failed:", error);
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
  const fileInputRef = useRef(null);

 const handleVideoChange = async (e) => {
  const selectedFiles = Array.from(e.target.files);
  const maxSize = 50 * 1024 * 1024; // 50MB
  const intimationSize = 10 * 1024 * 1024; // 10MB
  const validFiles = [];

  setVideoError(""); // reset previous error

  for (let file of selectedFiles) {
    // ⚡ Intimation if >10MB
    if (file.size > intimationSize && file.size <= maxSize) {
      alert(`${file.name} is above 10MB. Large files may take longer to upload.`);
    }

    // ❌ Reject if >50MB
    if (file.size > maxSize) {
      setVideoError(`${file.name} exceeds the 50MB size limit.`);
      continue;
    }

    // ✅ Compress before pushing
    let compressedFile = file;
    try {
      compressedFile = await compressVideo(file);
    } catch (err) {
      console.warn("Compression failed, using original file", err);
    }

    validFiles.push(compressedFile);
  }

  if (!validFiles.length) return;

  // normal upload flow...
  setvideoUploading(true);
  setProgress(0);
  setUploadSuccess(false);

  // fake progress simulation
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

// ⚡ Compress video using ffmpeg.wasm
const compressVideo = async (file) => {
  const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = createFFmpeg({ log: false });
  if (!ffmpeg.isLoaded()) await ffmpeg.load();

  const inputName = "input.mp4";
  const outputName = "output.mp4";

  ffmpeg.FS("writeFile", inputName, await fetchFile(file));
  // Adjust bitrate/resolution for compression
  await ffmpeg.run(
    "-i", inputName,
    "-vcodec", "libx264",
    "-crf", "28",
    "-preset", "veryfast",
    "-vf", "scale=640:-1",
    outputName
  );

  const data = ffmpeg.FS("readFile", outputName);
  return new File([data.buffer], file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp4", { type: "video/mp4" });
};
  const removeVideo = (indexToRemove) => {
  setVideos(prev => prev.filter((_, index) => index !== indexToRemove));
    fileInputRef.current.value = ''; // Reset the file input
  };
const getMimeType = (filename) => {
  if (!filename || typeof filename !== "string" || !filename.includes(".")) {
    return "video/mp4"; // fallback
  }

  const ext = filename.split('.').pop().toLowerCase();

  switch (ext) {
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'ogg': return 'video/ogg';
    case 'mov': return 'video/quicktime';
    case 'avi': return 'video/x-msvideo';
    case 'mkv': return 'video/x-matroska';
    default: return 'video/mp4';
  }
};

const fileName = typeof video === 'string' ? video : video?.video;
const mimeType = getMimeType(fileName);

  const handlePhotoSelect = (index) => {
    setSelectedPhotoIndex(index);
  };
    const nonDropdownFields = ["price", "length", "totalArea", "description", "YourProperty", "city",  "area"];

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
  // "kitchenType",
  "balconies",
  "floorNo",
  "propertyApproved",
  "propertyAge",
  "bankLoan",
    "facing",
  "salesMode",
  "salesType",
  "postedBy",
  "furnished",
  "lift",
  "attachedBathrooms",
  "western",
  "numberOfFloors",
  "carParking",
  "district",
  "bestTimeToCall"
  // Add only the fields that use toggleDropdown
];
 

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

const handleCombinedClick = async (e) => {
  e.preventDefault(); // prevent default once here
  await handleAnim(); // Wait for the animation to complete
  handleSubmit(e);    // call submit function, passing the event
};
 const handleAnim = () => {
  return new Promise((resolve) => {
    setIsProcessing(true);
    setIsSuccess(false);
    setShowCheckmark(false);

    // Simulate processing animation
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Small delay before showing the checkmark
      setTimeout(() => {
        setShowCheckmark(true); // Show checkmark and text

        // Wait 2s to let user see the checkmark and text
        setTimeout(() => {
          resolve(); // Now allow submission
        }, 2000);
      }, 100); // Delay before showing checkmark
    }, 2000); // Processing animation duration
  });
};
   
  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!ppcId) {
    setMessage("PPC-ID is required. Please refresh or try again.");
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
    formDataToSend.append("video", file); // ⬅️ matches backend field
  });

  try {
    setIsUploading(true); // ⬅️ Show loading
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/update-property`,
      formDataToSend,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setMessage(response.data.message);

    setTimeout(() => {
      navigate('/my-property');
    }, 2000);

  } catch (error) {
    setMessage("Error saving property data.");
  } finally {
    setIsUploading(false); // ⬅️ Hide loading
  }
};
    const fieldIcons = {
      // Contact Details
      phoneNumber: <MdPhone color="#2F747F" />,
      alternatePhone: <MdPhone color="#2F747F" />,
      email: <FaEnvelope  color="#2F747F" />,
      bestTimeToCall: <FaClock color="#2F747F" />, // Changed from MdSchedule
    
      // Property Location
      rentalPropertyAddress: <MdLocationOn color="#2F747F" />, // Changed from MdLocationCity
      country: <BiWorld color="#2F747F" />,
      state: <FaMapMarkerAlt color="#2F747F" />, // Changed from MdLocationCity
      city: <FaCity color="#2F747F" />,
      district: <FaMapMarkedAlt color="#2F747F" />, // Changed from FaRegAddressCard
      area: <MdLocationOn color="#2F747F" />,
      streetName: <FaRoad color="#2F747F" />, // Changed from RiLayoutLine
      doorNumber: <MdDoorFront color="#2F747F" />, // Changed from BiBuildingHouse
      nagar: <FaMapMarkedAlt color="#2F747F" />, // Changed from FaRegAddressCard
    
      // Ownership & Posting Info
      ownerName: <FaUserAlt color="#2F747F" />,
      postedBy: <FaUserAlt color="#2F747F" />,
      ownership: <HiUserGroup color="#2F747F" />,
    
      // Property Details
      propertyMode: <FaExchangeAlt color="#2F747F" />, // Changed from MdApproval
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
      balconies: <GiWindow color="#2F747F" />,
      floorNo: <GrSteps  color="#2F747F" />,
      numberOfFloors: <BsBuildingsFill color="#2F747F" />,
      attachedBathrooms: <FaBath color="#2F747F" />,
      western: <MdOutlineBathroom color="#2F747F" />, // Changed from FaToilet
    
      // Features & Amenities
      facing: <FaCompass color="#2F747F" />, // Changed from TbArrowLeftRight
      salesMode: <FaHandshake color="#2F747F" />, // Changed from GiGears
      salesType: <FaTag color="#2F747F" />, // Changed from MdOutlineOtherHouses
      furnished: <FaHome color="#2F747F" />,
      lift: <MdElevator color="#2F747F" />,
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
  numberOfFloors: "Number of Floors",
  carParking: "Car Parking",
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
                  {option}
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
  onClick={() => {
    toggleDropdown(field); // Close current dropdown

    const currentIndex = dropdownFieldOrder.indexOf(field);

    if (currentIndex !== -1 && currentIndex < dropdownFieldOrder.length - 1) {
      const nextField = dropdownFieldOrder[currentIndex + 1];

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
          toggleDropdown(nextField); // Open next dropdown
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
                {/* Optional Continue Button can go here */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const handleEdit = () => {
  setIsPreview(false);
};

const isReadOnly = true; // set true to make it readonly

  return (
    <div className="d-flex align-items-center justify-content-center">
  

        <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '450px', margin: 'auto', width: '100%',  fontFamily: "Inter, sans-serif" , }}>
      
                    <div className="d-flex align-items-center justify-content-start w-100"      style={{
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
          </button><h3 className="m-0 ms-3" style={{fontSize:"18px"}}> ADDRESS EDIT FORM </h3> </div>

{message.text && (
  <div style={{ 
    padding: "10px", 
    backgroundColor: message.type === "success" ? "lightgreen" : "lightcoral", 
    color: "black", 
    margin: "10px 0",
    borderRadius: "5px"
  }}>
    {message.text}
  </div>
)}


 {!isPreview ? (

      <form onSubmit={handleSubmit} className="w-100">
        <p className="p-3" style={{ color: "white", backgroundColor: "rgb(47,116,127)" }}>PPC-ID: {ppcId}</p>

                
                <div className="form-group photo-upload-container mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    name="photos"
                    id="photo-upload"
                    className="photo-upload-input"
                    style={{ display: 'none' }} // Hide the input field
                  />
                  <label htmlFor="photo-upload" className="photo-upload-label fw-normal m-0">
              
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
    Uploading... {photoProgress}%
  </>
) : photoUploadSuccess ? (
  <span style={{ color: "green" }}>✅ Successfully uploaded</span>
) : (
  "Upload Your Property Images"
)}
                  </label>
                </div>
                
{photos.length > 0 && (
  <div className="uploaded-photos">
    <h4>Uploaded Photos</h4>
    <div className="uploaded-photos-grid">
      {photos.map((photo, index) => {
        let photoUrl = "";

        if (photo instanceof File || photo instanceof Blob) {
          photoUrl = URL.createObjectURL(photo);
        } else if (typeof photo === "string") {
          // photoUrl = photo; // Direct URL from the backend
          photoUrl = `https://ppcpondy.com/PPC/${photo}`;

        } else {
          return null;
        }

        return (
          <div key={index} className="uploaded-photo-item  position-relative">
            <input
              type="radio"
              name="selectedPhoto"
              className="position-absolute"
              style={{ top: '-10px' }}
        checked={selectedPhotoIndex === index}
              onChange={() => handlePhotoSelect(index)}
            />
            <img
              src={photoUrl}
              alt="Uploaded"
              className="uploaded-photo m-2"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
            <button    style={{border:"none"}}
            className="position-absolute top-0 end-0 btn m-0 p-1"
onClick={() => removePhoto(index)}>
                    <IoCloseCircle size={20} color="#F22952"/>
            </button>
          </div>
        );
      })}
    </div>
  </div>
)}



<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}> Property Video  </h4>
        {/* Video Upload Section */}
        <div className="form-group ">
          <input
            type="file"
            name="video"
            accept="video/*"
            id="videoUpload"
            onChange={handleVideoChange}
            className="d-none"
            ref={fileInputRef} // Assign the ref to the input element

          />
          <label htmlFor="videoUpload" className="file-upload-label fw-normal">
            <span className=" pt-5">
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
  "Upload Property Videos"
)}
            </span>
          </label>

          {/* Display the selected video */}
  {videos.length > 0 && (
        <div className="selected-video-container mt-3">
          <h4 className="text-start">Selected Videos:</h4>
          <div className="d-flex flex-wrap gap-3">
            {videos.map((video, index) => (
              <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                <video width="200" height="200" controls>
                  <source  src={video instanceof File ? URL.createObjectURL(video) : video}
              type={video instanceof File ? video.type : "video/mp4"} />
                  Your browser does not support the video tag.
                </video>
                <Button
                  onClick={() => removeVideo(index)}
                  style={{ border: 'none', background: 'transparent' }}
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

<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property OverView  </h4>             


  <div>
  {/* Property Mode */}
  <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Property Mode <span style={{ color: 'red' }}>* </span> </label>

      <div style={{ display: "flex", alignItems: "center", width:"100%" }}>
        <div style={{ flex: "1" }}>
          <select
            name="propertyMode"
            value={formData.propertyMode || ""}
            onChange={handleFieldChange}
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
            onClick={() => {
              if (!isReadOnly) toggleDropdown("propertyMode");
            }}            style={{
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
            onClick={() => {
              if (!isReadOnly) toggleDropdown("propertyType");
            }}            style={{
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
  {/* Price */}
 
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
      placeholder="price"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>
  {priceInWords && (
        <p style={{ fontSize: "14px", color: "#2F747F", marginTop: "5px" }}>
          {priceInWords}
        </p>
      )}
    {/* Negotiation */}

    <div className="form-group">
    <label style={{ width: '100%'}}>
    <label>Negotiation </label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="negotiation"
            value={formData.negotiation || ""}
            onChange={handleFieldChange}
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
 

                 <div>

                <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}> Basic Property Info  </h4>             

  {/* Length */} 
  <div className="form-group">
  <label>Length:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <AiOutlineColumnHeight className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="number"
      name="length"
      value={formData.length}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="length"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
<style>
    {`
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `}
  </style>
  {/* Breadth */}
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
      placeholder="breadth"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>
  {/* Total Area */}
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
      placeholder="totalArea"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
  </div>

    {/* areaUnit */}
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
              {fieldIcons.areaUnit || <FaHome />}
            </span>
            {formData.areaUnit || "Select areaUnit"}
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
            value={formData.ownership || ""}
            onChange={handleFieldChange}
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


                <div>
                <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property details  </h4>             

  {/* Bedrooms */}

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
  {/* kitchen */}
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
              {fieldIcons.kitchen || <FaHome />}
            </span>
            {formData.kitchen || "Select kitchen"}
          </button>

          {renderDropdown("kitchen")}
        </div>
      </div>
    </label>
  </div>
  
    {/* balconies */}
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
              {fieldIcons.balconies || <FaHome />}
            </span>
            {formData.balconies || "Select balconies"}
          </button>

          {renderDropdown("balconies")}
        </div>
      </div>
    </label>
  </div>
    {/* floorNo */}
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
              {fieldIcons.floorNo || <FaHome />}
            </span>
            {formData.floorNo || "Select floorNo"}
          </button>

          {renderDropdown("floorNo")}
        </div>
      </div>
    </label>
  </div>
  </div>
  

                <div>

                    {/* Property Age */}
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
  {/* Bank Loan */}

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
    {/* propertyApproved */}
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

    {/* postedBy */}
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
              {fieldIcons.postedBy || <FaHome />}
            </span>
            {formData.postedBy || "Select postedBy"}
          </button>

          {renderDropdown("postedBy")}
        </div>
      </div>
    </label>
  </div>
    {/* facing */}
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
    {/* salesMode */}

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
              {fieldIcons.salesMode || <FaHome />}
            </span>
            {formData.salesMode || "Select salesMode"}
          </button>

          {renderDropdown("salesMode")}
        </div>
      </div>
    </label>
  </div>
    {/* salesType */}
    <div className="form-group">
    <label style={{ width: '100%'}}>
      <label>Sale Type <span style={{ color: 'red' }}>* </span> </label>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="salesType"
            value={formData.salesType || ""}
            onChange={handleFieldChange}
            className="form-control"
            style={{ display: "none" }} // Hide the default <select> dropdown
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
  </div>

  <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>  Property Description   </h4>             

 

<div className="form-group">
  <label>Description:</label>
  <textarea
    name="description"
    value={formData.description}
    onChange={handleFieldChange}
    className="form-control"
    placeholder="Maximum 250 characters"
    maxLength={250} // Limits input to 250 characters
  ></textarea>
  <small className="text-muted">Maximum 250 characters allowed.</small>
</div>

                <div>
  {/* furnished */}
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
              {fieldIcons.furnished || <FaHome />}
            </span>
            {formData.furnished || "Select furnished"}
          </button>

          {renderDropdown("furnished")}
        </div>
      </div>
    </label>
  </div>
    {/*lift */}
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
              {fieldIcons.lift || <FaHome />}
            </span>
            {formData.lift || "Select lift"}
          </button>

          {renderDropdown("lift")}
        </div>
      </div>
    </label>
  </div>

      {/*attachedBathrooms */}
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
              {fieldIcons.attachedBathrooms || <FaHome />}
            </span>
            {formData.attachedBathrooms || "Select attachedBathrooms"}
          </button>

          {renderDropdown("attachedBathrooms")}
        </div>
      </div>
    </label>
  </div>
    {/* western */}
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
              {fieldIcons.western || <FaHome />}
            </span>
            {formData.western || "Select western"}
          </button>

          {renderDropdown("western")}
        </div>
      </div>
    </label>
  </div>
    {/* numberOfFloors */}
    <div className="form-group">

    <label style={{ width: '100%'}}>
    <label>Number Of Floors</label>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1" }}>
          <select
            name="numberOfFloors"
            value={formData.numberOfFloors || ""}
            onChange={handleFieldChange}
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
              {fieldIcons.numberOfFloors || <FaHome />}
            </span>
            {formData.numberOfFloors || "Select numberOfFloors"}
          </button>

          {renderDropdown("numberOfFloors")}
        </div>
      </div>
    </label>
  </div>
    {/* carParking */}

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
              {fieldIcons.carParking || <FaHome />}
            </span>
            {formData.carParking || "Select carParking"}
          </button>

          {renderDropdown("carParking")}
        </div>
      </div>
    </label>
  </div>
  </div>


  {/*   rentalPropertyAddress */}
<div>
  <div className="form-group">
  {/* <label>Quick Address:</label> */}
  
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background:"#fff"}}>
      <FcSearch  className="input-icon" 
      style={{color: '#2F747F', marginLeft:"10px"}} />
      <input
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

    // onChange={handleLatLngAuto} // 👈 Automatically triggers on input
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
   
  


  {/* country */}

  <div className="form-group">
  <label>Country:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <BiWorld className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="country"
      value={formData.country}
      onChange={handleFieldChange}
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
      value={formData.state}
      onChange={handleFieldChange}
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
      value={formData.city} readOnly
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="City"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

  {/* district */}

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
            style={{ display: "none" }} // Hide the default <select> dropdown
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

  {/* area */}
  <div className="form-group">
  <label>Area:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <MdLocationOn className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="area"
      value={formData.area} readOnly
      onChange={handleFieldChange}
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
      value={formData.streetName}
      onChange={handleFieldChange}
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

  {/* Nagar */}
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
  <label>pinCode:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <TbMapPinCode  className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="pinCode"
      value={formData.pinCode}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="pinCode"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>

<div className="form-group">
  <label>location Coordinates:</label>
  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <TbWorldLongitude  className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
    <input
      type="text"
      name="locationCoordinates"
      value={formData.locationCoordinates}
      onChange={handleFieldChange}
      className="form-input m-0"
      placeholder="location Coordinates"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
  {/* Owner Name */}

  

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

  {/* Email */}
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
  {/* Phone Number */}

<div className="form-group">
<label>Phone Number:</label>

  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaPhoneAlt  className="input-icon" style={{ color: '#2F747F', marginLeft:"10px" }} />
    
    <div style={{ flex: '0 0 10%' }}>
      <label className="m-0">
        <select
          name="countryCode"
          value={"+91"}
      readOnly
          onChange={handleFieldChange}
          className="form-control m-0"
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
        >
          <option value="">Select Country Code</option>
          {countryCodes.map((item, index) => (
            <option key={index} value={item.code}>
              {item.code}  {item.country}
            </option>
          ))}
        </select>
      </label>
    </div>

    <input
      type="number"
      name="phoneNumber"
      value={phoneNumber}
      readOnly
      className="form-input m-0"
      placeholder="Phone Number"
      style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
    />
  </div>
</div>
  {/* Alternate Number */}

<div className="form-group">
<label>Alternate number:</label>

  <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
    <FaPhoneAlt  className="input-icon" style={{ color: '#2F747F', marginLeft:"10px" }} />
    
    <div style={{ flex: '0 1 10%' }}>
      <label className="m-0">
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
              {item.code}  {item.country}
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

  {/* Best Time to Call */}
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



              {/* Step 3: Submit all data */}
            
                <Button className="w-100"
                  type="submit"
                  style={{ marginTop: '15px', backgroundColor: "rgb(47,116,127)" }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#029bb3"; // Brighter neon on hover
                    e.target.style.fontWeight = 600; // Brighter neon on hover
                    e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover
          
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#2F747F"; // Original orange
                    e.target.style.fontWeight = 400; // Brighter neon on hover
          
                  }}
                  onClick={handlePreview}
                >
                  PreView
                </Button>
      </form>
    ) : (
      
        <div ref={previewRef} className="preview-section w-100 d-flex flex-column align-items-center justify-content-center">
         <div className="mb-4">
              <div style={{width:"400px"}}>
  
              
             {(photos.length > 0 || video) ? (
    <Swiper navigation={{
      prevEl: ".swiper-button-prev-custom",
      nextEl: ".swiper-button-next-custom",
    }} 
    ref={swiperRef}
    modules={[Navigation]} className="swiper-container">
      {photos.map((photo, index) => {
        let photoUrl = "";
  
        // Check if the photo is a valid File or Blob
        if (photo instanceof File || photo instanceof Blob) {
          photoUrl = URL.createObjectURL(photo);
        } else if (typeof photo === "string") {
          // photoUrl = photo; // Direct URL from the backend
          photoUrl = `https://ppcpondy.com/PPC/${photo}`;
  
        } else {
          return null; // Skip rendering if the format is invalid
        }
  
        return (
          <SwiperSlide key={index} className="d-flex justify-content-center align-items-center"
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
            <img
              src={photoUrl}
              alt={`Preview ${index + 1}`}
              className="preview-image"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
              }}
            />
          </SwiperSlide>
        );
      })}
  
   {Array.isArray(videos) && videos.length > 0 && (
     <>
       <h4 className="text-start mt-3">Selected Videos:</h4>
       <Swiper slidesPerView={1} spaceBetween={20}>
         {videos.map((videoItem, index) => {
           let src = "";
           let type = "video/mp4";
   
           if (videoItem instanceof File) {
             src = URL.createObjectURL(videoItem);
             type = videoItem.type || "video/mp4";
           } else if (typeof videoItem === "string") {
             src = `https://ppcpondy.com/PPC/${videoItem}`;
             type = getMimeType(videoItem);
           }
   
           if (!src) return null;
   
           return (
             <SwiperSlide key={index}>
               <div style={{ position: "relative" }}>
                 <video
                   controls
                   style={{
                     width: "100%",
                     height: "200px",
                     objectFit: "cover",
                     borderRadius: "8px",
                     boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                   }}
                 >
                   <source src={src} type={type} />
                   Your browser does not support the video tag.
                 </video>
               </div>
             </SwiperSlide>
           );
         })}
       </Swiper>
     </>
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
      <button className="swiper-button-prev-custom m-1 w-30" style={{background:"#019988", border:"none", color:"#fff"}}>❮</button>
      <button className="swiper-button-next-custom m-1 w-30"style={{background:"#019988", border:"none", color:"#fff"}}>❯</button>
    </div>
  </div>
  
  
  
    
  </div>
  </div>
<div className="row w-100">

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
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999, // make sure it appears above everything else
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
// Check if it's a heading, which should always be full-width (col-12)
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

const isDescription = detail.label === "Description";

 
const columnClass = isDescription ? "col-12" : "col-6";

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
      {!isDescription && <span className="mb-1" style={{fontSize:"12px", color:"grey"}}>{detail.label || "N/A"}</span>}  {/* ✅ Hide label for description */}

         <p
          className="mb-0 p-0"
          style={{
            fontSize:"14px",
            color:"grey",
            fontWeight:"600",
            padding: "10px",
            borderRadius: "5px",
            width: "100%", // Ensure the value takes full width
          }}
        >
 {detail.value
    ? ["Country", "State", "City", "District", "Nagar", "Area", "Street Name", "Door Number", "pinCode", "location Coordinates"].includes(detail.label)
      ? typeof detail.value === "string"
        ? `${detail.value.slice(0, 8)}...`
        : JSON.stringify(detail.value)
      : detail.value
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
        justifyContent: 'center',  // centers horizontally
        alignItems: 'center',      // centers vertically
        height: '100px'            // or any height you want to center within
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
      )}

    </div>
    </div>

  );
}

export default AddressEditForm;










