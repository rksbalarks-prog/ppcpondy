 




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
// import contact from '../Assets/contact.png';
import {  FaBalanceScale, FaFileAlt, FaGlobeAmericas, FaMapMarkerAlt, FaDoorClosed, FaMapSigns } from "react-icons/fa";
import { MdApproval, MdTimer, MdHomeWork, MdHouseSiding, MdOutlineKitchen, MdEmail, MdLocationCity, MdOutlineAccessTime , MdPhone } from "react-icons/md";
import {  BsBarChart } from "react-icons/bs";
import { BiRuler, BiBuilding, BiStreetView } from "react-icons/bi";
import { GiStairs, GiForkKnifeSpoon, GiWindow, GiTwoCoins } from "react-icons/gi";
import { TiContacts, TiHome } from "react-icons/ti";
import contact from '../Assets/contact.png';
// import { ToWords } from 'to-words';
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
import InsufficientPointsModal from "./InsufficientPointsModal";
import { IoChevronBackSharp } from "react-icons/io5";
import { GrFormNext, GrNext } from "react-icons/gr";
import numberToWords from 'number-to-words';
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import moment from "moment";
import { CiShare2 } from "react-icons/ci";
import { FcSearch } from "react-icons/fc";
import PondyIcon from '../Assets/pondyMa.png';
import { PiShareFat } from "react-icons/pi";
import pic from '../Assets/default.png'; // Correct path
import { Carousel } from 'react-bootstrap';
// Per-listing <head>: title, description, canonical, share image and the
// RealEstateListing / BreadcrumbList structured data Google reads.
import Seo from './Seo';
import { buildPropertySeo } from '../utils/propertySeo';

// Points cost per "view owner contact" reveal. Fallback only — admin can
// tune /points-config to change the server-side value.
const POINTS_PER_CONTACT_VIEW = 10;

