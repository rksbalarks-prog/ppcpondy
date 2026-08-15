


import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { Table } from "react-bootstrap";
import moment from "moment";
import { useSelector } from "react-redux";


const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    userPhoneNumber: "",
    message: "",
    type: "message",
  });
  const [editingNotification, setEditingNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`);
      setNotifications(response.data.notifications);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchNotifications();
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
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const normalizePhone = (phone) => {
    const digits = phone.replace(/\D/g, "");
    return digits.slice(-10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const numbers = formData.userPhoneNumber
        .split(/[,\n]+/)
        .map(num => normalizePhone(num.trim()))
        .filter(num => num.length === 10);

      if (numbers.length < 1 || numbers.length > 20) {
        alert("Please enter between 1 and 20 valid phone numbers.");
        return;
      }

      const payload = {
        userPhoneNumber: numbers,
        message: formData.message,
        type: formData.type,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/send-notification`, payload);

      fetchNotifications();
      setFormData({ userPhoneNumber: "", message: "", type: "message" });
      setEditingNotification(null);
    } catch (error) {
    }
  };

  const handleEdit = (notification) => {
    setFormData({
      userPhoneNumber: notification.userPhoneNumber,
      message: notification.message,
      type: notification.type,
    });
    setEditingNotification(notification);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/notification/${id}`);
      fetchNotifications();
    } catch (error) {
    }
  };



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Notification Send"; // current file
   
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Notifications</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 shadow-md rounded-lg mb-6 w-100">

<div className="mb-4 w-full">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    User Phone Numbers <span className="text-xs text-gray-500">(comma or newline separated)</span>
  </label>
  <textarea
    name="userPhoneNumber"
    value={formData.userPhoneNumber}
    onChange={handleChange}
    rows={4}
    className="w-100 h-50 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
    placeholder="Enter 10-digit numbers, separated by comma or newline  || 
    Send Notification 1 To 100 Users"
    required
  />
</div>

<div className="mb-4 w-full">
  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
  <input
    type="text"
    name="message"
    value={formData.message}
    onChange={handleChange}
    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Enter notification message"
    required
  />
</div>

<div className="mb-4 w-full">
  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
 <select
  name="type"
  value={formData.type}
  onChange={handleChange}
  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  required
>
  <option value="">Select Type</option>
  <option value="message">Message</option>
  <option value="warning">Warning</option>
</select>

</div>

        <button type="submit" className="bg-blue-500 w-25 text-white px-4 py-2 rounded">
          {editingNotification ? "Update Notification" : "Create Notification"}
        </button>
      </form>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h3 className="mt-4 text-primary mb-3"> Notification Table </h3>
<div ref={tableRef}>
      <Table striped bordered hover responsive className="table-sm align-middle">
        <thead className="sticky-top bg-gray-100">
          <tr>
            <th>Phone Number</th>
            <th>Message</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <tr key={notification._id}>
                <td>{notification.userPhoneNumber}</td>
                <td>{notification.message}</td>
                <td>{notification.type}</td>
                <td className="flex gap-2">
                  <button onClick={() => handleEdit(notification)} className="text-info px-2 py-1">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(notification._id)} className="text-danger px-2 py-1">
                    <MdDeleteForever />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4">No notifications found.</td>
            </tr>
          )}
        </tbody>
      </Table>
      </div>
    </div>
  );
};

export default NotificationManager;



