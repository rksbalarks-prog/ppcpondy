

 




import React, { useEffect, useState , useRef} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BiBed, BiBath, BiCar, BiMap, BiCalendar, BiUser, BiCube } from "react-icons/bi";
import { AiOutlineEye, AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { MdOutlineCurrencyRupee, MdElevator, MdOutlineChair, MdCall, MdOutlineNavigateNext, MdContentCopy } from "react-icons/md";
import { TbArrowLeftRight, TbMapPinCode } from "react-icons/tb";
import { BsGraphUp, BsBank, BsFilterCircle } from "react-icons/bs";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import { RiLayoutLine } from "react-icons/ri";
import { FaFacebook, FaRegHeart , FaLinkedin, FaPhone, FaRupeeSign, FaShareAlt, FaTwitter, FaUserAlt, FaWhatsapp, FaHeart, FaArrowLeft, FaClock, FaUser, FaEnvelope, FaPhoneAlt, FaRegListAlt } from "react-icons/fa";
import icon1 from '../Assets/ico_interest_xd.png';
import icon2 from '../Assets/ico_report_soldout_xd.png';
import icon4 from '../Assets/Shortlist Bike-01.png';

import icon3 from '../Assets/help1.png';
 import {  FaBalanceScale, FaFileAlt, FaGlobeAmericas, FaMapMarkerAlt, FaDoorClosed, FaMapSigns } from "react-icons/fa";
import { MdApproval, MdTimer, MdHomeWork, MdHouseSiding, MdOutlineKitchen, MdEmail, MdLocationCity, MdOutlineAccessTime , MdPhone } from "react-icons/md";
import {  BsBarChart } from "react-icons/bs";
import { BiRuler, BiBuilding, BiStreetView } from "react-icons/bi";
import { GiStairs, GiForkKnifeSpoon, GiWindow } from "react-icons/gi";
import { TiContacts, TiHome } from "react-icons/ti";
import contact from '../Assets/contact.png';
 import { IoIosArrowForward } from "react-icons/io";

import promotion from '../Assets/PUC_App Promotion_2.png'
import { ToWords } from 'to-words';

import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
} from "react-share";
import { Modal, Button, Form } from "react-bootstrap";
import { FiAlertCircle } from "react-icons/fi";
import ConfirmationModal from "./ConfirmationModal";
import { IoChevronBackSharp } from "react-icons/io5";
import { GrFormNext, GrNext } from "react-icons/gr";
import numberToWords from 'number-to-words';
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import moment from "moment";
import { CiShare2 } from "react-icons/ci";
import { FcSearch } from "react-icons/fc";
import PondyIcon from '../Assets/pondyMa.png';
import { PiShareFat } from "react-icons/pi";
import pic from '../Assets/default.png';
import { Carousel } from 'react-bootstrap';
// Per-listing <head>: title, description, canonical, share image and the
// RealEstateListing / BreadcrumbList structured data Google reads.
import Seo from './Seo';
import { buildPropertySeo } from '../utils/propertySeo';

const AnimatedHeart = ({ filled, onClick }) => {
  const [clicked, setClicked] = useState(false);
  const [startFill, setStartFill] = useState(false);

   React.useEffect(() => {
    if (filled) {
      setClicked(true);
      setTimeout(() => setStartFill(true), 600);
    } else {
      setClicked(false);
      setStartFill(false);
    }
  }, [filled]);

   const handleHeartClick = () => {
    if (onClick) onClick();
  };

  const strokeStyle = {
    fill: "none",
    stroke: "red",
    strokeWidth: 2,
    transition: "stroke-dashoffset 0.6s ease-in-out",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      onClick={handleHeartClick}
      style={{ cursor: "pointer" }}
    >
       <path
        d="M12 21s-6-4.35-9-8.6C.6 9.3 2.7 4.5 7.5 4.5c2.1 0 4.2 1.5 4.5 3.3C12.3 6 14.4 4.5 16.5 4.5 21.3 4.5 23.4 9.3 21 12.4 18 16.65 12 21 12 21z"
        fill={startFill ? "red" : "none"}
        style={{
          transition: "fill 0.4s ease-in",
        }}
      />
       <path
        d="M12 21s-6-4.35-9-8.6C.6 9.3 2.7 4.5 7.5 4.5c2.1 0 4.2 1.5 4.5 3.3"
        style={{
          ...strokeStyle,
          strokeDasharray: 100,
          strokeDashoffset: clicked ? 0 : 100,
        }}
      />
       <path
        d="M12 21s6-4.35 9-8.6C23.4 9.3 21.3 4.5 16.5 4.5c-2.1 0-4.2 1.5-4.5 3.3"
        style={{
          ...strokeStyle,
          strokeDasharray: 100,
          strokeDashoffset: clicked ? 0 : 100,
        }}
      />
    </svg>
  );
};

const Details = () => {
  const [popupType, setPopupType] = useState("");  

  const [imageError, setImageError] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [Viewed, setViewed] = useState(false);
const [isRequested, setIsRequested] = useState(false);

  const [popupSubmitHandler, setPopupSubmitHandler] = useState(() => () => {});
  const [popupTitle, setPopupTitle] = useState("Report Property");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
   const mapRef = useRef(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
const [allNearbyPlaces, setAllNearbyPlaces] = useState([]);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isShareMenuVisible, setIsShareMenuVisible] = useState(false);
  const shareMenuRef = useRef(null)
  const [clicked, setClicked] = useState(false);

const [limitPerDay, setLimitPerDay] = useState(null);  
  const [copied, setCopied] = useState(false);

const [videos, setVideos] = useState([]);


  const [uploads, setUploads] = useState([]);


const [dailyViewsCount, setDailyViewsCount] = useState(0);
const [remainingViews, setRemainingViews] = useState(0);
const [planName, setPlanName] = useState("");
const [expiryDate, setExpiryDate] = useState(null);
const [canViewToday, setCanViewToday] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);

  const [isScrolling, setIsScrolling] = useState(false);

