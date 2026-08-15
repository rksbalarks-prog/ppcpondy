 


import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import PhoneCell from './components/PhoneCell';

const ITEMS_PER_PAGE = 50;

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'green';
    case 'pending':
      return 'orange';
    case 'complete':
      return 'blue';
    case 'incomplete':
      return 'gray';
    case 'soldOut':
      return 'red';
    case 'sendInterest':
      return 'purple';
    case 'reportProperties':
    case 'needHelp':
      return 'darkred';
    case 'contact':
      return 'teal';
    case 'favorite':
    case 'alreadySaved':
      return 'goldenrod';
    case 'favoriteRemoved':
    case 'delete':
      return 'brown';
    case 'undo':
      return 'black';
    default:
      return 'black';
  }
};

const PropertyStatusTable = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [ppcIdFilter, setPpcIdFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ppcIdFilter, phoneFilter, fromDate, toDate, allData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-all-datas`);
      if (res.data.success) {
        setAllData(res.data.data);
        setFilteredData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
  const applyFilters = () => {
    let filtered = [...allData];

  if (ppcIdFilter.trim()) {
  filtered = filtered.filter(item => {
    const ppcIdStr = String(item.ppcId || '').toLowerCase();
    return ppcIdStr.includes(ppcIdFilter.toLowerCase());
  });
}

    if (phoneFilter.trim()) {
      filtered = filtered.filter(item => item.phoneNumber?.includes(phoneFilter));
    }

    if (fromDate) {
      filtered = filtered.filter(item => new Date(item.createdAt) >= new Date(fromDate));
    }

    if (toDate) {
      filtered = filtered.filter(item => new Date(item.createdAt) <= new Date(toDate));
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleResetFilters = () => {
  setPpcIdFilter('');
  setPhoneFilter('');
  setFromDate('');
  setToDate('');
  setFilteredData(allData);
  setCurrentPage(1);
};


  
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
   
   const fileName = "Get All Property Datas"; // current file
   
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
    <div style={{ padding: '20px' }}>
      <h2>📊 Property Status Report</h2>

      {/* Filters */}
    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
  <input
    type="text"
    placeholder="Search by PPC ID"
    value={ppcIdFilter}
    onChange={(e) => setPpcIdFilter(e.target.value)}
  />
  <input
    type="text"
    placeholder="Search by Phone Number"
    value={phoneFilter}
    onChange={(e) => setPhoneFilter(e.target.value)}
  />
  <label>
    From Date:
    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
  </label>
  <label>
    To Date:
    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
  </label>

</div>
  <button onClick={handleResetFilters} 
  className='bg-danger'>
    Reset
  </button>
             <button className="btn btn-secondary mb-3 ms-2 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className='fw-bold mt-2'>Total Records: {filteredData.length}</p>



          <div style={{ overflowX: 'auto' }}>
            <h2 className='m-3' style={{color:"purple"}}> Get Property Status Datas </h2>
 <div ref={tableRef}>          <table
              border="1"
              cellPadding="6"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                backgroundColor: '#fff',
              }}
            >
              <thead style={{ background: '#f8f8f8', position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th>#</th>
                  <th>PPC ID</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Property Mode</th>
                  <th>Property Type</th>
                  <th>Price</th>
                  <th>Property CreatedAt</th>
                  <th>Property UpdatedAt</th>
                  <th>Created By</th>
                  <th>Plan</th>
                  <th>Plan Type</th>
                  <th>Plan Created</th>
                  <th>Plan Expiry</th>
                  <th>Bill Date</th>
                  <th>Bill Expiry</th>
                  <th>FollowUp Admin</th>
                  <th>PayU Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item._id}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td
                      onClick={() =>
                        navigate(`/dashboard/detail`, {
                          state: {
                            ppcId: item.ppcId,
                            phoneNumber: item.phoneNumber,
                          },
                        })
                      }
                      style={{
                        cursor: 'pointer',
                        color: 'blue',
                        textDecoration: 'none',
                      }}
                      className="sticky-col sticky-col-1"
                    >
                      {item.ppcId}
                    </td>
                    <td><PhoneCell phone={item.phoneNumber} type="owner" ppcId={item.ppcId} /></td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: getStatusColor(item.status),
                          color: 'white',
                          fontSize: '12px',
                        }}
                      >
                        {item.status || 'N/A'}
                      </span>
                    </td>
                    <td>{item.propertyMode}</td>
                    <td>{item.propertyType}</td>
                    <td>{item.price}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                                        <td>{new Date(item.updatedAt).toLocaleString()}</td>
                    <td>{item.createdBy}</td>
                    <td>{item.planName}</td>
                    <td>{item.packageType}</td>
                    <td>{item.planCreatedAt}</td>
                    <td>{item.planExpiryDate}</td>
                    <td>{item.billDate}</td>
                    <td>{item.billExpiryDate}</td>
                    <td>{item.followUpAdminName}</td>
                    <td>{item.payUStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
</div>  
          {/* Pagination Controls */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              className="bg-warning"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                className="bg-dark text-white"
                key={i}
                onClick={() => handlePageChange(i + 1)}
                style={{
                  fontWeight: currentPage === i + 1 ? 'bold' : 'normal',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="bg-info"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyStatusTable;
