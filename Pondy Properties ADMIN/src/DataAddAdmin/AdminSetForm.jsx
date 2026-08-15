





import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table } from "react-bootstrap";

function AdminSetForm() {
  const [formData, setFormData] = useState({
    propertyMode: "",
    propertyType: "",
    bankLoan: "",
    negotiation: "",
    ownership: "",
    bedrooms: "",
    kitchen: "",
    kitchenType: "",
    balconies: "",
    floorNo: "",
    areaUnit: "",
    propertyApproved: "",
    propertyAge: "",
    postedBy: "",
    facing: "",
    salesMode: "",
    salesType: "",
    furnished: "",
    lift: "",
    attachedBathrooms: "",
    western: "",
    numberOfFloors: "",
    carParking: "",
    bestTimeToCall: "",
  district: "", 
    minPrice:"",
    maxPrice:"",
    paymentType:"",
    state:""
  });

 


  const [excelFile, setExcelFile] = useState(null);

  const [dataList, setDataList] = useState([]);
  const [activeField, setActiveField] = useState("propertyMode");

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch`);
      setDataList(response.data.data || []);
    } catch (error) {
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  
  // Handle Excel File Selection
  const handleFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  // Upload Excel File
  const handleUploadExcel = async () => {
    if (!excelFile) {
      alert("Please select an Excel file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile); // This should match 'file' in backend


    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload-excel`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert(response.data.message);
      fetchData(); // Refresh the table if needed
    } catch (error) {
    }
  };


  const handleAddField = async () => {
    if (!formData[activeField]) {
      alert(`Please enter a value for ${activeField}`);
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/add`, {
        field: activeField,
        value: formData[activeField],
      });

      alert(`${activeField} added successfully!`);
      setFormData({ ...formData, [activeField]: "" });
      fetchData();
    } catch (error) {
    }
  };

  const handleEditField = async (field, value) => {
    const newValue = prompt(`Enter the updated value for ${field}:`);
    if (!newValue) return;

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/update`, {
        field,
        value,
        newValue,
      });

      alert(`${field} updated successfully!`);
      fetchData();
    } catch (error) {
    }
  };

  const handleDeleteField = async (field, value) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${field}?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/delete`, {
        data: { field, value },
      });

      alert(`${field} deleted successfully!`);
      fetchData();
    } catch (error) {
    }
  };

  const handleSetActiveField = (field) => {
    setActiveField(field);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [activeField]);



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   const [loading, setLoading] = useState(true);
   
   const fileName = "AdminSetForm"; // current file
   
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
    <div className="container mt-4">
      <h1 className="mb-4 text-center">Property Management</h1>


<div className="col-md-6">
<label className="form-label">Upload Excel File:</label>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      border: "2px dashedr gba(10, 90, 129, 0.72)",
      padding: "15px",
      borderRadius: "10px",
      backgroundColor: "#f8f9fa",
      cursor: "pointer",
      justifyContent: "center",
      flexDirection: "column",
      textAlign: "center",
    }}
    onClick={() => document.getElementById("excelFile").click()}
  >
    <i className="bi bi-file-earmark-arrow-up" style={{ fontSize: "2rem", color: "#007bff" }}></i>
    <span style={{ fontSize: "1rem", color: "#333" }}>Click to upload Excel file</span>
    <input
      type="file"
      id="excelFile"
      accept=".xlsx, .xls"
      onChange={handleFileChange}
      style={{ display: "none" }}
    />
  </div>
</div>


      <div className="col-md-6 d-flex align-items-end">
        <button className="btn mt-3 btn-success" onClick={handleUploadExcel}>
          Upload Excel
        </button>
      </div>

      <div className="row mb-4  mt-4">
        <div className="col-md-6">
          <label className="form-label">Select Field to Manage:</label>
          <select
            className="form-select"
            value={activeField}
            onChange={(e) => handleSetActiveField(e.target.value)}
          >
            {Object.keys(formData).map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">
            {activeField.charAt(0).toUpperCase() + activeField.slice(1)}:
          </label>
          <div className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              name={activeField}
              value={formData[activeField] || ""}
              onChange={handleFieldChange}
            />
          
          </div>
          
        </div>
       
      </div>
      <button className="btn" style={{backgroundColor:"#0b5f7b",color:"white"}} type="button" onClick={handleAddField}>
              Add {activeField}
            </button>

      <h2 className="mb-3 mt-3">Manage {activeField.charAt(0).toUpperCase() + activeField.slice(1)}</h2>
      <div className="table-responsive">
      <Table striped bordered hover responsive className="table-sm align-middle">
      <thead className="sticky-top">
            <tr>
              <th>ID</th>
              <th>{activeField}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataList
              .filter((item) => item.field === activeField)
              .map((item) => (
                <tr key={item._id}>
                  <td>{item._id}</td>
                  <td>{item.value}</td>
          
                                <td>
                                    <span className="edit text-primary" onClick={() => handleEditField(item.field, item.value)}> <FaEdit /></span>
                                    <span className="delete text-danger fs-5" onClick={() => handleDeleteField(item.field, item.value)}><MdDeleteForever /></span>
                                </td>

                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default AdminSetForm;
