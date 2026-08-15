 


import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Container, Row, Col, Table, Form, Button } from "react-bootstrap";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Roll = () => {
  const [rolls, setRolls] = useState([]);
  const [rollType, setRollType] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [editingRoll, setEditingRoll] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileName = "Roll"; // current file
  const printRef = useRef();

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  useEffect(() => {
    fetchRolls();
  }, []);

  const fetchRolls = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/roll-all`);
      setRolls(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const createRoll = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/roll-create`, {
        rollType,
        createdDate: createDate,
      });
      setRolls([...rolls, response.data]);
      setRollType("");
      setCreateDate("");
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const updateRoll = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/roll-update/${editingRoll._id}`,
        { rollType, createdDate: createDate }
      );
      setRolls(rolls.map((roll) => (roll._id === editingRoll._id ? response.data : roll)));
      setRollType("");
      setCreateDate("");
      setEditingRoll(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const deleteRoll = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/roll-delete/${id}`);
      setRolls(rolls.filter((roll) => roll._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const editRoll = (roll) => {
    setEditingRoll(roll);
    setRollType(roll.rollType);
    setCreateDate(roll.createdDate);
  };

  const filteredRolls = rolls.filter((roll) =>
    roll.rollType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        console.error("Dashboard view error:", err);
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
        const viewed = rolePermissions?.viewedFiles?.map((f) => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch (err) {
        console.error("Permissions fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (adminRole) {
      fetchPermissions();
    }
  }, [adminRole]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRolls.map((roll, index) => ({
        SL: index + 1,
        "Roll Type": roll.rollType,
        "Created Date": moment(roll.createdDate).format("YYYY-MM-DD"),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rolls");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Rolls_${moment().format("YYYYMMDD_HHmmss")}.xlsx`);
  };

  const printTable = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Rolls</title></head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <p>Loading...</p>;
  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg mt-10">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <Container className="mt-5">
      <h1 className="text-center">Rolls</h1>

      <h3 className="text-success">{editingRoll ? "Update Roll" : "Create Roll"}</h3>
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Roll Type:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Roll Type"
              value={rollType}
              onChange={(e) => setRollType(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Created Date:</Form.Label>
            <Form.Control
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button className="me-2" variant="danger" onClick={editingRoll ? updateRoll : createRoll}>
            {editingRoll ? "Update" : "Create"}
          </Button>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mb-2">
        <div>
          <Button className="me-2" variant="success" onClick={exportToExcel}>
            Export to Excel
          </Button>
          <Button variant="info" onClick={printTable}>
            Print Table
          </Button>
        </div>
        <Form.Control
          style={{ width: "200px" }}
          type="text"
          placeholder="Search by Roll Type"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container" ref={printRef}>
        <Table striped bordered hover responsive className="table-sm align-middle">
          <thead className="sticky-top">
            <tr>
              <th>SL</th>
              <th>Roll Type</th>
              <th>Created Date</th>
              <th>Edit / Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredRolls.map((roll, index) => (
              <tr key={roll._id}>
                <td>{index + 1}</td>
                <td>{roll.rollType}</td>
                <td>{new Date(roll.createdDate).toLocaleDateString()}</td>
                <td>
                  <span className="edit text-primary me-2" onClick={() => editRoll(roll)}>
                    <FaEdit />
                  </span>
                  <span className="delete text-danger fs-5" onClick={() => deleteRoll(roll._id)}>
                    <MdDeleteForever />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default Roll;
