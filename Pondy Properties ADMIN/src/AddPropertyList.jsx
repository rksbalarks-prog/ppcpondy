import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useSelector } from "react-redux";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";

// excel utilities
import * as XLSX from "xlsx";
import PhoneCell from "./components/PhoneCell";
import { saveAs } from "file-saver";

const AddPropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [statusProperties, setStatusProperties] = useState({});
  const [previousStatuses, setPreviousStatuses] = useState({}); // Store previous statuses before delete
  const navigate = useNavigate();

  const [excelFile, setExcelFile] = useState(null);
  const [message, setMessage] = useState("");

  const [filters, setFilters] = useState({
    ppcId: "",
    phoneNumber: "",
    fromDate: "",
    endDate: "",
    status: "", // e.g., "active" or "removed"
  });

  // Handle Excel file selection
  const handleExcelChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  // Handle Excel file upload
  const handleExcelUpload = async () => {
    if (!excelFile) {
      setMessage("Please select an Excel file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", excelFile);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/update-property-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Excel upload failed.");
    }
  };

  const statusOptions = [
    "incomplete",
    "active",
    "pending",
    "complete",
    "sendInterest",
    "soldOut",
    "reportProperties",
    "needHelp",
    "contact",
    "favorite",
    "alreadySaved",
    "favoriteRemoved",
    "delete",
    "undo",
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fetch-alls-datas-all`,
      );

      // Sort properties by updatedAt first (newest first), then by createdAt (newest first)
      const sortedProperties = response.data.users.sort((a, b) => {
        // First, compare by updatedAt (newest first)
        const updatedAtComparison =
          new Date(b.updatedAt) - new Date(a.updatedAt);
        if (updatedAtComparison !== 0) return updatedAtComparison;

        // If updatedAt is the same, compare by createdAt (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setProperties(sortedProperties);

      // Set statuses
      const initialStatuses = sortedProperties.reduce((acc, property) => {
        acc[property.ppcId] = property.status;
        return acc;
      }, {});

      setStatusProperties(initialStatuses);
      localStorage.setItem("statusProperties", JSON.stringify(initialStatuses));
    } catch (error) {}
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

  const filteredProperties = properties.filter((property) => {
    const matchesPpcId = String(property.ppcId || "")
      .toLowerCase()
      .includes(filters.ppcId.toLowerCase());

    const matchesPhone = String(property.phoneNumber || "").includes(
      filters.phoneNumber,
    );
    const matchesStatus =
      !filters.status || // if no status filter, allow all
      statusProperties[property.ppcId] === filters.status;

    const createdAt = new Date(property.createdAt); // or the correct date field
    const from = filters.fromDate ? new Date(filters.fromDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    const matchesDate =
      (!from || createdAt >= from) && (!end || createdAt <= end);

    return matchesPpcId && matchesPhone && matchesDate && matchesStatus;
  });

  const handleFeatureStatusChange = async (ppcId, currentStatus) => {
    const newStatus = currentStatus === "yes" ? "no" : "yes"; // Toggle status
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/update-feature-status`,
        {
          ppcId,
          featureStatus: newStatus,
        },
      );

      setProperties((prevProperties) =>
        prevProperties.map((property) =>
          property.ppcId === ppcId
            ? { ...property, featureStatus: newStatus }
            : property,
        ),
      );
    } catch (error) {}
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all properties?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/delete-all-properties`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();
        if (response.ok) {
          setMessage(data.message); // optional: show a success message
          // Optionally refresh property list here
        } else {
          setMessage(data.message || "Failed to delete properties.");
        }
      } catch (error) {
        setMessage("Server error while deleting properties.");
      }
    }
  };

  useEffect(() => {
    const storedStatusProperties = localStorage.getItem("statusProperties");
    if (storedStatusProperties) {
      setStatusProperties(JSON.parse(storedStatusProperties));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("statusProperties", JSON.stringify(statusProperties));
  }, [statusProperties]);

  const handleDelete = async (ppcId, phoneNumber) => {
    // Show confirmation alert
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this property?",
    );

    if (!isConfirmed) {
      return; // Stop execution if user cancels
    }

    // Prompt for deletion reason
    const deletionReason = prompt("Please provide a reason for deletion:");
    if (deletionReason === null) {
      return; // User cancelled the prompt
    }
    if (deletionReason.trim() === "") {
      alert("Deletion reason cannot be empty");
      return;
    }

    // Store previous status before deleting
    setPreviousStatuses((prev) => ({
      ...prev,
      [ppcId]: statusProperties[ppcId],
    }));

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/delete-datas`,
        {
          deletionReason: deletionReason.trim(),
          deletionDate: new Date(),
        },
        {
          params: {
            ppcId,
            phoneNumber,
          },
        },
      );

      if (response.status === 200) {
        setStatusProperties((prev) => ({
          ...prev,
          [ppcId]: "delete",
        }));
        alert("Property marked as deleted successfully!");
      }
    } catch (error) {
      alert("Failed to delete property.");
    }
  };

  const handleActivateAll = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/activate-all-properties`,
      );

      if (response.status === 200) {
        // Update all local statuses to 'active'
        const updatedStatuses = { ...statusProperties };
        Object.keys(updatedStatuses).forEach((ppcId) => {
          updatedStatuses[ppcId] = "active";
        });
        setStatusProperties(updatedStatuses);

        alert("All properties activated successfully!");
      } else {
        alert("Failed to activate all properties.");
      }
    } catch (error) {
      alert("An error occurred while activating all properties.");
    }
  };

  // **Handle Undo Functionality**
  const handleUndo = async (ppcId) => {
    const restoredStatus = previousStatuses[ppcId] || "active"; // Restore previous status or default to 'active'

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/update-property-status`,
        {
          ppcId,
          status: restoredStatus,
        },
      );

      setStatusProperties((prev) => ({
        ...prev,
        [ppcId]: restoredStatus,
      }));

      // Remove previous status tracking
      setPreviousStatuses((prev) => {
        const updated = { ...prev };
        delete updated[ppcId];
        return updated;
      });
    } catch (error) {
      alert("Failed to undo delete.");
    }
  };

  // **Handle Status Change**
  const handleStatusChange = async (ppcId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "pending" : "active";

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/update-property-status`,
        {
          ppcId,
          status: newStatus,
        },
      );

      setStatusProperties((prev) => ({
        ...prev,
        [ppcId]: newStatus,
      }));
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const handlePermanentDelete = async (ppcId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this record?",
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/delete-ppcId-data?ppcId=${ppcId}`,
        {
          data: { deletedBy: adminName },
        },
      );

      if (response.status === 200) {
        alert("User permanently deleted successfully!");

        setProperties((prev) =>
          prev.filter((property) => property.ppcId !== ppcId),
        );

        const updatedStatus = { ...statusProperties };
        delete updatedStatus[ppcId];
        setStatusProperties(updatedStatus);
        localStorage.setItem("statusProperties", JSON.stringify(updatedStatus));
      } else {
        alert(response.data.message || "Failed to delete user.");
      }
    } catch (error) {
      alert("An error occurred while deleting.");
      console.error(error);
    }
  };

  // excel export handler
  const handleExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredProperties.map((prop, idx) => ({
        "S.No": idx + 1,
        "PPC ID": prop.ppcId,
        "Phone Number": prop.phoneNumber,
        "Property Type": prop.propertyType,
        "Property Mode": prop.propertyMode,
        Price: prop.price,
        City: prop.city,
        "Created By": prop.createdBy,
        "Created At": moment(prop.createdAt).format("YYYY-MM-DD"),
        Status: statusProperties[prop.ppcId] || prop.status,
        "Feature Status": prop.featureStatus,
        "Deletion Reason": prop.deletionReason || "-",
        "Deleted At": prop.deletionDate
          ? moment(prop.deletionDate).format("YYYY-MM-DD HH:mm")
          : "-",
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Properties");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Properties_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Container fluid className="p-3">
      <Helmet>
        <title>Pondy Property | Properties</title>
      </Helmet>

      <Row className="mb-3">
        <div className="col-12 d-flex flex-wrap align-items-end gap-3">
          <div style={{ flex: "0 0 auto", maxWidth: "250px" }}>
            {/* <label className="form-label">Upload Excel File:</label> */}
            <div
              style={
                {
                  // display: "flex",
                  // alignItems: "center",
                  // gap: "10px",
                  // border: "2px dashed rgba(10, 90, 129, 0.72)",
                  // padding: "15px",
                  // borderRadius: "10px",
                  // backgroundColor: "#CCFFFF",
                  // cursor: "pointer",
                  // justifyContent: "center",
                  // flexDirection: "column",
                  // textAlign: "center",
                  // width: "100%",
                }
              }
              onClick={() => document.getElementById("excelFile").click()} // Triggers file input
              aria-label="Click to upload Excel file"
            >
              <i
                className="bi bi-file-earmark-arrow-up"
                style={{ fontSize: "2rem", color: "#007bff" }}
              ></i>
              {/* <span style={{ fontSize: "1rem", color: "#333" }}>
                Click to upload Excel file
              </span> */}

              {/* Hidden file input */}
              <input
                type="file"
                id="excelFile"
                accept=".xlsx, .xls"
                onChange={handleExcelChange} // Handle file change
                style={{ display: "none" }} // Hide the default file input
              />
            </div>
          </div>

          {/* Upload button, Activate, Delete aligned */}
          {/* <button className="btn btn-success" onClick={handleExcelUpload}>
            Upload Excel
          </button>
          <button className="btn btn-primary" onClick={handleActivateAll}>
            Activate All
          </button>
          <button className="btn btn-primary" onClick={handleDeleteAll}>
            Delete All
          </button> */}

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>
      </Row>

      <div
        className="d-flex flex-row gap-2 align-items-center flex-nowrap"
        style={{
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <input
          type="text"
          placeholder="Filter by PPC ID"
          value={filters.ppcId}
          onChange={(e) => setFilters({ ...filters, ppcId: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by Phone Number"
          value={filters.phoneNumber}
          onChange={(e) =>
            setFilters({ ...filters, phoneNumber: e.target.value })
          }
        />
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            setFilters((prev) => ({ ...prev, fromDate: "", endDate: "" }))
          }
          style={{
            padding: "4px 10px",
            cursor: "pointer",
            background: "orange",
          }}
        >
          Reset Dates
        </button>
      </div>

      <h2 className="mb-10 mt-6">User All Properties</h2>
      <div className="d-flex align-items-center mb-3">
        {/* <button
          className="btn btn-secondary ms-2"
          style={{ background: "tomato" }}
          onClick={handlePrint}
        >
          Print
        </button>
        <button
          className="btn btn-secondary ms-2"
          style={{ background: "#90ee90" }}
          onClick={handleExcel}
        >
          Excel
        </button> */}
        <button
          className="btn ms-2"
          style={{
            background: "#8B4513",
            color: "white",
            fontWeight: "bold",
            border: "none",
            cursor: "default",
          }}
        >
          Total Records: {properties.length}
        </button>
        <button
          className="btn ms-2"
          style={{
            background: "#8B4513",
            color: "white",
            fontWeight: "bold",
            border: "none",
            cursor: "default",
          }}
        >
          Showing: {filteredProperties.length}
        </button>
      </div>

      {filteredProperties.length > 0 ? (
        <div ref={tableRef}>
          <Table
            striped
            bordered
            hover
            responsive
            className="table-sm align-middle"
          >
            <thead className="sticky-top">
              <tr>
                <th>Image</th>
                <th className="sticky-col sticky-col-1">PPC ID</th>
                <th className="sticky-col sticky-col-2">Phone Number</th>
                <th>Otp Status</th>
                <th>Direct Verified User</th>
                <th>Property Mode</th>
                <th>Property Type</th>
                <th>Price</th>
                <th>City</th>
                <th>Created By</th>
                <th>Mandatory</th>
                <th>Plan Name</th>

                <th>Created At</th>
                <th>Updated At</th>
                <th>No.Of.ADS </th>
                <th>Feature Property</th>

                <th>Admin Office</th>
                <th>FollowUp Admin Name</th>
                <th>Plan Name</th>
                <th>Plan Type</th>
                <th>Plan Created</th>
                <th>Plan UpdatedAt</th>

                <th>Plan Expiry</th>
                <th>PayU Status</th>
                <th>Transaction ID</th>
                <th>Plan Amount</th>

                <th>Plan CreatedBy</th>

                <th>Email</th>
                <th>payU Date</th>

                <th>Bill No</th>
                <th>Bill Date</th>
                <th>Validity</th>
                <th>Bill Expiry Date</th>

                {/* Features Property Status Column - Displays and allows toggling the feature status (yes/no) of properties */}
                {/* <th>Features Property Status</th> */}
                <th>Status</th>
                <th>Actions</th>
                <th>Active OR Pending</th>
                {/* Permanent Delete Column - Allows admin to permanently delete a property record from the database */}
                {/* <th>Permenent Delete</th> */}
              </tr>
            </thead>

            <tbody>
              {filteredProperties.map((property) => (
                <tr key={property._id}>
                  <td>
                    <img
                      src={
                        property.photos && property.photos.length > 0
                          ? `https://ppcpondy.com/PPC/${property.photos[0]}`
                          : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
                      }
                      alt="Property"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                  </td>
                  <td
                    onClick={() =>
                      navigate(`/dashboard/detail`, {
                        state: {
                          ppcId: property.ppcId,
                          phoneNumber: property.phoneNumber,
                        },
                      })
                    }
                    style={{ cursor: "pointer" }}
                    className="sticky-col sticky-col-1"
                  >
                    {property.ppcId}
                  </td>
                  {/* <td className="sticky-col sticky-col-2">{property.phoneNumber}</td> */}
                  <td
                    className={`sticky-col sticky-col-2 ${
                      property.otpStatus !== "verified" ||
                      !property.isVerifiedUser
                        ? "text-danger"
                        : ""
                    }`}
                  >
                    <PhoneCell phone={property.phoneNumber} type="owner" ppcId={property.ppcId} />
                  </td>
                  <td>{property.otpStatus}</td>
                  <td>{property.isVerifiedUser ? "True" : "False"}</td>
                  <td>{property.propertyMode}</td>
                  <td>{property.propertyType}</td>
                  <td>{property.price}</td>
                  <td>{property.city}</td>

                  <td>{property.createdBy || "N/A"}</td>
                  <td>{property.required}</td>
                  <td>{property.planName || "N/A"}</td>

                  <td>
                    {property.createdAt
                      ? new Date(property.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td>
                    {property.updatedAt
                      ? new Date(property.updatedAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td> {property.adsCount} </td>
                  <td>{property.featureStatus}</td>

                  <td>{property.adminOffice}</td>
                  <td>{property.followUpAdminName}</td>
                  <td>{property.paymentInfo?.planName}</td>
                  <td>{property.paymentInfo?.productinfo}</td>
                  <td>
                    {new Date(
                      property.paymentInfo?.createdAt,
                    ).toLocaleDateString()}
                  </td>
                  <td>
                    {new Date(
                      property.paymentInfo?.updatedAt,
                    ).toLocaleDateString()}
                  </td>

                  <td>{property.planExpiryDate}</td>
                  <td>{property.paymentInfo?.payustatususer}</td>
                  <td>{property.paymentInfo?.txnid}</td>
                  <td>{property.paymentInfo?.amount}</td>
                  <td>{property.paymentInfo?.firstname}</td>
                  <td>{property.paymentInfo?.email}</td>
                  <td>
                    {property.paymentInfo?.payUdate
                      ? new Date(property.paymentInfo.payUdate).toLocaleString()
                      : "N/A"}
                  </td>

                  <td>{property.billNo}</td>
                  <td>{property.billDate}</td>
                  <td>{property.validity}</td>
                  <td>{property.billExpiryDate}</td>

                  {/* Feature Status Toggle Button */}
                  {/* <td>
                    <Button
                      variant={
                        property.featureStatus === "yes" ? "danger" : "success"
                      }
                      size="sm"
                      onClick={() =>
                        handleFeatureStatusChange(
                          property.ppcId,
                          property.featureStatus,
                        )
                      }
                    >
                      {property.featureStatus === "yes"
                        ? "Set to No"
                        : "Set to Yes"}
                    </Button>
                  </td> */}

                  <td>
                    {statusProperties[property.ppcId] === "delete" ? (
                      <div>
                        <span
                          style={{
                            padding: "5px 10px",
                            borderRadius: "5px",
                            backgroundColor: "red",
                            color: "white",
                            display: "inline-block",
                            marginBottom: "5px",
                          }}
                        >
                          {statusProperties[property.ppcId]}
                        </span>
                        <div style={{ fontSize: "0.8rem", color: "#666" }}>
                          <strong>Reason:</strong> {property.deletionReason}
                          <br />
                          <strong>Date:</strong>{" "}
                          {new Date(property.deletionDate).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: "5px",
                          backgroundColor:
                            statusProperties[property.ppcId] === "active"
                              ? "green"
                              : "rgb(236, 106, 149)",
                          color: "white",
                        }}
                      >
                        {statusProperties[property.ppcId]}
                      </span>
                    )}
                  </td>

                  <td>
                    {statusProperties[property.ppcId] === "delete" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUndo(property.ppcId)}
                      >
                        Undo
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="info"
                          size="sm"
                          className="ms-2"
                          onClick={() =>
                            navigate(`/dashboard/edit-property`, {
                              state: {
                                ppcId: property.ppcId,
                                phoneNumber: property.phoneNumber,
                              },
                            })
                          }
                        >
                          <FaEdit />
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          className="ms-2 mt-2"
                          onClick={() =>
                            handleDelete(property.ppcId, property.phoneNumber)
                          }
                        >
                          <MdDeleteForever />
                        </Button>
                      </>
                    )}
                  </td>

                  {/* Status Change Button */}
                  <td>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(
                          property.ppcId,
                          statusProperties[property.ppcId] || "pending",
                        )
                      }
                    >
                      {statusProperties[property.ppcId] === "active"
                        ? "Pending"
                        : "Active"}
                    </Button>
                  </td>

                  {/* Permanent Delete Button */}
                  {/* <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handlePermanentDelete(property.ppcId)}
                    >
                      <MdDeleteForever /> Permenent
                    </Button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <p>Loading properties...</p>
      )}
    </Container>
  );
};

export default AddPropertyList;