const [addressRequested, setAddressRequested] = useState(false);




  const handleAddressRequest = async () => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber");

  if (!storedPhoneNumber || !propertyDetails.ppcId) {
    setMessage("Phone number and PPC ID are required.");
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/request-address`, {
      ppcId: propertyDetails.ppcId,
      requesterPhoneNumber: storedPhoneNumber
    });

    setMessage(response.data.message);
  } catch (error) {
    setMessage(error.response?.data?.message || "Failed to send address request.");
  }
};


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
  const handleOpenPopup = () => {
    setPopupTitle("Report Property");
    setShowPopup(true);
  };


  const ReporthandleSubmit = async () => {
    if (!reason) {
      setMessage("Please select a valid reason");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/report-property`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: userPhoneNumber,
          ppcId: ppcId,
          reason: comment,
          selectReasons: reason,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        setPropertyClicked(true);
        setMessage(result.message || "Report submitted successfully.");
        setShowPopup(false);
      } else {
        if (result.status === "alreadyReported") {
          setPropertyClicked(true);
          setMessage("You have already submitted this report.");
        } else {
          setMessage(result.message || "Failed to submit report.");
        }
      }
    } catch (error) {
      setMessage("An error occurred while submitting the report.");
    }
    setPopup(false);
  };
  
  const handleHelpSubmit = async ({ reason, comment }) => {
    if (!reason) {
      setMessage("Please select a valid help reason.");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/need-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: userPhoneNumber, 
          ppcId: ppcId,  
          selectHelpReason: reason,
          comment,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        setHelpClicked(true);
        setMessage(result.message || "Help request submitted.");
        setShowPopup(false);
      } else {
        if (result.status === "alreadyRequested") {
          setHelpClicked(true);
          setMessage("You have already submitted this help request.");
        } else {
          setMessage(result.message || "Failed to submit help request.");
        }
      }
    } catch (error) {
      setMessage("An error occurred while submitting help request.");
    }
    setPopup(false);

  };
  useEffect(() => {
  const fetchUploadedImages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-uploadimages-ads-detail`);
      setUploads(res.data.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch uploaded images');
    } finally {
      setLoading(false);
    }
  };
  fetchUploadedImages();
}, []);


  const handleImageError = (index) => {
    setImageError((prev) => ({ ...prev, [index]: true }));
  };
  const [videoUrl, setVideoUrl] = useState(null);
  const [showPopup, setShowPopup] = useState(false);  
  const [Popup, setPopup] = useState(false);  
const [ownerDetails, setOwnerDetails] = useState(null);

 const [finalContactNumber, setFinalContactNumber] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showOwnerContact, setShowOwnerContact] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [message, setMessage] = React.useState(null);
const [messageType, setMessageType] = React.useState("info");  
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [favoritedUserPhoneNumbers, setFavoritedUserPhoneNumbers] = useState([]);
  const [property, setProperty] = useState(null);
  const [viewedProperties, setViewedProperties] = useState([]);

  const [popupMessage, setPopupMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [imageCount, setImageCount] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
   const [showShareOptions, setShowShareOptions] = useState(false);
  const [interestClicked, setInterestClicked] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingOfferData, setPendingOfferData] = useState(null);

  const location = useLocation();
  const { ppcId } = useParams();
const contactRef = useRef(null);

const [setPpcId, setSetPpcId] = useState(false);
const [assignedPhoneNumber, setAssignedPhoneNumber] = useState("");
const [postedUserPhoneNumber, setPostedUserPhoneNumber] = useState("");




  const {  phoneNumber } = location.state || {};
  const [price, setPrice] = useState("");
  const [properties, setProperties] = useState([]);
  
  const [photoRequested, setPhotoRequested] = useState(
    JSON.parse(localStorage.getItem(`photoRequested-${property?.ppcId}`)) || false
  );
   const [viewCount, setViewCount] = useState(0);

  const [isHeartClicked, setIsHeartClicked] = useState(() => {
     const storedState = localStorage.getItem(`isHeartClicked-${ppcId}`);
    return storedState ? JSON.parse(storedState) : false;
  });
  const [startFill, setStartFill] = useState(false);
 const [selectCalledReasons, setSelectCalledReasons] = useState('');
  const [reasonCalled, setReasonCalled] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [show, setShow] = useState(true);

  const allowedReasons = [
    'Already Sold',
    'Wrong Information',
    'Not Responding',
    'Fraud',
    'Duplicate Ads',
    'Other',
  ];

  const handleSubmitt = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/called-experience`,
        {
          phoneNumber: userPhoneNumber,
          ppcId,
          reasonCalled,
          selectCalledReasons,
        }
      );

      if (response.data.status === 'calledExperienceLogged') {
        setStatusMessage('Your call experience has been recorded!');
        setShowPopup(false);  
      } else if (response.data.status === 'alreadyCalled') {
        setError('You have already shared your call experience for this property.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    }
    setShow(false);

  };


  const handleHeartAnimationClick = () => {
    setIsHeartClicked(true);  
    setTimeout(() => setStartFill(true), 600);  
  };
  const popupRef = useRef(null);

  const toggleShareOptions = () => {
    setShowShareOptions((prev) => !prev);
  };
 const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);  
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    };

    if (showShareOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareOptions]);
  const strokeStyle = {
    fill: "none",
    stroke: "red",
    strokeWidth: 2,
    transition: "stroke-dashoffset 0.6s ease-in-out",
  };

  const navigate = useNavigate();
  const getGoogleMapsLink = () => {
  const coords = parseCoordinates(propertyDetails?.locationCoordinates);
  if (!coords) return '';
  return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
};

useEffect(() => {
    if (!window.google || !propertyDetails?.locationCoordinates || !mapRef.current) return;

    const coords = parseCoordinates(propertyDetails.locationCoordinates);
    if (!coords) return;

    // Clear any previous map content
    mapRef.current.innerHTML = "";

    const map = new window.google.maps.Map(mapRef.current, {
      center: coords,
      zoom: 15,
    });

    new window.google.maps.Marker({
      position: coords,
      map,
      icon: {
        url: PondyIcon,
        scaledSize: new window.google.maps.Size(20, 20),
      },
      title: "Property Location",
    });
  }, [propertyDetails?.locationCoordinates, PondyIcon]);

const parseCoordinates = (coordString) => {
  const regex = /([+-]?\d+(\.\d+)?)[^\d+-]+([+-]?\d+(\.\d+)?)/;
  const match = coordString.match(regex);
  if (!match) return null;

  return {
    lat: parseFloat(match[1]),
    lng: parseFloat(match[3]),
  };
};
const placeTypes = [
  "restaurant",    
  "school",        
  "bakery",        
  "park",       
  "gym",          
  "atm",          
  "bank",        
  "hospital",    
  "pharmacy"      
];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setIsShareMenuVisible(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

   useEffect(() => {
    const interestSaved = localStorage.getItem(`interestSent-${ppcId}`);
    if (interestSaved) {
      setInterestClicked(true);
    }
  }, [ppcId]);

 

const [soldOutClicked, setSoldOutClicked] = useState(
  JSON.parse(localStorage.getItem(`soldOutReported-${ppcId}`)) || false
);
const [propertyClicked, setPropertyClicked] = useState(
  JSON.parse(localStorage.getItem(`propertyReported-${ppcId}`)) || false
);
const [helpClicked, setHelpClicked] = useState(
  JSON.parse(localStorage.getItem(`helpRequested-${ppcId}`)) || false
);

useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 5000);  
    return () => clearTimeout(timer); 
  }
}, [message]);


useEffect(() => {
  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/properties`);
      setProperties(response.data.data);
    } catch (error) {
    }
  };

  fetchProperties();
}, []);


 const fetchImageCount = async () => {
  if (!ppcId) {
    return;
  }

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/uploads-count`, 
      { params: { ppcId } } 
    );

    setImageCount(response.data.uploadedImagesCount);
    setUploadedImages(response.data.uploadedImages);
  } catch (error) {
  }
};


  useEffect(() => {
    if (ppcId || phoneNumber) {
      fetchImageCount();
    }
  }, [phoneNumber, ppcId]);

 

  useEffect(() => {
    const savedState = localStorage.getItem("isHeartClicked");
    if (savedState) {
      setIsHeartClicked(JSON.parse(savedState));
    }

    if (ppcId || phoneNumber) {
      fetchImageCount();
    }
  }, [phoneNumber, ppcId]);



