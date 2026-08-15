// Helpers for the Buyer Assistance min/max price dropdowns.
// Source DB stores legacy values like "50001", "100001" (with a stray
// trailing 1). UI strips that and shows an Indian-numbering wording line
// below each option.

export const isPriceField = (field) => field === "minPrice" || field === "maxPrice";

// "50001" -> "50000", "100001" -> "100000", "0" -> "0", "" -> ""
export const cleanPriceValue = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return s;
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return s;
  if (n === 0) return "0";
  return s.endsWith("1") ? s.slice(0, -1) + "0" : s;
};

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigit = (num) => {
  if (num < 20) return ONES[num];
  return TENS[Math.floor(num / 10)] + (num % 10 ? " " + ONES[num % 10] : "");
};

const threeDigit = (num) => {
  const h = Math.floor(num / 100);
  const rest = num % 100;
  let r = "";
  if (h) r = ONES[h] + " Hundred";
  if (rest) r += (r ? " " : "") + twoDigit(rest);
  return r;
};

// Indian numbering: Crore (10000000), Lakh (100000), Thousand (1000)
// 50000 -> "Fifty Thousand", 100000 -> "One Lakh", 1500000 -> "Fifteen Lakh"
export const numToIndianWords = (val) => {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return "";
  if (n === 0) return "Zero";

  let num = Math.abs(n);
  const parts = [];

  const crore = Math.floor(num / 10000000);
  num = num % 10000000;
  const lakh = Math.floor(num / 100000);
  num = num % 100000;
  const thousand = Math.floor(num / 1000);
  num = num % 1000;
  const last = num;

  if (crore) parts.push(twoDigit(crore) + " Crore");
  if (lakh) parts.push(twoDigit(lakh) + " Lakh");
  if (thousand) parts.push(twoDigit(thousand) + " Thousand");
  if (last) parts.push(threeDigit(last));

  return (n < 0 ? "Minus " : "") + parts.join(" ").trim();
};
