

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import { FaUser, FaLock, FaBuilding, FaPhone, FaIdCard, FaTachometerAlt, FaHome, FaTag } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AdminUpdate = () => {
  // State for form fields
  const [updateName, setUpdateName] = useState('');
  const [updatePassword, setUpdatePassword] = useState('');
  const [updateRole, setUpdateRole] = useState('');
  const [updateAddress, setUpdateAddress] = useState('');
  const [updateOffice, setUpdateOffice] = useState('');
  const [updateJobType, setUpdateJobType] = useState('');
  const [updateUserName, setUpdateUserName] = useState('');
  const [updateTargetWeek, setUpdateTargetWeek] = useState('');
  const [updateTargetMonth, setUpdateTargetMonth] = useState('');
  const [updateMobile, setUpdateMobile] = useState('');
  const [updateAadhaarNumber, setUpdateAadhaarNumber] = useState('');

  
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Admin Update",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
  
  // State to toggle fields visibility
  const [isEditing, setIsEditing] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Handle form submission (without API)
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission (log the data or show success message)
    setTimeout(() => {
      toast.success('Admin updated successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <Container fluid className="p-0">
      <Row className="g-0 mt-5">
        <Col lg={12} className="d-flex align-items-center justify-content-center ms-5">
          <div className="shadow p-4 rounded w-100 bg-white" style={{ maxWidth: '700px' }}>
            <h2 style={{ color: '#45a29e', fontWeight: 'bold' }}>Admin Update</h2>

            {/* Display success or error message */}
            <ToastContainer />

            {/* Name Field and Edit Button */}
            {!isEditing ? (
              <div>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaUser /></span>
                    <Form.Control
                      type="text"
                      placeholder="Enter Admin Name"
                      value={updateName}
                      onChange={(e) => setUpdateName(e.target.value)}
                      required
                      style={{ height: '50px' }} 
                    />
                  </div>
                </Form.Group>
                <Button variant="warning" onClick={() => setIsEditing(true)} className="w-25 mt-3">
                  Edit
                </Button>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                {/* Two Columns Layout */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="updatePassword">
                      <Form.Label>Password</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaLock /></span>
                        <Form.Control
                          type="password"
                          placeholder="Enter Admin Password"
                          value={updatePassword}
                          onChange={(e) => setUpdatePassword(e.target.value)}
                          required
                          style={{ height: '50px' }} 
                        />
                      </div>
                    </Form.Group>

                    <Form.Group controlId="updateRole">
                      <Form.Label>Role</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaBuilding /></span>
                        <Form.Control
                          as="select"
                          value={updateRole}
                          onChange={(e) => setUpdateRole(e.target.value)}
                          required
                          style={{ height: '50px' }} 
                        >
                          <option value="">Select Role</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="accountant">Accountant</option>
                        </Form.Control>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3 mt-3">
                  <Form.Label>UserName</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaUser /></span>
                    <Form.Control
                      type="text"
                      placeholder="Enter Admin Name"
                      value={updateUserName}
                      onChange={(e) => setUpdateUserName(e.target.value)}
                      required
                      style={{ height: '50px' }} 
                    />
                  </div>
                </Form.Group>

                    <Form.Group className="mb-3 mt-3" controlId="updateAddress">
                      <Form.Label>Address</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaHome /></span>
                        <Form.Control
                          type="text"
                          placeholder="Enter Address"
                          value={updateAddress}
                          onChange={(e) => setUpdateAddress(e.target.value)}
                          style={{ height: '50px' }} 
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="updateTargetWeek">
                      <Form.Label>Target Week</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaTachometerAlt /></span>
                        <Form.Control
                          type="text"
                          placeholder="Enter Target Week"
                          value={updateTargetWeek}
                          onChange={(e) => setUpdateTargetWeek(e.target.value)}
                          style={{ height: '50px' }} 
                        />
                      </div>
                    </Form.Group>

                  </Col>

                  <Col md={6}>
                   

             

                    <Form.Group className="mb-3" controlId="office">
        <Form.Label>Office</Form.Label>
        <Form.Control
          as="select"
          name="office"
          value={updateOffice}
          onChange={(e) => setUpdateOffice(e.target.value)}
          style={{ height: '50px' }}  // Increased height
        >
          <option value="">Select Office</option>
          <option value="AUROBINDO">AUROBINDO</option>
          <option value="SAINT">SAINT</option>
        </Form.Control>
      </Form.Group>

      <Form.Group className="mb-3" controlId="jobType">
        <Form.Label>Job Type</Form.Label>
        <Form.Control
          as="select"
          name="jobType"
          value={updateJobType}
          onChange={(e) => setUpdateJobType(e.target.value)}
          style={{ height: '50px' }}  // Increased height
        >
          <option value="">Select Job Type</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </Form.Control>
      </Form.Group>

                    <Form.Group className="mb-3" controlId="updateTargetMonth">
                      <Form.Label>Target Month</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaTachometerAlt /></span>
                        <Form.Control
                          type="text"
                          placeholder="Enter Target Month"
                          value={updateTargetMonth}
                          onChange={(e) => setUpdateTargetMonth(e.target.value)}
                          style={{ height: '50px' }} 
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="updateMobile">
                      <Form.Label>Mobile</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaPhone /></span>
                        <Form.Control
                          type="text"
                          placeholder="Enter Mobile Number"
                          value={updateMobile}
                          onChange={(e) => setUpdateMobile(e.target.value)}
                          style={{ height: '50px' }} 
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="updateAadhaarNumber">
                      <Form.Label>Aadhaar Number</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaIdCard /></span>
                        <Form.Control
                          type="text"
                          placeholder="Enter Aadhaar Number"
                          value={updateAadhaarNumber}
                          onChange={(e) => setUpdateAadhaarNumber(e.target.value)}
                          style={{ height: '50px' }} 
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="warning" type="submit" className="w-25 mt-4" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Admin'}
                </Button>
              </Form>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminUpdate;











