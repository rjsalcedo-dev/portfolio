// GET /api/github → contribution calendar (all listed accounts merged), streaks, top languages
// and recent public pushes. Cached for 6 hours; a stale copy is served if GitHub is unreachable.
// Accounts come from the site's Settings → GitHub accounts. GITHUB_TOKEN (optional) raises the
// API rate limit.
import { getStore } from '@netlify/blobs';
import { json } from '../lib/auth.mjs';

const TTL = 6 * 3600 * 1000;
const UA = { 'user-agent': 'rjsalcedo-portfolio' };
const apiHeaders = () => ({ ...UA, accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) });

async function calendar(user) {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(user)}/contributions`, { headers: UA });
  if (!res.ok) throw new Error(`calendar ${user}: ${res.status}`);
  const html = await res.text();
  const counts = {};
  for (const m of html.matchAll(/<tool-tip[^>]*for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)</g)) {
    const n = m[2].match(/^(\d[\d,]*) contribution/);
    counts[m[1]] = n ? Number(n[1].replace(/,/g, '')) : 0;
  }
  const days = {};
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})" id="(contribution-day-component-[\d-]+)"/g)) days[m[1]] = counts[m[2]] || 0;
  return days;
}

async function publicActivity(user) {
  const [reposRes, eventsRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, { headers: apiHeaders() }),
    fetch(`https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=50`, { headers: apiHeaders() }),
  ]);
  const repos = reposRes.ok ? await reposRes.json() : [];
  const events = eventsRes.ok ? await eventsRes.json() : [];
  return { repos: Array.isArray(repos) ? repos : [], events: Array.isArray(events) ? events : [] };
}

function streaks(days) {
  const dates = Object.keys(days).sort();
  let longest = 0; let run = 0;
  for (const d of dates) { run = days[d] > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  // Current streak: today may still be empty, so start from yesterday in that case.
  let current = 0;
  let i = dates.length - 1;
  if (i >= 0 && days[dates[i]] === 0) i -= 1;
  for (; i >= 0 && days[dates[i]] > 0; i -= 1) current += 1;
  return { current, longest };
}

async function build(users) {
  const merged = {};
  const languages = {};
  const pushes = [];
  let stars = 0;
  let publicRepos = 0;
  for (const user of users) {
    const days = await calendar(user);
    for (const [d, n] of Object.entries(days)) merged[d] = (merged[d] || 0) + n;
    const { repos, events } = await publicActivity(user);
    for (const r of repos) {
      if (r.fork) continue;
      publicRepos += 1;
      stars += r.stargazers_count || 0;
      if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
    }
    for (const e of events) {
      if (e.type !== 'PushEvent') continue;
      const commits = e.payload?.commits || [];
      pushes.push({
        repo: e.repo?.name,
        at: e.created_at,
        count: e.payload?.size ?? commits.length,
        message: (commits[commits.length - 1]?.message || '').split('\n')[0].slice(0, 120),
      });
    }
  }
  const days = Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
  const total = days.reduce((a, d) => a + d.count, 0);
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  for (const d of days) byWeekday[new Date(`${d.date}T00:00:00Z`).getUTCDay()] += d.count;
  return {
    users,
    fetchedAt: new Date().toISOString(),
    days,
    total,
    activeDays: days.filter((d) => d.count > 0).length,
    ...streaks(merged),
    busiestWeekday: byWeekday.indexOf(Math.max(...byWeekday)),
    languages: Object.entries(languages).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
    stars,
    publicRepos,
    pushes: pushes.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
  };
}

export default async () => {
  const content = await getStore({ name: 'portfolio', consistency: 'strong' }).get('content', { type: 'json' });
  // Same default as src/data/defaults.js, for content saved before this setting existed.
  const users = (content?.settings?.githubUsers || ['rjsalcedo-dev']).filter((u) => /^[a-z0-9-]{1,39}$/i.test(u)).slice(0, 4);
  if (!users.length) return json({ users: [] }, 200, { 'cache-control': 'public, max-age=300' });

  const cache = getStore('cache');
  const key = `github-${users.join('+').toLowerCase()}`;
  const cached = await cache.get(key, { type: 'json' });
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL) {
    return json(cached, 200, { 'cache-control': 'public, max-age=600' });
  }
  try {
    const fresh = await build(users);
    await cache.setJSON(key, fresh);
    return json(fresh, 200, { 'cache-control': 'public, max-age=600' });
  } catch (e) {
    if (cached) return json({ ...cached, stale: true }, 200, { 'cache-control': 'public, max-age=300' });
    return json({ error: 'GitHub is unreachable right now.' }, 502);
  }
};

export const config = { path: '/api/github' };
