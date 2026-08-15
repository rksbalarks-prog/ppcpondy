import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Table } from "react-bootstrap";
import * as XLSX from "xlsx";

/**
 * PPC Staff Report — single dashboard summarising counts across the admin app.
 * Reuses the same endpoints the individual list pages already call so it doesn't
 * need a new backend route. Data is filtered client-side by the chosen date range.
 *
 * Sections:
 *   1) Login User Report       — Login (OTP) Report
 *   2) Buyer Assistant         — Approved, Pending
 *   3) PPC Property            — Approved, PreApproved, Pending
 *   4) Customer Care           — Contact, Need Help, Report Property, Sold Out, Called Experience
 *   5) Points PayU Records     — Pay Now, Pay Later, Failed
 *   6) FollowUp                — Property Followups, Buyer Followups
 */

// ── Helpers ────────────────────────────────────────────────────────────────
const inRange = (dateLike, startMs, endMs) => {
  if (!dateLike) return false;
  const t = new Date(dateLike).getTime();
  if (Number.isNaN(t)) return false;
  if (startMs !== null && t < startMs) return false;
  if (endMs !== null && t > endMs) return false;
  return true;
};

const countByDate = (arr, dateField, startMs, endMs) => {
  if (startMs === null && endMs === null) return (arr || []).length;
  return (arr || []).filter((it) => inRange(it?.[dateField], startMs, endMs)).length;
};

// Login Report dedupes by phone — same phone with multiple login attempts is
// counted once. Mirror that here so the OTP card matches the "Showing: N" badge
// on the Login Report page.
const countUniqueByDate = (arr, dateField, idField, startMs, endMs) => {
  const seen = new Set();
  (arr || []).forEach((it) => {
    if (startMs !== null || endMs !== null) {
      if (!inRange(it?.[dateField], startMs, endMs)) return;
    }
    const id = it?.[idField];
    if (id) seen.add(id);
  });
  return seen.size;
};

// Count "Called Experience" docs whose nested array has at least one call in
// the chosen range. When no range is set, this is just the total record count.
const countCalledExperience = (arr, startMs, endMs) => {
  if (startMs === null && endMs === null) return (arr || []).length;
  return (arr || []).filter((doc) => {
    const calls = Array.isArray(doc?.calledExprience) ? doc.calledExprience : [];
    return calls.some((c) => inRange(c?.date, startMs, endMs));
  }).length;
};

const formatDisplayDate = (yyyymmdd) =>
  yyyymmdd ? moment(yyyymmdd).format("DD-MM-YYYY") : "All time";

// ── Record-filter helpers (return arrays for inline-expand sub-tables) ─────
const filterByDate = (arr, dateField, startMs, endMs) => {
  if (startMs === null && endMs === null) return arr || [];
  return (arr || []).filter((it) => inRange(it?.[dateField], startMs, endMs));
};

