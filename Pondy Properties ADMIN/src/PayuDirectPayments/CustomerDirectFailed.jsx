import React from 'react';
import CustomerDirectTable from './CustomerDirectTable';

// Failed direct customer payments (floating "Pay Now" custom-amount, failed).
const CustomerDirectFailed = () => (
  <CustomerDirectTable
    endpoint="/payu-direct/failed"
    heading="Customer Direct PayU — Failed"
    statusColor="#dc2626"
  />
);

export default CustomerDirectFailed;
