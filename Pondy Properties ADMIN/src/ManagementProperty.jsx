
import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Card, Row, Col, Button, Container, Form } from "react-bootstrap";
import { FaBed, FaBath, FaRulerCombined } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const properties = [
  {
    id: 1,
    title: "Boston Ave",
    address: "23 Boston Ave, Medford, MA, 02155, US",
    type: "SINGLE-FAMILY",
    status: "OCCUPIED",
    balance: "$13,500.00",
    balanceColor: "text-danger",
    image: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    title: "Boylston Street",
    address: "883-885 Boylston Street, Boston, MA, 02116, US",
    type: "4 UNITS",
    status: "3 OCCUPIED, 1 VACANT",
    balance: "$57,150.00",
    balanceColor: "text-danger",
    image: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    title: "Panorama Tower, Miami Downtown",
    address: "2310 NW Overlook Dr, Hermiston, OR, 97838, US",
    type: "SINGLE-FAMILY",
    status: "OCCUPIED",
    balance: "$11,480.00",
    balanceColor: "text-danger",
    image: "https://via.placeholder.com/150",
  },
  {
    id: 4,
    title: "Philly 900",
    address: "900 Market Street, Philadelphia, PA, 19107, US",
    type: "SINGLE-FAMILY",
    status: "VACANT",
    balance: "$0.00",
    balanceColor: "text-success",
    image: "https://via.placeholder.com/150",
  },
];

const ManagementProperty = () => {
  const [filters, setFilters] = useState({ number: "", address: "" });
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Management Property ",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.id.toString().includes(filters.number) &&
      property.address.toLowerCase().includes(filters.address.toLowerCase())
  );

  return (
    <Container fluid className="py-4">
      <Form className="mb-4">
        <Row className="g-3">
          <Col xs={12} md={6} lg={4}>
            <Form.Group controlId="filterNumber">
              <Form.Label>Filter by Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter property number"
                name="number"
                value={filters.number}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
          <Col xs={12} md={6} lg={8}>
            <Form.Group controlId="filterAddress">
              <Form.Label>Filter by Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter property address"
                name="address"
                value={filters.address}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
      <Row xs={1} sm={1} md={2} lg={2} className="g-4">
        {filteredProperties.map((property) => (
          <Col key={property.id}>
            <Card className="mb-4 shadow-sm h-100">
              <Card.Body className="d-flex flex-column">
                <Row>
                  <Col xs={12} md={4} className="d-flex">
                    <Card.Img
                      src={property.image}
                      alt={property.title}
                      className="w-100 object-fit-cover"
                    />
                  </Col>
                  <Col xs={12} md={8} className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center">
                      <Card.Title>{property.title}</Card.Title>
                      <span className={`fw-bold ${property.balanceColor}`}>{property.balance}</span>
                    </div>
                    <Card.Text className="text-muted mb-2">{property.address}</Card.Text>
                    <Card.Text className="fw-bold mb-2">{property.type}</Card.Text>
                    <Card.Text className="text-success fw-bold mb-2">{property.status}</Card.Text>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <div className="d-flex justify-content-around">
                      <Button
                        variant="light"
                        className="text-primary d-flex align-items-center"
                      >
                        <FaBed className="me-2" /> Bedrooms
                      </Button>
                      <Button
                        variant="light"
                        className="text-primary d-flex align-items-center"
                      >
                        <FaBath className="me-2" /> Bathrooms
                      </Button>
                      <Button
                        variant="light"
                        className="text-primary d-flex align-items-center"
                      >
                        <FaRulerCombined className="me-2" /> Area
                      </Button>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col className="d-flex justify-content-between">
                    <Button variant="link" className="text-decoration-none text-primary">
                      View &gt;
                    </Button>
                    <Button variant="warning" className="text-white">
                      Edit
                    </Button>
                    <Button variant="danger" className="text-white">
                      Delete
                    </Button>
                    <Button variant="success" className="text-white">
                      Update
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ManagementProperty;
