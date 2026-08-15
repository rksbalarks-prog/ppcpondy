


import React, { useEffect, useState } from 'react';
import TopBar from './TopBar';
import BottomNavigation from './BottomNavigation';
import { FaHome, FaBuilding, FaPlusSquare, FaUser, FaEllipsisH } from 'react-icons/fa';
import Nopage from './Nopage';
import MoreComponent from './MoreComponent';
import MyProperty from './MyProperty';
import PropertyCards from './PropertyCards';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import AddProps from './AddProps';
import logo from '../Assets/ppc_sentyourinterest.png';
import logo2 from '../Assets/allprop50.png';
import logo3 from '../Assets/bl50.png';
import logo7 from '../Assets/fprop50.png';
import nvprop50 from '../Assets/nvprop50.PNG';
import logo9 from '../Assets/my50.png';
import logo10 from '../Assets/seller50.png';
import logo11 from '../Assets/buyer50.PNG';
import mapicon from '../Assets/locations.png';

import PropertyForm from './PropertyAssistance';
import OwnerMenu from './OwnerMenu';
import BuyerMenu from './BuyerMenu';
import BuyerAssistance from './BuyerAssistance';
import ZeroView from './ZeroView';
import Navbar from "./Navbar";
import FeaturedProperty from './FeatureProperty';
import BuyerLists from './BuyerLists';
import PyProperty from './PyProperty';
import AllProperty from './AllProperty';
import PropertyMap from './PropertyMap';
import navBg from '../Assets/bottomimg.png'
import Groom from './Groom';
import Bride from './Bride';
import groom from '../Assets/groom.PNG';
import ChennaiProperty from './ChennaiProperty';
import PropertyVideo from './PropertyVideo';
import SaleProperty from './SaleProperty';
import salee from '../Assets/Rent Property-01.png';
import SaleAllProperty from './SaleAllProperty';
import PayNow from './PayNow';


