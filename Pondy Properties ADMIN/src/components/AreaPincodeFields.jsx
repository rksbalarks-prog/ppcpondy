import React, { useEffect, useRef, useState } from "react";
import { FaCity, FaMapPin } from "react-icons/fa";
import { PUDUCHERRY_AREAS, lookupPincodeByArea, lookupAreasByPincode } from "../data/puducherryAreas";

/**
 * Two linked combobox fields: Area + Pincode.
 *
 * - Both inputs are typeable (free entry allowed for areas not in our list).
 * - Suggestions are sourced from a local Puducherry (Pondicherry) public-record list.
 * - Picking an Area suggestion auto-fills the Pincode.
 * - Picking a Pincode suggestion auto-fills the Area (or first matching area).
 * - Typing a 6-digit pincode that exactly matches one in the list also auto-fills the Area.
 *
 * Props:
 *   area, pincode             -- current values (controlled)
 *   onAreaChange(value)        -- area input changed
 *   onPincodeChange(value)     -- pincode input changed
 *   onPick({ area, pincode })  -- both filled together (suggestion picked or pincode auto-resolved)
 *   areaPlaceholder            -- override area input placeholder
 *   pincodePlaceholder         -- override pincode input placeholder
 *   extraAreaSuggestions       -- optional string[] of additional area names (e.g. backend results)
 *   areaIcon                   -- optional left icon element for the Area input
 *   pincodeIcon                -- optional left icon element for the Pincode input
 */
