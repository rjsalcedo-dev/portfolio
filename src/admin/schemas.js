// src/admin/schemas.js
// What each admin editor edits. Add a field here and it appears in the admin.
import { cleanSlug, uid } from '../lib/format';

const ICONS = [
  { value: 'github', label: 'GitHub' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'globe', label: 'Web' },
  { value: 'mail', label: 'Mail' }, { value: 'facebook', label: 'Facebook' }, { value: 'link', label: 'Other' },
];

export const PROFILE_FIELDS = [
  { row: [{ key: 'name', label: 'Name' }, { key: 'initials', label: 'Initials', hint: 'nav logo' }] },
  { key: 'role', label: 'Role', placeholder: 'IT Student & Software Developer' },
  { key: 'headline', label: 'Headline', hint: 'the big line at the top' },
  { key: 'intro', label: 'Intro', type: 'textarea', rows: 3 },
  { key: 'about', label: 'About', type: 'textarea', rows: 7, hint: 'blank line = new paragraph' },
  { row: [{ key: 'location', label: 'Location' }, { key: 'email', label: 'Public email', hint: 'leave blank to hide', autoCapitalize: 'none' }] },
  { key: 'avatar', label: 'Photo', type: 'image' },
  { key: 'status.open', label: 'Available for work', type: 'toggle', hint: 'Shows a green pulsing dot in the hero' },
  { key: 'status.label', label: 'Availability text', placeholder: 'Open to internships & OJT' },
  {
    key: 'socials', label: 'Links', type: 'list', newItem: () => ({ label: '', url: '', icon: 'link' }),
    fields: [{ key: 'label', label: 'Label' }, { key: 'url', label: 'URL', type: 'url', flex: 2 }, { key: 'icon', label: 'Icon', type: 'select', options: ICONS, flex: 3 }],
  },
];

export const EDUCATION_FIELDS = [
  { key: 'school', label: 'School' },
  { key: 'program', label: 'Program' },
  { key: 'location', label: 'Location' },
  { row: [{ key: 'start', label: 'Started', type: 'month' }, { key: 'end', label: 'Graduation (expected)', type: 'month' }] },
  { key: 'notes', label: 'Notes', type: 'textarea', rows: 3, hint: 'honors, focus, thesis' },
];

export const NOW_FIELDS = [
  { key: 'updated', label: 'Last updated', type: 'month', hint: 'shown as a badge' },
  { key: 'items', label: 'Items', type: 'list', newItem: () => ({ label: '', text: '' }), fields: [{ key: 'label', label: 'Label' }, { key: 'text', label: 'Text', flex: 3 }] },
];

export const SETTINGS_FIELDS = [
  { key: 'siteTitle', label: 'Browser tab title' },
  { key: 'siteDescription', label: 'Search description', type: 'textarea', rows: 2 },
  { key: 'showContactForm', label: 'Show contact form', type: 'toggle', hint: 'Messages arrive in the Inbox' },
  { key: 'showIntro', label: 'Welcome animation', type: 'toggle', hint: 'A short intro on the first visit to the home page' },
  { key: 'showRoleFit', label: 'Show the role-fit checker', type: 'toggle', hint: 'Recruiters paste a job description and see your matching proof' },
  { key: 'showGithub', label: 'Show GitHub activity', type: 'toggle', hint: 'Appears once your accounts have at least 10 contributions this year' },
  { key: 'githubUsers', label: 'GitHub accounts', type: 'tags', hint: 'comma separated; activity from all of them is combined' },
  { row: [{ key: 'city', label: 'City', hint: 'for the local-time chip' }, { key: 'replyTime', label: 'Usually replies…', placeholder: 'within a day' }] },
];

