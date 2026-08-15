import React from 'react';
import CustomerDirectTable from './CustomerDirectTable';

// Paid direct customer payments (floating "Pay Now" custom-amount, succeeded).
const CustomerDirectPaid = () => (
  <CustomerDirectTable
    endpoint="/payu-direct/paid"
    heading="Customer Direct PayU — Paid"
    statusColor="#16a34a"
  />
);

export default CustomerDirectPaid;
