

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import calendar from '../Assets/Calender-01.png'
import pic from '../Assets/Mask Group 3.png'; // Correct path


const NewProperty = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";

  const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "New Property",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);
  const handleClick = () => {
    navigate("/login"); // Navigate to the "About" page
  };
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [propertyImageIndex, setPropertyImageIndex] = useState({}); // Track image index for each property
  const carouselRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // useEffect(() => {
  //   const fetchProperties = async () => {
  //     try {
  //       const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-users-datas`);
  //       const fetchedProperties = response.data.users;

  //       const tenDaysAgo = new Date();
  //       tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  //       const recentProperties = fetchedProperties.filter((property) => {
  //         const propertyDate = new Date(property.createdAt);
  //         return propertyDate >= tenDaysAgo;
  //       });

  //       setFilteredProperties(recentProperties);
  //     } catch (error) {
  //     }
  //   };

  //   fetchProperties();
  // }, []);



  useEffect(() => {
  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-users-datas`);
      console.log('Properties Response:', response.data);
      const fetchedProperties = response.data.users;

      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const recentProperties = fetchedProperties.filter((property) => {
        const propertyDate = new Date(property.createdAt);
        return propertyDate >= twentyDaysAgo;
      });

      console.log('Filtered Properties:', recentProperties);
      setFilteredProperties(recentProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  fetchProperties();
}, []);



  const nextSlide = () => {
    setIsAnimating(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredProperties.length);
    setTimeout(() => {
      setIsAnimating(true);
    }, 3000);
  };

  const prevSlide = () => {
    setIsAnimating(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + filteredProperties.length) % filteredProperties.length);
    setTimeout(() => {
      setIsAnimating(true);
    }, 3000);
  };

  useEffect(() => {
    const track = carouselRef.current;
    if (track) {
      track.style.animation = isAnimating ? "scroll 20s linear infinite" : "none";
    }
  }, [isAnimating]);

  // Auto-slideshow for property images
  useEffect(() => {
    const autoSlideInterval = setInterval(() => {
      setPropertyImageIndex(prev => {
        const newIndex = { ...prev };
        filteredProperties.forEach(property => {
          if (property.photos && property.photos.length > 1) {
            newIndex[property._id] = ((newIndex[property._id] || 0) + 1) % property.photos.length;
          }
        });
        return newIndex;
      });
    }, 1000); // Change image every 1 second

    return () => clearInterval(autoSlideInterval);
  }, [filteredProperties]);

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

// Handle property image navigation
const handlePropertyImageNext = (propertyId, totalPhotos) => {
  setPropertyImageIndex(prev => ({
    ...prev,
    [propertyId]: ((prev[propertyId] || 0) + 1) % totalPhotos
  }));
};

const handlePropertyImagePrev = (propertyId, totalPhotos) => {
  setPropertyImageIndex(prev => ({
    ...prev,
    [propertyId]: ((prev[propertyId] || 0) - 1 + totalPhotos) % totalPhotos
  }));
};

const getPropertyImage = (property) => {
  if (property.photos && property.photos.length > 0) {
    const currentImageIndex = propertyImageIndex[property._id] || 0;
    return `https://ppcpondy.com/PPC/${property.photos[currentImageIndex].replace(/\\/g, "/").replace(/^\/+/, "")}`;
  }
  return pic;
};

  return (
    <>
    <div
      className="p-0 mt-5 newproperty-section"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3F0 50%, #EBE5DB 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "600px",
        width: "100%",
        position: "relative",
        paddingTop: "30px",
        paddingBottom: "30px",
        overflow: "hidden",
      }}>
      
      <style>
        {`
          .newproperty-section {
            font-family: 'Segoe UI', 'Poppins', 'Inter', sans-serif;
          }

          .newproperty-title {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 20px;
            letter-spacing: -0.5px;
            padding: 0 20px;
            position: relative;
            display: inline-block;
            width: 100%;
          }

          .newproperty-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 20px;
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, #FF6B35 0%, #F7911D 100%);
            border-radius: 2px;
          }

          .carousel-container {
            overflow: hidden;
            width: 100%;
            position: relative;
            padding: 40px 20px 20px 20px;
            font-family: 'Segoe UI', 'Poppins', 'Inter', sans-serif;
          }

          .carousel-track {
            display: flex;
            flex-wrap: nowrap;
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            gap: 24px;
            padding: 0 10px;
          }

          .property-card-wrapper {
            flex: 0 0 auto;
            animation: fadeInUpProperties 0.6s ease-out forwards;
          }

          .property-card-wrapper:nth-child(2) {
            animation-delay: 0.1s;
          }

          .property-card-wrapper:nth-child(3) {
            animation-delay: 0.2s;
          }

          @keyframes fadeInUpProperties {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .property-card {
            display: flex;
            flex-direction: column;
            height: 100%;
            border-radius: 16px;
            overflow: hidden;
            background: #FFFFFF;
            border: 1px solid rgba(200, 195, 188, 0.3);
            box-shadow: 0 4px 15px rgba(26, 26, 26, 0.06);
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
          }

          .property-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 145, 29, 0.05) 100%);
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
            z-index: 1;
          }

          .property-card:hover {
            transform: translateY(-12px);
            box-shadow: 0 20px 40px rgba(26, 26, 26, 0.15);
            border-color: rgba(255, 107, 53, 0.2);
          }

          .property-card:hover::before {
            opacity: 1;
          }

          .property-card-img-wrapper {
            position: relative;
            overflow: hidden;
            height: 280px;
            background: linear-gradient(135deg, #f0e6d2 0%, #e8dcc7 100%);
          }

          .property-card-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .property-card:hover .property-card-img {
            transform: scale(1.08);
          }

          .property-image-counter {
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 3;
            backdrop-filter: blur(4px);
          }

          .property-image-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.9);
            border: none;
            color: #FF6B35;
            font-size: 28px;
            font-weight: 700;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3;
            opacity: 0;
          }

          .property-card-img-wrapper:hover .property-image-btn {
            opacity: 1;
          }

          .property-image-btn-prev {
            left: 12px;
          }

          .property-image-btn-next {
            right: 12px;
          }

          .property-image-btn:hover {
            background: rgba(255, 107, 53, 1);
            color: white;
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
          }

          .property-image-dots {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 3;
          }

          .image-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.7);
          }

          .image-dot:hover {
            background: rgba(255, 255, 255, 0.8);
            transform: scale(1.2);
          }

          .image-dot.active {
            background: #FF6B35;
            border-color: #FF6B35;
            transform: scale(1.3);
          }

          .property-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: linear-gradient(135deg, #FF6B35 0%, #F7911D 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 3;
            animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .property-card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
            position: relative;
            z-index: 2;
          }

          .property-type-text {
            font-size: 14px;
            font-weight: 600;
            color: #FF6B35;
            margin: 0 0 8px 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .property-location {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 15px;
            color: #424242;
            font-weight: 500;
          }

          .property-location svg {
            flex-shrink: 0;
          }

          .property-price-section {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-bottom: 14px;
            animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .property-price {
            font-size: 24px;
            font-weight: 700;
            color: #FF6B35;
          }

          .property-price-label {
            font-size: 12px;
            color: #888;
            font-weight: 600;
          }

          .property-specs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 14px;
            border-bottom: 1px solid rgba(200, 195, 188, 0.2);
          }

          .spec-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #5e5e5e;
            font-weight: 500;
          }

          .spec-item svg {
            flex-shrink: 0;
            color: #63CCE4;
          }

          .property-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            gap: 8px;
          }

          .property-agent {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #5e5e5e;
          }

          .property-agent svg {
            flex-shrink: 0;
            color: #63CCE4;
          }

          .property-date {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #888;
            font-weight: 500;
          }

          .property-date img {
            filter: brightness(0.7);
          }

          .view-details-btn {
            width: 100%;
            padding: 14px 16px;
            background: linear-gradient(135deg, #FF6B35 0%, #F7911D 100%);
            color: #FFFFFF;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.25);
          }

          .view-details-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.2);
            transition: left 0.5s ease;
          }

          .view-details-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.35);
          }

          .view-details-btn:hover::before {
            left: 100%;
          }

          .carousel-controls {
            position: absolute;
            top: 30px;
            right: 20px;
            display: flex;
            gap: 16px;
            z-index: 10;
          }

          .carousel-btn {
            width: 48px;
            height: 48px;
            border: none;
            background: #FFFFFF;
            color: #FF6B35;
            font-size: 18px;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
            border: 1.5px solid rgba(255, 107, 53, 0.1);
          }

          .carousel-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: linear-gradient(135deg, #FF6B35 0%, #F7911D 100%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.5s ease, height 0.5s ease;
            z-index: -1;
          }

          .carousel-btn:hover {
            color: white;
            transform: scale(1.1);
            box-shadow: 0 8px 20px rgba(255, 107, 53, 0.25);
            border-color: rgba(255, 107, 53, 0.3);
          }

          .carousel-btn:hover::before {
            width: 100px;
            height: 100px;
          }

          .carousel-btn:active {
            transform: scale(0.95);
          }

          .view-more-btn {
            position: absolute;
            bottom: 20px;
            right: 20px;
            padding: 14px 32px;
            background: linear-gradient(135deg, #FF6B35 0%, #F7911D 100%);
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
            z-index: 5;
          }

          .view-more-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .view-more-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 36px rgba(255, 107, 53, 0.4);
          }

          .view-more-btn:hover::before {
            width: 300px;
            height: 300px;
          }

          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }

          @media (max-width: 768px) {
            .newproperty-title {
              font-size: 24px;
            }

            .carousel-controls {
              top: 20px;
              right: 10px;
            }

            .carousel-btn {
              padding: 10px 16px;
              font-size: 12px;
            }

            .view-more-btn {
              padding: 12px 24px;
              font-size: 13px;
              bottom: 15px;
              right: 15px;
            }

            .property-card-img-wrapper {
              height: 220px;
            }

            .property-price {
              font-size: 20px;
            }
          }
        `}
      </style>

      <h3 className="newproperty-title">RECENT PROPERTY</h3>
      
      <div className="carousel-container">
        <Link to={'/login'} style={{textDecoration:"none"}} >
        
          <div
            className="carousel-track"
            ref={carouselRef}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property, index) => (
               
                <div
                  className="property-card-wrapper col-lg-4 col-md-6 col-sm-12"
                  key={property._id}
                >
                  <div className="property-card">
                    <div className="property-card-img-wrapper">
                      <img
                        src={getPropertyImage(property)}
                        alt={(
                          `${property.rentId || 'N/A'}-${property.propertyMode || 'N/A'}-${property.propertyType || 'N/A'}-rs-${property.price || '0'}-in-${property.city || ''}-${property.area || ''}-${property.state || ''}`
                        )
                          .replace(/\s+/g, "-")
                          .replace(/,+/g, "-")
                          .toLowerCase()
                        }
                        className="property-card-img"
                      />
                      <div className="property-badge">{property.propertyType || 'Property'}</div>
                      
                      {property.photos && property.photos.length > 1 && (
                        <>
                          <div className="property-image-counter">
                            {(propertyImageIndex[property._id] || 0) + 1} / {property.photos.length}
                          </div>
                          <button
                            className="property-image-btn property-image-btn-prev"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePropertyImagePrev(property._id, property.photos.length);
                            }}
                            title="Previous Image"
                          >
                            ‹
                          </button>
                          <button
                            className="property-image-btn property-image-btn-next"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePropertyImageNext(property._id, property.photos.length);
                            }}
                            title="Next Image"
                          >
                            ›
                          </button>
                          <div className="property-image-dots">
                            {property.photos.map((_, idx) => (
                              <div
                                key={idx}
                                className={`image-dot ${(propertyImageIndex[property._id] || 0) === idx ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPropertyImageIndex(prev => ({
                                    ...prev,
                                    [property._id]: idx
                                  }));
                                }}
                                title={`Image ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="property-card-body">
                      <div>
                        <p className="property-type-text">{property.propertyMode || "N/A"}</p>
                        
                        <div className="property-location">
                          <MdLocationOn size={16} />
                          <span>
                            {property.city
                              ? property.city.charAt(0).toUpperCase() + property.city.slice(1)
                              : 'N/A'} , {property.district
                              ? property.district.charAt(0).toUpperCase() + property.district.slice(1)
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="property-price-section">
                          <FaRupeeSign size={14} color="#FF6B35" />
                          <span className="property-price">
                            {property.price
                              ? formatPrice(property.price)
                              : 'N/A'}
                          </span>
                          <span className="property-price-label">/ month</span>
                        </div>

                        <div className="property-specs">
                          <div className="spec-item">
                            <FaRulerCombined size={14} />
                            <span>
                              {property.totalArea || 'N/A'} {property.areaUnit
                                ? property.areaUnit.charAt(0).toUpperCase() + property.areaUnit.slice(1)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="spec-item">
                            <FaBed size={14} />
                            <span>{property.bedrooms || "N/A"} BHK</span>
                          </div>
                        </div>

                        <div className="property-footer">
                          <div className="property-agent">
                            <FaUserAlt size={12} />
                            <span>{property.postedBy || "N/A"}</span>
                          </div>
                          <div className="property-date">
                            <img src={calendar} alt="" width={12} />
                            <span>
                              {property.updatedAt && property.updatedAt !== property.createdAt
                                ? new Date(property.updatedAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : new Date(property.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="view-details-btn"
                        onClick={() => {}}
                      >
                        VIEW DETAILS
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="m-0">No properties found.</p>
            )}
          </div>
        </Link>

        <div className="carousel-controls">
          <button
            onClick={prevSlide}
            className="carousel-btn"
            title="Previous"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            className="carousel-btn"
            title="Next"
          >
            →
          </button>
        </div>
      </div>

      <button onClick={handleClick} className="view-more-btn">
        VIEW MORE
      </button>
    </div>
    </>
  );
};

export default NewProperty;