const fetchPropertyDetails = async (ppcId) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/property/${ppcId}`);
    setProperty(response.data);
  } catch (error) {
  }
};

  useEffect(() => {
  if (ppcId) {
    fetchPropertyDetails(ppcId);
  }
}, [ppcId]);


 


const handleSubmit = async ({ price, ppcId }) => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber");

  if (!storedPhoneNumber || !ppcId || !price) {
    setMessage("Price, Phone Number, and Property ID are required.");
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/offer`, {
      price,
      phoneNumber: storedPhoneNumber,  
      ppcId,
    });

    const { message, status } = response.data;

    if (status === "offerSaved") {
      setMessage("Offer saved successfully.");
      setPrice('');
    } else if (status === "offerExists") {
      setMessage("An offer has already been made for this property.");
    } else {
      setMessage(message || "Offer submitted.");
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || "Error saving offer.";
    setMessage(errMsg);
  } finally {
    setPendingOfferData(null);
  }
};


      
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-data-on-demand?ppcId=${ppcId}`);
        setPropertyDetails(response.data.user);
      } catch (err) {
       } finally {
        setLoading(false);
      }
    };

    if (ppcId) fetchPropertyData();
  }, [ppcId]);



  const handleIncreasePpcId = () => {
    const nextPpcId = Number(ppcId) + 1;
    navigate(`/detail/${nextPpcId}`);  
    window.scrollTo(0, 0);  
  };

  
  const handleGoBack = () => {
    navigate(-1);
    window.scrollTo(0, 0); 
  };

    const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const swipeThreshold = 50;  

    if (touchStartX !== null) {
      const deltaX = touchEndX - touchStartX;
      if (deltaX > swipeThreshold) {
        handleGoBack();  
      } else if (deltaX < -swipeThreshold) {
        handleIncreasePpcId();  
      }
    }
    setTouchStartX(null);
  };



useEffect(() => {
  const fetchVideos = async () => {
    try {
       if (propertyDetails?.video) {
        let videoUrls = [];

        if (Array.isArray(propertyDetails.video)) {
          videoUrls = [...new Set(
            propertyDetails.video.map(video =>
              `https://ppcpondy.com/PPC/${video.replace(/\\/g, "/").replace(/^\/+/, "").trim()}`
            )
          )];
        } else if (typeof propertyDetails.video === "string" && propertyDetails.video.trim()) {
          videoUrls = [
            `https://ppcpondy.com/PPC/${propertyDetails.video.replace(/\\/g, "/").replace(/^\/+/, "").trim()}`
          ];
        }

        setVideos(videoUrls);
        return;
      }

       if (propertyDetails?.ppcId) {
       const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-property-video/${propertyDetails.ppcId}`);


        if (data?.video?.video) {
          const cleanUrl = `https://ppcpondy.com/PPC/${data.video.video.replace(/\\/g, "/").replace(/^\/+/, "").trim()}`;
          setVideos([cleanUrl]);
        }
      }
    } catch (err) {
      console.error("Failed to load video:", err);
      setVideos([]);  
    }
  };

  fetchVideos();
}, [propertyDetails?.video, propertyDetails?.ppcId]);



  useEffect(() => {
  console.log("Videos loaded:", videos);  
}, [videos]);


const getMimeType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "ogg": return "video/ogg";
    case "mov": return "video/quicktime";
    case "mkv": return "video/x-matroska";
    default: return "video/mp4";
  }
};


   const handleVideoPlay = () => {
    setShowPopup(true);
  };
  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setShowModal(true);
  };

  


  const maxImages = 15;
      const [currentIndex, setCurrentIndex] = useState(1);
    
      const handleSlideChange = (swiper) => {
        setCurrentIndex(swiper.realIndex + 1);
      };
  const closeModal = () => setShowModal(false);



  const toggleContactDetails = () => {
    setShowContactDetails(prevState => !prevState);
  };


  const closeOwnerContactModal = () => {
    setShowOwnerContact(false); 
  };

  if (loading) return   <div className="text-center my-4"
  style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
  }}>
  <span className="spinner-border text-primary" role="status" />
  <p className="mt-2">Loading properties details...</p>
</div>;
  if (error) return <p>{error}</p>;
  if (!propertyDetails) return   <div className="text-center my-4 "
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
  
    }}>
  <img src={NoData} alt="" width={100}/>      
  <p>No properties details found.</p>
  </div>  ;


 const images = propertyDetails.photos && propertyDetails.photos.length > 0
  ? [...new Set(
      propertyDetails.photos.map(photo =>
        `https://ppcpondy.com/PPC/${photo.replace(/\\/g, "/").replace(/^\/+/, "").trim()}`
      )
    )]
  : [];


 
   
const formattedCreatedAt = Date.now
? moment(propertyDetails.createdAt).format("DD-MM-YYYY") 
: "N/A";


    
  const propertyDetailsList = [
        { heading: true, label: "Basic Property Info" },  
        { icon: <MdHomeWork />, label: "Property Mode", value:  propertyDetails.propertyMode},
        { icon: <MdHouseSiding />, label: "Property Type", value: propertyDetails.propertyType },
         { icon: <AiOutlineColumnWidth />, label: "Length", value: propertyDetails.length },
        { icon: <AiOutlineColumnHeight />, label: "Breadth", value: propertyDetails.breadth  },
         {
          icon: <RiLayoutLine />,
          label: "Total Area",
          value: `${propertyDetails.totalArea} ${propertyDetails.areaUnit}`, // Combined value
        },
         { icon: <FaUserAlt />, label: "Ownership", value: propertyDetails.ownership },
        { icon: <MdApproval />, label: "Property Approved", value: propertyDetails.propertyApproved },
        { icon: <MdTimer />, label: "Property Age", value: propertyDetails.propertyAge },
        { icon: <BsBank />, label: "Bank Loan", value: propertyDetails.bankLoan },

        { label: "No.of.Views", value: "5", icon: <AiOutlineEye /> },

        { heading: true, label: "Property Features" },  
        { icon: <BiBed />, label: "Bedrooms", value: propertyDetails.bedrooms },
        { icon: <GiStairs />, label: "Floor No", value:propertyDetails.floorNo },
        { icon: <GiForkKnifeSpoon />, label: "Kitchen", value: propertyDetails.kitchen},
        { icon: <MdOutlineKitchen />, label: "Kitchen Type", value: propertyDetails.kitchenType },
        { icon: <GiWindow />, label: "Balconies", value: propertyDetails.balconies},
        { icon: <BiCube />, label: "Floors", value: propertyDetails.numberOfFloors },
    { label: "Western", value: propertyDetails.western, icon: <BiBath /> },
    { label: "Attached", value: propertyDetails.attachedBathrooms, icon: <BiBath /> },

        { icon: <BiCar />, label: "Car Park", value: propertyDetails.carParking },
        { icon: <MdElevator />, label: "Lift", value: propertyDetails.lift },
        { heading: true, label: "Other details" },  
    
        { icon: <MdOutlineChair />, label: "Furnished", value: propertyDetails.furnished },
        { icon: <TbArrowLeftRight />, label: "Facing", value: propertyDetails.facing },

        { icon: <BsGraphUp />, label: "Sale Mode", value: propertyDetails.salesMode },
        { icon: <BsBarChart />, label: "Sales Type", value: propertyDetails.salesType },
        { icon: <BiUser />, label: "Posted By", value: propertyDetails.postedBy },
     { icon: <BiCalendar />, label: "Posted On", value:formattedCreatedAt },
        { heading: true, label: "Description"  },  
        { icon: <FaFileAlt />, label: "Description" ,value: propertyDetails.description },
      
        { heading: true, label: "Property Location " },  
      
         { icon: <FaGlobeAmericas />, label: "Country", value: propertyDetails.country },
        { icon: <BiBuilding />, label: "State", value: propertyDetails.state },
        { icon: <MdLocationCity />, label: "City", value: propertyDetails.city },
        { icon: <FaMapMarkerAlt />, label: "District", value:  propertyDetails.district},
        { icon: <FaMapSigns />, label: "Nagar", value: propertyDetails.nagar },
        { icon: <FaMapMarkerAlt />, label: "Area", value: propertyDetails.area },
        { icon: <BiStreetView />, label: "Street Name", value: propertyDetails.streetName },

        { icon: <FaDoorClosed />, label: "Door Number", value: propertyDetails.doorNumber },
   { icon: <TbMapPinCode />, label: "pinCode", value: propertyDetails.pinCode },
    { icon: <TbMapPinCode />, label: "location Coordinates", value: propertyDetails.locationCoordinates },

       
      ];

