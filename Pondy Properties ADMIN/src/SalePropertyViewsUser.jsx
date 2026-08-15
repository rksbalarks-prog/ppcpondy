import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Container, Spinner, Alert, Button, Row, Col, Form } from "react-bootstrap";
import moment from "moment";

const ITEMS_PER_PAGE = 50;

const AllPropertyViews = () => {
  const [views, setViews] = useState([]);
  const [filteredViews, setFilteredViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ppcIdFilter, setPpcIdFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPropertyViews = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-property-views`);
        setViews(res.data.data);
        setFilteredViews(res.data.data); // Initialize with full data
      } catch (err) {
        console.error("Error fetching property views:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyViews();
  }, []);

  // Filter handler
  const applyFilters = () => {
    let filtered = views;

    if (ppcIdFilter.trim()) {
      filtered = filtered.filter(view =>
        view.ppcId?.toLowerCase().includes(ppcIdFilter.trim().toLowerCase())
      );
    }

    if (startDateFilter) {
      filtered = filtered.filter(view =>
        moment(view.viewedAt).isSameOrAfter(moment(startDateFilter), "day")
      );
    }

    if (endDateFilter) {
      filtered = filtered.filter(view =>
        moment(view.viewedAt).isSameOrBefore(moment(endDateFilter), "day")
      );
    }

    setFilteredViews(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  const resetFilters = () => {
    setPpcIdFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setFilteredViews(views);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredViews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentViews = filteredViews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <Container className="mt-4">
      <h3 className="mb-4">All Property Views</h3>

      {/* Filter Form */}
      <Form className="mb-4">
        <Row>
          <Col md={3}>
            <Form.Group controlId="ppcIdFilter">
              <Form.Label>PPC ID</Form.Label>
              <Form.Control
                type="text"
                value={ppcIdFilter}
                onChange={(e) => setPpcIdFilter(e.target.value)}
                placeholder="Enter PPC ID"
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="startDateFilter">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="endDateFilter">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3} className="d-flex align-items-end">
            <div className="d-flex gap-2">
              <Button variant="success" onClick={applyFilters}>Apply Filters</Button>
              <Button variant="secondary" onClick={resetFilters}>Reset</Button>
            </div>
          </Col>
        </Row>
      </Form>

      {/* Table and Content */}
      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredViews.length === 0 ? (
        <Alert variant="info">No property views found.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>PPC ID</th>
                <th>User Phone Number</th>
                <th>Viewed At</th>
              </tr>
            </thead>
            <tbody>
              {currentViews.map((view, index) => (
                <tr key={view._id}>
                  <td>{startIndex + index + 1}</td>
                  <td>{view.ppcId}</td>
                  <td>{view.userPhoneNumber}</td>
                  <td>{moment(view.viewedAt).format("YYYY-MM-DD hh:mm A")}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination Controls */}
          <Row className="justify-content-between align-items-center mt-3">
            <Col md="auto">
              <Button variant="primary" onClick={handlePrev} disabled={currentPage === 1}>
                Previous
              </Button>
            </Col>
            <Col md="auto">
              Page {currentPage} of {totalPages}
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleNext} disabled={currentPage === totalPages}>
                Next
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default AllPropertyViews;
