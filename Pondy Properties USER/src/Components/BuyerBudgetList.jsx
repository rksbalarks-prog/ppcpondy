import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  MdOutlineCall,
  MdOutlineMapsHomeWork,
  MdCalendarMonth,
} from "react-icons/md";
import { GoHome } from "react-icons/go";
import { TfiLocationPin } from "react-icons/tfi";
import profil from "../Assets/xd_profile.png";
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import minrupe from "../Assets/Price Mini-01.png";
import maxrupe from "../Assets/Price maxi-01.png";
import {
  LAKH_BUCKETS,
  CRORE_BUCKETS,
  ABOVE_TEN_BUCKET,
  CRORE,
} from "../utils/pricingBuckets";

// Resolve the URL slug → bucket definition (+ a display accent colour).
const findBucket = (key) => {
  const lakh = LAKH_BUCKETS.find((b) => b.key === key);
  if (lakh) {
    return {
      bucket: lakh,
      accent: "#16a34a",
      isFirstLakh: LAKH_BUCKETS[0].key === key,
    };
  }
  const crore = CRORE_BUCKETS.find((b) => b.key === key);
  if (crore) return { bucket: crore, accent: "#7c3aed" };
  if (key === ABOVE_TEN_BUCKET.key) {
    return { bucket: ABOVE_TEN_BUCKET, accent: "#dc2626", isAbove: true };
  }
  return null;
};

const formatPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "N/A";
  if (price >= CRORE) return (price / CRORE).toFixed(2) + " Cr";
  if (price >= 100000) return (price / 100000).toFixed(2) + " Lakhs";
  return price.toLocaleString("en-IN");
};

// Buyers in the user app whose Max Price (budget ceiling) falls in the price
// bucket the user tapped on the Buyer Budget running strip.
const BuyerBudgetList = () => {
  const { bucket: bucketKey } = useParams();
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolved = useMemo(() => findBucket(bucketKey), [bucketKey]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/baActive-buyerAssistance-all-plans`
        );
        if (cancelled) return;
        setBuyers(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        // Leave the list empty on failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep only buyers whose Max Price lands in this bucket — same rule the
  // running strip uses, so the count on the box matches this list.
  const items = useMemo(() => {
    if (!resolved) return [];
    const { bucket, isFirstLakh, isAbove } = resolved;
    return buyers
      .filter((b) => {
        const price = Number(b?.maxPrice);
        if (!Number.isFinite(price) || price < 0) return false;
        if (isAbove) return price > 10 * CRORE;
        if (isFirstLakh) return price <= bucket.max;
        return price > bucket.min && price <= bucket.max;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [buyers, resolved]);

  return (
    <div className="d-flex justify-content-center w-100">
    <div
      style={{
        maxWidth: "500px",
        width: "100%",
        padding: "10px",
        overflowY: "auto",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center mb-3">
        <button
          onClick={() => navigate(-1)}
          className="btn p-2 d-flex align-items-center"
          style={{ border: "none", background: "transparent" }}
        >
          <FaArrowLeft size={18} />
        </button>
        <h3 className="m-0 ms-2" style={{ fontSize: "18px" }}>
          {resolved ? (
            <>
              Buyers —{" "}
              <span style={{ color: resolved.accent }}>
                {resolved.bucket.label}
              </span>
            </>
          ) : (
            "Buyers"
          )}
        </h3>
      </div>

      {!resolved ? (
        <div className="text-center my-5 text-muted">
          Unknown price range.
        </div>
      ) : loading ? (
        <div className="text-center my-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading buyers...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center my-5">
          <img src={NoData} alt="No data" width={120} />
          <p>No buyers in this budget range.</p>
        </div>
      ) : (
        <div className="d-flex flex-column" style={{ gap: "12px" }}>
          {items.map((card) => (
            <div
              key={card._id || card.ba_id}
              className="card p-2"
              style={{ background: "#F9F9F9", overflow: "hidden" }}
            >
              <div className="row d-flex align-items-center">
                <div className="col-3 d-flex align-items-center justify-content-center">
                  <img
                    src={profil}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: "56px", height: "56px", objectFit: "cover" }}
                  />
                </div>
                <div className="col-9">
                  <div className="d-flex justify-content-between">
                    <p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: 500 }}>
                      BA ID: {card.ba_id}
                    </p>
                    <p className="m-0 text-muted" style={{ fontSize: "12px", fontWeight: 500 }}>
                      <MdCalendarMonth size={12} className="me-1" color="#019988" />
                      {card.createdAt ? String(card.createdAt).slice(0, 10) : "N/A"}
                    </p>
                  </div>
                  <h5 className="mb-1" style={{ fontSize: "15px", color: "#000", fontWeight: 500 }}>
                    {card.baName || "N/A"}{" "}
                    <span className="text-muted" style={{ fontSize: "12px" }}>
                      | Buyer
                    </span>
                  </h5>
                  <div className="d-flex align-items-center">
                    <p className="mb-0 me-3 d-flex align-items-center" style={{ fontSize: "12px", fontWeight: 500 }}>
                      <img src={minrupe} alt="min" width={13} className="me-1" />
                      {formatPrice(card.minPrice)}
                    </p>
                    <p className="mb-0 d-flex align-items-center" style={{ fontSize: "12px", fontWeight: 500 }}>
                      <img src={maxrupe} alt="max" width={13} className="me-1" />
                      {formatPrice(card.maxPrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="d-flex align-items-center overflow-auto mt-2 p-1 rounded-1"
                style={{ whiteSpace: "nowrap", border: "1px solid #019988" }}
              >
                <div className="d-flex align-items-center me-3">
                  <GoHome size={12} className="me-1" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyMode}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdOutlineMapsHomeWork size={12} className="me-1" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.propertyType}</p>
                </div>
                <div className="d-flex align-items-center me-3">
                  <MdCalendarMonth size={12} className="me-1" color="#019988" />
                  <p className="mb-0" style={{ fontSize: "12px" }}>{card.paymentType}</p>
                </div>
              </div>

              <div className="mt-2">
                <p className="mb-0 fw-semibold" style={{ fontSize: "12px" }}>
                  <TfiLocationPin size={14} className="me-1" color="#019988" />
                  {card.area}, {card.city}
                </p>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="d-flex align-items-center">
                  <MdOutlineCall color="#019988" style={{ fontSize: "12px", marginRight: "6px" }} />
                  <h6 className="m-0 text-muted" style={{ fontSize: "12px" }}>
                    {card.phoneNumber
                      ? `Buyer Phone: ${String(card.phoneNumber).slice(0, -5)}*****`
                      : "Phone: N/A"}
                  </h6>
                </div>
                <button
                  className="btn text-white px-3 py-1"
                  style={{ background: "#2F747F", fontSize: "13px" }}
                  onClick={() =>
                    navigate(`/detail-buyer-assistance/${card.ba_id}`)
                  }
                >
                  More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default BuyerBudgetList;
