

import React, { useState , useRef} from "react";
import { FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign , FaCamera, FaEye } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { Container, Row, Col, Nav, Tab } from "react-bootstrap";
import {  MdOutlineCall , MdFamilyRestroom , MdOutlineMapsHomeWork , MdCalendarMonth , MdOutlineBed , MdOutlineTimer  } from "react-icons/md";
import { LuIndianRupee , LuBriefcaseBusiness  } from "react-icons/lu";
import { GrMapLocation } from "react-icons/gr";
import { GiSittingDog } from "react-icons/gi";
import { IoFastFoodOutline } from "react-icons/io5";
import { GoHome } from "react-icons/go";
import { RiStairsLine } from "react-icons/ri";
import profil from '../Assets/xd_profile.png'
import NoData from "../Assets/OOOPS-No-Data-Found.png";

const MyInterestBuyers = () => {
    const cards = [
        { 
          id: 1, 
          name: "John Doe", 
          price: 200, 
          month: "January", 
          monthlyPrice: 500, 
          location: "New York", 
          number: 10, 
          mobileNumber: "1234567890",
          member:'Any Member',
          Business:"Business",
          food:'Any food Habit',
          pet:'Pet-Yes',
          bed: 'Any BHK',
          time:'Immediately',
          floor:'Any floor',
          payment:'Monthly',
          housetype:'anny Type',
          propertymode:'Commerical'
        },
        { 
          id: 2, 
          name: "Jane Smith", 
          price: 150, 
          month: "February", 
          monthlyPrice: 400, 
          location: "Los Angeles", 
          number: 8, 
          mobileNumber: "9876543210" ,
          member:'Any Member',
          Business:"Business",
          food:'Any food Habit',
          pet:'Pet-Yes',
          bed: 'Any BHK',
          time:'Immediately',
          floor:'Any floor',
          payment:'Monthly',
          housetype:'anny Type',
          propertymode:'Commerical'
          
        },
        { 
          id: 3, 
          name: "Alice Johnson", 
          price: 300, 
          month: "March", 
          monthlyPrice: 600, 
          location: "Chicago", 
          number: 15, 
          mobileNumber: "5551234567",
          member:'Any Member',
          Business:"Business",
          food:'Any food Habit',
          pet:'Pet-Yes', 
          bed: 'Any BHK',
          time:'Immediately',
          floor:'Any floor',
          payment:'Monthly',
          housetype:'anny Type',
          propertymode:'Commerical'
        },
        { 
          id: 4, 
          name: "Bob Brown", 
          price: 250, 
          month: "April", 
          monthlyPrice: 550, 
          location: "Houston", 
          number: 12, 
          mobileNumber: "2223456789",
          member:'Any Member',
          Business:"Business",
          food:'Any food Habit',
          pet:'Pet-Yes',
          bed: 'Any BHK',
          time:'Immediately',
          floor:'Any floor',
          payment:'Monthly',
          housetype:'anny Type',
          propertymode:'Commerical'
        },
      ];
    
      const scrollContainerRef = useRef(null);
      const iconContainerRef = useRef(null);
    
      const handleWheelScroll = (e) => {
        if (scrollContainerRef.current) {
          e.preventDefault();
          scrollContainerRef.current.scrollTop += e.deltaY;
        }
      };
    
      const handleIconScroll = (e) => {
        if (iconContainerRef.current) {
          e.preventDefault();
          const scrollAmount = e.deltaX || e.deltaY;
          iconContainerRef.current.scrollLeft += scrollAmount;
        }
      };
  const [properties, setProperties] = useState([
    {
      _id: "1",
      ppcId: "PUC-001",
      photos: [],
      propertyMode: "Sale",
      propertyType: "Apartment",
      city: "Pondicherry",
      totalArea: "1200 sq.ft",
      bedrooms: 3,
      ownership: "Owner",
      bestTimeToCall: "9 AM - 5 PM",
      price: "₹50,00,000",
      removed: false,
    },
    {
      _id: "2",
      ppcId: "PUC-002",
      photos: [],
      propertyMode: "Rent",
      propertyType: "Villa",
      city: "Chennai",
      totalArea: "2000 sq.ft",
      bedrooms: 4,
      ownership: "Agent",
      bestTimeToCall: "10 AM - 6 PM",
      price: "₹1,00,000",
      removed: false,
    },
    {
      _id: "3",
      ppcId: "PUC-003",
      photos: [],
      propertyMode: "Sale",
      propertyType: "Plot",
      city: "Bangalore",
      totalArea: "5000 sq.ft",
      bedrooms: null,
      ownership: "Owner",
      bestTimeToCall: "11 AM - 7 PM",
      price: "₹75,00,000",
      removed: true,
    },
  ]);

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
  const filterProperties = (removedStatus) => {
    return properties.filter(property => property.removed === removedStatus);
  };

  return (
    <Container fluid style={{ fontFamily: '"inter", sans-serif', width:"470px" }}>
      <Helmet>
        <title>Pondy Property | Properties</title>
      </Helmet>

      <Tab.Container defaultActiveKey="all">
        <Row className="mb-4">
          <Col>
            <Nav variant="tabs" className="w-100">
              {/* All Tab */}
              <Nav.Item className="w-50">
                <Nav.Link className="text-center"
                  eventKey="all" 
                  style={{
                    backgroundColor: '#4F4B7E', 
                    color: 'white', 
                    padding: '10px 20px', 
                    borderRadius: '5px'
                  }}
                >
                  ALL
                </Nav.Link>
              </Nav.Item>

              {/* Removed Tab */}
              <Nav.Item className="w-50">
                <Nav.Link className="text-center"
                  eventKey="removed" 
                  style={{
                    backgroundColor: '#FF0000', 
                    color: 'white', 
                    padding: '10px 20px', 
                    borderRadius: '5px'
                  }}
                >
                  REMOVED
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        <Row className="g-3">
          <Col lg={12} className="d-flex align-items-center justify-content-center">
            <Tab.Content>
              {/* Tab for All Properties */}
              <Tab.Pane eventKey="all">
                <div style={{ maxHeight: '100vh', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                  {filterProperties(false).length > 0 ? (
                    filterProperties(false).map((property) => (
                        <div
                        className="d-flex flex-column justify-content-center"
                        style={{
                          height: "auto",
                          padding: "10px",
                          gap: "15px",
                        //   border: "1px solid #ddd",
                          borderRadius: "10px",
                          overflowY: "auto", 
                        }}
                        onWheel={handleWheelScroll}
                        ref={scrollContainerRef}
                      >
                        {cards.map((card) => (
                          <div
                            key={card.id}
                            className="card"
                            style={{
                              width: "450px", 
                              border: "1px solid #ddd",
                              borderRadius: "10px",
                              overflow: "hidden",
                              padding: "15px",
                              marginBottom: "15px",
                            }}
                          >
                            <div className="d-flex align-items-start mb-3">
                              <img
                                src={profil}
                                alt="Placeholder"
                                className="rounded-circle"
                                style={{ width: "80px", height: "80px", objectFit: "cover" }}
                              />
                              <div className="ms-3 flex-grow-1">
                              <p className="mb-1">RA ID: {card.id}</p>
                                <h5 className="mb-1">{card.name} | <span className="text-muted" style={{fontSize:"12px"}}>buyer</span></h5>
                                <p className="mb-1"><LuIndianRupee color="#019988" className="me-2"/>
                                   {card.price
          ? formatPrice(card.price)
          : 'N/A'}  </p>
                              </div>
                              <div>
                                <p className="mb-1 text-muted"><MdCalendarMonth color="#019988" className="me-2"/> 
                                {card.month}</p>
                                <p className="mb-1"><LuIndianRupee color="#019988" className="me-2"/>
                                  {card.monthlyPrice
          ? formatPrice(card.monthlyPrice)
          : 'N/A'}  </p>
                              </div>
                            </div>
                  
                            <div
                              className="d-flex align-items-center overflow-auto mb-3 p-1 rounded-1"
                              style={{
                                whiteSpace: "nowrap",
                                minWidth: "100%",
                                overflowX: "auto",
                                scrollbarWidth: "none", 
                                msOverflowStyle: "none",
                                border:"1px solid #019988"
                              }}
                              onWheel={handleIconScroll}
                              ref={iconContainerRef}
                            >
                              <div className="d-flex align-items-center me-3">
                                <GoHome  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.propertymode}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdOutlineMapsHomeWork  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.housetype}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdCalendarMonth  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.payment}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdOutlineBed  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.bed}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <RiStairsLine size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.floor}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdOutlineTimer size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.time}</p>
                              </div>
                            </div>
                  
                            <div
                              className="d-flex align-items-center overflow-auto mb-3 p-1 rounded-1"
                              style={{
                                whiteSpace: "nowrap",
                                minWidth: "100%",
                                overflowX: "auto",
                                scrollbarWidth: "none", 
                                msOverflowStyle: "none",
                                border:'1px solid #019988'
                              }}
                              onWheel={handleIconScroll}
                              ref={iconContainerRef}
                            >
                              <div className="d-flex align-items-center me-3">
                                <MdFamilyRestroom  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.member}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <LuBriefcaseBusiness size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.Business}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <IoFastFoodOutline size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.food}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <GiSittingDog size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.pet}</p>
                              </div>
                            </div>
                  
                            <div className="mb-3">
                              <p className="mb-0">
                                <GrMapLocation  size={16} className="me-2" color="#019988"/>
                                {card.location}
                              </p>
                            </div>
                  
                            <div className="d-flex justify-content-between align-items-center">
                              <p className="mb-0">
                                <MdOutlineCall  size={16} className="me-2" color="#019988"/>
                                 {card.mobileNumber.slice(0, -5)}*****
                              </p>
                              <div>
                                <button className="btn btn-sm me-2" style={{background:"#FF0000", color:"#fff"}}>REMOVE</button>
                                <button className="btn btn-primary btn-sm">INTEREST SENT</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                         <div className="text-center my-4 "
                                    style={{
                                      position: 'fixed',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                              
                                    }}>
                            <img src={NoData} alt="" width={100}/>      
                            <p>No properties available.</p>
                            </div> 
                  )}
                </div>
              </Tab.Pane>

              {/* Tab for Removed Properties */}
              <Tab.Pane eventKey="removed">
                <div style={{ maxHeight: '100vh', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                  {filterProperties(true).length > 0 ? (
                    filterProperties(true).map((property) => (
                        <div
                        className="d-flex flex-column justify-content-center"
                        style={{
                          height: "auto",
                          padding: "10px",
                          gap: "15px",
                          border: "1px solid #ddd",
                          borderRadius: "10px",
                          overflowY: "auto", 
                        }}
                        onWheel={handleWheelScroll}
                        ref={scrollContainerRef}
                      >
                        {cards.map((card) => (
                          <div
                            key={card.id}
                            className="card"
                            style={{
                              width: "450px", 
                              border: "1px solid #ddd",
                              borderRadius: "10px",
                              overflow: "hidden",
                              padding: "15px",
                              marginBottom: "15px",
                            }}
                          >
                            <div className="d-flex align-items-start mb-3">
                              <img
                                src={profil}
                                alt="Placeholder"
                                className="rounded-circle"
                                style={{ width: "80px", height: "80px", objectFit: "cover" }}
                              />
                              <div className="ms-3 flex-grow-1">
                              <p className="mb-1">RA ID: {card.id}</p>
                                <h5 className="mb-1">{card.name} | <span className="text-muted" style={{fontSize:"12px"}}>buyer</span></h5>
                                <p className="mb-1"><LuIndianRupee color="#019988" className="me-2"/>
                                {card.price}</p>
                              </div>
                              <div>
                                <p className="mb-1 text-muted"><MdCalendarMonth color="#019988" className="me-2"/> 
                                {card.month}</p>
                                <p className="mb-1"><LuIndianRupee color="#019988" className="me-2"/>
                                {card.monthlyPrice}</p>
                              </div>
                            </div>
                  
                            <div
                              className="d-flex align-items-center overflow-auto mb-3 p-1 rounded-1"
                              style={{
                                whiteSpace: "nowrap",
                                minWidth: "100%",
                                overflowX: "auto",
                                scrollbarWidth: "none", 
                                msOverflowStyle: "none",
                                border:"1px solid #019988"
                              }}
                              onWheel={handleIconScroll}
                              ref={iconContainerRef}
                            >
                              <div className="d-flex align-items-center me-3">
                                <GoHome  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.propertymode}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdOutlineMapsHomeWork  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.housetype}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdCalendarMonth  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.payment}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdOutlineBed  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.bed}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <RiStairsLine size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.floor}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <MdOutlineTimer size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.time}</p>
                              </div>
                            </div>
                  
                            <div
                              className="d-flex align-items-center overflow-auto mb-3 p-1 rounded-1"
                              style={{
                                whiteSpace: "nowrap",
                                minWidth: "100%",
                                overflowX: "auto",
                                scrollbarWidth: "none", 
                                msOverflowStyle: "none",
                                border:'1px solid #019988'
                              }}
                              onWheel={handleIconScroll}
                              ref={iconContainerRef}
                            >
                              <div className="d-flex align-items-center me-3">
                                <MdFamilyRestroom  size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.member}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <LuBriefcaseBusiness size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.Business}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <IoFastFoodOutline size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.food}</p>
                              </div>
                              <div className="d-flex align-items-center me-3">
                                <GiSittingDog size={20} className="me-2" color="#019988"/>
                                <p className="mb-0 small">{card.pet}</p>
                              </div>
                            </div>
                  
                            <div className="mb-3">
                              <p className="mb-0">
                                <GrMapLocation  size={16} className="me-2" color="#019988"/>
                                {card.location}
                              </p>
                            </div>
                  
                            <div className="d-flex justify-content-between align-items-center">
                              <p className="mb-0">
                                <MdOutlineCall  size={16} className="me-2" color="#019988"/>
                                 {card.mobileNumber.slice(0, -5)}*****
                              </p>
                              <div>
                                <button className="btn btn-sm me-2" style={{background:"#FF0000", color:"#fff"}}>REJECTED</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                         <div className="text-center my-4 "
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
          
                }}>
        <img src={NoData} alt="" width={100}/>      
        <p>No removed properties found.</p>
        </div> 
                  )}
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default MyInterestBuyers;
