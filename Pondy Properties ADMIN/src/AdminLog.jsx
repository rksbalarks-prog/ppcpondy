




import axios from "axios";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Table, Form, Button, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useSelector } from "react-redux";

const AdminLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const adminName = useSelector((state) => state.admin.name);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: 10,
          search,
          startDate,
          endDate,
        };

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-admin-logs`, { params });

        setLogs(response.data.logs);
        setTotalLogs(response.data.totalLogs);
        setTotalPages(response.data.totalPages);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, search, startDate, endDate]);
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
  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center">Admin Log Report</h1>
      <h3 className="text-success">Admin Logs</h3>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control className="m-0"
              type="text"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={handleSearchSubmit}>
              <FaSearch />
            </Button>
          </InputGroup>
        </Col>
        <Col md={6}>
          <Row>
            <Col>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
            <Col>
              <Button variant="danger" onClick={handleDateFilter}>
                Search By Date
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div ref={tableRef}>
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>SL</th>
              <th>STAFF NAME</th>
              <th>OFFICE</th>
              {/* <th>PAGE NAME</th> */}
              <th>Last Login DATE</th>
              <th>ADDRESS</th>
              <th>MOBILE</th>
              <th>USERNAME</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">No logs found.</td>
              </tr>
            ) : (
              logs.map((item, index) => (
                <tr key={index}>
                  <td>{(currentPage - 1) * 10 + (index + 1)}</td>
                  <td>{item.name}</td>
                  <td>{item.office}</td>
                  {/* <td>{item.page}</td> */}
                  <td>{moment(item.lastLogin).format("YYYY-MM-DD HH:mm:ss")}</td>
                  <td>{item.address || "-"}</td>
                  <td>{item.mobile || "-"}</td>
                  <td>{item.userName || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        </div>
      )}

      <div className="pagination mt-3">
        {Array.from({ length: totalPages }).map((_, index) => (
          <Button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            disabled={currentPage === index + 1}
            className="mx-1"
            variant={currentPage === index + 1 ? "primary" : "outline-primary"}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </Container>
  );
};

export default AdminLog;
