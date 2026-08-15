import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LAKH_BUCKETS,
  CRORE_BUCKETS,
  ABOVE_TEN_BUCKET,
  tallyBuckets,
} from "../utils/pricingBuckets";

// Expand a bucket's short code into the full amount name —
// "10 L" → "10 Lakhs", "1 Cr" → "1 Crore", "3 Cr" → "3 Crores",
// "10 Cr+" → "10 Crores+".
const fullAmountName = (short) => {
  if (!short) return short;
  const plus = short.includes("+") ? "+" : "";
  const num = parseInt(short, 10);
  if (short.includes("Cr")) {
    return `${num} Crore${num === 1 ? "" : "s"}${plus}`;
  }
  if (short.includes("L")) {
    return `${num} Lakh${num === 1 ? "" : "s"}${plus}`;
  }
  return short;
};

// Right-to-left running strip of compact "Exclusive Properties" boxes — same
// card model as the BuyerBudgetMarquee directly below it, so both strips read
// consistently. Each approved property is counted in exactly one price bucket
// (mirrors the admin Pricing Info page); empty buckets are hidden.
const PricingInfoMarquee = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // The bucket whose properties are shown in the popup (null = popup closed).
  const [selectedBucket, setSelectedBucket] = useState(null);

  // Open a property's detail page from the popup. Closes the popup first so
  // the user isn't dropped back onto an overlay when they navigate back.
  const openPropertyDetail = (p) => {
    if (!p || !p.ppcId) return;
    setSelectedBucket(null);
    navigate(`/detail/${p.ppcId}`, { state: { phoneNumber: p.phoneNumber } });
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Same endpoint the admin Pricing Info page uses, so the counts the
        // user sees in this strip always match the admin dashboard.
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/fetch-active-users-datas-all`
        );
        if (cancelled) return;
        setProperties(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch (err) {
        // Silently swallow — the strip is informational and shouldn't break
        // the page when the API is unavailable.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Same accent palette as BuyerBudgetMarquee so the two strips read together:
  // lakh ranges = green, crore ranges = purple, above 10 Cr = red.
  const boxes = useMemo(() => {
    const { lakhCounts, croreCounts, aboveTen } = tallyBuckets(properties);
    const list = [];
    LAKH_BUCKETS.forEach((b, i) => {
      if (lakhCounts[i] > 0) {
        list.push({ ...b, count: lakhCounts[i], accent: "#16a34a" });
      }
    });
    CRORE_BUCKETS.forEach((b, i) => {
      if (croreCounts[i] > 0) {
        list.push({ ...b, count: croreCounts[i], accent: "#7c3aed" });
      }
    });
    if (aboveTen > 0) {
      list.push({ ...ABOVE_TEN_BUCKET, count: aboveTen, accent: "#dc2626" });
    }
    return list;
  }, [properties]);

  // Total = sum of the per-bucket counts shown in the strip, so the leading
  // "Total Property Available" card always matches what scrolls past.
  const totalCount = useMemo(
    () => boxes.reduce((s, b) => s + b.count, 0),
    [boxes]
  );

  // Properties that fall into the bucket the user tapped — same matching
  // rule used in tallyBuckets so the popup count matches the card count.
  const selectedProperties = useMemo(() => {
    if (!selectedBucket) return [];
    return properties
      .filter((p) => {
        const price = Number(p?.price);
        if (!Number.isFinite(price) || price < 0) return false;
        if (selectedBucket.key === LAKH_BUCKETS[0].key) {
          return price <= selectedBucket.max;
        }
        if (selectedBucket.key === ABOVE_TEN_BUCKET.key) {
          return price > selectedBucket.min;
        }
        return price > selectedBucket.min && price <= selectedBucket.max;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [properties, selectedBucket]);

  // Close the popup with Esc — cheap accessibility win.
  useEffect(() => {
    if (!selectedBucket) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedBucket(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBucket]);

  // One compact card box for a single price bucket. Box styling matches
  // BuyerBudgetMarquee's renderBox so the two scrolls line up visually.
  const renderBox = (box, key) => (
    <span
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedBucket(box)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedBucket(box);
        }
      }}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "104px",
        background: "#FFFFFF",
        border: `2px solid ${box.accent}55`,
        borderRadius: "8px",
        padding: "4px 10px",
        marginRight: "8px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 800, color: box.accent }}>
        {fullAmountName(box.short)}
      </span>
      <span style={{ fontSize: "9px", color: "#6b7280" }}>{box.label}</span>
      <span
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: box.accent,
          lineHeight: 1.15,
        }}
      >
        {box.count}
      </span>
      <span style={{ fontSize: "13px", color: "#000000", fontWeight: 800 }}>
        {box.count === 1 ? "Property" : "Properties"}
      </span>
    </span>
  );

  // One "track" of boxes; rendered twice so the -50% translate keyframe
  // produces a seamless loop.
  const renderTrack = (keyPrefix) => (
    <span style={{ display: "inline-flex", alignItems: "center", paddingRight: "12px" }}>
      {boxes.map((box, i) => renderBox(box, `${keyPrefix}-${i}`))}
    </span>
  );

  // Don't render until the fetch resolves; hide if there are no buckets.
  if (!loaded || boxes.length === 0) return null;

  return (
    <div style={{ marginTop: 0, marginBottom: "2px" }}>
      {/* Plain-text section title above the scroll — matches the reference
          screenshot (no leading box card). */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 4px 2px",
          fontSize: "14px",
          fontWeight: 700,
          color: "#0B2545",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.2,
        }}
      >
        <span style={{ marginRight: "6px" }}>🏠</span>
        Total Property Available ({totalCount})
      </div>

      <div
      style={{
        background: "linear-gradient(90deg, #E8F1FB 0%, #F5F9FF 50%, #E8F1FB 100%)",
        border: "1px solid #C7D9EE",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(11, 37, 69, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "2px 0",
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div
            className="ppc-pricing-marquee-track"
            style={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              animation: "ppcPricingMarquee 35s linear infinite",
            }}
          >
            {renderTrack("a")}
            {renderTrack("b")}
          </div>
        </div>
      </div>

      {/* Keyframes scoped via a style tag so the component is self-contained. */}
      <style>{`
        @keyframes ppcPricingMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ppc-pricing-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>

    {/* Popup — opens when the user taps a price-bucket card. Lists all
        properties whose price falls in that bucket. */}
    {selectedBucket && (
      <div
        onClick={() => setSelectedBucket(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 12,
            width: "100%",
            maxWidth: 460,
            maxHeight: "82vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Header — coloured by the bucket accent. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: selectedBucket.accent,
              color: "#fff",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {fullAmountName(selectedBucket.short)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.95 }}>
                {selectedBucket.label} · {selectedProperties.length}{" "}
                {selectedProperties.length === 1 ? "Property" : "Properties"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBucket(null)}
              aria-label="Close"
              style={{
                border: "none",
                background: "rgba(255,255,255,0.22)",
                color: "#fff",
                borderRadius: "50%",
                width: 30,
                height: 30,
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* List body */}
          <div style={{ overflowY: "auto", padding: "10px 12px" }}>
            {selectedProperties.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "24px 8px",
                  color: "#888",
                  margin: 0,
                }}
              >
                No properties in this range right now.
              </p>
            ) : (
              selectedProperties.map((p) => (
                <div
                  key={p._id || p.ppcId}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: "#0B2545",
                      }}
                    >
                      {p.propertyType || "Property"}
                      {p.propertyMode && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#555",
                            marginLeft: 6,
                          }}
                        >
                          · {p.propertyMode}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 14,
                        color: selectedBucket.accent,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹ {Number(p.price).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#1f2937",
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    📍 {p.area || "-"}
                    {p.city ? `, ${p.city}` : ""}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      fontSize: 12,
                      color: "#1f2937",
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    {p.bedrooms && <span>🛏 {p.bedrooms} BHK</span>}
                    {p.totalArea && (
                      <span>
                        📐 {p.totalArea} {p.areaUnit || ""}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "#374151",
                      fontWeight: 700,
                      marginTop: 6,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>PPC ID: {p.ppcId || "-"}</span>
                    {p.createdAt && (
                      <span>
                        Posted {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* "More" — opens the full property detail page. */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openPropertyDetail(p)}
                      style={{
                        background: "#2F747F",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "5px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      More
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default PricingInfoMarquee;
