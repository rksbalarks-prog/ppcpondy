 
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GetAllUsageStatics = () => {
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
          `${process.env.REACT_APP_API_URL}/fetch-user-all-datas?phoneNumber=${phoneNumber}`
        );
        const result = await response.json();
        setUserData(result.data);
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

    Object.entries(userData).forEach(([key, data]) => {
      if (data && data.length) {
        doc.text(key.replace(/([A-Z])/g, ' $1').toUpperCase(), 10, y);
        y += 5;

        const columns = Object.keys(data[0]).map((k) => ({ header: k, dataKey: k }));
        autoTable(doc, {
          startY: y,
          head: [columns.map((col) => col.header)],
          body: data.map((row) => columns.map((col) => row[col.dataKey] ?? 'N/A')),
          theme: 'grid',
          styles: { fontSize: 7 },
        });

        y = doc.lastAutoTable.finalY + 10;
      }
    });

    doc.save(`UserPropertyStats_${phoneNumber}.pdf`);
  };

  const renderTable = (title, data) => (
    <div style={{ marginBottom: '30px' }}>
      <h4>{title}</h4>
      {data.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ width: '100%', fontSize: '14px' }}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((value, j) => (
                  <td key={j}>{value?.toString() ?? 'N/A'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  if (loading) return <p>Loading user data...</p>;
  if (!userData) return <p>No data available for this user.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Property Usage Stats</h2>
      <p><strong>Phone Number:</strong> {phoneNumber}</p>

      <div style={{ marginBottom: '20px' }}>
        <button className='bg-warning text-white' onClick={exportToPDF}>Export to PDF</button>
      </div>

      {Object.entries(userData).map(([key, data]) =>
        renderTable(key.replace(/([A-Z])/g, ' $1'), data)
      )}
    </div>
  );
};

export default GetAllUsageStatics;
