 

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GetAllPropertyStatics = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const phoneNumber = searchParams.get('phoneNumber');

  useEffect(() => {
    if (!phoneNumber) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/get-user-all-data?phoneNumber=${phoneNumber}`
        );
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [phoneNumber]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    [
      'interestData',
      'contactData',
      'favoriteData',
      'offerData',
      'photoRequestData',
      'viewedProperties',
      'calledList'
    ].forEach((key) => {
      const data = userData[key];
      if (data && data.length) {
        doc.text(key.replace(/([A-Z])/g, ' $1').toUpperCase(), 10, y);
        y += 5;

        const columns = Object.keys(data[0] || {}).map((k) => ({
          header: k,
          dataKey: k
        }));
        autoTable(doc, {
          startY: y,
          head: [columns.map((col) => col.header)],
          body: data.map((row) =>
            columns.map((col) => row[col.dataKey] ?? 'N/A')
          ),
          theme: 'grid',
          styles: { fontSize: 7 }
        });

        y = doc.lastAutoTable.finalY + 10;
      }
    });

    doc.save(`UserPropertyStats_${phoneNumber}.pdf`);
  };

  const renderTable = (title, data, columns) => (
    <div style={{ marginBottom: '2rem' }}>
      <h2>{title}</h2>
      {data && data.length > 0 ? (
        <table border="1" cellPadding="8" cellSpacing="0" width="100%">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.key.toLowerCase().includes('date') ||
                    col.key.toLowerCase().includes('at')
                      ? new Date(item[col.key]).toLocaleString()
                      : item[col.key] ?? 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No {title.toLowerCase()} data available.</p>
      )}
    </div>
  );

  if (loading) return <p>Loading user data...</p>;
  if (!userData) return <p>No data available for this user.</p>;

  const {
    interestData,
    contactData,
    favoriteData,
    offerData,
    photoRequestData,
    viewedProperties,
    calledList
  } = userData;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={exportToPDF} className="text-white bg-success">
          Download PDF
        </button>
      </div>

      {renderTable('Interest Requests', interestData, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'ownerPhone', label: 'Owner Phone' },
        { key: 'price', label: 'Price' },
        { key: 'area', label: 'Area' },
        { key: 'propertyMode', label: 'Property Mode' },
        { key: 'propertyType', label: 'Property Type' },
        { key: 'createdAt', label: 'Created At' }
      ])}

      {renderTable('Contact Requests', contactData, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'ownerPhone', label: 'Owner Phone' },
        { key: 'price', label: 'Price' },
        { key: 'area', label: 'Area' },
        { key: 'propertyMode', label: 'Property Mode' },
        { key: 'propertyType', label: 'Property Type' },
        { key: 'createdAt', label: 'Created At' }
      ])}

      {renderTable('Favorite Requests', favoriteData, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'ownerPhone', label: 'Owner Phone' },
        { key: 'price', label: 'Price' },
        { key: 'area', label: 'Area' },
        { key: 'propertyMode', label: 'Property Mode' },
        { key: 'propertyType', label: 'Property Type' },
        { key: 'createdAt', label: 'Created At' }
      ])}

      {renderTable('Offers', offerData, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'phoneNumber', label: 'User Phone' },
        { key: 'postedUserPhoneNumber', label: 'Owner Phone' },
        { key: 'originalPrice', label: 'Original Price' },
        { key: 'price', label: 'Offered Price' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created At' }
      ])}

      {renderTable('Photo Requests', photoRequestData, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'phoneNumber', label: 'User Phone' },
        { key: 'createdAt', label: 'Created At' }
      ])}

      {renderTable('Viewed Properties', viewedProperties, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'viewerPhoneNumber', label: 'Viewer Phone' },
        { key: 'propertyOwnerPhoneNumber', label: 'Owner Phone' },
        { key: 'viewedAt', label: 'Viewed At' }
      ])}

      {/* ✅ NEW Called List Table */}
      {renderTable('Called List', calledList, [
        { key: 'ppcId', label: 'PPC ID' },
        { key: 'userPhone', label: 'User Phone' },
        { key: 'postedUserPhone', label: 'Owner Phone' },
        { key: 'contactedAt', label: 'Contacted At' }
      ])}
    </div>
  );
};

export default GetAllPropertyStatics;