const excludedPropertyTypes = ["Plot", "Land", "Agricultural Land"];

const filteredDetailsList = propertyDetailsList.filter((item) => {
  const isPropertyFeatureSection =
    item.label === "Property Features" ||
    ["Bedrooms", "Floor No", "Kitchen", "Kitchen Type", "Balconies", "Floors", "Western", "Attached", "Car Park", "Lift","Furnished" ].includes(item.label);

   if (excludedPropertyTypes.includes(propertyDetails.propertyType)) {
    return !isPropertyFeatureSection;
  }

  return true;  
});

const scrollToContact = () => {
  if (contactRef.current) {
    const elementTop = contactRef.current.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: elementTop - 100,  
      behavior: 'smooth'
    });

   }
};



const handleOwnerContactClick = async () => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber");
  setViewed(true);
  setTimeout(() => setViewed(false), 300);

  try {
    if (!storedPhoneNumber || !ppcId) {
      setMessage("Phone number and Property ID are required.");
      return;
    }

     const contactResponse = await axios.post(`${process.env.REACT_APP_API_URL}/contact`, {
      phoneNumber: storedPhoneNumber,
      ppcId,
    });

    const {
      success,
      setPpcId,
      assignedPhoneNumber,
      postedUserPhoneNumber,
      views,
      createdAt,
      updatedAt,
      contactLimitPerDay,
      remainingContacts,
      message: contactMessage,
    } = contactResponse.data;

    if (success) {
      const finalNumber = setPpcId ? assignedPhoneNumber : postedUserPhoneNumber;
      
      setSetPpcId(setPpcId);
      setAssignedPhoneNumber(assignedPhoneNumber);
      setPostedUserPhoneNumber(postedUserPhoneNumber);
      setFinalContactNumber(finalNumber);
      setOwnerDetails({ views, createdAt, updatedAt });
      setShowContactDetails(true);

      setMessage(
        `Contact shared. You have ${remainingContacts} / ${contactLimitPerDay} remaining today.`
      );

      setTimeout(scrollToContact, 100);
    }
  } catch (error) {
    if (error?.response?.status === 429) {
      const limit = error.response?.data?.contactLimitPerDay || 0;
      setMessage(`Daily contact limit of ${limit} reached. Try again tomorrow.`);
    } else {
      setMessage("Failed to contact owner. Please try again.");
    }
  }
};

 
const handleInterestClick = async () => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber");

  if (!storedPhoneNumber || !ppcId) {
    setMessage("Phone number and Property ID are required.");
    return;
  }

  if (interestClicked || localStorage.getItem(`interestSent-${ppcId}`)) {
    setMessage("Interest already recorded for this property.");
    setInterestClicked(true);
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-interests`, {
      phoneNumber: storedPhoneNumber,
      ppcId,
    });

    const { message, status } = response.data;

    if (status === "sendInterest") {
      setMessage("Interest sent successfully!");
      setInterestClicked(true);
      localStorage.setItem(`interestSent-${ppcId}`, JSON.stringify(true));
    } else if (status === "alreadySaved") {
      setMessage("Interest already recorded for this property.");
      setInterestClicked(true);
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || "Something went wrong.";
    setMessage(errMsg);
  }
};


const handleReportSoldOut = async () => {
    const storedPhoneNumber = localStorage.getItem("phoneNumber");

  if (!storedPhoneNumber || !ppcId) {
    setMessage("Phone number and Property ID are required.");
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/report-sold-out`, {
      phoneNumber:storedPhoneNumber,
      ppcId,
    });

    const { message, status, postedUserPhoneNumber } = response.data;

    if (status === "soldOut") {
      setMessage(`Property reported as sold out.`);
      setPostedUserPhoneNumber(postedUserPhoneNumber);
      setSoldOutClicked(true);
      localStorage.setItem(`soldOutReported-${ppcId}`, JSON.stringify(true));
    } else if (status === "alreadyReported") {
      setMessage("This property is already reported as sold out.");
    }
  } catch (error) {
    setMessage(error.response?.data?.message || "Failed to report property as sold out.");
  }
};

const handleReportProperty = async () => {
  if (!phoneNumber || !ppcId) {
    setMessage("Phone number and Property ID are required.");
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/report-property`, {
      phoneNumber,
      ppcId,
    });

    const { status, message, postedUserPhoneNumber } = response.data;

    if (status === "reportProperties") {
      setMessage(`Property reported. Owner's Phone: ${postedUserPhoneNumber}`);
      setPostedUserPhoneNumber(postedUserPhoneNumber);
      setPropertyClicked(true);
      localStorage.setItem(`propertyReported-${ppcId}`, JSON.stringify(true));
    } else if (status === "alreadySaved") {
      setMessage("This property has already been reported.");
    }
  } catch (error) {
    setMessage(error.response?.data?.message || "Failed to report the property.");
  }
};