const AnimatedHeart = ({ filled, onClick }) => {
  const [clicked, setClicked] = useState(false);
  const [startFill, setStartFill] = useState(false);

  // When filled prop changes to true, start animation
  React.useEffect(() => {
    if (filled) {
      setClicked(true);
      setTimeout(() => setStartFill(true), 600);
    } else {
      setClicked(false);
      setStartFill(false);
    }
  }, [filled]);

  // Call onClick passed from parent and also trigger animation reset
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
      {/* Fill layer */}
      <path
        d="M12 21s-6-4.35-9-8.6C.6 9.3 2.7 4.5 7.5 4.5c2.1 0 4.2 1.5 4.5 3.3C12.3 6 14.4 4.5 16.5 4.5 21.3 4.5 23.4 9.3 21 12.4 18 16.65 12 21 12 21z"
        fill={startFill ? "red" : "none"}
        style={{
          transition: "fill 0.4s ease-in",
        }}
      />
      {/* Left stroke */}
      <path
        d="M12 21s-6-4.35-9-8.6C.6 9.3 2.7 4.5 7.5 4.5c2.1 0 4.2 1.5 4.5 3.3"
        style={{
          ...strokeStyle,
          strokeDasharray: 100,
          strokeDashoffset: clicked ? 0 : 100,
        }}
      />
      {/* Right stroke */}
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
  const [popupType, setPopupType] = useState(""); // "report" or "help"

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
  // const [propertyClicked, setPropertyClicked] = useState(false);
  const mapRef = useRef(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
const [allNearbyPlaces, setAllNearbyPlaces] = useState([]);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isShareMenuVisible, setIsShareMenuVisible] = useState(false);
  const shareMenuRef = useRef(null)
  const [clicked, setClicked] = useState(false);

const [limitPerDay, setLimitPerDay] = useState(null); // <-- new state
  const [copied, setCopied] = useState(false);

const [videos, setVideos] = useState([]);


  const [uploads, setUploads] = useState([]);


const [dailyViewsCount, setDailyViewsCount] = useState(0);
const [remainingViews, setRemainingViews] = useState(0);
const [planName, setPlanName] = useState("");
const [expiryDate, setExpiryDate] = useState(null);
const [canViewToday, setCanViewToday] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const [isScrolling, setIsScrolling] = useState(false);

const [addressRequested, setAddressRequested] = useState(false);

// Send address request notification to owner via WhatsApp
const sendOwnerAddressRequestNotification = async (ownerPhone, userPhone, property) => {
  console.log("🔔 sendOwnerAddressRequestNotification called with:", { ownerPhone, userPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(ownerPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for owner:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello Owner 👋

A user has requested your property address on Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👤 User Name: User
📞 User Phone: ${userPhone}
📍 Location: ${property.location || 'N/A'}, ${property.area || 'N/A'}

Greeting: They want to view the complete address of your property.

Best regards,
Pondy Property Team`;

      console.log("💬 Message to send to owner:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ Owner address request notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ Owner address request notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Send address request notification to user via WhatsApp
const sendUserAddressRequestNotification = async (userPhone, ownerPhone, ownerName, property) => {
  console.log("🔔 sendUserAddressRequestNotification called with:", { userPhone, ownerPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(userPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for user:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello User 👋

Your request for property address has been sent to the owner on Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👨‍💼 Owner Name: ${ownerName || 'Owner'}
📞 Owner Phone: ${ownerPhone}
📍 Location: ${property.location || 'N/A'}, ${property.area || 'N/A'}

Greeting: The owner will share the complete address soon.

Best regards,
Pondy Property Team`;

      console.log("💬 Message to send to user:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ User address request notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ User address request notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

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

    console.log("✅ Address request API response:", response.data);
    setMessage(response.data.message);
    
    // Send address request notifications via WhatsApp (non-blocking)
    console.log("📤 Sending address request notifications...");
    
    if (propertyDetails && storedPhoneNumber) {
      try {
        // Send to owner
        if (propertyDetails.phoneNumber) {
          console.log("📧 Sending to owner:", propertyDetails.phoneNumber);
          const ownerResult = await sendOwnerAddressRequestNotification(propertyDetails.phoneNumber, storedPhoneNumber, propertyDetails);
          console.log("📧 Owner notification result:", ownerResult);
        } else {
          console.log("⚠️ Owner phone number not available");
        }
        
        // Send to user
        console.log("📧 Sending to user:", storedPhoneNumber);
        const userResult = await sendUserAddressRequestNotification(storedPhoneNumber, propertyDetails.phoneNumber, propertyDetails.ownerName, propertyDetails);
        console.log("📧 User notification result:", userResult);
      } catch (notifError) {
        console.error("❌ Error sending address request notifications:", notifError);
      }
    } else {
      console.log("⚠️ Property details or stored phone not available", { propertyDetails, storedPhoneNumber });
    }
  } catch (error) {
    console.log("❌ Address request API error:", error.message);
    setMessage(error.response?.data?.message || "Failed to send address request.");
  }
};

// Send call notification to owner via WhatsApp
const sendOwnerCallNotification = async (ownerPhone, userPhone, property) => {
  console.log("🔔 sendOwnerCallNotification called with:", { ownerPhone, userPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(ownerPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for owner:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello Owner 👋

A user is calling you from Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👤 User Name: User
📞 User Phone: ${userPhone}
📍 Location: ${property.location || 'N/A'}, ${property.area || 'N/A'}

Greeting: Be ready to answer the call and discuss the property details.

Best regards,
Rent Pondy Property Team`;

      console.log("💬 Message to send to owner:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ Owner call notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ Owner call notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Send call notification to user via WhatsApp
const sendUserCallNotification = async (userPhone, ownerPhone, ownerName, property) => {
  console.log("🔔 sendUserCallNotification called with:", { userPhone, ownerPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(userPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for user:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello User 👋

You are calling the owner from Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👨‍💼 Owner Name: ${ownerName || 'Owner'}
📞 Owner Phone: ${ownerPhone}
📍 Location: ${property.location || 'N/A'}, ${property.area || 'N/A'}

Greeting: Have a great conversation about the property.

Best regards,
Pondy Property Team`;

      console.log("💬 Message to send to user:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ User call notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ User call notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Send interest notification to owner via WhatsApp
const sendOwnerInterestNotification = async (ownerPhone, userPhone, property) => {
  console.log("🔔 sendOwnerInterestNotification called with:", { ownerPhone, userPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(ownerPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for owner:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello Owner 👋

A user has shown interest in your property on Pondy Property Team!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👤 User Name: User
📞 User Phone: ${userPhone}
📍 Location: ${property.location || 'N/A'}, ${property.area || 'N/A'}

Greeting: They are very interested in your property and want to connect.

Best regards,
Pondy Property Team`;

      console.log("💬 Message to send to owner:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ Owner interest notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ Owner interest notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Send interest notification to user via WhatsApp
const sendUserInterestNotification = async (userPhone, ownerPhone, ownerName, property) => {
  console.log("🔔 sendUserInterestNotification called with:", { userPhone, ownerPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(userPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for user:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello User 👋

Your interest has been sent to the owner on Pondy Property Team!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👨‍💼 Owner Name: ${ownerName || 'Owner'}
📞 Owner Phone: ${ownerPhone}
📍 Location: ${property.location || 'N/A'}, ${property.area || 'N/A'}

Greeting: The owner will be notified about your interest soon.

Best regards,
Pondy Property Team`;

      console.log("💬 Message to send to user:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ User interest notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ User interest notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

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
          phoneNumber: userPhoneNumber, // get this from logged-in user state
          ppcId: ppcId, // this should come from the selected property
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
  const [showPopup, setShowPopup] = useState(false);  // State for controlling the popup/modal
  const [Popup, setPopup] = useState(false);  // State for controlling the popup/modal
const [ownerDetails, setOwnerDetails] = useState(null);

// toggle based on UI logic (e.g., checkbox or logic on page load)
const [finalContactNumber, setFinalContactNumber] = useState("");

  const [showModal, setShowModal] = useState(false);
  // Start coords for swipe-to-navigate inside the image modal. Using a ref
  // instead of state so a swipe doesn't trigger a re-render mid-gesture.
  const modalSwipeStartRef = useRef(null);
  const [showOwnerContact, setShowOwnerContact] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [message, setMessage] = React.useState(null);
const [messageType, setMessageType] = React.useState("info"); // can be "error", "success", "info"
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  // Points module state (gates the owner-contact reveal)
  const [pointsBalance, setPointsBalance] = useState(0);
  const [showInsufficientPoints, setShowInsufficientPoints] = useState(false);
  // Re-view confirmation: shown when the user clicks the owner-contact button
  // for a property they've already viewed in this browser. They confirm before
  // we deduct another POINTS_PER_CONTACT_VIEW points.
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [favoritedUserPhoneNumbers, setFavoritedUserPhoneNumbers] = useState([]);
  const [property, setProperty] = useState(null);
  const [viewedProperties, setViewedProperties] = useState([]);

  const [popupMessage, setPopupMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [imageCount, setImageCount] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  // const [isHeartClicked, setIsHeartClicked] = useState(false);
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
  // const [offerPrice, setofferPrice] = useState("");
  const [viewCount, setViewCount] = useState(0);

  const [isHeartClicked, setIsHeartClicked] = useState(() => {
    // Check if there's a saved state in localStorage for this ppcId
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
        setShowPopup(false); // Close the modal
      } else if (response.data.status === 'alreadyCalled') {
        setError('You have already shared your call experience for this property.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    }
    setShow(false);

  };


  // Send property share notification to user via WhatsApp
  const sendUserShareNotification = async (userPhone, property) => {
    try {
      const mobileNumber = String(userPhone).replace(/\D/g, "");
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `🔗 PROPERTY SHARED
👋 Hi There!

✅ You've shared this property with your network
🏠 Property: ${property.propertyName || 'Property Owner\'s Home'}
📍 Location: ${property.location || 'N/A'}
🆔 Rent ID: ${property.ppcId}

💡 Share this link with friends and family who might be interested!

Thank you for using Pondy property ! 🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ User share notification sent");
        return true;
      }
    } catch (error) {
      console.log("⚠️ User share notification failed (non-blocking):", error.message);
      return false;
    }
  };

  // Send property share notification to owner via WhatsApp
  const sendOwnerShareNotification = async (ownerPhone, userPhone, property) => {
    try {
      const mobileNumber = String(ownerPhone).replace(/\D/g, "");
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `🔗 PROPERTY SHARED
👋 Hi Property Owner!

✅ Your property has been shared by a user
🏠 Property: ${property.propertyName || 'Your Home'}
📍 Location: ${property.location || 'N/A'}
👤 Shared by: ${userPhone}
🆔 Rent ID: ${property.ppcId}

💡 More visibility = More interested buyers/renters!

Thank you for using Pondy property ! 🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ Owner share notification sent");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Owner share notification failed (non-blocking):", error.message);
      return false;
    }
  };

  // Send favorite notification to user via WhatsApp
  const sendUserFavoriteNotification = async (userPhone, property) => {
    try {
      const mobileNumber = String(userPhone).replace(/\D/g, "");
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi There 👋

✅ Your favorite the property has been submitted successfully!

🆔 Rent ID: ${property.ppcId}
📍 Property: ${property.location || 'N/A'}, ${property.area || 'N/A'}
👨‍💼 Owner: ${property.ownerName || 'Owner'}

❤️ We'll notify the owner about your favorite.

Thank you for using Pondy property 🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ User favorite notification sent");
        return true;
      }
    } catch (error) {
      console.log("⚠️ User favorite notification failed (non-blocking):", error.message);
      return false;
    }
  };

  // Send favorite notification to owner via WhatsApp
  const sendOwnerFavoriteNotification = async (ownerPhone, userPhone, property) => {
    try {
      const mobileNumber = String(ownerPhone).replace(/\D/g, "");
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi Owner 👋

❤️ A user has favorited your property on Rent Pondy.

Kindly contact to the user in the Pondy property app at your convenience.

👤 Requested by: User
📞 Contact Number: ${userPhone}

Our team may also contact the user if required.

Thank you for choosing Pondy property🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ Owner favorite notification sent");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Owner favorite notification failed (non-blocking):", error.message);
      return false;
    }
  };

  const handleHeartAnimationClick = () => {
    setIsHeartClicked(true); // Only enable like once (you can toggle if you prefer)
    setTimeout(() => setStartFill(true), 600); // Wait for stroke animation to finish
  };
  const popupRef = useRef(null);

  const toggleShareOptions = async () => {
    setShowShareOptions((prev) => !prev);
    
    // Send share notifications when share options are toggled (non-blocking)
    if (!showShareOptions && propertyDetails && localStorage.getItem('phoneNumber')) {
      const userPhone = localStorage.getItem('phoneNumber');
      
      // Send to user
      await sendUserShareNotification(userPhone, propertyDetails);
      
      // Send to owner
      if (propertyDetails.phoneNumber) {
        await sendOwnerShareNotification(propertyDetails.phoneNumber, userPhone, propertyDetails);
      }
    }
  };
 const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
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
  "restaurant",   // Restaurants and cafes
  "school",       // Schools
  "bakery",       // Shopping (alternatively: "store")
  "park",         // Parks
  "gym",          // Gyms
  "atm",          // ATMs
  "bank",         // Banks
  "hospital",     // Hospitals
  "pharmacy"      // Pharmacies
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

  // Load interest state from localStorage when the component mounts
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
    const timer = setTimeout(() => setMessage(""), 5000); // Auto-close after 3 seconds
    return () => clearTimeout(timer); // Cleanup timer
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


// Fetch image count for the property based on ppcId
const fetchImageCount = async () => {
  if (!ppcId) {
    return;
  }

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/uploads-count`, 
      { params: { ppcId } } // Pass only ppcId as the query parameter
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

 // Fetch property details
 useEffect(() => {
  if (ppcId) {
    fetchPropertyDetails(ppcId);
  }
}, [ppcId]);

// Set contact number from property details when they load
useEffect(() => {
  if (propertyDetails) {
    // When admin has assigned a PPC-ID phone number to this property
    // (Set PPCID Assign), show that masked number to the buyer instead of
    // the owner's original phone. Falls back to the original when no
    // assignment exists. Note: owner-facing notifications still use
    // propertyDetails.phoneNumber so the real owner is reached.
    const contactNumber =
      propertyDetails.setPpcId && propertyDetails.assignedPhoneNumber
        ? propertyDetails.assignedPhoneNumber
        : propertyDetails.phoneNumber;
    if (contactNumber) {
      setFinalContactNumber(contactNumber);
    }
  }
}, [propertyDetails]);



// ─────────────────────────────────────────────────────────────────────────
// LEGACY DAILY-VIEW LIMIT — DISABLED.
// Replaced by the Points system. The owner-contact reveal is now gated by
// the points balance in handleOwnerContactClick (see /points-deduct).
// Kept commented for reference / easy rollback.
// ─────────────────────────────────────────────────────────────────────────
/*
const storeUserViewedProperty = async (phoneNumber, ppcId) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/user-view-property`,
      { phoneNumber, ppcId }
    );

    console.log("API Response:", response.data); // Debugging response

    const { data } = response.data;

    setMessageType("success");
    // setMessage(response.data.message);

    // ✅ Extract and apply view limit data from API response
    setLimitPerDay(data.viewLimitPerDay);
    setDailyViewsCount(data.dailyViewsCount);
    setRemainingViews(data.remainingViews);
    setPlanName(data.planName);
    setExpiryDate(data.expiryDate);
    setViewedProperties(data.viewedProperties);
    setCanViewToday(data.canViewToday);

  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.data);

      if (error.response.status === 409) {
        setMessageType("info");
        setMessage("You already viewed this property today.");
      } else if (error.response.status === 429) {
        setMessageType("error");
        setMessage(error.response.data.message);

        // Extract limit number from message
        const match = error.response.data.message.match(/\((\d+)\)/);
        if (match) {
          setLimitPerDay(parseInt(match[1], 10));
        }
      } else {
        setMessageType("error");
        setMessage(`Error storing view: ${error.response.data.message}`);
      }
    } else {
      setMessageType("error");
      setMessage(`Network/server error: ${error.message}`);
    }
  }
};
*/



  const fetchUserViewedProperties = async (userPhoneNumber) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user-viewed-properties?phoneNumber=${userPhoneNumber}`
      );
      setViewedProperties(response.data.viewedProperties || []);
    } catch (error) {
      // Optional: handle fetch error (e.g. show message)
    }
  };

  // Load phone number from localStorage on mount
  useEffect(() => {
    const storedPhoneNumber = localStorage.getItem("phoneNumber");
    if (storedPhoneNumber) {
      setUserPhoneNumber(storedPhoneNumber);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // LEGACY DAILY-VIEW LIMIT — DISABLED.
  // The points system replaces this. We no longer call /user-view-property
  // on every property visit; the deduction happens only on the actual
  // "View owner contact" tap in handleOwnerContactClick.
  // ─────────────────────────────────────────────────────────────────────
  /*
  useEffect(() => {
    if (userPhoneNumber && ppcId) {
      storeUserViewedProperty(userPhoneNumber, ppcId);
    }
  }, [userPhoneNumber, ppcId]);
  */

  // Fetch viewed properties whenever userPhoneNumber changes
  useEffect(() => {
    if (userPhoneNumber) {
      fetchUserViewedProperties(userPhoneNumber);
    }
  }, [userPhoneNumber]);




// Send offer notification to owner via WhatsApp
const sendOwnerOfferNotification = async (ownerPhone, userPhone, offeredRent, property) => {
  console.log("🔔 sendOwnerOfferNotification called with:", { ownerPhone, userPhone, offeredRent, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(ownerPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for owner:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hi Owner 👋

💰 A user has made an offer on your property on Rent Pondy!

Offer Details:
💵 Offered Rent: ₹${offeredRent}/month
🆔 Rent ID: ${property.ppcId}
📍 Property: ${property.location || 'N/A'}, ${property.area || 'N/A'}
👤 User: User
📞 Contact: ${userPhone}

Please review the offer and respond at your earliest convenience.

Thank you for using  Pondy property🙏`;

      console.log("💬 Message to send to owner:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ Owner WhatsApp response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ Owner offer notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Send offer notification to user via WhatsApp
const sendUserOfferNotification = async (userPhone, offeredRent, property) => {
  console.log("🔔 sendUserOfferNotification called with:", { userPhone, offeredRent, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(userPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for user:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hi User 👋

✅ Your offer has been submitted successfully!

Offer Details:
💵 Offered Rent: ₹${offeredRent}/month
🆔 Rent ID: ${property.ppcId}
📍 Property: ${property.location || 'N/A'}, ${property.area || 'N/A'}
👨‍💼 Owner: ${property.ownerName || 'Owner'}
📞 Owner Contact: ${property.phoneNumber || 'N/A'}

⏳ The owner will review your offer shortly.

Thank you for using  Pondy property🙏`;

      console.log("💬 Message to send to user:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ User WhatsApp response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ User offer notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

const handleSubmit = async ({ price, ppcId }) => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber");

  if (!storedPhoneNumber || !ppcId || !price) {
    setMessage("Price, Phone Number, and Property ID are required.");
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/offer`, {
      price,
      phoneNumber: storedPhoneNumber, // ✅ use the stored phone number
      ppcId,
    });

    console.log("✅ Full Offer Response:", response.data);
    const { message, status, offer } = response.data;
    console.log("Status:", status, "Message:", message);

    // Check for success conditions (multiple status possibilities)
    const isSuccess = status === "offerSaved" || status === "offerUpdated" || message?.includes("successfully") || offer;

    if (isSuccess) {
      setMessage("Offer saved successfully.");
      setPrice('');
      
      // Send offer notifications via WhatsApp (non-blocking)
      console.log("📤 Sending offer notifications...");
      console.log("Property Details:", propertyDetails);
      console.log("Stored Phone:", storedPhoneNumber);
      console.log("Price:", price);
      
      if (propertyDetails && storedPhoneNumber) {
        try {
          // Send to owner
          if (propertyDetails.phoneNumber) {
            console.log("📧 Sending to owner:", propertyDetails.phoneNumber);
            const ownerResult = await sendOwnerOfferNotification(propertyDetails.phoneNumber, storedPhoneNumber, price, propertyDetails);
            console.log("📧 Owner notification result:", ownerResult);
          } else {
            console.log("⚠️ Owner phone number not available");
          }
          
          // Send to user
          console.log("📧 Sending to user:", storedPhoneNumber);
          const userResult = await sendUserOfferNotification(storedPhoneNumber, price, propertyDetails);
          console.log("📧 User notification result:", userResult);
        } catch (notifError) {
          console.error("❌ Error sending notifications:", notifError);
        }
      } else {
        console.log("⚠️ Property details or stored phone not available", { propertyDetails, storedPhoneNumber });
      }
    } else if (status === "offerExists") {
      setMessage("An offer has already been made for this property.");
    } else {
      setMessage(message || "Offer submitted.");
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || "Error saving offer.";
    setMessage(errMsg);
    console.error("❌ Offer submission error:", error);
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
        // setError("Failed to fetch property details.");
      } finally {
        setLoading(false);
      }
    };

    if (ppcId) fetchPropertyData();
  }, [ppcId]);



  const handleIncreasePpcId = () => {
    const { properties } = location.state || {};
    
    if (properties && properties.length > 0) {
      // Find current property index
      const currentIndex = properties.findIndex(p => p.ppcId === Number(ppcId));
      
      if (currentIndex !== -1 && currentIndex < properties.length - 1) {
        // Get next property
        const nextProperty = properties[currentIndex + 1];
        navigate(`/detail/${nextProperty.ppcId}`, { state: { phoneNumber: localStorage.getItem('phoneNumber'), properties } });
      }
    }
    window.scrollTo(0, 0); // Scroll to top
  };

  
  const handleGoBack = () => {
    navigate(-1);
    window.scrollTo(0, 0); // Scroll to top
  };

    const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  // Only treat a gesture as a horizontal swipe (back / next) when the
  // horizontal movement clearly dominates the vertical movement —
  // otherwise a normal page scroll with slight horizontal drift was
  // triggering handleGoBack() and bouncing the user off the detail page.
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const swipeThreshold = 50;

    if (touchStartX !== null && touchStartY !== null) {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const isHorizontalSwipe =
        Math.abs(deltaX) > swipeThreshold &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      if (isHorizontalSwipe) {
        if (deltaX > 0) {
          handleGoBack(); // Swipe Right → Back
        } else {
          handleIncreasePpcId(); // Swipe Left → Next
        }
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };



useEffect(() => {
  const fetchVideos = async () => {
    try {
      // 1. Use video from propertyDetails if available
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

      // 2. Fallback: Fetch from API using ppcId
      if (propertyDetails?.ppcId) {
       const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-property-video/${propertyDetails.ppcId}`);


        if (data?.video?.video) {
          const cleanUrl = `https://ppcpondy.com/PPC/${data.video.video.replace(/\\/g, "/").replace(/^\/+/, "").trim()}`;
          setVideos([cleanUrl]);
        }
      }
    } catch (err) {
      console.error("Failed to load video:", err);
      setVideos([]); // fallback to empty array on error
    }
  };

  fetchVideos();
}, [propertyDetails?.video, propertyDetails?.ppcId]);



  useEffect(() => {
  console.log("Videos loaded:", videos); // Log the full list of URLs
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


  // Runs when `propertyDetails.video` changes
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
        { heading: true, label: "Basic Property Info" }, // Heading 1
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

        { heading: true, label: "Property Features" }, // Heading 1
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
        { heading: true, label: "Other details" }, // Heading 2
    
        { icon: <MdOutlineChair />, label: "Furnished", value: propertyDetails.furnished },
        { icon: <TbArrowLeftRight />, label: "Facing", value: propertyDetails.facing },

        { icon: <BsGraphUp />, label: "Sale Mode", value: propertyDetails.salesMode },
        { icon: <BsBarChart />, label: "Sales Type", value: propertyDetails.salesType },
        { icon: <BiUser />, label: "Posted By", value: propertyDetails.postedBy },
     { icon: <BiCalendar />, label: "Posted On", value:formattedCreatedAt },
        { heading: true, label: "Description"  }, // Heading 3
        { icon: <FaFileAlt />, label: "Description" ,value: propertyDetails.description },
      
        { heading: true, label: "Property Location " }, // Heading 4
      
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

  // If propertyType matches any excluded type, skip these items
  if (excludedPropertyTypes.includes(propertyDetails.propertyType)) {
    return !isPropertyFeatureSection;
  }

  return true; // otherwise include all
});

// The Property Location section is revealed only after the user views the
// owner contact details — split it out of the always-visible details list.
const locationStartIndex = filteredDetailsList.findIndex(
  (item) => item.heading && (item.label || "").trim() === "Property Location"
);
const mainDetailsList =
  locationStartIndex === -1
    ? filteredDetailsList
    : filteredDetailsList.slice(0, locationStartIndex);
const locationDetailsList =
  locationStartIndex === -1
    ? []
    : filteredDetailsList.slice(locationStartIndex);

// Renders a single property-detail row (or a section heading). Shared by the
// main details grid and the location grid inside the owner-contact panel.
const renderDetailItem = (detail, index) => {
  if (detail.heading) {
    return (
      <div key={index} className="col-12" style={{ marginTop: 10, marginBottom: 2 }}>
        <h4
          className="m-0 fw-bold d-flex align-items-center"
          style={{
            color: "#1F3A3F",
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            letterSpacing: 0.2,
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 4,
              height: 16,
              borderRadius: 3,
              background: "linear-gradient(180deg,#30747F 0%,#6EB7B2 100%)",
              marginRight: 8,
            }}
          />
          {detail.label}
        </h4>
      </div>
    );
  }

  const isDescription = detail.label === "Description";
  const columnClass = isDescription ? "col-12" : "col-6";

  const value = detail.value
    ? typeof detail.value === "string"
      ? detail.value
      : JSON.stringify(detail.value)
    : "N/A";
  const isEmpty = value === "N/A";

  return (
    <div key={index} className={columnClass} style={{ marginBottom: 8 }}>
      <div
        className="d-flex align-items-center"
        style={{
          width: "100%",
          minHeight: isDescription ? "auto" : "58px",
          wordBreak: "break-word",
          background: "#F6FAFB",
          border: "1px solid #E3EEF0",
          borderRadius: 10,
          padding: "8px 10px",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#EEF6F7";
          e.currentTarget.style.borderColor = "#C6DFE3";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#F6FAFB";
          e.currentTarget.style.borderColor = "#E3EEF0";
        }}
      >
        <span
          className="d-inline-flex align-items-center justify-content-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#E3F1F2",
            color: "#2F747F",
            fontSize: 16,
            marginRight: 10,
            flexShrink: 0,
          }}
        >
          {detail.icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          {!isDescription && (
            <span
              style={{
                display: "block",
                fontSize: "10.5px",
                color: "#7A8A91",
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {detail.label || "N/A"}
            </span>
          )}
          <p
            className="mb-0 p-0"
            style={{
              fontSize: "13.5px",
              color: isEmpty ? "#A6B0B5" : "#1F3A3F",
              fontWeight: 600,
              borderRadius: "5px",
              width: "100%",
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "unset",
              wordBreak: "break-word",
              fontStyle: isEmpty ? "italic" : "normal",
              lineHeight: 1.35,
            }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

const scrollToContact = () => {
  if (contactRef.current) {
    const elementTop = contactRef.current.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: elementTop - 100, // 100px above the element
      behavior: 'smooth'
    });

    // Or, to center the element:
   }
};


// Send contact view notification to owner via WhatsApp
const sendOwnerContactViewNotification = async (ownerPhone, userPhone, userPhoneName, property) => {
  console.log("🔔 sendOwnerContactViewNotification called with:", { ownerPhone, userPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(ownerPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for owner:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello Owner 👋

Someone has viewed your contact details on Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👤 User Name: User
📞 User Phone: ${userPhone}

Greeting: They are interested in connecting with you about your property.

Best regards,
Pondy property Team`;

      console.log("💬 Message to send to owner:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ Owner contact view notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ Owner contact view notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Send contact view notification to user via WhatsApp
const sendUserContactViewNotification = async (userPhone, ownerPhone, ownerName, property) => {
  console.log("🔔 sendUserContactViewNotification called with:", { userPhone, ownerPhone, ppcId: property?.ppcId });
  try {
    const mobileNumber = String(userPhone).replace(/\D/g, "");
    const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;
    console.log("📱 WhatsApp number for user:", whatsappNumber);

    if (whatsappNumber.length >= 12) {
      const messageContent = `Hello User 👋

You have successfully viewed the owner's contact details on Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${property.ppcId}
👨‍💼 Owner Name: ${ownerName || 'Owner'}
📞 Owner Phone: ${ownerPhone}

Greeting: You can now reach out directly to the owner to discuss the property.

Best regards,
Rent Pondy Team`;

      console.log("💬 Message to send to user:", messageContent);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
        to: whatsappNumber,
        message: messageContent
      });
      console.log("✅ User contact view notification response:", response.data);
      return true;
    }
  } catch (error) {
    console.log("⚠️ User contact view notification failed (non-blocking):", error.message);
    console.error("Full error:", error);
    return false;
  }
};

// Run the points balance check + deduct + side-effects (notifications etc.)
// Returns true on success, false if user should be blocked from revealing.
const performPointsReveal = async () => {
  const storedPhone = localStorage.getItem("phoneNumber");
  if (!storedPhone) return true; // no phone → skip the gate (legacy fallback)
  try {
    const balRes = await axios.get(`${process.env.REACT_APP_API_URL}/points-balance/${storedPhone}`);
    const bal = Number(balRes.data?.balance || 0);
    setPointsBalance(bal);
    if (bal < POINTS_PER_CONTACT_VIEW) {
      setShowInsufficientPoints(true);
      return false;
    }
    const dRes = await axios.post(`${process.env.REACT_APP_API_URL}/points-deduct`, {
      phoneNumber: storedPhone,
      points: POINTS_PER_CONTACT_VIEW,
      rentId: ppcId,
      reason: 'view-owner-contact',
    });
    if (!dRes.data?.success) {
      setPointsBalance(Number(dRes.data?.balance || 0));
      setShowInsufficientPoints(true);
      return false;
    }
    setPointsBalance(Number(dRes.data.balance));
    if (ppcId) localStorage.setItem(`points-revealed-${ppcId}`, '1');
    // Tell the navbar (and any other listeners) to refresh their balance display.
    window.dispatchEvent(new Event('points:updated'));
    return true;
  } catch (pointsErr) {
    console.error('Points deduction failed:', pointsErr);
    setMessage('Could not verify your points balance. Please try again.');
    return false;
  }
};

// Reveals the contact AND fires the WhatsApp notifications. Used from both the
// first-view path and from the "Yes, deduct" button on the re-view confirm modal.
const revealAndNotify = async () => {
  setShowContactDetails(true);
  setTimeout(scrollToContact, 100);

  console.log("📤 Sending contact view notifications...");
  const storedPhoneNumber = localStorage.getItem("phoneNumber");
  if (propertyDetails && storedPhoneNumber) {
    try {
      if (propertyDetails.phoneNumber) {
        const ownerResult = await sendOwnerContactViewNotification(propertyDetails.phoneNumber, storedPhoneNumber, storedPhoneNumber, propertyDetails);
        console.log("📧 Owner notification result:", ownerResult);
      }
      const userResult = await sendUserContactViewNotification(storedPhoneNumber, propertyDetails.phoneNumber, propertyDetails.ownerName, propertyDetails);
      console.log("📧 User notification result:", userResult);
    } catch (notifError) {
      console.error("❌ Error sending contact view notifications:", notifError);
    }
  }
};

// Confirm modal "Yes, deduct" handler.
const confirmRevealDeduct = async () => {
  setShowRevealConfirm(false);
  const ok = await performPointsReveal();
  if (ok) await revealAndNotify();
};

const handleOwnerContactClick = async () => {
  setViewed(true);
  setTimeout(() => setViewed(false), 300);

  // If contact is already showing, clicking again just hides it (no charge).
  if (showContactDetails) {
    setShowContactDetails(false);
    return;
  }

  const storedPhone = localStorage.getItem("phoneNumber");
  const alreadyPaidKey = ppcId ? `points-revealed-${ppcId}` : null;
  const alreadyPaid = alreadyPaidKey ? localStorage.getItem(alreadyPaidKey) === '1' : false;

  // Re-view: ask before deducting again.
  if (storedPhone && alreadyPaid) {
    setShowRevealConfirm(true);
    return;
  }

  // First view: deduct + reveal in one shot.
  if (storedPhone) {
    const ok = await performPointsReveal();
    if (!ok) return;
  }

  await revealAndNotify();
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
      
      // Send interest notifications via WhatsApp (non-blocking)
      console.log("📤 Sending interest notifications...");
      
      if (propertyDetails && storedPhoneNumber) {
        try {
          // Send to owner
          if (propertyDetails.phoneNumber) {
            console.log("📧 Sending interest notification to owner:", propertyDetails.phoneNumber);
            const ownerResult = await sendOwnerInterestNotification(propertyDetails.phoneNumber, storedPhoneNumber, propertyDetails);
            console.log("📧 Owner interest notification result:", ownerResult);
          } else {
            console.log("⚠️ Owner phone number not available");
          }
          
          // Send to user
          console.log("📧 Sending interest notification to user:", storedPhoneNumber);
          const userResult = await sendUserInterestNotification(storedPhoneNumber, propertyDetails.phoneNumber, propertyDetails.ownerName, propertyDetails);
          console.log("📧 User interest notification result:", userResult);
        } catch (notifError) {
          console.error("❌ Error sending interest notifications:", notifError);
        }
      }
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



// Function to handle confirmation
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
      phoneNumber: storedPhoneNumber, // ✅ use storedPhoneNumber
      ppcId,
    });

    const { status, message, postedUserPhoneNumber } = response.data;

    if (status === "favorite") {
      setIsHeartClicked(true);
      setMessage("Favorite request sent.");
      setPostedUserPhoneNumber(postedUserPhoneNumber);
      localStorage.setItem(`isHeartClicked-${ppcId}`, "true");
      
      // Send favorite notifications via WhatsApp (non-blocking)
      if (propertyDetails) {
        // Send to user
        await sendUserFavoriteNotification(storedPhoneNumber, propertyDetails);
        
        // Send to owner
        if (propertyDetails.phoneNumber) {
          await sendOwnerFavoriteNotification(propertyDetails.phoneNumber, storedPhoneNumber, propertyDetails);
        }
      }
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

    setIsHeartClicked(isHeartClicked); // Maintain previous state
  }
};



  // const handleShareClick = () => {
  //   setShowShareOptions(!showShareOptions);
  // };


  const toWords = new ToWords({
    localeCode: 'en-IN', // Indian numbering system
    converterOptions: {
      currency: false,
      ignoreDecimal: true,
    }
  });
 

   // Format price with commas (e.g., 14,00,000 or "On Demand")
  const formattedPrice =
    propertyDetails?.price && typeof propertyDetails.price === 'number'
      ? new Intl.NumberFormat('en-IN').format(propertyDetails.price)
      : propertyDetails?.price || 'N/A';

  // Convert price to words (e.g., "14 Lakhs")
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
    setConfirmAction(() => confirmPhotoRequest); // Store function reference
    setShowPopup(true);
  };

  // Send photo request notification to owner via WhatsApp
  const sendOwnerPhotoRequestNotification = async (ownerPhone, userPhone, property) => {
    try {
      const mobileNumber = String(ownerPhone).replace(/\D/g, "");
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi Owner 👋

📸 A user has requested photos for your property on Rent Pondy.

Kindly upload updated property photos in the Rent Pondy app at your convenience.

👤 Requested by: User
📞 Contact Number: ${userPhone}

Our team may also contact you for photo verification, if required.

Thank you for choosing Pondy Property 🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ Owner photo request notification sent");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Photo request notification failed (non-blocking):", error.message);
      return false;
    }
  };

  // Send photo request notification to user via WhatsApp
  const sendUserPhotoRequestNotification = async (userPhone, property) => {
    try {
      const mobileNumber = String(userPhone).replace(/\D/g, "");
      const whatsappNumber = mobileNumber.length === 10 ? `91${mobileNumber}` : mobileNumber;

      if (whatsappNumber.length >= 12) {
        const messageContent = `Hi There 👋

✅ Your photo request has been submitted successfully!

🆔 Rent ID: ${property.ppcId}
📍 Property: ${property.location || 'N/A'}, ${property.area || 'N/A'}
👨‍💼 Owner: ${property.ownerName || 'Owner'}

📸 We'll notify the owner about your request.

Thank you for using Pondy property 🙏`;

        await axios.post(`${process.env.REACT_APP_API_URL}/send-message`, {
          to: whatsappNumber,
          message: messageContent
        });
        console.log("✅ User photo request notification sent");
        return true;
      }
    } catch (error) {
      console.log("⚠️ User photo request notification failed (non-blocking):", error.message);
      return false;
    }
  };

  const confirmPhotoRequest = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/photo-request`, {
        ppcId: property.ppcId,
        requesterPhoneNumber: userPhoneNumber,
      });
  
      setMessage("Photo request submitted successfully!");
      setPhotoRequested(true); // Update state
      localStorage.setItem(`photoRequested-${property.ppcId}`, JSON.stringify(true)); // Save to local storage
      
      // Send photo request notifications to both user and owner (non-blocking)
      if (propertyDetails && userPhoneNumber) {
        // Send to user
        await sendUserPhotoRequestNotification(userPhoneNumber, propertyDetails);
        
        // Send to owner
        if (propertyDetails.phoneNumber) {
          await sendOwnerPhotoRequestNotification(propertyDetails.phoneNumber, userPhoneNumber, propertyDetails);
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit photo request.");
    } finally {
      setShowPopup(false); // Close popup
      setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds
    }
  };
  

const currentUrl = `${window.location.origin}${location.pathname}`; // <- Works for localhost or live

// Search/social metadata for this listing, derived from the fetched record.
const seo = buildPropertySeo(propertyDetails, `/detail/${ppcId}`);

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
<div
    className="position-absolute start-50 translate-middle-x"
    style={{
      bottom: 14,
      zIndex: 1050,
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "5px 12px 5px 10px",
      borderRadius: 999,
      background: "rgba(15, 23, 28, 0.55)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.28)",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.4,
      fontFamily: "Inter, sans-serif",
      lineHeight: 1,
      pointerEvents: "none",
    }}
  >
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, opacity: 0.95 }}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      <span style={{ color: "#ffffff" }}>{currentIndex}</span>
      <span style={{ opacity: 0.55, margin: "0 3px" }}>/</span>
      <span style={{ opacity: 0.85 }}>{images.length + videos.length}</span>
    </span>
  </div>
</div>
       <span
        className="mt-3 d-inline-flex align-items-center"
        style={{
          background: "linear-gradient(135deg,#2F747F 0%,#3E8E96 100%)",
          color: "white",
          borderRadius: 999,
          padding: "5px 12px",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.5,
          marginLeft: 10,
          boxShadow: "0 2px 6px rgba(47,116,127,0.25)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <span style={{ opacity: 0.75, marginRight: 4, fontWeight: 500 }}>PPC_ID</span>
        <span style={{ opacity: 0.6, marginRight: 4 }}>:</span>
        <span style={{ fontWeight: 700 }}>{propertyDetails.ppcId}</span>
      </span>



  
      <div className="d-flex justify-content-between align-items-center mt-2" style={{paddingLeft:"10px",
    paddingRight:"10px"}}>

 <p className="text-start m-0"style={{
    color: "#1F3A3F",
    fontWeight: 700,
    fontSize: "17px",
    letterSpacing: 0.2,
    fontFamily: "Inter, sans-serif",
  }}>
       <strong>{propertyDetails.propertyMode} |  {propertyDetails.propertyType}</strong>
        </p>
  {/* ({priceInWords})  */}

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
  {/* Share Button (only if supported) */}
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
    // Ensures full text display
    whiteSpace: 'normal',      // Allow text wrapping
    overflow: 'visible',       // Don't hide overflow
    wordBreak: 'break-word',   // Break long words if needed
  }}
    >
      <PiShareFat /> Share via...
    </button>
  )}
    <div className="d-flex justify-content-between align-items-center gap-3">

  {/* Copy Link Button */}
      <MdContentCopy onClick={handleCopy} style={{ border: 'none', background: 'none', cursor: 'pointer', color:"grey" }}/>
    {copied && (
      <span style={{ color: 'green', fontSize: '14px' }}>Copied!</span>
    )}
</div>
  {/* Social Media Links (only on larger screens or no native share) */}
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

           <p className="mt-2 mb-0 d-flex align-items-center flex-wrap" style={{
    color: "#FF5722",
    fontWeight: 800,
    fontSize: "20px",
    paddingLeft:"10px",
    letterSpacing: 0.3,
    fontFamily: "Inter, sans-serif",
    gap: 8,
  }}>
    <span className="d-inline-flex align-items-center">
      <MdOutlineCurrencyRupee size={20} style={{ marginRight: 2 }} /> {formattedPrice}
    </span>
    <span style={{
      fontSize: 10.5,
      color: propertyDetails.negotiation?.toLowerCase() === 'yes' ? '#15803D' : '#B91C1C',
      background: propertyDetails.negotiation?.toLowerCase() === 'yes' ? '#DCFCE7' : '#FEE2E2',
      padding: '3px 9px',
      borderRadius: 999,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
{propertyDetails.negotiation?.toLowerCase() === 'yes'
  ? 'Negotiable'
  : 'Non-Negotiable'}
     </span>
  </p>
      <p className="mt-1 mb-2" style={{paddingLeft:"10px", paddingRight:"10px", color:"#8B99A9", fontSize: 12.5, fontStyle: 'italic'}}>{priceInWords}</p>

        <h4 className="fw-bold mt-0 d-flex align-items-center" style={{fontSize:"14px",paddingLeft:"10px", color: "#1F3A3F", letterSpacing: 0.2, fontFamily: "Inter, sans-serif"}}>
          <span aria-hidden style={{display: "inline-block", width: 4, height: 14, borderRadius: 3, background: "linear-gradient(180deg,#30747F 0%,#6EB7B2 100%)", marginRight: 8}} />
          Make an offer
        </h4>
        <form
  onSubmit={(e) => {
    e.preventDefault();
    const storedPhoneNumber = localStorage.getItem("phoneNumber");
    if (!price || !storedPhoneNumber || !ppcId) {
      setMessage("Price, Phone number, and Property ID are required.");
      return;
    }
    setPendingOfferData({ price, phoneNumber: storedPhoneNumber, ppcId });
    setShowConfirmModal(true);
  }}
  className="d-flex mb-0"
>
  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                     <style>{`
                       @keyframes ppcOfferGlow {
                         0%, 100% { box-shadow: 0 0 0 0 rgba(47,116,127,0.55), 0 2px 6px rgba(47,116,127,0.25); }
                         50%      { box-shadow: 0 0 0 8px rgba(47,116,127,0.05), 0 4px 18px rgba(47,116,127,0.55); }
                       }
                       @keyframes ppcInputGlow {
                         0%, 100% { box-shadow: 0 0 0 0 rgba(47,116,127,0.18); }
                         50%      { box-shadow: 0 0 0 6px rgba(47,116,127,0.06); }
                       }
                     `}</style>
                     <FaRupeeSign style={{ position: 'absolute', left: 16, color: '#30747F', zIndex: 1 }} />
                     <input
                        type="number"
                        className="w-75 me-2 m-0 ms-2"
                        placeholder="Make an offer"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        style={{
                          padding: "10px 14px 10px 34px",
                          borderRadius: 10,
                          border: "1px solid #C6DFE3",
                          marginRight: "10px",
                          width: "100%",
                          fontSize: 14,
                          background: "#F6FAFB",
                          outline: "none",
                          fontFamily: "Inter, sans-serif",
                          animation: "ppcInputGlow 2.4s ease-in-out infinite",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#30747F";
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.animation = "none";
                          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,116,127,0.18), 0 0 14px rgba(47,116,127,0.35)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#C6DFE3";
                          e.currentTarget.style.background = "#F6FAFB";
                          e.currentTarget.style.animation = "ppcInputGlow 2.4s ease-in-out infinite";
                          e.currentTarget.style.boxShadow = "";
                        }}
                    />
                    <button className="m-0"
                        type="submit"
                        style={{
                          padding: "10px 18px",
                          borderRadius: 10,
                          border: "none",
                          background: "linear-gradient(135deg,#2F747F 0%,#3E8E96 100%)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                          letterSpacing: 0.5,
                          animation: "ppcOfferGlow 2.2s ease-in-out infinite",
                          transition: "transform 0.18s ease",
                        }}
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

{mainDetailsList.map(renderDetailItem)}


      {/* Contact Info Section */}
      <h5 className="pt-3 fw-bold">Contact Info</h5>
   

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
      {/* {propertyDetails.alternatePhone || "N/A"} */}
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

{/* Property Location — revealed together with the owner contact details */}
{locationDetailsList.length > 0 && (
  <div className="row g-3 mt-2">
    {locationDetailsList.map(renderDetailItem)}
  </div>
)}

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
        
        // Send call notifications via WhatsApp (non-blocking)
        console.log("📤 Sending call notifications...");
        
        if (propertyDetails && storedPhoneNumber) {
          try {
            // Send to owner
            if (propertyDetails.phoneNumber) {
              console.log("📧 Sending call notification to owner:", propertyDetails.phoneNumber);
              const ownerResult = await sendOwnerCallNotification(propertyDetails.phoneNumber, storedPhoneNumber, propertyDetails);
              console.log("📧 Owner call notification result:", ownerResult);
            } else {
              console.log("⚠️ Owner phone number not available");
            }
            
            // Send to user
            console.log("📧 Sending call notification to user:", storedPhoneNumber);
            const userResult = await sendUserCallNotification(storedPhoneNumber, propertyDetails.phoneNumber, propertyDetails.ownerName, propertyDetails);
            console.log("📧 User call notification result:", userResult);
          } catch (notifError) {
            console.error("❌ Error sending call notifications:", notifError);
          }
        }
        
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

   
      {/* Share Options Menu */}
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
        <div
          className="modal show d-block"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={closeModal}
        >
          {/* stopPropagation here so clicks on the image / arrows don't bubble
              to the backdrop's closeModal handler. */}
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div
                className="modal-body"
                style={{ position: "relative", padding: 12, touchAction: "pan-y", userSelect: "none" }}
                onPointerDown={(e) => {
                  modalSwipeStartRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => {
                  const start = modalSwipeStartRef.current;
                  modalSwipeStartRef.current = null;
                  if (!start || images.length <= 1) return;
                  const dx = e.clientX - start.x;
                  const dy = e.clientY - start.y;
                  // Only treat as a horizontal swipe when X movement clearly
                  // dominates Y movement — keeps vertical page scroll usable.
                  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    if (dx < 0) {
                      setCurrentImageIndex((i) => (i + 1) % images.length);
                    } else {
                      setCurrentImageIndex(
                        (i) => (i - 1 + images.length) % images.length
                      );
                    }
                  }
                }}
                onPointerCancel={() => {
                  modalSwipeStartRef.current = null;
                }}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={`Property ${currentImageIndex + 1}`}
                  draggable={false}
                  style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(
                          (i) => (i - 1 + images.length) % images.length
                        );
                      }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 10,
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 38,
                        height: 38,
                        fontSize: 22,
                        lineHeight: 1,
                        cursor: "pointer",
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((i) => (i + 1) % images.length);
                      }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 10,
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 38,
                        height: 38,
                        fontSize: 22,
                        lineHeight: 1,
                        cursor: "pointer",
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <p className="text-muted me-auto mb-0">
                  Image {currentImageIndex + 1} of {images.length}
                </p>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
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


<div className="d-flex align-items-center justify-content-center w-100 m-0 p-3" style={{gap: 12}}>
        <button onClick={handleGoBack} className="d-flex align-items-center justify-content-center border-0 p-2"
        style={{background:"#2ADBA4" , color:"#fff" , borderRadius:"25px" , flex: "1 1 0", maxWidth: 130, gap: 6 }}
        ><IoChevronBackSharp size={18}/>
 Back</button>
        <button className="d-flex align-items-center justify-content-center border-0 p-2" onClick={() => navigate('/mobileviews')}
               style={{background:"#2ADBA4" , color:"#fff" , borderRadius:"25px" , flex: "1 1 0", maxWidth: 130, gap: 6}}
        ><TiHome />
Home</button>
        <button className="d-flex align-items-center justify-content-center border-0 p-2" onClick={handleIncreasePpcId}
                style={{background:"#2ADBA4" , color:"#fff", borderRadius:"25px" , flex: "1 1 0", maxWidth: 130, gap: 6}}
        >Next
          <IoIosArrowForward size={18}/>
 </button>
      </div>

      {uploads.length > 0 && (
        <Carousel interval={3000} pause={false}>
          {uploads.flatMap((upload) =>
            upload.images.map((imgPath, idx) => {
              const imageUrl = `https://ppcpondy.com/PPC/${imgPath.replace(/\\/g, '/')}`;
 
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
    <InsufficientPointsModal
      open={showInsufficientPoints}
      onClose={() => setShowInsufficientPoints(false)}
      balance={pointsBalance}
      required={POINTS_PER_CONTACT_VIEW}
    />
    {showRevealConfirm && (
      <div onClick={() => setShowRevealConfirm(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(8,4,20,0.65)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16,
      }}>
        <style>{`
          @keyframes rcPop { from { opacity: 0; transform: scale(0.92) translateY(14px) } to { opacity: 1; transform: scale(1) translateY(0) } }
          @keyframes rcMarkPulse { 0%,100% { transform: scale(1) rotate(0); box-shadow: 0 0 0 0 rgba(255,200,87,0.55), 0 12px 30px rgba(0,0,0,0.35) } 50% { transform: scale(1.05) rotate(8deg); box-shadow: 0 0 0 18px rgba(255,200,87,0), 0 12px 30px rgba(0,0,0,0.35) } }
          @keyframes rcAura {
            0%,100% { box-shadow: 0 0 0 1px rgba(157,92,255,0.45), 0 0 60px rgba(157,92,255,0.45), 0 30px 80px rgba(0,0,0,0.55); }
            50%     { box-shadow: 0 0 0 1px rgba(34,211,238,0.55),  0 0 70px rgba(34,211,238,0.50), 0 30px 80px rgba(0,0,0,0.55); }
          }
          @keyframes rcCtaPulse {
            0%,100% { box-shadow: 0 10px 30px rgba(34,197,94,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset; }
            50%     { box-shadow: 0 10px 36px rgba(34,211,238,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset; }
          }
          .rc-aura { animation: rcAura 4s ease-in-out infinite; }
          .rc-cta  { animation: rcCtaPulse 2.6s ease-in-out infinite; transition: transform .12s ease, filter .2s ease; }
          .rc-cta:hover  { transform: translateY(-1px); filter: brightness(1.07); }
          .rc-cta:active { transform: scale(0.97); }
        `}</style>
        <div onClick={(e) => e.stopPropagation()} className="rc-aura" style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.14)',
          maxWidth: 380, width: '100%',
          borderRadius: 24, overflow: 'hidden', padding: 0, color: '#fff',
          animation: 'rcPop 0.3s cubic-bezier(0.34,1.56,0.64,1), rcAura 4s ease-in-out infinite',
        }}>
          <div style={{
            position: 'relative', height: 150,
            background: `
              radial-gradient(circle at 30% 30%, rgba(34,211,238,0.30), transparent 60%),
              radial-gradient(circle at 75% 70%, rgba(157,92,255,0.40), transparent 60%),
              linear-gradient(135deg,#1B0E3F 0%,#3A1B73 50%,#150C2E 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <div style={{ position:'absolute', top:-30, right:-20, width:140, height:140, borderRadius:'50%', background:'rgba(34,211,238,0.25)', filter:'blur(28px)' }} />
            <div style={{ position:'absolute', bottom:-30, left:-20, width:160, height:160, borderRadius:'50%', background:'rgba(157,92,255,0.30)', filter:'blur(36px)' }} />
            <div style={{
              width: 84, height: 84, borderRadius: '50%',
              background: 'linear-gradient(135deg,#FFE9B3,#FFC857 50%,#FF7A45)',
              color: '#2A1500',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'rcMarkPulse 2.2s ease-in-out infinite',
              border: '2px solid rgba(255,255,255,0.45)',
            }}>
              <GiTwoCoins size={44} />
            </div>
          </div>

          <div style={{ padding: '20px 22px 22px', textAlign: 'center', position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 999,
              background: 'rgba(157,92,255,0.18)', color: '#D7BBFF',
              border: '1px solid rgba(157,92,255,0.40)',
              fontSize: 11, fontWeight: 800, letterSpacing: 0.7,
            }}>👁 ALREADY VIEWED</div>
            <h3 style={{
              margin: '12px 0 6px', fontSize: 20, letterSpacing: -0.3, fontWeight: 800,
              background: 'linear-gradient(135deg,#fff,#C9C2FF 60%,#22D3EE)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              View this contact again?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>
              You've already viewed this property's owner contact.
            </p>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14, padding: '12px 16px', marginTop: 14,
            }}>
              <div style={{ textAlign: 'left' }}>
                <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>This will cost</small>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#F9A8D4', textShadow: '0 0 14px rgba(244,114,182,0.55)' }}>−{POINTS_PER_CONTACT_VIEW} pts</div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg,#FFC857,#FF7A45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2A1500', fontSize: 24,
                boxShadow: '0 8px 24px rgba(255,122,69,0.50)',
              }}>🪙</div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowRevealConfirm(false)} style={{
                flex: 1, padding: 13, borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                fontWeight: 700, cursor: 'pointer',
              }}>No, cancel</button>
              <button onClick={confirmRevealDeduct} className="rc-cta" style={{
                flex: 1.4, padding: 13, borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#1a7c3e,#27AE60)', color: '#fff',
                fontWeight: 900, cursor: 'pointer',
              }}>Yes, deduct {POINTS_PER_CONTACT_VIEW} pts</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
    </div>

  );
};

export default Details;
































