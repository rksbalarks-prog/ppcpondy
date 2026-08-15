import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { FaArrowLeft, FaUsers, FaFilter, FaTimes, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { findBucketByKey, priceMatchesBucket } from "./utils/pricingBuckets";
import PhoneCell from "./components/PhoneCell";

// ─── Helpers (kept in sync with PricingInfo.jsx) ─────────────────────
const formatPrice = (val) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return `₹ ${n.toLocaleString("en-IN")}`;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

// Turn a camelCase / snake_case key into a readable label.
const formatLabel = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

// Render any field value as readable text for the detail popup.
const formatValue = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.length ? `${val.length} item(s)` : "—";
  if (typeof val === "object") return "—";
  return String(val);
};

const BuyerBudgetDetail = () => {
  const { bucket: bucketKey } = useParams();
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Filter state — mirrors the Pricing Info detail page ──────────
  const [baIdSearch, setBaIdSearch] = useState("");
  const [phoneNumberSearch, setPhoneNumberSearch] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [propertyModeFilter, setPropertyModeFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const clearFilters = () => {
    setBaIdSearch("");
    setPhoneNumberSearch("");
    setPropertyTypeFilter("");
    setPropertyModeFilter("");
    setPriceMin("");
    setPriceMax("");
    setStartDate("");
    setEndDate("");
  };

  // ── Detail popup state — holds the buyer whose full details are shown ──
  const [detailTarget, setDetailTarget] = useState(null);

  // Resolve the URL slug → bucket definition once.
  const resolved = useMemo(() => findBucketByKey(bucketKey), [bucketKey]);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        // Same endpoint the Active Buyer Assistance page uses.
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/baActive-buyerAssistance-all-plans`
        );
        setBuyers(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        setError("Failed to load buyers.");
      } finally {
        setLoading(false);
      }
    };
    fetchBuyers();
  }, []);

  // Bucket-filter on Max Price (budget ceiling) — same rule as the
  // overview cards so counts agree exactly.
  const items = useMemo(() => {
    if (!resolved) return [];
    return buyers
      .filter((b) => priceMatchesBucket(b?.maxPrice, resolved.bucket))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [buyers, resolved]);

  // Distinct dropdown options confined to this bucket.
  const propertyTypeOptions = useMemo(
    () =>
      [...new Set(items.map((p) => p.propertyType).filter(Boolean))].sort(),
    [items]
  );
  const propertyModeOptions = useMemo(
    () =>
      [...new Set(items.map((p) => p.propertyMode).filter(Boolean))].sort(),
    [items]
  );

  // Apply user filters on top of the bucket-filtered list.
  const filteredItems = useMemo(() => {
    const baQ = baIdSearch.trim().toLowerCase();
    const phoneQ = phoneNumberSearch.trim().toLowerCase();
    const minN = priceMin === "" ? null : Number(priceMin);
    const maxN = priceMax === "" ? null : Number(priceMax);

    return items.filter((p) => {
      if (baQ && !String(p.ba_id || "").toLowerCase().includes(baQ)) {
        return false;
      }
      if (
        phoneQ &&
        !String(p.phoneNumber || "").toLowerCase().includes(phoneQ)
      ) {
        return false;
      }
      if (propertyTypeFilter && p.propertyType !== propertyTypeFilter) {
        return false;
      }
      if (propertyModeFilter && p.propertyMode !== propertyModeFilter) {
        return false;
      }
      const priceN = Number(p.maxPrice);
      if (minN !== null && Number.isFinite(minN)) {
        if (!Number.isFinite(priceN) || priceN < minN) return false;
      }
      if (maxN !== null && Number.isFinite(maxN)) {
        if (!Number.isFinite(priceN) || priceN > maxN) return false;
      }
      // Created At date range
      if (startDate || endDate) {
        const created = p.createdAt ? new Date(p.createdAt) : null;
        if (!created || Number.isNaN(created.getTime())) return false;
        if (startDate && created < new Date(`${startDate}T00:00:00`)) {
          return false;
        }
        if (endDate && created > new Date(`${endDate}T23:59:59.999`)) {
          return false;
        }
      }
      return true;
    });
  }, [
    items,
    baIdSearch,
    phoneNumberSearch,
    propertyTypeFilter,
    propertyModeFilter,
    priceMin,
    priceMax,
    startDate,
    endDate,
  ]);

  // Soft-delete via the same endpoint the Active Buyer Assistance page uses,
  // so the record disappears from "Approved - Buyer Assistance" too. Drops
  // the row locally so the table updates without a refetch.
  const handleDelete = async (id) => {
    if (!id) return;
    if (
      !window.confirm(
        "Delete this Buyer Assistance request? It will also be removed from Approved - Buyer Assistance."
      )
    ) {
      return;
    }
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/delete-buyer-assistances/${id}`
      );
      setBuyers((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(
        `Error deleting Buyer Assistance: ${
          err?.response?.data?.message || err.message
        }`
      );
    }
  };

  const filtersActive =
    !!baIdSearch ||
    !!phoneNumberSearch ||
    !!propertyTypeFilter ||
    !!propertyModeFilter ||
    !!priceMin ||
    !!priceMax ||
    !!startDate ||
    !!endDate;

  // Unknown bucket key — guard against typos / stale links.
  if (!resolved) {
    return (
      <div className="p-3" style={{ background: "#f3f4f6", minHeight: "100vh" }}>
        <Button
          variant="light"
          className="mb-3 border"
          onClick={() => navigate("/dashboard/pricing-info")}
        >
          <FaArrowLeft className="me-2" /> Back to Pricing Info
        </Button>
        <div className="alert alert-warning">
          Unknown price bucket: <code>{bucketKey}</code>
        </div>
      </div>
    );
  }

  const { bucket, accent } = resolved;

  return (
    <div className="p-3" style={{ background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Back + header */}
      <Button
        variant="light"
        className="mb-3 border"
        onClick={() => navigate("/dashboard/pricing-info")}
      >
        <FaArrowLeft className="me-2" /> Back to Pricing Info
      </Button>

      <div className="d-flex align-items-center gap-2 mb-1">
        <FaUsers size={24} style={{ color: accent }} />
        <h2 className="mb-0" style={{ fontWeight: 700 }}>
          <span style={{ color: accent }}>{bucket.label}</span>
          <span className="text-muted ms-2" style={{ fontSize: "1rem" }}>
            — Buyer Assistance
          </span>
        </h2>
      </div>
      <p className="text-muted mb-3">
        Buyers whose <strong>Max Price</strong> (budget ceiling) falls in the{" "}
        <strong>{bucket.label}</strong> range.
      </p>

      {/* Filter bar */}
      <div className="bg-white border rounded p-3 mb-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <FaFilter style={{ color: "#6b7280" }} />
          <span style={{ fontWeight: 600, color: "#374151" }}>Filters</span>
          {filtersActive && (
            <Button
              variant="link"
              size="sm"
              className="ms-auto text-decoration-none p-0"
              onClick={clearFilters}
              style={{ color: "#dc2626" }}
            >
              <FaTimes className="me-1" /> Clear all
            </Button>
          )}
        </div>
        <div className="row g-2">
          <div className="col-md-3 col-sm-6">
            <Form.Label className="small text-muted mb-1">BA ID</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              value={baIdSearch}
              onChange={(e) => setBaIdSearch(e.target.value)}
              placeholder="Search BA ID"
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <Form.Label className="small text-muted mb-1">
              Phone Number
            </Form.Label>
            <Form.Control
              size="sm"
              type="text"
              value={phoneNumberSearch}
              onChange={(e) => setPhoneNumberSearch(e.target.value)}
              placeholder="Search phone"
            />
          </div>
          <div className="col-md-2 col-sm-6">
            <Form.Label className="small text-muted mb-1">
              Property Type
            </Form.Label>
            <Form.Select
              size="sm"
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              {propertyTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2 col-sm-6">
            <Form.Label className="small text-muted mb-1">
              Property Mode
            </Form.Label>
            <Form.Select
              size="sm"
              value={propertyModeFilter}
              onChange={(e) => setPropertyModeFilter(e.target.value)}
            >
              <option value="">All</option>
              {propertyModeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2 col-sm-12">
            <Form.Label className="small text-muted mb-1">
              Max Price (₹)
            </Form.Label>
            <div className="d-flex gap-1">
              <Form.Control
                size="sm"
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min"
              />
              <Form.Control
                size="sm"
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <Form.Label className="small text-muted mb-1">
              Created At — Start Date
            </Form.Label>
            <Form.Control
              size="sm"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <Form.Label className="small text-muted mb-1">
              Created At — End Date
            </Form.Label>
            <Form.Control
              size="sm"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Counter badges */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <span
          style={{
            background: "#6c757d",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Total: {loading ? "…" : items.length} Records
        </span>
        <span
          style={{
            background: "#007bff",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Showing: {loading ? "…" : filteredItems.length} Records
        </span>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Detail table */}
      <div className="table-responsive bg-white border rounded">
        <Table hover className="mb-0 align-middle" size="sm">
          <thead style={{ background: "#f3f4f6" }}>
            <tr>
              <th>S.No</th>
              <th>BA ID</th>
              <th>Phone Number</th>
              <th>Buyer Name</th>
              <th>Property Mode</th>
              <th>Property Type</th>
              <th>Min Price</th>
              <th>Max Price</th>
              <th>Payment Type</th>
              <th>Created At</th>
              <th>Added By</th>
              <th>Package Type</th>
              <th className="text-center" style={{ width: 80 }}>
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="text-center text-muted py-4">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center text-muted py-4">
                  No buyers in this budget range.
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center text-muted py-4">
                  No buyers match the current filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((p, idx) => (
                <tr key={p._id || p.ba_id || idx}>
                  <td>{idx + 1}</td>
                  <td
                    style={{
                      fontWeight: 600,
                      color: "#2563eb",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title="View full details"
                    onClick={() => setDetailTarget(p)}
                  >
                    {p.ba_id || "—"}
                  </td>
                  <td><PhoneCell phone={p.phoneNumber} display={p.phoneNumber || "—"} type="tenant" ba_id={p.ba_id} /></td>
                  <td>{p.baName || "—"}</td>
                  <td>{p.propertyMode || "—"}</td>
                  <td>{p.propertyType || "—"}</td>
                  <td>{formatPrice(p.minPrice)}</td>
                  <td>{formatPrice(p.maxPrice)}</td>
                  <td>{p.planDetails?.planType || "—"}</td>
                  <td>
                    {p.createdAt
                      ? moment(p.createdAt).format("DD-MM-YYYY HH:mm")
                      : "—"}
                  </td>
                  <td>{p.addedBy || p.adminName || "—"}</td>
                  <td>{p.planDetails?.packageType || "—"}</td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      title="Delete buyer assistance"
                      onClick={() => handleDelete(p._id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Full-detail popup — opens when a BA ID is clicked. `scrollable`
          keeps the modal header/footer fixed while the body scrolls. */}
      <Modal
        show={!!detailTarget}
        onHide={() => setDetailTarget(null)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" style={{ color: accent }} />
            Buyer Assistance Details — BA ID: {detailTarget?.ba_id || "—"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh" }}>
          {detailTarget && (
            <>
              {/* All scalar fields */}
              <h6 className="text-muted mb-2">Buyer Information</h6>
              <Table bordered size="sm" className="mb-3">
                <tbody>
                  {Object.entries(detailTarget)
                    .filter(
                      ([key, val]) =>
                        key !== "id" &&
                        key !== "_id" &&
                        key !== "__v" &&
                        (val === null || typeof val !== "object"),
                    )
                    .map(([key, val]) => (
                      <tr key={key}>
                        <th
                          style={{
                            width: "40%",
                            background: "#f3f4f6",
                            fontWeight: 600,
                          }}
                        >
                          {formatLabel(key)}
                        </th>
                        <td style={{ wordBreak: "break-word" }}>
                          {key.toLowerCase().includes("price")
                            ? formatPrice(val)
                            : key === "createdAt" || key === "updatedAt"
                            ? formatDate(val)
                            : formatValue(val)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>

              {/* Nested objects (e.g. planDetails) expanded */}
              {Object.entries(detailTarget)
                .filter(
                  ([, val]) =>
                    val &&
                    typeof val === "object" &&
                    !Array.isArray(val),
                )
                .map(([key, obj]) => (
                  <div key={key} className="mb-3">
                    <h6 className="text-muted mb-2">{formatLabel(key)}</h6>
                    <Table bordered size="sm" className="mb-0">
                      <tbody>
                        {Object.entries(obj).map(([k, v]) => (
                          <tr key={k}>
                            <th
                              style={{
                                width: "40%",
                                background: "#f3f4f6",
                                fontWeight: 600,
                              }}
                            >
                              {formatLabel(k)}
                            </th>
                            <td style={{ wordBreak: "break-word" }}>
                              {k.toLowerCase().includes("price")
                                ? formatPrice(v)
                                : formatValue(v)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailTarget(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BuyerBudgetDetail;
