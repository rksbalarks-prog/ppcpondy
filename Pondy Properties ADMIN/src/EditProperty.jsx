 

import React, { useState, useEffect , useRef} from "react";
import axios from "axios";
import { MdAddPhotoAlternate, MdOutlineClose, MdStraighten } from "react-icons/md";
import { FaFileVideo } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaTimes } from 'react-icons/fa';
import { FaRupeeSign } from 'react-icons/fa';
import { MdLocationOn , MdApproval, MdLocationCity, MdOutlineBedroomParent, MdOutlineDescription } from 'react-icons/md';
import { BsBank } from 'react-icons/bs';
import { RiLayoutLine } from 'react-icons/ri';
import { TbArrowLeftRight, TbWorldLongitude } from 'react-icons/tb';
import {FaCouch,FaHandshake,FaTag,FaLocationArrow,FaCalendarAlt,FaArrowUp,FaShower,FaToilet,FaCar,FaCheckCircle,FaUtensils,FaBed, FaMoneyBill,FaPhone, FaRegBuilding, FaCity } from 'react-icons/fa';
import { FaBuilding , FaHome, FaMapSigns, FaMapMarkerAlt, FaVectorSquare, FaRoad, FaDoorClosed, FaMapPin, FaUserAlt, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import { TbMapPinCode } from "react-icons/tb";

import { BiWorld} from "react-icons/bi";
import './AddProperty.css';


import { FaBath, FaChartArea, } from 'react-icons/fa';
import { FaKitchenSet } from 'react-icons/fa6';
import { BsBuildingsFill } from 'react-icons/bs';
import { GiHouse, GiGears, GiResize } from 'react-icons/gi';
import { FaClock, FaRegAddressCard, FaCheck } from 'react-icons/fa6';
import moment from "moment";
import { useSelector } from "react-redux";
import { FcSearch } from "react-icons/fc";
import { toWords } from 'number-to-words';
import { IoCloseCircle } from "react-icons/io5";
import { AiOutlineEye, AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";

function EditProperty() {
  const location = useLocation();
  const { ppcId, phoneNumber } = location.state || {};
  
     const inputRef = useRef(null);
          const latRef = useRef(null);
          const lngRef = useRef(null);
          const mapRef = useRef(null);
          const mapInstance = useRef(null);
          const markerRef = useRef(null);
                            const coordRef = useRef(null);
          
           const [priceInWords, setPriceInWords] = useState("");

  const [formData, setFormData] = useState({
    phoneNumber: "",
    rentalPropertyAddress: "",
    state: "",
    city: "",
    district: "",
    area: "",
    streetName: "",
    doorNumber: "",
    nagar: "",
    ownerName: "",
    email: "",
    alternatePhone: "",
    countryCode: "+91", // Default value
    propertyMode: "",
    propertyType: "",
    bankLoan: "",
    negotiation: "",
    ownership: "",
    bedrooms: "",
    kitchen: "",
    // kitchenType: "",
    balconies: "",
    floorNo: "",
    areaUnit: "",
    description:"",
    propertyApproved: "",
    propertyAge: "",
    postedBy: "",
    facing: "",
    salesMode: "",
    salesType: "",
    furnished: "",
    lift: "",
    attachedBathrooms: "",
    western: "",
    numberOfFloors: "",
    carParking: "",
    bestTimeToCall: "",
    price:"",
    length:"",
    breadth:"",
    totalArea:"",
    pinCode: "",
    country: "",
locationCoordinates:""
  });

  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  // Preserve the workflow status the property had when the edit form opened
  // so saving an edit doesn't move the property between Approved / PreApproved.
  const [originalStatus, setOriginalStatus] = useState("");
  const [video, setVideo] = useState(null);
const [coordinateInput, setCoordinateInput] = useState('');
          const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!window.google) return;

    const defaultCenter = { lat: 11.9416, lng: 79.8083 };

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 10,
    });

    mapInstance.current = map;
     // ✅ Add click listener on the map
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
        const component = place.address_components?.find(c => c.types.includes(type));
        return component?.long_name || '';
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
    });
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
            city: getComponent("locality") || getComponent("administrative_area_level_3"),
            area: getComponent("sublocality") || getComponent("sublocality_level_1"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"), // ✅ added here
          locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this

          }));
        } else {
          alert('Reverse geocoding failed: ' + status);
        }
      });
    } else {
      alert("Enter valid coordinates");
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


  const [countryCodes, setCountryCodes] = useState([
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+34", country: "Spain" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
    { code: "+86", country: "China" },
    { code: "+39", country: "Italy" },
    { code: "+7", country: "Russia/Kazakhstan" },
  ]);
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
  const [dataList, setDataList] = useState({});

  // Fetch property data by ppcId
  useEffect(() => {
    if (!ppcId) return;  // Prevent fetching if ppcId is not available

    const fetchPropertyData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-data?ppcId=${ppcId}`);
        const data = response.data.user;
      setPhotos(
          Array.isArray(data.photos)
             ? data.photos.map(photo => (typeof photo === "string" ? photo : photo.photoUrl))

            : []
        );
      setVideos(Array.isArray(data.video) ? data.video : []);
      // Remember the property's current bucket (approved / complete / pending / …)
      // so we can echo it back on save and keep the property where it was.
      setOriginalStatus(data.status || "");

        setFormData({
          phoneNumber: data.phoneNumber || "",
          rentalPropertyAddress: data.rentalPropertyAddress || "",
          state: data.state || "",
          city: data.city || "",
          district: data.district || "",
          price:data.price || "",
          area: data.area || "",
          streetName: data.streetName || "",
          doorNumber: data.doorNumber || "",
          nagar: data.nagar || "",
          ownerName: data.ownerName || "",
          email: data.email || "",
          alternatePhone: data.alternatePhone || "",
          countryCode: data.countryCode || "+91",
          propertyMode: data.propertyMode || "",
          propertyType: data.propertyType || "",
          bankLoan: data.bankLoan || "",
          negotiation: data.negotiation || "",
          ownership: data.ownership || "",
          bedrooms: data.bedrooms || "",
          kitchen: data.kitchen || "",
          // kitchenType: data.kitchenType || "",
          balconies: data.balconies || "",
          floorNo: data.floorNo || "",
          areaUnit: data.areaUnit || "",
          propertyApproved: data.propertyApproved || "",
          propertyAge: data.propertyAge || "",
          postedBy: data.postedBy || "",
          description:data.description || "",
          facing: data.facing || "",
          salesMode: data.salesMode || "",
          salesType: data.salesType || "",
          furnished: data.furnished || "",
          lift: data.lift || "",
          attachedBathrooms: data.attachedBathrooms || "",
          western: data.western || "",
          numberOfFloors: data.numberOfFloors || "",
          carParking: data.carParking || "",
          bestTimeToCall: data.bestTimeToCall || "",
          length:data.length || "",
          breadth:data.breadth || "",
          totalArea:data.totalArea || "",
          pinCode:data.pinCode || '',
          country: data.country || "",
          locationCoordinates: data.locationCoordinates || "",

        });

      
      } catch (error) {
        toast.error('Failed to fetch property details');
      }
    };

    fetchPropertyData();
  }, [ppcId]);

  // Fetch dropdown data for select fields
  useEffect(() => {
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

    fetchDropdownData();
  }, []);
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
  // Handle field changes for form data
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === "price") {
      if (value !== "" && !isNaN(value)) {
        setPriceInWords(convertToIndianRupees(value));
      } else {
        setPriceInWords("");
      }
    }
  };
 
 const handleVideoChange = (e) => {
  const selectedFiles = Array.from(e.target.files);
  const maxSize = 50 * 1024 * 1024; // 50MB

  const validFiles = selectedFiles.filter(file => {
    if (file.size > maxSize) {
      alert(`${file.name} exceeds the 50MB size limit.`);
      return false;
    }
    return true;
  });

  const totalCount = videos.length + validFiles.length;
  if (totalCount > 5) {
    alert("You can upload a maximum of 5 videos.");
    return;
  }

  setVideos([...videos, ...validFiles]);
};

 
   const removeVideo = (indexToRemove) => {
  setVideos(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  

  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; 
    for (let file of files) {
      if (file.size > maxSize) {
        alert('File size exceeds the 10MB limit');
        return;
      }
    }
    if (photos.length + files.length <= 15) {
      setPhotos([...photos, ...files]);
      setSelectedPhotoIndex(0); 
    } else {
      alert('Maximum 15 photos can be uploaded.');
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    // Keep the "default" pointer on the same photo after the list reflows.
    if (index === selectedPhotoIndex) {
      setSelectedPhotoIndex(0);
    } else if (index < selectedPhotoIndex) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  
  const handlePhotoSelect = (index) => {
    setSelectedPhotoIndex(index); 
  };


  // Revoke object URLs when component unmounts or photos change
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo instanceof Blob) {
          URL.revokeObjectURL(photo);
        }
      });
    };
  }, [photos]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ppcId) {
      alert("PPC-ID is required. Please refresh or try again.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("ppcId", ppcId);

    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    // Preserve the property's existing bucket. Without this the backend
    // resets the status and the property jumps between Approved / PreApproved.
    if (originalStatus) {
      formDataToSend.append("status", originalStatus);
    }

    // Place the user-selected default photo first so the backend treats it
    // as the primary image. Falls back to original order if the index is bad.
    const reorderedPhotos =
      selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length
        ? [
            photos[selectedPhotoIndex],
            ...photos.filter((_, i) => i !== selectedPhotoIndex),
          ]
        : photos;
    reorderedPhotos.forEach((photo) => {
      formDataToSend.append("photos", photo);
    });

    // Multer splits multipart parts: File objects end up in req.files['photos']
    // while existing photo URL strings end up in req.body.photos. That tears our
    // single ordered array into two unordered halves on the server.
    //
    // `photoOrder` tells the backend the exact final order, using `__NEW__N`
    // placeholders for newly uploaded files (N matches their position in
    // req.files['photos'], which is the order we append them above).
    let newCounter = 0;
    const photoOrder = reorderedPhotos.map((item) => {
      if (item instanceof File || item instanceof Blob) {
        return `__NEW__${newCounter++}`;
      }
      return item; // existing photo path string from the backend
    });
    formDataToSend.append("photoOrder", JSON.stringify(photoOrder));

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/update-property`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data.message);
    } catch (error) {
    }
       setTimeout(() => {
      navigate(-1);
    }, 3000);
  };
     const fieldIcons = {
        phoneNumber: <FaPhone color="#2F747F" />,
        rentalPropertyAddress: <MdLocationCity color="#2F747F" />,
        state: <MdLocationCity color="#2F747F" />,
        city: <FaCity color="#2F747F" />,
        district: <RiLayoutLine color="#2F747F" />,
        area: <FaCity color="#2F747F" />,
        streetName: <RiLayoutLine color="#2F747F" />,
        doorNumber: <FaRegBuilding color="#2F747F" />,
        nagar: <FaRegAddressCard color="#2F747F" />,
        ownerName: <FaRegBuilding color="#2F747F" />,
        email: <FaEnvelope color="#2F747F" />,
        alternatePhone: <FaPhone color="#2F747F" />,
        propertyMode: <MdApproval color="#2F747F" />,
        propertyType: <FaRegBuilding color="#2F747F" />,
        bankLoan: <BsBank color="#2F747F" />,
        negotiation: <FaRupeeSign color="#2F747F" />,
        ownership: <FaUserAlt color="#2F747F" />,
        bedrooms: <FaBed color="#2F747F" />,
        kitchen: <FaKitchenSet color="#2F747F" />,
        // kitchenType: <FaKitchenSet color="#2F747F" />,
        balconies: <FaRegBuilding color="#2F747F" />,
        floorNo: <BsBuildingsFill color="#2F747F" />,
        areaUnit: <FaChartArea color="#2F747F" />,
        propertyApproved: <FaCheckCircle color="#2F747F" />,
        propertyAge: <FaCalendarAlt color="#2F747F" />,
        postedBy: <FaRegBuilding color="#2F747F" />,
        facing: <GiHouse color="#2F747F" />,
        salesMode: <GiGears color="#2F747F" />,
        salesType: <FaRegBuilding color="#2F747F" />,
        furnished: <FaHome color="#2F747F" />,
        lift: <FaRegBuilding color="#2F747F" />,
        attachedBathrooms: <FaBath color="#2F747F" />,
        western: <FaBath color="#2F747F" />,
        numberOfFloors: <BsBuildingsFill color="#2F747F" />,
        carParking: <FaCar color="#2F747F" />,
        bestTimeToCall: <FaClock color="#2F747F" />,
        length: <MdStraighten color="#2F747F" />,
          breadth: <MdStraighten color="#2F747F" />,
          totalArea: <GiResize color="#2F747F" />,
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
        // kitchenType: "Kitchen Type",
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
  "description",
  "furnished",
  "lift",
  "attachedBathrooms",
  "western",
  // "numberOfFloors",
  "carParking",
  "YourProperty",
   "city",
  "district",
  "area",
    "alternatePhone",

  "bestTimeToCall"
];
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
 
  const currentIndex = filteredDropdownFieldOrder.indexOf(field);
