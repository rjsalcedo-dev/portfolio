// src/screens/ResumeScreen.js
// A printable résumé generated from the same content as the site. Each résumé "version"
// (set up in /admin → Résumé) picks which projects, credentials and skills to include, so
// a networking role and a dev role can each get a tailored one-pager at its own link.
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useRouter } from '../lib/router';
import { formatMonth, formatRange, shortUrl, toDate } from '../lib/format';
import { Button, Container, T } from '../components/ui';
import { Segmented } from '../components/Form';
import { FONT, SPACE } from '../theme/tokens';
import { qrDataUrl, resumeText, siteUrl } from '../lib/share';
import { track } from '../lib/track';

const isWeb = Platform.OS === 'web';
// The paper is always black on white, whatever the site theme, so it prints exactly as seen.
const INK = '#1d1d1f';
const INK2 = '#55555a';
const RULE = '#d2d2d7';

const R = ({ size = 12.5, weight = '400', color = INK, style, children, ...rest }) => (
  <Text {...rest} style={[{ fontFamily: FONT, fontSize: size, lineHeight: Math.round(size * 1.45), fontWeight: weight, color, letterSpacing: size > 20 ? -0.6 : -0.1 }, style]}>{children}</Text>
);

function Block({ title, children }) {
  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <R size={10.5} weight="700" color={INK} style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>{title}</R>
        <View style={{ flex: 1, height: 1, backgroundColor: RULE }} />
      </View>
      {children}
    </View>
  );
}

function Entry({ title, meta, sub, children }) {
  return (
    <View dataSet={{ keep: true }} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <R weight="600" style={{ flexShrink: 1 }}>{title}</R>
        {meta ? <R size={11.5} color={INK2}>{meta}</R> : null}
      </View>
      {sub ? <R size={11.5} color={INK2}>{sub}</R> : null}
      {children}
    </View>
  );
}

const Bullets = ({ items }) => items.filter(Boolean).map((b, i) => (
  <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: 3, paddingLeft: 2 }}>
    <R color={INK2}>•</R>
    <R style={{ flex: 1 }}>{b}</R>
  </View>
));