const handleNeedHelp = async () => {
  try {
    if (!phoneNumber || !ppcId) {
      setMessage("Phone number and Property ID are required.");
      return;
    }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/need-help`, {
      phoneNumber,
      ppcId,
    });

    const { status, message, postedUserPhoneNumber } = response.data;

    if (status === "needHelp") {
        setMessage(`NeedHelp request sent.`);
        setPostedUserPhoneNumber(postedUserPhoneNumber);
        setHelpClicked(true);
        localStorage.setItem(`helpRequested-${ppcId}`, JSON.stringify(true));
    } else if (status === "alreadySaved") {
      setMessage("This property has already been reported.");

    }
  } catch (error) {
    
  }
};



 const confirmActionHandler = (actionType, actionMessage) => {
  setPopupMessage(actionMessage);
  setShowPopup(true);
  setConfirmAction(() => () => {
    actionType();
    setShowPopup(false);
  });
};


const cards = [
  {
    img: icon1,
    text: interestClicked ? "Interest Sent" : "Send Your Interest",
    onClick: () => {
      if (interestClicked) {
        setMessage("Your interest is already sent.");
        return;
      }
      confirmActionHandler(handleInterestClick, "Are you sure you want to send interest?");
    },
  },
  {
    img: icon2,
    text: soldOutClicked ? "Sold Out Reported" : "Report Sold Out",
    onClick: () => {
      if (soldOutClicked) {
        setMessage("Sold out report already submitted.");
        return;
      }
      confirmActionHandler(handleReportSoldOut, "Are you sure you want to report this property as sold out?");
    },
  },

{
  img: icon4,
  text: propertyClicked ? "Property Reported" : "Report Property",
  onClick: () => {
    if (propertyClicked) {
      setMessage("This property is already reported.");
      return;
    }
    setPopupTitle("Report Property");
    setPopupType("report");
    setPopup(true);
  },
},
{
  img: icon3,
  text: helpClicked ? "Help Requested" : "Need Help",
  onClick: () => {
    if (helpClicked) {
      setMessage("Help request already submitted.");
      return;
    }
    setPopupTitle("Need Help");
    setPopupType("help");
    setPopup(true);
  },
}

];





const handleHeartClick = async () => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber");
  if (!storedPhoneNumber || !ppcId) return;

  const apiEndpoint = isHeartClicked
    ? `${process.env.REACT_APP_API_URL}/remove-favorite`
    : `${process.env.REACT_APP_API_URL}/add-favorite`;

  try {
    const response = await axios.post(apiEndpoint, {
      phoneNumber: storedPhoneNumber, 
      ppcId,
    });

    const { status, message, postedUserPhoneNumber } = response.data;

    if (status === "favorite") {
      setIsHeartClicked(true);
      setMessage("Favorite request sent.");
      setPostedUserPhoneNumber(postedUserPhoneNumber);
      localStorage.setItem(`isHeartClicked-${ppcId}`, "true");
    } else if (status === "favoriteRemoved") {
      setIsHeartClicked(false);
      setMessage("Your favorite was removed.");
      setPostedUserPhoneNumber("");
      localStorage.setItem(`isHeartClicked-${ppcId}`, "false");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";

    if (errorMessage.includes("already in your favorites")) {
      setMessage("This property is already in your favorites.");
    } else if (errorMessage.includes("not in your favorites")) {
      setMessage("This property was not in your favorites.");
    } else {
      setMessage(errorMessage);
    }

    setIsHeartClicked(isHeartClicked);  
  }
};


 

  const toWords = new ToWords({
    localeCode: 'en-IN',  
    converterOptions: {
      currency: false,
      ignoreDecimal: true,
    }
  });
 

   const formattedPrice =
    propertyDetails?.price && typeof propertyDetails.price === 'number'
      ? new Intl.NumberFormat('en-IN').format(propertyDetails.price)
      : propertyDetails?.price || 'N/A';

   const priceInWords =
    propertyDetails?.price && typeof propertyDetails.price === 'number'
      ? (() => {
          const price = propertyDetails.price;
          if (price >= 10000000) {
            return (price / 10000000)
              .toFixed(2)
              .replace(/\.00$/, '') + ' Crores';
          } else if (price >= 100000) {
            return (price / 100000)
              .toFixed(2)
              .replace(/\.00$/, '') + ' Lakhs';
          } else {
            return (
              numberToWords
                .toWords(price)
                .replace(/\b\w/g, (l) => l.toUpperCase()) + ' Rupees'
            );
          }
        })()
      : propertyDetails?.price || 'N/A';




  const handlePhotoRequest = () => {
    setPopupMessage("Are you sure you want to request a photo?");
    setConfirmAction(() => confirmPhotoRequest); 
    setShowPopup(true);
  };

  const confirmPhotoRequest = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/photo-request`, {
        ppcId: property.ppcId,
        requesterPhoneNumber: userPhoneNumber,
      });
  
      setMessage("Photo request submitted successfully!");
      setPhotoRequested(true);  
      localStorage.setItem(`photoRequested-${property.ppcId}`, JSON.stringify(true));  
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit photo request.");
    } finally {
      setShowPopup(false);  
      setTimeout(() => setMessage(""), 3000);  
    }
  };
  

const currentUrl = `${window.location.origin}${location.pathname}`;

// Search/social metadata for this listing, derived from the fetched record.
const seo = buildPropertySeo(propertyDetails, `/details/${ppcId}`);

  return (
    <div className="container d-flex align-items-center justify-content-center p-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>
      {seo && (
        <Seo
          title={seo.title}
          description={seo.description}
          keywords={seo.keywords}
          path={seo.path}
          image={seo.image}
          type={seo.type}
          jsonLd={seo.jsonLd}
          jsonLdId="property"
        />
      )}


            <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{fontFamily: "Inter, sans-serif", maxWidth: '500px', margin: 'auto', width: '100%' }}>
            <div className="row g-2 w-100">

 <div className="d-flex align-items-center justify-content-start w-100 "
       style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}
  >
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
    </button>
<h3 className="m-0" style={{fontSize:"15px"}}>PROPERTY DETAILS </h3> </div>
    

