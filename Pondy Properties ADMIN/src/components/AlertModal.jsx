import React from "react";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

/**
 * Styled in-app alert/validation modal — replaces window.alert() calls.
 *
 * Props:
 *   open      -- whether modal is visible
 *   title     -- heading text (default: "Please fill the following")
 *   messages  -- string or string[] of messages to display
 *   onClose   -- close handler (called when OK or backdrop is clicked)
 *   variant   -- "warning" (default, amber) | "error" (red) | "info" (teal)
 */
const VARIANT_COLORS = {
  warning: { accent: "#E0A800", btn: "#E0A800", btnHover: "#C49100" },
  error:   { accent: "#D9534F", btn: "#D9534F", btnHover: "#B53A36" },
  info:    { accent: "#2F747F", btn: "#2F747F", btnHover: "#235A63" },
  success: { accent: "#28A745", btn: "#28A745", btnHover: "#218838" },
};

const AlertModal = ({
  open,
  title = "Please fill the following",
  messages = [],
  onClose,
  variant = "warning",
}) => {
  if (!open) return null;

  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.warning;
  const list = Array.isArray(messages)
    ? messages.filter(Boolean)
    : (messages ? [messages] : []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1700,
        animation: "fadeIn 0.2s ease-in-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "10px",
          width: "min(420px, 92vw)",
          padding: "20px 22px",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.22)",
          borderTop: `4px solid ${colors.accent}`,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          {variant === "success" ? (
            <FaCheckCircle size={20} color={colors.accent} />
          ) : (
            <FaExclamationTriangle size={20} color={colors.accent} />
          )}
          <h5 style={{ margin: 0, color: "#222", fontWeight: 600 }}>{title}</h5>
        </div>

        {list.length === 1 ? (
          <p style={{ margin: "8px 0 18px", color: "#444", lineHeight: 1.5 }}>
            {list[0]}
          </p>
        ) : (
          <ul style={{ margin: "8px 0 18px", paddingLeft: "20px", color: "#444", lineHeight: 1.6 }}>
            {list.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 22px",
              background: colors.btn,
              border: "none",
              color: "#fff",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: 500,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.btnHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.btn)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
