import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";

const CarMake = () => {
  const [carMake, setCarMake] = useState("");

  

  const carMakes = [
    "Ashok Leyland",
    "Audi",
    "BMW",
    "Chevrolet",
    "Datsun",
    "Fiat",
    "Force Motors",
    "Ford",
    "Honda",
    "Hyundai",
    "Jaguar",
    "Jeep",
    "Kia",
    "Lamborghini",
    "Land Rover",
    "Mahindra",
    "Maruti Suzuki",
    "Mercedes-Benz",
    "MG",
    "Nissan",
    "Porsche",
    "Renault",
    "Skoda",
    "Tata Motors",
    "Tesla",
    "Toyota",
    "Volkswagen",
    "Volvo",
  ];

  return (
    <Container className="mt-5">
      <h1 className="text-center">Car Make</h1>

      <h3 className="text-success">Create Car Make</h3>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Car Make:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Car Make"
              value={carMake}
              onChange={(e) => setCarMake(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button className="me-2" style={{background:"#5F9EA0", color:"#fff", border:'none'}}>
            Update
          </Button>
          <Button className='btn' style={{background:"#E91E63", color:"#fff", border:'none'}}>Create</Button>
        </Col>
      </Row>

      <p>
        <a href="#export">Export All to Excel</a> | <a href="#print">Print All to Print</a>
      </p>

      <h4 className="text-danger">Car Makes</h4>
      <Table bordered hover>
        <thead>
          <tr>
            <th>Sl No</th>
            <th>Car Make</th>
            <th>Edit / Delete</th>
          </tr>
        </thead>
        <tbody>
          {carMakes.map((make, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{make}</td>
              <td>
                <Button variant="outline-primary" size="sm" className="me-2">
                  ✏️
                </Button>
                <Button variant="outline-danger" size="sm">
                  🗑️
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default CarMake;
