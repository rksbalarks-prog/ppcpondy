 

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const GetAllBuyerStatics = () => {
  const [buyerData, setBuyerData] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const phoneNumber = searchParams.get('phoneNumber');

  useEffect(() => {
    if (!phoneNumber) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-by-phone/${phoneNumber}`);
        if (res.data.success) {
          setBuyerData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch buyer assistance:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phoneNumber]);

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Buyer Assistance for ${phoneNumber}`, 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [[
        'BA ID', 'Name', 'Property Type', 'Property Mode', 'Min Price', 'Max Price',
        'City', 'Area', 'Bedrooms', 'State', 'Status', 'Payment', 'Created At', 'Updated At'
      ]],
      body: buyerData.map(ba => ([
        ba.ba_id, ba.baName || 'N/A', ba.propertyType || 'N/A', ba.propertyMode || 'N/A',
        ba.minPrice || 'N/A', ba.maxPrice || 'N/A', ba.city || 'N/A', ba.area || 'N/A',
        ba.bedrooms || 'N/A', ba.state || 'N/A', ba.ba_status || 'N/A', ba.paymentType || 'N/A',
        new Date(ba.createdAt).toLocaleDateString('en-GB'),
        new Date(ba.updatedAt).toLocaleDateString('en-GB')
      ])),
    });
    doc.save(`BuyerAssistance-${phoneNumber}.pdf`);
  };

  // Download Excel
  const downloadExcel = () => {
    const worksheetData = buyerData.map(ba => ({
      'BA ID': ba.ba_id,
      Name: ba.baName || 'N/A',
      'Property Type': ba.propertyType || 'N/A',
      'Property Mode': ba.propertyMode || 'N/A',
      'Min Price': ba.minPrice || 'N/A',
      'Max Price': ba.maxPrice || 'N/A',
      City: ba.city || 'N/A',
      Area: ba.area || 'N/A',
      Bedrooms: ba.bedrooms || 'N/A',
      State: ba.state || 'N/A',
      Status: ba.ba_status || 'N/A',
      Payment: ba.paymentType || 'N/A',
      'Created At': new Date(ba.createdAt).toLocaleDateString('en-GB'),
      'Updated At': new Date(ba.updatedAt).toLocaleDateString('en-GB'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Buyer Assistance');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `BuyerAssistance-${phoneNumber}.xlsx`);
  };

  if (loading) return <p>Loading...</p>;
  if (!buyerData.length) return <p>No Buyer Assistance data found.</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Buyer Assistance for {phoneNumber}</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={downloadPDF}  className='text-white bg-primary' style={{ marginRight: '10px' }}>Download PDF</button>
        <button onClick={downloadExcel} className='text-white bg-success'>Download Excel</button>
      </div>

      <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>BA ID</th>
            <th>Name</th>
            <th>Property Type</th>
            <th>Property Mode</th>
            <th>Min Price</th>
            <th>Max Price</th>
            <th>City</th>
            <th>Area</th>
            <th>Bedrooms</th>
            <th>State</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody>
          {buyerData.map((ba) => (
            <tr key={ba._id}>
              <td>{ba.ba_id}</td>
              <td>{ba.baName || 'N/A'}</td>
              <td>{ba.propertyType || 'N/A'}</td>
              <td>{ba.propertyMode || 'N/A'}</td>
              <td>{ba.minPrice || 'N/A'}</td>
              <td>{ba.maxPrice || 'N/A'}</td>
              <td>{ba.city || 'N/A'}</td>
              <td>{ba.area || 'N/A'}</td>
              <td>{ba.bedrooms || 'N/A'}</td>
              <td>{ba.state || 'N/A'}</td>
              <td>{ba.ba_status || 'N/A'}</td>
              <td>{ba.paymentType || 'N/A'}</td>
              <td>{new Date(ba.createdAt).toLocaleDateString('en-GB')}</td>
              <td>{new Date(ba.updatedAt).toLocaleDateString('en-GB')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GetAllBuyerStatics;