<div className="mb-0 position-relative">
  {/* "Last Call Experience" modal — disabled per product request.
  <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Last Call Experience</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Form onSubmit={handleSubmitt}>
            <Form.Group controlId="selectCalledReasons">
              <Form.Label>Select Reason</Form.Label>
              <Form.Control
                as="select"
                value={selectCalledReasons}
                onChange={(e) => setSelectCalledReasons(e.target.value)}
                required
              >
                <option value="">-- Select --</option>
                {allowedReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="reasonCalled" className="mt-3">
              <Form.Label>Comments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reasonCalled}
                onChange={(e) => setReasonCalled(e.target.value)}
                placeholder="Explain your experience (optional)"
              />
            </Form.Group>

            <Button type="submit" className="mt-4" variant="primary" style={{ backgroundColor: '#5D45C0', border: 'none' }}>
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
  */}
  <Swiper loop={true} navigation={{
      prevEl: ".swiper-button-prev-custom",
      nextEl: ".swiper-button-next-custom",
    }}  modules={[Navigation]} 
  onSlideChange={handleSlideChange}
  className="swiper-container"
  >
{images.length > 0
    ? images.map((image, index) => (
<SwiperSlide key={`${image}-${index}`}>
          <div
          onClick={() => handleImageClick(index)}
            className="d-flex justify-content-center align-items-center position-relative"
            style={{
              height: "200px",
              width: "100%",
              overflow: "hidden",
              borderRadius: "8px",
              margin: "auto",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <img
              src={image}
              alt={`Property Image ${index + 1}`}
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </SwiperSlide>
      ))
    : 
      [
        <SwiperSlide key="default">
          <div
            className="d-flex justify-content-center align-items-center position-relative"
            style={{
              height: "200px",
              width: "100%",
              overflow: "hidden",
              borderRadius: "8px",
              margin: "auto",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <img
              src={pic}
              alt="Default Property Image"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
              }}
            />
           
<button
  className="btn"
  style={{
    border:"none",
    position: "absolute",
    bottom: "20%",
    right: "10px",
    padding: "5px 10px",
    fontSize: "14px",
    cursor: "pointer",
    zIndex: 10,
    color:"#ffffff",
    background: photoRequested ? "#3F61D8" : "#34ACD6", // Green if already requested
  }}
  onClick={!photoRequested ? handlePhotoRequest : null} // Disable re-clicking
>
  {photoRequested ? "Photo Request Sent" : "Photo Request"}
</button>



          </div>
        </SwiperSlide>,
      ]}

     {videos.length > 0 && (
  <>
    <h4 className="text-start mt-3">Selected Videos:</h4>
    <Swiper slidesPerView={1} spaceBetween={20}>
      {videos.map((videoUrl, index) => (
        <SwiperSlide key={index}>
          <div style={{ position: "relative" }}>
            <video
              controls
              preload="metadata"
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
              onError={() => console.error("Video failed to load:", videoUrl)}
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl.replace(/\.\w+$/, ".webm")} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </>
)}



    </Swiper>
  <style>
    {`
      .swiper-button-next, .swiper-button-prev {
        color: white !important;
        font-size: 24px !important;
      }
    `}
  </style>
     <div className="d-flex w-100 justify-content-end position-absolute bottom-0 end-0" style={{ zIndex: 1050}}>  
      <button className="swiper-button-prev-custom text-center me-1"  style={{
    background: "#019988",
    height: "30px",
    width: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px", // optional, adjust arrow size
    color: "white",   // optional, arrow color
    border: "none",   // optional, remove border
    borderRadius: "4px" // optional, rounded corners
  }}>❮</button>
      <button className="swiper-button-next-custom" style={{
    background: "#019988",
    height: "30px",
    width: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px", // optional, adjust arrow size
    color: "white",   // optional, arrow color
    border: "none",   // optional, remove border
    borderRadius: "4px" // optional, rounded corners
  }}>❯</button>
    </div>
  {/* </div> */}
<div className="position-absolute bottom-0 start-50 translate-middle-x text-center mt-2" style={{ zIndex: 1050 , color:"white"}}>
    {Math.min(currentIndex, images.length)}/{maxImages}
  </div>
</div>
       <span
        className="p-2 mt-3 "
        style={{
          backgroundColor: "rgb(47,116,127)",
                    color: "white",
                    borderRadius: "5px",
                    width: "auto",
                    fontSize:'12px',
                    marginLeft:"10px"
        }}
      >
        PPC_ID : {propertyDetails.ppcId}
      </span>



  
      <div className="d-flex justify-content-between align-items-center mt-1" style={{paddingLeft:"10px",
    paddingRight:"10px"}}>
 
 <p className="text-start m-0"style={{
    color: "black",
    fontWeight: 'bold',
    fontSize: "16px",

  }}>
       <strong>{propertyDetails.propertyMode} |  {propertyDetails.propertyType}</strong>  
        </p>
 
<div className="d-flex justify-content-center align-items-center gap-3 position-relative text-center" style={{height: 'auto'}}>
           <div style={{ position: 'relative' }}>
      <FaShareAlt
        style={{ cursor: 'pointer', fontSize: '20px', color: '#30747F' }}
        onClick={toggleShareOptions}

      />
{showShareOptions && (
<div
  className="d-flex flex-row justify-content-between p-3"
  ref={popupRef}
  style={{
    position: 'absolute',
    top: '30px',
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 10,
    minWidth: '300px',
    gap: '12px',
  }}
>
   {navigator.share && (
    <button className="p-0"
      onClick={() => {
        const temp = document.createElement('div');
        temp.innerHTML = `<a href="${window.location.href}">${window.location.href}</a>`;
        document.body.appendChild(temp);

        navigator.clipboard
          .writeText(window.location.href)
          .then(() => {
            navigator.share({
              title: document.title,
              url: window.location.href,
            });
          })
          .catch(() => {
            navigator.share({
              title: document.title,
              text: window.location.href,
              url: window.location.href,
            });
          })
          .finally(() => {
            document.body.removeChild(temp);
          });
      }}
        style={{
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
fontSize:"13px",
     whiteSpace: 'normal',      // Allow text wrapping
    overflow: 'visible',       // Don't hide overflow
    wordBreak: 'break-word',   // Break long words if needed
  }}
    >
      <PiShareFat /> Share via...
    </button>
  )}
    <div className="d-flex justify-content-between align-items-center gap-3">

       <MdContentCopy onClick={handleCopy} style={{ border: 'none', background: 'none', cursor: 'pointer', color:"grey" }}/>
    {copied && (
      <span style={{ color: 'green', fontSize: '14px' }}>Copied!</span>
    )}
</div>
   {(!navigator.share || window.innerWidth > 768) && (
    <div className="d-flex gap-3">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#3b5998', display: 'flex', alignItems: 'center' }}
      >
        <FaFacebook />
      </a>

      <a
        href={`https://${window.innerWidth <= 768 ? 'api' : 'web'}.whatsapp.com/send?text=${encodeURIComponent("View this: " + window.location.href)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#25D366', display: 'flex', alignItems: 'center' }}
      >
        <FaWhatsapp />
      </a>

      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("View this:")}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1DA1F2', display: 'flex', alignItems: 'center' }}
      >
        <FaTwitter />
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0077b5', display: 'flex', alignItems: 'center' }}
      >
        <FaLinkedin />
      </a>
    </div>
  )}
</div>

)}
    </div>
          {isHeartClicked ? (
            <AnimatedHeart filled={true} onClick={handleHeartClick} />

) : (
   <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          onClick={handleHeartClick}
          style={{ cursor: "pointer" }}
        >
          <path
            d="M12 21s-6-4.35-9-8.6C.6 9.3 2.7 4.5 7.5 4.5c2.1 0 4.2 1.5 4.5 3.3C12.3 6 14.4 4.5 16.5 4.5 21.3 4.5 23.4 9.3 21 12.4 18 16.65 12 21 12 21z"
            fill="none"
            stroke="#30747F"
            strokeWidth={2}
          />
        </svg>
 
)}

        </div>
      </div>

           <p className="mt-2 mb-0" style={{
    color: "#FF5722",
    fontWeight: 'bold',
    fontSize: "16px",
paddingLeft:"10px"
  }}>
    <MdOutlineCurrencyRupee size={18} /> {formattedPrice}
    <span style={{ fontSize: '14px', color: "#30747F", marginLeft: "10px" }}>
 {propertyDetails.negotiation?.toLowerCase() === 'yes' 
  ? 'Negotiable' 
  : 'Non-Negotiable'}
    </span>
  </p>
      <p className="mt-1 mb-2" style={{paddingLeft:"10px", paddingRight:"10px", color:"#8B99A9"}}>{priceInWords}</p>

        <h4 className="fw-bold mt-0" style={{fontSize:"15px",paddingLeft:"10px"}}>Makee an offer</h4>
        <form
  onSubmit={(e) => {
    e.preventDefault();
    if (!price || !phoneNumber || !ppcId) {
      setMessage("Price, Phone number, and Property ID are required.");
      return;
    }
    setPendingOfferData({ price, phoneNumber, ppcId });
    setShowConfirmModal(true);
  }}
  className="d-flex mb-0"
>
  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                     <FaRupeeSign style={{ position: 'absolute', left: '10px', color: '#30747F' }} />
                     <input 
                        type="number" 
                        className="w-75 me-2 m-0 ms-2" 
                        placeholder="Make an offer" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        style={{ padding: "8px 12px 8px 30px", borderRadius: "4px", border: "1px solid #30747F", marginRight: "10px", width: "100%" }} 
                    />
                    <button className="m-0"
                        type="submit" 
                        style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #30747F", backgroundColor: "#30747F", color: "#fff" }}
                        onMouseOver={(e) => {
                          e.target.style.background = "#029bb3"; // Brighter neon on hover
                          e.target.style.fontWeight = 600; // Brighter neon on hover
                          e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover
                
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "#2F747F"; // Original orange
                          e.target.style.fontWeight = 400; // Brighter neon on hover
                
                        }}
                    >
                        Submit
                    </button>
                </div>
            </form>
            <div className="container d-flex justify-content-center m-0">

      <div className="row g-3 mt-0 w-100">

{filteredDetailsList.map((detail, index) => {
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
    fontSize: "14px",
    color: "grey",
    fontWeight: "600",
    padding: "10px",
    borderRadius: "5px",
    width: "100%",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
  title={
    detail.value
      ? typeof detail.value === "string"
        ? detail.value
        : JSON.stringify(detail.value)
      : "N/A"
  }
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


       <h5 className="pt-3 fw-bold">Contactt Info</h5>
   

<div 
  className="btn rounded-1 p-2 text-center d-flex align-items-center justify-content-center" 
     style={{
        backgroundColor: Viewed ? '#30747F' : 'transparent',
        border: '1px solid #30747F',
        color: Viewed ? 'white' : '#30747F',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        cursor: 'pointer'
      }}  onClick={handleOwnerContactClick}
>
  <img 
    src={contact} 
    alt="Contact Icon" 
    style={{ width: '20px', height: '20px', marginRight: '8px' }} 
  />
  View owner contact details
</div>
    {showContactDetails && (
        <div ref={contactRef} className="mt-3">
      
   <div className="row g-3">

{/* Name */}
<div className="col-6 d-flex align-items-center">
  <FaUser style={{ fontSize: "16px", color: "#30747F", marginRight: "10px" }} />
  <div>
    <div style={{ fontSize: "13px", color: "grey" }}>Name</div>
    <div style={{ fontSize: "15px", fontWeight: 600, color: "grey" }}>
      {propertyDetails.ownerName || "N/A"}
    </div>
  </div>
</div>

{/* Email */}
<div className="col-12 d-flex align-items-center">
  <FaEnvelope style={{ fontSize: "16px", color: "#30747F", marginRight: "10px" }} />
  <div>
    <div style={{ fontSize: "13px", color: "grey" }}>Email</div>
    <div style={{ fontSize: "15px", fontWeight: 600, color: "grey" }}>
      {propertyDetails.email || "N/A"}
    </div>
  </div>
</div>

{/* Mobile */}
<div className="col-6 d-flex align-items-center">
  <FaPhoneAlt style={{ fontSize: "16px", color: "#30747F", marginRight: "10px" }} />
  <div>
    <div style={{ fontSize: "13px", color: "grey" }}>Mobile</div>
    <div
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#30747F",
        cursor: "pointer",
        textDecoration: "none"
      }}
      onClick={() => window.location.href = `tel:${finalContactNumber}`}
    >
      {finalContactNumber || "N/A"}
    </div>
  </div>
</div>


{/* Alternate Phone */}
<div className="col-6 d-flex align-items-center">
  <FaPhoneAlt style={{ fontSize: "16px", color: "#30747F", marginRight: "10px" }} />
  <div>
    <div style={{ fontSize: "13px", color: "grey" }}>Alternate Phone</div>
    <div style={{ fontSize: "15px", fontWeight: 600, color: "grey" }}>
          <a
                            href={`tel:${propertyDetails.alternatePhone}`}
                            style={{
                              textDecoration: "none",
                              color: "#2E7480",
                            }}
                          >
                            {propertyDetails.alternatePhone || "N/A"}
                            </a>
    </div>
  </div>
</div>

{/* Address */}
<div className="col-12 d-flex align-items-center">
  <FaMapMarkerAlt style={{ fontSize: "16px", color: "#30747F", marginRight: "10px" }} />
  <div>
    <div style={{ fontSize: "13px", color: "grey" }}>Address</div>
    <div style={{ fontSize: "15px", fontWeight: 600, color: "grey" }}>
      {propertyDetails.doorNumber} {propertyDetails.streetName} {propertyDetails.nagar} {propertyDetails.area} {propertyDetails.city} {propertyDetails.district} {propertyDetails.state} {propertyDetails.country} {propertyDetails.pinCode}   </div>
  </div>
</div>



{/* Best Time to Call */}
<div className="col-12 d-flex align-items-center">
  <FaClock style={{ fontSize: "16px", color: "#30747F", marginRight: "10px" }} />
  <div>
    <div style={{ fontSize: "13px", color: "grey" }}>Best Time to Call</div>
    <div style={{ fontSize: "15px", fontWeight: 600, color: "grey" }}>
      {propertyDetails.bestTimeToCall || "N/A"}

    </div>
  </div>
</div>

</div>

          <span className="d-flex justify-content-end align-items-center">



      {!propertyDetails.locationCoordinates && (
  <button
    className="btn btn-primary text-start me-2"
  style={{
     
      transition: "0.3s"
    }}    onClick={handleAddressRequest}
  >
    Request Address
  </button>
)}


 

{finalContactNumber && (
  <button
    className="btn btn-outline-#30747F m-0 d-flex align-items-center gap-2"
    style={{
      color: "white",
      backgroundColor: "#30747F",
      border: "1px solid #30747F"
    }}
    onClick={async (e) => {
      e.stopPropagation();
      
      // Make the call to contact-send-property API
      try {
        const storedPhoneNumber = localStorage.getItem("phoneNumber");
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/contact-send-property`,
          {
            userPhone: storedPhoneNumber,
            postedUserPhone: finalContactNumber,
            ppcId,
            status: "contactSend"
          }
        );
        
        console.log("Contact send response:", response.data);
         window.location.href = `tel:${finalContactNumber}`;
      } catch (error) {
        console.error("Error recording contact:", error);
        // Still initiate the call even if recording fails
        window.location.href = `tel:${finalContactNumber}`;
      }
    }}
    onMouseOver={(e) => {
      e.target.style.background = "#029bb3";
      e.target.style.fontWeight = 600;
      e.target.style.transition = "background 0.3s ease";
    }}
    onMouseOut={(e) => {
      e.target.style.background = "#2F747F";
      e.target.style.fontWeight = 400;
    }}
  >
    <FaPhoneAlt style={{ transition: 'color 0.3s ease-in-out', background: "none" }} /> 
    Call
  </button>
)}

</span>
        </div>
      )}

{propertyDetails?.locationCoordinates && (
  <div className="mt-1">
    

     <div className="position-relative mt-2" ref={shareMenuRef}>
      {/* Share Icon */}
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <h6 style={{ margin: 0 }}>Property Location on Map:</h6>
  <span style={{ color: "#014378" }}>Share Property Location</span>
  <CiShare2
    style={{
      color: "#FF4920",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "1.2rem", // optional: adjust icon size
    }}
    onClick={() => setIsShareMenuVisible((prev) => !prev)}
  />
</div>

   
      {isShareMenuVisible && (
        <div
          className="position-absolute bg-white p-2 mt-2 rounded shadow"
          style={{ zIndex: 999, minWidth: "200px" }}
        >
          <h6 className="mb-2">Share via:</h6>
          <div className="d-flex flex-row gap-2">
            <a
              href={`https://wa.me/?text=Check out this property: ${getGoogleMapsLink()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-success"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getGoogleMapsLink())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary"
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getGoogleMapsLink())}&text=Check out this property location!`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-info"
            >
              Twitter
            </a>
            <a
              href={`mailto:?subject=Property Location&body=Here is the location: ${getGoogleMapsLink()}`}
              className="btn btn-sm btn-dark"
            >
              Email
            </a>
          </div>
        </div>
      )}
    </div>
     <div className="mb-2"
      ref={mapRef}
      style={{ width: "100%", height: "300px", borderRadius: "8px", overflow: "hidden" }}
    ></div>
   
  </div>
)}











 
  
      {/* Image modal */}
      {showModal && (
        <div className="modal show d-block" style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }} onClick={closeModal}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <img src={images[currentImageIndex]} alt={`Large Property Image`} style={{ width: "100%", height: "auto" }} />
              </div>
              <div className="modal-footer">
                <p className="text-muted">Total Images: {images.length}</p>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}



      <div className="container my-3 w-100">
        <div className="row justify-content-center">
     
            {cards.map((card, index) => (
        <div key={index} className="col-3 d-flex justify-content-center">
          <div
            className="card text-center shadow"
            style={{
              width: "100px",
              height: "80px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              border: "none",
              backgroundColor: hoveredIndex === index ? "#F7F2F4" : "#fff",
              transform: hoveredIndex === index ? "scale(1.05)" : "scale(1)",
              transition: "all 0.3s ease-in-out",
              cursor: "pointer"
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={card.onClick}
          >
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "50%", width: "100%" }}
            >
              <img
                src={card.img}
                alt={`Card ${index + 1}`}
                style={{
                  width: "30px",
                  height: "30px",
                  objectFit: "cover",
                  marginTop: "5px"
                }}
              />
            </div>
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                height: "50%",
                width: "100%",
                textAlign: "center"
              }}
            >
              <p
                className="card-text"
                style={{
                  fontSize: "10px",
                  margin: "0",
                  wordWrap: "break-word",
                  overflow: "visible"
                }}
              >
                {card.text}
              </p>
            </div>
          </div>
        </div>
      ))}
        </div>
      </div>
   
