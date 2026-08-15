import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LAKH_BUCKETS,
  CRORE_BUCKETS,
  ABOVE_TEN_BUCKET,
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

// Right-to-left running strip of compact "Buyer Budget by Price" boxes —
// mirrors the admin Pricing Info page's Buyer Budget section. Active Buyer
// Assistance records are bucketed by their Max Price (budget ceiling) and
// each bucket scrolls past as a small card. Rendered directly under the
// PricingInfoMarquee ticker on the user app's home screen.
const BuyerBudgetMarquee = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Same endpoint the admin Buyer Assistance pages use, so the counts
        // here always match the admin "Buyer Budget by Price" cards.
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/baActive-buyerAssistance-all-plans`
        );
        if (cancelled) return;
        setBuyers(Array.isArray(res.data?.data) ? res.data.data : []);
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

  // Tally buyers into price buckets by their Max Price. Each buyer lands in
  // exactly one bucket; anything above 10 Cr falls into the aboveTen box.
  const boxes = useMemo(() => {
    const lakhCounts = new Array(LAKH_BUCKETS.length).fill(0);
    const croreCounts = new Array(CRORE_BUCKETS.length).fill(0);
    let aboveTen = 0;

    buyers.forEach((b) => {
      const price = Number(b?.maxPrice);
      if (!Number.isFinite(price) || price < 0) return;

      const li = LAKH_BUCKETS.findIndex((bk, i) =>
        i === 0 ? price <= bk.max : price > bk.min && price <= bk.max
      );
      if (li !== -1) {
        lakhCounts[li] += 1;
        return;
      }
      const ci = CRORE_BUCKETS.findIndex(
        (bk) => price > bk.min && price <= bk.max
      );
      if (ci !== -1) {
        croreCounts[ci] += 1;
        return;
      }
      aboveTen += 1;
    });

    // Only show buckets that currently have at least one buyer. A bucket
    // with zero buyers is skipped; the moment a buyer is added in that
    // range its box appears automatically (counts are computed on fetch).
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
  }, [buyers]);

  // Total = sum of the per-bucket counts shown in the strip, so the leading
  // "Total Buyers Available" card always matches what scrolls past.
  const totalCount = useMemo(
    () => boxes.reduce((s, b) => s + b.count, 0),
    [boxes]
  );

  // One compact card box for a single price bucket. Tapping it opens the
  // list of buyers whose budget falls in that range.
  const renderBox = (box, key) => (
    <span
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/buyer-budget-list/${box.key}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/buyer-budget-list/${box.key}`);
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
        {box.count === 1 ? "Buyer" : "Buyers"}
      </span>
    </span>
  );

  // One "track" of boxes; the outer element renders it twice so the -50%
  // translate keyframe produces a seamless loop.
  const renderTrack = (keyPrefix) => (
    <span style={{ display: "inline-flex", alignItems: "center", paddingRight: "12px" }}>
      {boxes.map((box, i) => renderBox(box, `${keyPrefix}-${i}`))}
    </span>
  );

  // Don't render until the fetch resolves; hide if there are no buyers.
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
          color: "#0F766E",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.2,
        }}
      >
        <span style={{ marginRight: "6px" }}>👤</span>
        Total Buyers Available ({totalCount})
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
            className="ppc-buyer-budget-marquee-track"
            style={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              animation: "ppcBuyerBudgetMarquee 35s linear infinite",
            }}
          >
            {renderTrack("a")}
            {renderTrack("b")}
          </div>
        </div>
      </div>

      {/* Keyframes scoped via a style tag so the component is self-contained. */}
      <style>{`
        @keyframes ppcBuyerBudgetMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ppc-buyer-budget-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
    </div>
  );
};

export default BuyerBudgetMarquee;
