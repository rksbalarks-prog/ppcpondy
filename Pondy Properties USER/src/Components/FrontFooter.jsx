

import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import pondypropertyApp from '../Assets/pondypropertyApp.png'
import rentpondylogo from '../Assets/rentpondylogo.png'
import tamilmatrim from '../Assets/TamilMatrim.png'
import tamilusedcards from '../Assets/tamilUsedcards.png'
import pondymat from '../Assets/PondyMat.png'
import pondyjob from '../Assets/pondyJob.png'
import bikesapplogo from '../Assets/bikesApplogo.png'
import facebook from '../Assets/facebook_5968764.png'
import insta from '../Assets/instagram_2111463.png'
import youtube from '../Assets/youtubee.png'

export default function FrontFooter() {
  const [hoveredLink, setHoveredLink] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredLink(index);
  };

  const handleMouseLeave = () => {
    setHoveredLink(null);
  };

  const linkStyle = {
    textDecoration: "none",
    color: "#BDBDBD",
    position: "relative",
    display: "inline-block",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "16px",
    fontWeight: "500",
    letterSpacing: "0.3px",
  };

  const hoverEffectStyle = (index) => ({
    color: hoveredLink === index ? "#FF6B35" : "#BDBDBD",
    textShadow: hoveredLink === index ? "0 0 8px rgba(255, 107, 53, 0.3)" : "none",
  });

  const sectionTitleStyle = {
    fontSize: "18px",
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: "14px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };

  const dividerStyle = {
    borderBottom: "2px solid",
    borderImage: "linear-gradient(90deg, #FF6B35 0%, #F7911D 100%) 1",
    width: "40px",
    marginBottom: "16px",
  };

  const socialIconStyle = {
    width: "48px",
    height: "48px",
    marginRight: "16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    borderRadius: "10px",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const appIconStyle = {
    width: "36px",
    height: "36px",
    marginRight: "12px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    borderRadius: "8px",
    padding: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const styles = `
    .footer {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%) !important;
      border-top: 1px solid rgba(255, 107, 53, 0.15);
      position: relative;
      overflow: hidden;
      padding: 15px 0 !important;
    }

    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, #FF6B35, transparent);
    }

    .footer-card-container {
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.02) 0%, rgba(247, 145, 29, 0.02) 100%);
      border: 1px solid rgba(255, 107, 53, 0.1);
      border-radius: 12px;
      padding: 35px 25px;
      margin: 0 auto;
      max-width: 100%;
      margin-left: 15px;
      margin-right: 15px;
      text-align: center;
    }

    .footer-section {
      margin-bottom: 0;
      padding: 0 15px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .footer-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .footer-list li {
      margin-bottom: 12px;
      animation: slideInLeft 0.6s ease-out forwards;
    }

    .footer-list li:nth-child(1) { animation-delay: 0.1s; }
    .footer-list li:nth-child(2) { animation-delay: 0.2s; }
    .footer-list li:nth-child(3) { animation-delay: 0.3s; }
    .footer-list li:nth-child(4) { animation-delay: 0.4s; }
    .footer-list li:nth-child(5) { animation-delay: 0.5s; }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-15px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .footer-link-item:hover {
      padding-left: 8px;
    }

    .social-icons-container {
      display: flex;
      gap: 12px;
      margin-top: 14px;
      flex-wrap: wrap;
      animation: fadeIn 0.8s ease-out;
      justify-content: center;
    }

    .social-icon-wrapper {
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .social-icon-wrapper:hover {
      transform: translateY(-6px) scale(1.1);
    }

    .social-icon-wrapper:hover img {
      filter: brightness(1) !important;
      box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
    }

    .app-icons-container {
      display: flex;
      gap: 12px;
      margin-top: 14px;
      flex-wrap: wrap;
      animation: fadeIn 0.8s ease-out 0.2s backwards;
      justify-content: center;
    }

    .app-icon-wrapper {
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .app-icon-wrapper:hover {
      transform: translateY(-4px) scale(1.08);
    }

    .app-icons-row {
      margin-bottom: 0;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .footer-divider {
      border: none;
      border-top: 1px solid rgba(255, 107, 53, 0.1);
      margin: 24px 0 0 0;
    }

    .footer-copyright {
      background: linear-gradient(90deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 145, 29, 0.05) 100%);
      border: 1px solid rgba(255, 107, 53, 0.1);
      border-radius: 8px;
      padding: 14px !important;
      margin-top: 24px;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      color: #888;
      letter-spacing: 0.3px;
      transition: all 0.3s ease;
    }

    .footer-copyright:hover {
      background: linear-gradient(90deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 145, 29, 0.1) 100%);
      border-color: rgba(255, 107, 53, 0.2);
      color: #D0D0D0;
    }

    .footer-section h5 {
      position: relative;
      display: inline-block;
    }

    .footer-section h5::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, #FF6B35, #F7911D);
    }

    @media (max-width: 1024px) {
      .footer-card-container {
        padding: 28px 20px;
        margin-left: 12px;
        margin-right: 12px;
      }

      .footer-section {
        padding: 0 10px;
      }
    }

    @media (max-width: 768px) {
      .footer-section {
        margin-bottom: 18px;
        padding: 0 8px;
      }

      .footer-card-container {
        padding: 22px 15px;
        margin-left: 10px;
        margin-right: 10px;
      }

      .social-icons-container,
      .app-icons-container {
        justify-content: flex-start;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <footer className="footer text-white py-5">
        <div className="footer-card-container">
          <Container fluid className='p-0'>
            <Row>
              {/* Column 1: About Us */}
              <Col lg={3} md={6} sm={12} className="footer-section">
                <h5 style={sectionTitleStyle}>About Us</h5>
                <div style={dividerStyle}></div>
                <ul className="footer-list">
                  <li className="footer-link-item">
                    <Link
                      to="/about"
                      style={{ ...linkStyle, ...hoverEffectStyle(0) }}
                      onMouseEnter={() => handleMouseEnter(0)}
                      onMouseLeave={handleMouseLeave}
                    >
                      About us
                    </Link>
                  </li>
                  <li className="footer-link-item">
                    <Link
                      to="/terms-conditions-web"
                      style={{ ...linkStyle, ...hoverEffectStyle(4) }}
                      onMouseEnter={() => handleMouseEnter(4)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Terms & Conditions
                    </Link>
                  </li>
                  <li className="footer-link-item">
                    <Link
                      to="/privacy-web"
                      style={{ ...linkStyle, ...hoverEffectStyle(1) }}
                      onMouseEnter={() => handleMouseEnter(1)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li className="footer-link-item">
                    <Link
                      to="/shiping-delivery"
                      style={{ ...linkStyle, ...hoverEffectStyle(2) }}
                      onMouseEnter={() => handleMouseEnter(2)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Shipping & Delivery
                    </Link>
                  </li>
                  <li className="footer-link-item">
                    <Link
                      to="/refund-policy"
                      style={{ ...linkStyle, ...hoverEffectStyle(7) }}
                      onMouseEnter={() => handleMouseEnter(7)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </Col>

              {/* Column 2: How to Sell Fast */}
              <Col lg={3} md={6} sm={12} className="footer-section">
                <h5 style={sectionTitleStyle}>How to Sell Fast</h5>
                <div style={dividerStyle}></div>
                <ul className="footer-list">
                  <li className="footer-link-item">
                    <Link
                      to="/Pricing-Plan"
                      style={{ ...linkStyle, ...hoverEffectStyle(6) }}
                      onMouseEnter={() => handleMouseEnter(6)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Price Plan
                    </Link>
                  </li>
                </ul>
              </Col>

              {/* Column 3: Help & Support */}
              <Col lg={3} md={6} sm={12} className="footer-section">
                <h5 style={sectionTitleStyle}>Help & Support</h5>
                <div style={dividerStyle}></div>
                <ul className="footer-list">
                  <li className="footer-link-item">
                    <Link
                      to={'/Frequently-Asked-Questions'}
                      style={{ ...linkStyle, ...hoverEffectStyle(5) }}
                      onMouseEnter={() => handleMouseEnter(5)}
                      onMouseLeave={handleMouseLeave}
                    >
                      FAQ
                    </Link>
                  </li>
                  <li className="footer-link-item">
                    <Link
                      to={'/contact-web'}
                      style={{ ...linkStyle, ...hoverEffectStyle(3) }}
                      onMouseEnter={() => handleMouseEnter(3)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Contact us
                    </Link>
                  </li>
                  <li className="footer-link-item" style={{ cursor: "pointer" }}>
                    <span style={{ ...linkStyle, ...hoverEffectStyle(8) }}
                      onMouseEnter={() => handleMouseEnter(8)}
                      onMouseLeave={handleMouseLeave}
                    >
                      Delete My Account
                    </span>
                  </li>
                </ul>
              </Col>

              {/* Column 4: Follow Us On */}
              <Col lg={3} md={6} sm={12} className="footer-section">
                <h5 style={sectionTitleStyle}>Follow Us On</h5>
                <div style={dividerStyle}></div>
                <div className="social-icons-container">
                  <div className="social-icon-wrapper">
                    <a href="https://www.facebook.com/pondyproperty" target="_blank" rel="noopener noreferrer" title="Facebook">
                      <img src={facebook} alt="Facebook" style={{ ...socialIconStyle, filter: "brightness(0.8)" }} />
                    </a>
                  </div>
                  <div className="social-icon-wrapper">
                    <a href="https://www.instagram.com/pondy_property?igsh=MWZyMTJvbnhlOWhncg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" title="Instagram">
                      <img src={insta} alt="Instagram" style={{ ...socialIconStyle, filter: "brightness(0.8)" }} />
                    </a>
                  </div>
                  <div className="social-icon-wrapper">
                    <a href="https://www.youtube.com/@pondyclassifieds15" target="_blank" rel="noopener noreferrer" title="YouTube">
                      <img src={youtube} alt="YouTube" style={{ ...socialIconStyle, filter: "brightness(0.8)" }} />
                    </a>
                  </div>
                </div>

                <h5 style={{ ...sectionTitleStyle, marginTop: "24px" }}>Our Apps</h5>
                <div className="app-icons-container">
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.apps.ppcpondy" target="_blank" rel="noopener noreferrer" title="Pondy Property App">
                      <img src={pondypropertyApp} alt="Pondy Property" style={appIconStyle} />
                    </a>
                  </div>
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.apps.rentpondy" target="_blank" rel="noopener noreferrer" title="Rent Pondy App">
                      <img src={rentpondylogo} alt="Rent Pondy" style={appIconStyle} />
                    </a>
                  </div>
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.thulirsolutions.tamilnadumatrimony" target="_blank" rel="noopener noreferrer" title="Tamil Matrimony App">
                      <img src={tamilmatrim} alt="Tamil Matrimony" style={appIconStyle} />
                    </a>
                  </div>
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.apps.tamilnaduusedcars" target="_blank" rel="noopener noreferrer" title="Tamil Used Cars App">
                      <img src={tamilusedcards} alt="Tamil Used Cars" style={appIconStyle} />
                    </a>
                  </div>
                </div>

                <div className="app-icons-container app-icons-row">
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.thulirsolutions.pondicherrymatrimony" target="_blank" rel="noopener noreferrer" title="Pondy Matrimony App">
                      <img src={pondymat} alt="Pondy Matrimony" style={appIconStyle} />
                    </a>
                  </div>
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.apps.pondyjob" target="_blank" rel="noopener noreferrer" title="Pondy Job App">
                      <img src={pondyjob} alt="Pondy Job" style={appIconStyle} />
                    </a>
                  </div>
                  <div className="app-icon-wrapper">
                    <a href="https://play.google.com/store/apps/details?id=com.apps.pondybikes" target="_blank" rel="noopener noreferrer" title="Pondy Bikes App">
                      <img src={bikesapplogo} alt="Pondy Bikes" style={appIconStyle} />
                    </a>
                  </div>
                </div>
              </Col>
            </Row>

            <hr className="footer-divider" />

            <p className="footer-copyright">
              © 2026 All rights reserved. | Designed & Developed with ❤️ | Privacy & Security First
            </p>
          </Container>
        </div>
      </footer>
    </>
  );
}
















