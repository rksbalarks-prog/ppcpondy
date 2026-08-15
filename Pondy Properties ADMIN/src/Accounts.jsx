

import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const TUCForm = () => {
  const [tucId, setTucId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`TUC ID Entered: ${tucId}`);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <h1 className="text-center">Enter Customer Phone Number
          </h1>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="tucId">
              <Form.Label>Number :</Form.Label>
              <Form.Control
                type="tel"
                value={tucId}
                onChange={(e) => setTucId(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              View
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default TUCForm;
