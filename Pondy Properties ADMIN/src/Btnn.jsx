import React, { useState } from 'react';
import { Card, Row, Col, Button, Form, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


const StudentCard = ({ student }) => (
  <Container fluid className=" p-3">
   
     <Card className="mb-3">
      <Row className="g-0">
        <Col md={2}>
          <Card.Img variant="left" src={student.photo || 'https://via.placeholder.com/150'} alt={student.name} />
        </Col>
        <Col md={10}>
          <Card.Body>
            <Card.Title>{student.name}</Card.Title>
            <Row>
              <Col>
                <strong>Education:</strong> {student.education} ({student.passout}) <br />
                <strong>Course Detail:</strong> {student.courseDetail}
              </Col>
              <Col>
                <strong>Email:</strong> {student.email} <br />
                <strong>Phone:</strong> {student.phone}
              </Col>
              <Col>
                <strong>Location:</strong> {student.location} <br />
                <strong>Experience:</strong> {student.experience}
              </Col>
            </Row>
            <Row className="mt-2">
              <Col>
                <strong>Skills:</strong> {student.skills} <br />
                <strong>Portfolio:</strong> <a href={student.portfolio} target="_blank" rel="noopener noreferrer">{student.portfolio}</a>
              </Col>
            </Row>

            <Button variant="primary" className="mt-3">Download</Button>
          </Card.Body>
        </Col>
      </Row>
    </Card>
  </Container>
);

const PlacementCard = ({ placement }) => (
  <Container fluid className="p-3">

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
  </Container>

);

const TestimonialCard = ({ testimonial }) => (
  <Container fluid className="p-3">
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
  </Container>

);

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState('student');
  const [filter, setFilter] = useState({ name: '', phone: '', email: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilter) => ({
      ...prevFilter,
      [name]: value,
    }));
  };

  const categories = {
    student: 'Students',
    placement: 'Placements',
    testimonial: 'Testimonials',
  };

  // Profile data
  const [students] = useState([
    {
      photo: 'https://clipground.com/images/student-png-5.png',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      location: 'City, Country',
      education: 'Bachelor of Science in Computer Science',
      passout: '2020',
      courseDetail: 'Full-Stack Web Development',
      experience: '2 years',
      position: 'Software Engineer',
      portfolio: 'https://portfolio.example.com'
    },
    {
      photo: '',
      name: 'Den',
      email: 'den@example.com',
      phone: '758694641',
      location: 'Pondy, Country',
      education: 'Bachelor of Science in Computer Science',
      passout: '2020',
      courseDetail: 'Full-Stack Web Development',
      experience: '2 years',
      position: 'Software Engineer',
      portfolio: 'https://portfolio.example.com'
    }
  ]);

  // Placement data
  const [placements] = useState([
    {
      photo: '',
      name: 'John Doe',
      company: 'ABC Corp',
      position: 'Software Engineer',
      date: '2023-08-30'
    },
    {
      photo: '',
      name: 'Jane Smith',
      company: 'XYZ Ltd',
      position: 'Data Analyst',
      date: '2023-07-15'
    }
  ]);

  // Testimonial data
  const [testimonials] = useState([
    {
      photo: '',
      name: 'John Doe',
      message: 'Great working experience!',
      starRating: '5 stars',
      professional: 'Software Developer'
    },
    {
      photo: '',
      name: 'Jane Smith',
      message: 'Amazing environment to grow.',
      starRating: '4 stars',
      professional: 'Data Analyst'
    }
  ]);

  const filteredStudents = students.filter((student) => {
    return (
      student.name.toLowerCase().includes(filter.name.toLowerCase()) &&
      student.phone.includes(filter.phone) &&
      student.email.toLowerCase().includes(filter.email.toLowerCase())
    );
  });

  const renderContent = () => {
    switch (selectedCategory) {
      case 'student':
        return filteredStudents.map((student, index) => (
          <StudentCard key={index} student={student} />
        ));
      case 'placement':
        return placements.map((placement, index) => (
          <PlacementCard key={index} placement={placement} />
        ));
      case 'testimonial':
        return testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} testimonial={testimonial} />
        ));
      default:
        return null;
    }
  };

  const renderFilterInputs = () => {
    if (selectedCategory === 'student') {
      return (
        <Row className="mb-4">
          <Col>
            <Form.Group controlId="filterName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter name"
                value={filter.name}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="filterPhone">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                placeholder="Enter phone"
                value={filter.phone}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="filterEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter email"
                value={filter.email}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
        </Row>
      );
    }
    return null;
  };

   // Inline styles
   const categoriesStyle = {
    display: 'flex',
  justifyContent: 'center',  
  alignItems: 'center',      
  gap: '10px',              
    marginBottom: '20px',
  };

  const spanStyle = {
    margin: '0 10px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const activeSpanStyle = {
    ...spanStyle, 
    borderBottom: '2px solid blue', 
  };

  return (
    <>

   {/* <Topbar /> */}

    <div style={{marginTop:'90px', background:'white'}}>
         <div className="mb-3 mt-5" style={categoriesStyle}>
        {Object.keys(categories).map((key) => (
          <span
            key={key}
            onClick={() => setSelectedCategory(key)}
            style={selectedCategory === key ? activeSpanStyle : spanStyle}
          >
            {categories[key]}
          </span>
        ))}
      </div>
      {renderFilterInputs()}
      {renderContent()}
    </div>
    {/* <Footer/> */}
    </>
  );
};

export default App;