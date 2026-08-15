
import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { FaPhoneAlt, FaHeadset } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ppclogo from "../Assets/ppc logo.jpg";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className={`lux-navbar ${scrolled ? "lux-navbar-scrolled" : ""}`}
    >
      <Container fluid>
        {/* Brand */}
        <Navbar.Brand as={Link} to="/" className="lux-brand">
          <img src={ppclogo} alt="logo" className="lux-logo" />
          <span className="lux-brand-name">PONDY PROPERTY</span>
        </Navbar.Brand>

        <Navbar.Toggle />

        <Navbar.Collapse className="justify-content-end">
          <Nav className="lux-nav-links align-items-center">

            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/login">Properties</Nav.Link>
            <Nav.Link as={Link} to="/login">Search</Nav.Link>

            {/* Contact Dropdown */}
            <NavDropdown
              title={
                <span className="lux-contact">
                  <FaHeadset className="me-1" />
                  Contact
                </span>
              }
              id="contact-dropdown"
              className="lux-dropdown"
            >
              <NavDropdown.Item href="tel:+9104132914409">
                <FaPhoneAlt className="me-2 text-success" />
                +91 0413-2914409
              </NavDropdown.Item>

              <NavDropdown.Item href="tel:+919150524409">
                <FaPhoneAlt className="me-2 text-success" />
                +91 9150524409
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item as={Link} to="/support">
                Need Help?
              </NavDropdown.Item>
            </NavDropdown>

            <div className="lux-buttons">
              <Button
                className="lux-primary-btn"
                onClick={() => navigate("/login")}
              >
                Add Property
              </Button>

              <Button
                className="lux-outline-btn"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            </div>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;