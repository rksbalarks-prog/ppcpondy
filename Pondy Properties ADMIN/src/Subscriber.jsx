 

import React, { useState, useRef } from 'react';
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
  Badge
} from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'bootstrap/dist/css/bootstrap.min.css';
import PhoneCell from "./components/PhoneCell";

const PPCDatesReport = () => {
  const [inputDates, setInputDates] = useState('');
  const [dateData, setDateData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [filterType, setFilterType] = useState('all');
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
    // Split by commas or newlines
    const dateStrings = input.split(/[\n,]+/)
      .map(date => date.trim())
      .filter(date => date.length > 0);
    
    // Validate each date
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

  const fetchPPCDates = async () => {
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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-pondy-dates`, {
        params: {
          dates: validDates.join(',')
        }
      });
      
      setDateData(response.data.data);
      const firstDate = Object.keys(response.data.data)[0];
      if (firstDate) {
        setSelectedDate(firstDate);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch PPC dates data');
      console.error('Error fetching PPC dates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPPCDates();
  };

  // Format date without date-fns
  const formatDateTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const pad = num => num.toString().padStart(2, '0');
      return `${pad(date.getDate())}-${pad(date.getMonth()+1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
      return dateStr;
    }
  };

  const filterData = (data) => {
    if (!data || filterType === 'all') return data;

    const filtered = { ...data };
    
    if (['active', 'incomplete', 'complete', 'delete'].includes(filterType)) {
      filtered.properties = data.properties.filter(p => p.status === filterType);
      filtered.statusCounts = {
        ...data.statusCounts,
        [filterType]: filtered.properties.length
      };
    } else if (filterType === 'helpRequests') {
      filtered.properties = data.properties.filter(p => 
        p.helpRequests && p.helpRequests.length > 0
      );
      filtered.helpRequestsCount = filtered.properties.reduce(
        (sum, p) => sum + (p.helpRequests?.length || 0), 0
      );
    } else if (filterType === 'reportProperty') {
      filtered.properties = data.properties.filter(p => 
        p.reportProperty && p.reportProperty.length > 0
      );
      filtered.reportPropertyCount = filtered.properties.reduce(
        (sum, p) => sum + (p.reportProperty?.length || 0), 0
      );
    } else if (filterType === 'customerCare') {
      // For customer care view, we'll show all properties but with different columns
      filtered.properties = data.properties;
    }

    return filtered;
  };

  const renderStatusTable = (data, status) => {
    const filtered = data.properties.filter(p => p.status === status);
    if (filtered.length === 0) return null;

    return (
      <div className="mb-4">
        <h5 className="mt-3">
          {status.toUpperCase()} ({filtered.length})
        </h5>
        <Table>
          <thead className="table-dark">
            <tr>
              <th>PPC ID</th>
              <th>Phone</th>
              <th>Mode</th>
              <th>Type</th>
              <th>Price</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Activities</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={idx}>
                <td>{p.ppcId}</td>
                <td><PhoneCell phone={p.phoneNumber} type="any" /></td>
                <td>{p.propertyMode}</td>
                <td>{p.propertyType}</td>
                <td>{p.price}</td>
                <td>{formatDateTime(p.createdAt)}</td>
                <td>{formatDateTime(p.updatedAt)}</td>
                <td>
                  {p.helpRequests?.length > 0 && (
                    <Badge bg="warning" text="dark" className="me-1">
                      Help ({p.helpRequests.length})
                    </Badge>
                  )}
                  {p.reportProperty?.length > 0 && (
                    <Badge bg="danger" className="me-1">
                      Reports ({p.reportProperty.length})
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderHelpRequests = (data) => {
    const allRequests = data.properties.flatMap(p => 
      (p.helpRequests || []).map(h => ({ ...h, ppcId: p.ppcId, ownerPhone: p.phoneNumber }))
    );

    if (allRequests.length === 0) return null;

    return (
      <div className="mb-4">
        <h5>Help Requests ({allRequests.length})</h5>
        <Table striped bordered hover>
          <thead className="table-dark">
            <tr>
              <th>PPC ID</th>
              <th>Owner Phone</th>
              <th>Requester Phone</th>
              <th>Reason</th>
              <th>Comment</th>
              <th>Requested At</th>
            </tr>
          </thead>
          <tbody>
            {allRequests.map((h, idx) => (
              <tr key={idx}>
                <td>{h.ppcId}</td>
                <td><PhoneCell phone={h.ownerPhone} type="any" /></td>
                <td><PhoneCell phone={h.phoneNumber} type="any" /></td>
                <td>{h.selectHelpReason}</td>
                <td>{h.comment}</td>
                <td>{formatDateTime(h.requestedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderReports = (data) => {
    const allReports = data.properties.flatMap(p => 
      (p.reportProperty || []).map(r => ({ ...r, ppcId: p.ppcId, ownerPhone: p.phoneNumber }))
    );

    if (allReports.length === 0) return null;

    return (
      <div className="mb-4">
        <h5>Property Reports ({allReports.length})</h5>
        <Table striped bordered hover>
          <thead className="table-dark">
            <tr>
              <th>PPC ID</th>
              <th>Owner Phone</th>
              <th>Reporter Phone</th>
              <th>Reason</th>
              <th>Details</th>
              <th>Reported At</th>
            </tr>
          </thead>
          <tbody>
            {allReports.map((r, idx) => (
              <tr key={idx}>
                <td>{r.ppcId}</td>
                <td><PhoneCell phone={r.ownerPhone} type="any" /></td>
                <td><PhoneCell phone={r.phoneNumber} type="any" /></td>
                <td>{r.selectReasons}</td>
                <td>{r.reason}</td>
                <td>{formatDateTime(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderCustomerCareTable = (data) => {
    if (!data || !data.properties || data.properties.length === 0) {
      return (
        <div className="mb-4">
          <h5 className="mt-3">Customer Care Property List (0)</h5>
          <Alert variant="info">No properties found for customer care view.</Alert>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <h5 className="mt-3">Customer Care Property List ({data.properties.length})</h5>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Sl No</th>
              <th>PPC ID</th>
              <th>Owner Name</th>
              <th>Phone</th>
              <th>Mode</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.properties.map((p, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{p.ppcId}</td>
                <td>{p.ownerName || '-'}</td>
                <td><PhoneCell phone={p.phoneNumber} type="any" /></td>
                <td>{p.propertyMode}</td>
                <td>{p.propertyType}</td>
                <td>{p.price?.toLocaleString()}</td>
                <td>
                  <Badge 
                    bg={
                      p.status === 'active' ? 'success' : 
                      p.status === 'incomplete' ? 'warning' : 
                      p.status === 'complete' ? 'primary' : 
                      p.status === 'delete' ? 'danger' : 'secondary'
                    }
                  >
                    {p.status || "N/A"}
                  </Badge>
                </td>
                <td>{formatDateTime(p.createdAt)}</td>
                <td>{formatDateTime(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    
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
          <title>PPC Dates Report</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
          <style>
            @media print {
              body { padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              .table-striped tbody tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
              .table-bordered { border: 1px solid #dee2e6; }
            }
          </style>
        </head>
        <body>
          <div class="container mt-4">
            <h2>PPC Property Report - ${selectedDate}</h2>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Filter:</strong> ${filterType}</p>
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
      if (!input) return;
      
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
      pdf.text(`PPC Property Report - ${selectedDate}`, 10, position);
      position += 10;
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, position);
      position += 5;
      pdf.text(`Filter: ${filterType}`, 10, position);
      position += 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`PPC_Report_${selectedDate}_${dateStr}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const curPPCData = selectedDate && dateData[selectedDate] ? filterData(dateData[selectedDate]) : null;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Pondy Property Date Report</h2>
      
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
                    placeholder="Enter dates separated by commas or new lines\nExample:\n2023-01-15\n2023-01-16\n2023-01-17"
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

      {Object.keys(dateData).length > 0 && (
        <>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                {Object.keys(dateData).map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Data</option>
                <option value="active">Active Properties</option>
                <option value="incomplete">Incomplete Properties</option>
                <option value="complete">Complete Properties</option>
                <option value="delete">Deleted Properties</option>
                <option value="helpRequests">Help Requests</option>
                <option value="reportProperty">Property Reports</option>
                <option value="customerCare">Customer Care View</option>
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
            {curPPCData && (
              <>
                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title>Summary for {selectedDate}</Card.Title>
                    <Row>
                      <Col md={4}>
                        <p><strong>Total Properties:</strong> {curPPCData.total || 0}</p>
                        <p><strong>Active:</strong> {curPPCData.statusCounts?.active || 0}</p>
                        <p><strong>Incomplete:</strong> {curPPCData.statusCounts?.incomplete || 0}</p>
                      </Col>
                      <Col md={4}>
                        <p><strong>Complete:</strong> {curPPCData.statusCounts?.complete || 0}</p>
                        <p><strong>Deleted:</strong> {curPPCData.statusCounts?.delete || 0}</p>
                      </Col>
                      <Col md={4}>
                        <p><strong>Help Requests:</strong> {curPPCData.helpRequestsCount || 0}</p>
                        <p><strong>Property Reports:</strong> {curPPCData.reportPropertyCount || 0}</p>
                        <p><strong>Customer Care Properties:</strong> {curPPCData.properties?.length || 0}</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {filterType === 'all' || filterType === 'active' ? renderStatusTable(curPPCData, 'active') : null}
                {filterType === 'all' || filterType === 'incomplete' ? renderStatusTable(curPPCData, 'incomplete') : null}
                {filterType === 'all' || filterType === 'complete' ? renderStatusTable(curPPCData, 'complete') : null}
                {filterType === 'all' || filterType === 'delete' ? renderStatusTable(curPPCData, 'delete') : null}
                {filterType === 'all' || filterType === 'helpRequests' ? renderHelpRequests(curPPCData) : null}
                {filterType === 'all' || filterType === 'reportProperty' ? renderReports(curPPCData) : null}
                {filterType === 'customerCare' && renderCustomerCareTable(curPPCData)}
              </>
            )}
          </div>
        </>
      )}
    </Container>
  );
};

export default PPCDatesReport;