{Popup && (
  <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content rounded-5 shadow p-4 border-0">
        <h5 className="text-center mb-4 text-uppercase fw-bold text-secondary">
          {popupTitle}
        </h5>

        {/* Dropdown reasons */}
        <Form.Group className="mb-3 position-relative">
          <BsFilterCircle
            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
            style={{ fontSize: "1.2rem", zIndex: 1 }}
          />
          <Form.Select
            className="form-select ps-5 fw-bold text-center bg-light border-0 rounded popSelect"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select Reason</option>
            {popupType === "report" ? (
              <>
                <option value="Already Sold">Already Sold</option>
                <option value="Wrong Information">Wrong Information</option>
                <option value="Not Responding">Not Responding</option>
                <option value="Fraud">Fraud</option>
                <option value="Duplicate Ads">Duplicate Ads</option>
                <option value="Other">Other</option>
              </>
            ) : (
              <>
                <option value="Help Me to Buy this Property">Help Me to Buy this Property</option>
                <option value="Book for Property Visit">Book for Property Visit</option>
                <option value="Loan Help">Loan Help</option>
                <option value="Property Valuation">Property Valuation</option>
                <option value="Document Verification">Document Verification</option>
                <option value="Property Surveying">Property Surveying</option>
                <option value="EC">EC</option>
                <option value="Patta Name Change">Patta Name Change</option>
                <option value="Registration Help">Registration Help</option>
                <option value="Others">Others</option>
              </>
            )}
          </Form.Select>
        </Form.Group>

        {/* Comment box */}
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Add Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-control rounded p-3 fw-medium text-secondary"
          />
        </Form.Group>

        {/* Buttons */}
        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-light flex-fill me-2 fw-medium rounded"
            onClick={() => setPopup(false)}
          >
            CANCEL
          </button>
          <button
            type="button"
            className="btn flex-fill ms-2 fw-medium rounded"
            style={{ backgroundColor: "#4b3aa8", color: "#fff", border: "none" }}
            onClick={popupType === "report" ? ReporthandleSubmit : () => handleHelpSubmit({ reason, comment })}
          >
            SUBMIT
          </button>
        </div>

        {/* Optional message */}
        {message && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              width: "300px",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
              zIndex: 1000,
            }}
          >
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {showPopup && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.4)", // Dark overlay
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        textAlign: "center",
        width: "300px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <p>{popupMessage}</p>
      <button
              className="btn text-white px-3 py-1 flex-grow-1 mx-1"

        onClick={() => {
          confirmAction();
          setShowPopup(false);
        }}
        style={{ background:  "#2F747F", width: "80px", fontSize: "13px" }}
        onMouseOver={(e) => {
          e.target.style.background = "#029bb3";
          e.target.style.fontWeight = 600;
          e.target.style.transition = "background 0.3s ease";
        }}
        onMouseOut={(e) => {
          e.target.style.background = "#2F747F";
          e.target.style.fontWeight = 400;
        }}

      >
        Yes
      </button>
      <button
              className="btn text-white px-3 py-1 flex-grow-1 mx-1"

        onClick={() => setShowPopup(false)}
        style={{ background:  "#FF0000", width: "80px", fontSize: "13px" }}
        onMouseOver={(e) => {
          e.target.style.background = "#FF6700"; // Brighter neon on hover
          e.target.style.fontWeight = 600; // Brighter neon on hover
          e.target.style.transition = "background 0.3s ease"; // Brighter neon on hover
        }}
        onMouseOut={(e) => {
          e.target.style.background = "#FF0000"; // Original orange
          e.target.style.fontWeight = 400; // Brighter neon on hover

        }}

      >
        No
      </button>
    </div>
  </div>
)}



