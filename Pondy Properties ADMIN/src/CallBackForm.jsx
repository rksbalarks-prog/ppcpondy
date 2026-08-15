


import axios from "axios";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const CallBackForm = () => {
      const [fromDate, setFromDate] = useState("");
      const [endDate, setEndDate] = useState("");
      const [search, setSearch] = useState("");

      
    
      const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Search: ${search}, From Date: ${fromDate}, End Date: ${endDate}`);
      };
      const data = [
        {
          id: 874,
          name: "umeiDzHDPzsyc",
          date: "2025-01-08 21:18:28",
          email: "migereviguma12@gmail.com",
          mobileNumber: "7501264380",
          subject: "kzjwvFCtU",
          message: "",
          action: "Resolve",
        },
        {
          id: 873,
          name: "ZDyZTLguXHU",
          date: "2025-01-07 19:31:13",
          email: "dwfuxap94ebsib@yahoo.com",
          mobileNumber: "8405946168",
          subject: "wXiKjfDLjQWVV",
          message: "",
          action: "Resolve",
        },
        {
          id: 872,
          name: "bwnJGJYuz",
          date: "2025-01-06 17:44:52",
          email: "odrellscamoi@yahoo.com",
          mobileNumber: "8759450698",
          subject: "mLIPOxFCGn",
          message: "",
          action: "Resolve",
        },
      ];



      const reduxAdminName = useSelector((state) => state.admin.name);
      const reduxAdminRole = useSelector((state) => state.admin.role);
      
      const adminName = reduxAdminName || localStorage.getItem("adminName");
      const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
      
      
       const [allowedRoles, setAllowedRoles] = useState([]);
           const [loading, setLoading] = useState(true);
       
       const fileName = "Call Back Form"; // current file
       
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
    <h4>Manage CallBack Form
    </h4>  <button className="btn" style={{background:"#2EA44F", color:"#fff", border:'none'}}>EXPORT WITH OTP VERIFICATION</button>
    </div>
    <div className="container mt-5">
      <h2 className="mb-4">User Logs</h2>
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
        <button  type="submit" style={{background:"#E91E63", color:"#fff", border:'none'}}>
          Submit
        </button>
      </form>
    </div>
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead className="thead-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Date</th>
            <th>Email</th>
            <th>Mobile Number</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.date}</td>
              <td>{item.email}</td>
              <td>{item.mobileNumber}</td>
              <td>{item.subject}</td>
              <td>{item.message || "N/A"}</td>
              <td>
                <button className="btn btn-primary btn-sm">{item.action}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default CallBackForm;
