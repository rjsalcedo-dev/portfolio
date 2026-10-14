// src/lib/evidence.js
// Connects skills to proof (projects, credentials, experience) and reads job descriptions
// for the role-fit checker. Everything runs in the browser; nothing is sent anywhere.

// Canonical skills with the words people use for them. Terms are matched as whole words.
const CANON = [
  ['JavaScript', ['javascript', 'js', 'es6', 'ecmascript']],
  ['TypeScript', ['typescript', 'ts']],
  ['Python', ['python', 'py']],
  ['Java', ['java']],
  ['C++', ['c++']],
  ['C#', ['c#', '.net']],
  ['PHP', ['php', 'laravel']],
  ['SQL', ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite']],
  ['HTML', ['html', 'html5']],
  ['CSS', ['css', 'css3', 'tailwind', 'tailwind css', 'sass', 'scss']],
  ['React', ['react', 'react.js', 'reactjs', 'react js']],
  ['React Native', ['react native', 'reactnative', 'rn', 'expo', 'expo router']],
  ['Vue', ['vue', 'vue.js', 'nuxt']],
  ['Angular', ['angular']],
  ['Node.js', ['node', 'node.js', 'nodejs', 'node js']],
  ['Express', ['express', 'express.js']],
  ['FastAPI', ['fastapi']],
  ['Django', ['django']],
  ['Flask', ['flask']],
  ['Firebase', ['firebase', 'firestore', 'firebase auth']],
  ['MongoDB', ['mongodb', 'mongoose']],
  ['REST APIs', ['rest api', 'rest apis', 'restful', 'api', 'apis', 'api integration', 'web services']],
  ['GraphQL', ['graphql']],
  ['Git', ['git', 'version control']],
  ['GitHub', ['github', 'github actions']],
  ['Docker', ['docker', 'docker compose', 'containers', 'containerization']],
  ['Kubernetes', ['kubernetes', 'k8s']],
  ['CI/CD', ['ci/cd', 'continuous integration', 'github actions', 'pipelines']],
  ['AWS', ['aws', 'amazon web services']],
  ['Azure', ['azure']],
  ['Google Cloud', ['gcp', 'google cloud']],
  ['Netlify', ['netlify', 'netlify functions']],
  ['Cloudflare', ['cloudflare', 'cloudflare r2']],
  ['Serverless', ['serverless', 'netlify functions', 'cloud functions', 'lambda']],
  ['Linux', ['linux', 'unix', 'bash', 'shell scripting', 'ubuntu']],
  ['Networking', ['networking', 'ccna', 'tcp/ip', 'routing', 'switching', 'vlan', 'vlans', 'subnetting', 'ospf', 'lan', 'wan', 'cisco']],
  ['Cybersecurity', ['cybersecurity', 'cyber security', 'network security', 'information security', 'infosec', 'ethical hacking', 'penetration testing', 'pentesting', 'soc']],
  ['AI / LLMs', ['ai', 'artificial intelligence', 'llm', 'llms', 'machine learning', 'ollama', 'llama', 'llava', 'genai', 'generative ai']],
  ['Mobile apps', ['mobile', 'ios', 'android', 'mobile development', 'mobile apps']],
  ['UI/UX', ['ui/ux', 'ui', 'ux', 'user interface', 'user experience', 'figma', 'responsive design']],
  ['PWA', ['pwa', 'progressive web app']],
  ['Electron', ['electron', 'desktop app']],
  ['Redux', ['redux', 'redux toolkit']],
  ['Testing', ['testing', 'unit testing', 'jest', 'vitest', 'qa']],
  ['Game development', ['game development', 'godot', 'gdscript', 'unity']],
  ['Web scraping', ['web scraping', 'scraping', 'beautifulsoup']],
  ['Agile', ['agile', 'scrum', 'kanban']],
  ['Data analytics', ['data analytics', 'data analysis', 'tableau', 'power bi', 'excel']],
  ['IT support', ['it support', 'troubleshooting', 'help desk', 'hardware', 'pc hardware']],
];

// Work that proves a skill without naming it: a React project is JavaScript work too.
const IMPLIED_BY = {
  JavaScript: ['react', 'react native', 'expo', 'node.js', 'express', 'vite', 'electron', 'redux toolkit'],
  'REST APIs': ['fastapi', 'express', 'netlify functions', 'tmdb api'],
  Git: ['github', 'github actions'],
  'Mobile apps': ['react native', 'expo', 'expo router'],
  Serverless: ['netlify functions'],
};

// Job titles a recruiter might type on their own ("frontend developer", "IT intern"). Each
// stands in for the skills that role usually asks for. Patterns run on normalized text.
const ROLES = [
  ['Front-end developer', /\bfront ?end\b|\bui (developer|engineer)\b|\bweb designer\b/, ['HTML', 'CSS', 'JavaScript', 'React', 'UI/UX', 'Git']],
  ['Back-end developer', /\bback ?end\b|\bapi (developer|engineer)\b|\bserver side\b/, ['Node.js', 'Python', 'REST APIs', 'SQL', 'Git', 'Serverless']],
  ['Full-stack developer', /\bfull ?stack\b/, ['JavaScript', 'React', 'Node.js', 'REST APIs', 'SQL', 'HTML', 'CSS', 'Git']],
  ['Web developer', /\bweb (developer|dev|development|programmer)\b|\bwebsites?\b/, ['HTML', 'CSS', 'JavaScript', 'React', 'REST APIs', 'Git']],
  ['Mobile developer', /\b(mobile|android|ios|app) (developer|dev|development|engineer)\b|\bmobile apps?\b/, ['Mobile apps', 'React Native', 'JavaScript', 'Firebase', 'REST APIs', 'Git']],
  ['Software developer', /\bsoftware (developer|engineer|engineering|development)\b|\b(programmer|swe|sde|developer|dev)\b/, ['JavaScript', 'Python', 'Git', 'REST APIs', 'SQL']],
  ['Network engineer', /\bnetwork(ing)? (engineer|admin|administrator|technician|specialist)\b|\bnoc\b/, ['Networking', 'Linux', 'Cybersecurity', 'IT support']],
  ['IT support', /\b(it|technical|tech|desktop) support\b|\bhelp ?desk\b|\bservice desk\b|\bit (specialist|technician|staff|assistant)\b/, ['IT support', 'Networking', 'Linux']],
  ['Security analyst', /\bsecurity (analyst|engineer|specialist)\b|\bsoc analyst\b/, ['Cybersecurity', 'Networking', 'Linux', 'Python']],
  ['DevOps / cloud', /\bdevops\b|\bcloud (engineer|developer)\b|\bsre\b|\bsite reliability\b/, ['Linux', 'Docker', 'CI/CD', 'Git', 'AWS', 'Serverless']],
  ['Data analyst', /\bdata (analyst|analytics|science|scientist|engineer)\b|\bbusiness intelligence\b/, ['SQL', 'Python', 'Data analytics']],
  ['AI / ML engineer', /\b(ai|ml|machine learning|llm) (engineer|developer|intern)\b|\bprompt engineer\b/, ['AI / LLMs', 'Python', 'REST APIs']],
  ['Game developer', /\bgame (developer|dev|programmer|designer|development)\b/, ['Game development', 'Python', 'Git']],
  ['UI/UX designer', /\b(ui|ux|ui\/ux|product) designer\b/, ['UI/UX', 'HTML', 'CSS']],
  ['QA tester', /\bquality assurance\b|\b(qa|test) (tester|engineer|analyst)\b|\btester\b/, ['Testing', 'Git']],
  // A student role with no field named: the general developer basics.
  ['IT intern', /\b(it|ict|computer science|cs) (intern|internship|ojt|trainee)\b|^ ?(intern|internship|ojt|trainee) ?$/, ['JavaScript', 'Python', 'Git', 'Networking', 'IT support']],
];

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// Whole-word match that also works for terms like "c++", "ci/cd" and ".net".
// "react" must not match inside "react native", which is a different skill.
const wordRe = (term) => new RegExp(`(^|[^a-z0-9+#.])${esc(term)}(?=$|[^a-z0-9+#])${term === 'react' ? '(?! native)' : ''}`, 'i');
const hasTerm = (text, term) => wordRe(term).test(text);

// The canonical entry for a skill name, or an ad-hoc one for anything not in the list.
export function skillEntry(name) {
  const n = norm(name);
  const found = CANON.find(([label, terms]) => norm(label) === n || terms.includes(n));
  return found ? { label: found[0], terms: [...new Set([norm(found[0]), ...found[1]])] } : { label: name, terms: [n] };
}

const projectText = (p) => norm([p.title, p.category, ...(p.stack || [])].join(' | '));
const credentialText = (c) => norm([c.title, ...(c.skills || [])].join(' | '));
const experienceText = (x) => norm([x.role, x.org, x.summary, ...(x.bullets || [])].join(' | '));

// Everything on the site that demonstrates a skill.
export function evidenceFor(name, content) {
  const entry = skillEntry(name);
  const terms = [...entry.terms, ...(IMPLIED_BY[entry.label] || [])];
  const match = (text) => terms.some((t) => hasTerm(text, t));
  return {
    projects: content.projects.filter((p) => !p.hidden && match(projectText(p))),
    credentials: content.credentials.filter((c) => !c.hidden && match(credentialText(c))),
    experience: content.experience.filter((x) => match(experienceText(x))),
  };
}

export const evidenceCount = (ev) => ev.projects.length + ev.credentials.length + ev.experience.length;

// Reads a job description and sorts each skill it mentions into proven / listed / gap.
export function analyzeRole(text, content) {
  // "Front-end", "full-stack" and "node-js" read the same as their spaced forms.
  const jd = ` ${norm(String(text || '').replace(/(\w)[-_](?=\w)/g, '$1 '))} `;
  const listed = new Set(content.skills.flatMap((g) => g.items).map((s) => skillEntry(s).label));
  const entries = new Map();
  for (const [label, terms] of CANON) {
    if ([norm(label), ...terms].some((t) => hasTerm(jd, t))) entries.set(label, skillEntry(label));
  }
  // Skills from the toolkit that aren't in the canonical list (e.g. "Godot").
  for (const s of content.skills.flatMap((g) => g.items)) {
    const e = skillEntry(s);
    if (!entries.has(e.label) && e.terms.some((t) => hasTerm(jd, t))) entries.set(e.label, e);
  }
  // Role titles bring in the skills that role usually needs, so a short query like
  // "frontend developer" still has something to check. "Developer" on its own only counts
  // when nothing more specific did: "Python developer" is about Python, not every language.
  // A full posting already lists its skills, so titles only fill in for short queries.
  const roles = entries.size < 3 ? ROLES.filter(([, re]) => re.test(jd)) : [];
  const picked = roles.filter(([name]) => name !== 'Software developer' || (roles.length === 1 && !entries.size));
  for (const [, , skills] of picked) {
    for (const label of skills) if (!entries.has(label)) entries.set(label, { ...skillEntry(label), implied: true });
  }
  const results = [...entries.values()].map((e) => {
    const ev = evidenceFor(e.label, content);
    const n = evidenceCount(ev);
    const status = n > 0 ? 'proven' : listed.has(e.label) ? 'listed' : 'gap';
    return { skill: e.label, status, evidence: ev, count: n, implied: !!e.implied };
  });
  const order = { proven: 0, listed: 1, gap: 2 };
  results.sort((a, b) => order[a.status] - order[b.status] || b.count - a.count);
  const total = results.length;
  const proven = results.filter((r) => r.status === 'proven').length;
  const listedN = results.filter((r) => r.status === 'listed').length;
  const score = total ? (proven + listedN * 0.5) / total : 0;

  // The résumé version whose projects best cover the matched skills.
  const provenProjects = new Set(results.flatMap((r) => r.evidence.projects.map((p) => p.id)));
  const best = content.resumes
    .map((r, i) => ({ r, i, overlap: r.projectIds.filter((id) => provenProjects.has(id)).length }))
    .sort((a, b) => b.overlap - a.overlap)[0];

  return {
    results, total, proven, listed: listedN, score,
    roles: picked.map(([name]) => name),
    verdict: !total ? 'none' : score >= 0.75 ? 'strong' : score >= 0.5 ? 'good' : 'partial',
    resumeHref: best ? (best.i === 0 ? '/resume' : `/resume/${best.r.slug || best.r.id}`) : '/resume',
  };
}

export const SAMPLE_JD = `Junior Full-Stack Developer (OJT / Internship)

We're looking for a student developer to join our product team. You will build features for our web and mobile apps and help maintain our cloud services.

Requirements:
- Experience with JavaScript and React or React Native
- Familiarity with Node.js and REST APIs
- Experience with Firebase or another NoSQL database such as MongoDB
- Git and GitHub for version control
- Basic understanding of networking and cybersecurity
- Bonus: Docker, TypeScript, CI/CD, UI/UX sense`;
