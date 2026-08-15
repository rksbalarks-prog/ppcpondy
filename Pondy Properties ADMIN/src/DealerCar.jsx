
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Table } from 'react-bootstrap';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { FaEye, FaPrint } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const OwnerPostByTable = () => {
  const [ownerList, setOwnerList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [ownerRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-owner`),
      ]);

      setOwnerList(ownerRes.data.users || []); // make sure it's array
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAllData(); // Fetch fresh data on search
  };

  const filterList = (list) => {
    return list.filter(item => {
      const ppcId = String(item?.ppcId ?? '').toLowerCase();
      const phone = String(item?.phoneNumber ?? '');
      const createdAt = item?.createdAt ? new Date(item.createdAt) : null;

      const matchPPCID = search ? ppcId.includes(search.toLowerCase()) : true;
      const matchPhone = phoneSearch ? phone.includes(phoneSearch) : true;
      const matchFromDate = fromDate ? (createdAt && createdAt >= new Date(fromDate)) : true;
      const matchEndDate = endDate ? (createdAt && createdAt <= new Date(endDate)) : true;

      return matchPPCID && matchPhone && matchFromDate && matchEndDate;
    });
  };

  const renderTable = (list, title) => (
    <div style={{ marginBottom: '50px' }}>
      <h2>{title}</h2>
    <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
          <tr>
            <th>Phone Number</th>
            <th>PPC ID</th>
            <th>Property Type</th>
            <th>Property Mode</th>
            <th>Price</th>
            <th>City</th>
            <th>Area</th>
            <th>Created By</th>
            <th>Posted By</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Views</th>
                        {/* <th>Views Details</th> */}

          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? (
            list.map((item) => (
              <tr key={item._id}>
                <td>{item.phoneNumber || '-'}</td>
                <td style={{cursor: "pointer"}}
                       onClick={() => navigate(`/dashboard/detail`, {
                                            state: { ppcId: item.ppcId, phoneNumber: item.phoneNumber },
                                          })
                                        }>{item.ppcId || '-'}</td>
                <td>{item.propertyType || '-'}</td>
                <td>{item.propertyMode || '-'}</td>
                <td>{item.price || '-'}</td>
                <td>{item.city || '-'}</td>
                <td>{item.area || '-'}</td>
                <td>{item.createdBy || '-'}</td>
                <td>{item.postedBy || '-'}</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</td>
                <td><FaEye /> {item.views || 0}</td>
              
                                     </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" align="center">No Data Found</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );


  
        const printRef = useRef();
    
  
        const handlePrint = () => {
          const printContents = printRef.current.innerHTML;
          const originalContents = document.body.innerHTML;
          document.body.innerHTML = printContents;
          window.print();
          document.body.innerHTML = originalContents;
          window.location.reload(); // reload to restore event bindings
      };
  


  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "Owner Property"; // current file
   
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

  if (loading) return <p>Loading data...</p>;

  return (
    <div style={{ padding: '20px' }}>
      {/* Search Form */}
      <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
   className="d-flex flex-row gap-2 align-items-center flex-nowrap"
      >
        <div className="mb-3">
          <label htmlFor="searchInput" className="form-label fw-bold">PPC ID</label>
          <input
            type="text"
            id="searchInput"
            className="form-control"
            placeholder="Enter PPC ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="phoneInput" className="form-label fw-bold">PhoneNumber</label>
          <input
            type="text"
            id="phoneInput"
            className="form-control"
            placeholder="Enter Phone Number"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="fromDate" className="form-label fw-bold">From Date</label>
          <input
            type="date"
            id="fromDate"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="endDate" className="form-label fw-bold">End Date</label>
          <input
            type="date"
            id="endDate"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          />
        </div>

        <div className="col-md-3 d-flex align-items-end">
          <Button variant="primary" type="submit">
            Search
          </Button>
        </div>
      </form>

<p>
 <button className='bg-success text-white' onClick={handlePrint} style={{ marginRight: '10px' }}>
                    <FaPrint /> Print All
                </button>
             </p>

            <div className="table-container" ref={printRef}>

      {/* Tables */}
      {renderTable(filterList(ownerList), 'Owner Properties')}
    </div>
    </div>
  );
};

export default OwnerPostByTable;
