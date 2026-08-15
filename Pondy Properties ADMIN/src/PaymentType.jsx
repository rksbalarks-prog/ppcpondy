



import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Col, Row, Table } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { MdDeleteForever } from 'react-icons/md';
import { FaEdit } from 'react-icons/fa';

const PaymentTypeManager = () => {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentType, setPaymentType] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [selected, setSelected] = useState(null);
  const tableRef = useRef();

  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment-all`);
      setPaymentTypes(res.data);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item) => {
    setSelected(item);
    setPaymentType(item.paymentType);
    setCreatedDate(item.createdDate.slice(0, 10));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment type?')) {
      await axios.delete(`${process.env.REACT_APP_API_URL}/payment-delete/${id}`);
      fetchData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await axios.put(`${process.env.REACT_APP_API_URL}/payment-update/${selected._id}`, {
          paymentType,
          createdDate,
        });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/payment-create`, {
          paymentType,
          createdDate,
        });
      }
      setPaymentType('');
      setCreatedDate('');
      setSelected(null);
      fetchData();
    } catch (err) {
    }
  };

  const handlePrint = () => {
    const printContents = tableRef.current.innerHTML;
    const win = window.open('', '', 'width=900,height=650');
    win.document.write(`
      <html>
        <head>
          <title>Print Payment Types</title>
          <style>
            table, th, td {
              border: 1px solid black;
              border-collapse: collapse;
              padding: 8px;
            }
            table {
              width: 100%;
              font-family: Arial, sans-serif;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  
  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Payment Type"; // current file
   
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
    <div style={{ padding: '20px',  margin: 'auto' }}>
      <h2>{selected ? 'Update Payment Type' : 'Create Payment Type'}</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
  <Row className="g-2 align-items-end">
    <Col md={4}>
      <input
        type="text"
        className="form-control"
        placeholder="Payment Type"
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value)}
        required
      />
    </Col>
    <Col md={4}>
      <input
        type="date"
        className="form-control"
        value={createdDate}
        onChange={(e) => setCreatedDate(e.target.value)}
        required
      />
    </Col>
    <Col md="auto">
      <button type="submit" className="btn btn-primary">
        {selected ? 'Update' : 'Create'}
      </button>
    </Col>
    {selected && (
      <Col md="auto">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setSelected(null);
            setPaymentType('');
            setCreatedDate('');
          }}
        >
          Cancel
        </button>
      </Col>
    )}
  </Row>
</form>


      <div>

      <button className='bg-success text-white' onClick={handlePrint} style={{ marginBottom: '10px', padding: '6px 12px' }}>
          🖨️ Print
        </button>
        
        <h2>Plan Details</h2>
     
        <div ref={tableRef}>
        <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
              <tr>
                <th>Sl</th>
                <th>Payment Type</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentTypes.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.paymentType}</td>
                  <td>{item.createdDate.slice(0, 10)}</td>
                  <td>
                    <button className='fs-5 text-primary' onClick={() => handleEdit(item)}><FaEdit /></button>
                    <button className='fs-5 text-danger' onClick={() => handleDelete(item._id)} style={{ marginLeft: '10px' }}>
                      <MdDeleteForever />
                    </button>
                  </td>
                </tr>
              ))}
              {paymentTypes.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PaymentTypeManager;
