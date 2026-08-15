import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Container, Row, Col, Table, Form, Button, Badge } from "react-bootstrap";
import { FaEdit, FaPhoneAlt } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = process.env.REACT_APP_API_URL;

// Admin login OTP recipients live under the single "ADMIN" office on the
// backend (matches AdminLogin.officeName). The OTP is sent to every active
// number below when an admin signs in.
const OFFICE = "ADMIN";

const OtpNumbers = () => {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add / edit form
  const [mobile, setMobile] = useState("");
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState(null); // doc being edited, or null

  const fetchNumbers = async (officeName) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/otp-numbers`, {
        params: { officeName },
      });
      setNumbers(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load OTP numbers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers(OFFICE);
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setMobile("");
    setLabel("");
    setEditing(null);
  };

  const handleSave = async () => {
    const clean = (mobile || "").trim();
    const cleanName = (label || "").trim();
    if (!cleanName) {
      return toast.error("Name is required");
    }
    if (!/^[0-9]{10}$/.test(clean)) {
      return toast.error("Mobile must be exactly 10 digits");
    }

    try {
      if (editing) {
        const res = await axios.put(`${API}/otp-number-update/${editing._id}`, {
          mobile: clean,
          label: cleanName,
        });
        setNumbers((prev) => prev.map((n) => (n._id === editing._id ? res.data : n)));
        toast.success("OTP number updated");
      } else {
        const res = await axios.post(`${API}/otp-number-create`, {
          officeName: OFFICE,
          mobile: clean,
          label: cleanName,
        });
        setNumbers((prev) => [...prev, res.data]);
        toast.success("OTP number added");
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const handleEdit = (doc) => {
    setEditing(doc);
    setMobile(doc.mobile);
    setLabel(doc.label || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (doc) => {
    try {
      const res = await axios.put(`${API}/otp-number-update/${doc._id}`, {
        active: !doc.active,
      });
      setNumbers((prev) => prev.map((n) => (n._id === doc._id ? res.data : n)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this number from OTP login?")) return;
    try {
      await axios.delete(`${API}/otp-number-delete/${id}`);
      setNumbers((prev) => prev.filter((n) => n._id !== id));
      if (editing && editing._id === id) resetForm();
      toast.success("OTP number removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const activeCount = numbers.filter((n) => n.active).length;

  return (
    <Container className="mt-4">
      <ToastContainer />
      <h2 className="text-primary d-flex align-items-center">
        <FaPhoneAlt className="me-2" /> Admin Login OTP Numbers
      </h2>
      <p className="text-muted">
        These phone numbers receive the OTP when an admin signs in. The OTP is
        sent to every <strong>active</strong> number below.
      </p>

      <div className="mb-3">
        <Badge bg="success" className="me-2">
          {activeCount} active
        </Badge>
        <Badge bg="secondary">{numbers.length} total</Badge>
      </div>

      {/* Add / Edit form */}
      <div className="p-3 mb-4 rounded" style={{ background: "#f8f9fa", border: "1px solid #e5e7eb" }}>
        <h5 className="text-success">
          {editing ? "Edit Number" : "Add Number"}
        </h5>
        <Row>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Mobile (10 digits)</Form.Label>
              <Form.Control
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 9944244409"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group>
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Bala"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3} className="d-flex align-items-end gap-2 mt-2 mt-md-0">
            <Button variant="primary" onClick={handleSave}>
              {editing ? "Update" : "Add"}
            </Button>
            {editing && (
              <Button variant="outline-secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <Table striped bordered hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>SL</th>
              <th>Mobile</th>
              <th>Name</th>
              <th>Status</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {numbers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">
                  No numbers configured yet. Add one above.
                </td>
              </tr>
            ) : (
              numbers.map((n, i) => (
                <tr key={n._id}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{n.mobile}</td>
                  <td>{n.label || <span className="text-muted">—</span>}</td>
                  <td>
                    <Button
                      size="sm"
                      variant={n.active ? "success" : "outline-secondary"}
                      onClick={() => toggleActive(n)}
                      title="Click to toggle"
                    >
                      {n.active ? "Active" : "Inactive"}
                    </Button>
                  </td>
                  <td>{n.createdDate ? moment(n.createdDate).format("DD-MM-YYYY") : "—"}</td>
                  <td>
                    <span
                      className="text-primary me-3"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleEdit(n)}
                      title="Edit"
                    >
                      <FaEdit />
                    </span>
                    <span
                      className="text-danger fs-5"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleDelete(n._id)}
                      title="Delete"
                    >
                      <MdDeleteForever />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <p className="text-muted small mt-2">
        Note: if no numbers are active, OTP login falls back to the built-in
        default list so you can never be locked out.
      </p>
    </Container>
  );
};

export default OtpNumbers;
