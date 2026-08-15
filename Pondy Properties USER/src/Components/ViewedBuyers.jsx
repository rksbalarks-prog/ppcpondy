
import React, { useState, useRef } from "react";
import { FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign, FaCamera, FaEye } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { Container, Row, Col, Nav, Tab } from "react-bootstrap";
import { MdOutlineCall, MdFamilyRestroom, MdOutlineMapsHomeWork, MdCalendarMonth, MdOutlineBed, MdOutlineTimer } from "react-icons/md";
import { LuIndianRupee, LuBriefcaseBusiness } from "react-icons/lu";
import { GrMapLocation } from "react-icons/gr";
import { GiSittingDog } from "react-icons/gi";
import { IoFastFoodOutline } from "react-icons/io5";
import { GoHome } from "react-icons/go";
import { RiStairsLine } from "react-icons/ri";
import profil from '../Assets/xd_profile.png'
import NoData from "../Assets/OOOPS-No-Data-Found.png";

const ViewedBuyers = () => {
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
            member: 'Any Member',
            Business: "Business",
            food: 'Any food Habit',
            pet: 'Pet-Yes',
            bed: 'Any BHK',
            time: 'Immediately',
            floor: 'Any floor',
            payment: 'Monthly',
            housetype: 'anny Type',
            propertymode: 'Commerical'
        },
        {
            id: 2,
            name: "Jane Smith",
            price: 150,
            month: "February",
            monthlyPrice: 400,
            location: "Los Angeles",
            number: 8,
            mobileNumber: "9876543210",
            member: 'Any Member',
            Business: "Business",
            food: 'Any food Habit',
            pet: 'Pet-Yes',
            bed: 'Any BHK',
            time: 'Immediately',
            floor: 'Any floor',
            payment: 'Monthly',
            housetype: 'anny Type',
            propertymode: 'Commerical'

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
            member: 'Any Member',
            Business: "Business",
            food: 'Any food Habit',
            pet: 'Pet-Yes',
            bed: 'Any BHK',
            time: 'Immediately',
            floor: 'Any floor',
            payment: 'Monthly',
            housetype: 'anny Type',
            propertymode: 'Commerical'
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
            member: 'Any Member',
            Business: "Business",
            food: 'Any food Habit',
            pet: 'Pet-Yes',
            bed: 'Any BHK',
            time: 'Immediately',
            floor: 'Any floor',
            payment: 'Monthly',
            housetype: 'anny Type',
            propertymode: 'Commerical'
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

    const filterProperties = (removedStatus) => {
        return properties.filter(property => property.removed === removedStatus);
    };

    return (
        <Container fluid style={{ fontFamily: '"inter", sans-serif', width: "470px" }}>
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
                                                                <div className="rounded-1" style={{border:'2px solid #4F4B7E'}} ><p className="text-center p-1 m-0" style={{color:"#4F4B7E"}}>TENANT CONTACED</p> </div>
                                                                <p className="mb-1">RA ID: {card.id}</p>
                                                                <h5 className="mb-1">{card.propertymode} | <span className="text-muted" style={{ fontSize: "12px" }}>HOUSE</span></h5>
                                                            </div>
                                                           
                                                        </div>

                                                        <div className="row">
                                                        <div className="col-6 d-flex align-items-center mt-1 mb-1 ">
                                                                <div className="card d-flex flex-row align-items-center border-0" >
                                                                    <FaUserAlt color="#4F4B7E" className="me-2"  style={{fontSize:"18px"}} />
                                                                    <div className="card-body p-1">
                                                                        <span className="text-muted" style={{fontSize:"10px"}}>Tatent Phone</span>
                                                                        <p>{card.mobileNumber.slice(0, -5)}*****</p>
                                                                    </div>
                                                                </div>         
                                                            </div>
                                                            <div className="col-6 d-flex align-items-center mt-1 mb-1">
                                                                <div className="card d-flex flex-row align-items-center border-0">
                                                                    <MdCalendarMonth color="#4F4B7E" className="me-2" style={{fontSize:"18px"}}/>
                                                                    <div className="card-body p-1">
                                                                        <span className="text-muted"style={{fontSize:"10px"}}>Tatent Contacetd DAte</span>
                                                                        <p>02/01/24</p>
                                                                    </div>
                                                                </div>         
                                                            </div>
                                                        
                                                        </div>
                                                      

                                                        <div className="d-flex justify-content-end align-items-center">
                                                       
                                                            <div>
                                                                <button className="btn btn-sm me-2" style={{ background: "#FF0000", color: "#fff" }}>REMOVE</button>
                                                                <button className="btn btn-primary btn-sm">CALL</button>
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
        <p>No properties found.</p>
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
                                                                <div className="rounded-1" style={{border:'2px solid #4F4B7E'}} ><p className="text-center p-1 m-0" style={{color:"#4F4B7E"}}>TENANT CONTACED</p> </div>
                                                                <p className="mb-1">RA ID: {card.id}</p>
                                                                <h5 className="mb-1">{card.propertymode} | <span className="text-muted" style={{ fontSize: "12px" }}>HOUSE</span></h5>
                                                            </div>
                                                           
                                                        </div>

                                                        <div className="row">
                                                        <div className="col-6 d-flex align-items-center mt-1 mb-1 ">
                                                                <div className="card d-flex flex-row align-items-center border-0" >
                                                                    <FaUserAlt color="#4F4B7E" className="me-2"  style={{fontSize:"18px"}} />
                                                                    <div className="card-body p-1">
                                                                        <span className="text-muted" style={{fontSize:"10px"}}>Tatent Phone</span>
                                                                        <p>{card.mobileNumber.slice(0, -5)}*****</p>
                                                                    </div>
                                                                </div>         
                                                            </div>
                                                            <div className="col-6 d-flex align-items-center mt-1 mb-1">
                                                                <div className="card d-flex flex-row align-items-center border-0">
                                                                    <MdCalendarMonth color="#4F4B7E" className="me-2" style={{fontSize:"18px"}}/>
                                                                    <div className="card-body p-1">
                                                                        <span className="text-muted"style={{fontSize:"10px"}}>Tatent Contacetd DAte</span>
                                                                        <p>02/01/24</p>
                                                                    </div>
                                                                </div>         
                                                            </div>
                                                        
                                                        </div>
                                                      

                                                        <div className="d-flex justify-content-end align-items-center">
                                                     
                                                            <div>
                                                                <button className="btn btn-sm me-2" style={{ background: "#FF0000", color: "#fff" }}>REMOVE</button>
                                                                <button className="btn btn-primary btn-sm">CALL</button>
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

export default ViewedBuyers;
