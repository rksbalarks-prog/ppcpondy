

import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Card, Row, Col, Button, Form, Container, Nav } from 'react-bootstrap';

const App = () => {
  const [category, setCategory] = useState('student');
  const [filters, setFilters] = useState({ name: '', phone: '', email: '' });
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "New",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  // Sample data for students, placements, and testimonials
  const students = [
    {
      photo: '', // Add actual photo URLs
      name: 'Den',
      email: 'den@example.com',
      phone: '758694641',
      location: 'Pondy, Country',
      education: 'Bachelor of Science in Computer Science',
      passout: '2020',
      courseDetail: 'Full-Stack Web Development',
      experience: 'Internships and projects',
      skills: 'React, Node.js, JavaScript, HTML, CSS',
      portfolio: 'https://portfolio.example.com',
    },
  ];

  const placements = [
    {
      photo: '', // Add actual photo URLs
      name: 'John Doe',
      company: 'ABC Corp',
      position: 'Software Engineer',
      date: '2023-08-30',
    },
  ];

  const testimonials = [
    {
      photo: '', // Add actual photo URLs
      name: 'John Doe',
      message: 'Great working experience!',
      starRating: '5 stars',
      professional: 'Software Developer',
    },
    {
        photo: '', // Add actual photo URLs
        name: 'John Doe',
        message: 'Great working experience!',
        starRating: '5 stars',
        professional: 'Software Developer',
      },
  ];

  // Filter students based on input fields
  const filteredStudents = students.filter((student) => {
    return (
      student.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      student.phone.includes(filters.phone) &&
      student.email.toLowerCase().includes(filters.email.toLowerCase())
    );
  });

  const renderStudents = () =>
    filteredStudents.map((student, index) => (
      <Card className="mb-3 w-100" key={index} style={{ boxShadow: '7px 5px 21px -9px rgba(0,0,0,0.6)', padding: '5px' }}>
        <Row className="g-0 align-items-center">
          <Col md={3} className="d-flex justify-content-center">
            <Card.Img 
              variant="left" 
              src={student.photo || 'https://via.placeholder.com/150'} 
              alt={student.name} 
              style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }} 
            />
          </Col>
          <Col md={7} className="d-flex flex-column justify-content-center">
            <Card.Body>
              <Card.Title>{student.name}</Card.Title>
              <Row>
            <Col md={4}>
              <strong>Email:</strong> {student.email}<br />
              <strong>Phone:</strong> {student.phone}<br />
              <strong>Location:</strong> {student.location}<br />
            </Col>
            <Col md={4}>
              <strong>Education:</strong> {student.education}<br />
              <strong>Passout:</strong> {student.passout}<br />
              <strong>Course Details:</strong> {student.courseDetail}<br />
            </Col>
            <Col md={4}>
              <strong>Experience:</strong> {student.experience}<br />
              <strong>Position:</strong> {student.position}<br />
              <strong>Portfolio:</strong> <a href={student.portfolio} target="_blank" rel="noopener noreferrer">View Portfolio</a><br />
            </Col>
          </Row>
            </Card.Body>
          </Col>
          <Col md={2} className="d-flex align-items-center justify-content-center">
            <Button variant="primary">Download</Button>
          </Col>
        </Row>
      </Card>
    ));

  const renderPlacements = () =>
    placements.map((placement, index) => (
        <Card className="d-flex flex-row align-items-center p-3 mb-3" style={{ boxShadow: '7px 5px 21px -9px rgba(0,0,0,0.6)', padding: '5px' }}>
        <Card.Img
          variant="left"
          src={placement.photo}
          style={{ width: '50px', height: '50px', marginRight: '15px' }}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Title>{placement.name}</Card.Title>
          <Card.Text className="d-flex flex-wrap align-items-center">
            <span className="me-3"><strong>Industry:</strong> {placement.company}</span>
            <span className="me-3"><strong>Position:</strong> {placement.position}</span>
            <span className="me-3"><strong>Join Date:</strong> {placement.date}</span>
          </Card.Text>
        </Card.Body>
        <div className="ms-auto d-flex align-items-center">
          <Button variant="primary" className="me-3">Aprove</Button>
        </div>
      </Card>
    ));

  const renderTestimonials = () =>
    testimonials.map((testimonial, index) => (
        <Card className="d-flex flex-row align-items-center p-3 mb-3" style={{ boxShadow: '7px 5px 21px -9px rgba(0,0,0,0.6)', padding: '5px' }}>
        <Card.Img
          variant="left"
          src={testimonial.photo}
          style={{ width: '50px', height: '50px', marginRight: '15px' }}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Title>{testimonial.name}</Card.Title>
          <Card.Text className="d-flex flex-wrap align-items-center">
          <span className="me-3"><strong>Professional:</strong> {testimonial.professional}</span>
            <span className="me-3"><strong>Message:</strong> {testimonial.message}</span>
            <span className="me-3"><strong>Star Rating:</strong> {testimonial.starRating}</span>
          </Card.Text>
        </Card.Body>
        <div className="ms-auto d-flex align-items-center">
          <Button variant="primary" className="me-3">Aprove</Button>
        </div>
      </Card>
    ));

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container>
      <h2>Admin</h2>
      <div className="d-flex justify-content-center w-100 mb-3">
        <Nav variant="tabs" activeKey={category} onSelect={(selectedKey) => setCategory(selectedKey)} className="justify-content-center">
          <Nav.Item>
            <Nav.Link eventKey="student">Student</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="placement">Placement</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="testimonials">Testimonials</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {category === 'student' && (
        <Form className="mt-3 mb-4">
          <Row>
            <Col>
              <Form.Control
                type="text"
                placeholder="Name"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </Col>
            <Col>
              <Form.Control
                type="text"
                placeholder="Phone"
                name="phone"
                value={filters.phone}
                onChange={handleFilterChange}
              />
            </Col>
            <Col>
              <Form.Control
                type="email"
                placeholder="Email"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
              />
            </Col>
          </Row>
        </Form>
      )}

      <div className="mt-4">
        {category === 'student' && renderStudents()}
        {category === 'placement' && renderPlacements()}
        {category === 'testimonials' && renderTestimonials()}
      </div>
    </Container>
  );
};

export default App;
