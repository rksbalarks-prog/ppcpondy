import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Spinner, Table, Form, Alert } from "react-bootstrap";
import {
  FaFileExcel,
  FaCloudUploadAlt,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaUndo,
  FaHistory,
} from "react-icons/fa";

// Column headers expected in the upload sheet — these mirror the AddProperty
// form / AddModel schema. Extra columns in the sheet (Section, SourceFile,
// IssueDate …) are ignored by the backend.
const FORM_FIELDS = [
  "propertyMode", "propertyType", "price", "negotiation", "length", "breadth",
  "totalArea", "areaUnit", "ownership", "bedrooms", "kitchen", "balconies",
  "floorNo", "propertyApproved", "propertyAge", "bankLoan", "facing",
  "salesMode", "salesType", "postedBy", "description", "furnished", "lift",
  "attachedBathrooms", "western", "numberOfFloors", "carParking", "country",
  "state", "city", "district", "area", "nagar", "streetName", "doorNumber",
  "pinCode", "locationCoordinates", "ownerName", "email", "phoneNumber",
  "phoneNumberCountryCode", "alternatePhone", "alternatePhoneCountryCode",
  "bestTimeToCall",
];

const TEAL = "#2F747F";
const PREVIEW_ROWS = 50;

const BulkUploadProperty = () => {
  const navigate = useNavigate();
  const reduxAdminName = useSelector((state) => state.admin?.name);
  const reduxAdminRole = useSelector((state) => state.admin?.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName") || "Admin";
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole") || "";

  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]); // array of objects
  const [isPondicherry, setIsPondicherry] = useState(false); // default: Chennai
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState([]); // all bulk-upload batches (each revertable)
  const [reverting, setReverting] = useState(false);
  const [revertMsg, setRevertMsg] = useState("");

  const targetBase = isPondicherry ? "PY" : "CH";

  // Load the most recent bulk-upload batch so it can be reverted even after a
  // page refresh / navigating away.
  const fetchBatches = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/bulk-upload-batches`
      );
      setBatches(res.data?.batches || []);
    } catch (e) {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleRevert = async (bulkUploadId, count) => {
    if (!bulkUploadId) return;
    const ok = window.confirm(
      `Permanently delete ${count ?? "these"} uploaded propert${
        count === 1 ? "y" : "ies"
      } from the last Excel upload?\n\nThis removes them from Approved Property and cannot be undone.`
    );
    if (!ok) return;
    setReverting(true);
    setError("");
    setRevertMsg("");
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/bulk-upload-revert`,
        { bulkUploadId }
      );
      setRevertMsg(res.data?.message || "Reverted.");
      // If we just reverted the batch shown in the success alert, clear it.
      if (result && result.bulkUploadId === bulkUploadId) setResult(null);
      await fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Revert failed.");
    } finally {
      setReverting(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setRows([]);
    setColumns([]);
    setFileName(file.name);
    setParsing(true);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // header:1 keeps the original column order; defval keeps blank cells.
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!grid.length) {
        setError("The sheet appears to be empty.");
        setParsing(false);
        return;
      }
      const header = grid[0].map((h) => String(h).trim());
      const dataRows = grid
        .slice(1)
        .map((arr) => {
          const obj = {};
          header.forEach((h, i) => {
            if (h) obj[h] = arr[i] != null ? arr[i] : "";
          });
          return obj;
        })
        // drop fully-empty rows
        .filter((obj) => Object.values(obj).some((v) => String(v).trim() !== ""));

      setColumns(header.filter(Boolean));
      setRows(dataRows);
      if (!dataRows.length) setError("No data rows found below the header.");
    } catch (err) {
      setError("Could not read the file. Please upload a valid .xlsx / .xls / .csv.");
    } finally {
      setParsing(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([FORM_FIELDS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Property_Upload_Template.xlsx");
  };

  const handleUpload = async () => {
    if (!rows.length) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/bulk-upload-properties`,
        {
          rows,
          base: targetBase,
          addedBy: adminName,
          addedByRole: adminRole,
        }
      );
      setResult(res.data);
      setRevertMsg("");
      fetchBatches();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Upload failed. Please check the server and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFileName("");
    setColumns([]);
    setRows([]);
    setResult(null);
    setError("");
  };

  const unknownCols = useMemo(
    () =>
      columns.filter(
        (c) =>
          !FORM_FIELDS.includes(c) &&
          !["Section", "SourceFile", "IssueDate"].includes(c)
      ),
    [columns]
  );

  return (
    <div className="p-3" style={{ maxWidth: "100%" }}>
      <h3 style={{ color: TEAL, fontWeight: "bold" }}>
        <FaFileExcel className="me-2" />
        Bulk Upload Properties (Excel)
      </h3>
      <p className="text-muted" style={{ fontSize: 14 }}>
        Upload an Excel sheet whose column headers match the Add-Property fields.
        Preview the rows, choose the city, then upload. Each row is checked for the
        mandatory fields — complete rows go to <strong>PreApproved</strong>,
        incomplete rows go to <strong>Pending</strong>.
      </p>

      {/* Step 1 — file + template */}
      <div
        className="p-3 mb-3 rounded"
        style={{ border: `1px solid ${TEAL}`, background: "#fff" }}
      >
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <label
            htmlFor="bulk-xlsx"
            className="btn mb-0"
            style={{ background: TEAL, color: "#fff", cursor: "pointer" }}
          >
            <FaCloudUploadAlt className="me-2" />
            Choose Excel File
          </label>
          <input
            id="bulk-xlsx"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <Button variant="outline-secondary" onClick={downloadTemplate}>
            <FaDownload className="me-2" />
            Download Template
          </Button>
          {fileName && (
            <span className="text-muted" style={{ fontSize: 14 }}>
              {parsing ? "Reading…" : `Loaded: ${fileName}`}
            </span>
          )}
        </div>

        {/* City checkbox */}
        <div className="mt-3 d-flex align-items-center gap-2">
          <Form.Check
            type="checkbox"
            id="is-pondicherry"
            checked={isPondicherry}
            onChange={(e) => setIsPondicherry(e.target.checked)}
            label="These properties are in Pondicherry (PY)"
          />
          <span
            className="badge"
            style={{
              background: targetBase === "PY" ? "#0B7" : "#0B57CF",
              fontSize: 13,
            }}
          >
            Will be tagged: {targetBase === "PY" ? "Pondicherry (PY)" : "Chennai (CH)"}
          </span>
        </div>
        <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
          Leave unchecked for Chennai (CH). Tick it only for Pondicherry (PY).
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-center gap-2">
          <FaTimesCircle /> {error}
        </Alert>
      )}

      {result && (
        <Alert variant="success">
          <div className="d-flex align-items-center gap-2 mb-1">
            <FaCheckCircle /> <strong>{result.message}</strong>
          </div>
          <div style={{ fontSize: 14 }}>
            City: <strong>{result.base}</strong> · PPC-IDs{" "}
            <strong>
              {result.fromPpcId} – {result.toPpcId}
            </strong>
            <span className="ms-2">
              · PreApproved: <strong>{result.preApprovedCount ?? 0}</strong> ·
              Pending: <strong>{result.pendingCount ?? 0}</strong>
            </span>
          </div>
          <div className="mt-2 d-flex gap-2 flex-wrap">
            <Button
              size="sm"
              style={{ background: TEAL, border: "none" }}
              onClick={() => navigate("/dashboard/preapproved-car")}
            >
              View in PreApproved
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => navigate("/dashboard/pending-car")}
            >
              View in Pending
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              disabled={reverting}
              onClick={() => handleRevert(result.bulkUploadId, result.insertedCount)}
            >
              <FaUndo className="me-1" />
              {reverting ? "Reverting…" : "Revert this upload"}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={reset}>
              Upload another
            </Button>
          </div>
        </Alert>
      )}

      {revertMsg && (
        <Alert variant="info" className="d-flex align-items-center gap-2">
          <FaUndo /> {revertMsg}
        </Alert>
      )}

      {/* All bulk-upload batches — every previous batch stays revertable */}
      {batches.length > 0 && (
        <div
          className="p-3 mb-3 rounded"
          style={{ border: "1px dashed #c98", background: "#FFF8F0" }}
        >
          <div className="mb-2" style={{ fontSize: 14, fontWeight: "bold" }}>
            <FaHistory className="me-2" style={{ color: "#b5651d" }} />
            Bulk upload batches (newest first) — revert any one
          </div>
          {batches
            .filter((b) => !result || b.bulkUploadId !== result.bulkUploadId)
            .map((b) => (
              <div
                key={b.bulkUploadId}
                className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2"
                style={{ borderTop: "1px solid #eedfce" }}
              >
                <div style={{ fontSize: 14 }}>
                  <strong>{b.count}</strong> propert{b.count === 1 ? "y" : "ies"} tagged{" "}
                  <strong>{b.base}</strong>
                  {b.bulkUploadAt && (
                    <> on {new Date(b.bulkUploadAt).toLocaleString()}</>
                  )}
                  {b.bulkUploadBy ? ` by ${b.bulkUploadBy}` : ""}
                </div>
                <Button
                  size="sm"
                  variant="outline-danger"
                  disabled={reverting}
                  onClick={() => handleRevert(b.bulkUploadId, b.count)}
                >
                  <FaUndo className="me-1" />
                  {reverting ? "Reverting…" : "Revert"}
                </Button>
              </div>
            ))}
        </div>
      )}

      {/* Step 2 — preview */}
      {rows.length > 0 && !result && (
        <div
          className="p-3 rounded"
          style={{ border: "1px solid #ddd", background: "#fff" }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
            <h5 className="mb-0" style={{ color: TEAL }}>
              Preview — {rows.length} row{rows.length > 1 ? "s" : ""}
              {rows.length > PREVIEW_ROWS && (
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {" "}
                  (showing first {PREVIEW_ROWS})
                </span>
              )}
            </h5>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              style={{ background: TEAL, border: "none" }}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Uploading…
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-2" />
                  Confirm &amp; Upload {rows.length} as Active
                </>
              )}
            </Button>
          </div>

          {unknownCols.length > 0 && (
            <Alert variant="warning" style={{ fontSize: 13 }}>
              These columns aren't recognised property fields and will be
              ignored: <strong>{unknownCols.join(", ")}</strong>
            </Alert>
          )}

          <div style={{ overflow: "auto", maxHeight: 460 }}>
            <Table bordered hover size="sm" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr>
                  <th style={{ background: TEAL, color: "#fff" }}>#</th>
                  {columns.map((c) => (
                    <th
                      key={c}
                      style={{
                        background: FORM_FIELDS.includes(c) ? TEAL : "#9aa",
                        color: "#fff",
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                  <tr key={i}>
                    <td className="text-muted">{i + 1}</td>
                    {columns.map((c) => (
                      <td key={c}>{String(r[c] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadProperty;
