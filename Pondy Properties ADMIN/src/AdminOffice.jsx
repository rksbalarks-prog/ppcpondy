









import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Table, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaBuilding, FaAddressCard, FaPhone, FaMobileAlt } from 'react-icons/fa';
import moment from 'moment';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AdminOffice = () => {
  const [offices, setOffices] = useState([
    { id: 1, name: 'AUROBINDO', address: '89, Aurobindo St', landline: '04132222244', mobile: '8111022255' },
    { id: 2, name: 'SAINT', address: '64 Saint Therese Street', landline: '04132334455', mobile: '7448811322' }
  ]);

  const [form, setForm] = useState({ name: '', address: '', landline: '', mobile: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Admin Office",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);

  const handleCreate = (e) => {
    e.preventDefault();
    const newOffice = {
      id: offices.length + 1,
      ...form
    };
    setOffices([...offices, newOffice]);
    setForm({ name: '', address: '', landline: '', mobile: '' });
  };

  return (
    <Container className="mt-4">
      <h1 className="text-center text-danger">Office</h1>

      
          <h2 className="text-success">Create Office</h2>
          <Form onSubmit={handleCreate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Office Name</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaBuilding /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter office name"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaAddressCard /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter address"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Land Line</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaPhone /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="landline"
                      value={form.landline}
                      onChange={handleChange}
                      placeholder="Enter landline"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaMobileAlt /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Button style={{background:"#E91E63", color:"#fff", border:'none'}} type="submit">
              Create
            </Button>
          </Form>
      

              <h2 className="text-danger mt-3">Office Details</h2>
          <div className="mb-3">
            <Button variant="link">Export All to Excel</Button>
            <Button variant="link">Print All to Print</Button>
          </div>
          <Table striped bordered hover responsive className="table-sm align-middle">
                        <thead className="sticky-top">
              <tr>
                <th>Sl</th>
                <th>Office Name</th>
                <th>Address</th>
                <th>Landline</th>
                <th>Mobile</th>
                <th>Edit / Delete</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((office, index) => (
                <tr key={office.id}>
                  <td>{index + 1}</td>
                  <td>{office.name}</td>
                  <td>{office.address}</td>
                  <td>{office.landline}</td>
                  <td>{office.mobile}</td>
                  <td>
                    <Button variant="link">✏️</Button>
                    <Button variant="link">🗑️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        
    </Container>
  );
};

export default AdminOffice;
