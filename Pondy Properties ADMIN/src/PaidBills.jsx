 

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const FreePlansWithProperties = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [filters, setFilters] = useState({
  ppcId: '',
  phoneNumber: '',
  status: '',
  planName: '',
  billNo: '',
  expirationDate: ''
});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/bills/non-free-with-properties`);
        const fetchedData = response.data.data || [];
        setData(fetchedData);
      } catch (err) {
        setError("Error fetching Free Plan bills with properties.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
          method: "PUT",
        });
        const result = await response.json();
        alert(result.message);
      } catch (error) {
        alert("Failed to delete the property.");
      }
    }
  };

  const handleUndoDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to undo delete for PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/undo-delete-free-property/${ppcId}`, {
          method: "PUT",
        });
        const result = await response.json();
        alert(result.message);
      } catch (error) {
        alert("Failed to undo delete.");
      }
    }
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
  const filteredData = data.filter(item => {
    return item.properties.some(prop => {
      // Convert all values to strings for safe comparison
      const propPpcId = String(prop.ppcId || '');
      const propPhoneNumber = String(prop.phoneNumber || '');
      const propStatus = String(prop.status || '');
      const planName = String(item.bill?.planName || '');
      const billNo = String(item.bill?.billNo || '');
      const expirationDate = item.bill ? 
        moment(item.bill.planCreatedAt).add(item.bill.validity, 'days').format("YYYY-MM-DD") : 
        '';
      
      return (
        (filters.ppcId === '' || propPpcId.includes(filters.ppcId)) &&
        (filters.phoneNumber === '' || propPhoneNumber.includes(filters.phoneNumber)) &&
        (filters.status === '' || propStatus === filters.status) &&
        (filters.planName === '' || planName.includes(filters.planName)) &&
        (filters.billNo === '' || billNo.includes(filters.billNo)) &&
        (filters.expirationDate === '' || expirationDate === filters.expirationDate)
      );
    });
  });
const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilters(prev => ({
    ...prev,
    [name]: value
  }));
};
  const resetFilters = () => {
    setFilters({
      ppcId: '',
      phoneNumber: '',
      status: '',
      planName: '',
      billNo: '',
      expirationDate: ''
    });
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container mt-4">
        <div className="card mb-3">
  <div className="card-body">
    <div className="row">
      <div className="col-md-2">
        <label>PPC ID</label>
        <input 
          type="text" 
          className="form-control" 
          name="ppcId" 
          value={filters.ppcId}
          onChange={handleFilterChange}
        />
      </div>
      <div className="col-md-2">
        <label>Phone Number</label>
        <input 
          type="text" 
          className="form-control" 
          name="phoneNumber" 
          value={filters.phoneNumber}
          onChange={handleFilterChange}
        />
      </div>
      <div className="col-md-2">
        <label>Status</label>
 
        <select
  value={filters.status}
onChange={handleFilterChange}>
  <option value="">All Status</option>
  <option value="incomplete">Incomplete</option>
  <option value="active">Active</option>
  <option value="pending">Pending</option>
  <option value="complete">Complete</option>
  <option value="sendInterest">Send Interest</option>
  <option value="soldOut">Sold Out</option>
  <option value="reportProperties">Report Properties</option>
  <option value="needHelp">Need Help</option>
  <option value="contact">Contact</option>
  <option value="favorite">Favorite</option>
  <option value="alreadySaved">Already Saved</option>
  <option value="favoriteRemoved">Favorite Removed</option>
  <option value="delete">Delete</option>
  <option value="undo">Undo</option>
</select>

      </div>
      <div className="col-md-2">
        <label>Plan Name</label>
        <input 
          type="text" 
          className="form-control" 
          name="planName" 
          value={filters.planName}
          onChange={handleFilterChange}
        />
      </div>
      <div className="col-md-2">
        <label>Bill No</label>
        <input 
          type="text" 
          className="form-control" 
          name="billNo" 
          value={filters.billNo}
          onChange={handleFilterChange}
        />
      </div>
      <div className="col-md-2">
        <label>Expiration Date</label>
        <input 
          type="date" 
          className="form-control" 
          name="expirationDate" 
          value={filters.expirationDate}
          onChange={handleFilterChange}
        />
      </div>
       <button 
                className="btn btn-secondary mr-2"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
    </div>
  </div>
</div>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h2 className="mb-4 text-center">Free Plan Properties</h2>
   <div ref={tableRef}>   <Table striped bordered hover responsive className="table-sm align-middle">
        <thead className="sticky-top">
          <tr>
            <th>Sl. No</th>
            <th>PPC ID</th>
            <th>Phone Number</th>
            <th>Price</th>
            <th>Property Mode</th>
            <th>Property Type</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Plan Name</th>
            <th>Bill No</th>
            <th>Admin</th>
            <th>Office</th>
            <th>Plan Expiry</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, i) =>
            item.properties.map((prop, j) => (
              <tr key={`${i}-${j}`}>
                <td>{j + 1}</td>
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/dashboard/detail`, {
                      state: {
                        ppcId: prop.ppcId,
                        phoneNumber: prop.phoneNumber,
                      },
                    })
                  }
                >
                  {prop.ppcId}
                </td>
                <td>{prop.phoneNumber}</td>
                <td>₹{prop.price}</td>
                <td>{prop.propertyMode}</td>
                <td>{prop.propertyType}</td>
                <td>{prop.status}</td>
                <td>{prop.createdBy}</td>
                <td>{moment(prop.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                <td>{moment(prop.updatedAt).format("YYYY-MM-DD HH:mm")}</td>
                <td>{item.bill.planName}</td>
                <td>{item.bill.billNo}</td>
                <td>{item.bill.adminName}</td>
                <td>{item.bill.adminOffice}</td>
                <td>{moment(item.bill.planCreatedAt).add(item.bill.validity, 'days').format("YYYY-MM-DD")}</td>
                <td>
                  {prop.isDeleted ? (
                    <button className="btn btn-success btn-sm" onClick={() => handleUndoDelete(prop.ppcId)}>Undo</button>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prop.ppcId)}>Delete</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      </div> 
    </div>
  );
};

export default FreePlansWithProperties;
