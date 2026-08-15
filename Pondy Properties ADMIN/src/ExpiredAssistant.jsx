 
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge } from 'react-bootstrap';
import { FaTrash, FaInfoCircle, FaUndo } from 'react-icons/fa';
import moment from 'moment';
import PhoneCell from "./components/PhoneCell";

const ExpiredBuyerPlans = ({ item }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [baIdFilter, setBaIdFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const navigate = useNavigate();

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const fileName = "Expired Assistant";

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
      } catch (err) {}
    };
    if (adminName && adminRole) recordDashboardView();
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
    if (adminRole) fetchPermissions();
  }, [adminRole]);

  const fetchExpiredPlans = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/expired-buyer-plan-assitant`);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch expired plans:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredPlans();
  }, []);

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/delete-buyer-assistance/${id}`);
      setMessage("Buyer Assistance request deleted successfully.");
      // Drop the request from the nested list — soft-deleted records live in
      // the Removed Buyer Assistant page now and shouldn't linger here.
      setData(prev =>
        prev.map(plan => ({
          ...plan,
          assistanceRequests: plan.assistanceRequests.filter(req =>
            req._id !== id && req.ba_id !== id
          )
        }))
      );
    } catch (error) {
      setMessage("Error deleting Buyer Assistance.");
    }
  };

  const handleUndoDelete = async (id) => {
    if (!window.confirm("Are you sure you want to restore this request?")) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/undo-delete-buyer-assistance/${id}`);
      setMessage("Buyer Assistance request restored successfully.");
      setData(prev =>
        prev.map(plan => ({
          ...plan,
          assistanceRequests: plan.assistanceRequests.map(req =>
            (req._id === id || req.ba_id === id) ? { ...req, isDeleted: false } : req
          )
        }))
      );
    } catch (error) {
      setMessage("Error restoring Buyer Assistance.");
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

    // Filter logic
const filteredRequests =
  item && Array.isArray(item.assistanceRequests)
    ? item.assistanceRequests.filter((assist) => {
        const matchesBaId =
          baIdFilter.trim() === "" ||
          (assist.ba_id &&
            assist.ba_id.toString().includes(baIdFilter.trim()));

        const matchesPhone =
          phoneFilter.trim() === "" ||
          (assist.phoneNumber &&
            assist.phoneNumber.toString().includes(phoneFilter.trim()));

        return matchesBaId && matchesPhone;
      })
    : [];
  if (loading) return <p>Loading...</p>;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg mt-10">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div className="container py-4">
          <div className="mb-3 d-flex gap-2">
        <input
          type="text"
          placeholder="Search by BA ID"
          value={baIdFilter}
          onChange={(e) => setBaIdFilter(e.target.value)}
          className="form-control"
          style={{ width: "200px" }}
        />
        <input
          type="text"
          placeholder="Search by Phone Number"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          className="form-control"
          style={{ width: "200px" }}
        />
      </div>
      <h4 className="mb-3 text-center">Expired Buyer Plans and Assistance Requests</h4>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {message && (
        <div className="alert alert-info text-center">{message}</div>
      )}

      {data.length === 0 ? (
        <div className="text-center text-muted">No expired plans found.</div>
      ) : (
        data.map((item, idx) => (
          <div className="card mb-4 shadow-sm" key={idx}>
            <div className="card-header bg-danger text-white">
              <strong>Plan Name:</strong> {item.planName} | <strong>ba_id:</strong> {item.ba_id} <br />
              <strong>Phone:</strong> {item.phone} | <strong>Status:</strong> {item.payustatususer}
              <br />
              <strong>Expired On:</strong> {new Date(item.expireDate).toLocaleDateString()}
            </div>
            <div className="card-body p-0">
<div ref={tableRef}>         
         <table className="table table-bordered table-striped mb-0">
                  <thead className="table-secondary">
                    <tr>
                      <th>#</th>
                      <th>BA ID</th>
                      <th>Buyer Name</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Area</th>
                      <th>Min Price</th>
                      <th>Max Price</th>
                      <th>Property Mode</th>
                      <th>Type</th>
                      <th>Beds</th>
                      <th>Area</th>
                      <th>Status</th>
                      <th>Post By</th>
                      <th>Created</th>
                      <th>BA_Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((assist, idx2) => {
                      const requestId = assist._id || assist.ba_id;
                      return (
                        <tr key={idx2}>
                          <td>{idx2 + 1}</td>
                          <td>{assist.ba_id}</td>
                          <td>{assist.baName}</td>
                          <td><PhoneCell phone={assist.phoneNumber} type="tenant" ba_id={assist.ba_id} /></td>
                          <td>{assist.city}</td>
                          <td>{assist.area}</td>
                          <td>{assist.minPrice}</td>
                          <td>{assist.maxPrice}</td>
                          <td>{assist.propertyMode}</td>
                          <td>{assist.propertyType}</td>
                          <td>{assist.bedrooms}</td>
                          <td>{`${assist.totalArea} ${assist.areaUnit}`}</td>
                          <td>{assist.ba_status}</td>
                          <td>{assist.ba_postBy}</td>
                          <td>{new Date(assist.createdAt).toLocaleDateString()}</td>
                          <td>
                            {assist.isDeleted ? (
                              <Badge bg="danger" className="d-flex align-items-center">
                                <FaTrash className="me-1" /> Deleted
                              </Badge>
                            ) : (
                              <Badge bg="success" className="d-flex align-items-center">
                                <FaInfoCircle className="me-1" /> Previous status
                              </Badge>
                            )}
                          </td>
                          <td>
                            {!assist.isDeleted ? (
                              <button
                                onClick={() => handleSoftDelete(requestId)}
                                className="d-flex align-items-center btn btn-outline-danger btn-sm"
                              >
                                <FaTrash className="me-1" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUndoDelete(requestId)}
                                className="d-flex align-items-center btn btn-outline-primary btn-sm"
                              >
                                <FaUndo className="me-1" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ExpiredBuyerPlans;