// Dedupe an array by a field, keeping the first occurrence. The list pages
// (e.g. Login Report) sort newest-first server-side, so the first occurrence
// per phone is the most-recent login record — matching what the user sees.
const dedupeBy = (arr, idField) => {
  const seen = new Set();
  return (arr || []).filter((it) => {
    const id = it?.[idField];
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const getCalledExperienceRecords = (arr, startMs, endMs) => {
  if (startMs === null && endMs === null) return arr || [];
  return (arr || []).filter((doc) => {
    const calls = Array.isArray(doc?.calledExprience) ? doc.calledExprience : [];
    return calls.some((c) => inRange(c?.date, startMs, endMs));
  });
};

// Sub-tables are capped to keep the page snappy when a section has thousands
// of records — full data is still available on the underlying page.
const ROW_CAP = 100;

const formatDate = (v) => (v ? moment(v).format("DD-MM-YYYY HH:mm") : "—");
const formatDay = (v) => (v ? moment(v).format("DD-MM-YYYY") : "—");

// Non-zero counts are highlighted dark-blue for readability; zeros stay default.
// Accepts a number or a formatted string like "₹1,200". The colour itself is
// applied via the `.ppc-num-blue` CSS class (not an inline style) because
// App.css declares `td { color: #555 !important }`, and a React inline style
// cannot carry !important — so a scoped class is the only thing that wins.
const isNonZeroNumber = (val) => {
  const n =
    typeof val === "number" ? val : Number(String(val).replace(/[^0-9.-]/g, ""));
  return !Number.isNaN(n) && n !== 0;
};

// ── Follow-up metric model (Property / Buyer split) ────────────────────────
// Every follow-up metric is tracked split by category: `<base>_prop` counts
// Property follow-ups (PPC ID) and `<base>_buyer` counts Buyer follow-ups
// (BA ID). The Staff Daily + Hourly tables render each as a "Property / Buyer"
// cell so a single row carries both categories.
const FOLLOWUP_BASES = [
  "allFollowups",   // every follow-up record credited to the staff
  "followWithId",
  "followWithoutId",
  "followUpdated",
  "todaysFollow",
  "upcoming",        // future-due follow-ups
  "past",
  "activePayment",
  "todayPayment",
];

// Zeroed split keys (…_prop / …_buyer) for seeding a fresh bucket.
const makeSplitZero = () => {
  const z = {};
  FOLLOWUP_BASES.forEach((b) => {
    z[`${b}_prop`] = 0;
    z[`${b}_buyer`] = 0;
  });
  return z;
};

// Read a split metric's Property/Buyer pair off a bucket (missing → 0).
const splitPair = (bucket, base) => ({
  prop: (bucket && bucket[`${base}_prop`]) || 0,
  buyer: (bucket && bucket[`${base}_buyer`]) || 0,
});

const fmtAmount = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// Render one metric cell from a bucket. Split rows show "Property / Buyer";
// plain rows show a single (optionally amount-formatted) value.
const renderSplitCell = (bucket, m) => {
  if (m.split) {
    const { prop, buyer } = splitPair(bucket, m.base);
    return `${prop} / ${buyer}`;
  }
  if (m.format === "amount") return fmtAmount((bucket || {})[m.key]);
  return (bucket || {})[m.key] ?? 0;
};

// True when a metric cell carries any non-zero number (drives blue highlight).
const cellHasValue = (bucket, m) => {
  if (m.split) {
    const { prop, buyer } = splitPair(bucket, m.base);
    return prop !== 0 || buyer !== 0;
  }
  return isNonZeroNumber((bucket || {})[m.key] || 0);
};

// Rows shared by the Staff Daily Summary + Hourly Activity tables (and their
// Excel exports). `split: true` rows render "Property / Buyer"; plain rows
// render a single value.
const FOLLOWUP_DISPLAY_ROWS = [
  { label: "All Follow-ups",            base: "allFollowups",    split: true },
  { label: "Follow with ID",            base: "followWithId",    split: true },
  { label: "Follow without ID",         base: "followWithoutId", split: true },
  { label: "Follow Updated",            base: "followUpdated",   split: true },
  { label: "Today's Follow-up",         base: "todaysFollow",    split: true },
  { label: "Upcoming Follow-up",        base: "upcoming",        split: true },
  { label: "Past Follow-up",            base: "past",            split: true },
  { label: "Active Payment Follow-up",  base: "activePayment",   split: true },
  { label: "Today's Payment Follow-up", base: "todayPayment",    split: true },
  { label: "Total Bill Count",          key: "billCount" },
  { label: "Total Amount",              key: "billAmount", format: "amount" },
];

// Sum every numeric metric across a set of buckets — used for the rightmost
// "Total" (all-staff) and "Total (EOD)" (whole-day) columns.
const sumBuckets = (buckets) => {
  const acc = {};
  (buckets || []).forEach((b) => {
    Object.keys(b || {}).forEach((k) => {
      if (typeof b[k] === "number") acc[k] = (acc[k] || 0) + b[k];
    });
  });
  return acc;
};

// Default: no range — show all-time totals so counts match each underlying page.
const defaultStart = "";
const defaultEnd = "";

// Optional `hideSectionCards` — when true, skips the six summary-card grids
// (sections 1-6) and renders only the date picker + Summary Table + Staff
// Daily Follow-up Summary. Default false keeps the existing admin page
// unchanged. The public /staff-report route opts in.
const PPCStaffReport = ({
  hideSectionCards = false,
  hideActionColumn = false,
  hideTopExport = false,
} = {}) => {
  const API = process.env.REACT_APP_API_URL;

  // Track which Summary Table rows are currently expanded.
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hourly Activity state — drives the per-staff/per-date breakdown table
  // beneath the Staff Daily Follow-up Summary.
  const [hourlyStaff, setHourlyStaff] = useState("");
  const [hourlyDate, setHourlyDate] = useState(moment().format("YYYY-MM-DD"));

  // Raw datasets — fetched once. Counts derive from these via memo.
  const [raw, setRaw] = useState({
    loginUsers: [],         // /user/alls -> data.data, date: loginDate
    baPending: [],          // /fetch-buyerAssistance-pending -> data.data, date: createdAt
    baActive: [],           // /baActive-buyerAssistance-all-plans -> data.data, date: createdAt
    propActive: [],         // /fetch-active-users-datas-all -> data.users, date: createdAt
    propPreApproved: [],    // /properties/pre-approved-all -> data.users, date: createdAt
    propPending: [],        // /properties/pending -> data.users, date: createdAt
    ccContact: [],          // /get-all-contact-requests -> data.contactRequestsData, date: createdAt
    ccNeedHelp: [],         // /get-help-requests -> data.data, date: requestedAt
    ccReport: [],           // /get-reported-properties -> data.data, date: createdAt
    ccSoldOut: [],          // /get-all-soldout-requests -> data.soldOutRequestsData, date: createdAt
    ccCalled: [],           // /get-all-called-experiences -> data.data, nested calledExprience[].date
    payu: [],               // /payu/points-payments/all -> data.payments, date: createdAt, status: payustatususer
    fuProperty: [],         // /followup-list -> data.data, date: createdAt
    fuBuyer: [],            // /followup-list-buyer -> data.data, date: createdAt
    bills: [],              // /bills -> data.data, date: billDate (YYYY-MM-DD), amount: billAmount
    buyerBills: [],         // /buyer-bills -> data.data, same shape as property bills
    staffUsers: [],         // /admin-all -> array of admins (Users page source); name field: `name`
  });

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const safe = (p) => p.then((r) => r).catch(() => ({ data: {} }));
      const results = await Promise.all([
        safe(axios.get(`${API}/user/alls`)),
        safe(axios.get(`${API}/fetch-buyerAssistance-pending`)),
        safe(axios.get(`${API}/baActive-buyerAssistance-all-plans`)),
        safe(axios.get(`${API}/fetch-active-users-datas-all`)),
        safe(axios.get(`${API}/properties/pre-approved-all`)),
        safe(axios.get(`${API}/properties/pending`)),
        safe(axios.get(`${API}/get-all-contact-requests`)),
        safe(axios.get(`${API}/get-help-requests`)),
        safe(axios.get(`${API}/get-reported-properties`)),
        safe(axios.get(`${API}/get-all-soldout-requests`)),
        safe(axios.get(`${API}/get-all-called-experiences`)),
        safe(axios.get(`${API}/payu/points-payments/all`)),
        safe(axios.get(`${API}/followup-list`)),
        safe(axios.get(`${API}/followup-list-buyer`)),
        safe(axios.get(`${API}/bills`)),
        safe(axios.get(`${API}/admin-all`)),
        safe(axios.get(`${API}/buyer-bills`)),
      ]);

      const [
        loginRes, baPendingRes, baActiveRes, propActiveRes, propPreRes, propPendRes,
        ccContactRes, ccHelpRes, ccReportRes, ccSoldRes, ccCalledRes,
        payuRes, fuPropRes, fuBuyerRes, billsRes, staffRes, buyerBillsRes,
      ] = results;

      setRaw({
        loginUsers:      loginRes.data?.data || [],
        baPending:       baPendingRes.data?.data || [],
        baActive:        baActiveRes.data?.data || [],
        propActive:      propActiveRes.data?.users || [],
        propPreApproved: propPreRes.data?.users || [],
        propPending:     propPendRes.data?.users || [],
        ccContact:       ccContactRes.data?.contactRequestsData || [],
        ccNeedHelp:      ccHelpRes.data?.data || [],
        ccReport:        ccReportRes.data?.data || [],
        ccSoldOut:       ccSoldRes.data?.soldOutRequestsData || [],
        ccCalled:        ccCalledRes.data?.data || [],
        payu:            payuRes.data?.payments || [],
        fuProperty:      fuPropRes.data?.data || [],
        fuBuyer:         fuBuyerRes.data?.data || [],
        bills:           billsRes.data?.data || [],
        buyerBills:      buyerBillsRes.data?.data || [],
        // /admin-all returns the array at the top level (matches UserList.jsx)
        staffUsers:      Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data?.data || []),
      });
    } catch (e) {
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Intentionally only on mount — date filter is applied client-side via memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert YYYY-MM-DD bounds to ms timestamps with full-day semantics so picking
  // the same date for both ends still includes records from that day.
  const { startMs, endMs } = useMemo(() => {
    const s = startDate ? new Date(startDate) : null;
    if (s) s.setHours(0, 0, 0, 0);
    const e = endDate ? new Date(endDate) : null;
    if (e) e.setHours(23, 59, 59, 999);
    return {
      startMs: s ? s.getTime() : null,
      endMs:   e ? e.getTime() : null,
    };
  }, [startDate, endDate]);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const payNow    = raw.payu.filter((p) => String(p.payustatususer || "").toLowerCase() === "pay now");
    const payLater  = raw.payu.filter((p) => String(p.payustatususer || "").toLowerCase() === "pay later");
    const payFailed = raw.payu.filter((p) => String(p.payustatususer || "").toLowerCase() === "pay failed");

    return {
      // Dedupe by phone so the count matches Login Report's "Showing: N" badge.
      loginOtp:           countUniqueByDate(raw.loginUsers, "loginDate", "phone", startMs, endMs),
      baApproved:         countByDate(raw.baActive,        "createdAt",  startMs, endMs),
      baPending:          countByDate(raw.baPending,       "createdAt",  startMs, endMs),
      propApproved:       countByDate(raw.propActive,      "createdAt",  startMs, endMs),
      propPreApproved:    countByDate(raw.propPreApproved, "createdAt",  startMs, endMs),
      propPending:        countByDate(raw.propPending,     "createdAt",  startMs, endMs),
      ccContact:          countByDate(raw.ccContact,       "createdAt",  startMs, endMs),
      ccNeedHelp:         countByDate(raw.ccNeedHelp,      "requestedAt",startMs, endMs),
      ccReport:           countByDate(raw.ccReport,        "createdAt",  startMs, endMs),
      ccSoldOut:          countByDate(raw.ccSoldOut,       "createdAt",  startMs, endMs),
      ccCalled:           countCalledExperience(raw.ccCalled,            startMs, endMs),
      payNow:             countByDate(payNow,              "createdAt",  startMs, endMs),
      payLater:           countByDate(payLater,            "createdAt",  startMs, endMs),
      payFailed:          countByDate(payFailed,           "createdAt",  startMs, endMs),
      fuProperty:         countByDate(raw.fuProperty,      "createdAt",  startMs, endMs),
      fuBuyer:            countByDate(raw.fuBuyer,         "createdAt",  startMs, endMs),
    };
  }, [raw, startMs, endMs]);

  // ── Summary rows used by the bottom table + Excel export + inline expand ──
  // Each row carries: its filtered records + the columns to render when
  // expanded. `count` is derived from rows.length so it always matches.
  const summaryRows = useMemo(() => {
    // ── Login OTP — filter by loginDate, dedupe by phone (matches Login Report)
    const loginRows = dedupeBy(
      filterByDate(raw.loginUsers, "loginDate", startMs, endMs),
      "phone"
    );

    // ── Buyer Assistance
    const baActiveRows = filterByDate(raw.baActive, "createdAt", startMs, endMs);
    const baPendingRows = filterByDate(raw.baPending, "createdAt", startMs, endMs);

    // ── Properties
    const propActiveRows = filterByDate(raw.propActive, "createdAt", startMs, endMs);
    const propPreRows = filterByDate(raw.propPreApproved, "createdAt", startMs, endMs);
    const propPendingRows = filterByDate(raw.propPending, "createdAt", startMs, endMs);

    // ── Customer Care
    const ccContactRows  = filterByDate(raw.ccContact,  "createdAt",   startMs, endMs);
    const ccNeedHelpRows = filterByDate(raw.ccNeedHelp, "requestedAt", startMs, endMs);
    const ccReportRows   = filterByDate(raw.ccReport,   "createdAt",   startMs, endMs);
    const ccSoldOutRows  = filterByDate(raw.ccSoldOut,  "createdAt",   startMs, endMs);
    const ccCalledRows   = getCalledExperienceRecords(raw.ccCalled, startMs, endMs);

    // ── PayU — split by status, then date
    const payNowRows    = filterByDate(raw.payu.filter((p) => String(p.payustatususer || "").toLowerCase() === "pay now"),    "createdAt", startMs, endMs);
    const payLaterRows  = filterByDate(raw.payu.filter((p) => String(p.payustatususer || "").toLowerCase() === "pay later"),  "createdAt", startMs, endMs);
    const payFailedRows = filterByDate(raw.payu.filter((p) => String(p.payustatususer || "").toLowerCase() === "pay failed"), "createdAt", startMs, endMs);

    // ── Followups
    const fuPropertyRows = filterByDate(raw.fuProperty, "createdAt", startMs, endMs);
    const fuBuyerRows    = filterByDate(raw.fuBuyer,    "createdAt", startMs, endMs);

    // Column configs — kept short so the sub-table fits in the row width.
    const COLS = {
      login: [
        { key: "phone",     label: "Phone" },
        { key: "otp",       label: "OTP" },
        { key: "otpStatus", label: "OTP Status" },
        { key: "loginDate", label: "Login Date", format: formatDate },
      ],
      ba: [
        { key: "ba_id",        label: "BA ID" },
        { key: "phoneNumber",  label: "Phone" },
        { key: "baName",       label: "Buyer Name" },
        { key: "minPrice",     label: "Min Price" },
        { key: "maxPrice",     label: "Max Price" },
        { key: "createdAt",    label: "Created At", format: formatDate },
      ],
      property: [
        { key: "ppcId",        label: "PPC ID" },
        { key: "phoneNumber",  label: "Phone" },
        { key: "propertyType", label: "Type" },
        { key: "propertyMode", label: "Mode" },
        { key: "price",        label: "Price" },
        { key: "city",         label: "City" },
        { key: "createdAt",    label: "Created At", format: formatDate },
      ],
      contact: [
        { key: "phoneNumber", label: "Phone" },
        { key: "ppcId",       label: "PPC ID" },
        { key: "createdAt",   label: "Created At", format: formatDate },
      ],
      needHelp: [
        { key: "phoneNumber",     label: "Phone" },
        { key: "ppcId",           label: "PPC ID" },
        { key: "selectHelpReason",label: "Reason" },
        { key: "requestedAt",     label: "Requested At", format: formatDate },
      ],
      report: [
        { key: "phoneNumber", label: "Phone" },
        { key: "ppcId",       label: "PPC ID" },
        { key: "reason",      label: "Reason" },
        { key: "createdAt",   label: "Created At", format: formatDate },
      ],
      soldOut: [
        { key: "phoneNumber", label: "Phone" },
        { key: "ppcId",       label: "PPC ID" },
        { key: "createdAt",   label: "Created At", format: formatDate },
      ],
      called: [
        { key: "adminName",    label: "Admin" },
        { key: "phoneNumber",  label: "Phone" },
        {
          key: "calledExprience",
          label: "Calls",
          format: (v) => (Array.isArray(v) ? v.length : 0),
        },
      ],
      payu: [
        { key: "phoneNumber",     label: "Phone" },
        { key: "txnid",           label: "Txn ID" },
        { key: "amount",          label: "Amount" },
        { key: "payustatususer",  label: "Status" },
        { key: "createdAt",       label: "Date", format: formatDate },
      ],
      followup: [
        { key: "ppcId",        label: "PPC ID" },
        { key: "ba_id",        label: "BA ID" },
        { key: "phoneNumber",  label: "Phone" },
        { key: "adminName",    label: "Admin" },
        { key: "followupDate", label: "Followup Date", format: formatDay },
        { key: "createdAt",    label: "Created At",    format: formatDate },
      ],
    };

    return [
      { key: "login-otp",     section: "Login User Report",   report: "Login (OTP) Report",         rows: loginRows,      columns: COLS.login },

      { key: "ba-approved",   section: "Buyer Assistant",     report: "Approved Buyer Assistance",  rows: baActiveRows,   columns: COLS.ba },
      { key: "ba-pending",    section: "Buyer Assistant",     report: "Pending Buyer Assistance",   rows: baPendingRows,  columns: COLS.ba },

      { key: "prop-approved", section: "PPC Property",        report: "Approved Properties",        rows: propActiveRows, columns: COLS.property },
      { key: "prop-pre",      section: "PPC Property",        report: "PreApproved Properties",     rows: propPreRows,    columns: COLS.property },
      { key: "prop-pending",  section: "PPC Property",        report: "Pending Properties",         rows: propPendingRows,columns: COLS.property },

      { key: "cc-contact",    section: "Customer Care",       report: "Customer Care (Contact Us)", rows: ccContactRows,  columns: COLS.contact },
      { key: "cc-needhelp",   section: "Customer Care",       report: "Received Need Help",         rows: ccNeedHelpRows, columns: COLS.needHelp },
      { key: "cc-report",     section: "Customer Care",       report: "Received Report Property",   rows: ccReportRows,   columns: COLS.report },
      { key: "cc-soldout",    section: "Customer Care",       report: "Received Sold Out Request",  rows: ccSoldOutRows,  columns: COLS.soldOut },
      { key: "cc-called",     section: "Customer Care",       report: "User Called Experience",     rows: ccCalledRows,   columns: COLS.called },

      { key: "payu-now",      section: "Points PayU Records", report: "Points - Pay Now",           rows: payNowRows,     columns: COLS.payu },
      { key: "payu-later",    section: "Points PayU Records", report: "Points - Pay Later",         rows: payLaterRows,   columns: COLS.payu },
      { key: "payu-failed",   section: "Points PayU Records", report: "Points - Failed",            rows: payFailedRows,  columns: COLS.payu },

      { key: "fu-property",   section: "FollowUp",            report: "All Property Followups",     rows: fuPropertyRows, columns: COLS.followup },
      { key: "fu-buyer",      section: "FollowUp",            report: "All Buyer Followups",        rows: fuBuyerRows,    columns: COLS.followup },
    ];
  }, [raw, startMs, endMs]);

  // ── Staff Daily Follow-up Summary ─────────────────────────────────────────
  // One column per (staff, date): follow-ups + bills are grouped by the day they
  // were CREATED, so applying the top date range breaks the table out date-wise
  // (e.g. 13-05-2026 … 12-06-2026 each get their own column per active staff).
  // With no range applied it falls back to a single TODAY column per registered
  // staff. `adminName` may be comma-separated — each name is credited
  // independently. Today / Upcoming / Past due-date buckets are measured against
  // the real current date, not the column's date (matches the Rent reference).
  const staffDailyGroups = useMemo(() => {
    // Effective window = applied range, or just today when no range is set.
    const rangeApplied = startMs !== null || endMs !== null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayStartMs = startOfToday.getTime();
    const todayEndMs = todayStartMs + 24 * 60 * 60 * 1000 - 1;
    const winStart = startMs !== null ? startMs : todayStartMs;
    const winEnd = endMs !== null ? endMs : todayEndMs;
    const todayKey = moment().format("YYYY-MM-DD");

    const splitAdmins = (s) =>
      String(s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const isReal = (v) =>
      v !== undefined &&
      v !== null &&
      String(v).trim() !== "" &&
      String(v).trim().toUpperCase() !== "N/A";
    const hasValidId = (rec) => isReal(rec?.ppcId) || isReal(rec?.ba_id);

    const isClosed = (r) =>
      r?.followupStatus === "Paid Closed" ||
      r?.followupStatus === "Not Interested-Closed";

    const isPayment = (r) => r?.followupType === "Payment Followup";

    const inWindow = (t) =>
      typeof t === "number" && !Number.isNaN(t) && t >= winStart && t <= winEnd;

    // Local YYYY-MM-DD for the column key (matches the local-midnight range bounds).
    const dateKeyOf = (t) => {
      const m = moment(t);
      return m.isValid() ? m.format("YYYY-MM-DD") : "—";
    };

    const groups = new Map(); // key = `${staff}|${date}`
    const ensure = (staff, date) => {
      const key = `${staff}|${date}`;
      if (!groups.has(key)) {
        groups.set(key, {
          staff,
          date,
          allFollowups: 0,
          followWithId: 0,
          followWithoutId: 0,
          followUpdated: 0,
          todaysFollow: 0,
          upcoming: 0,
          past: 0,
          activePayment: 0,
          todayPayment: 0,
          billCount: 0,
          billAmount: 0,
          ...makeSplitZero(), // per-category (…_prop / …_buyer) counters
        });
      }
      return groups.get(key);
    };

    // Whitelist of registered staff (from /admin-all — same source as the Users
    // page). Activity attributed to anyone outside this set is ignored so legacy
    // or misspelled `adminName` strings don't pollute the report.
    const registered = new Set();
    (raw.staffUsers || []).forEach((u) => {
      const name = String(u?.name || "").trim();
      if (name) registered.add(name);
    });

    // No range → pre-seed every registered staff for TODAY so the default view
    // still shows one (zero-activity) column per staff. In range mode columns are
    // created lazily, so only (staff, date) pairs with real activity appear.
    if (!rangeApplied) {
      registered.forEach((name) => ensure(name, todayKey));
    }

    // Tag each record with its source so metrics can be split Property/Buyer.
    const allFollowups = [
      ...(raw.fuProperty || []).map((f) => ({ ...f, _source: "property" })),
      ...(raw.fuBuyer || []).map((f) => ({ ...f, _source: "buyer" })),
    ];

    allFollowups.forEach((f) => {
      const admins = splitAdmins(f.adminName).filter((n) => registered.has(n));
      if (admins.length === 0) return;

      const createdMs = f.createdAt ? new Date(f.createdAt).getTime() : NaN;
      if (!inWindow(createdMs)) return; // only records created inside the window
      const date = dateKeyOf(createdMs);

      const updatedMs = f.updatedAt ? new Date(f.updatedAt).getTime() : NaN;
      const fudMs = f.followupDate ? new Date(f.followupDate).getTime() : NaN;

      // Due-date buckets are relative to the real current date, not the column.
      const dueToday =
        !Number.isNaN(fudMs) && fudMs >= todayStartMs && fudMs <= todayEndMs;
      const dueFuture = !Number.isNaN(fudMs) && fudMs > todayEndMs;
      const duePast = !Number.isNaN(fudMs) && fudMs < todayStartMs;

      const withId = hasValidId(f);
      const closed = isClosed(f);
      const payment = isPayment(f);
      const cat = f._source === "buyer" ? "_buyer" : "_prop";

      admins.forEach((name) => {
        const s = ensure(name, date);
        // Increment a combined metric + its Property/Buyer split counterpart.
        const bump = (base, cond = true) => {
          if (!cond) return;
          s[base] = (s[base] || 0) + 1;
          s[base + cat] = (s[base + cat] || 0) + 1;
        };
        // Every record lands in its created-day column. allFollowups = withId + withoutId.
        bump("allFollowups");
        bump("followWithId", withId);
        bump("followWithoutId", !withId);
        // Genuine edits only. On insert Mongoose sets updatedAt ≈ createdAt, so a
        // brand-new follow-up must NOT count as "updated" — require updatedAt to
        // be meaningfully later than createdAt (>1s).
        bump(
          "followUpdated",
          !Number.isNaN(updatedMs) &&
            !Number.isNaN(createdMs) &&
            updatedMs - createdMs > 1000
        );
        // Due-date buckets (exclude closed — those are no longer actionable).
        if (!closed) {
          bump("todaysFollow", dueToday);
          bump("upcoming", dueFuture);
          bump("past", duePast);
        }
        // Payment follow-ups (open). Today's is the subset due today.
        if (payment && !closed) {
          bump("activePayment");
          bump("todayPayment", dueToday);
        }
      });
    });

    // Property + buyer bills combined (both share adminName / billDate / billAmount).
    // Bill day = createdAt when present, else billDate ("YYYY-MM-DD" or ISO).
    const allBills = [...(raw.bills || []), ...(raw.buyerBills || [])];
    allBills.forEach((b) => {
      let t = NaN;
      if (b?.createdAt) {
        const c = new Date(b.createdAt).getTime();
        if (!Number.isNaN(c)) t = c;
      }
      if (Number.isNaN(t) && b?.billDate) {
        const m = moment(b.billDate, ["YYYY-MM-DD", moment.ISO_8601], true);
        if (m.isValid()) t = m.valueOf();
      }
      if (!inWindow(t)) return;
      const date = dateKeyOf(t);
      const admins = splitAdmins(b.adminName).filter((n) => registered.has(n));
      if (admins.length === 0) return;
      const amount = Number(b.billAmount) || Number(b.netAmount) || 0;
      admins.forEach((name) => {
        const s = ensure(name, date);
        s.billCount += 1;
        s.billAmount += amount;
      });
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date); // oldest day first
      return a.staff.localeCompare(b.staff);
    });
  }, [raw, startMs, endMs]);

  // Grand total — sums every numeric metric across all (staff, date) columns for
  // the rightmost "Total" column of the Staff Daily Summary.
  const staffDailyTotal = useMemo(
    () => sumBuckets(staffDailyGroups),
    [staffDailyGroups]
  );

  const todayDisplay = moment().format("DD-MM-YYYY");

  // ── Hourly Activity helpers ────────────────────────────────────────────────
  // Twelve buckets covering 9 AM → 9 PM. 9-of-the-day inclusive on the start,
  // 21-of-the-day exclusive on the end. Activity outside that window is
  // ignored on the hourly report to match the "9 AM – 9 PM" framing.
  const HOUR_BUCKETS = useMemo(() => {
    const fmt = (h) => {
      if (h === 0) return "12 AM";
      if (h === 12) return "12 PM";
      return h < 12 ? `${h} AM` : `${h - 12} PM`;
    };
    const list = [];
    for (let h = 9; h <= 20; h += 1) {
      list.push({ start: h, end: h + 1, label: `${fmt(h)} – ${fmt(h + 1)}` });
    }
    return list;
  }, []);

  // Canonical staff list from the Users page (/admin-all). This is the same
  // source as the Users → Staff Details table, so every registered admin
  // appears in the dropdown — including staff with no follow-up activity yet.
  // We dedupe in case the API returns duplicate names.
  const staffOptions = useMemo(() => {
    const set = new Set();
    (raw.staffUsers || []).forEach((u) => {
      const name = String(u?.name || "").trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [raw.staffUsers]);

  // Default the selected staff to the first option once data lands.
  useEffect(() => {
    if (!hourlyStaff && staffOptions.length > 0) {
      setHourlyStaff(staffOptions[0]);
    }
  }, [staffOptions, hourlyStaff]);

  // Hourly aggregate for the chosen staff + date. Each bucket contains the
  // same metrics as the daily summary, but counted only for activity that
  // actually happened during that hour-of-day on the chosen date.
  // - Follow with/without ID: bucketed by `createdAt`'s hour.
  // - Follow Updated:         bucketed by `updatedAt`'s hour.
  // - Today/Upcoming/Past:    bucketed by `createdAt`'s hour, with the chosen
  //                           date acting as the reference "today" so that
  //                           e.g. picking yesterday makes yesterday-due
  //                           follow-ups land in "Today's Follow-up".
  // - Active/Today's Payment: same bucketing as above, scoped to Payment type.
  // - Bills: bucketed by bill `createdAt`'s hour.
  const hourlyData = useMemo(() => {
    const buckets = HOUR_BUCKETS.map((b) => ({
      ...b,
      allFollowups: 0,
      followWithId: 0,
      followWithoutId: 0,
      followUpdated: 0,
      todaysFollow: 0,
      upcoming: 0,
      past: 0,
      activePayment: 0,
      todayPayment: 0,
      billCount: 0,
      billAmount: 0,
      ...makeSplitZero(), // per-category (…_prop / …_buyer) counters
    }));

    if (!hourlyStaff || !hourlyDate) return buckets;

    const refStart = new Date(hourlyDate);
    refStart.setHours(0, 0, 0, 0);
    const refStartMs = refStart.getTime();
    const refEndMs = refStartMs + 24 * 60 * 60 * 1000 - 1;

    const splitAdmins = (s) =>
      String(s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    const isStaff = (raw) => splitAdmins(raw).includes(hourlyStaff);

    const isReal = (v) =>
      v !== undefined &&
      v !== null &&
      String(v).trim() !== "" &&
      String(v).trim().toUpperCase() !== "N/A";
    const hasValidId = (rec) => isReal(rec?.ppcId) || isReal(rec?.ba_id);
    const isClosed = (r) =>
      r?.followupStatus === "Paid Closed" ||
      r?.followupStatus === "Not Interested-Closed";
    const isPayment = (r) => r?.followupType === "Payment Followup";

    // Returns bucket index 0..11 for an instant on the chosen date within
    // 09:00–21:00, otherwise -1 (so the activity is dropped from the hourly
    // grid — but still appears in the daily summary above).
    const bucketIndex = (dateLike) => {
      if (!dateLike) return -1;
      const t = new Date(dateLike).getTime();
      if (Number.isNaN(t)) return -1;
      if (t < refStartMs || t > refEndMs) return -1;
      const h = new Date(t).getHours();
      if (h < 9 || h > 20) return -1;
      return h - 9;
    };

    // Tag each record with its source so metrics can be split Property/Buyer.
    const allFollowups = [
      ...(raw.fuProperty || []).map((f) => ({ ...f, _source: "property" })),
      ...(raw.fuBuyer || []).map((f) => ({ ...f, _source: "buyer" })),
    ];
    allFollowups.forEach((f) => {
      if (!isStaff(f.adminName)) return;

      const createdIdx = bucketIndex(f.createdAt);
      const updatedIdx = bucketIndex(f.updatedAt);

      const fudMs = f.followupDate ? new Date(f.followupDate).getTime() : NaN;
      const dueToday =
        !Number.isNaN(fudMs) && fudMs >= refStartMs && fudMs <= refEndMs;
      const dueFuture = !Number.isNaN(fudMs) && fudMs > refEndMs;
      const duePast = !Number.isNaN(fudMs) && fudMs < refStartMs;

      const withId = hasValidId(f);
      const closed = isClosed(f);
      const payment = isPayment(f);
      const cat = f._source === "buyer" ? "_buyer" : "_prop";

      if (createdIdx >= 0) {
        const b = buckets[createdIdx];
        // Increment a combined metric + its Property/Buyer split counterpart.
        const bump = (base, cond = true) => {
          if (!cond) return;
          b[base] = (b[base] || 0) + 1;
          b[base + cat] = (b[base + cat] || 0) + 1;
        };
        bump("allFollowups");
        bump("followWithId", withId);
        bump("followWithoutId", !withId);
        if (!closed) {
          bump("todaysFollow", dueToday);
          bump("upcoming", dueFuture);
          bump("past", duePast);
        }
        if (payment && !closed) {
          bump("activePayment");
          bump("todayPayment", dueToday);
        }
      }
      if (updatedIdx >= 0) {
        // Genuine edit only — exclude the insert where updatedAt ≈ createdAt.
        const createdMsH = f.createdAt ? new Date(f.createdAt).getTime() : NaN;
        const updatedMsH = f.updatedAt ? new Date(f.updatedAt).getTime() : NaN;
        if (!Number.isNaN(createdMsH) && updatedMsH - createdMsH > 1000) {
          const b = buckets[updatedIdx];
          b.followUpdated += 1;
          b["followUpdated" + cat] = (b["followUpdated" + cat] || 0) + 1;
        }
      }
    });

    const allBillsHourly = [...(raw.bills || []), ...(raw.buyerBills || [])];
    allBillsHourly.forEach((bill) => {
      if (!isStaff(bill.adminName)) return;
      // Use createdAt for hour bucketing — billDate alone is just YYYY-MM-DD
      // and doesn't carry an hour. Fall back to billDate's start-of-day so
      // bills without createdAt still surface in the 9 AM bucket.
      const idx = bucketIndex(bill.createdAt || bill.billDate);
      if (idx < 0) return;
      buckets[idx].billCount += 1;
      buckets[idx].billAmount +=
        Number(bill.billAmount) || Number(bill.netAmount) || 0;
    });

    return buckets;
  }, [raw, hourlyStaff, hourlyDate, HOUR_BUCKETS]);

  // End-of-day total for the Hourly table = sum of every metric across the 12
  // hour buckets. Drives the "Total (EOD)" column.
  const hourlyTotal = useMemo(() => sumBuckets(hourlyData), [hourlyData]);

  const handleApply = () => { /* memo recomputes when startDate/endDate change */ };

  const handleReset = () => {
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  };

  const handleExportExcel = () => {
    const sheetData = summaryRows.map((r, i) => ({
      "#":       i + 1,
      "Section": r.section,
      "Report":  r.report,
      "Count":   r.rows.length,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PPC Staff Report");
    const filename = `ppc-staff-report_${startDate || "all"}_${endDate || "all"}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // ── Per-table Excel exports ────────────────────────────────────────────
  // Each table on the page gets its own export so users can grab only the
  // section they care about. Handlers mirror what's rendered on screen.

  const handleExportSummaryTable = () => {
    const sheetData = summaryRows.map((r, i) => ({
      "#":       i + 1,
      "Section": r.section,
      "Report":  r.report,
      "Count":   r.rows.length,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(
      wb,
      `summary-table_${startDate || "all"}_${endDate || "all"}.xlsx`
    );
  };

  const handleExportStaffDaily = () => {
    if (!staffDailyGroups || staffDailyGroups.length === 0) {
      alert("No staff activity to export.");
      return;
    }
    // Excel cell for a metric — split rows export "Property / Buyer".
    const cell = (bucket, m) =>
      m.split ? renderSplitCell(bucket, m) : Number((bucket || {})[m.key] || 0);
    const dayLabel = (d) =>
      moment(d, "YYYY-MM-DD").isValid()
        ? moment(d, "YYYY-MM-DD").format("DD-MM-YYYY")
        : d;

    // Transposed shape: rows = metrics, one column per (staff, date) group,
    // plus a rightmost grand-Total column.
    const aoa = [
      ["Sl.No", ...staffDailyGroups.map((_, i) => i + 1), "—"],
      ["Name", ...staffDailyGroups.map((g) => g.staff), "All Staff"],
      ["Date", ...staffDailyGroups.map((g) => dayLabel(g.date)), "Total"],
      ...FOLLOWUP_DISPLAY_ROWS.map((m) => [
        m.label + (m.split ? " (P / B)" : ""),
        ...staffDailyGroups.map((g) => cell(g, m)),
        cell(staffDailyTotal, m),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Daily");
    const rangeTag =
      startDate || endDate ? `${startDate || "all"}_${endDate || "all"}` : todayDisplay;
    XLSX.writeFile(wb, `staff-daily-followup_${rangeTag}.xlsx`);
  };

  const handleExportHourly = () => {
    if (!hourlyStaff || !hourlyDate) {
      alert("Select a staff and date first.");
      return;
    }
    // Excel cell for a metric — split rows export "Property / Buyer".
    const cell = (bucket, m) =>
      m.split ? renderSplitCell(bucket, m) : Number((bucket || {})[m.key] || 0);

    const colCount = HOUR_BUCKETS.length + 1; // 12 hours + Total (EOD)
    const blanks = Array(colCount - 1).fill("");
    const aoa = [
      ["Name", hourlyStaff, ...blanks],
      ["Date", moment(hourlyDate).format("DD-MM-YYYY"), ...blanks],
      ["Hour", ...HOUR_BUCKETS.map((b) => b.label), "Total (EOD)"],
      ...FOLLOWUP_DISPLAY_ROWS.map((m) => [
        m.label + (m.split ? " (P / B)" : ""),
        ...hourlyData.map((b) => cell(b, m)),
        cell(hourlyTotal, m),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hourly Activity");
    const safeName = hourlyStaff.replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `hourly-activity_${safeName}_${hourlyDate}.xlsx`);
  };

  // Small button shown inside each section header on the right side.
  const sectionExportBtnStyle = {
    background: "#28A745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const sectionHeaderStyle = {
    background: "#E7F0FE",
    border: "1px solid #C7D8F2",
    borderRadius: "6px",
    padding: "12px 16px",
    margin: "20px 0 12px",
    color: "#1B4FA1",
    fontWeight: 600,
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const Card = ({ label, value, accent = "#2F747F" }) => (
    <div
      className="col-12 col-md-6 col-lg-3 mb-3"
      style={{ paddingLeft: 8, paddingRight: 8 }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #E0E6ED",
          borderLeft: `4px solid ${accent}`,
          borderRadius: "6px",
          padding: "14px 16px",
          minHeight: "84px",
        }}
      >
        <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>{label}</div>
        <div style={{ fontSize: "24px", fontWeight: 700, color: "#222" }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid p-3 ppc-staff-report" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Highlight non-zero report numbers in dark blue. Scoped + !important so
          it beats the global `td { color:#555 !important }` rule in App.css —
          React inline styles can't carry !important, so a class is required. */}
      <style>{`
        .ppc-staff-report td.ppc-num-blue {
          color: #0A3D91 !important;
          font-weight: 600 !important;
        }
      `}</style>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h3 style={{ color: "#2F747F", margin: 0 }}>PPC Staff Report</h3>
          <div style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
            {startDate || endDate
              ? `Showing data for ${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
              : "Showing all-time totals (apply a date range to filter)"}
          </div>
        </div>
        {!hideTopExport && (
          <button
            className="btn"
            style={{ background: "#28A745", color: "#fff", fontWeight: 500 }}
            onClick={handleExportExcel}
          >
            📊 Export Excel
          </button>
        )}
      </div>

      {/* Date Filter */}
      <div className="card p-3 mb-3" style={{ border: "1px solid #E0E6ED" }}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}>START DATE</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}>END DATE</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button className="btn btn-primary" onClick={handleApply}>Apply</button>
            <button className="btn btn-light" style={{ border: "1px solid #ccc" }} onClick={handleReset}>↻ Reset</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Loading report data…</div>}

      {!hideSectionCards && (
        <>
          {/* 1. Login User Report */}
          <div style={sectionHeaderStyle}>➡️ 1. Login User Report</div>
          <div className="row mx-0">
            <Card label="Login (OTP) Report" value={counts.loginOtp} accent="#6F42C1" />
          </div>

          {/* 2. Buyer Assistant */}
          <div style={sectionHeaderStyle}>👥 2. Buyer Assistant</div>
          <div className="row mx-0">
            <Card label="Approved Buyer Assistance" value={counts.baApproved}  accent="#28A745" />
            <Card label="Pending Buyer Assistance"  value={counts.baPending}   accent="#FD7E14" />
          </div>

          {/* 3. PPC Property */}
          <div style={sectionHeaderStyle}>🏢 3. PPC Property</div>
          <div className="row mx-0">
            <Card label="Approved Properties"     value={counts.propApproved}    accent="#28A745" />
            <Card label="PreApproved Properties"  value={counts.propPreApproved} accent="#17A2B8" />
            <Card label="Pending Properties"      value={counts.propPending}     accent="#FD7E14" />
          </div>

          {/* 4. Customer Care */}
          <div style={sectionHeaderStyle}>📞 4. Customer Care</div>
          <div className="row mx-0">
            <Card label="Customer Care (Contact Us)" value={counts.ccContact}    accent="#0D6EFD" />
            <Card label="Received Need Help"          value={counts.ccNeedHelp}   accent="#FFC107" />
            <Card label="Received Report Property"    value={counts.ccReport}     accent="#DC3545" />
            <Card label="Received Sold Out Request"   value={counts.ccSoldOut}    accent="#6C757D" />
            <Card label="User Called Experience"      value={counts.ccCalled}     accent="#20C997" />
          </div>

          {/* 5. Points PayU Records */}
          <div style={sectionHeaderStyle}>💳 5. Points PayU Records</div>
          <div className="row mx-0">
            <Card label="Points - Pay Now"   value={counts.payNow}    accent="#28A745" />
            <Card label="Points - Pay Later" value={counts.payLater}  accent="#FFC107" />
            <Card label="Points - Failed"    value={counts.payFailed} accent="#DC3545" />
          </div>

          {/* 6. FollowUp */}
          <div style={sectionHeaderStyle}>📋 6. FollowUp</div>
          <div className="row mx-0">
            <Card label="All Property Followups" value={counts.fuProperty} accent="#17A2B8" />
            <Card label="All Buyer Followups"    value={counts.fuBuyer}    accent="#6F42C1" />
          </div>
        </>
      )}

      {/* Summary Table */}
      <div style={{ ...sectionHeaderStyle, justifyContent: "space-between" }}>
        <span>📋 Summary Table</span>
        <button
          type="button"
          style={sectionExportBtnStyle}
          onClick={handleExportSummaryTable}
        >
          📊 Export
        </button>
      </div>
      <Table striped bordered hover responsive className="align-middle">
        <thead style={{ background: "#F8F9FA" }}>
          <tr>
            <th style={{ width: "60px" }}>#</th>
            <th>Section</th>
            <th>Report</th>
            <th style={{ textAlign: "right", width: "120px" }}>Count</th>
            {!hideActionColumn && (
              <th style={{ width: "140px" }}>Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {summaryRows.map((r, i) => {
            const isOpen = !!expanded[r.key];
            const visibleRows = isOpen ? r.rows.slice(0, ROW_CAP) : [];
            return (
              <React.Fragment key={r.key}>
                <tr>
                  <td>{i + 1}</td>
                  <td>{r.section}</td>
                  <td>{r.report}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{r.rows.length}</td>
                  {!hideActionColumn && (
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: isOpen ? "#6C757D" : "#FFFFFF",
                          color: isOpen ? "#FFFFFF" : "#0D6EFD",
                          border: `1px solid ${isOpen ? "#6C757D" : "#0D6EFD"}`,
                          padding: "2px 10px",
                          fontSize: "13px",
                          borderRadius: "4px",
                        }}
                        onClick={() => toggleExpand(r.key)}
                        disabled={r.rows.length === 0}
                        title={
                          r.rows.length === 0
                            ? "No records to show"
                            : isOpen
                            ? "Hide records"
                            : "Show records"
                        }
                      >
                        {isOpen ? "▲ Collapse" : "▼ Expand"}
                      </button>
                    </td>
                  )}
                </tr>

                {isOpen && (
                  <tr>
                    <td colSpan={hideActionColumn ? 4 : 5} style={{ background: "#FAFBFC", padding: "12px 16px" }}>
                      <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                        <strong>{r.report}</strong>
                        {" — "}
                        {r.rows.length > ROW_CAP
                          ? `showing ${ROW_CAP} of ${r.rows.length} records (capped at ${ROW_CAP})`
                          : `showing ${r.rows.length} record${r.rows.length === 1 ? "" : "s"}`}
                      </div>

                      {visibleRows.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "#888" }}>No records to display.</div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table className="table table-sm table-bordered mb-0" style={{ background: "#fff" }}>
                            <thead style={{ background: "#EEF2F7" }}>
                              <tr>
                                <th style={{ width: "50px" }}>#</th>
                                {r.columns.map((c) => (
                                  <th key={c.key}>{c.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {visibleRows.map((rec, idx) => (
                                <tr key={rec._id || rec.ppcId || rec.ba_id || idx}>
                                  <td>{idx + 1}</td>
                                  {r.columns.map((c) => {
                                    const val = rec?.[c.key];
                                    const display = c.format ? c.format(val) : val;
                                    return (
                                      <td key={c.key}>
                                        {display === undefined || display === null || display === ""
                                          ? "—"
                                          : String(display)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>

      {/* Staff Daily Follow-up Summary (transposed: one column per staff+date) */}
      <div style={{ ...sectionHeaderStyle, justifyContent: "space-between" }}>
        <span>👥 Staff Daily Follow-up Summary</span>
        <button
          type="button"
          style={sectionExportBtnStyle}
          onClick={handleExportStaffDaily}
          disabled={!staffDailyGroups || staffDailyGroups.length === 0}
        >
          📊 Export
        </button>
      </div>
      <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
        {startDate || endDate ? (
          <>
            Each column is one staff member on a given <strong>day</strong> within{" "}
            {formatDisplayDate(startDate)} – {formatDisplayDate(endDate)} — apply a
            wider range to see more date columns.
          </>
        ) : (
          <>Each column is one staff member for {todayDisplay} (apply a date range above to break the table out date-wise).</>
        )}{" "}
        The rightmost <strong>Total</strong> column is the grand total across all
        columns. Follow-up rows show <strong>Property / Buyer</strong> (P =
        PPC&nbsp;ID, B = BA&nbsp;ID). Staff are credited from the{" "}
        <em>Admin Name</em> on each follow-up (comma-separated names are split and
        credited independently). Records are grouped by the day they were created.
      </div>
      <ul
        style={{
          fontSize: "12px",
          color: "#777",
          marginBottom: "10px",
          paddingLeft: "18px",
          lineHeight: 1.6,
        }}
      >
        <li><strong>All Follow-ups</strong> — every follow-up created that day (= Follow with ID + Follow without ID).</li>
        <li><strong>Follow with ID</strong> — created that day, has a real PPC&nbsp;ID / BA&nbsp;ID.</li>
        <li><strong>Follow without ID</strong> — created that day, ID is blank or “N/A”.</li>
        <li><strong>Follow Updated</strong> — created that day and later edited (excludes the original create).</li>
        <li><strong>Today’s / Past Follow-up</strong> — open follow-ups whose Follow-up Date is today / in the past (vs the real current date).</li>
        <li><strong>Upcoming Follow-up</strong> — open follow-ups with a future Follow-up Date.</li>
        <li><strong>Active Payment Follow-up</strong> — open “Payment Followup” type; <strong>Today’s</strong> is the subset due today.</li>
        <li><strong>Bill Count / Amount</strong> — bills raised that day (property + buyer bills).</li>
      </ul>
      <div style={{ overflowX: "auto" }}>
        {staffDailyGroups.length === 0 ? (
          <div className="text-muted" style={{ fontSize: "13px" }}>
            No staff activity recorded for the selected range.
          </div>
        ) : (
          (() => {
            const labelTh = {
              background: "#EEF2F7",
              textAlign: "left",
              minWidth: "180px",
              fontWeight: 600,
            };
            const totalTd = {
              background: "#EEF2FF",
              fontWeight: 700,
              color: "#1E3A8A",
            };
            return (
              <Table
                striped
                bordered
                hover
                responsive
                className="align-middle text-center"
                style={{ background: "#fff" }}
              >
                <tbody>
                  {/* Header rows: Sl.No / Name / Date — each closed by a Total cell */}
                  <tr>
                    <th scope="row" style={labelTh}>Sl.No</th>
                    {staffDailyGroups.map((g, i) => (
                      <td key={`${g.staff}|${g.date}`}>{i + 1}</td>
                    ))}
                    <td style={totalTd}>—</td>
                  </tr>
                  <tr>
                    <th scope="row" style={labelTh}>Name</th>
                    {staffDailyGroups.map((g) => (
                      <td key={`${g.staff}|${g.date}`} style={{ fontWeight: 600 }}>{g.staff}</td>
                    ))}
                    <td style={totalTd}>All Staff</td>
                  </tr>
                  <tr>
                    <th scope="row" style={labelTh}>Date</th>
                    {staffDailyGroups.map((g) => (
                      <td key={`${g.staff}|${g.date}`} style={{ whiteSpace: "nowrap" }}>
                        {moment(g.date, "YYYY-MM-DD").isValid()
                          ? moment(g.date, "YYYY-MM-DD").format("DD-MM-YYYY")
                          : g.date}
                      </td>
                    ))}
                    <td style={totalTd}>Total</td>
                  </tr>
                  {/* Metric rows — split rows render "Property / Buyer" */}
                  {FOLLOWUP_DISPLAY_ROWS.map((m) => (
                    <tr key={m.key || m.base}>
                      <th scope="row" style={labelTh}>
                        {m.label}{m.split ? " (P / B)" : ""}
                      </th>
                      {staffDailyGroups.map((g) => (
                        <td
                          key={`${g.staff}|${g.date}`}
                          className={cellHasValue(g, m) ? "ppc-num-blue" : undefined}
                        >
                          {renderSplitCell(g, m)}
                        </td>
                      ))}
                      <td style={totalTd}>{renderSplitCell(staffDailyTotal, m)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            );
          })()
        )}
      </div>

      {/* Hourly Activity (9 AM – 9 PM) — drill-down per staff/per date */}
      <div style={{ ...sectionHeaderStyle, justifyContent: "space-between" }}>
        <span>📞 ⏱️ Hourly Activity (9 AM – 9 PM)</span>
        <button
          type="button"
          style={sectionExportBtnStyle}
          onClick={handleExportHourly}
          disabled={!hourlyStaff || !hourlyDate}
        >
          📊 Export
        </button>
      </div>
      <div className="card p-3 mb-3" style={{ border: "1px solid #E0E6ED" }}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}
            >
              STAFF
            </label>
            <select
              className="form-control"
              value={hourlyStaff}
              onChange={(e) => setHourlyStaff(e.target.value)}
            >
              <option value="">— Select Staff —</option>
              {staffOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}
            >
              DATE
            </label>
            <input
              type="date"
              className="form-control"
              value={hourlyDate}
              onChange={(e) => setHourlyDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6" style={{ color: "#555" }}>
            {hourlyStaff && hourlyDate && (
              <span>
                Showing <strong>{hourlyStaff}</strong> on{" "}
                <strong>{moment(hourlyDate).format("DD-MM-YYYY")}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {!hourlyStaff || !hourlyDate ? (
        <div className="text-muted" style={{ fontSize: "13px" }}>
          Select a staff and date to see the hourly breakdown.
        </div>
      ) : (
        <>
          <div style={{ fontSize: "12px", color: "#777", marginBottom: "8px" }}>
            Follow-up rows show <strong>Property / Buyer</strong> (P = PPC&nbsp;ID,
            B = BA&nbsp;ID). The <strong>Total (EOD)</strong> column is the
            whole-day end-of-day total across all hours.
          </div>
          <div style={{ overflowX: "auto" }}>
          <Table
            striped
            bordered
            hover
            responsive
            className="align-middle text-center"
            style={{ background: "#fff" }}
          >
            <tbody>
              <tr>
                <th
                  scope="row"
                  style={{
                    background: "#EEF2F7",
                    textAlign: "left",
                    minWidth: "180px",
                    fontWeight: 600,
                  }}
                >
                  Name
                </th>
                <td
                  colSpan={HOUR_BUCKETS.length + 1}
                  style={{ fontWeight: 600 }}
                >
                  {hourlyStaff}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  style={{
                    background: "#EEF2F7",
                    textAlign: "left",
                    fontWeight: 600,
                  }}
                >
                  Date
                </th>
                <td colSpan={HOUR_BUCKETS.length + 1}>
                  {moment(hourlyDate).format("DD-MM-YYYY")}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  style={{
                    background: "#EEF2F7",
                    textAlign: "left",
                    fontWeight: 600,
                  }}
                >
                  Hour
                </th>
                {HOUR_BUCKETS.map((b) => (
                  <th key={b.label} style={{ background: "#F8F9FA" }}>
                    {b.label}
                  </th>
                ))}
                <th style={{ background: "#EEF2FF", color: "#1E3A8A" }}>
                  Total (EOD)
                </th>
              </tr>
              {FOLLOWUP_DISPLAY_ROWS.map((m) => (
                <tr key={m.key || m.base}>
                  <th
                    scope="row"
                    style={{
                      background: "#EEF2F7",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    {m.label}{m.split ? " (P / B)" : ""}
                  </th>
                  {hourlyData.map((b, i) => (
                    <td
                      key={i}
                      className={cellHasValue(b, m) ? "ppc-num-blue" : undefined}
                    >
                      {renderSplitCell(b, m)}
                    </td>
                  ))}
                  <td
                    style={{ background: "#EEF2FF", fontWeight: 700, color: "#1E3A8A" }}
                  >
                    {renderSplitCell(hourlyTotal, m)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default PPCStaffReport;
