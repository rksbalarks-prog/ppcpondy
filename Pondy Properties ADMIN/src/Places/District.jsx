 
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";

const ActivePropertyFilterTable = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch state & district on mount
  useEffect(() => {
    fetchStateDistrictData();
    fetchActiveProperties();
  }, []);

  // Refetch filtered data on selection
  useEffect(() => {
    filterProperties();
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [selectedState, selectedDistrict, properties]);

  const fetchStateDistrictData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/fetch`);
      const allData = res.data.data || [];

      const stateValues = allData
        .filter(item => item.field === "state")
        .map(item => item.value);

      const districtValues = allData
        .filter(item => item.field === "district")
        .map(item => item.value);

      setStates([...new Set(stateValues)]);
      setDistricts([...new Set(districtValues)]);
    } catch (err) {
      console.error("Error fetching state/district data:", err);
    }
  };

  const fetchActiveProperties = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/active-properties-district`);
      const allData = res.data.data || [];
      setProperties(allData);
    } catch (err) {
      console.error("Error fetching active properties:", err);
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
  const filterProperties = () => {
    let filtered = properties;

    if (selectedState) {
      filtered = filtered.filter(item => item.state === selectedState);
    }

    if (selectedDistrict) {
      filtered = filtered.filter(item => item.district === selectedDistrict);
    }

    setFilteredProperties(filtered);
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredProperties.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  
      const reduxAdminName = useSelector((state) => state.admin.name);
      const reduxAdminRole = useSelector((state) => state.admin.role);
      
      const adminName = reduxAdminName || localStorage.getItem("adminName");
      const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
      
      
       const [allowedRoles, setAllowedRoles] = useState([]);
           const [loading, setLoading] = useState(true);
       
       const fileName = "District"; // current file
       
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
       
      
      
       if (!allowedRoles.includes(fileName)) {
         return (
           <div className="text-center text-red-500 font-semibold text-lg mt-10">
             Only admin is allowed to view this file.
           </div>
         );
       }

  return (
    <div style={{ padding: "20px" }}>
      <h3>Active Properties District Datas Filter</h3>

      {/* Filters */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div>
          <label>Select State:</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict("");
            }}
          >
            <option value="">-- All States --</option>
            {states.map((state, i) => (
              <option key={i} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Select District:</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="">-- All Districts --</option>
            {districts.map((district, i) => (
              <option key={i} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
                     <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      </div>

      {/* Table */}
      {currentPageData.length === 0 ? (
        <p>No matching active properties.</p>
      ) : (
        <>
        <div ref={tableRef}>
          <table border="1" cellPadding="5" cellSpacing="0" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>S.NO</th>
                <th>PPC ID</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>State</th>
                <th>District</th>
              </tr>
            </thead>
            <tbody>
              {currentPageData.map((property, i) => (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{property.ppcId}</td>
                  <td>{property.phoneNumber}</td>
                  <td>{property.status}</td>
                  <td>{property.state}</td>
                  <td>{property.district}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
          {/* Pagination Controls */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="bg-primary"
            >
              Previous
            </button>

            <span style={{ margin: "0 10px" }}>
              <strong>
              Page {currentPage} of {totalPages}
              </strong>
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="bg-success"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivePropertyFilterTable;
