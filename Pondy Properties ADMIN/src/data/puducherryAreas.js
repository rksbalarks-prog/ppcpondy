// Puducherry (Pondicherry) area + pincode reference data.
// Compiled from public India Post records for the 605xxx pincode range
// (Puducherry city + nearby suburban localities in the Puducherry district).
//
// Each entry: { area: string, pincode: string }
// Add more localities or correct mappings here as needed; the AreaPincodeFields
// component filters by both area name and pincode and shows live suggestions.

export const PUDUCHERRY_AREAS = [
  // 605001 — Pondicherry HO / GPO area
  { area: "Pondicherry GPO",        pincode: "605001" },
  { area: "Marine Street",          pincode: "605001" },
  { area: "Bharathi Salai",         pincode: "605001" },
  { area: "NSC Bose Salai",         pincode: "605001" },
  { area: "Subbiah Salai",          pincode: "605001" },
  { area: "White Town",             pincode: "605001" },
  { area: "Pondicherry Bazaar",     pincode: "605001" },
  { area: "Pillaiyar Koil Street",  pincode: "605001" },

  // 605002 — Muthialpet
  { area: "Muthialpet",             pincode: "605002" },
  { area: "Saram",                  pincode: "605002" },
  { area: "Karuvadikuppam",         pincode: "605002" },
  { area: "Vambakeerapalayam",      pincode: "605002" },

  // 605003 — Mudaliarpet
  { area: "Mudaliarpet",            pincode: "605003" },
  { area: "Kumaran Nagar",          pincode: "605003" },

  // 605004 — Reddiarpalayam
  { area: "Reddiarpalayam",         pincode: "605004" },
  { area: "Indira Nagar",           pincode: "605004" },
  { area: "Anna Nagar",             pincode: "605004" },
  { area: "Pakkamudayanpet",        pincode: "605004" },
  { area: "Murungapakkam",          pincode: "605004" },

  // 605005 — Ariyankuppam
  { area: "Ariyankuppam",           pincode: "605005" },
  { area: "Aryankuppam",            pincode: "605005" }, // alt spelling
  { area: "Veerampattinam",         pincode: "605005" },
  { area: "Rangapillai Thottam",    pincode: "605005" },

  // 605007 — Mettupalayam
  { area: "Mettupalayam",           pincode: "605007" },
  { area: "Karikalampakkam",        pincode: "605007" },
  { area: "Thavalakuppam",          pincode: "605007" },

  // 605008 — Lawspet
  { area: "Lawspet",                pincode: "605008" },
  { area: "Solai Nagar",            pincode: "605008" },
  { area: "Pillaiyarkuppam",        pincode: "605008" },

  // 605009 — Mahatma Gandhi Salai / Periyar Nagar belt
  { area: "Mahatma Gandhi Salai",   pincode: "605009" },

  // 605012 — Vaithikuppam
  { area: "Vaithikuppam",           pincode: "605012" },

  // 605013 — Periyar Nagar
  { area: "Periyar Nagar",          pincode: "605013" },

  // 605014 — Kalapet / Pondicherry University
  { area: "Kalapet",                pincode: "605014" },
  { area: "Chinnakalapet",          pincode: "605014" },
  { area: "Pondicherry University", pincode: "605014" },
  { area: "Pillaichavady",          pincode: "605014" },

  // 605101 — Embalam
  { area: "Embalam",                pincode: "605101" },

  // 605102 — Bahour
  { area: "Bahour",                 pincode: "605102" },

  // 605103 — Kirumampakkam
  { area: "Kirumampakkam",          pincode: "605103" },

  // 605107 — Thiruvandarkoil
  { area: "Thiruvandarkoil",        pincode: "605107" },
  { area: "Madagadipet",            pincode: "605107" },

  // 605110 — Villianur
  { area: "Villianur",              pincode: "605110" },
  { area: "Sundararaja Nagar",      pincode: "605110" },

  // 605111 — Sedarapet / Manapet
  { area: "Sedarapet",              pincode: "605111" },
  { area: "Manapet",                pincode: "605111" },
  { area: "Maducarai",              pincode: "605111" },

  // 605502 — Mannadipet
  { area: "Mannadipet",             pincode: "605502" },
  { area: "Suthukeny",              pincode: "605502" },
];

// Helper: find pincode for an exact area name (case-insensitive).
export const lookupPincodeByArea = (areaName) => {
  if (!areaName) return "";
  const target = String(areaName).trim().toLowerCase();
  const match = PUDUCHERRY_AREAS.find((r) => r.area.toLowerCase() === target);
  return match ? match.pincode : "";
};

// Helper: find areas (one or many) for a given 6-digit pincode.
export const lookupAreasByPincode = (pincode) => {
  if (!pincode) return [];
  const target = String(pincode).trim();
  return PUDUCHERRY_AREAS.filter((r) => r.pincode === target).map((r) => r.area);
};
