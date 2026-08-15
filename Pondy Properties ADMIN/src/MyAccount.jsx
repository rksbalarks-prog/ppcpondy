

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from "react-redux";
import moment from "moment";

const MyAccount = () => {
  const [phonenumber, setPhonenumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phonenumber) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // Option 1: Store in localStorage and redirect (works if same domain)
      localStorage.setItem('ppc_phone', `${phonenumber}`);
      

      
 
      window.open(
        `https://ppcpondy.com/mobileviews?phone=${encodeURIComponent(phonenumber)}`,
        '_blank' // This opens in a new tab
      );

    } catch (error) {
      alert('Failed to process your request');
    } finally {
      setIsLoading(false);
    }
  };


  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "MyAccount"; // current file
   
   // Sync Redux to localStorage
   useEffect(() => {
     if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
     if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
   }, [reduxAdminName, reduxAdminRole]);
   
   // Record dashboard view
   useEffect(() => {
     const recordDashboardView = async () => {
       try {
         await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
           userName: adminName,
           role: adminRole,
           viewedFile: fileName,
           viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
         });
       } catch (err) {
       }
     };
   
     if (adminName && adminRole) {
       recordDashboardView();
     }
   }, [adminName, adminRole]);
   
  
  
   // Fetch role-based permissions
   useEffect(() => {
     const fetchPermissions = async () => {
       try {
         const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
         const rolePermissions = res.data.find((perm) => perm.role === adminRole);
         const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
         setAllowedRoles(viewed);
       } catch (err) {
       } finally {
         setLoading(false);
       }
     };
   
     if (adminRole) {
       fetchPermissions();
     }
   }, [adminRole]);
   
  
   if (loading) return <p>Loading...</p>;
  
   if (!allowedRoles.includes(fileName)) {
     return (
       <div className="text-center text-red-500 font-semibold text-lg mt-10">
         Only admin is allowed to view this file.
       </div>
     );
   }




  return (
    <Container className="mt-5 justify-content-start">
      <h4 className="text-start">Enter Customer Phone Number</h4>
      <Row className="justify-content-start">
        <Col xs={12} md={8}>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="phonenumber">
              <Form.Label>Number:</Form.Label>
              <Form.Control
                type="tel"
                value={phonenumber}
                onChange={(e) => setPhonenumber(e.target.value)}
                placeholder="Enter 10-digit phone number"
                pattern="[0-9]{10}"
                required
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default MyAccount;