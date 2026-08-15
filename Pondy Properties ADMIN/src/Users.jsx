import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import { Table, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import AdminForm from "./AdminForm";

const Users = () => {
              
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Users",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  const staffData = [
    { id: 1, name: "PARAMESHWARI", office: "AUROBINDO", username: "diviauro", password: "divya19497", role: "Manager", mobile: "8124827429", otp: 0 },
    { id: 2, name: "MONIHA", office: "AUROBINDO", username: "MONIHA", password: "MONI@PM", role: "Manager", mobile: "9786362362", otp: 0 },
    { id: 3, name: "sathish", office: "AUROBINDO", username: "sathish", password: "ssk@1850", role: "Admin", mobile: "9894061868", otp: 689905 },
    { id: 4, name: "Balarks", office: "AUROBINDO", username: "balarks", password: "bbg@2334455", role: "Admin", mobile: "9944244409", otp: 689905 },
    { id: 5, name: "punkuzhali", office: "AUROBINDO", username: "vallavan", password: "pm@1980", role: "Admin", mobile: "8608435347", otp: 689905 },
    { id: 6, name: "Suganya", office: "AUROBINDO", username: "sug@puc", password: "sug@750", role: "Manager", mobile: "6385580750", otp: 0 },
    { id: 7, name: "DEEPIKA", office: "AUROBINDO", username: "deep@auro", password: "vkypri", role: "Manager", mobile: "8111022555", otp: 0 },
    { id: 8, name: "Ashwitha", office: "AUROBINDO", username: "ash@auro", password: "ash@362362", role: "Manager", mobile: "9786362362", otp: 0 },
    { id: 9, name: "Malini", office: "AUROBINDO", username: "mal@auro", password: "mal@rpl123", role: "Manager", mobile: "9876543210", otp: 0 },
    { id: 10, name: "GANESH", office: "AUROBINDO", username: "GANESH", password: "2096", role: "Admin", mobile: "9600902096", otp: 689905 },
    { id: 11, name: "PARAMESHWARI", office: "AUROBINDO", username: "diviauro", password: "divya19497", role: "Manager", mobile: "8124827429", otp: 0 },
    { id: 12, name: "MONIHA", office: "AUROBINDO", username: "MONIHA", password: "MONI@PM", role: "Manager", mobile: "9786362362", otp: 0 },
    { id: 13, name: "sathish", office: "AUROBINDO", username: "sathish", password: "ssk@1850", role: "Admin", mobile: "9894061868", otp: 689905 },
    { id: 14, name: "Balarks", office: "AUROBINDO", username: "balarks", password: "bbg@2334455", role: "Admin", mobile: "9944244409", otp: 689905 },
    { id: 15, name: "punkuzhali", office: "AUROBINDO", username: "vallavan", password: "pm@1980", role: "Admin", mobile: "8608435347", otp: 689905 },
  ];

  return (
    <div className="container mt-4">
        <AdminForm />

      <h4 className="mb-3 mt-4  text-danger">Staff Details</h4>
      <div className="mb-3">
        <a href="#" className="text-primary me-3">Export All to excel</a>
        <a href="#" className="text-primary">Print All to print</a>
      </div>

       <Table striped bordered hover responsive className="table-sm align-middle">
                     <thead className="sticky-top">
          <tr>
            <th>Sl</th>
            <th>Staff Name</th>
            <th>Office</th>
            <th>Username</th>
            <th>Password</th>
            <th>Roles</th>
            <th>Mobile Number</th>
            <th>Export OTP</th>
            <th>Edit / Delete</th>
          </tr>
        </thead>
        <tbody>
          {staffData.map((staff, index) => (
            <tr key={staff.id}>
              <td>{index + 1}</td>
              <td>{staff.name}</td>
              <td>{staff.office}</td>
              <td>{staff.username}</td>
              <td>{staff.password}</td>
              <td>{staff.role}</td>
              <td>{staff.mobile}</td>
              <td>{staff.otp}</td>
              <td>
              <td>
                    <Button variant="link">✏️</Button>
                    <Button variant="link">🗑️</Button>
                  </td>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      

     
    </div>
  );
};

export default Users;