if (currentIndex !== -1 && currentIndex < filteredDropdownFieldOrder.length - 1) {
  const nextField = filteredDropdownFieldOrder[currentIndex + 1];

  if (nonDropdownFields.includes(nextField)) {
    // Focus input field
    setTimeout(() => {
      const nextInput = document.querySelector(`[name="${nextField}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  } else {
    // Open next dropdown
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
    toggleDropdown(field); // Close current dropdown
 
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
const hiddenPropertyTypes = ['Plot', 'Land', 'Agricultural Land'];

const fieldsToHideForPlot = [
  'furnished',
  'lift',
  'attachedBathrooms',
  'western',
  // 'numberOfFloors',
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
  return (
    <div className="d-flex align-items-center justify-content-center">
    <div style={{
      width: '100%',
      maxWidth: '450px',
      minWidth: '300px',
      padding: '5px',
      borderRadius: '8px',
      margin: '0 5px',
    }} 
    >
      <h1>Edit Property</h1>

       <form  onSubmit={handleSubmit} className="addForm w-100">
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
    Upload Your Property Images
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

        const isDefault = selectedPhotoIndex === index;
        const ACCENT = "#4FC04F"; // bright green for ring + badges

        return (
          <div
            key={index}
            className="uploaded-photo-item position-relative"
            role="button"
            tabIndex={0}
            onClick={() => handlePhotoSelect(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePhotoSelect(index);
              }
            }}
            title={isDefault ? "Default photo" : "Click to set as default"}
            style={{
              cursor: "pointer",
              padding: "14px",
              borderRadius: "14px",
              border: isDefault
                ? `3px solid ${ACCENT}`
                : "3px solid transparent",
              background: isDefault ? "#E9FBE9" : "transparent",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
          >
            {/* Hidden radio retained for form semantics */}
            <input
              type="radio"
              name="selectedPhoto"
              checked={isDefault}
              onChange={() => handlePhotoSelect(index)}
              style={{
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
              }}
            />
            <img
              src={photoUrl}
              alt="Uploaded"
              className="uploaded-photo m-2"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />

            {/* Top-left green check badge — only on the default photo */}
            {isDefault && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: ACCENT,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  pointerEvents: "none",
                }}
              >
                <FaCheck size={12} />
              </span>
            )}

            {/* Bottom-center "DEFAULT" pill */}
            {isDefault && (
              <span
                style={{
                  position: "absolute",
                  bottom: "18px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: ACCENT,
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 12px",
                  borderRadius: "12px",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  pointerEvents: "none",
                }}
              >
                <FaCheck size={10} /> DEFAULT
              </span>
            )}

            <button
              type="button"
              style={{
                border: "none",
                background: "#fff",
                borderRadius: "50%",
                lineHeight: 0,
              }}
              className="position-absolute top-0 end-0 m-0 p-0"
              onClick={(e) => {
                e.stopPropagation();
                removePhoto(index);
              }}
            >
              <IoCloseCircle size={24} color="#F22952"/>
            </button>
          </div>
        );
      })}
            </div>
          </div>
        )}

<h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}> Property Video  </h4>
        {/* Video Upload Section */}
        <div className="form-group">
          <input
            type="file"
            name="video"
            accept="video/*"
            id="videoUpload"
            onChange={handleVideoChange}
            className="d-none"
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
              Upload Property Video
            </span>
          </label>

          {/* Display the selected video */}
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
    
                      // onClick={() => toggleDropdown("propertyType")}      
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
{/* // )} */}


{/* {currentStep >= 2 && ( */}
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
                   {!shouldHideField("bedrooms") && (
                    <>
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
  </>
  )}
  {/* kitchen */}
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
    )}
   
    {/* balconies */}
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
    )}
    {/* floorNo */}
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
    )}
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
  </div>)}
    {/*lift */}  {!shouldHideField("lift") && (
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
  )}
      {/*attachedBathrooms */}
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
   )}
    {/* western */}
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
   )}
   
    {/* carParking */}
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
  )}
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
  onClick={() => handleLatLngAuto(coordinateInput)}
  type="button">
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
      value={formData.area}
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
      type="text"
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
          value={formData.countryCode || "+91"}
          onChange={handleFieldChange}
          className="form-control m-0"
          style={{ width: '100%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
        >
          <option value="">Select Country Code</option>
          {countryCodes.map((item, index) => (
            <option key={index} value={item.code}>
              {item.code} - {item.country}
            </option>
          ))}
        </select>
      </label>
    </div>

    <input
      type="number"
      name="phoneNumber"
      value={formData.phoneNumber}
      onChange={handleFieldChange}
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
              {item.code} - {item.country}
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
                <Button
                  type="submit"
                  style={{ marginTop: '15px', backgroundColor: "rgb(47,116,127)", border:"none" }}
                >
                  update property
                </Button>
       
      </form>
    </div>
    </div>
  );
}

export default EditProperty;













