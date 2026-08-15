


import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const BrideImageClickTable = () => {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phoneNumberFilter, setPhoneNumberFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetFilters = () => {
    setPhoneNumberFilter("");
    setStartDate("");
    setEndDate("");
  };
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
  const filteredClicks = clicks.filter((click) => {
    const matchesPhone =
      !phoneNumberFilter || click.phoneNumber.includes(phoneNumberFilter);

    const clickDate = new Date(click.clickedAt);
    const matchesStartDate = !startDate || clickDate >= new Date(startDate);
    const matchesEndDate = !endDate || clickDate <= new Date(endDate);

    return matchesPhone && matchesStartDate && matchesEndDate;
  });

  const fetchImageClicks = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-image-clicks-bride`);
      setClicks(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch image click data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImageClicks();
  }, []);
 

return (
  <div className="container mt-4">
    <h3 className="mb-4">Bride Image Click Records</h3>

    {/* 🔍 Filter Card */}
    <div className="card mb-4">
     
      <div  className="card-body">
        <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="d-flex gap-3 flex-wrap align-items-center">
          <input
            type="text"
            placeholder="Filter by Phone Number"
            value={phoneNumberFilter}
            onChange={(e) => setPhoneNumberFilter(e.target.value)}
            className="form-control"
            style={{ width: "200px" }}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control"
            style={{ width: "180px" }}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-control"
            style={{ width: "180px" }}
          />
          <button className="btn btn-secondary" onClick={resetFilters}>
            Reset
          </button>
                       <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
        </div>
      </div>
    </div>

    {/* 📊 Data Table Card */}
    <div className="card">
      <div className="card-header fs-5 text-primary">
        <strong>Click Bride Records</strong>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" />
            <p className="mt-2">Loading...</p>
          </div>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : clicks.length === 0 ? (
          <p>No records found.</p>
        ) : (
<div ref={tableRef}>            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Phone Number</th>
                  <th>Image</th>
                  <th>Clicked At</th>
                </tr>
              </thead>
              <tbody>
                {filteredClicks.length > 0 ? (
                  filteredClicks.map((click, index) => (
                    <tr key={click._id}>
                      <td>{index + 1}</td>
                      <td>{click.phoneNumber}</td>
                      <td>
                        <a
                          href={click.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={click.imageUrl}
                            alt="Clicked"
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        </a>
                      </td>
                      <td>{new Date(click.clickedAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);


};

export default BrideImageClickTable;





