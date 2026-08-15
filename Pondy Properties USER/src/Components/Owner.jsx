



import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import NoData from "../Assets/OOOPS-No-Data-Found.png";

const Owner = () => {
  const { ppcId } = useLocation().state || {}; // Get ppcId from the route state
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Property Data
  const fetchPropertyData = async () => {
    if (!ppcId) {
      setError('PPC ID is required.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-property-data?ppcId=${ppcId}`);
      setPropertyData(response.data.propertyData);
    } catch (err) {
      // setError('Failed to fetch property data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ppcId) {
      fetchPropertyData();
    }
  }, [ppcId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-4 p-4">
      <h3>Property Data for PPC ID: {ppcId}</h3>

      {propertyData ? (
        <div>
          <h4>Owner Information</h4>
          <p><strong>Owner Phone Number:</strong> {propertyData.ownerPhoneNumber}</p>

          <h4>Requests and Reports</h4>
          <ul>
            <li><strong>Interest Requests:</strong> {propertyData.interestRequests.length}</li>
            <li><strong>Help Requests:</strong> {propertyData.helpRequests.length}</li>
            <li><strong>Report Property Requests:</strong> {propertyData.reportPropertyRequests.length}</li>
            <li><strong>Sold Out Reports:</strong> {propertyData.soldOutReports.length}</li>
            <li><strong>Contact Requests:</strong> {propertyData.contactRequests.length}</li>
          </ul>

          <h4>Status</h4>
          <p><strong>Property Status:</strong> {propertyData.status}</p>
        </div>
      ) : (
             <div className="text-center my-4 "
                        style={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                  
                        }}>
                <img src={NoData} alt="" width={100}/>      
                <p>No data available for this property.</p>
                </div> 
      )}
    </div>
  );
};

export default Owner;