export const COLLECTIONS = {
  projects: {
    title: 'Projects',
    singular: 'project',
    label: (p) => p.title || 'Untitled project',
    sub: (p) => [p.category, p.year, p.hidden ? 'Hidden' : p.featured ? 'Featured' : ''].filter(Boolean).join(' · '),
    newItem: () => ({ id: uid('p'), slug: '', title: 'New project', tagline: '', category: '', year: String(new Date().getFullYear()), role: '', status: 'In progress', featured: false, hidden: false, cover: '', stack: [], links: { live: '', repo: '' }, summary: '', highlights: [], body: '' }),
    beforeSave: (p) => ({ ...p, slug: cleanSlug(p.slug) }),
    fields: [
      { row: [{ key: 'title', label: 'Title' }, { key: 'slug', label: 'URL slug', hint: 'auto from title' }] },
      { key: 'tagline', label: 'Tagline', hint: 'one sentence' },
      { row: [{ key: 'category', label: 'Category', placeholder: 'Mobile & Web' }, { key: 'year', label: 'Year' }] },
      { row: [{ key: 'role', label: 'Your role' }, { key: 'status', label: 'Status', placeholder: 'Live / In progress / Prototype' }] },
      { row: [{ key: 'featured', label: 'Featured', type: 'toggle', hint: 'Large card at the top' }, { key: 'hidden', label: 'Hidden', type: 'toggle', hint: 'Keep it off the site' }] },
      { key: 'cover', label: 'Cover image', type: 'image', hint: '16:10 works best; blank = generated cover' },
      { key: 'stack', label: 'Built with', type: 'tags' },
      { row: [{ key: 'links.live', label: 'Live URL', type: 'url' }, { key: 'links.repo', label: 'Repository URL', type: 'url' }] },
      { key: 'links.video', label: 'Demo video URL', type: 'url', hint: 'YouTube, Drive or Loom' },
      { key: 'metrics', label: 'Key numbers', type: 'list', hint: '2–4 facts shown under the cover', newItem: () => ({ value: '', label: '' }), fields: [{ key: 'value', label: 'Number', placeholder: '83%' }, { key: 'label', label: 'Label', placeholder: 'of the commits', flex: 2 }] },
      { key: 'summary', label: 'Summary', type: 'textarea', rows: 3, hint: 'used on the résumé' },
      { key: 'highlights', label: 'Highlights', type: 'lines' },
      { key: 'body', label: 'Case study', type: 'textarea', rows: 12, hint: 'start a paragraph with "The problem.", "How it works.", "My part." (or a line "## Heading") to make a section' },
      { key: 'gallery', label: 'Screenshots', type: 'gallery', hint: 'shown on the project page; tap to enlarge' },
    ],
  },
  credentials: {
    title: 'Credentials',
    singular: 'credential',
    label: (c) => c.title || 'Untitled',
    sub: (c) => [c.issuer, c.issued, c.hidden ? 'Hidden' : ''].filter(Boolean).join(' · '),
    thumb: (c) => c.image,
    newItem: () => ({ id: uid('c'), title: 'New certificate', issuer: 'Cisco Networking Academy', issued: '', expires: '', kind: 'certificate', image: '', file: '', credentialId: '', verifyUrl: '', description: '', skills: [], featured: false, hidden: false }),
    fields: [
      { key: 'title', label: 'Title' },
      { row: [{ key: 'issuer', label: 'Issuer' }, { key: 'kind', label: 'Type', type: 'select', options: [{ value: 'certificate', label: 'Certificate' }, { value: 'badge', label: 'Badge' }] }] },
      { row: [{ key: 'issued', label: 'Issued', type: 'month' }, { key: 'expires', label: 'Expires', type: 'month', hint: 'optional' }] },
      { key: 'file', label: 'Certificate file', type: 'document', hint: 'PDF or image; a preview is made automatically' },
      { key: 'image', label: 'Badge / preview image', type: 'image' },
      { row: [{ key: 'credentialId', label: 'Credential ID', hint: 'optional' }, { key: 'verifyUrl', label: 'Verification link', type: 'url', hint: 'Credly or NetAcad' }] },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, hint: 'what the course covered' },
      { key: 'skills', label: 'Skills', type: 'tags' },
      { row: [{ key: 'featured', label: 'Pin to top', type: 'toggle' }, { key: 'hidden', label: 'Hidden', type: 'toggle' }] },
    ],
  },
  achievements: {
    title: 'Honors & activities',
    singular: 'entry',
    label: (a) => a.title || 'Untitled',
    sub: (a) => [a.org, a.date, a.hidden ? 'Hidden' : ''].filter(Boolean).join(' · '),
    newItem: () => ({ id: uid('a'), title: 'New entry', type: 'award', org: '', date: '', description: '', link: '', hidden: false }),
    fields: [
      { key: 'title', label: 'Title', placeholder: "Dean's Lister, 1st Semester" },
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'award', label: 'Award' }, { value: 'competition', label: 'Competition' }, { value: 'leadership', label: 'Leadership' }, { value: 'event', label: 'Seminar' }, { value: 'volunteer', label: 'Volunteer' }] },
      { row: [{ key: 'org', label: 'Organization' }, { key: 'date', label: 'Date', type: 'month' }] },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { key: 'link', label: 'Link', type: 'url', hint: 'optional' },
      { key: 'hidden', label: 'Hidden', type: 'toggle' },
    ],
  },
  testimonials: {
    title: 'Testimonials',
    singular: 'testimonial',
    label: (t) => t.name || 'Unnamed',
    sub: (t) => [t.role, t.org, t.hidden ? 'Hidden' : ''].filter(Boolean).join(' · '),
    thumb: (t) => t.photo,
    newItem: () => ({ id: uid('t'), name: '', role: '', org: '', quote: '', photo: '', link: '', hidden: false }),
    fields: [
      { key: 'quote', label: 'Quote', type: 'textarea', rows: 4, hint: 'ask permission before publishing' },
      { row: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role', placeholder: 'Professor, OJT Supervisor' }] },
      { key: 'org', label: 'Organization' },
      { key: 'photo', label: 'Photo', type: 'image' },
      { key: 'link', label: 'Profile link', type: 'url', hint: 'LinkedIn, optional' },
      { key: 'hidden', label: 'Hidden', type: 'toggle' },
    ],
  },
  experience: {
    title: 'Experience',
    singular: 'role',
    label: (x) => x.role || 'Untitled role',
    sub: (x) => [x.org, x.start].filter(Boolean).join(' · '),
    newItem: () => ({ id: uid('x'), role: 'New role', org: '', location: '', start: '', end: '', summary: '', bullets: [] }),
    fields: [
      { row: [{ key: 'role', label: 'Role' }, { key: 'org', label: 'Organization' }] },
      { key: 'location', label: 'Location' },
      { row: [{ key: 'start', label: 'Start', type: 'month' }, { key: 'end', label: 'End', type: 'month', hint: 'blank = Present' }] },
      { key: 'summary', label: 'Summary', type: 'textarea', rows: 3 },
      { key: 'bullets', label: 'Achievements', type: 'lines', hint: 'one per line, for the résumé' },
    ],
  },
  skills: {
    title: 'Skills',
    singular: 'skill group',
    label: (g) => g.group || 'Untitled group',
    sub: (g) => `${g.items.length} skills`,
    newItem: () => ({ id: uid('s'), group: 'New group', items: [] }),
    fields: [
      { key: 'group', label: 'Group name' },
      { key: 'items', label: 'Skills', type: 'tags' },
    ],
  },
  resumes: {
    title: 'Résumé',
    singular: 'résumé version',
    label: (r) => r.name || 'Untitled',
    sub: (r, i) => (i === 0 ? 'Default · /resume' : `/resume/${r.slug || r.id}`),
    newItem: () => ({ id: uid('r'), slug: '', name: 'New version', headline: '', summary: '', projectIds: [], credentialIds: [], experienceIds: [], achievementIds: [], skillIds: [], showQr: true }),
    beforeSave: (r) => ({ ...r, slug: cleanSlug(r.slug) }),
    fields: [
      { row: [{ key: 'name', label: 'Version name', placeholder: 'Networking' }, { key: 'slug', label: 'Link', hint: '/resume/<link>', placeholder: 'networking' }] },
      { key: 'headline', label: 'Headline', placeholder: 'Aspiring Network Engineer' },
      { key: 'summary', label: 'Summary', type: 'textarea', rows: 4 },
      { key: 'showQr', label: 'QR code to portfolio', type: 'toggle', hint: 'Printed in the top corner so paper readers can open your site' },
      { key: 'projectIds', label: 'Projects', type: 'pick', options: (c) => c.projects.map((p) => ({ id: p.id, label: p.title, sub: p.category })) },
      { key: 'experienceIds', label: 'Experience', type: 'pick', options: (c) => c.experience.map((x) => ({ id: x.id, label: x.role, sub: x.org })) },
      { key: 'achievementIds', label: 'Honors & activities', type: 'pick', options: (c) => c.achievements.map((a) => ({ id: a.id, label: a.title, sub: a.org })) },
      { key: 'credentialIds', label: 'Certifications', type: 'pick', options: (c) => c.credentials.map((x) => ({ id: x.id, label: x.title, sub: x.issuer })) },
      { key: 'skillIds', label: 'Skill groups', type: 'pick', options: (c) => c.skills.map((g) => ({ id: g.id, label: g.group, sub: g.items.slice(0, 4).join(', ') })) },
    ],
  },
};

