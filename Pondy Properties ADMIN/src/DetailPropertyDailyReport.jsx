 





import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Table, 
  Spinner, 
  Alert, 
  Card,
  Badge,
  Tabs,
  Tab
} from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';

const DashboardDetailReport = () => {
  const [inputDates, setInputDates] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dataType, setDataType] = useState('all');
  const [activeTab, setActiveTab] = useState('');
  const reportRef = useRef();

  // Validate date format (YYYY-MM-DD)
  const isValidDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  // Process dates from input (handles comma separated and line breaks)
  const processDatesInput = (input) => {
    const dateStrings = input.split(/[\n,]+/)
      .map(date => date.trim())
      .filter(date => date.length > 0);
    
    const validDates = [];
    const invalidDates = [];
    
    dateStrings.forEach(dateStr => {
      if (isValidDate(dateStr)) {
        validDates.push(dateStr);
      } else {
        invalidDates.push(dateStr);
      }
    });
    
    return { validDates, invalidDates };
  };

  const fetchDashboardData = async () => {
    const { validDates, invalidDates } = processDatesInput(inputDates);
    
    if (validDates.length === 0) {
      setError('Please enter at least one valid date in YYYY-MM-DD format');
      return;
    }
    
    if (invalidDates.length > 0) {
      setError(`Invalid date formats detected: ${invalidDates.join(', ')}. These will be ignored.`);
    } else {
      setError('');
    }

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-dashboard-detail-data`, {
        params: {
          dates: validDates.join(',')
        }
      });
      
      setDashboardData(response.data.data);
      // Set the first date as active tab by default
      const firstDate = Object.keys(response.data.data)[0];
      if (firstDate) {
        setActiveTab(firstDate);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const formatDateTime = (dateStr) => {
    try {
      return moment(dateStr).format('DD-MM-YYYY HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  const filterData = (data) => {
    if (!data || filterType === 'all') return data;

    return data.filter(item => item.status === filterType);
  };

  const renderDataTable = (data, title, fields) => {
    if (!data || !dashboardData || !activeTab) return null;

    const dateData = dashboardData[activeTab];
    if (!dateData) return null;

    const items = filterData(dateData.data[data]);
    if (items.length === 0) return (
      <div className="mb-4">
        <h5>{title} (0)</h5>
        <Alert variant="info">No data available</Alert>
      </div>
    );

    return (
      <div className="mb-4">
        <h5>{title} ({items.length})</h5>
        <Table>
          <thead className="table-dark">
            <tr>
              {fields.map((field, idx) => (
                <th key={idx}>{field.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                {fields.map((field, colIdx) => {
                  let value = item;
                  if (field.key.includes('.')) {
                    const keys = field.key.split('.');
                    for (const key of keys) {
                      value = value ? value[key] : null;
                      if (value === null || value === undefined) break;
                    }
                  } else {
                    value = item[field.key];
                  }

                  if (field.key.toLowerCase().includes('date') || 
                      field.key === 'createdAt' || 
                      field.key === 'updatedAt') {
                    value = formatDateTime(value);
                  }

                  return <td key={colIdx}>{value || 'N/A'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const handlePrint = () => {
    const content = reportRef.curPPC;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print.');
      return;
    }

    const printContent = content.cloneNode(true);
    const buttons = printContent.querySelectorAll('button');
    buttons.forEach(button => button.remove());

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Dashboard Detail Report</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
          <style>
            @media print {
              body { padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              .table-striped tbody tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
            }
          </style>
        </head>
        <body>
          <div class="container mt-4">
            <h2>Dashboard Detail Report - ${activeTab}</h2>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Filter:</strong> ${filterType}</p>
            <p><strong>Data Type:</strong> ${dataType}</p>
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    try {
      const input = reportRef.curPPC;
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      
      const canvas = await html2canvas(input, {
        scale: 1,
        useCORS: true,
        logging: false,
        scrollY: -window.scrollY
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.setFontSize(14);
      pdf.text(`Dashboard Detail Report - ${activeTab}`, 10, position);
      position += 10;
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, position);
      position += 5;
      pdf.text(`Filter: ${filterType}`, 10, position);
      position += 5;
      pdf.text(`Data Type: ${dataType}`, 10, position);
      position += 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Dashboard_Report_${activeTab}_${dateStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Dashboard Detail Report</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group controlId="formDates">
                  <Form.Label>Enter dates (YYYY-MM-DD)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter dates separated by commas or new lines\nExample:\n2025-07-10\n2025-08-13"
                    value={inputDates}
                    onChange={(e) => setInputDates(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    You can enter multiple dates separated by commas or new lines
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'Fetch Data'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {dashboardData && Object.keys(dashboardData).length > 0 && (
        <>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
              >
                <option value="all">All Data</option>
                <option value="photoRequests">Photo Requests</option>
                <option value="offers">Offers</option>
                <option value="addressRequests">Address Requests</option>
                <option value="userLogins">User Logins</option>
              </Form.Select>
            </Col>
       
            <Col md={4} className="d-flex justify-content-end gap-2">
              <Button variant="success" onClick={handlePrint}>
                Print Report
              </Button>
              <Button variant="danger" onClick={handleDownloadPDF}>
                Export PDF
              </Button>
            </Col>
          </Row>

          <div ref={reportRef}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              {Object.keys(dashboardData).map(date => (
                <Tab key={date} eventKey={date} title={date}>
                  <Card className="mb-4">
                    <Card.Body>
                      <Card.Title>Summary for {date}</Card.Title>
                      <Row>
                        <Col md={3}>
                          <p><strong>Photo Requests:</strong> {dashboardData[date].totalCounts.photoRequests}</p>
                        </Col>
                        <Col md={3}>
                          <p><strong>Offers:</strong> {dashboardData[date].totalCounts.offers}</p>
                        </Col>
                        <Col md={3}>
                          <p><strong>Address Requests:</strong> {dashboardData[date].totalCounts.addressRequests}</p>
                        </Col>
                        <Col md={3}>
                          <p><strong>User Logins:</strong> {dashboardData[date].totalCounts.userLogins}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {(dataType === 'all' || dataType === 'photoRequests') && renderDataTable(
                    'photoRequests',
                    'Photo Requests',
                    [
                      { key: 'ppcId', label: 'PPC ID' },
                      { key: 'requesterPhoneNumber', label: 'Requester Phone' },
                      { key: 'postedUserPhoneNumber', label: 'Posted User Phone' },
                      { key: 'propertyDetails.address', label: 'Address' },
                      { key: 'status', label: 'Status' },
                      { key: 'createdAt', label: 'Created At' }
                    ]
                  )}

                  {(dataType === 'all' || dataType === 'offers') && renderDataTable(
                    'offers',
                    'Offers',
                    [
                      { key: 'ppcId', label: 'PPC ID' },
                      { key: 'phoneNumber', label: 'Phone' },
                      { key: 'postedUserPhoneNumber', label: 'Posted User Phone' },
                      { key: 'propertyDetails.address', label: 'Address' },
                      { key: 'originalPrice', label: 'Original Price' },
                      { key: 'offeredPrice', label: 'Offered Price' },
                      { key: 'status', label: 'Status' },
                      { key: 'offerDate', label: 'Offer Date' }
                    ]
                  )}

                  {(dataType === 'all' || dataType === 'addressRequests') && renderDataTable(
                    'addressRequests',
                    'Address Requests',
                    [
                      { key: 'ppcId', label: 'PPC ID' },
                      { key: 'requesterPhoneNumber', label: 'Requester Phone' },
                      { key: 'postedUserPhoneNumber', label: 'Posted User Phone' },
                      { key: 'propertyDetails.address', label: 'Address' },
                      { key: 'status', label: 'Status' },
                      { key: 'createdAt', label: 'Created At' }
                    ]
                  )}

                  {(dataType === 'all' || dataType === 'userLogins') && renderDataTable(
                    'userLogins',
                    'User Logins',
                    [
                      { key: 'phone', label: 'Phone' },
                      { key: 'otp', label: 'OTP' },
                      { key: 'otpStatus', label: 'OTP Status' },
                      { key: 'loginDate', label: 'Login Date' }
                    ]
                  )}
                </Tab>
              ))}
            </Tabs>
          </div>
        </>
      )}
    </Container>
  );
};

export default DashboardDetailReport;