export default function ResumeScreen({ version }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const { content } = useContent();
  const { navigate } = useRouter();
  const [copied, setCopied] = useState(null);
  const { profile, education, resumes } = content;
  const resume = resumes.find((r) => (r.slug || r.id) === version) || resumes[0];

  useEffect(() => {
    if (isWeb) document.title = `${profile.name} · Résumé${resume && resumes.length > 1 ? ` (${resume.name})` : ''}`;
  }, [profile.name, resume, resumes.length]);

  useEffect(() => { if (resume) track('resume', { id: resume.id }); }, [resume?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Printing from the browser menu (Ctrl+P) counts as a download too.
  useEffect(() => {
    if (!isWeb || !resume) return undefined;
    const onPrint = () => track('download', { id: resume.id });
    window.addEventListener('beforeprint', onPrint);
    return () => window.removeEventListener('beforeprint', onPrint);
  }, [resume?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!resume) return null;
  const pick = (list, ids) => (ids || []).map((id) => list.find((x) => x.id === id)).filter(Boolean);
  const projects = pick(content.projects, resume.projectIds);
  const credentials = pick(content.credentials, resume.credentialIds);
  const experience = pick(content.experience, resume.experienceIds);
  const achievements = pick(content.achievements, resume.achievementIds);
  const skills = pick(content.skills, resume.skillIds);
  const site = isWeb ? window.location.host : '';
  const contact = [profile.location, profile.email, site, ...profile.socials.map((s) => shortUrl(s.url))].filter(Boolean);

  const flash = (what) => { setCopied(what); setTimeout(() => setCopied(null), 1800); };
  const copyLink = () => { navigator.clipboard?.writeText(window.location.href); flash('link'); };
  const copyText = () => { navigator.clipboard?.writeText(resumeText(content, resume)); flash('text'); track('resume-text', { id: resume.id }); };

  return (
    <View dataSet={{ printflat: true }} style={{ backgroundColor: colors.pageAlt, paddingBottom: isSm ? SPACE[8] : SPACE[12] }}>
      <Container width={794} dataSet={{ noprint: true }} style={{ paddingTop: isSm ? SPACE[6] : SPACE[9], paddingBottom: SPACE[6] }}>
        <T variant="title">Résumé</T>
        <T variant="body" color="secondary" style={{ marginTop: SPACE[2] }}>Generated live from this portfolio, so it's always current.</T>
        <View style={{ flexDirection: isSm ? 'column' : 'row', alignItems: isSm ? 'flex-start' : 'center', justifyContent: 'space-between', gap: SPACE[4], marginTop: SPACE[6] }}>
          {resumes.length > 1 ? (
            <Segmented options={resumes.map((r) => ({ value: r.id, label: r.name }))} value={resume.id} onChange={(id) => { const r = resumes.find((x) => x.id === id); navigate(id === resumes[0].id ? '/resume' : `/resume/${r.slug || r.id}`, { replace: true }); }} />
          ) : <View />}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] }}>
            <Button title={copied === 'link' ? 'Copied' : 'Copy link'} icon={copied === 'link' ? 'check' : 'link'} variant="secondary" size="sm" onPress={copyLink} />
            <Button title={copied === 'text' ? 'Copied' : 'Copy as text'} icon={copied === 'text' ? 'check' : 'align-left'} variant="secondary" size="sm" onPress={copyText} accessibilityLabel="Copy as plain text for job application forms" />
            <Button title="Download PDF" icon="download" size="sm" onPress={() => window.print()} />
          </View>
        </View>
      </Container>

      <View dataSet={{ printflat: true }} style={{ paddingHorizontal: isSm ? 12 : 20 }}>
        <View
          dataSet={{ paper: true }}
          style={{ width: '100%', maxWidth: 794, alignSelf: 'center', backgroundColor: '#fff', borderRadius: isSm ? 12 : 4, paddingHorizontal: isSm ? 22 : 56, paddingVertical: isSm ? 26 : 52, boxShadow: '0 4px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}
        >
          <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <R size={isSm ? 26 : 30} weight="700">{profile.name}</R>
              <R size={14} weight="500" color={INK2} style={{ marginTop: 2 }}>{resume.headline || profile.role}</R>
              <R size={11.5} color={INK2} style={{ marginTop: 8 }}>{contact.join('   ·   ')}</R>
            </View>
            {/* On paper, the QR code takes the reader straight to the live portfolio. */}
            {resume.showQr && isWeb && !isSm ? (
              <View style={{ alignItems: 'center' }}>
                {/* A real <img>: RN Web draws Image as a CSS background, which browsers skip when printing. */}
                {React.createElement('img', { src: qrDataUrl(siteUrl('/')), width: 72, height: 72, alt: 'QR code to portfolio' })}
                <R size={8.5} color={INK2} style={{ marginTop: 2 }}>Portfolio</R>
              </View>
            ) : null}
          </View>

          {resume.summary ? <Block title="Summary"><R>{resume.summary}</R></Block> : null}

          <Block title="Education">
            <Entry title={education.school} meta={`${formatRange(education.start, education.end)}${toDate(education.end) > new Date() ? ' (expected)' : ''}`} sub={[education.program, education.location].filter(Boolean).join(' · ')}>
              {education.notes ? <R style={{ marginTop: 3 }}>{education.notes}</R> : null}
            </Entry>
          </Block>

          {experience.length ? (
            <Block title="Experience">
              {experience.map((x) => (
                <Entry key={x.id} title={`${x.role}${x.org ? `, ${x.org}` : ''}`} meta={formatRange(x.start, x.end)} sub={x.location}>
                  {x.summary ? <R style={{ marginTop: 3 }}>{x.summary}</R> : null}
                  <Bullets items={x.bullets || []} />
                </Entry>
              ))}
            </Block>
          ) : null}

          {projects.length ? (
            <Block title="Projects">
              {projects.map((p) => (
                <Entry key={p.id} title={p.title} meta={p.year} sub={[p.role, (p.stack || []).slice(0, 5).join(', ')].filter(Boolean).join(' · ')}>
                  <R style={{ marginTop: 3 }}>{p.summary || p.tagline}</R>
                  <Bullets items={(p.highlights || []).slice(0, 3)} />
                  {p.links?.live || p.links?.repo ? <R size={11} color={INK2} style={{ marginTop: 3 }}>{shortUrl(p.links.live || p.links.repo)}</R> : null}
                </Entry>
              ))}
            </Block>
          ) : null}

          {achievements.length ? (
            <Block title="Honors & Activities">
              {achievements.map((a) => (
                <Entry key={a.id} title={`${a.title}${a.org ? `, ${a.org}` : ''}`} meta={formatMonth(a.date)}>
                  {a.description ? <R style={{ marginTop: 2 }}>{a.description}</R> : null}
                </Entry>
              ))}
            </Block>
          ) : null}

          {credentials.length ? (
            <Block title="Certifications">
              {credentials.map((c) => (
                <View key={c.id} dataSet={{ keep: true }} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                  <R style={{ flex: 1 }}><R weight="600">{c.title}</R>{c.issuer ? <R color={INK2}>{`  ·  ${c.issuer}`}</R> : null}</R>
                  <R size={11.5} color={INK2}>{formatMonth(c.issued)}</R>
                </View>
              ))}
            </Block>
          ) : null}

          {skills.length ? (
            <Block title="Skills">
              {skills.map((g) => (
                <R key={g.id} style={{ marginBottom: 3 }}><R weight="600">{g.group}: </R>{g.items.join(', ')}</R>
              ))}
            </Block>
          ) : null}
        </View>
      </View>
    </View>
  );
}
