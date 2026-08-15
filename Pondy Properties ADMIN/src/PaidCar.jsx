








import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import { MdDeleteForever } from "react-icons/md";

const FreePlansWithProperties = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
    const [billNo, setBillNo] = useState("");

  const navigate = useNavigate();

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fetch-all-paid-plans`
      );
      const rawData = response.data.data || [];

      // Flatten properties with parent info
      const allProperties = rawData.flatMap((item) =>
        item.properties.map((prop) => ({
          ...prop,
          user: item.user,         // keep parent info
          parentCreatedAt: item.createdAt,
          parentUpdatedAt: item.updatedAt,
        }))
      );

      // Sort by latest updatedAt or createdAt
      const sortedProperties = allProperties.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || a.parentUpdatedAt || a.parentCreatedAt);
        const dateB = new Date(b.updatedAt || b.createdAt || b.parentUpdatedAt || b.parentCreatedAt);
        return dateB - dateA; // newest first
      });

      setData(sortedProperties);
      setFilteredData(sortedProperties);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


// ✅ Utility: pick latest date from plan + properties
const getLatestDate = (item) => {
  let latestDate = new Date(item.updatedAt || item.createdAt || 0);

  if (item.properties && item.properties.length > 0) {
    item.properties.forEach((p) => {
      const createdAt = new Date(p.createdAt || 0);
      const updatedAt = new Date(p.updatedAt || 0);
      const maxDate = createdAt > updatedAt ? createdAt : updatedAt;
      if (maxDate > latestDate) latestDate = maxDate;
    });
  }

  return latestDate;
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
  // Filter data based on user input.
  // `data` is already flattened upstream (each item IS a property with parent
  // info merged in via `user`, `parentCreatedAt`, etc.), so we filter the
  // flat array directly rather than walking item.properties.
const handleSearch = () => {
  const term = (searchTerm || "").toLowerCase();
  const billTerm = (billNo || "").toLowerCase();

  const filtered = data.filter((property) => {
    const ppcIdMatch = term
      ? String(property.ppcId || "").toLowerCase().includes(term)
      : true;
    const phoneNumberMatch = term
      ? String(property.phoneNumber || "").toLowerCase().includes(term)
      : true;
    const termMatch = term ? (ppcIdMatch || phoneNumberMatch) : true;

    const billNoMatch = billTerm
      ? String(property.user?.billNo || "").toLowerCase().includes(billTerm)
      : true;

    const createdAt = new Date(property.createdAt);
    const startMatch = startDate ? createdAt >= new Date(startDate) : true;
    const endMatch = endDate ? createdAt <= new Date(endDate + "T23:59:59") : true;

    return termMatch && billNoMatch && startMatch && endMatch;
  });

  setFilteredData(filtered);
};
const handleReset = () => {
  setSearchTerm("");
  setBillNo("");
  setStartDate("");
  setEndDate("");
  setFilteredData(data); // Reset to original data
};

  
  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);

        // Data is flat (each item is a property); update in place.
        setData(prevData =>
          prevData.map(property =>
            property.ppcId === ppcId ? { ...property, isDeleted: true } : property
          )
        );

        setFilteredData(prevData =>
          prevData.map(property =>
            property.ppcId === ppcId ? { ...property, isDeleted: true } : property
          )
        );
      } catch (error) {
        alert('Failed to delete the property.');
      }
    }
  };
  

  const handleUndoDelete = async (ppcId) => {
  if (window.confirm(`Are you sure you want to undo delete for PPC ID: ${ppcId}?`)) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/undo-delete-free-property/${ppcId}`, {
        method: 'PUT',
      });
      const data = await response.json();
      alert(data.message);

      // Optimistically update the local state
      setFilteredData(prevData =>
        prevData.map(property =>
          property.ppcId === ppcId ? { ...property, isDeleted: false } : property
        )
      );
    } catch (error) {
      alert('Failed to undo delete.');
    }
  }
};


  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "Paid Property"; // current file
   
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

  // if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container">
      <h1 className="my-4 text-center">Paid Properties</h1>

      {/* Search Form */}
      <form onSubmit={(e) => e.preventDefault()}
       className="d-flex flex-row gap-2 align-items-center flex-nowrap"
       >
  <div className="mb-3">
    <label className="form-label fw-bold">PPC ID / Phone</label>
    <input
      type="text"
      placeholder="Search by PPC ID or Phone"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  <div className="mb-3">
    <label className="form-label fw-bold">Bill No</label>
    <input
      type="text"
      placeholder="Search by Bill No"
      value={billNo}
      onChange={(e) => setBillNo(e.target.value)}
    />
  </div>

  <div className="mb-3">
    <label className="form-label fw-bold">Start Date</label>
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </div>

  <div className="mb-3">
    <label className="form-label fw-bold">End Date</label>
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </div>

  <button type="button" className="btn btn-primary" onClick={handleSearch}>
    Search
  </button>

  <button type="button" className="btn btn-secondary" onClick={handleReset}>
    Reset
  </button>
