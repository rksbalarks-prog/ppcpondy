import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaPhoneAlt, FaEnvelope, FaHeadset } from "react-icons/fa";
import "./Support.css";

const Support = () => {
  return (
    <div className="support-page">
      <Container>

        {/* Heading */}
        <div className="support-header text-center">
          <FaHeadset size={40} className="mb-3 text-success" />
          <h2>Need Help?</h2>
          <p>
            Our support team is here to assist you with property search,
            listing, and account-related queries.
          </p>
        </div>

        {/* Contact Cards */}
        <Row className="mt-5 g-4">

          <Col md={4}>
            <Card className="support-card">
              <Card.Body>
                <FaPhoneAlt size={28} className="mb-3 text-success" />
                <h5>Call Us</h5>
                <p>+91 0413-2914409</p>
                <p>+91 9150524409</p>
                <Button variant="success" href="tel:+9104132914409">
                  Call Now
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="support-card">
              <Card.Body>
                <FaEnvelope size={28} className="mb-3 text-success" />
                <h5>Email Support</h5>
                <p>support@rentpondy.com</p>
                <Button variant="outline-success">
                  Send Email
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="support-card">
              <Card.Body>
                <FaHeadset size={28} className="mb-3 text-success" />
                <h5>Tenant Assistance</h5>
                <p>Help with rentals & agreements</p>
                <Button variant="success">
                  Get Assistance
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* FAQ Section */}
        <div className="faq-section mt-5">
          <h4 className="mb-3">Frequently Asked Questions</h4>

          <div className="faq-item">
            <h6>How do I list my property?</h6>
            <p>Click on "Add Property" and fill in your property details.</p>
          </div>

          <div className="faq-item">
            <h6>Is there any brokerage fee?</h6>
            <p>No brokerage. Direct owner listings available.</p>
          </div>

          <div className="faq-item">
            <h6>How can I contact the property owner?</h6>
            <p>Once logged in, you can view contact details.</p>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default Support;
