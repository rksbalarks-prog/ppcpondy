// Finds the individual ad boxes on a scanned classified page, from the pixels.
//
// Why this exists: the vision model cannot be trusted to say where an ad is —
// asked for both a bounding box and the phone number in one call it invents a
// tidy lattice AND starts fabricating digits. Locating the boxes is a job for
// plain image processing, and it buys two things that matter a great deal:
//
//   1. each ad can be read on its own, at full resolution, instead of six at a
//      time — far fewer misread digits;
//   2. the reviewer can be shown a picture of the actual printed ad, which is
//      the only way a contact number is ever confirmed to be right.
//
// The page is a lattice of boxes drawn with black rules on white. So: threshold
// the page, find the horizontal and vertical rule segments, then look for pairs
// of horizontal rules joined at both ends by a vertical rule. Deterministic, no
// model, ~150ms for a 1440x2184 page.

/**
 * @param {{width:number,height:number,data:Buffer|Uint8Array}} raw decoded RGBA page
 */
function detectLines(raw, opt = {}) {
  const W = raw.width;
  const H = raw.height;
  const threshold = opt.threshold || 140;
  const gap = opt.gap || 3; // ink dropouts this small do not break a rule

  const dark = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < W * H; i++, p += 4) {
    const lum = (raw.data[p] * 299 + raw.data[p + 1] * 587 + raw.data[p + 2] * 114) / 1000;
    dark[i] = lum < threshold ? 1 : 0;
  }

  const minH = opt.minHorizontal || Math.round(W * 0.035);
  const minV = opt.minVertical || Math.round(H * 0.012);

  // Scans are never perfectly square: over the height of one ad a "vertical"
  // rule drifts a pixel or two sideways, which breaks a strict column scan and
  // loses the box. Following a rule with a one-pixel tolerance across its
  // width absorbs that drift (about half a degree of skew).
  const darkNear = (i, stride) => dark[i] || dark[i - stride] || dark[i + stride];

  const hSegs = [];
  for (let y = 1; y < H - 1; y++) {
    let x = 0;
    while (x < W) {
      if (!darkNear(y * W + x, W)) {
        x++;
        continue;
      }
      let end = x;
      let missed = 0;
      for (let k = x + 1; k < W; k++) {
        if (darkNear(y * W + k, W)) {
          end = k;
          missed = 0;
        } else if (++missed > gap) break;
      }
      if (end - x >= minH) hSegs.push({ y, x0: x, x1: end });
      x = end + 1;
    }
  }

  const vSegs = [];
  for (let x = 1; x < W - 1; x++) {
    let y = 0;
    while (y < H) {
      if (!darkNear(y * W + x, 1)) {
        y++;
        continue;
      }
      let end = y;
      let missed = 0;
      for (let k = y + 1; k < H; k++) {
        if (darkNear(k * W + x, 1)) {
          end = k;
          missed = 0;
        } else if (++missed > gap) break;
      }
      if (end - y >= minV) vSegs.push({ x, y0: y, y1: end });
      y = end + 1;
    }
  }

  // A printed rule is a few pixels thick, so collapse parallel neighbours.
  const hLines = [];
  hSegs.sort((a, b) => a.y - b.y || a.x0 - b.x0);
  for (const s of hSegs) {
    const hit = hLines.find(
      (m) => Math.abs(m.y - s.y) <= 4 && s.x0 <= m.x1 + 6 && s.x1 >= m.x0 - 6
    );
    if (hit) {
      hit.x0 = Math.min(hit.x0, s.x0);
      hit.x1 = Math.max(hit.x1, s.x1);
    } else {
      hLines.push({ ...s });
    }
  }

  const vLines = [];
  vSegs.sort((a, b) => a.x - b.x || a.y0 - b.y0);
  for (const s of vSegs) {
    const hit = vLines.find(
      (m) => Math.abs(m.x - s.x) <= 4 && s.y0 <= m.y1 + 6 && s.y1 >= m.y0 - 6
    );
    if (hit) {
      hit.y0 = Math.min(hit.y0, s.y0);
      hit.y1 = Math.max(hit.y1, s.y1);
    } else {
      vLines.push({ ...s });
    }
  }

  return { hLines, vLines, width: W, height: H };
}

