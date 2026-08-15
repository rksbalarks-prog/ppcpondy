import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SortBankLoan = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchBankLoanProperties = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-bankloan-properties`);
        setProperties(res.data.data || []);
      } catch (err) {
        console.error("Error fetching bank loan properties:", err);
      }
    };

    fetchBankLoanProperties();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <h3>Bank Loan Eligible Properties</h3>
      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        properties.map((property) => (
          <div key={property._id} style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '15px'
          }}>
            <h4>{property.propertyType} - ₹{property.price}</h4>
            <p>{property.city}, {property.area}, {property.nagar}</p>
            <p>Status: {property.status}</p>
            <p>Bank Loan: {property.bankLoan}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default SortBankLoan;
