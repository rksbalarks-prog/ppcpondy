 
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { MdDeleteForever, MdUndo, MdRefresh, MdCheckCircle } from 'react-icons/md';
import { Modal, Button, Badge } from 'react-bootstrap';
import PhoneCell from './components/PhoneCell';

const ExpiredPlanProperties = () => {
  const [expiredPlans, setExpiredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    ppcId: '',
    phone: '',
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const adminName = useSelector((state) => state.admin.name) || localStorage.getItem("adminName");

  const fetchExpiredPlans = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/all-expired-properties`);
      if (response.status === 200) {
        setExpiredPlans(response.data.expiredPlans || []);
      } else {
        setError('Failed to fetch data.');
      }
    } catch (err) {
      setError('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredPlans();
  }, []);

  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);
        fetchExpiredPlans(); // Refresh data
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
        fetchExpiredPlans(); // Refresh data
      } catch (error) {
        alert('Failed to undo delete.');
      }
    }
  };

  const handleStatusUpdate = (property, status) => {
    setSelectedProperty(property);
    setNewStatus(status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedProperty || !newStatus) return;
    
    setStatusLoading(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/update-expired-property-status`,
        {
          ppcId: selectedProperty.ppcId,
          newStatus,
          updatedBy: adminName
        }
      );

      alert(response.data.message);
      fetchExpiredPlans(); // Refresh the list
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      expired: 'warning',
      complete: 'primary',
      deleted: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const filteredPlans = expiredPlans.filter(plan => {
    const matchesPpcId = plan.ppcId?.toString().includes(filters.ppcId);
    const matchesPhone = plan.phoneNumber?.includes(filters.phone);
    return matchesPpcId && matchesPhone;
  });
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
  return (
    <div className="container mt-4">
      {/* Status Update Confirmation Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProperty && (
            <div>
              <p>Are you sure you want to update status of PPC ID: <strong>{selectedProperty.ppcId}</strong> from <strong>expired</strong> to <strong>{newStatus}</strong>?</p>
              <p>This action will be recorded as performed by: <strong>{adminName}</strong></p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={statusLoading}>
            Cancel
          </Button>
          <Button 
            variant={newStatus === 'active' ? 'success' : 'primary'}
            onClick={confirmStatusUpdate}
            disabled={statusLoading}
          >
            {statusLoading ? 'Updating...' : `Confirm to ${newStatus}`}
          </Button>
        </Modal.Footer>
      </Modal>

      <div style={{
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        backgroundColor: '#fff'
      }} className="d-flex flex-row gap-2 align-items-center flex-nowrap">
        <input
          type="text"
          className="form-control"
          placeholder="Search by PPC ID"
          value={filters.ppcId}
          onChange={(e) => setFilters({ ...filters, ppcId: e.target.value })}
        />
        <input
          type="text"
          className="form-control"
          placeholder="Search by Phone"
          value={filters.phone}
          onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
        />
        <button className="btn btn-secondary" onClick={() => setFilters({
          ppcId: '',
          phone: '',
        })}>
          Reset
        </button>
      </div>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      <h4 className="mt-3">Expired Properties</h4>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : filteredPlans.length === 0 ? (
        <p>No expired plans found.</p>
      ) : (
         <div ref={tableRef}>
        <table className="table table-bordered table-striped mt-3">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>PPC ID</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Property Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((plan, index) => (
              <tr key={plan._id}>
                <td>{index + 1}</td>
                <td>{plan.ppcId}</td>
                <td><PhoneCell phone={plan.phoneNumber} type="owner" ppcId={plan.ppcId} /></td>
                <td>{getStatusBadge(plan.status)}</td>
                <td>
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="table-secondary">
                      <tr>
                        <th>Mode</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Area</th>
                        <th>Posted By</th>
                        <th>Sales Type</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{plan.propertyMode}</td>
                        <td>{plan.propertyType}</td>
                        <td>{plan.price}</td>
                        <td>{`${plan.totalArea} ${plan.areaUnit}`}</td>
                        <td>{plan.postedBy}</td>
                        <td>{plan.salesType}</td>
                        <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td>
                  <div className="d-flex flex-column gap-2">
                    {!plan.isDeleted && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusUpdate(plan, 'active')}
                          title="Set to Active"
                        >
                          <MdRefresh className="me-1" /> Reactivate
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(plan, 'complete')}
                          title="Mark as Complete"
                        >
                          <MdCheckCircle className="me-1" /> PreApproved
                        </button>
                      </>
                    )}
                    {plan.isDeleted ? (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleUndoDelete(plan.ppcId)}
                        title="Restore Property"
                      >
                        <MdUndo size={20} />
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(plan.ppcId)}
                        title="Delete Property"
                      >
                        <MdDeleteForever size={20} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default ExpiredPlanProperties;