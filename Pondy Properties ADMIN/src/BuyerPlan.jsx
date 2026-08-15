import axios from "axios";
import moment from "moment";
import React, { useEffect } from "react";
import { Form, Button, Table, Container, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";

const BuyerPlan = () => {

  
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "BuyerPlan",
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
      <h2 className="text-success mt-3">Create Buyer Assistant Plan</h2>
      <Form className="mb-4 p-3">
        <Row className="g-3">
          <Col md={6}>
            <Form.Group className="mt-3">
              <Form.Label style={{color:"rgb(47,116,127)"}}>Plan Name</Form.Label>
              <Form.Control type="text" placeholder="Plan Name" />
            </Form.Group>
          
            <Form.Group className="mt-3">
              <Form.Label style={{color:"rgb(47,116,127)"}}>Plan Amount</Form.Label>
              <Form.Control type="text" placeholder="Plan Amount" />
            </Form.Group>
         
            <Form.Group className="mt-3">
              <Form.Label style={{color:"rgb(47,116,127)"}}>Plan Validity</Form.Label>
              <Form.Control type="text" placeholder="Plan Validity" />
            </Form.Group>
            </Col>
            <Col md={6}>
            <Form.Group className="mt-3">
              <Form.Label style={{color:"rgb(47,116,127)"}}>No of Assistant</Form.Label>
              <Form.Control type="text" placeholder="No of Assistant" />
            </Form.Group>
         
            <Form.Group className="mt-3">
              <Form.Label style={{color:"rgb(47,116,127)"}}>Service Type</Form.Label>
              <Form.Control type="text" placeholder="Service Type" />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <Button variant="warning" className="me-2">
              Update Plan
            </Button>
            <Button variant="primary">Create Plan</Button>
          </Col>
        </Row>
      </Form>

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
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>SI</th>
            <th>Plan Name</th>
            <th>Plan Amount</th>
            <th>Plan Validity</th>
            <th>No Of Assistant</th>
            <th>Create Date</th>
            <th>Edit / Delete</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>FREE</td>
            <td>0</td>
            <td>60 Days</td>
            <td>1</td>
            <td>2022-01-21 19:24:36</td>
            <td>
                    <Button variant="link">✏️</Button>
                    <Button variant="link">🗑️</Button>
                  </td>
            <td>
              <Button variant="danger" size="sm">
                Hide
              </Button>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td>BASIC</td>
            <td>199</td>
            <td>90 Days</td>
            <td>5</td>
            <td>2022-02-02 18:37:57</td>
            <td>
                    <Button variant="link">✏️</Button>
                    <Button variant="link">🗑️</Button>
                  </td>
            <td>
              <Button variant="danger" size="sm">
                Hide
              </Button>
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td>ADVANCE</td>
            <td>399</td>
            <td>90 Days</td>
            <td>10</td>
            <td>2022-02-02 18:38:11</td>
            <td>
                    <Button variant="link">✏️</Button>
                    <Button variant="link">🗑️</Button>
                  </td>
            <td>
              <Button variant="danger" size="sm">
                Hide
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    
    </Container>
  );
};

export default BuyerPlan;
