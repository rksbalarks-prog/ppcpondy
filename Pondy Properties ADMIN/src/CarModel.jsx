import React from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Dropdown } from 'react-bootstrap';

const CarModel = () => {
  return (
    <Container fluid>
      <Row>
        <Col className="p-4">
          <h1>Car Model</h1>
          <Card className="mb-4">
            <Card.Body>
              <Form>
                <Row className="align-items-end">
                  <Col md={4}>
                    <Form.Group controlId="carMake">
                      <Form.Label>Select Car Make</Form.Label>
                      <Form.Control as="select">
                        <option>Ashok Leyland</option>
                        <option>Audi</option>
                        {/* Add more car makes as needed */}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="carModel">
                      <Form.Label>Enter Car Model</Form.Label>
                      <Form.Control type="text" placeholder="Enter car model" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
    <Button className="me-2" style={{background:"#5F9EA0", color:"#fff", border:'none'}}>
            Update
          </Button>                              <Button style={{background:"#FF4081", color:"#fff", border:'none'}}>Create</Button>
          
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
    
           <p>
        <a href="#export">Export All to Excel</a> | <a href="#print">Print All to Print</a>
      </p>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Car Make</th>
                <th>Car Model</th>
                <th>Edit / Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Ashok Leyland</td>
                <td>slite</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Ashok Leyland</td>
                <td>others</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Audi</td>
                <td>A3</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Audi</td>
                <td>A4</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>5</td>
                <td>Audi</td>
                <td>A5</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>6</td>
                <td>Audi</td>
                <td>A6</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>7</td>
                <td>Audi</td>
                <td>A7</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>8</td>
                <td>Audi</td>
                <td>A8</td>
                <td>Edit / Delete</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default CarModel;
