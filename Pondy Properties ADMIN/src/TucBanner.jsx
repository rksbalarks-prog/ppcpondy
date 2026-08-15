


import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const TucBanner = () => {
  const [tucId, setTucId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`TUC ID Entered: ${tucId}`);
  };
              
        
          const reduxAdminName = useSelector((state) => state.admin.name);
          const reduxAdminRole = useSelector((state) => state.admin.role);
          
          const adminName = reduxAdminName || localStorage.getItem("adminName");
          const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
          
          
           const [allowedRoles, setAllowedRoles] = useState([]);
               const [loading, setLoading] = useState(true);
           
           const fileName = "TUC Banner"; // current file
           
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
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <h1 className="text-center">TUC Banner Ad</h1>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="tucId">
              <Form.Label>Enter TUC ID:</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter TUC ID"
                value={tucId}
                onChange={(e) => setTucId(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              View
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default TucBanner;






