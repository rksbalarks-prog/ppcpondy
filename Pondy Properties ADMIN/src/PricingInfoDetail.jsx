import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { FaArrowLeft, FaTags, FaFilter, FaTimes } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { findBucketByKey, priceMatchesBucket } from "./utils/pricingBuckets";

// ─── Helpers (kept in sync with PricingInfo.jsx) ─────────────────────
const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const formatPrice = (val) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return `₹ ${n.toLocaleString("en-IN")}`;
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

// Build the PPC photo URL the same way the Approved page does.
const photoUrl = (photo) =>
  `https://ppcpondy.com/PPC/${String(photo).replace(/\\/g, "/")}`;

// The per-phone activity counts from /get-user-activity-counts (carstatics),
// with the label shown in the Statistics column.
const STAT_FIELDS = [
  { key: "interestCount", label: "Interest" },
  { key: "contactCount", label: "Contact" },
  { key: "favoriteCount", label: "Favorite" },
  { key: "photoRequestCount", label: "Photo Request" },
  { key: "offerCount", label: "Offer" },
  { key: "calledListCount", label: "Called List" },
  { key: "viewedPropertyCount", label: "Viewed Property" },
];

const PricingInfoDetail = () => {
  const { bucket: bucketKey } = useParams();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Map of 10-digit phone → total activity count from the carstatics endpoint.
  // Drives the "Statistics" column.
  const [statsMap, setStatsMap] = useState({});

  // ── Filter state — only the 5 fields the user asked for ──────────
  const [ppcIdSearch, setPpcIdSearch] = useState("");
  const [phoneNumberSearch, setPhoneNumberSearch] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [propertyModeFilter, setPropertyModeFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const clearFilters = () => {
    setPpcIdSearch("");
    setPhoneNumberSearch("");
    setPropertyTypeFilter("");
    setPropertyModeFilter("");
    setPriceMin("");
    setPriceMax("");
    setStartDate("");
    setEndDate("");
  };

  // ── Delete state — soft-delete via the same endpoint Approved uses ──
  // Holds the row queued for deletion + the reason the admin types in.
  // `deleting` flag guards the modal Confirm button against double-submits.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Detail popup state — holds the property whose full details are shown ──
  const [detailTarget, setDetailTarget] = useState(null);

  // ── Image viewer state — { photos: [], index: n } when a photo is opened ──
  const [imageViewer, setImageViewer] = useState(null);

  const showPrevImage = () =>
    setImageViewer((v) =>
      v
        ? { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length }
        : v,
    );
  const showNextImage = () =>
    setImageViewer((v) =>
      v ? { ...v, index: (v.index + 1) % v.photos.length } : v,
    );

  const openDelete = (prop) => {
    setDeleteTarget(prop);
    setDeletionReason("");
    setDeleteError("");
  };
  const closeDelete = () => {
    if (deleting) return; // don't allow dismiss mid-request
    setDeleteTarget(null);
    setDeletionReason("");
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !deletionReason.trim()) return;
    setDeleting(true);
    setDeleteError("");
    try {
      // Same endpoint Approved Property uses → flips isDeleted=true server-side,
      // so the row disappears from both Approved and this page after refresh.
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin-delete`,
        { deletionReason: deletionReason.trim() },
        { params: { ppcId: deleteTarget.ppcId } }
      );

      // Drop locally so the table updates without a full refetch.
      // /fetch-active-users-datas-all only returns active records, so this
      // mirrors what the next page load would show.
      setProperties((prev) =>
        prev.filter((p) => p.ppcId !== deleteTarget.ppcId)
      );

      setDeleteTarget(null);
      setDeletionReason("");
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || "Error deleting property"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Resolve the URL slug → bucket definition once. Unknown slugs render an
  // empty-state fallback instead of crashing.
  const resolved = useMemo(() => findBucketByKey(bucketKey), [bucketKey]);

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/fetch-active-users-datas-all`
        );
        setProperties(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch (err) {
        setError("Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };
    fetchApproved();
  }, []);

  // Pull per-phone activity counts (same data as the /carstatics page) and
  // keep the full per-category breakdown for each phone number.
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/get-user-activity-counts`)
      .then((res) => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const map = {};
        rows.forEach((r) => {
          const phone = String(r.phoneNumber || "").replace(/\D/g, "").slice(-10);
          if (phone.length !== 10) return;
          const breakdown = {};
          STAT_FIELDS.forEach((f) => {
            breakdown[f.key] = Number(r[f.key]) || 0;
          });
          map[phone] = breakdown;
        });
        setStatsMap(map);
      })
      .catch(() => {});
  }, []);

  // Per-category activity counts for a property's phone number (null if none).
  const getStats = (phone) => {
    const key = String(phone || "").replace(/\D/g, "").slice(-10);
    return statsMap[key] || null;
  };

  // Client-side filter — no extra endpoint needed. Reuses the same matching
  // rule as the overview page so counts agree exactly.
  const items = useMemo(() => {
    if (!resolved) return [];
    return properties
      .filter((p) => priceMatchesBucket(p?.price, resolved.bucket))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [properties, resolved]);

  // Distinct Property Type / Mode values inside this bucket — populates the
  // dropdowns so users only see options that will actually return rows.
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
    const ppcQ = ppcIdSearch.trim().toLowerCase();
    const phoneQ = phoneNumberSearch.trim().toLowerCase();
    const minN = priceMin === "" ? null : Number(priceMin);
    const maxN = priceMax === "" ? null : Number(priceMax);

    return items.filter((p) => {
      if (ppcQ && !String(p.ppcId || "").toLowerCase().includes(ppcQ)) {
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
      const priceN = Number(p.price);
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
    ppcIdSearch,
    phoneNumberSearch,
    propertyTypeFilter,
    propertyModeFilter,
    priceMin,
    priceMax,
    startDate,
    endDate,
  ]);

  const filtersActive =
    !!ppcIdSearch ||
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
        <FaTags size={24} style={{ color: accent }} />
        <h2 className="mb-0" style={{ fontWeight: 700 }}>
          <span style={{ color: accent }}>{bucket.label}</span>
          <span className="text-muted ms-2" style={{ fontSize: "1rem" }}>
            — Approved Properties
          </span>
        </h2>
      </div>
      <p className="text-muted mb-3">
        Properties whose price falls in the <strong>{bucket.label}</strong>{" "}
        range.
      </p>

      {/* Filter bar — PPC ID, Phone Number, Property Type, Property Mode, Price */}
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
            <Form.Label className="small text-muted mb-1">PPC ID</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              value={ppcIdSearch}
              onChange={(e) => setPpcIdSearch(e.target.value)}
              placeholder="Search PPC ID"
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
            <Form.Label className="small text-muted mb-1">Price (₹)</Form.Label>
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

      {/* Counter badges — same UI as Approved / LoginReport pages */}
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
              <th>PPC ID</th>
              <th>Phone Number</th>
              <th>Property Type</th>
              <th>Property Mode</th>
              <th>Price</th>
              <th>City</th>
              <th>Pincode</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th className="text-center">Statistics</th>
              <th className="text-center" style={{ width: 80 }}>
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center text-muted py-4">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center text-muted py-4">
                  No properties in this price range.
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center text-muted py-4">
                  No properties match the current filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((p, idx) => (
                <tr key={p._id || p.ppcId || idx}>
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
                    {p.ppcId || "—"}
                  </td>
                  <td>{p.phoneNumber || "—"}</td>
                  <td>{p.propertyType || "—"}</td>
                  <td>{p.propertyMode || "—"}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.city || "—"}</td>
                  <td>{p.pinCode || "—"}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td>{formatDate(p.updatedAt)}</td>
                  <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                    {(() => {
                      const s = getStats(p.phoneNumber);
                      if (!s) return <span className="text-muted">—</span>;
                      const active = STAT_FIELDS.filter((f) => s[f.key] > 0);
                      if (active.length === 0)
                        return <span className="text-muted">No activity</span>;
                      return active.map((f) => (
                        <div key={f.key}>
                          {f.label}: <strong>{s[f.key]}</strong>
                        </div>
                      ));
                    })()}
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      title="Delete property"
                      onClick={() => openDelete(p)}
                    >
                      <MdDeleteForever />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Full-detail popup — opens when a PPC ID is clicked. `scrollable`
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
            <FaTags className="me-2" style={{ color: accent }} />
            Property Details — PPC ID: {detailTarget?.ppcId || "—"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh" }}>
          {detailTarget && (
            <>
              {/* Photo preview + key details side by side */}
              <div className="mb-3 d-flex flex-wrap gap-3">
                {/* Photos — single preview; click to open the full viewer */}
                {Array.isArray(detailTarget.photos) &&
                  detailTarget.photos.length > 0 && (
                    <div>
                      <h6 className="text-muted mb-2">Photos</h6>
                      <div
                        style={{
                          position: "relative",
                          width: 200,
                          cursor: "pointer",
                        }}
                        title="Click to view all photos"
                        onClick={() =>
                          setImageViewer({
                            photos: detailTarget.photos,
                            index: 0,
                          })
                        }
                      >
                        <img
                          src={photoUrl(detailTarget.photos[0])}
                          alt="Property"
                          style={{
                            width: 200,
                            height: 150,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            right: 6,
                            bottom: 6,
                            background: "rgba(0,0,0,0.7)",
                            color: "#fff",
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 12,
                          }}
                        >
                          {detailTarget.photos.length} photos
                        </span>
                      </div>
                    </div>
                  )}

                {/* Key details — important fields beside the image */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h6 className="text-muted mb-2">Key Details</h6>
                  <Table bordered size="sm" className="mb-0">
                    <tbody>
                      {[
                        ["PPC ID", detailTarget.ppcId],
                        ["Price", formatPrice(detailTarget.price)],
                        ["Area", detailTarget.area],
                        ["City", detailTarget.city],
                        ["Bedrooms", detailTarget.bedrooms],
                        ["Phone Number", detailTarget.phoneNumber],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <th
                            style={{
                              width: "40%",
                              background: "#f3f4f6",
                              fontWeight: 600,
                            }}
                          >
                            {label}
                          </th>
                          <td style={{ wordBreak: "break-word" }}>
                            {label === "Price"
                              ? value
                              : formatValue(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* All scalar fields */}
              <h6 className="text-muted mb-2">Property Information</h6>
              <Table bordered size="sm" className="mb-3">
                <tbody>
                  {Object.entries(detailTarget)
                    .filter(
                      ([key, val]) =>
                        key !== "photos" &&
                        key !== "videos" &&
                        key !== "id" &&
                        key !== "_id" &&
                        key !== "__v" &&
                        (val === null ||
                          typeof val !== "object"),
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

              {/* Nested objects (e.g. paymentData) expanded */}
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
                              {formatValue(v)}
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

      {/* Full-image viewer — opens over the detail popup. Big image plus a
          horizontally scrollable thumbnail strip + prev/next navigation. */}
      <Modal
        show={!!imageViewer}
        onHide={() => setImageViewer(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Photo {imageViewer ? imageViewer.index + 1 : 0} of{" "}
            {imageViewer ? imageViewer.photos.length : 0}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#111", padding: 12 }}>
          {imageViewer && (
            <>
              {/* Main image */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={photoUrl(imageViewer.photos[imageViewer.index])}
                  alt={`Property ${imageViewer.index + 1}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "65vh",
                    objectFit: "contain",
                  }}
                />
                {imageViewer.photos.length > 1 && (
                  <>
                    <Button
                      variant="light"
                      onClick={showPrevImage}
                      style={{
                        position: "absolute",
                        left: 8,
                        opacity: 0.85,
                        borderRadius: "50%",
                      }}
                    >
                      ‹
                    </Button>
                    <Button
                      variant="light"
                      onClick={showNextImage}
                      style={{
                        position: "absolute",
                        right: 8,
                        opacity: 0.85,
                        borderRadius: "50%",
                      }}
                    >
                      ›
                    </Button>
                  </>
                )}
              </div>

              {/* Scrollable thumbnail strip */}
              {imageViewer.photos.length > 1 && (
                <div
                  className="d-flex gap-2 mt-3"
                  style={{ overflowX: "auto", paddingBottom: 4 }}
                >
                  {imageViewer.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photoUrl(photo)}
                      alt={`Thumb ${i + 1}`}
                      onClick={() =>
                        setImageViewer((v) => ({ ...v, index: i }))
                      }
                      style={{
                        width: 70,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 4,
                        cursor: "pointer",
                        flex: "0 0 auto",
                        border:
                          i === imageViewer.index
                            ? "3px solid #2563eb"
                            : "3px solid transparent",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete confirmation — same shape as Approved Property's modal so
          admins see a familiar UI and the same deletion-reason requirement. */}
      <Modal show={!!deleteTarget} onHide={closeDelete} centered>
        <Modal.Header closeButton={!deleting}>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteTarget && (
            <p className="mb-2 text-muted small">
              Deleting <strong>PPC ID:</strong> {deleteTarget.ppcId || "—"}{" "}
              <span className="mx-1">·</span>
              <strong>Phone:</strong> {deleteTarget.phoneNumber || "—"}
            </p>
          )}
          <Form.Group controlId="deletionReason">
            <Form.Label>Deletion Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder="Enter reason for deletion"
              disabled={deleting}
              required
            />
          </Form.Group>
          {deleteError && (
            <div className="alert alert-danger mt-3 mb-0 py-2">
              {deleteError}
            </div>
          )}
          <p className="text-muted small mt-3 mb-0">
            This will mark the property as deleted in the Approved Property
            list as well.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeDelete}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={!deletionReason.trim() || deleting}
          >
            {deleting ? "Deleting…" : "Confirm Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PricingInfoDetail;
