// Import necessary React and Bootstrap modules
import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { GiCheckMark } from "react-icons/gi";
import { Helmet } from 'react-helmet';

import './tables.css'
const OTPFormWithAbout = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = (e) => {
    e.preventDefault();
    // Simulate OTP sending logic here
    if (phoneNumber) {
      setIsOtpSent(true);
      alert('OTP sent to ' + phoneNumber);
    }
  };
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Demoo",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    // Simulate OTP verification logic here
    alert(`OTP "${otp}" verified for ${phoneNumber}`);
  };

  return (
    <Container fluid className='p-0' >
       <Helmet>
       <title>Pondy Property | Buy or Sell your Property without Brokerage in Pondicherry.</title>
             </Helmet>
         <header className="header d-flex align-items-center">
      <nav className="nav">
        <h1 className="nav-title" style={{fontWeight:'bold'}}>My Website</h1>
      </nav>
    </header>
      <Row className="g-0">
        {/* Left Column - Login Form  */}
        <Col lg={8} className="d-flex align-items-center justify-content-center userlogin">
          <div className="shadow p-4 rounded w-100 bg-white" style={{ maxWidth: '400px' ,border:'1px solid grey' }}>
            <h5 className="text-start mb-4" style={{color:'#45a29e', fontWeight:'bold'}}>Login</h5>
            {!isOtpSent ? (
              <Form onSubmit={handleSendOtp}>
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Control
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter Mobile No."
                    className='loginput'
                    required
                  />
                </Form.Group>
     
                <Button style={{background:'#45a29e', border:'none'}} type="submit" className="w-100 mb-3">
                  Send OTP
                </Button>
              
              </Form>
            ) : (
              <Form onSubmit={handleVerifyOtp}>
                <Form.Group className="mb-3" controlId="otp">
                  <Form.Control
                  className='loginput'
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    required
                  />
                </Form.Group>
                <Button style={{background:'#45a29e', border:'none'}} type="submit" className="w-100">
                  Verify OTP
                </Button>
              </Form>
            )}
          </div>
        </Col>

        {/* Right Column - About Section */}
        <Col lg={4} className="d-flex align-items-center text-white p-5 userloginabout">
          <div>
            <h2 className="mb-4">Things you Can Do with Our Account</h2>
            <ul className="list-unstyled">
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/> Post one Single Property for FREE</li>
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/>
              Set property alerts for your requirement</li>
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/> Get accessed by over 1 Lakh buyers</li>
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/> Showcase your property as Rental, PG or for Sale</li>
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/> Get instant queries over Phone</li>
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/> Performance in search & Track responses & views online</li>
              <li className="mb-2"><GiCheckMark style={{marginRight:'5px'}}/> Add detailed property information & multiple photos per listing</li>
            </ul>
          </div>
        </Col>
       
      </Row>
    </Container>
  );
};

export default OTPFormWithAbout;
