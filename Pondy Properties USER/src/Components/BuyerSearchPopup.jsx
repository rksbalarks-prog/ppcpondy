import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaIdCard,
  FaRupeeSign,
  FaCity,
  FaRegBuilding,
  FaTimes,
} from "react-icons/fa";
import { LuBedDouble, LuBuilding } from "react-icons/lu";
import { GrSteps } from "react-icons/gr";
import { HiOutlineBuildingLibrary } from "react-icons/hi2";
import { PiMapPinAreaLight } from "react-icons/pi";

// Same filter shape FormComponent uses, so BuyerListFilter can read them
// the same way regardless of which entry point the user came from.
const initialFilters = {
  id: "",
  minPrice: "",
  maxPrice: "",
  propertyMode: "",
  propertyType: "",
  bedrooms: "",
  floorNo: "",
  state: "",
  city: "",
  area: "",
};

const inputCardStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #2F747F",
  background: "#fff",
  padding: "4px",
  borderRadius: "5px",
};
const inputStyle = {
  flex: 1,
  padding: "8px",
  fontSize: "14px",
  border: "none",
  outline: "none",
  background: "transparent",
};
const iconStyle = { color: "#2F747F", marginLeft: "10px" };
const selectStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #2F747F",
  borderRadius: "5px",
  background: "#fff",
  color: "#2F747F",
  fontSize: "14px",
};

// Bootstrap-modal version of the Buyer Assistance Search form. Triggered by
//   data-bs-toggle="modal" data-bs-target="#buyerSearchPopup"
// from anywhere in the dashboard. On submit it closes itself and navigates
// to /Buyer-List-Filter with the filters in router state — same contract as
// the old standalone /FormComponent page so the receiver doesn't change.
const BuyerSearchPopup = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [dropdownData, setDropdownData] = useState({});

  // Pull dropdown options the same way FormComponent does so the lists stay
  // in sync (Property Mode, Property Type, bedrooms, floorNo, etc.).
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${process.env.REACT_APP_API_URL}/fetch`)
      .then((res) => {
        if (cancelled) return;
        const grouped = (res.data?.data || []).reduce((acc, item) => {
          if (!acc[item.field]) acc[item.field] = [];
          if (!acc[item.field].includes(item.value)) {
            acc[item.field].push(item.value);
          }
          return acc;
        }, {});
        setDropdownData(grouped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => setFilters(initialFilters);

  // Close the popup with the same fallback chain the Search Property popup
  // uses — window.bootstrap isn't always exposed in this build, so we fall
  // back to clicking the modal's own dismiss button and, last resort, to a
  // manual DOM teardown.
  const closePopup = () => {
    const modal = document.getElementById("buyerSearchPopup");
    if (!modal) return;
    try {
      if (window.bootstrap && window.bootstrap.Modal) {
        const inst =
          window.bootstrap.Modal.getInstance(modal) ||
          window.bootstrap.Modal.getOrCreateInstance(modal);
        if (inst) {
          inst.hide();
          return;
        }
      }
    } catch (_) {}
    const dismissBtn = modal.querySelector('[data-bs-dismiss="modal"]');
    if (dismissBtn) {
      dismissBtn.click();
      return;
    }
    modal.classList.remove("show");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
    document
      .querySelectorAll(".modal-backdrop")
      .forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    closePopup();
    navigate("/Buyer-List-Filter", { state: { filters } });
  };

  // Render a labelled <select> from /fetch options, or a disabled "Loading…"
  // placeholder while the options haven't arrived yet.
  const renderSelect = (name, label, Icon) => {
    const options = dropdownData[name] || [];
    return (
      <div className="form-group mb-3">
        <label
          style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}
        >
          {label}
        </label>
        <div style={{ position: "relative" }}>
          <Icon
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#2F747F",
              pointerEvents: "none",
            }}
          />
          <select
            name={name}
            value={filters[name]}
            onChange={handleChange}
            style={{ ...selectStyle, paddingLeft: 32 }}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div
      className="modal fade"
      id="buyerSearchPopup"
      tabIndex={-1}
      aria-labelledby="buyerSearchPopupLabel"
      aria-hidden="true"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        style={{ maxHeight: "calc(100vh - 40px)" }}
      >
        <div
          className="modal-content rounded-3"
          style={{ maxHeight: "calc(100vh - 40px)" }}
        >
          <div className="modal-header">
            <h5 className="modal-title" id="buyerSearchPopupLabel">
              Buyer Search
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div
              className="modal-body"
              style={{
                maxHeight: "calc(100vh - 200px)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {/* ID */}
              <div className="form-group mb-3">
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  ID
                </label>
                <div style={inputCardStyle}>
                  <FaIdCard style={iconStyle} />
                  <input
                    type="text"
                    name="id"
                    value={filters.id}
                    onChange={handleChange}
                    placeholder="ID"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Min Price */}
              <div className="form-group mb-3">
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  Min Price
                </label>
                <div style={inputCardStyle}>
                  <FaRupeeSign style={iconStyle} />
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleChange}
                    placeholder="Min Price"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Max Price */}
              <div className="form-group mb-3">
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  Max Price
                </label>
                <div style={inputCardStyle}>
                  <FaRupeeSign style={iconStyle} />
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleChange}
                    placeholder="Max Price"
                    style={inputStyle}
                  />
                </div>
              </div>

              {renderSelect("propertyMode", "Property Mode", LuBuilding)}
              {renderSelect("propertyType", "Property Type", FaRegBuilding)}
              {renderSelect("bedrooms", "Bedrooms", LuBedDouble)}
              {renderSelect("floorNo", "Floor No", GrSteps)}

              {/* State */}
              <div className="form-group mb-3">
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  State
                </label>
                <div style={inputCardStyle}>
                  <HiOutlineBuildingLibrary style={iconStyle} />
                  <input
                    type="text"
                    name="state"
                    value={filters.state}
                    onChange={handleChange}
                    placeholder="State"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* City */}
              <div className="form-group mb-3">
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  City
                </label>
                <div style={inputCardStyle}>
                  <FaCity style={iconStyle} />
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleChange}
                    placeholder="City"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Area */}
              <div className="form-group mb-1">
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  Area
                </label>
                <div style={inputCardStyle}>
                  <PiMapPinAreaLight style={iconStyle} />
                  <input
                    type="text"
                    name="area"
                    value={filters.area}
                    onChange={handleChange}
                    placeholder="Area"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ gap: 10 }}>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "#9ca3af",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                CLEAR
              </button>
              <button
                type="submit"
                style={{
                  background: "#6EB7B2",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 5,
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                SEARCH BUYER LIST
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuyerSearchPopup;
