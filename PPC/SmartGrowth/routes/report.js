// Communication > WhatsApp > Campaign Report — every campaign SmartGrowth has
// sent for this account, sliced like a Power BI page.
//
//   POST /sg/report/sync      refresh the local copy (read-only calls); force=1 ignores the 2-minute gap
//   GET  /sg/report/data      every visual, for the filters
//   GET  /sg/report/rows      the detailed view: one page of messages
//   GET  /sg/report/export    every message for the filters, as CSV
//   GET  /sg/report/choices   campaigns and templates for the slicers

const express = require('express');
const sync = require('../engine/campaignSync');
const report = require('../engine/report');
const U = require('../util');

const router = express.Router();

router.post('/sg/report/sync', async (req, res) => {
  try {
    const r = await sync.sync(String((req.body || {}).force || req.query.force || '') === '1');
    const cname = String((req.body || {}).cname || '').trim();
    res.json({
      status: r.state === 'error' ? 'error' : 'success', state: r.state, message: r.message, pending: r.pending,
      lastSync: await sync.lastSync(), now: Date.now(), cid: cname ? await report.campaignId(cname) : '',
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/report/data', async (req, res) => {
  try {
    const out = await report.data(req.query);
    res.json({
      status: 'success', ...out,
      choices: req.query.choices === '1' ? await report.choices() : null,
      sources: report.SOURCES, lastSync: await sync.lastSync(), now: Date.now(),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/report/rows', async (req, res) => {
  try {
    res.json({ status: 'success', ...(await report.rows(req.query)) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/report/export', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp-campaign-report-${U.istCompact()}.csv"`);
    const cell = (v) => { const s = v === undefined || v === null ? '' : String(v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    res.write('﻿' + ['When', 'Number', 'Rent Pondy user', 'Status', 'Reason', 'Replied', 'Campaign', 'Sent from', 'Template'].join(',') + '\r\n');
    for await (const m of report.cursor(req.query)) {
      res.write([U.istStamp(m.at), /^\d+$/.test(m.phone) ? U.e164(m.phone) : m.phone, m.known ? 'yes' : '', m.status, m.error || '',
        m.replied ? 'yes' : '', m.campaignName, report.SOURCES[m.source] || m.source, m.templateName || ''].map(cell).join(',') + '\r\n');
    }
    res.end();
  } catch (e) {
    if (!res.headersSent) res.status(500).send(e.message);
    else res.end();
  }
});

router.get('/sg/report/choices', async (req, res) => {
  try {
    res.json({ status: 'success', ...(await report.choices()) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
