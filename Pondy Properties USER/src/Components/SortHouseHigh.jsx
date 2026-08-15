import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HouseBelow30L = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-houses-below-30l`);
        setProperties(res.data.data || []);
      } catch (err) {
        // console.error("Failed to fetch house properties:", err);
      }
    };

    fetchHouses();
  }, []);

  const formatPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(2)} L`;
    return price.toLocaleString("en-IN");
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Houses Below ₹30 Lakhs</h3>
      {properties.length === 0 ? (
        <p>No matching properties found.</p>
      ) : (
        properties.map((property) => (
          <div key={property._id} style={{
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: 15,
            marginBottom: 15,
            background: "#f9f9f9"
          }}>
            <h4 style={{ color: "#007bff" }}>{property.propertyType} - ₹{formatPrice(property.price)}</h4>
            <p>{property.area}, {property.city}, {property.state}</p>
            <p>BHK: {property.bedrooms || 'N/A'} | Size: {property.totalArea} {property.areaUnit}</p>
            <p>Status: {property.status}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default HouseBelow30L;
