import React, { useState } from "react";
import PPCStaffReport from "./PPCStaffReport";

// Landing page for the standalone /staff-report route.
// Shows two big buttons: one swaps in the PPC staff report (same component
// used by the admin dashboard, with cards + action column hidden), the
// other redirects to the Rent Pondy admin portal at a fixed URL.
//
// The PPC view stays at the same /staff-report URL via local state — no
// routing changes needed. A "← Back to selection" link returns to the
// chooser without a page reload.
const RENT_STAFF_REPORT_URL = "https://rentpondy.com/process/rent-staff-report";

const PublicStaffReport = () => {
  const [view, setView] = useState("chooser"); // "chooser" | "ppc"

  if (view === "ppc") {
    return (
      <div>
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => setView("chooser")}
            style={{
              background: "transparent",
              border: "none",
              color: "#2F747F",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to selection
          </button>
        </div>
        <PPCStaffReport hideSectionCards hideActionColumn hideTopExport />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 40px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "40px 32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          width: "min(560px, 92vw)",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#2F747F", fontWeight: 700, marginBottom: "6px" }}>
          Staff Reports
        </h2>
        <p style={{ color: "#6c757d", fontSize: "14px", marginBottom: "28px" }}>
          Choose which portal's report you want to view.
        </p>

        <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
          <button
            type="button"
            onClick={() => setView("ppc")}
            style={{
              flex: 1,
              background: "#2F747F",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "18px 24px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#235963")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#2F747F")}
          >
            🏢 PPC Staff Report
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = RENT_STAFF_REPORT_URL;
            }}
            style={{
              flex: 1,
              background: "#E8743B",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "18px 24px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#c45e2c")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#E8743B")}
          >
            🏠 Rent Staff Report
          </button>
        </div>

        <p
          style={{
            color: "#9aa0a6",
            fontSize: "12px",
            marginTop: "20px",
            marginBottom: 0,
          }}
        >
          Rent Staff Report opens at{" "}
          <span style={{ wordBreak: "break-all" }}>{RENT_STAFF_REPORT_URL}</span>
        </p>
      </div>
    </div>
  );
};

export default PublicStaffReport;
