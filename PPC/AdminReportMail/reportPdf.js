// Renders the admin report as a PDF.
//
// PDFKit rather than a headless browser: it is pure JavaScript, so there is no
// Chromium download and nothing native to rebuild on the VPS, and it does not
// need an authenticated session to reach the page. The trade-off is that the
// tables are drawn by hand here instead of being screenshotted — the layout
// mirrors AdminReport.jsx (dark header row, striped body, grey section bands)
// rather than being pixel-identical to it.

const PDFDocument = require('pdfkit');

const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#dee2e6';
const HEAD_BG = '#212529';
const BAND_BG = '#e9ecef';
const STRIPE_BG = '#f8f9fa';
const TOTAL_BG = '#fff3cd';
const BRAND = '#0d6efd';

const PAGE = { size: 'A4', margin: 40 };
const ROW_H = 20;
const HEAD_H = 22;

const istStamp = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date);

/**
 * Column widths per section: a narrow SL NO, a wide DESCRIPTION, and equal
 * numeric columns filling whatever is left.
 */
function columnWidths(columns, usable) {
  const sl = 55;
  const numeric = columns.length - 2;
  const numericWidth = numeric === 1 ? 110 : 105;
  return [sl, usable - sl - numericWidth * numeric, ...Array(numeric).fill(numericWidth)];
}

/**
 * Build the report PDF.
 * @param {object} report  from fetchAdminReport()
 * @returns {Promise<Buffer>}
 */
function buildReportPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ ...PAGE, bufferPages: true, info: {
      Title: `Pondy Properties Admin Report - ${report.date}`,
      Author: 'Pondy Properties Admin Panel',
    } });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bottom = doc.page.height - doc.page.margins.bottom;

    // ── Title block ───────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(17).fillColor(BRAND)
      .text('Pondy Properties | Admin Report', left, doc.y);
    doc.moveDown(0.25);
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED)
      .text(`Data for: ${report.date}   ·   All Cities   ·   generated ${istStamp(report.generatedAt)} IST`);
    doc.moveDown(0.4);
    doc.strokeColor(BRAND).lineWidth(1.5)
      .moveTo(left, doc.y).lineTo(left + usable, doc.y).stroke();
    doc.moveDown(0.9);

    // ── Sections ──────────────────────────────────────────────────────────────
    report.sections.forEach((section, index) => {
      const widths = columnWidths(section.columns, usable);

      // Keep a section's heading with at least its header row and one line.
      const needed = 34 + HEAD_H + ROW_H * 2;
      if (index > 0 && doc.y + needed > bottom) doc.addPage();

      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(section.title, left, doc.y);
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(section.subtitle);
      doc.moveDown(0.45);

      const drawHeader = () => {
        const y = doc.y;
        doc.rect(left, y, usable, HEAD_H).fill(HEAD_BG);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
        let x = left;
        section.columns.forEach((col, i) => {
          doc.text(col, x + 6, y + 7, {
            width: widths[i] - 12,
            align: i >= 2 ? 'right' : 'left',
            lineBreak: false,
          });
          x += widths[i];
        });
        doc.y = y + HEAD_H;
      };

      drawHeader();

      let stripe = false;
      section.rows.forEach((row) => {
        // New page mid-table: repeat the column header so the page stands alone.
        if (doc.y + ROW_H > bottom) {
          doc.addPage();
          drawHeader();
        }
        const y = doc.y;

        // Grey band spanning the table — "CONVERSION BREAKDOWN" and friends.
        if (row.header) {
          doc.rect(left, y, usable, ROW_H).fill(BAND_BG);
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK)
            .text(row.header, left, y + 6, { width: usable, align: 'center', lineBreak: false });
          doc.y = y + ROW_H;
          stripe = false;
          return;
        }

        // Grand total: label spans the first two columns, like the screen.
        if (row.total) {
          const [label, ...values] = row.total;
          doc.rect(left, y, usable, ROW_H).fill(TOTAL_BG);
          doc.font('Helvetica-Bold').fontSize(9).fillColor(INK);
          doc.text(label, left + 6, y + 6, {
            width: widths[0] + widths[1] - 12, align: 'right', lineBreak: false,
          });
          let x = left + widths[0] + widths[1];
          values.forEach((value, i) => {
            doc.text(String(value), x + 6, y + 6, {
              width: widths[i + 2] - 12, align: 'right', lineBreak: false,
            });
            x += widths[i + 2];
          });
          doc.y = y + ROW_H;
          return;
        }

        if (stripe) doc.rect(left, y, usable, ROW_H).fill(STRIPE_BG);
        stripe = !stripe;

        doc.font('Helvetica').fontSize(9).fillColor(INK);
        let x = left;
        row.forEach((cell, i) => {
          doc.text(String(cell), x + 6, y + 6, {
            width: widths[i] - 12,
            align: i >= 2 ? 'right' : 'left',
            lineBreak: false,
          });
          x += widths[i];
        });
        doc.y = y + ROW_H;
      });

      // Close the table with a rule, then space before the next section.
      doc.strokeColor(LINE).lineWidth(0.5)
        .moveTo(left, doc.y).lineTo(left + usable, doc.y).stroke();
      doc.moveDown(1.1);
    });

    // ── Endpoints that failed, if any ─────────────────────────────────────────
    if (report.failures.length) {
      if (doc.y + 60 > bottom) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#b45309')
        .text(`${report.failures.length} endpoint(s) did not respond — those figures may read low:`, left, doc.y);
      doc.font('Helvetica').fontSize(8).fillColor(MUTED);
      report.failures.forEach((f) => doc.text(`• ${f}`, { indent: 8 }));
      doc.moveDown(0.6);
    }

    // ── Where this deliberately disagrees with the screen ─────────────────────
    if (report.notes && report.notes.length) {
      if (doc.y + 60 > bottom) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
        .text('Notes — figures computed differently from the admin screen:', left, doc.y);
      doc.font('Helvetica').fontSize(8).fillColor(MUTED);
      report.notes.forEach((n) => doc.text(`• ${n}`, { indent: 8, width: usable - 8 }));
    }

    // ── Page numbers ──────────────────────────────────────────────────────────
    // The footer sits BELOW the bottom margin, and PDFKit reacts to that by
    // adding a fresh page — which then needs its own footer, and so on. Drop the
    // bottom margin to zero for the duration so the text just lands where asked.
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(range.start + i);
      const keepBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(
        `Pondy Properties Admin Report · ${report.date} · page ${i + 1} of ${range.count}`,
        left,
        doc.page.height - keepBottom + 12,
        { width: usable, align: 'center', lineBreak: false }
      );
      doc.page.margins.bottom = keepBottom;
    }

    doc.end();
  });
}

module.exports = { buildReportPdf };
