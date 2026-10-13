// src/data/defaults.js
// Seed content. The live site reads the version saved from /admin (Netlify Blobs); this file
// is only the first-run starting point and the offline fallback. Edit content in the admin.

export const DEFAULT_CONTENT = {
  schema: 1,
  updatedAt: null,

  profile: {
    name: 'R J Salcedo',
    initials: 'RJ',
    role: 'IT Student & Software Developer',
    headline: 'I build software that feels simple.',
    intro:
      'Final-year student at the University of Baguio, shipping cross-platform apps, AI tools and games, with a growing focus on networking through Cisco Networking Academy.',
    about:
      'I like the whole stack of a product: the interface people touch, the services behind it, and the network it runs on. My largest project, Nuvix+, runs on the web, Android, Android TV, iPhone and Windows from one React Native codebase, with its own admin console and serverless backend.\n\nOutside class I study networking through Cisco NetAcad and build tools that solve real local problems, like Agri-Aid, an AI assistant for Filipino farmers.',
    location: 'Baguio City, Philippines',
    email: '',
    avatar: '',
    status: { open: true, label: 'Open to internships & OJT' },
    socials: [
      { label: 'GitHub', url: 'https://github.com/rjsalcedo-dev', icon: 'github' },
    ],
  },

  education: {
    school: 'University of Baguio',
    program: 'BS Information Technology',
    location: 'Baguio City, Philippines',
    start: '2023-08',
    end: '2027-06',
    notes: 'Coursework in app development, game design, networking and systems.',
  },

  now: {
    updated: '2026-10',
    items: [
      { label: 'Studying', text: 'Final year at the University of Baguio.' },
      { label: 'Building', text: 'Nuvix+ across web, mobile, TV and desktop.' },
      { label: 'Learning', text: 'Networking with Cisco Networking Academy.' },
    ],
  },

  projects: [
    {
      id: 'p-nuvix',
      slug: 'nuvix-plus',
      title: 'Nuvix+',
      tagline: 'Discover movies and TV, build mixtapes with friends.',
      category: 'Mobile & Web',
      year: '2026',
      role: 'Solo developer',
      status: 'Live',
      featured: true,
      cover: '',
      stack: ['React Native', 'Expo', 'Firebase', 'Netlify Functions', 'TMDB API'],
      links: { live: 'https://nuvix.netlify.app', repo: '' },
      summary:
        'A cross-platform entertainment app that runs on the web, Android, Android TV, iPhone and Windows from a single React Native codebase.',
      highlights: [
        'One Expo codebase shipped to web, Android, Android TV, iOS and a Windows desktop app',
        'Shared "mixtapes" with deep links, collaborative editing and share sheets',
        'QR-code sign-in for TVs, profiles with Face ID lock, offline downloads',
        'Serverless backend on Netlify Functions with an admin console for announcements and insights',
      ],
      body: '',
    },
    {
      id: 'p-agriaid',
      slug: 'agri-aid',
      title: 'Agri-Aid',
      tagline: 'An AI agricultural assistant for Filipino farmers.',
      category: 'AI',
      year: '2026',
      role: 'Developer',
      status: 'Prototype',
      featured: true,
      cover: '',
      stack: ['Python', 'FastAPI', 'Ollama', 'Llama 3.1', 'LLaVA', 'BeautifulSoup'],
      links: { live: '', repo: 'https://github.com/rjsalcedo-dev/Agri-aid' },
      summary:
        'Local-LLM assistant that answers crop, pest, market-price and weather questions with citations to official Philippine government sources.',
      highlights: [
        'Runs Llama 3.1 and LLaVA locally through Ollama: no paid cloud APIs',
        'Photo diagnosis for local threats like Rice Black Bug, Tungro and Armyworm',
        'Scrapes DA and PSA price monitoring with a national-average fallback',
        'Every answer cites PhilRice, BPI, DA or PSA so farmers can verify it',
      ],
      body: '',
    },
    {
      id: 'p-ufitness',
      slug: 'ufitness',
      title: 'UFitness',
      tagline: 'A fitness companion app for iPhone.',
      category: 'Mobile & Web',
      year: '2026',
      role: 'Developer',
      status: 'In progress',
      featured: false,
      cover: '',
      stack: ['React Native', 'Expo', 'Firebase'],
      links: { live: '', repo: 'https://github.com/rjsalcedo-dev/UFitness-IOS-' },
      summary: 'A mobile fitness app built with Expo and Firebase.',
      highlights: [],
      body: '',
    },
    {
      id: 'p-voiddrop',
      slug: 'void-drop',
      title: 'Void Drop',
      tagline: 'An arcade game built in Godot.',
      category: 'Games',
      year: '2025',
      role: 'Game developer',
      status: 'Playable',
      featured: false,
      cover: '',
      stack: ['Godot', 'GDScript', 'Shaders'],
      links: { live: '', repo: 'https://github.com/rjsalcedo-dev/Void-Drop-Latest' },
      summary: 'A Godot game with custom shaders, menu music and a local leaderboard.',
      highlights: [],
      body: '',
    },
    {
      id: 'p-royal',
      slug: 'royal-horizons-bank',
      title: 'Royal Horizons Bank',
      tagline: 'A responsive banking landing page.',
      category: 'Web',
      year: '2024',
      role: 'Front-end developer',
      status: 'Live',
      featured: false,
      cover: '',
      stack: ['HTML', 'CSS'],
      links: {
        live: 'https://rjsalcedo-dev.github.io/Royal-Horizons-Bank/',
        repo: 'https://github.com/rjsalcedo-dev/Royal-Horizons-Bank',
      },
      summary: 'A hand-built HTML and CSS landing page for a fictional bank.',
      highlights: [],
      body: '',
    },
  ],

  // Cisco NetAcad certificates and Credly badges. Import badges from Settings → Credly.
  credentials: [],

  experience: [],

  // Honors, awards, org roles, hackathons, seminars.
  achievements: [],

  // Quotes from professors, supervisors, clients or teammates.
  testimonials: [],

  skills: [
    { id: 's-lang', group: 'Languages', items: ['JavaScript', 'Python', 'GDScript', 'HTML', 'CSS'] },
    { id: 's-fw', group: 'Frameworks', items: ['React Native', 'Expo', 'React', 'FastAPI'] },
    { id: 's-cloud', group: 'Cloud & Data', items: ['Firebase', 'Netlify', 'Firestore', 'REST APIs'] },
    { id: 's-tools', group: 'Tools', items: ['Git', 'GitHub', 'Godot', 'Ollama', 'VS Code'] },
  ],

  resumes: [
    {
      id: 'general',
      name: 'General',
      headline: 'IT Student & Software Developer',
      summary:
        'Final-year IT student who ships production apps across web, mobile, TV and desktop. Comfortable from interface to serverless backend, and studying networking through Cisco Networking Academy.',
      projectIds: ['p-nuvix', 'p-agriaid', 'p-voiddrop'],
      credentialIds: [],
      experienceIds: [],
      achievementIds: [],
      skillIds: ['s-lang', 's-fw', 's-cloud', 's-tools'],
      showQr: true,
    },
  ],

  settings: {
    credlyUsername: '',
    siteTitle: 'R J Salcedo: Developer',
    siteDescription: 'Portfolio of R J Salcedo, IT student at the University of Baguio building apps, AI tools and games.',
    showContactForm: true,
    githubUsers: ['rjsalcedo-dev'],
    showGithub: true,
    showRoleFit: true,
    showIntro: true,
    replyTime: 'within a day',
    timezone: 'Asia/Manila',
    city: 'Baguio',
  },
};

