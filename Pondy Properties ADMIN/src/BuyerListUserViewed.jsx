import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table } from "react-bootstrap";
import PhoneCell from "./components/PhoneCell";

const BuyerAssistViewsTable = () => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [filters, setFilters] = useState({
  ba_id: '',
  phoneNumber: '',
  viewedAtStart: '',
  viewedAtEnd: '',
});

const [filteredViews, setFilteredViews] = useState(views);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-buyer-assist-views-all`);
        setViews(res.data.views);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch buyer assist views.");
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, []);

  useEffect(() => {
  setFilteredViews(views); // Sync filteredViews with actual views
}, [views]);


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
const applyFilters = () => {
  const filtered = views.filter((view) => {
    const baIdMatch = filters.ba_id
      ? String(view.ba_id || '').includes(filters.ba_id)
      : true;

    const phoneMatch = filters.phoneNumber
      ? String(view.phoneNumber || '').includes(filters.phoneNumber)
      : true;

    const viewedAtMatch =
      filters.viewedAtStart || filters.viewedAtEnd
        ? (() => {
            const viewedDate = new Date(view.viewedAt);
            const start = filters.viewedAtStart ? new Date(filters.viewedAtStart) : null;
            const end = filters.viewedAtEnd ? new Date(filters.viewedAtEnd) : null;
            return (!start || viewedDate >= start) && (!end || viewedDate <= end);
          })()
        : true;

    return baIdMatch && phoneMatch && viewedAtMatch;
  });

  setFilteredViews(filtered);
};
const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    applyFilters();
  }
};

const handleChange = (e) => {
  const { name, value } = e.target;
  setFilters((prev) => ({ ...prev, [name]: value }));
};
const handleReset = () => {
  setFilters({
    ba_id: '',
    phoneNumber: '',
    viewedAtStart: '',
    viewedAtEnd: '',
  });
  setFilteredViews(views); // Reset to all data
};

  return (
    <div className="container mt-4">
                  <h4 className="mb-3">Quick Search</h4>

      <div 
 style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}      className="d-flex flex-row gap-2 align-items-center flex-nowrap"
>  <input
    type="text"
    name="ba_id"
    placeholder="Filter by ba_id"
    value={filters.ba_id}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
  />
  <input
    type="text"
    name="phoneNumber"
    placeholder="Filter by Phone"
    value={filters.phoneNumber}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
  />
  <input
    type="date"
    name="viewedAtStart"
    value={filters.viewedAtStart}
    onChange={handleChange}
  />
  <input
    type="date"
    name="viewedAtEnd"
    value={filters.viewedAtEnd}
    onChange={handleChange}
  />
<button 
  onClick={applyFilters} 
  style={{ backgroundColor: 'green', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px' }}
>
  Filter
</button>

<button 
  onClick={handleReset} 
  style={{ backgroundColor: 'red', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px' }}
>
  Reset
</button>

</div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h4 className="mt-4 mb-3 ">Buyer List Views User (Detailed) Table </h4>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredViews.length === 0 ? (
        <div className="alert alert-info">No buyer assist views found.</div>
      ) : (
<div ref={tableRef}>              
     <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">
              <tr>
                <th>#</th>
                
                <th className="sticky-col sticky-col-1">BA ID</th>
                <th className="sticky-col sticky-col-2">Phone</th>
                <th>Viewed At</th>
                <th>BA Name</th>
                <th>Alt Phone</th>
                <th>City</th>
                <th>Area</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Total Area</th>
                <th>Unit</th>
                <th>Bedrooms</th>
                <th>Property Mode</th>
                <th>Property Type</th>
                <th>Property Age</th>
                <th>Bank Loan</th>
                <th>Approved</th>
                <th>Facing</th>
                <th>State</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {filteredViews.map((view, index) => {
                const ba = view.ba_details || {};
                return (
                  <tr key={view._id}>
                    <td>{index + 1}</td>
                      <td className="sticky-col sticky-col-1">{view.ba_id}</td>
                    <td className="sticky-col sticky-col-2"><PhoneCell phone={view.phoneNumber} type="tenant" ba_id={view.ba_id} /></td>
                  
                    <td>{new Date(view.viewedAt).toLocaleString()}</td>
                    <td>{ba.baName || "-"}</td>
                    <td>{ba.altPhoneNumber || "-"}</td>
                    <td>{ba.city || "-"}</td>
                    <td>{ba.area || "-"}</td>
                    <td>{ba.minPrice ? `₹${ba.minPrice}` : "-"}</td>
                    <td>{ba.maxPrice ? `₹${ba.maxPrice}` : "-"}</td>
                    <td>{ba.totalArea || "-"}</td>
                    <td>{ba.areaUnit || "-"}</td>
                    <td>{ba.bedrooms || "-"}</td>
                    <td>{ba.propertyMode || "-"}</td>
                    <td>{ba.propertyType || "-"}</td>
                    <td>{ba.propertyAge || "-"}</td>
                    <td>{ba.bankLoan || "-"}</td>
                    <td>{ba.propertyApproved || "-"}</td>
                    <td>{ba.facing || "-"}</td>
                    <td>{ba.state || "-"}</td>
                    <td>{ba.ba_status || "-"}</td>
                    <td>{ba.paymentType || "-"}</td>
                    <td>{ba.description || "-"}</td>
                    <td>{new Date(ba.createdAt).toLocaleString()}</td>
                    <td>{new Date(ba.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default BuyerAssistViewsTable;
