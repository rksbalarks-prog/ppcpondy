


import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap';

const PaymentManagement = () => {
              
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Payment Management",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  return (
    <Container fluid>
            
      <Row>
        <Col className="p-4">
          <h1 className='text-center mb-4' style={{color:"rgb(47,116,127)"}}>Payment</h1>
          <Card className="mb-4">
            <Card.Body>
              <Form>
                <Row className="align-items-end">
                  <Col md={4}>
                    <Form.Group controlId="paymentType">
                      <Form.Label>Payment Type</Form.Label>
                      <Form.Control type="text" placeholder="Enter payment type" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="createdDate">
                      <Form.Label>Created Date</Form.Label>
                      <Form.Control type="date" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button variant="primary" className="mr-2">Update</Button>
                    <Button variant="success" className='ms-3'>Create</Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
          {/* <Card className="mb-4"> */}
          <h2 className="text-danger mt-4">Plan Details</h2>
            <div className="mb-5">
        <Button variant="link" className="p-0 me-3 text-primary">
          Export All to Excel
        </Button>
        <Button variant="link" className="p-0 text-primary">
          Print All
        </Button>
      </div>
          {/* </Card> */}
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Sl</th>
                <th>Payment Type</th>
                <th>Create Date</th>
                <th>Edit / Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Free</td>
                <td>2021-03-28</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Cash</td>
                <td>2021-03-28</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Free</td>
                <td>2021-03-28</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Cash</td>
                <td>2021-03-28</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>5</td>
                <td>Free</td>
                <td>2021-03-28</td>
                <td>Edit / Delete</td>
              </tr>
              <tr>
                <td>6</td>
                <td>Cash</td>
                <td>2021-03-28</td>
                <td>Edit / Delete</td>
              </tr>
              {/* Add more rows as necessary */}
            </tbody>
          </Table>
        </Col>
      </Row>
      
    </Container>
  );
};

export default PaymentManagement;
