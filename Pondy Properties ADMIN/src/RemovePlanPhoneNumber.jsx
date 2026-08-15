import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Form, Alert } from 'react-bootstrap';

const RemovePlanPhoneNumber = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch unique plans
  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-plan`);
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setMessage({ type: 'danger', text: 'Failed to fetch plans' });
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle phone number removal
  const handleRemovePhone = async () => {
    if (!selectedPhone) {
      setMessage({ type: 'warning', text: 'Please enter a phone number' });
      return;
    }

    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/plans/remove-phone/${selectedPhone}`);
      setMessage({ type: 'success', text: res.data.message });
      setSelectedPhone('');
      fetchPlans(); // Refresh data
    } catch (error) {
      setMessage({
        type: 'danger',
        text:
          error.response?.data?.message ||
          'An error occurred while removing the phone number'
      });
    }
  };

  return (
    <div className="container mt-4">
      <h3>Pricing Plans</h3>

      {/* Alert messages */}
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ text: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      {/* Phone number input */}
      <Form className="mb-3 d-flex" onSubmit={(e) => e.preventDefault()}>
        <Form.Control
          type="text"
          placeholder="Enter phone number to remove"
          value={selectedPhone}
          onChange={(e) => setSelectedPhone(e.target.value)}
        />
        <Button className="ms-2" variant="danger" onClick={handleRemovePhone}>
          Remove Phone
        </Button>
      </Form>

      {/* Table of plans */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Features</th>
            <th>Phone Numbers</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, index) => (
            <tr key={index}>
              <td>{plan.name}</td>
              <td>{plan.price || '-'}</td>
              <td>
                {(plan.features || []).map((f, i) => (
                  <div key={i}>- {f}</div>
                ))}
              </td>
              <td>
                {(plan.phoneNumber || []).length > 0
                  ? plan.phoneNumber.join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default RemovePlanPhoneNumber;
