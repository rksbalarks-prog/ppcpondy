import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, Spinner, Alert, Form, Button, Row, Col } from "react-bootstrap";

const ITEMS_PER_PAGE = 50;

const CallExperienceTable = () => {
  const [experiences, setExperiences] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ppcIdFilter, setPpcIdFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCallExperiences = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-called-experiences`);
        setExperiences(res.data.data || []);
        setFiltered(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch call experiences.");
      } finally {
        setLoading(false);
      }
    };

    fetchCallExperiences();
  }, []);
  const tableRef = useRef();

  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const printWindow = window.open("", "", "width=1200,height=800");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h3>Filtered Users</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  const handleFilter = () => {
    let data = [...experiences];

    if (ppcIdFilter) {
      data = data.filter(item => item.ppcId.toString().includes(ppcIdFilter));
    }

    if (startDate || endDate) {
      data = data.map(item => ({
        ...item,
        calledExprience: item.calledExprience.filter(exp => {
          const expDate = new Date(exp.date);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          return (!start || expDate >= start) && (!end || expDate <= end);
        })
      })).filter(item => item.calledExprience.length > 0);
    }

    setFiltered(data);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setPpcIdFilter("");
    setStartDate("");
    setEndDate("");
    setFiltered(experiences);
    setCurrentPage(1);
  };

  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
//   if (filtered.length === 0) return <p>No call experiences found.</p>;

  const handlePpcIdChange = (e) => {
  const value = e.target.value;
  setPpcIdFilter(value);

  // Filter immediately when PPC ID is typed
  let data = [...experiences];

  if (value) {
    data = data.filter(item => item.ppcId.toString().includes(value));
  }

  if (startDate || endDate) {
    data = data.map(item => ({
      ...item,
      calledExprience: item.calledExprience.filter(exp => {
        const expDate = new Date(exp.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        return (!start || expDate >= start) && (!end || expDate <= end);
      })
    })).filter(item => item.calledExprience.length > 0);
  }

  setFiltered(data);
  setCurrentPage(1);
};


  return (
    <div className="container mt-4">
      <h4>All Call Experiences</h4>

      {/* Filters */}
      <Form className="my-3">
        <Row className="align-items-end">
          <Col md={3}>
            <Form.Group controlId="ppcIdFilter">
              <Form.Label className="text-bold">PPC ID</Form.Label>
            <Form.Control
  type="text"
  value={ppcIdFilter}
  onChange={handlePpcIdChange}
  placeholder="Enter PPC ID"
/>

            </Form.Group>
          </Col>

        
          <Col md={3}>
            {/* <Button variant="primary" onClick={handleFilter} className="me-2">Apply</Button> */}
            <Button variant="secondary" onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Form>

             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h3 className="text-success">Get All User Called Exprience Datas</h3>

      {/* Table */}
      <div ref={tableRef}>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>PPC ID</th>
            <th>Owner Name</th>
            <th>Owner Phone</th>
            <th>Caller Number</th>
            <th>Call Experience</th>
            <th>Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.flatMap((item, i) =>
            item.calledExprience.map((exp, j) => (
              <tr key={`${item._id}-${j}`}>
                <td>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                <td>{item.ppcId}</td>
                <td>{item.ownerName}</td>
                <td>{item.phoneNumber}</td>
                <td>{exp.phoneNumber}</td>
                <td>{exp.selectCalledReasons || "—"}</td>
                <td>{new Date(exp.date).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
</div>
      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <Button
          variant="outline-primary"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Prev
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button
          variant="outline-primary"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default CallExperienceTable;
