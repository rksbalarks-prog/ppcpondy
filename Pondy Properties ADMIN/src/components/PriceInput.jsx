import React, { useEffect, useRef, useState } from "react";
import { numToIndianWords } from "../utils/priceUtils";

/**
 * Typeable combobox for Buyer Assistance min/max price.
 * - User can type any digit value (free entry).
 * - Existing dropdown suggestions still show on focus, filtered live by typed text.
 * - Clicking a suggestion fills the value and fires `onSelectOption` (used by the
 *   parent for the original auto-advance-to-next-field behavior).
 */
const PriceInput = ({
  name,
  value,
  onChange,         // (newValue: string) => void
  onSelectOption,   // optional: (option: string) => void; fires only on suggestion click
  options = [],
  placeholder = "Select or type",
  iconLeft = null,
  inputStyle = {},
  containerStyle = {},
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const v = String(value ?? "");
  const filtered = (options || []).filter(
    (opt) => !v || String(opt).toLowerCase().includes(v.toLowerCase())
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", ...containerStyle }}>
      <div style={{ position: "relative" }}>
        {iconLeft && (
          <span
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            {iconLeft}
          </span>
        )}
        <input
          name={name}
          type="text"
          inputMode="numeric"
          value={v}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            // Digits only — keeps the value parseable for numToIndianWords.
            const next = e.target.value.replace(/[^0-9]/g, "");
            onChange(next);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") {
              e.preventDefault();
              setOpen(false);
            }
          }}
          style={{
            width: "100%",
            padding: iconLeft ? "10px 10px 10px 38px" : "10px",
            border: "1px solid #2F747F",
            borderRadius: "5px",
            color: "#2F747F",
            background: "#fff",
            outline: "none",
            ...inputStyle,
          }}
        />
      </div>

      {/* Wording for the currently typed value (visible whether or not it matches a suggestion) */}
      {v && (
        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", paddingLeft: "4px" }}>
          {numToIndianWords(v)}
        </div>
      )}

      {open && filtered.length > 0 && (
        <ul
          style={{
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
          }}
        >
          {filtered.map((opt, i) => (
            <li
              key={i}
              // mouseDown so the click registers before the input's blur/outside-click closes the panel.
              onMouseDown={(e) => {
                e.preventDefault();
                const picked = String(opt);
                onChange(picked);
                setOpen(false);
                if (onSelectOption) onSelectOption(picked);
              }}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                borderBottom: "1px solid #D0D7DE",
              }}
            >
              <div style={{ color: "#2F747F" }}>{opt}</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                {numToIndianWords(opt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PriceInput;
