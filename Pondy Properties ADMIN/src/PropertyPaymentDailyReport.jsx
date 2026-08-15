 

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import moment from "moment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSelector } from "react-redux";
import { Container, Row, Col, Button, Spinner, Form, Table, Card, Badge } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
 



const PaymentSummaryReport = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOption, setSelectedOption] = useState("today");
  const printRef = useRef(null);

  // Fetch data when date selection changes
  useEffect(() => {
    if (selectedOption === "custom" && (!startDate || !endDate)) return;
    fetchData();
  }, [selectedOption, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${process.env.REACT_APP_API_URL}/payments/summary-data`;
      
      if (selectedOption === "custom") {
        url += `?dates=${startDate},${endDate}`;
      } else {
        url += `?day=${selectedOption}`;
      }

      const res = await axios.get(url);
      setSummaryData(res.data);
    } catch (error) {
      alert("Failed to fetch payment summary");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date changes
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setSelectedOption("custom");
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setSelectedOption("custom");
  };

  // Handle quick date selection
  const handleQuickDateSelect = (option) => {
    setSelectedOption(option);
    setStartDate("");
    setEndDate("");
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (!summaryData) return;

    const doc = new jsPDF();
    let currentY = 20;

    doc.setFontSize(16);
    doc.text("RENT - Payment Summary Report", 14, 10);
    
    doc.setFontSize(12);
    doc.text(`Date Range: ${getFormattedDateLabel()}`, 14, currentY);
    currentY += 10;
    doc.text(`Total Payments: ${summaryData.total}`, 14, currentY);
    currentY += 15;
     

    const statuses = ["pay now", "pay later", "paid", "pay failed"];

    statuses.forEach((status) => {
      const statusData = summaryData.summary[status];
      if (!statusData || statusData.count === 0) return;

      doc.setFontSize(12);
      doc.text(`${status.toUpperCase()} - Count: ${statusData.count}`, 14, currentY);
      currentY += 8;

      const tableColumn = [
        "RENT ID",
        "Phone",
        "Amount",
        "Plan",
        "Transaction ID",
        "Status",
        "Date"
      ];

      const tableRows = statusData.data.map((item) => [
        item?.ppcId ?? "-",
        item?.phone ?? "-",
        item?.amount ? `₹${item.amount}` : "-",
        item?.planName ?? "-",
        item?.txnid ?? "-",
        item?.payustatususer ?? "-",
        moment(item?.createdAt).format("DD-MM-YYYY HH:mm")
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [40, 100, 150] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          currentY = data.cursor.y + 10;
        }
      });

      currentY += 5;
    });

    doc.save(`RENT_Payment_Summary_${getFormattedDateLabel()}.pdf`);
  };

  // Get readable label for selected date
  const getFormattedDateLabel = () => {
    if (selectedOption === "today") return moment().format("DD-MM-YYYY");
    if (selectedOption === "yesterday") return moment().subtract(1, "days").format("DD-MM-YYYY");
    if (selectedOption === "custom" && startDate && endDate) {
      return `${moment(startDate).format("DD-MM-YYYY")} to ${moment(endDate).format("DD-MM-YYYY")}`;
    }
    return "All Time";
  };

  // Render payment summary table
 const renderTable = () => {
    if (!summaryData) return null;

    const statuses = ["pay now", "pay later", "paid", "pay failed"];

    return statuses.map((status) => {
      const statusData = summaryData.summary[status];
      if (!statusData || statusData.count === 0) return null;

      return (
        <Card key={status} className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              {status.toUpperCase()} - Count: <Badge bg="light" text="dark">{statusData.count}</Badge>
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped bordered hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>PPC ID</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Plan</th>
                  <th>Txn ID</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {statusData.data.map((item) => (
                  <tr key={item._id}>
                    <td>{item.ppcId || "-"}</td>
                    <td>{item.phone || "-"}</td>
                    <td>{item.amount ? `₹${item.amount}` : "-"}</td>
                    <td>{item.planName || "-"}</td>
                    <td>{item.txnid || "-"}</td>
                    <td className="text-capitalize">{item.payustatususer || "-"}</td>
                    <td>{moment(item.payuDate).format("DD-MM-YYYY HH:mm")}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      );
    });
  };


  // Role-based access control
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  const [allowedRoles, setAllowedRoles] = useState([]);
  const fileName = "Rent Property Payment DailyReport";

  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
          userName: adminName,
          role: adminRole,
          viewedFile: fileName,
          viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } catch (err) {
        console.error("Error recording view:", err);
      }
    };

    if (adminName && adminRole) {
      recordDashboardView();
    }
  }, [adminName, adminRole]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const rolePermissions = res.data.find((perm) => perm.role === adminRole);
        const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch (err) {
        console.error("Error fetching permissions:", err);
      }
    };

    if (adminRole) {
      fetchPermissions();
    }
  }, [adminRole]);

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h3 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h3>
          <p className="text-gray-700">You don't have permission to view this report.</p>
        </div>
      </div>
    );
  }

    return (
    <Container fluid className="min-vh-100 bg-light p-0">
      <Row className="g-0">
        <Col>
          <Card className="border-0 shadow-none">
            <Card.Header className="bg-primary text-white py-3">
              <h4 className="mb-0">PPC Pondy - Payment Summary Report</h4>
            </Card.Header>
            <Card.Body className="p-4">
              {/* Date selection controls */}
              <Row className="mb-4 align-items-center">
                <Col md={8}>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <div className="d-flex gap-2">
                      <Button
                        variant={selectedOption === "today" ? "primary" : "outline-secondary"}
                        onClick={() => handleQuickDateSelect("today")}
                        size="sm"
                      >
                        Today
                      </Button>
                      <Button
                        variant={selectedOption === "yesterday" ? "primary" : "outline-secondary"}
                        onClick={() => handleQuickDateSelect("yesterday")}
                        size="sm"
                      >
                        Yesterday
                      </Button>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-nowrap">Custom Range:</span>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="date"
                          value={startDate}
                          onChange={handleStartDateChange}
                          size="sm"
                          max={moment().format("YYYY-MM-DD")}
                        />
                        <span>to</span>
                        <Form.Control
                          type="date"
                          value={endDate}
                          onChange={handleEndDateChange}
                          size="sm"
                          max={moment().format("YYYY-MM-DD")}
                          min={startDate}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={4} className="text-md-end mt-3 mt-md-0">
                  <Button
                    variant="success"
                    onClick={handleDownloadPDF}
                    disabled={!summaryData || loading}
                    size="sm"
                    className="d-inline-flex align-items-center gap-1"
                  >
                    <i className="bi bi-download"></i> Export PDF
                  </Button>
                </Col>
              </Row>

              {/* Summary stats */}
              {summaryData && (
                <Card className="mb-4 bg-info bg-opacity-10 border-info">
                  <Card.Body className="py-2">
                    <Row>
                      <Col md={6}>
                        <span className="fw-medium">Date Range: </span>
                        <span className="fw-bold text-primary">{getFormattedDateLabel()}</span>
                      </Col>
                      <Col md={6} className="text-md-end">
                        <span className="fw-medium">Total Payments: </span>
                        <span className="fw-bold text-primary">{summaryData.total}</span>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Loading state */}
              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading payment data...</p>
                </div>
              )}

              {/* Print Content Section */}
              <div ref={printRef}>
                {!loading && renderTable()}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentSummaryReport;

