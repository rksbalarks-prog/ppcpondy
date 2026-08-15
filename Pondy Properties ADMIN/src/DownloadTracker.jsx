import { useEffect } from "react";
import axios from "axios";

/**
 * DownloadTracker — mounted once inside the dashboard layout.
 *
 * Every Excel / PDF / CSV download in the admin panel ends with an
 * <a download="..."> element being triggered. Different libraries trigger it
 * differently, so we hook all three possible paths:
 *
 *   1. anchor.click()        — used by xlsx (XLSX.writeFile) and jsPDF.
 *   2. anchor.dispatchEvent  — used by file-saver's saveAs(), which fires a
 *                              synthetic click on an anchor that is NEVER
 *                              added to the DOM (so a document listener and
 *                              a plain click() patch both miss it).
 *   3. a document capture click listener — real user clicks on <a download>.
 *
 * A short de-dupe window stops one download being logged more than once.
 * Each catch is POSTed to /record-download and shown on Report → Download
 * History. Console logs (prefixed [DownloadTracker]) make it easy to verify.
 */

// Turn a route path into a readable page label.
//   /process/dashboard/approved-car  ->  "Approved Car"
//   /dashboard/edit-bill/123         ->  "Edit Bill"
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
    console.info("[DownloadTracker] active — watching for file downloads");

    // De-dupe: more than one hook can fire for the same download. Ignore a
    // repeat of the same file within this window.
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

      console.info("[DownloadTracker] download detected:", fileName);

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
        .then(() => {
          console.info("[DownloadTracker] recorded OK:", fileName);
        })
        .catch((err) => {
          // Tracking must never disrupt the actual download — just log it.
          console.warn(
            "[DownloadTracker] failed to record:",
            err?.response?.status,
            err?.response?.data || err?.message || err
          );
        });
    };

    // Pull a download filename off an anchor, if it has one.
    const downloadNameOf = (el) => {
      try {
        if (!el || el.tagName !== "A") return "";
        return (el.getAttribute("download") || el.download || "").trim();
      } catch (_) {
        return "";
      }
    };

    const proto = HTMLAnchorElement.prototype;

    // ── 1. Patch anchor.click() — xlsx / jsPDF ───────────────────────
    const originalClick = proto.click;
    let clickPatched = false;
    if (!originalClick.__ppcTracked) {
      const wrappedClick = function () {
        try {
          const name = downloadNameOf(this);
          if (name) recordDownload(name);
        } catch (_) {}
        return originalClick.apply(this, arguments);
      };
      wrappedClick.__ppcTracked = true;
      proto.click = wrappedClick;
      clickPatched = true;
    }

    // ── 2. Patch anchor.dispatchEvent() — file-saver saveAs() ────────
    const originalDispatch = proto.dispatchEvent;
    let dispatchPatched = false;
    if (!originalDispatch.__ppcTracked) {
      const wrappedDispatch = function (evt) {
        try {
          if (evt && evt.type === "click") {
            const name = downloadNameOf(this);
            if (name) recordDownload(name);
          }
        } catch (_) {}
        return originalDispatch.apply(this, arguments);
      };
      wrappedDispatch.__ppcTracked = true;
      proto.dispatchEvent = wrappedDispatch;
      dispatchPatched = true;
    }

    // ── 3. Document-level capture click listener — real link clicks ──
    const handleClick = (e) => {
      const target = e.target;
      const anchor = target && target.closest ? target.closest("a[download]") : null;
      if (!anchor) return;
      const name = downloadNameOf(anchor);
      if (name) recordDownload(name);
    };
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      if (clickPatched) proto.click = originalClick;
      if (dispatchPatched) proto.dispatchEvent = originalDispatch;
    };
  }, []);

  return null; // renders nothing
};

export default DownloadTracker;
