
import axios from "axios";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useSelector } from "react-redux";

const AssistPayLater = () => {
      const [fromDate, setFromDate] = useState("");
      const [endDate, setEndDate] = useState("");
      const [search, setSearch] = useState("");

 
      const handleSubmit = (e) => {

     

        e.preventDefault();
        alert(`Search: ${search}, From Date: ${fromDate}, End Date: ${endDate}`);
      };
      const data = [
        {
          assistId: 5722,
          postedFrom: "TUC",
          ownerNumber: "572516676",
          adDetails: "Chevrolet - Cruze",
          date: "2024-08-05 11:16:29",
          action: "Resolve",
        },
        {
          assistId: 5709,
          postedFrom: "PUC",
          ownerNumber: "7695930558",
          adDetails: "Mahindra - Logan",
          date: "2024-07-25 12:22:28",
          action: "Resolve",
        },
      ];
    


      const reduxAdminName = useSelector((state) => state.admin.name);
      const reduxAdminRole = useSelector((state) => state.admin.role);
      
      const adminName = reduxAdminName || localStorage.getItem("adminName");
      const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
      
      
       const [allowedRoles, setAllowedRoles] = useState([]);
           const [loading, setLoading] = useState(true);
       
       const fileName = "Assistant PayLater"; // current file
       
       // Sync Redux to localStorage
       useEffect(() => {
         if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
         if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
       }, [reduxAdminName, reduxAdminRole]);
       
       // Record dashboard view
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
           }
         };
       
         if (adminName && adminRole) {
           recordDashboardView();
         }
       }, [adminName, adminRole]);
       
       // Fetch role-based permissions
       useEffect(() => {
         const fetchPermissions = async () => {
           try {
             const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
             const rolePermissions = res.data.find((perm) => perm.role === adminRole);
             const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
             setAllowedRoles(viewed);
           } catch (err) {
           } finally {
             setLoading(false);
           }
         };
       
         if (adminRole) {
           fetchPermissions();
         }
       }, [adminRole]);
       
      
       if (loading) return <p>Loading...</p>;
      
       if (!allowedRoles.includes(fileName)) {
         return (
           <div className="text-center text-red-500 font-semibold text-lg mt-10">
             Only admin is allowed to view this file.
           </div>
         );
       }

  return (
    <> 
     
    <div className="d-flex justify-content-between align-items-center mb-3">
    <h4>Manage Assist Pay Later
    </h4> 
    <button className="btn" style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>    </div>
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
    <div className="table-responsive">
    <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
          <tr>
            <th>Assist ID</th>
            <th>Posted From</th>
            <th>Owner Number</th>
            <th>Ad Details</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.assistId}>
              <td>{item.assistId}</td>
              <td>{item.postedFrom}</td>
              <td>{item.ownerNumber}</td>
              <td>{item.adDetails}</td>
              <td>{item.date}</td>
              <td>
                <button className="btn btn-primary btn-sm">{item.action}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
    </>
  );
};

export default AssistPayLater;
