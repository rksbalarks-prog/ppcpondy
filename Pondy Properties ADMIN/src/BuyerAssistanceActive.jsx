

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Table, Badge, Modal, Button } from 'react-bootstrap';
import { FaTrash, FaUndo, FaInfoCircle, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import PhoneCell from "./components/PhoneCell";

const BuyerAssistanceActive = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baId, setBaId] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [billHistory, setBillHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/baActive-buyerAssistance-all-plans`);
      // Deleted records belong on the Removed Buyer Assistant page only —
      // drop them here so this page shows active requests exclusively.
      const activeOnly = (res.data.data || []).filter((item) => !item.isDeleted);
      const sorted = [...activeOnly].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setData(sorted);
      setFilteredData(sorted);
    } catch (error) {
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
  const handleFilter = () => {
    let filtered = data;

    if (phoneNumber) {
      filtered = filtered.filter(item =>
        item.phoneNumber.includes(phoneNumber)
      );
    }
  if (baId) {
    filtered = filtered.filter(item =>
      String(item.ba_id || '').includes(baId)
    );
  }

    // Use the BA record's own createdAt (not planDetails.planCreatedAt which is a
    // locale-formatted string and parses unreliably). Parse the YYYY-MM-DD picker
    // value into a LOCAL date — `new Date("YYYY-MM-DD")` parses as UTC, which can
    // shift the bound by a day. Normalize start/end to the full day so picking the
    // same date for both bounds still includes that day's records.
    const parseLocalDate = (value, endOfDay) => {
      const [y, m, d] = String(value).split("-").map(Number);
      if (!y || !m || !d) return null;
      return endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59, 999)
        : new Date(y, m - 1, d, 0, 0, 0, 0);
    };

    const start = startDate ? parseLocalDate(startDate, false) : null;
    const end = endDate ? parseLocalDate(endDate, true) : null;

    if (start || end) {
      filtered = filtered.filter(item => {
        if (!item.createdAt) return false;
        const createdAt = new Date(item.createdAt);
        if (isNaN(createdAt.getTime())) return false;
        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;
        return true;
      });
    }

    setFilteredData(filtered);
  };

const handleReset = () => {
  setPhoneNumber('');
  setBaId('');
  setStartDate('');
  setEndDate('');
  setFilteredData(data); // Reset to original data
};

 
const handleSoftDelete = async (_id) => {
  if (!window.confirm("Are you sure you want to delete this request?")) return;

  try {
    await axios.put(`${process.env.REACT_APP_API_URL}/delete-buyer-assistances/${_id}`);
    alert("Buyer Assistance request deleted successfully.");

    // Drop the row from this page — soft-deleted records live in the
    // Removed Buyer Assistant page now and shouldn't linger here.
    setData(prevData => prevData.filter(item => item._id !== _id));
    setFilteredData(prevData => prevData.filter(item => item._id !== _id));
  } catch (error) {
    alert(`Error deleting Buyer Assistance: ${error.response?.data?.message || error.message}`);
  }
};

const handleUndoDelete = async (_id) => {
  if (!window.confirm("Are you sure you want to restore this request?")) return;

  try {
    await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-buyer-assistances/${_id}`);
    alert("Buyer Assistance request restored successfully.");

    setData(prevData =>
      prevData.map(item =>
        item._id === _id ? { ...item, isDeleted: false } : item
      )
    );

    setFilteredData(prevData =>
      prevData.map(item =>
        item._id === _id ? { ...item, isDeleted: false } : item
      )
    );
  } catch (error) {
    alert(`Error restoring Buyer Assistance: ${error.response?.data?.message || error.message}`);
  }
};

const handleEdit = (ba_id) => {
  navigate("/dashboard/edit-buyer-assistance", { state: { ba_id: ba_id } });
};

const handleEditBill = (ba_id) => {
  navigate(`/dashboard/edit-buyer-bill/${ba_id}`);
};

const handleViewBillHistory = async (ba_id) => {
  setLoadingHistory(true);
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-get-bill/${ba_id}`);
    if (res.data.success) {
      setBillHistory(res.data.data);
      setShowHistoryModal(true);
    } else {
      alert('Bill history not found for this BA ID');
    }
  } catch (error) {
    alert(`Error fetching bill history: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoadingHistory(false);
  }
};



  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Buyer Assistance Search</h2>

      {/* Filter Form */}
      <form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}}
        onSubmit={(e) => {
          e.preventDefault();
          handleFilter();
        }}
 className="d-flex flex-row gap-2 align-items-center flex-nowrap"      >

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="Enter Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
      

        <div className="mt-4 text-right">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
          >
            Apply Filters
          </button>

            <button
