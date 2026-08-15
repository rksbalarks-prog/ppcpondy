import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Form, Button, Table, Container, Row, Col, Card } from "react-bootstrap";

const PlanManagement = () => {

              
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Pan Management ",
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
    <Container>
      {/* Create Plan Section */}
      
      <h2 className="mt-3 mb-4" style={{color:"rgb(47,116,127)"}}>Create Plan</h2>
      <Card className="p-4">
      <Form className="mb-4">
        <Row className="g-3">
          <Col md={6}>
            <Form.Group  className="mt-3">
              <Form.Label  className="text-primary">Plan Name : </Form.Label>
              <Form.Control type="text" placeholder="Plan Name" />
            </Form.Group>
          {/* </Col> */}
          {/* <Col md={2}> */}
            <Form.Group  className="mt-3">
              <Form.Label className="text-primary">Plan Amount : </Form.Label>
              <Form.Control type="text" placeholder="Plan Amount" />
            </Form.Group>
          {/* </Col> */}
          
            <Form.Group  className="mt-3">
              <Form.Label className="text-primary">Plan Validity : </Form.Label>
              <Form.Control type="text" placeholder="Plan Validity" />
            </Form.Group>
          </Col>
          <Col md={6}>            
          <Form.Group  className="mt-3">
              <Form.Label className="text-primary">No of Cars : </Form.Label>
              <Form.Control type="text" placeholder="No of Cars" />
            </Form.Group>
          {/* </Col> */}
          {/* <Col md={2}> */}
            <Form.Group  className="mt-3">
              <Form.Label className="text-primary">Featured Validity : </Form.Label>
              <Form.Control type="text" placeholder="Featured Validity" />
            </Form.Group>
          {/* </Col> */}
          {/* <Col md={2}> */}
            <Form.Group className="mt-3">
              <Form.Label className="text-primary">Featured Max Car : </Form.Label>
              <Form.Control type="text" placeholder="Featured Max Car" />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <Button variant="warning" className="me-2">
              Update Plan
            </Button>
            <Button variant="success">Create Plan</Button>
          </Col>
        </Row>
      </Form>
      </Card>

      {/* Plan Details Section */}
      <h2 className="text-danger mt-4">Plan Details</h2>
      <div className="mb-3">
        <Button variant="link" className="p-0 me-3 text-primary">
          Export All to Excel
        </Button>
        <Button variant="link" className="p-0 text-primary">
          Print All
        </Button>
      </div>
       <Table striped bordered hover responsive className="table-sm align-middle">
                     <thead className="sticky-top">
          <tr>
            <th>SI</th>
            <th>Plan Name</th>
            <th>Plan Amount</th>
            <th>Plan Validity</th>
            <th>No Of Cars</th>
            <th>Featured Validity</th>
            <th>Featured Max Car</th>
            <th>Create Date</th>
            <th>Edit / Delete</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>BASIC</td>
            <td>499</td>
            <td>90</td>
            <td>1</td>
            <td>30</td>
            <td>1</td>
            <td>2022-04-08 14:33:56</td>
            <td>
              <Button variant="link" className="text-primary p-0">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="link" className="text-danger p-0 ms-2">
                <i className="bi bi-trash"></i>
              </Button>
            </td>
            <td>
              <Button variant="success" size="sm">
                Activate
              </Button>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>PLATINUM</td>
            <td>2999</td>
            <td>90</td>
            <td>200</td>
            <td>90</td>
            <td>30</td>
            <td>2021-03-26 10:08:49</td>
            <td>
              <Button variant="link" className="text-primary p-0">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="link" className="text-danger p-0 ms-2">
                <i className="bi bi-trash"></i>
              </Button>
            </td>
            <td>
              <Button variant="danger" size="sm">
                Hide
              </Button>
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td>BASIC</td>
            <td>499</td>
            <td>90</td>
            <td>1</td>
            <td>30</td>
            <td>1</td>
            <td>2022-04-08 14:33:56</td>
            <td>
              <Button variant="link" className="text-primary p-0">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="link" className="text-danger p-0 ms-2">
                <i className="bi bi-trash"></i>
              </Button>
            </td>
            <td>
              <Button variant="success" size="sm">
                Activate
              </Button>
            </td>
          </tr>
          <tr>
            <td>4</td>
            <td>PLATINUM</td>
            <td>2999</td>
            <td>90</td>
            <td>200</td>
            <td>90</td>
            <td>30</td>
            <td>2021-03-26 10:08:49</td>
            <td>
              <Button variant="link" className="text-primary p-0">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="link" className="text-danger p-0 ms-2">
                <i className="bi bi-trash"></i>
              </Button>
            </td>
            <td>
              <Button variant="danger" size="sm">
                Hide
              </Button>
            </td>
          </tr>
          <tr>
            <td>5</td>
            <td>BASIC</td>
            <td>499</td>
            <td>90</td>
            <td>1</td>
            <td>30</td>
            <td>1</td>
            <td>2022-04-08 14:33:56</td>
            <td>
              <Button variant="link" className="text-primary p-0">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="link" className="text-danger p-0 ms-2">
                <i className="bi bi-trash"></i>
              </Button>
            </td>
            <td>
              <Button variant="success" size="sm">
                Activate
              </Button>
            </td>
          </tr>
          <tr>
            <td>6</td>
            <td>PLATINUM</td>
            <td>2999</td>
            <td>90</td>
            <td>200</td>
            <td>90</td>
            <td>30</td>
            <td>2021-03-26 10:08:49</td>
            <td>
              <Button variant="link" className="text-primary p-0">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="link" className="text-danger p-0 ms-2">
                <i className="bi bi-trash"></i>
              </Button>
            </td>
            <td>
              <Button variant="danger" size="sm">
                Hide
              </Button>
            </td>
          </tr>
          {/* Add more rows as needed */}
        </tbody>
      </Table>
      
    </Container>
  );
};

export default PlanManagement;
