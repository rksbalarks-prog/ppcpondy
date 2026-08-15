import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaTags, FaHome, FaGem, FaUsers } from "react-icons/fa";
import { LAKH_BUCKETS, CRORE_BUCKETS } from "./utils/pricingBuckets";

const PricingInfo = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Buyer Assistance records — bucketed by their Max Price (budget ceiling).
  const [buyers, setBuyers] = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        // Same endpoint Approved Property page uses, so counts always agree
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

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        // Same endpoint the Active Buyer Assistance page uses.
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/baActive-buyerAssistance-all-plans`
        );
        setBuyers(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        // Non-fatal — the buyer section just shows zeros if this fails.
      } finally {
        setBuyersLoading(false);
      }
    };
    fetchBuyers();
  }, []);

  // Single pass: tally every property into exactly one bucket. The last
  // crore bucket is open-ended ("8 Cr & above"), so anything above 10 Cr
  // is folded into it and the total matches the Approved page.
  const { lakhCounts, croreCounts, total } = useMemo(() => {
    const lakhCounts = new Array(LAKH_BUCKETS.length).fill(0);
    const croreCounts = new Array(CRORE_BUCKETS.length).fill(0);
    let total = 0;

    properties.forEach((prop) => {
      const price = Number(prop?.price);
      if (!Number.isFinite(price) || price < 0) return;
      total += 1;

      // Walk the lakh buckets first (small prices are the common case)
      const li = LAKH_BUCKETS.findIndex(
        (b, i) =>
          i === 0 ? price <= b.max : price > b.min && price <= b.max
      );
      if (li !== -1) {
        lakhCounts[li] += 1;
        return;
      }
      const ci = CRORE_BUCKETS.findIndex(
        (b) => price > b.min && price <= b.max
      );
      if (ci !== -1) {
        croreCounts[ci] += 1;
      }
    });

    return { lakhCounts, croreCounts, total };
  }, [properties]);

  // Tally Buyer Assistance records into the same buckets, keyed on each
  // buyer's Max Price (budget ceiling). Each buyer lands in one bucket.
  const {
    buyerLakhCounts,
    buyerCroreCounts,
    buyerLakhTotal,
    buyerCroreTotal,
    buyerTotal,
  } = useMemo(() => {
    const buyerLakhCounts = new Array(LAKH_BUCKETS.length).fill(0);
    const buyerCroreCounts = new Array(CRORE_BUCKETS.length).fill(0);
    let buyerTotal = 0;

    buyers.forEach((b) => {
      const price = Number(b?.maxPrice);
      if (!Number.isFinite(price) || price < 0) return;
      buyerTotal += 1;

      const li = LAKH_BUCKETS.findIndex((bk, i) =>
        i === 0 ? price <= bk.max : price > bk.min && price <= bk.max
      );
      if (li !== -1) {
        buyerLakhCounts[li] += 1;
        return;
      }
      const ci = CRORE_BUCKETS.findIndex(
        (bk) => price > bk.min && price <= bk.max
      );
      if (ci !== -1) {
        buyerCroreCounts[ci] += 1;
      }
    });

    return {
      buyerLakhCounts,
      buyerCroreCounts,
      buyerLakhTotal: buyerLakhCounts.reduce((a, b) => a + b, 0),
      buyerCroreTotal: buyerCroreCounts.reduce((a, b) => a + b, 0),
      buyerTotal,
    };
  }, [buyers]);

  // Navigate to the bucket detail page. Empty buckets are non-clickable so
  // we never push a route that would render an empty table.
  const goToBucket = (bucketKey, count) => {
    if (loading || !count) return;
    navigate(`/dashboard/pricing-info/${bucketKey}`);
  };

  // Same as goToBucket, but for the Buyer Budget cards.
  const goToBuyerBucket = (bucketKey, count) => {
    if (buyersLoading || !count) return;
    navigate(`/dashboard/buyer-budget-info/${bucketKey}`);
  };

  // ── Card component (mirrors the Pincode Property card style) ─────
  // `readOnly` renders a non-clickable card (used for the Buyer Budget
  // section, which has no per-bucket detail page). `unit` is the small
  // caption under the count ("Properties" / "Buyers").
  const PriceCard = ({
    label,
    short,
    count,
    accent,
    onClick,
    disabled,
    readOnly,
    unit = "Properties",
  }) => (
    <div
      role={readOnly ? undefined : "button"}
      tabIndex={disabled || readOnly ? -1 : 0}
      onClick={disabled || readOnly ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled || readOnly) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="border rounded p-3 text-center h-100"
      style={{
        background: "#ffffff",
        borderColor: accent ? `${accent}55` : "#e5e7eb",
        borderWidth: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: disabled || readOnly ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled || readOnly) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: accent || "#16a34a",
          marginBottom: "4px",
        }}
      >
        {short}
      </div>
      <div className="text-muted small mb-2" style={{ fontSize: "0.72rem" }}>
        {label}
      </div>
      <div
        className="rounded p-2"
        style={{
          background: accent ? `${accent}11` : "#f0fdf4",
        }}
      >
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: accent || "#16a34a",
            lineHeight: 1,
          }}
        >
          {count}
        </div>
        <div className="text-muted" style={{ fontSize: "0.7rem" }}>
          {unit}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3" style={{ background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <FaTags size={24} style={{ color: "#16a34a" }} />
        <h2 className="mb-0" style={{ fontWeight: 700 }}>
          Pricing Info
        </h2>
      </div>
      <p className="text-muted mb-4">
        Approved properties grouped by price range. Each property is counted in
        exactly one bucket. Click any bucket to see the property list.
      </p>

      {/* Summary tiles */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white text-center h-100">
            <div className="text-muted small">Total Approved Properties</div>
            <div
              style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a" }}
            >
              {loading ? "…" : total}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white text-center h-100">
            <div className="text-muted small">Within Lacs Range (≤ 90 L)</div>
            <div
              style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}
            >
              {loading
                ? "…"
                : lakhCounts.reduce((a, b) => a + b, 0)}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white text-center h-100">
            <div className="text-muted small">Within Crores Range (≤ 10 Cr)</div>
            <div
              style={{ fontSize: "2rem", fontWeight: 700, color: "#7c3aed" }}
            >
              {loading
                ? "…"
                : croreCounts.reduce((a, b) => a + b, 0)}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Lacs row */}
      <div className="d-flex align-items-center gap-2 mb-2 mt-3">
        <FaHome style={{ color: "#16a34a" }} />
        <h5 className="mb-0" style={{ fontWeight: 600 }}>
          Properties by Price — Lacs
        </h5>
      </div>
      <div className="row g-3 mb-4">
        {LAKH_BUCKETS.map((b, i) => (
          <div className="col" key={b.key} style={{ minWidth: 160 }}>
            <PriceCard
              label={b.label}
              short={b.short}
              count={loading ? "…" : lakhCounts[i]}
              accent="#16a34a"
              disabled={loading || lakhCounts[i] === 0}
              onClick={() => goToBucket(b.key, lakhCounts[i])}
            />
          </div>
        ))}
      </div>

      {/* Crores row */}
      <div className="d-flex align-items-center gap-2 mb-2 mt-3">
        <FaGem style={{ color: "#7c3aed" }} />
        <h5 className="mb-0" style={{ fontWeight: 600 }}>
          Properties by Price — Crores
        </h5>
      </div>
      <div className="row g-3 mb-4">
        {CRORE_BUCKETS.map((b, i) => (
          <div className="col" key={b.key} style={{ minWidth: 160 }}>
            <PriceCard
              label={b.label}
              short={b.short}
              count={loading ? "…" : croreCounts[i]}
              accent="#7c3aed"
              disabled={loading || croreCounts[i] === 0}
              onClick={() => goToBucket(b.key, croreCounts[i])}
            />
          </div>
        ))}
      </div>

      {/* ── Buyer Budget by Price ───────────────────────────────────
          Active Buyer Assistance records grouped by their Max Price
          (budget ceiling), using the same buckets as the property side. */}
      <div className="d-flex align-items-center gap-2 mb-1 mt-4 pt-3 border-top">
        <FaUsers size={22} style={{ color: "#0d6efd" }} />
        <h4 className="mb-0" style={{ fontWeight: 700 }}>
          Buyer Budget by Price
        </h4>
      </div>
      <p className="text-muted mb-4">
        Active Buyer Assistance records grouped by their Max Price (budget
        ceiling). Each buyer is counted in exactly one bucket.
      </p>

      {/* Buyer summary tiles */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white text-center h-100">
            <div className="text-muted small">Total Buyers</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a" }}>
              {buyersLoading ? "…" : buyerTotal}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white text-center h-100">
            <div className="text-muted small">Within Lacs Range (≤ 90 L)</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}>
              {buyersLoading ? "…" : buyerLakhTotal}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded p-3 bg-white text-center h-100">
            <div className="text-muted small">Within Crores Range</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#7c3aed" }}>
              {buyersLoading ? "…" : buyerCroreTotal}
            </div>
          </div>
        </div>
      </div>

      {/* Buyers — Lacs row */}
      <div className="d-flex align-items-center gap-2 mb-2 mt-3">
        <FaHome style={{ color: "#16a34a" }} />
        <h5 className="mb-0" style={{ fontWeight: 600 }}>
          Buyers by Budget — Lacs
        </h5>
      </div>
      <div className="row g-3 mb-4">
        {LAKH_BUCKETS.map((b, i) => (
          <div className="col" key={b.key} style={{ minWidth: 160 }}>
            <PriceCard
              label={b.label}
              short={b.short}
              count={buyersLoading ? "…" : buyerLakhCounts[i]}
              accent="#16a34a"
              unit="Buyers"
              disabled={buyersLoading || buyerLakhCounts[i] === 0}
              onClick={() => goToBuyerBucket(b.key, buyerLakhCounts[i])}
            />
          </div>
        ))}
      </div>

      {/* Buyers — Crores row */}
      <div className="d-flex align-items-center gap-2 mb-2 mt-3">
        <FaGem style={{ color: "#7c3aed" }} />
        <h5 className="mb-0" style={{ fontWeight: 600 }}>
          Buyers by Budget — Crores
        </h5>
      </div>
      <div className="row g-3 mb-4">
        {CRORE_BUCKETS.map((b, i) => (
          <div className="col" key={b.key} style={{ minWidth: 160 }}>
            <PriceCard
              label={b.label}
              short={b.short}
              count={buyersLoading ? "…" : buyerCroreCounts[i]}
              accent="#7c3aed"
              unit="Buyers"
              disabled={buyersLoading || buyerCroreCounts[i] === 0}
              onClick={() => goToBuyerBucket(b.key, buyerCroreCounts[i])}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingInfo;
