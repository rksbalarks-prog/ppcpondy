import { useEffect } from "react";
import axios from "axios";

/**
 * DownloadTracker — mounted once inside the dashboard layout.
 *
 * Every Excel / PDF / CSV download in the admin panel ends the same way:
 * the export library (xlsx, jsPDF, file-saver) builds a Blob, creates an
 * <a download="..."> element and triggers it. We catch that two ways so no
 * download slips through:
 *
 *   1. Patch HTMLAnchorElement.prototype.click — xlsx (XLSX.writeFile) and
 *      jsPDF call `a.click()` directly; this catches it at the source even
 *      if the anchor is never attached to the DOM.
 *   2. A document-level capture click listener — catches real user clicks on
 *      <a download> links and any library that uses dispatchEvent instead.
 *
 * A short de-dupe window stops one download being logged by both paths.
 * Each catch is POSTed to /record-download and shown on the Download History
 * page under Report.
 */

// Turn a route path into a readable page label.
//   /process/dashboard/ppc-staff-report  ->  "Ppc Staff Report"
//   /dashboard/edit-bill/123             ->  "Edit Bill"
const derivePageName = (path) => {
  const parts = (path || "").split("/").filter(Boolean);
  if (!parts.length) return "Dashboard";
  let last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && parts.length > 1) last = parts[parts.length - 2];
  return last
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
};

const DownloadTracker = () => {
  useEffect(() => {
    // De-dupe: the prototype patch and the click listener can both fire for
    // the same download. Ignore a repeat of the same file within this window.
    let lastKey = "";
    let lastTime = 0;

    const recordDownload = (rawName) => {
      const fileName = String(rawName || "").trim();
      if (!fileName) return;

      const now = Date.now();
      if (fileName === lastKey && now - lastTime < 2000) return;
      lastKey = fileName;
      lastTime = now;

      const ext = (fileName.split(".").pop() || "").toLowerCase();
      const fileType = ext && ext.length <= 5 ? ext : "";
      const pagePath = window.location.pathname;

      axios
        .post(`${process.env.REACT_APP_API_URL}/record-download`, {
          adminName: localStorage.getItem("adminName") || "Unknown",
          role: localStorage.getItem("adminRole") || "",
          fileName,
          fileType,
          pageName: derivePageName(pagePath),
          pagePath,
          downloadedAt: new Date().toISOString(),
        })
        .catch((err) => {
          // Tracking must never disrupt the actual download — just log it.
          console.warn("DownloadTracker: failed to record download", err?.message || err);
        });
    };

    // ── 1. Patch anchor.click() ──────────────────────────────────────
    const proto = HTMLAnchorElement.prototype;
    const originalClick = proto.click;
    let patched = false;
    if (!originalClick.__ppcDownloadTracked) {
      const wrapped = function () {
        try {
          const name = (this.getAttribute("download") || this.download || "").trim();
          if (name) recordDownload(name);
        } catch (_) {}
        return originalClick.apply(this, arguments);
      };
      wrapped.__ppcDownloadTracked = true;
      proto.click = wrapped;
      patched = true;
    }

    // ── 2. Document-level capture click listener ─────────────────────
    const handleClick = (e) => {
      const target = e.target;
      const anchor = target && target.closest ? target.closest("a[download]") : null;
      if (!anchor) return;
      const name = (anchor.getAttribute("download") || "").trim();
      if (name) recordDownload(name);
    };
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      if (patched) proto.click = originalClick;
    };
  }, []);

  return null; // renders nothing
};

export default DownloadTracker;