const Main = ({ phoneNumber: propPhoneNumber , viewportHeight}) => {
  const [ppcId, setPpcId] = useState(null);
  const [mainPhoneNumber, setMainPhoneNumber] = useState(''); // Renamed to avoid conflict
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get from props or localStorage
    const storedPhone = localStorage.getItem('phoneNumber');
    let phoneDigits = '';

    if (propPhoneNumber) {
      phoneDigits = propPhoneNumber.replace(/\D/g, '').slice(-10);
    } else if (storedPhone) {
      phoneDigits = storedPhone.replace(/\D/g, '').slice(-10);
    }

    if (phoneDigits.length === 10) {
      setMainPhoneNumber(phoneDigits);
    } else {
      navigate('/login');
    }
  }, [propPhoneNumber, navigate]);


  

  // Get phone number from props, location state, or localStorage
  const { phoneNumber: statePhoneNumber, countryCode: stateCountryCode } = location.state || {};
  const storedPhoneNumber = localStorage.getItem('phoneNumber');
  const storedCountryCode = localStorage.getItem('countryCode');

  // Determine the final phone number to use
  const phoneNumber = propPhoneNumber || statePhoneNumber || storedPhoneNumber;
  const countryCode = stateCountryCode || storedCountryCode || '91'; // Default to India

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phoneNumber) {
      localStorage.setItem('phoneNumber', phoneNumber);
    }
  }, [phoneNumber]);

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Main",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);
  
  const [activeContent, setActiveContent] = useState(() => {
    const { initialContent } = location.state || {};
    return initialContent || localStorage.getItem('lastActiveContent') || 'topPyProperty';
  });

  // Capture freshLogin state from location
  const [freshLoginState, setFreshLoginState] = useState(() => {
    const { freshLogin } = location.state || {};
    return freshLogin || localStorage.getItem('freshLogin') === 'true';
  });
  
  useEffect(() => {
    localStorage.setItem('lastActiveContent', activeContent);
  }, [activeContent]);
  
  const topBarItems = [
    { icon: logo, text: 'Py Property', content: 'topPyProperty' },
        { icon: logo, text: 'Chennai Property', content: 'topChennaiProperty' },

    { icon: logo2, text: 'All Property', content: 'topAllProperty' },
        { icon: mapicon, text: 'Property Map', content: 'topPropertyMap' },

    { icon: logo3, text: 'Buyer List', content: 'topMBuyerList' },
            { icon: salee, text: 'Rent Property', content: 'topSaleProperty' },

    { icon: logo7, text: 'Feature Property', content: 'topFeatureProperty' },

            { icon: groom, text: 'Groom', content: 'topGroom' },
        { icon: groom, text: 'Bride', content: 'topBride' },
{ icon: groom, text: 'Property Video', content: 'topPropertyVideo' },
    { icon: nvprop50, text: 'Not Viewed Property', content: 'topNotViewedProperty' },
    { icon: logo9, text: 'My Property', content: 'topMyProperty' },
    { icon: logo10, text: 'Owner Menu', content: 'topOwnerMenu' },
    { icon: logo11, text: 'Buyer Menu', content: 'topBuyerMenu' },
  ];

  const bottomNavItems = [
    { icon: <FaHome />, text: 'Home', content: 'bottomHome' },
    { icon: <FaBuilding />, text: 'MyProperty', content: 'bottomProperty' },
    { icon: <FaPlusSquare />, text: 'AddProperty', content: 'bottomAdd' },
    { icon: <FaUser />, text: 'Buyer', content: 'bottomBuyer' },
    { icon: <FaEllipsisH />, text: 'More', content: 'bottomMore' },
  ];

  const renderContent = () => {
    switch (activeContent) {
      case 'topPyProperty': return <PyProperty />;
      case 'topChennaiProperty' : return <ChennaiProperty />
      case 'topAllProperty': return <AllProperty phoneNumber={phoneNumber} />;
      case 'topPropertyMap': return <PropertyMap />;

         case 'topGroom': return <Groom />;
      case 'topBride': return <Bride />;
case 'topPropertyVideo': return <PropertyVideo />;
      case 'topMBuyerList': return <BuyerLists phoneNumber={phoneNumber} />;
            case 'topSaleProperty': return <SaleAllProperty />;

      case 'topFeatureProperty': return <FeaturedProperty />;
      case 'topNotViewedProperty': return <ZeroView />;
      case 'topMyProperty': return <MyProperty phoneNumber={phoneNumber} />;
      case 'topOwnerMenu': return <OwnerMenu phoneNumber={phoneNumber} />;
      case 'topBuyerMenu': return <BuyerMenu phoneNumber={phoneNumber} />;
      case 'bottomHome': return <AllProperty phoneNumber={phoneNumber} freshLogin={freshLoginState} setActiveContent={setActiveContent} />;
      case 'bottomProperty': return <MyProperty phoneNumber={phoneNumber} />;
      case 'bottomAdd': return <AddProps phoneNumber={phoneNumber} />;
      case 'bottomAddSeller': return <AddProps phoneNumber={phoneNumber} />;
      case 'bottomBuyer': return <BuyerAssistance phoneNumber={phoneNumber} />;
      case 'bottomBuyerAssistance': return <BuyerAssistance phoneNumber={phoneNumber} />;
      case 'bottomMore': return <MoreComponent phoneNumber={phoneNumber} />;
      default: return <Nopage />;
    }
  };

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  
 
  
useEffect(() => {
    const handleResize = () => {
      const heightRatio = window.innerHeight / window.screen.height;
      const isKeyboardVisible = heightRatio < 0.75;
      const nav = document.getElementById("bottom-nav");
  
      if (nav) {
        nav.style.display = isKeyboardVisible ? "none" : "block";
      }
    };
    if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleResize);
  } else {
    window.addEventListener("resize", handleResize);
  }

  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", handleResize);
    } else {
      window.removeEventListener("resize", handleResize);
    }
  };
 
  }, []);


  return (
   
    <div className="d-flex justify-content-center align-items-center"
         style={{ minHeight: `${viewportHeight}px`, background: '#E5E5E5' }}>
      <div style={{
        maxWidth: '470px',
        width: "100%",
        background: 'white',
        display: "flex",
        flexDirection: "column",
        height: `${viewportHeight}px`,
        overflow: "hidden",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)"
      }}>
        <div className="position-fixed top-0 start-50 translate-middle-x"
             style={{ width: "100%", maxWidth: "470px", zIndex: 1050 }}>
          <Navbar />
        </div>

        <div className="position-fixed start-50 translate-middle-x"
             style={{ top: "60px", width: "100%", maxWidth: "470px", zIndex: 1040 }}>
          <TopBar items={topBarItems} setActive={setActiveContent} activeItem={activeContent} />
        </div>

        <div className="flex-grow-1 mx-auto"
             style={{
               width: "100%",
               maxWidth: "470px",
               overflowY: "auto",
               paddingTop: "104px",
               paddingBottom: "90px",
               scrollbarWidth: "none",
               position: "relative"
             }}>
          {renderContent()}
        </div>

        {/* Floating Pay Now button + amount modal */}
        <PayNow phoneNumber={phoneNumber} />

        <div className={isMobile ? "" : "position-fixed bottom-0 start-50 translate-middle-x"}
             style={{
               backgroundImage: `url(${navBg})`,
               backgroundRepeat: 'no-repeat',
               backgroundPosition: 'center',
               backgroundSize: 'cover',
               width: "100%",
               maxWidth: "472px",
               zIndex: 1050,
             }}
             id="bottom-nav">
          <BottomNavigation activeItem={activeContent} setActive={setActiveContent} />
        </div>
      </div>
    </div>
  );
};

export default Main;






















 
