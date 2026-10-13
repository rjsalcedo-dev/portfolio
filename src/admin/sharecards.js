// src/admin/sharecards.js
// Before publishing, redraws link-preview images for anything whose card would look
// different (title, tagline, category, cover, name...). Unchanged cards are reused.
import { cardKey, renderShareCard } from '../lib/ogcard';
import { api } from '../lib/api';

async function make(name, opts) {
  const blob = await renderShareCard(opts);
  const { url } = await api.upload(new File([blob], `${name}-share.jpg`, { type: 'image/jpeg' }));
  return url;
}

export async function refreshShareCards(content) {
  const { profile } = content;
  const footer = `${profile.name} · ${window.location.host}`;
  const base = { initials: profile.initials, footer };
  let changed = 0;

  const projects = [];
  for (const p of content.projects) {
    const key = cardKey([p.title, p.tagline, p.category, p.cover, footer]);
    if (p.ogKey === key && p.ogImage) { projects.push(p); continue; }
    try {
      const url = await make(p.slug || p.id, { ...base, eyebrow: p.category, title: p.title, subtitle: p.tagline, image: p.cover });
      projects.push({ ...p, ogImage: url, ogKey: key });
      changed += 1;
    } catch {
      projects.push(p); // e.g. a cover pasted from another site can't be drawn; keep the old card
    }
  }

  let settings = content.settings;
  const homeKey = cardKey([profile.name, profile.role, profile.headline, profile.avatar, footer]);
  if (settings.ogKey !== homeKey || !settings.ogImage) {
    try {
      const url = await make('home', { ...base, eyebrow: `${profile.name} · ${profile.role}`, title: profile.headline, subtitle: profile.intro, avatar: profile.avatar });
      settings = { ...settings, ogImage: url, ogKey: homeKey };
      changed += 1;
    } catch { /* keep the previous home card */ }
  }

  return { content: { ...content, projects, settings }, changed };
}