{message && (
  <div
    style={{
        position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "15px 25px",
      borderRadius: "8px",
      color: "#fff",
      backgroundColor:
        messageType === "success"
          ? "#4CAF50"
          : messageType === "error"
          ? "#f44336"
          : "#2196F3",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      zIndex: 1000,
      cursor: "pointer",
      maxWidth: "300px",
    }}
    onClick={() => setMessage(null)} // Click to close
  >
    {message}
  </div>
)}


<ConfirmationModal
  show={showConfirmModal}
  message="Are you sure you want to submit this offer?"
  onConfirm={() => {
    setShowConfirmModal(false);
    if (pendingOfferData) handleSubmit(pendingOfferData);
  }}
  onCancel={() => {
    setShowConfirmModal(false);
    setPendingOfferData(null);
  }}
/>
    </div>
    </div>


<div className="d-flex align-items-center justify-content-between w-100 m-0 p-3">
        <button onClick={handleGoBack} className="d-flex align-items-center justify-content-around ps-3 border-0 p-2"
        style={{background:"#2ADBA4" , color:"#fff" , borderRadius:"25px" , width:"25%" }}
        ><IoChevronBackSharp size={18}/>
 Back</button>
        <button className="d-flex align-items-center justify-content-around ps-3 border-0 p-2" onClick={() => navigate('/mobileviews')} 
               style={{background:"#2ADBA4" , color:"#fff" , borderRadius:"25px" , width:"25%"}}
        ><TiHome />
Home</button>
        <button className="d-flex align-items-center justify-content-around ps-3 border-0 p-2" onClick={handleIncreasePpcId} 
                style={{background:"#2ADBA4" , color:"#fff", borderRadius:"25px" , width:"25%"}}
        >Next
          <IoIosArrowForward size={18}/>
 </button>
      </div>

      {uploads.length > 0 && (
        <Carousel interval={3000} pause={false}>
          {uploads.flatMap((upload) =>
            upload.images.map((imgPath, idx) => {
              const imageUrl = `https://ppcpondy.com/RENT/${imgPath.replace(/\\/g, '/')}`;
              return (
                <Carousel.Item key={upload._id + idx}>
                  <img
                    className="d-block w-100"
                    src={imageUrl}
                    alt={`Slide ${idx}`}
                     style={{
                      height: '180px',
                      objectFit: 'fill',
                      borderRadius: '15px',
                      boxShadow: 'rgba(0, 0, 0, 0.08) 0px 4px 12px',
                      cursor: 'pointer',
                    }}
                  />
                </Carousel.Item>
              );
            })
          )}
        </Carousel>
      )}
    </div>
    </div>
    </div>

  );
};

export default Details;






























