// GET /sitemap.xml → every public page, so search engines find each project without crawling the app.
import { getStore } from '@netlify/blobs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export default async (req) => {
  const origin = new URL(req.url).origin;
  const c = (await getStore({ name: 'portfolio' }).get('content', { type: 'json' })) || {};
  const lastmod = (c.updatedAt || new Date().toISOString()).slice(0, 10);
  const resumes = (c.resumes || []).slice(1).map((r) => `/resume/${r.slug || r.id}`);
  const projects = (c.projects || []).filter((p) => !p.hidden && p.slug).map((p) => `/projects/${p.slug}`);
  const urls = ['/', '/brief', '/resume', ...resumes, ...projects];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(origin + u)}</loc><lastmod>${lastmod}</lastmod>${u === '/' ? '<priority>1.0</priority>' : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};

export const config = { path: '/sitemap.xml' };
