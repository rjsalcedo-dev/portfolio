// src/lib/share.js
// QR codes, contact cards and the plain-text résumé.
import { Platform } from 'react-native';
import qrcode from 'qrcode-generator';
import { formatMonth, formatRange, shortUrl, toDate } from './format';

export const siteUrl = (path = '/') => (Platform.OS === 'web' ? `${window.location.origin}${path}` : path);

// QR code as an SVG data URL (crisp at any size, prints sharply).
export function qrDataUrl(text, { dark = '#1d1d1f', light = '#ffffff' } = {}) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

// Downloads a .vcf contact card, so a recruiter can save you to their phone in one tap.
export function downloadVCard(profile) {
  const parts = profile.name.split(' ');
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : profile.name;
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(profile.name)}`,
    `TITLE:${esc(profile.role)}`,
    profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : null,
    `URL:${siteUrl('/')}`,
    ...profile.socials.map((s) => `URL;TYPE=${esc(s.label)}:${s.url}`),
    profile.location ? `ADR;TYPE=HOME:;;;${esc(profile.location)};;;` : null,
    `NOTE:${esc(profile.intro)}`,
    'END:VCARD',
  ].filter(Boolean);
  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${profile.name.replace(/\s+/g, '-')}.vcf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Plain-text résumé for job portals that want pasted text (ATS forms).
export function resumeText(content, resume) {
  const { profile, education } = content;
  const pick = (list, ids) => (ids || []).map((id) => list.find((x) => x.id === id)).filter(Boolean);
  const out = [];
  const h = (t) => { out.push('', t.toUpperCase()); };
  out.push(profile.name, resume.headline || profile.role, [profile.location, profile.email, shortUrl(siteUrl('/')), ...profile.socials.map((s) => shortUrl(s.url))].filter(Boolean).join(' | '));
  if (resume.summary) { h('Summary'); out.push(resume.summary); }
  h('Education');
  out.push(`${education.school} | ${education.program} | ${formatRange(education.start, education.end)}${toDate(education.end) > new Date() ? ' (expected)' : ''}`);
  if (education.notes) out.push(education.notes);
  const exp = pick(content.experience, resume.experienceIds);
  if (exp.length) {
    h('Experience');
    exp.forEach((x) => { out.push(`${x.role}, ${x.org} | ${formatRange(x.start, x.end)}`); if (x.summary) out.push(x.summary); (x.bullets || []).forEach((b) => out.push(`- ${b}`)); });
  }
  const projects = pick(content.projects, resume.projectIds);
  if (projects.length) {
    h('Projects');
    projects.forEach((p) => {
      out.push(`${p.title} | ${(p.stack || []).join(', ')}${p.year ? ` | ${p.year}` : ''}`);
      if (p.summary) out.push(p.summary);
      (p.highlights || []).slice(0, 3).forEach((b) => out.push(`- ${b}`));
    });
  }
  const ach = pick(content.achievements, resume.achievementIds);
  if (ach.length) { h('Honors & Activities'); ach.forEach((a) => out.push(`${a.title}${a.org ? `, ${a.org}` : ''}${a.date ? ` | ${formatMonth(a.date)}` : ''}`)); }
  const creds = pick(content.credentials, resume.credentialIds);
  if (creds.length) { h('Certifications'); creds.forEach((c) => out.push(`${c.title} | ${c.issuer}${c.issued ? ` | ${formatMonth(c.issued)}` : ''}`)); }
  const skills = pick(content.skills, resume.skillIds);
  if (skills.length) { h('Skills'); skills.forEach((g) => out.push(`${g.group}: ${g.items.join(', ')}`)); }
  return out.join('\n').trim();
}
