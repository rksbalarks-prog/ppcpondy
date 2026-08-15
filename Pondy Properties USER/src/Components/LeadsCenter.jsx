
import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const LeadsCenter = ({phoneNumber}) => {


      useEffect(() => {
        const recordDashboardView = async () => {
          try {
            await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
              phoneNumber: phoneNumber,
              viewedFile: "Lead Center",
              viewTime: new Date().toISOString(),
            });
          } catch (err) {
          }
        };
      
        if (phoneNumber) {
          recordDashboardView();
        }
      }, [phoneNumber]);
  return (
    <div className="container d-flex justify-content-center" style={{ width: '450px' }}>
      <div className="w-100">
        <h4 className="text-center"style={{ color:'#4F4B7E'}}>Download Leads</h4>
        <form>
          <div className="mb-3">
            <label htmlFor="rentId" className="form-label"style={{ color:'#4F4B7E'}}>Rent ID</label>
            <input type="text" className="form-control" id="rentId" placeholder="Enter Rent ID" />
          </div>
          <div className="mb-3">
            <label htmlFor="fromDate" className="form-label"style={{ color:'#4F4B7E'}}>From Date</label>
            <input type="date" className="form-control" id="fromDate" />
          </div>
          <div className="mb-3">
            <label htmlFor="endDate" className="form-label"style={{ color:'#4F4B7E'}}>End Date</label>
            <input type="date" className="form-control" id="endDate" />
          </div>
        </form>
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>Business Support</th>
              <th>Unread</th>
              <th>Read</th>
              <th>All</th>
            </tr>
          </thead>
          <tbody className='text-muted'>
            {[
              'Received Interest',
              'Matched Tenants',
              'Tenants Contacted',
              'Tenants Shortlisted',
              'Tenants Viewed',
            ].map((item, index) => (
              <tr key={index}>
                <td>{item}</td>
                <td><input type="checkbox" /></td>
                <td><input type="checkbox" /></td>
                <td><input type="checkbox" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center">
          <button className="btn" style={{background:"#4F4B7E", color:'#fff'}}>Download</button>
        </div>
      </div>
    </div>
  );
};

export default LeadsCenter;
