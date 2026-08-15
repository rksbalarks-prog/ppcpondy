 

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
import { useSelector } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import PhoneCell from "./components/PhoneCell";

const BuyerDashboard = () => {
  const [inputDates, setInputDates] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const reportRef = useRef();
  const adminName = useSelector((state) => state.admin.name);

  // Record view on mount
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
          userName: adminName,
          viewedFile: "Buyer Dashboard",
          viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } catch (err) {
        console.error("Error recording view:", err);
      }
    };

    if (adminName) {
      recordDashboardView();
    }
  }, [adminName]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setDashboardData(null);

      // Validate input dates
      if (!inputDates) {
        setError('Please enter at least one date');
        return;
      }

      // Check if it's a date range (contains comma)
      const isDateRange = inputDates.includes(',');

      // Validate date format(s)
      if (isDateRange) {
        const [startDate, endDate] = inputDates.split(',');
        if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || 
            !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
          setError('Invalid date format. Use YYYY-MM-DD,YYYY-MM-DD for date range');
          return;
        }
      } else {
        if (!moment(inputDates, 'YYYY-MM-DD', true).isValid()) {
          setError('Invalid date format. Use YYYY-MM-DD');
          return;
        }
      }

      // Build API URL
      const url = `${process.env.REACT_APP_API_URL}/buyer-dashboard-data?${
        isDateRange ? `dates=${inputDates}` : `date=${inputDates}`
      }`;

      const response = await axios.get(url);
      setDashboardData(response.data);
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

  const formatDate = (dateStr) => {
    try {
      return moment(dateStr).format('DD-MM-YYYY');
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    const content = reportRef.current;
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
          <title>Buyer Dashboard Report</title>
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
            <h2>Buyer Dashboard Report</h2>
            <p><strong>Date Range:</strong> ${dashboardData?.dateRange?.start ? formatDate(dashboardData.dateRange.start) : ''} to ${dashboardData?.dateRange?.end ? formatDate(dashboardData.dateRange.end) : ''}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
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
      const input = reportRef.current;
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
      pdf.text('Buyer Dashboard Report', 10, position);
      position += 10;
      pdf.setFontSize(10);
      pdf.text(`Date Range: ${dashboardData?.dateRange?.start ? formatDate(dashboardData.dateRange.start) : ''} to ${dashboardData?.dateRange?.end ? formatDate(dashboardData.dateRange.end) : ''}`, 10, position);
      position += 5;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, position);
      position += 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Buyer_Dashboard_Report_${dateStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Buyer Dashboard</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group controlId="formDates">
                  <Form.Label>Enter date(s) (YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD for range)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 2025-07-10 or 2025-07-10,2025-08-13"
                    value={inputDates}
                    onChange={(e) => setInputDates(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Enter a single date or date range separated by comma
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

      {dashboardData && (
        <div ref={reportRef}>
          <Row className="mb-3">
            <Col className="d-flex justify-content-end gap-2">
              <Button variant="success" onClick={handlePrint}>
                Print Report
              </Button>
              <Button variant="danger" onClick={handleDownloadPDF}>
                Export PDF
              </Button>
            </Col>
          </Row>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="summary" title="Summary">
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>Date Range: {formatDate(dashboardData.dateRange.start)} to {formatDate(dashboardData.dateRange.end)}</Card.Title>
                  
                  <Row className="mt-3">
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Body>
                          <Card.Title>Buyer Assistance</Card.Title>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Total Requests</td>
                                <td>{dashboardData.buyerAssistance.total}</td>
                              </tr>
                              <tr>
                                <td>Active</td>
                                <td>{dashboardData.buyerAssistance.statusCounts.baActive}</td>
                              </tr>
                              <tr>
                                <td>Pending</td>
                                <td>{dashboardData.buyerAssistance.statusCounts.baPending}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Body>
                          <Card.Title>Payments</Card.Title>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Pay Now</td>
                                <td>{dashboardData.payments['pay now']?.total || 0}</td>
                              </tr>
                              <tr>
                                <td>Pay Later</td>
                                <td>{dashboardData.payments['pay later']?.total || 0}</td>
                              </tr>
                              <tr>
                                <td>Paid</td>
                                <td>{dashboardData.payments.paid?.total || 0}</td>
                              </tr>
                              <tr>
                                <td>Failed</td>
                                <td>{dashboardData.payments['pay failed']?.total || 0}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="buyerAssistance" title="Buyer Assistance">
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>Buyer Assistance Requests ({dashboardData.buyerAssistance.total})</Card.Title>
                  <Table striped bordered hover responsive>
                    <thead className="table-dark">
                      <tr>
                        <th>Ba_Id ID</th>
                        <th>Buyer ID</th>
                        <th>Phone Number</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.buyerAssistance.list.map((request, idx) => (
                        <tr key={idx}>
                          <td>{request.ba_id}</td>
                          <td>{request.buyerId || 'N/A'}</td>
                          <td><PhoneCell phone={request.phoneNumber} type="any" /></td>
                          <td>
                            <Badge bg={request.ba_status === 'baActive' ? 'success' : 'warning'}>
                              {request.ba_status}
                            </Badge>
                          </td>
                          <td>{formatDateTime(request.createdAt)}</td>
                          <td>{formatDateTime(request.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="payments" title="Payments">
              <Card className="mb-4">
                <Card.Body>
                  <Tabs defaultActiveKey="payNow" className="mb-3">
                    <Tab eventKey="payNow" title="Pay Now">
                      <PaymentTable 
                        payments={dashboardData.payments['pay now']?.list || []} 
                        status="pay now"
                      />
                    </Tab>
                    <Tab eventKey="payLater" title="Pay Later">
                      <PaymentTable 
                        payments={dashboardData.payments['pay later']?.list || []} 
                        status="pay later"
                      />
                    </Tab>
                    <Tab eventKey="paid" title="Paid">
                      <PaymentTable 
                        payments={dashboardData.payments.paid?.list || []} 
                        status="paid"
                      />
                    </Tab>
                    <Tab eventKey="failed" title="Failed">
                      <PaymentTable 
                        payments={dashboardData.payments['pay failed']?.list || []} 
                        status="pay failed"
                      />
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </div>
      )}
    </Container>
  );
};
 

const PaymentTable = ({ payments, status }) => {
  const formatDateTime = (dateStr) => {
    try {
      return moment(dateStr).format('DD-MM-YYYY HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid': return 'success';
      case 'pay now': return 'primary';
      case 'pay later': return 'info';
      case 'pay failed': return 'danger';
      default: return 'secondary';
    }
  };

  // Function to extract BA IDs from phoneNumbers array
  const getBaIds = (payment) => {
    if (!payment.planDetails?.phoneNumbers) return 'N/A';
    
    return payment.planDetails.phoneNumbers
      .map(phone => phone.ba_id)
      .filter(Boolean) // Remove undefined/null values
      .join(', '); // Display multiple IDs separated by commas
  };

  return (
    <>
      <h5 className="mb-3">{status.toUpperCase()} ({payments.length})</h5>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Payment ID</th>
            <th>BA ID(s)</th>
            <th>Amount</th>
            <th>Plan Name</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map((payment, idx) => (
              <tr key={idx}>
                <td>{payment.paymentId || payment._id}</td>
                <td>{getBaIds(payment)}</td>
                <td>{payment.amount ? `₹${payment.amount}` : 'N/A'}</td>
                <td>{payment.planName || 'N/A'}</td>
                <td>
                  <Badge bg={getStatusBadge(payment.payStatus || payment.payustatususer)}>
                    {payment.payStatus || payment.payustatususer}
                  </Badge>
                </td>
                <td>{formatDateTime(payment.createdAt)}</td>
                <td>{payment.expiryDate ? formatDateTime(payment.expiryDate) : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                No {status} payments found
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};

export default BuyerDashboard;
 