// src/lib/ogcard.js
// Draws the 1200×630 image that LinkedIn, Messenger, X and Slack show when a link is shared.
// Plain browser canvas, no React, so the admin can regenerate cards right before publishing.
const W = 1200;
const H = 630;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Inter, Helvetica, Arial, sans-serif';

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Wraps text to at most `max` lines, adding an ellipsis if it runs over.
function wrap(ctx, text, width, max) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > width && line) { lines.push(line); line = w; } else line = test;
    if (lines.length === max) break;
  }
  if (lines.length < max && line) lines.push(line);
  const used = lines.join(' ').split(/\s+/).length;
  if (used < words.length) {
    let last = lines[lines.length - 1];
    while (ctx.measureText(`${last}…`).width > width && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws an image to fill a box, cropping like CSS object-fit: cover.
function cover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

/**
 * @param {object} o
 * @param {string} o.eyebrow  small label above the title (category, or role)
 * @param {string} o.title
 * @param {string} o.subtitle
 * @param {string} o.image    cover image URL (same origin)
 * @param {string} o.avatar   round photo instead of a cover (home card)
 * @param {string} o.initials monogram for the footer
 * @param {string} o.footer   e.g. "R J Salcedo · rjsalcedo-dev.netlify.app"
 * @returns {Promise<Blob>} JPEG
 */
export async function renderShareCard(o) {
  if (document.fonts?.ready) await document.fonts.ready;
  const [img, avatar] = await Promise.all([loadImage(o.image), loadImage(o.avatar)]);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Background: near-black with a soft blue glow, like Apple's dark product pages.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.78, H * 0.2, 40, W * 0.78, H * 0.2, 700);
  glow.addColorStop(0, 'rgba(10,132,255,0.28)');
  glow.addColorStop(1, 'rgba(10,132,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const hasVisual = !!img;
  const textW = hasVisual ? 560 : 1000;
  const left = 72;

  if (img) {
    // Cover in a floating rounded frame on the right.
    const fx = 668;
    const fy = 86;
    const fw = 480;
    const fh = 458;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;
    roundRect(ctx, fx, fy, fw, fh, 28);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, fx, fy, fw, fh, 28);
    ctx.clip();
    cover(ctx, img, fx, fy, fw, fh);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, fx, fy, fw, fh, 28);
    ctx.stroke();
  }

  let y = 150;
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(left + 48, 120, 48, 0, Math.PI * 2);
    ctx.clip();
    cover(ctx, avatar, left, 72, 96, 96);
    ctx.restore();
    y = 236;
  }

  ctx.textBaseline = 'alphabetic';
  if (o.eyebrow) {
    ctx.font = `600 26px ${FONT}`;
    ctx.fillStyle = '#2997ff';
    ctx.fillText(wrap(ctx, o.eyebrow, textW, 1)[0], left, y);
    y += 26;
  }

  const big = 64;
  ctx.font = `700 ${big}px ${FONT}`;
  ctx.fillStyle = '#f5f5f7';
  const titleLines = wrap(ctx, o.title, textW, hasVisual ? 3 : 2);
  for (const line of titleLines) { y += big * 1.08; ctx.fillText(line, left, y); }

  if (o.subtitle) {
    ctx.font = `400 28px ${FONT}`;
    ctx.fillStyle = '#a1a1a6';
    y += 26;
    for (const line of wrap(ctx, o.subtitle, textW, hasVisual ? 3 : 2)) { y += 38; ctx.fillText(line, left, y); }
  }

  // Footer: monogram tile + name and address.
  const by = H - 92;
  roundRect(ctx, left, by, 44, 44, 11);
  ctx.fillStyle = '#f5f5f7';
  ctx.fill();
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText(o.initials || 'RJ', left + 22, by + 28);
  ctx.textAlign = 'left';
  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = '#a1a1a6';
  ctx.fillText(o.footer || '', left + 60, by + 29);

  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.9));
}

// A short fingerprint of what a card shows, so it's only redrawn when that changes.
export const cardKey = (parts) => {
  const s = JSON.stringify(parts);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};
