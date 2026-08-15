import React from 'react';
import { Button, Form } from 'react-bootstrap';

const AddProperty = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="shadow p-4 rounded bg-white" style={{ maxWidth: '500px' }}>
        <h3 className="mb-4" style={{ color: '#45a29e', fontWeight: 'bold' }}>Add Property</h3>

        {/* Property Form */}
        <Form>
          <Form.Group className="mb-3" controlId="propertyName">
            <Form.Control type="text" placeholder="Property Name" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="propertyDescription">
            <Form.Control as="textarea" rows={3} placeholder="Property Description" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="propertyPrice">
            <Form.Control type="number" placeholder="Price" required />
          </Form.Group>

          {/* Submit Button */}
          <Button variant="primary" type="submit" style={{ background: '#45a29e', border: 'none' }} className="w-100">
            Add Property
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default AddProperty;