type="button"
onClick={handleReset}
   className="btn btn-primary ms-2 text-white px-6 py-2 rounded shadow"
          >
            Reset
          </button>
        </div>
      </form>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-3 mt-3">
        <button className="btn btn-secondary" style={{ background: "tomato" }} onClick={handlePrint}>
          Print
        </button>
        <span style={{ background: "#6c757d", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
          Total: {data.length} Records
        </span>
        <span style={{ background: "#007bff", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
          Showing: {filteredData.length} Records
        </span>
      </div>
      {/* Data Table */}
      <div className="overflow-x-auto mt-1 mb-3">
        <h3 className="text-primary">All Buyer Assistance With Plan Data</h3>
 <div ref={tableRef}>      <Table striped bordered hover responsive className="table-sm align-middle">
          <thead className="sticky-top">
            <tr>
              <th className="border px-4 py-2">Ba_Id</th>
              <th className="border px-4 py-2">Phone Number</th>
              <th className="border px-4 py-2">Buyer Name</th>
              <th className="border px-4 py-2">Property Mode</th>
              <th className="border px-4 py-2">Property Type</th>
              <th className="border px-4 py-2">Min Price</th>
              <th className="border px-4 py-2">Max Price</th>
              <th className="border px-4 py-2">Payment Type</th>
              <th className="border px-4 py-2">Created At</th>
              <th className="border px-4 py-2">Added By</th>
              <th className="border px-4 py-2">Duration (Days)</th>
              <th className="border px-4 py-2">Expiry Date</th>
              <th className="border px-4 py-2">Package Type</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
              <th className="border px-4 py-2">Edit Bill</th>
              <th className="border px-4 py-2">Edit Bill History</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="text-center">
                <td className="border px-4 py-2">{item.ba_id}</td>
                <td className="border px-4 py-2"><PhoneCell phone={item.phoneNumber} type="tenant" ba_id={item.ba_id} /></td>
                <td className="border px-4 py-2">{item.baName}</td>
                <td className="border px-4 py-2">{item.propertyMode}</td>
                <td className="border px-4 py-2">{item.propertyType}</td>
                <td className="border px-4 py-2">{item.minPrice}</td>
                <td className="border px-4 py-2">{item.maxPrice}</td>

                <td className="border px-4 py-2">{item.planDetails.planType}</td>
                <td className="border px-4 py-2">
                  {item.createdAt
                    ? moment(item.createdAt).format("DD-MM-YYYY HH:mm")
                    : "N/A"}
                </td>
                <td className="border px-4 py-2">{item.addedBy || item.adminName || "-"}</td>
                <td className="border px-4 py-2">{item.planDetails.durationDays}</td>
                <td className="border px-4 py-2">{item.planDetails.planExpiryDate}</td>
                <td className="border px-4 py-2">{item.planDetails.packageType}</td>
              

<td className="border px-4 py-2">
  {item.isDeleted ? (
    <Badge bg="danger" className="d-flex align-items-center justify-content-center">
      <FaTrash className="me-1" /> Deleted
    </Badge>
  ) : (
    <Badge bg="success" className="d-flex align-items-center justify-content-center">
      <FaInfoCircle className="me-1" /> baActive
    </Badge>
  )}
</td>
 

<td className="border px-4 py-2">
  {item.isDeleted ? (
    <button
      onClick={() => handleUndoDelete(item._id)}   // ✅ use _id
      className="d-flex align-items-center justify-content-center btn btn-outline-primary btn-sm mx-auto"
    >
      <FaUndo className="me-1" /> Undo
    </button>
  ) : (
    <div className="d-flex gap-2 justify-content-center">
      <button
        onClick={() => handleEdit(item.ba_id)}
        className="btn btn-outline-secondary btn-sm"
      >
        <FaEdit />
      </button>
      <button
        onClick={() => handleSoftDelete(item._id)}   // ✅ use _id
        className="d-flex align-items-center justify-content-center btn btn-outline-danger btn-sm"
      >
        <FaTrash className="me-1" /> Delete
      </button>
    </div>
  )}
</td>

<td className="border px-4 py-2">
  {!item.isDeleted && (
    <button
      onClick={() => handleEditBill(item.ba_id)}
      className="btn btn-outline-info btn-sm"
    >
      <FaEdit /> Edit Bill
    </button>
  )}
</td>

<td className="border px-4 py-2">
  {!item.isDeleted && (
    <button
      onClick={() => handleViewBillHistory(item.ba_id)}
      disabled={loadingHistory}
      className="btn btn-outline-primary btn-sm"
    >
      {loadingHistory ? 'Loading...' : 'View'}
    </button>
  )}
</td>

              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      </div>

      {/* Edit Bill History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Bill History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {billHistory ? (
            <div>
              <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <h5 className="mb-3 text-primary">Bill Information</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Bill No:</strong> {billHistory.billNo}</p>
                    <p><strong>BA ID:</strong> {billHistory.ba_id}</p>
                    <p><strong>Payment Type:</strong> {billHistory.paymentType}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Plan Name:</strong> {billHistory.planName}</p>
                    <p><strong>Net Amount:</strong> ₹{billHistory.netAmount}</p>
                  </div>
                </div>
              </div>

              <h5 className="mb-3 text-success">Edit History Timeline</h5>
              
              <div className="timeline">
                {/* Created Entry */}
                <div className="mb-3 p-3 border-left border-success" style={{ borderLeft: '4px solid #28a745', paddingLeft: '15px' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">
                        <Badge bg="success">Created</Badge>
                      </h6>
                      <p className="mb-1"><strong>Created By:</strong> {billHistory.billCreatedBy || 'System'}</p>
                      <p className="mb-0"><strong>Created At:</strong> {moment(billHistory.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                    </div>
                  </div>
                </div>

                {/* Modified Entry (if exists) */}
                {billHistory.lastModifiedBy && (
                  <div className="mb-3 p-3 border-left border-warning" style={{ borderLeft: '4px solid #ffc107', paddingLeft: '15px' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">
                          <Badge bg="warning" text="dark">Modified</Badge>
                        </h6>
                        <p className="mb-1"><strong>Modified By:</strong> {billHistory.lastModifiedBy}</p>
                        <p className="mb-0"><strong>Modified At:</strong> {moment(billHistory.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!billHistory.lastModifiedBy && (
                  <div className="alert alert-info">
                    <p className="mb-0">No modifications made to this bill yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>Loading bill history...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BuyerAssistanceActive;