const AreaPincodeFields = ({
  area = "",
  pincode = "",
  onAreaChange,
  onPincodeChange,
  onPick,
  areaPlaceholder = "Enter Area (Pondicherry)",
  pincodePlaceholder = "Enter Pincode",
  extraAreaSuggestions = [],
  areaIcon = <FaCity style={{ color: "#2F747F" }} />,
  pincodeIcon = <FaMapPin style={{ color: "#2F747F" }} />,
}) => {
  const [areaOpen, setAreaOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const areaWrapRef = useRef(null);
  const pinWrapRef = useRef(null);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (areaWrapRef.current && !areaWrapRef.current.contains(e.target)) {
        setAreaOpen(false);
      }
      if (pinWrapRef.current && !pinWrapRef.current.contains(e.target)) {
        setPinOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const a = String(area ?? "");
  const p = String(pincode ?? "");

  // Filter Puducherry list by typed area text (matches name OR pincode, both directions help discovery).
  const areaQuery = a.toLowerCase();
  const filteredAreaSuggestions = a
    ? PUDUCHERRY_AREAS.filter(
        (r) =>
          r.area.toLowerCase().includes(areaQuery) ||
          r.pincode.includes(a)
      )
    : PUDUCHERRY_AREAS;

  // Merge in extra area suggestions (e.g. backend `/areas?search=` results) without pincode.
  const extras = (extraAreaSuggestions || [])
    .filter(
      (name) =>
        name &&
        !PUDUCHERRY_AREAS.some((r) => r.area.toLowerCase() === String(name).toLowerCase()) &&
        (!a || String(name).toLowerCase().includes(areaQuery))
    )
    .map((name) => ({ area: name, pincode: "" }));
  const areaSuggestions = [...filteredAreaSuggestions, ...extras].slice(0, 30);

  // Filter pincodes — show entries whose pincode starts with what's typed; fallback to all.
  const filteredPinSuggestions = p
    ? PUDUCHERRY_AREAS.filter((r) => r.pincode.startsWith(p))
    : PUDUCHERRY_AREAS;
  // Dedupe by pincode for the panel (one row per pincode with comma-joined areas).
  const pinByCode = filteredPinSuggestions.reduce((acc, r) => {
    if (!acc[r.pincode]) acc[r.pincode] = [];
    acc[r.pincode].push(r.area);
    return acc;
  }, {});
  const pinSuggestions = Object.keys(pinByCode).slice(0, 20).map((code) => ({
    pincode: code,
    areas: pinByCode[code],
  }));

  const handleAreaInput = (val) => {
    onAreaChange && onAreaChange(val);
    setAreaOpen(true);
    // If they typed an exact-known area name, helpfully auto-fill pincode.
    const auto = lookupPincodeByArea(val);
    if (auto && auto !== p) {
      onPincodeChange && onPincodeChange(auto);
    }
  };

  const handlePinInput = (val) => {
    const digits = val.replace(/[^0-9]/g, "").slice(0, 6);
    onPincodeChange && onPincodeChange(digits);
    setPinOpen(true);
    // Auto-fill area when pincode is fully entered AND maps to exactly one area name (or none-set).
    if (digits.length === 6) {
      const areas = lookupAreasByPincode(digits);
      if (areas.length === 1 && (!a || a !== areas[0])) {
        onAreaChange && onAreaChange(areas[0]);
      }
    }
  };

  const pickArea = (record) => {
    onAreaChange && onAreaChange(record.area);
    if (record.pincode) onPincodeChange && onPincodeChange(record.pincode);
    setAreaOpen(false);
    if (onPick) onPick({ area: record.area, pincode: record.pincode || p });
  };

  const pickPincode = (record) => {
    onPincodeChange && onPincodeChange(record.pincode);
    // Use the first area for that pincode if Area is empty; otherwise leave area as-is.
    const fillArea = !a ? record.areas[0] : a;
    if (!a) onAreaChange && onAreaChange(fillArea);
    setPinOpen(false);
    if (onPick) onPick({ area: fillArea, pincode: record.pincode });
  };

  const inputBaseStyle = {
    width: "100%",
    padding: "10px 10px 10px 38px",
    border: "1px solid #2F747F",
    borderRadius: "5px",
    color: "#2F747F",
    background: "#fff",
    outline: "none",
  };
  const iconStyle = {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  };
  const panelStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1500,
    margin: "4px 0 0",
    padding: 0,
    listStyle: "none",
    background: "#fff",
    border: "1px solid #2F747F",
    borderRadius: "5px",
    maxHeight: "260px",
    overflowY: "auto",
    boxShadow: "0 4px 8px rgba(0, 123, 255, 0.15)",
  };

  return (
    <div className="row">
      {/* Area field */}
      <div className="col-12 col-md-8 mb-3">
        <label style={{ fontWeight: 600 }}>Area</label>
        <div ref={areaWrapRef} style={{ position: "relative" }}>
          <span style={iconStyle}>{areaIcon}</span>
          <input
            type="text"
            name="area"
            value={a}
            placeholder={areaPlaceholder}
            onFocus={() => setAreaOpen(true)}
            onChange={(e) => handleAreaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAreaOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                setAreaOpen(false);
              }
            }}
            style={inputBaseStyle}
          />
          {areaOpen && areaSuggestions.length > 0 && (
            <ul style={panelStyle}>
              {areaSuggestions.map((rec, i) => (
                <li
                  key={`${rec.area}-${rec.pincode}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickArea(rec);
                  }}
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #D0D7DE",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#2F747F" }}>{rec.area}</span>
                  {rec.pincode && (
                    <span style={{ fontSize: "11px", color: "#888", marginLeft: "12px" }}>
                      {rec.pincode}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pincode field */}
      <div className="col-12 col-md-4 mb-3">
        <label style={{ fontWeight: 600 }}>Pincode</label>
        <div ref={pinWrapRef} style={{ position: "relative" }}>
          <span style={iconStyle}>{pincodeIcon}</span>
          <input
            type="text"
            name="pincode"
            inputMode="numeric"
            maxLength={6}
            value={p}
            placeholder={pincodePlaceholder}
            onFocus={() => setPinOpen(true)}
            onChange={(e) => handlePinInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPinOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                setPinOpen(false);
              }
            }}
            style={inputBaseStyle}
          />
          {pinOpen && pinSuggestions.length > 0 && (
            <ul style={panelStyle}>
              {pinSuggestions.map((rec) => (
                <li
                  key={rec.pincode}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickPincode(rec);
                  }}
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #D0D7DE",
                  }}
                >
                  <div style={{ color: "#2F747F", fontWeight: 500 }}>{rec.pincode}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                    {rec.areas.join(", ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaPincodeFields;