// Cisco Networking Academy courses, for one-click adding in Admin → Credentials.
// NetAcad certificates come as PDFs (netacad.com → Learning → Certificates); the matching
// digital badges are on Credly and can be imported separately.
export const NETACAD_ISSUER = 'Cisco Networking Academy';
export const NETACAD_COURSES = [
  { group: 'Networking', title: 'CCNA: Introduction to Networks', skills: ['Networking', 'IPv4/IPv6 addressing', 'Ethernet', 'Cisco IOS'] },
  { group: 'Networking', title: 'CCNA: Switching, Routing, and Wireless Essentials', skills: ['VLANs', 'Routing', 'WLAN', 'STP'] },
  { group: 'Networking', title: 'CCNA: Enterprise Networking, Security, and Automation', skills: ['OSPF', 'ACLs', 'NAT', 'WAN', 'Network automation'] },
  { group: 'Networking', title: 'Networking Basics', skills: ['Networking', 'IP addressing', 'Network protocols'] },
  { group: 'Networking', title: 'Networking Devices and Initial Configuration', skills: ['Cisco IOS', 'Switching', 'Routing'] },
  { group: 'Networking', title: 'Network Addressing and Basic Troubleshooting', skills: ['Subnetting', 'Troubleshooting'] },
  { group: 'Networking', title: 'Network Support and Security', skills: ['Network security', 'Troubleshooting'] },
  { group: 'Security', title: 'Introduction to Cybersecurity', skills: ['Cybersecurity', 'Threat awareness'] },
  { group: 'Security', title: 'Cybersecurity Essentials', skills: ['Cybersecurity', 'Risk management', 'Cryptography'] },
  { group: 'Security', title: 'Network Defense', skills: ['Network security', 'Firewalls', 'Access control'] },
  { group: 'Security', title: 'Endpoint Security', skills: ['Endpoint protection', 'Windows/Linux security'] },
  { group: 'Security', title: 'Cyber Threat Management', skills: ['Threat intelligence', 'Incident response'] },
  { group: 'Security', title: 'Ethical Hacker', skills: ['Penetration testing', 'Vulnerability assessment'] },
  { group: 'Security', title: 'Junior Cybersecurity Analyst Career Path', skills: ['SOC', 'Network defense', 'Threat management'] },
  { group: 'Security', title: 'CyberOps Associate', skills: ['Security operations', 'SIEM', 'Incident response'] },
  { group: 'IT & Systems', title: 'IT Essentials', skills: ['PC hardware', 'Operating systems', 'Troubleshooting'] },
  { group: 'IT & Systems', title: 'Computer Hardware Basics', skills: ['PC hardware'] },
  { group: 'IT & Systems', title: 'Operating Systems Basics', skills: ['Windows', 'Linux', 'macOS'] },
  { group: 'IT & Systems', title: 'Linux Essentials', skills: ['Linux', 'Command line'] },
  { group: 'IT & Systems', title: 'Linux Unhatched', skills: ['Linux', 'Command line'] },
  { group: 'Programming & Data', title: 'Python Essentials 1', skills: ['Python'] },
  { group: 'Programming & Data', title: 'Python Essentials 2', skills: ['Python', 'OOP'] },
  { group: 'Programming & Data', title: 'JavaScript Essentials 1', skills: ['JavaScript'] },
  { group: 'Programming & Data', title: 'JavaScript Essentials 2', skills: ['JavaScript', 'OOP'] },
  { group: 'Programming & Data', title: 'C++ Essentials 1', skills: ['C++'] },
  { group: 'Programming & Data', title: 'Introduction to Data Science', skills: ['Data science'] },
  { group: 'Programming & Data', title: 'Data Analytics Essentials', skills: ['Data analytics', 'SQL', 'Tableau'] },
  { group: 'Programming & Data', title: 'Introduction to IoT', skills: ['IoT'] },
  { group: 'Programming & Data', title: 'Introduction to Modern AI', skills: ['AI fundamentals'] },
];
