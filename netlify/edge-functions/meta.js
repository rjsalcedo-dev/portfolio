// netlify/edge-functions/meta.js
// The site is a single-page app, so link-preview bots (LinkedIn, Messenger, X, Slack) and
// search engines would otherwise see the same generic <head> on every URL. This writes the
// right title, description, share image and structured data into the HTML per page.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const abs = (origin, u) => (!u ? '' : /^https?:\/\//.test(u) ? u : `${origin}${u.startsWith('/') ? '' : '/'}${u}`);

function metaFor(pathname, c, origin) {
  const p = c.profile || {};
  const s = c.settings || {};
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.role,
    description: p.intro,
    url: `${origin}/`,
    image: abs(origin, p.avatar) || undefined,
    address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location } : undefined,
    alumniOf: c.education?.school ? { '@type': 'CollegeOrUniversity', name: c.education.school } : undefined,
    sameAs: (p.socials || []).map((x) => x.url),
  };
  const home = {
    title: s.siteTitle || `${p.name}: ${p.role}`,
    description: s.siteDescription || p.intro,
    image: abs(origin, s.ogImage || p.avatar),
    type: 'profile',
    jsonld: person,
  };

  const project = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (project) {
    const x = (c.projects || []).find((q) => q.slug === decodeURIComponent(project[1]) && !q.hidden);
    if (!x) return home;
    return {
      title: `${x.title} · ${p.name}`,
      description: x.tagline || x.summary,
      image: abs(origin, x.ogImage || x.cover || s.ogImage),
      type: 'article',
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: x.title,
        description: x.summary || x.tagline,
        image: abs(origin, x.cover) || undefined,
        dateCreated: x.year,
        keywords: (x.stack || []).join(', '),
        url: `${origin}${pathname}`,
        creator: { '@type': 'Person', name: p.name, url: `${origin}/` },
      },
    };
  }
  if (/^\/resume/.test(pathname)) return { ...home, title: `${p.name} · Résumé`, description: `Résumé of ${p.name}, ${p.role}.` };
  if (/^\/brief/.test(pathname)) return { ...home, title: `${p.name} · 30-second brief`, description: `Everything a recruiter needs about ${p.name} on one page.` };
  if (/^\/card/.test(pathname)) return { ...home, title: `${p.name} · Business card`, noindex: true };
  return home;
}

export default async (request, context) => {
  const res = await context.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;

  const url = new URL(request.url);
  let content = null;
  try {
    const r = await fetch(new URL('/api/content', url.origin), { headers: { accept: 'application/json' } });
    content = (await r.json()).content;
  } catch { /* fall back to the static tags */ }
  if (!content?.profile) return res;

  const m = metaFor(url.pathname, content, url.origin);
  const canonical = `${url.origin}${url.pathname.replace(/\/$/, '') || '/'}`;
  const tags = [
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    m.noindex ? '<meta name="robots" content="noindex" />' : '',
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:site_name" content="${esc(content.profile.name)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    m.image ? `<meta property="og:image" content="${esc(m.image)}" />` : '',
    m.image && /\.jpe?g($|\?)/.test(m.image) ? '<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />' : '',
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    m.image ? `<meta name="twitter:image" content="${esc(m.image)}" />` : '',
    m.jsonld ? `<script type="application/ld+json">${JSON.stringify(m.jsonld).replace(/</g, '\\u003c')}</script>` : '',
  ].filter(Boolean).join('\n    ');

  let html = await res.text();
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
    // Drop the static generic tags; the specific ones below replace them.
    .replace(/\s*<meta (name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g, '')
    .replace('</head>', `    ${tags}\n  </head>`);

  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  return new Response(html, { status: res.status, headers });
};

export const config = { path: ['/', '/projects/*', '/resume', '/resume/*', '/brief', '/card'] };
