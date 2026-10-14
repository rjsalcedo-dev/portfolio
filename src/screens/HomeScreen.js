// src/screens/HomeScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useRouter, scrollToId } from '../lib/router';
import { api } from '../lib/api';
import { formatMonth, formatRange, progressBetween, toDate } from '../lib/format';
import { Button, Card, Chips, Container, Divider, Icon, Reveal, Section, Stack, StatusDot, T, Tag } from '../components/ui';
import { CredentialCard, Grid, ProgressBar, ProjectCard } from '../components/Cards';
import { Field } from '../components/Form';
import { CredentialSheet, ShareSheet } from '../components/Sheets';
import { SkillChip } from '../components/SkillSheet';
import { Activity, githubWorthShowing, LocalTime, RoleFit, useGithub } from './home/Extras';
import { downloadVCard } from '../lib/share';
import { track } from '../lib/track';
import { FONT, RADIUS, SPACE } from '../theme/tokens';
import { showAchievement } from '../data/defaults';

export default function HomeScreen() {
  const { content } = useContent();
  const { hash } = useRouter();
  const github = useGithub(content.settings.showGithub);

  // Arriving at /#work from another page: jump to the section once it has rendered.
  useEffect(() => {
    if (hash) setTimeout(() => scrollToId(hash, false), 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const GithubActivity = useMemo(() => function GithubActivity({ alt }) { return <Activity alt={alt} data={github} />; }, [github]);

  return (
    <View>
      <Hero />
      {/* Sections alternate background tones, whichever ones are shown. */}
      {[
        content.now.items.length ? ['now', Now] : null,
        ['work', Work],
        githubWorthShowing(github) ? ['activity', GithubActivity] : null,
        content.credentials.some((c) => !c.hidden) ? ['credentials', Credentials] : null,
        content.testimonials.some((t) => !t.hidden) ? ['testimonials', Testimonials] : null,
        ['about', About],
        content.settings.showRoleFit ? ['fit', RoleFit] : null,
        ['contact', Contact],
      ].filter(Boolean).map(([key, S], i) => <S key={key} alt={i % 2 === 0} />)}
    </View>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const { colors } = useTheme();
  const { bp, isSm } = useBreakpoint();
  const { content } = useContent();
  const { profile, projects, credentials, education } = content;

  const monthsLeft = useMemo(() => {
    const end = toDate(education.end);
    if (!end) return null;
    const now = new Date();
    return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  }, [education.end]);

  const stats = [
    { value: projects.length, label: projects.length === 1 ? 'Project shipped' : 'Projects built' },
    credentials.length ? { value: credentials.length, label: 'Verified credentials' } : null,
    monthsLeft != null && monthsLeft > 0 ? { value: monthsLeft, label: `Months to graduation` } : { value: formatMonth(education.end).split(' ')[1] || '—', label: 'Graduated' },
  ].filter(Boolean);

  return (
    <View style={{ backgroundColor: colors.page, paddingTop: isSm ? SPACE[10] : bp === 'md' ? SPACE[12] : SPACE[14], paddingBottom: isSm ? SPACE[10] : SPACE[12] }}>
      <Container>
        <Reveal>
          {profile.status?.label ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, height: 30, borderRadius: 999, backgroundColor: colors.surfaceMuted, marginBottom: SPACE[7] }}>
              <StatusDot color={profile.status.open ? colors.success : colors.text3} pulse={profile.status.open} />
              <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '500', color: colors.text }}>{profile.status.label}</Text>
            </View>
          ) : null}
          {/* Read order: photo and role → name (the largest type on the page) → headline as a tagline → intro. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: isSm ? SPACE[5] : SPACE[6] }}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={{ width: isSm ? 56 : 68, height: isSm ? 56 : 68, borderRadius: 999, backgroundColor: colors.surfaceMuted, boxShadow: `0 0 0 1px ${colors.border}` }} accessibilityLabel={profile.name} />
            ) : null}
            <T variant="eyebrow" color="secondary" style={{ flexShrink: 1 }}>{profile.role}</T>
          </View>
          <T variant="hero" accessibilityRole="header" aria-level={1} style={{ fontSize: isSm ? 52 : bp === 'md' ? 76 : 96, lineHeight: isSm ? 54 : bp === 'md' ? 78 : 96, letterSpacing: isSm ? -1.4 : bp === 'md' ? -2.2 : -2.8, fontWeight: '800' }}>{profile.name}</T>
          <T variant="h2" weight="500" style={{ marginTop: isSm ? SPACE[4] : SPACE[5], maxWidth: 760 }}>{profile.headline}</T>
          <T variant="lead" color="secondary" style={{ marginTop: SPACE[5], maxWidth: 680 }}>{profile.intro}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3], marginTop: SPACE[8] }}>
            <Button title="View my work" href="/#work" size={isSm ? 'md' : 'lg'} />
            <Button title="Résumé" href="/resume" variant="secondary" size={isSm ? 'md' : 'lg'} iconRight="arrow-up-right" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACE[5], marginTop: SPACE[5] }}>
            <Button variant="link" size="sm" title="Recruiter? Read the 30-second brief" iconRight="chevron-right" href="/brief" />
            {content.settings.showRoleFit ? <Button variant="link" size="sm" title="Check my fit for your role" iconRight="chevron-right" href="/#fit" /> : null}
          </View>
        </Reveal>

        <Reveal delay={150}>
          <View style={{ flexDirection: 'row', marginTop: isSm ? SPACE[10] : SPACE[12], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: SPACE[6], gap: isSm ? SPACE[5] : SPACE[10] }}>
            {stats.map((s) => (
              <View key={s.label} style={{ flex: isSm ? 1 : undefined }}>
                <T variant="title" style={{ fontVariant: ['tabular-nums'] }}>{s.value}</T>
                <T variant="caption" color="secondary" style={{ marginTop: 2 }}>{s.label}</T>
              </View>
            ))}
          </View>
        </Reveal>
      </Container>
    </View>
  );
}

// ── Now ──────────────────────────────────────────────────────────────────────────────
function Now({ alt }) {
  const { bp } = useBreakpoint();
  const { content } = useContent();
  const { now } = content;
  return (
    <Section id="now" alt={alt} eyebrow="Now" title="What I'm focused on." action={now.updated ? <Tag icon="clock">Updated {formatMonth(now.updated)}</Tag> : null}>
      <Grid columns={bp === 'sm' ? 1 : Math.min(3, now.items.length)}>
        {now.items.map((item, i) => (
          <Reveal key={`${item.label}-${i}`} delay={i * 80} style={{ flex: 1 }}>
            <Card style={{ flex: 1 }}>
              <T variant="label" color="accent" style={{ marginBottom: SPACE[3] }}>{item.label}</T>
              <T variant="h3" weight="500">{item.text}</T>
            </Card>
          </Reveal>
        ))}
      </Grid>
    </Section>
  );
}

// ── Work ─────────────────────────────────────────────────────────────────────────────
function Work({ alt }) {
  const { bp } = useBreakpoint();
  const { content } = useContent();
  const projects = content.projects.filter((p) => !p.hidden);
  const categories = useMemo(() => ['All', ...new Set(projects.map((p) => p.category).filter(Boolean))], [projects]);
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? projects : projects.filter((p) => p.category === filter);
  const featured = filter === 'All' ? shown.filter((p) => p.featured) : [];
  const rest = shown.filter((p) => !featured.includes(p));

  return (
    <Section id="work" alt={alt} eyebrow="Work" title="Selected projects." subtitle="Apps, tools and games I've designed and built, from first sketch to deployment.">
      {categories.length > 2 ? (
        <Reveal style={{ marginBottom: SPACE[7] }}><Chips options={categories} value={filter} onChange={setFilter} /></Reveal>
      ) : null}
      {featured.length ? (
        <Grid columns={bp === 'sm' ? 1 : Math.min(2, featured.length)} style={{ marginBottom: SPACE[5] }}>
          {featured.map((p, i) => <Reveal key={p.id} delay={i * 80} style={{ flex: 1 }}><ProjectCard project={p} large={bp !== 'sm'} /></Reveal>)}
        </Grid>
      ) : null}
      <Grid columns={bp === 'sm' ? 1 : bp === 'md' ? 2 : 3}>
        {rest.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 80} style={{ flex: 1 }}><ProjectCard project={p} /></Reveal>)}
      </Grid>
    </Section>
  );
}

// ── Credentials ──────────────────────────────────────────────────────────────────────
function Credentials({ alt }) {
  const { bp } = useBreakpoint();
  const { content } = useContent();
  const all = useMemo(() => [...content.credentials].filter((c) => !c.hidden).sort((a, b) => (b.featured - a.featured) || String(b.issued || '').localeCompare(String(a.issued || ''))), [content.credentials]);
  const issuers = useMemo(() => ['All', ...new Set(all.map((c) => c.issuer).filter(Boolean))], [all]);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(null);
  const shown = filter === 'All' ? all : all.filter((c) => c.issuer === filter);
  const limit = bp === 'sm' ? 6 : 8;
  const visible = expanded ? shown : shown.slice(0, limit);
  const verified = all.filter((c) => c.verifyUrl).length;

  return (
    <Section
      id="credentials"
      alt={alt}
      eyebrow="Credentials"
      title={verified ? 'Certified and verified.' : 'Certifications.'}
      subtitle={`${all.length} certificates and badges${issuers.length > 2 ? ` from ${issuers.length - 1} issuers` : ''}. ${verified ? 'Tap any verified badge to check it at the source.' : ''}`}
    >
      {issuers.length > 2 ? <Reveal style={{ marginBottom: SPACE[7] }}><Chips options={issuers} value={filter} onChange={(v) => { setFilter(v); setExpanded(false); }} /></Reveal> : null}
      <Grid columns={bp === 'sm' ? 2 : bp === 'md' ? 3 : 4} gap={bp === 'sm' ? 12 : 20}>
        {visible.map((c, i) => <Reveal key={c.id} delay={(i % 4) * 60} style={{ flex: 1 }}><CredentialCard item={c} onPress={() => { setOpen(c); track('credential', { id: c.id }); }} /></Reveal>)}
      </Grid>
      {shown.length > limit ? (
        <View style={{ alignItems: 'center', marginTop: SPACE[8] }}>
          <Button variant="secondary" title={expanded ? 'Show less' : `Show all ${shown.length}`} onPress={() => setExpanded((e) => !e)} align="center" />
        </View>
      ) : null}
      <CredentialSheet item={open} onClose={() => setOpen(null)} />
    </Section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────────────
function Testimonials({ alt }) {
  const { colors } = useTheme();
  const { bp } = useBreakpoint();
  const { content } = useContent();
  const items = content.testimonials.filter((t) => !t.hidden);
  return (
    <Section id="testimonials" alt={alt} eyebrow="Kind words" title="What people say.">
      <Grid columns={bp === 'sm' ? 1 : Math.min(bp === 'md' ? 2 : 3, items.length)}>
        {items.map((t, i) => (
          <Reveal key={t.id} delay={i * 80} style={{ flex: 1 }}>
            <Card style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT, fontSize: 48, lineHeight: 40, fontWeight: '700', color: colors.accentText, marginBottom: SPACE[2] }} aria-hidden>“</Text>
              <T variant="body" style={{ flex: 1 }}>{t.quote}</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: SPACE[6] }}>
                {t.photo ? <Image source={{ uri: t.photo }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted }} accessibilityLabel={t.name} /> : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.text2 }}>{(t.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <T variant="small" weight="600">{t.name}</T>
                  <T variant="caption" color="secondary">{[t.role, t.org].filter(Boolean).join(', ')}</T>
                </View>
                {t.link ? <Button variant="link" size="sm" title="" iconRight="arrow-up-right" href={t.link} accessibilityLabel={`${t.name} profile`} align="center" /> : null}
              </View>
            </Card>
          </Reveal>
        ))}
      </Grid>
    </Section>
  );
}

// ── About: story, education progress, experience, honors, skills ─────────────────────
const ACHIEVEMENT_ICONS = { award: 'award', leadership: 'users', event: 'calendar', competition: 'zap', publication: 'book', volunteer: 'heart' };

function About({ alt }) {
  const { colors } = useTheme();
  const { bp, isSm } = useBreakpoint();
  const { content } = useContent();
  const { profile, education, experience, skills } = content;
  const achievements = content.achievements.filter(showAchievement);
  const progress = progressBetween(education.start, education.end);
  const done = progress >= 1;
  const startYear = toDate(education.start)?.getFullYear();
  const year = startYear ? Math.min(4, new Date().getFullYear() - startYear + (new Date().getMonth() >= 7 ? 1 : 0)) : null;

  return (
    <Section id="about" alt={alt} eyebrow="About" title="A little about me.">
      <View style={{ flexDirection: bp === 'lg' ? 'row' : 'column', gap: bp === 'lg' ? SPACE[12] : SPACE[9] }}>
        <Reveal style={{ flex: 1.2 }}>
          {String(profile.about || '').split(/\n{2,}/).filter(Boolean).map((p, i) => (
            <T key={i} variant="lead" style={{ marginBottom: SPACE[5] }}>{p}</T>
          ))}
          {profile.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACE[2] }}>
              <Icon name="map-pin" size={15} color="secondary" />
              <T variant="small" color="secondary">{profile.location}</T>
            </View>
          ) : null}
        </Reveal>

        <View style={{ flex: 1, gap: SPACE[5] }}>
          <Reveal delay={80}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="book-open" size={20} color="accent" />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="h3">{education.school}</T>
                  <T variant="small" color="secondary">{education.program}</T>
                </View>
              </View>
              <View style={{ marginTop: SPACE[6] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <T variant="caption" weight="600">{done ? 'Graduated' : year ? `Year ${year} of 4` : 'In progress'}</T>
                  <T variant="caption" color="secondary">{Math.round(progress * 100)}% · {done ? formatMonth(education.end) : `Class of ${toDate(education.end)?.getFullYear() || ''}`}</T>
                </View>
                <ProgressBar value={progress} />
              </View>
              {education.notes ? <T variant="small" color="secondary" style={{ marginTop: SPACE[5] }}>{education.notes}</T> : null}
            </Card>
          </Reveal>

          {experience.length ? (
            <Reveal delay={140}>
              <Card>
                <T variant="label" color="secondary" style={{ marginBottom: SPACE[4] }}>Experience</T>
                {experience.map((x, i) => (
                  <View key={x.id} style={{ flexDirection: 'row', gap: 14, paddingBottom: i < experience.length - 1 ? SPACE[5] : 0 }}>
                    <View style={{ alignItems: 'center', width: 10, paddingTop: 7 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === 0 ? colors.accent : colors.borderStrong }} />
                      {i < experience.length - 1 ? <View style={{ width: 1, flex: 1, backgroundColor: colors.border, marginTop: 6 }} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <T variant="body" weight="600">{x.role}</T>
                      <T variant="small" color="secondary">{[x.org, formatRange(x.start, x.end)].filter(Boolean).join(' · ')}</T>
                      {x.summary ? <T variant="small" style={{ marginTop: 6 }}>{x.summary}</T> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </Reveal>
          ) : null}

          {achievements.length ? (
            <Reveal delay={180}>
              <Card>
                <T variant="label" color="secondary" style={{ marginBottom: SPACE[4] }}>Honors & activities</T>
                {achievements.map((a, i) => (
                  <View key={a.id} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingTop: i ? SPACE[4] : 0, marginTop: i ? SPACE[4] : 0, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={ACHIEVEMENT_ICONS[a.type] || 'star'} size={16} color="secondary" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T variant="body" weight="600">{a.title}</T>
                      <T variant="small" color="secondary">{[a.org, formatMonth(a.date)].filter(Boolean).join(' · ')}</T>
                      {a.description ? <T variant="small" style={{ marginTop: 4 }}>{a.description}</T> : null}
                    </View>
                    {a.link ? <Button variant="link" size="sm" title="" iconRight="arrow-up-right" href={a.link} accessibilityLabel={`${a.title} link`} align="center" /> : null}
                  </View>
                ))}
              </Card>
            </Reveal>
          ) : null}
        </View>
      </View>

      {skills.length ? (
        <Reveal delay={100}>
          <Divider style={{ marginVertical: isSm ? SPACE[9] : SPACE[11] }} />
          <T variant="h2" style={{ marginBottom: SPACE[7] }}>Toolkit</T>
          <Grid columns={bp === 'sm' ? 1 : bp === 'md' ? 2 : 4} gap={isSm ? 24 : 32}>
            {skills.map((g) => (
              <View key={g.id}>
                <T variant="label" color="secondary" style={{ marginBottom: SPACE[3] }}>{g.group}</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {g.items.map((s) => <SkillChip key={s} name={s} />)}
                </View>
              </View>
            ))}
          </Grid>
        </Reveal>
      ) : null}
    </Section>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────────────
function Contact({ alt }) {
  const { colors } = useTheme();
  const { bp } = useBreakpoint();
  const { content } = useContent();
  const { profile, settings } = content;
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [state, setState] = useState({ status: 'idle', error: '' });
  const [errors, setErrors] = useState({});
  const [share, setShare] = useState(false);

  // The role-fit checker can pre-write a message here.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const onPrefill = (e) => { setForm((f) => ({ ...f, message: e.detail })); setState({ status: 'idle', error: '' }); };
    window.addEventListener('rj:prefill', onPrefill);
    return () => window.removeEventListener('rj:prefill', onPrefill);
  }, []);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please add your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Please enter a valid email.';
    if (form.message.trim().length < 10) e.message = 'A few more words, please.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setState({ status: 'sending', error: '' });
    try {
      await api.sendMessage(form);
      setState({ status: 'sent', error: '' });
      track('contact');
      setForm({ name: '', email: '', message: '', website: '' });
    } catch (err) {
      setState({ status: 'idle', error: err.message || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <Section id="contact" alt={alt} eyebrow="Contact" title="Let's work together." subtitle="Internships, OJT, freelance builds or just a hello. I read every message.">
      <LocalTime />
      <View style={{ flexDirection: bp === 'lg' ? 'row' : 'column', gap: SPACE[9] }}>
        <Reveal style={{ flex: 1, gap: SPACE[4] }}>
          {profile.email ? (
            <Card href={`mailto:${profile.email}`}>
              <Stack row gap={4} align="center">
                <Icon name="mail" size={22} color="accent" />
                <View style={{ flex: 1 }}>
                  <T variant="caption" color="secondary">Email</T>
                  <T variant="body" weight="500" numberOfLines={1}>{profile.email}</T>
                </View>
                <Icon name="arrow-up-right" color="tertiary" />
              </Stack>
            </Card>
          ) : null}
          {profile.socials.map((s) => (
            <Card key={s.url} href={s.url}>
              <Stack row gap={4} align="center">
                <Icon name={s.icon || 'link'} size={22} color="accent" />
                <View style={{ flex: 1 }}>
                  <T variant="caption" color="secondary">{s.label}</T>
                  <T variant="body" weight="500" numberOfLines={1}>{s.url.replace(/^https?:\/\/(www\.)?/, '')}</T>
                </View>
                <Icon name="arrow-up-right" color="tertiary" />
              </Stack>
            </Card>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3], marginTop: SPACE[2] }}>
            <Button title="Save contact" icon="user-plus" variant="secondary" onPress={() => { downloadVCard(profile); track('vcard'); }} />
            <Button title="Share" icon="share" variant="secondary" onPress={() => setShare(true)} />
          </View>
          <ShareSheet visible={share} onClose={() => setShare(false)} />
        </Reveal>

        {settings.showContactForm ? (
          <Reveal delay={100} style={{ flex: 1.3 }}>
            <Card>
              {state.status === 'sent' ? (
                <View style={{ alignItems: 'center', paddingVertical: SPACE[9], gap: SPACE[3] }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={28} color="success" />
                  </View>
                  <T variant="h3">Message sent.</T>
                  <T variant="body" color="secondary" align="center">Thanks for reaching out. I'll get back to you soon.</T>
                  <Button variant="link" title="Send another" onPress={() => setState({ status: 'idle', error: '' })} />
                </View>
              ) : (
                <View style={{ gap: SPACE[5] }}>
                  <View style={{ flexDirection: bp === 'sm' ? 'column' : 'row', gap: SPACE[5] }}>
                    <Field style={{ flex: 1 }} label="Name" value={form.name} onChange={set('name')} autoComplete="name" error={errors.name} />
                    <Field style={{ flex: 1 }} label="Email" value={form.email} onChange={set('email')} autoComplete="email" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                  </View>
                  <Field label="Message" value={form.message} onChange={set('message')} multiline rows={5} error={errors.message} />
                  {/* Honeypot: hidden from people, filled in by bots. */}
                  <View style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden>
                    <Field label="Website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" />
                  </View>
                  {state.error ? <T variant="small" style={{ color: colors.danger }}>{state.error}</T> : null}
                  <Button title="Send message" onPress={submit} loading={state.status === 'sending'} size="lg" icon={state.status === 'sending' ? 'loader' : 'send'} />
                </View>
              )}
            </Card>
          </Reveal>
        ) : null}
      </View>
    </Section>
  );
}
