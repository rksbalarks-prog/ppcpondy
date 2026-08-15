import React, { useState, useEffect, useRef } from "react";
import { FaRulerCombined, FaBed, FaUserAlt, FaCalendarAlt, FaRupeeSign } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import NewProperty from "./NewProperty";
import axios from "axios";
import FeatureProperty from "./FeatureProperty";
import pic from '../Assets/Mask Group 3.png'; // Correct path

const Carousel = () => {
  const navigate = useNavigate();
  const [Properties, setProperties] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [propertyImageIndex, setPropertyImageIndex] = useState({});
  const carouselRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Fetch Featured Properties with auto-refresh
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-featured-properties`);
        if (response.status === 200 && response.data.properties) {
          // Sort by most recent first (by createdAt or updatedAt)
          const sortedProperties = response.data.properties.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt);
            const dateB = new Date(b.updatedAt || b.createdAt);
            return dateB - dateA;
          });
          
          // Remove duplicates - keep only latest version of each property
          const uniqueProperties = [];
          const seenIds = new Set();
          
          sortedProperties.forEach(property => {
            if (!seenIds.has(property._id)) {
              uniqueProperties.push(property);
              seenIds.add(property._id);
            }
          });
          
          setProperties(uniqueProperties);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    
    fetchFeaturedProperties();
    
    // Auto-refresh every 30 seconds to get latest updates
    const refreshInterval = setInterval(fetchFeaturedProperties, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Navigate function
  const handleClick = () => {
    navigate("/login");
  };

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-featured-properties`);
      if (response.status === 200 && response.data.properties) {
        // Sort by most recent first
        const sortedProperties = response.data.properties.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });
        
        // Remove duplicates - keep only latest version
        const uniqueProperties = [];
        const seenIds = new Set();
        
        sortedProperties.forEach(property => {
          if (!seenIds.has(property._id)) {
            uniqueProperties.push(property);
            seenIds.add(property._id);
          }
        });
        
        setProperties(uniqueProperties);
      }
    } catch (error) {
      console.error('Error refreshing properties:', error);
    }
  };

  // Function to go to the next slide
  const nextSlide = () => {
    setIsAnimating(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % Properties.length);
    setTimeout(() => setIsAnimating(true), 3000);
  };

  // Function to go to the previous slide
  const prevSlide = () => {
    setIsAnimating(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + Properties.length) % Properties.length);
    setTimeout(() => setIsAnimating(true), 3000);
  };

  // Handle property image navigation
  const handlePrevImage = (propertyId, totalPhotos) => {
    if (totalPhotos <= 1) return;
    const currentImageIdx = propertyImageIndex[propertyId] || 0;
    setPropertyImageIndex({
      ...propertyImageIndex,
      [propertyId]: (currentImageIdx - 1 + totalPhotos) % totalPhotos
    });
  };

  const handleNextImage = (propertyId, totalPhotos) => {
    if (totalPhotos <= 1) return;
    const currentImageIdx = propertyImageIndex[propertyId] || 0;
    setPropertyImageIndex({
      ...propertyImageIndex,
      [propertyId]: (currentImageIdx + 1) % totalPhotos
    });
  };

  const getPropertyImage = (property) => {
    if (!property.photos || property.photos.length === 0) {
      return pic;
    }
    const imgIdx = propertyImageIndex[property._id] || 0;
    return `https://ppcpondy.com/PPC/${property.photos[imgIdx].replace(/\\/g, "/").replace(/^\/+/, "")}`;
  };

  // Auto-play image slideshow automatically
  useEffect(() => {
    const propertyIds = Properties.map(p => p._id);
    
    propertyIds.forEach(propertyId => {
      const property = Properties.find(p => p._id === propertyId);
      if (property && property.photos && property.photos.length > 1) {
        const interval = setInterval(() => {
          setPropertyImageIndex(prev => {
            const currentIdx = prev[propertyId] || 0;
            return {
              ...prev,
              [propertyId]: (currentIdx + 1) % property.photos.length
            };
          });
        }, 4000); // Change image every 4 seconds

        return () => clearInterval(interval);
      }
    });
  }, [Properties]);

  // Handle Animation
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.style.animation = isAnimating ? "scroll 20s linear infinite" : "none";
    }
  }, [isAnimating]);

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        * {
          font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .carousel-section {
          background: linear-gradient(135deg, #f8fafb 0%, #f3f4f6 100%);
          padding: 56px 24px;
          border-radius: 0px;
          animation: fadeInDown 0.8s ease-out;
        }
        
        .carousel-header {
          animation: fadeInDown 0.8s ease-out;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .carousel-title-group {
          flex: 1;
        }
        
        .refresh-button {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          border: none;
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          margin-left: 16px;
        }
        
        .refresh-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
        }
        
        .refresh-button:active {
          transform: translateY(0);
        }
        
        .refresh-button.rotating {
          animation: spin 0.6s linear;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .carousel-title {
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -1px;
          line-height: 1.2;
        }
        
        .carousel-subtitle {
          font-size: 15px;
          color: #64748b;
          margin-top: 8px;
          font-weight: 500;
        }
        
        .property-card {
          border-radius: 16px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.35s cubic-bezier(0.35, 0, 0.25, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
          animation: slideInUp 0.6s ease-out backwards;
        }
        
        .property-card:nth-child(1) { animation-delay: 0.1s; }
        .property-card:nth-child(2) { animation-delay: 0.2s; }
        .property-card:nth-child(3) { animation-delay: 0.3s; }
        
        .property-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
          border-color: rgba(37, 99, 235, 0.1);
        }
        
        .property-img-container {
          position: relative;
          overflow: hidden;
          height: 280px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        
        .property-img-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.6s cubic-bezier(0.35, 0, 0.25, 1);
        }
        
        .property-card:hover .property-img-container img {
          transform: scale(1.06);
        }
        
        .image-nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.85);
          border: none;
          color: #0f172a;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          z-index: 5;
          transition: all 0.3s ease;
          opacity: 0;
        }
        
        .image-nav-button:hover {
          background: rgba(37, 99, 235, 0.9);
          color: white;
          transform: translateY(-50%) scale(1.1);
        }
        
        .property-img-container:hover .image-nav-button {
          opacity: 1;
        }
        
        .image-nav-prev {
          left: 12px;
        }
        
        .image-nav-next {
          right: 12px;
        }
        
        .image-indicators {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 4;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .property-img-container:hover .image-indicators {
          opacity: 1;
        }
        
        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid white;
        }
        
        .indicator-dot.active {
          background: #2563eb;
          transform: scale(1.3);
          animation: pulse-indicator 1s infinite;
        }
        
        @keyframes pulse-indicator {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3);
          }
        }
        
        .indicator-dot:hover {
          background: rgba(255, 255, 255, 0.9);
        }
        
        .property-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: white;
          color: #2563eb;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.35s ease;
        }
        
        .property-card:hover .property-badge {
          opacity: 1;
          transform: translateX(0);
        }
        
        .property-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .property-header {
          margin-bottom: 16px;
        }
        
        .property-type {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }
        
        .property-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 12px 0;
          line-height: 1.4;
          transition: color 0.3s ease;
        }
        
        .property-card:hover .property-title {
          color: #2563eb;
        }
        
        .property-location {
          display: flex;
          align-items: center;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          gap: 6px;
          margin-bottom: 16px;
        }
        
        .location-icon {
          color: #2563eb;
          font-size: 16px;
        }
        
        .property-price {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        
        .property-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .property-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .property-feature:hover {
          color: #2563eb;
          transform: translateX(3px);
        }
        
        .feature-icon {
          font-size: 18px;
          color: #2563eb;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        
        .property-feature:hover .feature-icon {
          transform: scale(1.15);
        }
        
        .view-details-btn {
          width: 100% !important;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important;
          color: white !important;
          border: none !important;
          padding: 14px 20px !important;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.35, 0, 0.25, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
        }
        
        .view-details-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
          z-index: 1;
        }
        
        .view-details-btn:hover::before {
          left: 100%;
        }
        
        .view-details-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
        }
        
        .view-details-btn:active {
          transform: translateY(0);
        }
        
        .carousel-controls {
          position: absolute;
          top: 32px;
          right: 24px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }
        
        .nav-button {
          width: 44px;
          height: 44px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          font-size: 18px;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.35, 0, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        .nav-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
        }
        
        .nav-button:active {
          transform: translateY(0);
        }
        
        .view-more-section {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 32px;
          padding-right: 8px;
        }
        
        .view-more-btn {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important;
          color: white !important;
          border: none !important;
          padding: 14px 32px !important;
          border-radius: 10px !important;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.35, 0, 0.25, 1);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2) !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        .view-more-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
          z-index: 0;
        }
        
        .view-more-btn:hover::before {
          left: 100%;
        }
        
        .view-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3) !important;
        }
        
        .view-more-btn:active {
          transform: translateY(0);
        }
        
        .carousel-track {
          transition: transform 0.6s cubic-bezier(0.35, 0, 0.25, 1) !important;
        }
      `}</style>
      
      <div className="carousel-section">
        <div className="carousel-header">
          <div className="carousel-title-group">
            <h2 className="carousel-title">Featured Properties</h2>
            <p className="carousel-subtitle">Discover our carefully selected premium listings</p>
          </div>
          <button
            className="refresh-button"
            onClick={handleRefresh}
            title="Refresh to see latest properties"
          >
            🔄
          </button>
        </div>
        <div style={{ 
          overflow: "hidden", 
          width: "100%", 
          position: "relative", 
          fontFamily: "Inter, sans-serif"
        }}>
          <Link to={"/login"} style={{ textDecoration: "none" }}>
            <div
              className="carousel-track p-0"
              ref={carouselRef}
              style={{
                display: "flex",
                flexWrap: "nowrap",
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {Properties.length > 0 ? (
                Properties.map((property) => (
                  <div 
                    className="col-lg-4 col-md-6 col-sm-12 mb-4" 
                    key={property._id} 
                    style={{ 
                      flex: "0 0 auto", 
                      marginRight: "20px",
                      paddingLeft: "0"
                    }}
                  >
                    <div className="property-card">
                      <div className="property-img-container">
                        <img
                          src={getPropertyImage(property)}
                          alt="Property"
                        />
                        
                        {property.photos && property.photos.length > 1 && (
                          <>
                            <button
                              className="image-nav-button image-nav-prev"
                              onClick={() => handlePrevImage(property._id, property.photos.length)}
                              title="Previous image"
                            >
                              ‹
                            </button>
                            <button
                              className="image-nav-button image-nav-next"
                              onClick={() => handleNextImage(property._id, property.photos.length)}
                              title="Next image"
                            >
                              ›
                            </button>
                            
                            <div className="image-indicators">
                              {property.photos.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`indicator-dot ${(propertyImageIndex[property._id] || 0) === idx ? 'active' : ''}`}
                                  onClick={() => setPropertyImageIndex({
                                    ...propertyImageIndex,
                                    [property._id]: idx
                                  })}
                                  title={`Image ${idx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        
                        <div className="property-badge">FEATURED</div>
                      </div>
                      
                      <div className="property-content">
                        <div>
                          <div className="property-type">{property.propertyMode || "N/A"}</div>
                          <h3 className="property-title">Premium Property</h3>
                          
                          <div className="property-location">
                            <span className="location-icon">📍</span>
                            <span>
                              {property.city
                                ? property.city.charAt(0).toUpperCase() + property.city.slice(1)
                                : 'N/A'} , {property.district
                                ? property.district.charAt(0).toUpperCase() + property.district.slice(1)
                                : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="property-price">
                            ₹{property.price ? property.price.toLocaleString('en-IN') : 'N/A'}
                          </div>
                          
                          <div className="property-features">
                            <div className="property-feature">
                              <FaRulerCombined className="feature-icon" />
                              <span>{property.totalArea || 'N/A'} {property.areaUnit
                                ? property.areaUnit.charAt(0).toUpperCase() + property.areaUnit.slice(1)
                                : 'N/A'}</span>
                            </div>
                            
                            <div className="property-feature">
                              <FaBed className="feature-icon" /> 
                              <span>{property.bedrooms || "N/A"} Beds</span>
                            </div>
                            
                            <div className="property-feature">
                              <FaUserAlt className="feature-icon" />
                              <span>{property.postedBy
                                ? property.postedBy.charAt(0).toUpperCase() + property.postedBy.slice(1)
                                : 'N/A'}</span>
                            </div>
                            
                            <div className="property-feature">
                              <FaCalendarAlt className="feature-icon" />
                              <span>{property.createdAt ? new Date(property.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          className="btn view-details-btn"
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

          {/* Navigation Controls */}
          <div className="carousel-controls">
            <button 
              onClick={prevSlide} 
              className="nav-button"
              title="Previous"
            >
              ←
            </button>
            <button 
              onClick={nextSlide} 
              className="nav-button"
              title="Next"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="view-more-section">
          <button 
            onClick={handleClick}
            className="view-more-btn"
          >
            VIEW ALL PROPERTIES
          </button>
        </div>
      </div>
      <NewProperty />
    </>
  );
};

export default Carousel;







