 

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, Button } from "react-bootstrap";

const AddressRequestsTable = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    ppcId: "",
    startDate: "",
    endDate: ""
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-address-requests-all`);
        setRequests(res.data.requests);
      } catch (err) {
        setError("Failed to fetch address requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
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
  const filteredRequests = requests.filter((req) => {
    const matchesPpcId = filters.ppcId
      ? String(req.ppcId || "").includes(filters.ppcId)
      : true;

    const createdAt = new Date(req.createdAt);

    const matchesStartDate = filters.startDate
      ? createdAt >= new Date(filters.startDate)
      : true;

    const matchesEndDate = filters.endDate
      ? createdAt <= new Date(filters.endDate)
      : true;

    return matchesPpcId && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(prev - 1, 1);
      if (direction === "next") return Math.min(prev + 1, totalPages);
      return prev;
    });
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Quick Search</h4>

      <div
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff"
        }}
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <input
          type="text"
          placeholder="Search PPC ID"
          value={filters.ppcId}
          onChange={(e) => {
            setFilters({ ...filters, ppcId: e.target.value });
            setCurrentPage(1);
          }}
          className="form-control"
          style={{ maxWidth: 200 }}
        />

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => {
            setFilters({ ...filters, startDate: e.target.value });
            setCurrentPage(1);
          }}
          className="form-control"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => {
            setFilters({ ...filters, endDate: e.target.value });
            setCurrentPage(1);
          }}
          className="form-control"
        />

        <button
          className="btn btn-secondary"
          onClick={() => {
            setFilters({ ppcId: "", startDate: "", endDate: "" });
            setCurrentPage(1);
          }}
        >
          Reset
        </button>
      </div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h4 className="mt-3">Address Requests with Property Details</h4>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="alert alert-info">No address requests found.</div>
      ) : (
        <>
<div ref={tableRef}>            <Table striped bordered hover responsive className="table-sm align-middle">
              <thead className="sticky-top">
                <tr>
                  <th>#</th>
                  <th className="sticky-col sticky-col-1">PPC ID</th>
                  <th className="sticky-col sticky-col-2">Requester Phone</th>
                  <th>Posted User Phone</th>
                  <th>Status</th>
                  <th>Request Date</th>
                  <th>City</th>
                  <th>District</th>
                  <th>Area</th>
                  <th>Door No</th>
                  <th>Street Name</th>
                  <th>Nager</th>
                  <th>Pin Code</th>
                  <th>Property Type</th>
                  <th>Price</th>
                  <th>Property Mode</th>
                  <th>Location Coordinates</th>
                  <th>Area Size</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req, index) => {
                  const property = req.propertyDetails || {};
                  return (
                    <tr key={req._id}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="sticky-col sticky-col-1">{req.ppcId}</td>
                      <td className="sticky-col sticky-col-2">{req.requesterPhoneNumber}</td>
                      <td>{req.postedUserPhoneNumber}</td>
                      <td>{req.status}</td>
                      <td>{new Date(req.createdAt).toLocaleString()}</td>
                      <td>{property.city || "-"}</td>
                      <td>{property.state || "-"}</td>
                      <td>{property.area || "-"}</td>
                      <td>{property.doorNumber || "-"}</td>
                      <td>{property.streetName || "-"}</td>
                      <td>{property.nager || "-"}</td>
                      <td>{property.pinCode || "-"}</td>
                      <td>{property.propertyType || "-"}</td>
                      <td>{property.price ? `₹${property.price.toLocaleString()}` : "-"}</td>
                      <td>{property.propertyMode || "-"}</td>
                      <td>{property.locationCoordinates || "-" }</td>
                      <td>{property.totalArea ? `${property.totalArea} ${property.areaUnit}` : "-"}</td>
                      <td>{property.rentalPropertyAddress || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button
              variant="outline-primary"
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline-primary"
              onClick={() => handlePageChange("next")}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddressRequestsTable;
