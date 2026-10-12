# R J Salcedo: Portfolio

Personal portfolio and résumé system. Expo + React Native Web (same stack as Nuvix+), served by Netlify, with a built-in admin at `/admin` that edits everything on the site.

## Features

- **Admin CMS** (`/admin`): profile, Now, projects, credentials, experience, education, skills, résumé versions, inbox and settings. Saving publishes instantly.
- **Version history**: every save keeps the previous version (last 30), with one-click restore plus JSON export/import backups.
- **Résumé builder** (`/resume`): a print-ready A4 résumé generated from the same content. Make tailored versions (e.g. *Networking* vs *Development*), each at its own link (`/resume/networking`). "Download PDF" uses the browser's print-to-PDF.
- **Credly import**: pulls every public badge (Cisco NetAcad badges are issued on Credly) with images and verification links. Re-running refreshes them without duplicates.
- **⌘K / Ctrl K command palette**: search every section, project, credential and résumé, and switch theme.
- **Live academic progress**: year level and % to graduation are calculated from your education dates.
- **Availability status** with a live indicator, a **"Now"** section with a last-updated date, and a **contact form** that goes to the admin inbox (spam honeypot + rate limit).
- **Cisco NetAcad certificates**: pick finished courses from the built-in catalog, upload each certificate PDF (a page-1 preview is rendered automatically), add a credential ID. Visitors open a detail sheet with *View certificate* / *Verify*.
- **Insights**: private, cookie-free stats (visits, résumé opens/downloads, top projects, referrers, countries, devices, recent activity). Your own signed-in visits, bots and Do-Not-Track are excluded.
- **Tracked share links** (`/r/<code>`): one link per company or recruiter; Insights shows when each one opened your portfolio or résumé. Links are stored privately, never in the public content.
- **Share & save contact**: QR code, copy link, native share and a vCard download. The printed résumé carries a QR code to the portfolio.
- **Copy résumé as text** for job portals, plus **Honors & activities**, **Testimonials** and **project screenshot galleries** with a full-screen viewer.
- **Safe editing**: unpublished edits are kept in the browser automatically (restore banner after a closed tab), **Preview** shows the draft on the real site before you publish, and photos are compressed before upload.
- Light/dark (follows the system, or pin it), mobile-first layout, reduced-motion support.

## Project layout

```
App.js                     app shell + routes
src/screens/               Home, Project case study, Résumé, 404
src/admin/                 admin screen, panels, field schemas (add a field in schemas.js → it appears in the admin)
src/components/            design system (ui.js), cards, nav, command palette, forms
src/theme/tokens.js        colors, type scale, spacing
src/data/defaults.js       seed content (first run + offline fallback)
netlify/functions/         content, auth, upload, media, contact, credly
public/                    index.html template, _redirects, _headers, favicon
```

## Run locally

```bash
npm install
cp .env.example .env      # set ADMIN_PASSWORD and SESSION_SECRET
npm run dev               # netlify dev → http://localhost:8888 (site + functions + local Blobs)
```

`npm start` runs the Expo web server alone (no API: the site shows the seed content).

## Deploy (Netlify CLI, same as Nuvix+)

```bash
netlify init                      # first time: create/link the site
netlify env:set ADMIN_PASSWORD "a-long-passphrase"
netlify env:set SESSION_SECRET "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
npm run deploy                    # builds and deploys to production
```

Then open `https://<your-site>/admin`, sign in, and press **Save** once to publish the seed content.
