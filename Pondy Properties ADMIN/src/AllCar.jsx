
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import moment from 'moment';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Table } from 'react-bootstrap';

const AllCar = () => {
     const [fromDate, setFromDate] = useState("");
      const [endDate, setEndDate] = useState("");
      const [search, setSearch] = useState("");
    
      const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Search: ${search}, From Date: ${fromDate}, End Date: ${endDate}`);
      };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "All Property",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);

  const data = [
    {
      sNo: 1,
      pucId: 8334,
      carImage: '',
      carStatus: 'Incomplete',
      postedFrom: 'PUC',
      carTitle: '',
      carPrice: 0,
      carKm: 0,
      fuelType: '',
      regState: 0,
      mobileNumber: '8667892976',
      submitBy: '',
      carNumber: '',
      submitDate: '',
      adsType: '',
      action: ''
    },
    {
      sNo: 2,
      pucId: 8333,
      carImage: '',
      carStatus: 'Incomplete',
      postedFrom: 'TUC',
      carTitle: '',
      carPrice: 0,
      carKm: 0,
      fuelType: '',
      regState: 0,
      mobileNumber: '8121920068',
      submitBy: '',
      carNumber: '',
      submitDate: '',
      adsType: '',
      action: ''
    }
  ];

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
    <div className="d-flex justify-content-between align-items-center mb-3">
    <h4>Manage All Cars

    </h4>  <button className="btn"style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>
    </div>
    <div className="container mt-5">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="searchInput" className="form-label">
            Search
          </label>
          <input
            type="text"
            id="searchInput"
            className="form-control"
            placeholder="Enter search term"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      {/* From Date Field */}
      <div className="mb-3">
          <label htmlFor="fromDate" className="form-label">
            From Date
          </label>
          <input
            type="date"
            id="fromDate"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        {/* End Date Field */}
        <div className="mb-3">
          <label htmlFor="endDate" className="form-label">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" style={{background:"#5F9EA0", color:"#fff", border:'none'}}>
          Submit
        </button>
      </form>
    </div>
    <div className="container mt-4">
    <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
          <tr>
            <th>S. NO</th>
            <th>PUC ID</th>
            <th>Car Image</th>
            <th>Car Status</th>
            <th>Posted From</th>
            <th>Car Title</th>
            <th>Car Price</th>
            <th>Car Km</th>
            <th>Fuel Type</th>
            <th>Reg State</th>
            <th>Mobile Number</th>
            <th>Submit By</th>
            <th>Car Number</th>
            <th>Submit Date</th>
            <th>Ads Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, index) => (
            <tr key={index}>
              <td>{item.sNo}</td>
              <td>{item.pucId}</td>
              <td><img src={item.carImage || 'placeholder.jpg'} alt="Car" className="img-thumbnail" style={{ width: '100px', height: 'auto' }} /></td>
              <td>{item.carStatus}</td>
              <td>{item.postedFrom}</td>
              <td>{item.carTitle}</td>
              <td>{item.carPrice}</td>
              <td>{item.carKm}</td>
              <td>{item.fuelType}</td>
              <td>{item.regState}</td>
              <td>{item.mobileNumber}</td>
              <td>{item.submitBy}</td>
              <td>{item.carNumber}</td>
              <td>{item.submitDate}</td>
              <td>{item.adsType}</td>
              <td>
                <button className="btn btn-primary btn-sm me-2">View</button>
                <button className="btn btn-success btn-sm me-2">Edit</button>
                <button className="btn btn-danger btn-sm">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <nav>
        <ul className="pagination justify-content-center">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <li
              key={pageNumber}
              className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}
            >
              <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                {pageNumber}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
    </>
  );
};

export default AllCar;
