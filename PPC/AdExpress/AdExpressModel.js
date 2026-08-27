const mongoose = require('mongoose');

/**
 * Staging store for property ads scraped out of the Adexpress classified weekly.
 *
 *   adexpress_issues — one document per newspaper issue (discovered on the
 *                      publisher's site or uploaded by an admin), tracking the
 *                      PDF and how far OCR got.
 *   adexpress_ads    — one document per property ad box read out of an issue.
 *
 * Both collections are new and self-contained: nothing here touches the live
 * rentals collection or its schema. An ad only reaches the live app when an
 * admin reviews it and presses Import, which hands the row to the app's
 * existing POST /PPC/bulk-upload-properties path.
 */

const issueSchema = new mongoose.Schema(
  {
    // 'site' — discovered on adexpressonline.in; 'upload' — an admin sent the PDF.
    source: { type: String, default: 'site', trim: true },
    // Only the editions in config.editions are ever staged — Pondicherry today.
    edition: { type: String, default: 'Pondicherry', trim: true },
    // Stable identity for the issue, e.g. "pondicherry-2026-08-08".
    issueKey: { type: String, required: true, trim: true, unique: true },
    issueLabel: { type: String, default: '', trim: true }, // "Volume 41, Issue 19"
    // Taken from the PDF's file name, which is the only reliable source — the
    // publisher's post dates lag a week behind the paper they carry.
    issueNumber: { type: Number },
    issueDate: { type: Date },

    // Where it came from on the publisher's site (empty for uploads).
    postId: { type: Number },
    postLink: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },

    // Local copy of the PDF (relative to the backend cwd) and its page scans.
    pdfPath: { type: String, default: '' },
    pdfBytes: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },
    hasTextLayer: { type: Boolean, default: false },

    // discovered -> downloaded -> processing -> processed | failed
    status: { type: String, default: 'discovered', trim: true },
    // Per-page triage + OCR outcome, shown as a progress list on the screen.
    pages: [
      {
        pageNo: Number,
        hasProperty: Boolean,
        hasRent: Boolean,
        sections: [String],
        // 'boxes' — each ad read on its own (numbers get double-checked);
        // 'tiles' — the fallback when the ad boxes could not be found;
        // 'text'  — the PDF had a real text layer.
        readBy: String,
        boxesFound: Number,
        tilesRead: Number,
        adsFound: Number,
        rentAdsFound: Number,
        skipped: Boolean,
        error: String,
      },
    ],

    adsFound: { type: Number, default: 0 },
    rentAdsFound: { type: Number, default: 0 },
    newAds: { type: Number, default: 0 },
    duplicateAds: { type: Number, default: 0 },
    phonesVerified: { type: Number, default: 0 },
    phonesDisputed: { type: Number, default: 0 },

    // Rough OpenAI spend for this issue.
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },

    error: { type: String, default: '' },
    processedAt: { type: Date },
    processedBy: { type: String, default: '' },
  },
  { timestamps: true, collection: 'adexpress_issues' }
);

issueSchema.index({ issueDate: -1 });
issueSchema.index({ edition: 1, issueDate: -1 });
issueSchema.index({ status: 1 });

const adSchema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'AdExpressIssue' },
    issueKey: { type: String, default: '', trim: true },
    issueLabel: { type: String, default: '', trim: true },
    issueDate: { type: Date },
    edition: { type: String, default: 'Pondicherry', trim: true },
    pageNo: { type: Number, default: 0 },

    // Same ad box read from two overlapping crops collapses onto one adKey.
    adKey: { type: String, required: true, trim: true, unique: true },
    // Phone-level identity so a repeat advertiser is visible across issues.
    leadKey: { type: String, default: '', trim: true },
    seenTimes: { type: Number, default: 1 },

    dealType: { type: String, default: 'unknown', trim: true }, // rent | sale | wanted | unknown
    headline: { type: String, default: '' },
    rawText: { type: String, default: '' },

    phones: [String],
    primaryPhone: { type: String, default: '', trim: true },
    otherNumbers: [String], // landlines / numbers that failed validation

    // How much the phone number can be trusted:
    //   verified   every independent reading of the ad agreed, digit for digit
    //   disputed   the readings disagreed — candidates below, nothing accepted
    //   unreadable no number could be read from the printed ad
    //   unverified read once only (tile / text fallback), never double-checked
    //   confirmed  a person checked it against the picture of the ad
    // Only 'confirmed' may be imported (unless ADEXPRESS_REQUIRE_CONFIRM=false,
    // which also lets 'verified' through).
    phoneStatus: { type: String, default: 'unverified', trim: true },
    phoneCandidates: [{ digits: String, votes: Number, of: Number }],
    confirmedBy: { type: String, default: '' },
    confirmedAt: { type: Date },

    // Picture of this exact ad, cut from the page scan — what the reviewer
    // confirms the number against.
    cropPath: { type: String, default: '' },
    box: { x: Number, y: Number, w: Number, h: Number },
    pageWidth: { type: Number },
    pageHeight: { type: Number },

    rentAmount: { type: Number, default: null },
    deposit: { type: Number, default: null },
    bedrooms: { type: String, default: '' },
    propertyMode: { type: String, default: '' },
    propertyType: { type: String, default: '' },
    locality: { type: String, default: '' },
    address: { type: String, default: '' },
    areaSqft: { type: Number, default: null },
    floorNo: { type: String, default: '' },
    features: [String],
    language: { type: String, default: 'mixed' },
    confidence: { type: Number, default: null },

    // Why a human should look before importing (unreadable digits, rent/sale
    // unclear, ...). Empty means the record looks clean.
    reviewIssues: [String],
    needsReview: { type: Boolean, default: false },

    // Does this number already exist in the live rentals collection? Filled in
    // by a read-only lookup when the ads are listed.
    existsInApp: { type: Boolean, default: false },
    existingRentIds: [Number],

    // new -> shortlisted | ignored | imported
    status: { type: String, default: 'new', trim: true },
    note: { type: String, default: '' },

    importedAt: { type: Date },
    importedBy: { type: String, default: '' },
    importedListingId: { type: Number }, // the ppcId this ad became
    // Batch id returned by /bulk-upload-properties, so an import can be traced
    // back (and reverted) through the app's existing bulk-upload tooling.
    bulkUploadId: { type: String, default: '' },
  },
  { timestamps: true, collection: 'adexpress_ads' }
);

adSchema.index({ createdAt: -1 });
adSchema.index({ dealType: 1, status: 1, issueDate: -1 });
adSchema.index({ phoneStatus: 1, dealType: 1 });
adSchema.index({ primaryPhone: 1 });
adSchema.index({ leadKey: 1 });
adSchema.index({ issue: 1, pageNo: 1 });

const AdExpressIssue = mongoose.model('AdExpressIssue', issueSchema);
const AdExpressAd = mongoose.model('AdExpressAd', adSchema);

module.exports = { AdExpressIssue, AdExpressAd };