</form>

             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h3 className="mt-4 mb-4 text-primary">Paid Properties datas</h3> 
    
 <div ref={tableRef}>
      <Table striped bordered hover responsive className="table-sm align-middle">
      <thead className="sticky-top">
    <tr>
      <th>Sl. No</th>
      <th>Image</th>
      <th className="sticky-col sticky-col-1">PPC ID</th>
      {/* <th className="sticky-col sticky-col-2">Phone Number</th> */}
      <th>Property Mode</th>
      <th>Property Type</th>
      <th>Price</th>
      <th>City</th>
      <th>Created By</th>
      <th>Created At</th>
      <th>Updated At</th>
      <th>Mandatory</th>
      <th>No. of Ads</th>
      <th>Status</th>
      <th>Plan Name</th>
      {/* <th>View Details</th> */}
      <th>Follow Up</th>
      <th>Bill No</th>
      <th>Set Feature</th>
      {/* <th>Set PPC</th> */}
      <th>APP BY</th>
      <th>Bill DATE</th>
      <th>EXPIRED DATE</th>
      <th>Action</th>
    </tr>
  </thead>
  


<tbody>
  {filteredData.map((property, index) => (
    <tr key={property.ppcId}>
      <td>{index + 1}</td>
      <td>
        <img
          src={
            property.photos?.length
              ? `https://ppcpondy.com/PPC/${property.photos[0]}`
              : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
          }
          alt="Property"
          style={{ width: "50px", height: "50px", objectFit: "cover" }}
        />
      </td>
      <td
        style={{ cursor: "pointer" }}
        onClick={() =>
          navigate(`/dashboard/detail`, {
            state: { ppcId: property.ppcId, phoneNumber: property.phoneNumber },
          })
        }
        className="sticky-col sticky-col-1"
      >
        {property.ppcId}
      </td>
      <td>{property.propertyMode || "N/A"}</td>
      <td>{property.propertyType || "N/A"}</td>
      <td>₹{property.price}</td>
      <td>{property.streetName || "N/A"}</td>
      <td>{property.createdBy}</td>
      <td>{new Date(property.createdAt).toLocaleString()}</td>
      <td>{new Date(property.updatedAt).toLocaleString()}</td>
      <td>{property.required}</td>
      <td>{property.user?.adsCount}</td>
      <td>{property.status}</td>
      <td>{property.user?.planName}</td>
      <td>{property.user?.adminName}</td>
      <td>{property.user?.billNo}</td>
      <td>{property.featureStatus}</td>
      <td>{property.user?.billCreatedBy}</td>
      <td>{new Date(property.user?.billCreatedAt).toLocaleString()}</td>
      <td>{new Date(property.user?.planExpiryDate).toLocaleDateString()}</td>
      <td>
        {property.isDeleted ? (
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleUndoDelete(property.ppcId)}
          >
            Undo
          </button>
        ) : (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(property.ppcId)}
          >
            <MdDeleteForever />
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>




</Table>
</div>
    </div>
  );
};

export default FreePlansWithProperties;















