/**
 * Rectangles closed on all four sides — the ad boxes.
 * @returns {Array<{x:number,y:number,w:number,h:number}>} in reading order
 */
function detectAdBoxes(raw, opt = {}) {
  const { hLines, vLines, width: W, height: H } = detectLines(raw, opt);

  const tol = opt.tol || 8;
  const minW = opt.minW || Math.round(W * 0.06);
  // Rules also close small rectangles around headline underlines, so an ad has
  // to clear a real-world minimum height and area before it counts.
  const minH = opt.minH || Math.round(H * 0.025);
  const maxH = opt.maxH || Math.round(H * 0.45);
  const minArea = opt.minArea || W * H * 0.003;
  const maxArea = opt.maxArea || W * H * 0.45; // bigger than that is the page frame
  const cover = opt.cover || 0.82; // how much of the side a vertical rule must draw

  const tops = hLines.slice().sort((a, b) => a.y - b.y);
  const found = [];

  for (let i = 0; i < tops.length; i++) {
    for (let k = i + 1; k < tops.length; k++) {
      const top = tops[i];
      const bottom = tops[k];
      const dy = bottom.y - top.y;
      if (dy < minH) continue;
      if (dy > maxH) break; // sorted by y, so nothing further down can fit either

      const xa = Math.max(top.x0, bottom.x0);
      const xb = Math.min(top.x1, bottom.x1);
      if (xb - xa < minW) continue;

      const draws = (line) =>
        line.y0 <= top.y + tol &&
        line.y1 >= bottom.y - tol &&
        (Math.min(line.y1, bottom.y) - Math.max(line.y0, top.y)) / dy >= cover;

      // Horizontal rules often run the width of several ads, so the sides are
      // not at the ends of the overlap. Take every vertical rule that runs the
      // full height between these two rules, and treat each ADJACENT pair of
      // them as one cell — that is the ad box.
      const sides = vLines
        .filter((l) => l.x >= xa - tol && l.x <= xb + tol && draws(l))
        .sort((a, b) => a.x - b.x);

      for (let s = 0; s + 1 < sides.length; s++) {
        const left = sides[s].x;
        const right = sides[s + 1].x;
        const w = right - left;
        if (w < minW) continue;
        const area = w * dy;
        if (area < minArea || area > maxArea) continue;
        found.push({ x: left, y: top.y, w, h: dy });
      }
    }
  }

  // Rectangles nest — two ads stacked in one column are also enclosed by a
  // rectangle of their own. Now that the fragments are filtered out, keeping
  // only rectangles that contain no other surviving rectangle leaves exactly
  // the individual ads.
  const contains = (a, b) =>
    b.x >= a.x - 3 && b.y >= a.y - 3 && b.x + b.w <= a.x + a.w + 3 && b.y + b.h <= a.y + a.h + 3;
  const minimal = found.filter(
    (a) => !found.some((b) => b !== a && contains(a, b) && b.w * b.h < a.w * a.h * 0.95)
  );

  const boxes = [];
  for (const r of minimal) {
    const dup = boxes.some(
      (s) =>
        Math.abs(s.x - r.x) < 6 &&
        Math.abs(s.y - r.y) < 6 &&
        Math.abs(s.w - r.w) < 10 &&
        Math.abs(s.h - r.h) < 10
    );
    if (!dup) boxes.push(r);
  }

  // Reading order: down the page, left to right within a band.
  return boxes.sort((a, b) => (Math.abs(a.y - b.y) > 20 ? a.y - b.y : a.x - b.x));
}

/** Copy a rectangle out of a decoded page as its own RGBA image. */
function cropRaw(raw, rect, pad = 0) {
  const x = Math.max(0, rect.x - pad);
  const y = Math.max(0, rect.y - pad);
  const w = Math.min(raw.width - x, rect.w + pad * 2);
  const h = Math.min(raw.height - y, rect.h + pad * 2);

  const out = Buffer.allocUnsafe(w * h * 4);
  for (let j = 0; j < h; j++) {
    const src = ((y + j) * raw.width + x) * 4;
    if (raw.data.copy) raw.data.copy(out, j * w * 4, src, src + w * 4);
    else out.set(raw.data.subarray(src, src + w * 4), j * w * 4);
  }
  return { data: out, width: w, height: h, x, y };
}

module.exports = { detectLines, detectAdBoxes, cropRaw };