// Fills any missing keys from the defaults so older saved content never crashes newer code.
export function normalizeContent(raw) {
  const d = DEFAULT_CONTENT;
  const c = raw && typeof raw === 'object' ? raw : {};
  const arr = (v, f) => (Array.isArray(v) ? v : f);
  return {
    ...d,
    ...c,
    profile: { ...d.profile, ...(c.profile || {}), status: { ...d.profile.status, ...(c.profile?.status || {}) }, socials: arr(c.profile?.socials, d.profile.socials) },
    education: { ...d.education, ...(c.education || {}) },
    now: { ...d.now, ...(c.now || {}), items: arr(c.now?.items, d.now.items) },
    projects: arr(c.projects, d.projects).map((p) => ({ stack: [], highlights: [], gallery: [], metrics: [], links: {}, ...p, links: { ...(p.links || {}) } })),
    credentials: arr(c.credentials, d.credentials).map((x) => ({ skills: [], credentialId: '', file: '', ...x })),
    experience: arr(c.experience, d.experience).map((x) => ({ bullets: [], ...x })),
    achievements: arr(c.achievements, d.achievements),
    testimonials: arr(c.testimonials, d.testimonials),
    skills: arr(c.skills, d.skills).map((x) => ({ items: [], ...x })),
    resumes: arr(c.resumes, d.resumes).map((r) => ({ projectIds: [], credentialIds: [], experienceIds: [], achievementIds: [], skillIds: [], showQr: true, ...r })),
    settings: { ...d.settings, ...(c.settings || {}) },
  };
}
