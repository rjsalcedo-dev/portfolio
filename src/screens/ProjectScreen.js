// src/screens/ProjectScreen.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { hostOf, slugify } from '../lib/format';
import { scrollToId } from '../lib/router';
import { api } from '../lib/api';
import { Button, Card, Container, Divider, Icon, Reveal, T, Tag } from '../components/ui';
import { Grid, ProjectCard, ProjectCover } from '../components/Cards';
import { FONT, RADIUS, SPACE } from '../theme/tokens';
import NotFoundScreen from './NotFoundScreen';
import { Lightbox } from '../components/Modal';
import { SkillChip } from '../components/SkillSheet';

export default function ProjectScreen({ slug }) {
  const { colors } = useTheme();
  const { bp, isSm } = useBreakpoint();
  const { content } = useContent();
  const projects = content.projects.filter((p) => !p.hidden);
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web' && project) document.title = `${project.title} · ${content.profile.name}`;
  }, [project, content.profile.name]);

  if (!project) return <NotFoundScreen />;
  const next = projects[(index + 1) % projects.length];
  const sections = parseBody(project.body || project.summary);
  const words = String(project.body || project.summary || '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const outline = [
    ...sections.filter((x) => x.heading).map((x) => [x.id, x.heading]),
    ...(project.highlights?.length ? [['sec-highlights', 'Highlights']] : []),
    ...(project.gallery?.length ? [['sec-gallery', 'Gallery']] : []),
  ];
  const meta = [
    ['Role', project.role],
    ['Year', project.year],
    ['Status', project.status],
    ['Category', project.category],
    ['Reading time', `${minutes} min`],
  ].filter(([, v]) => v);

  return (
    <View style={{ backgroundColor: colors.page }}>
      <Container width={980} style={{ paddingTop: isSm ? SPACE[7] : SPACE[10] }}>
        <Reveal>
          <Button variant="link" title="All work" href="/#work" icon="chevron-left" size="sm" />
          <T variant="eyebrow" color="accent" style={{ marginTop: SPACE[7], marginBottom: SPACE[2] }}>{project.category}</T>
          <T variant="hero" accessibilityRole="header" aria-level={1}>{project.title}</T>
          <T variant="lead" color="secondary" style={{ marginTop: SPACE[4], maxWidth: 720 }}>{project.tagline}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3], marginTop: SPACE[7] }}>
            {project.links?.live ? <Button title={`Visit ${hostOf(project.links.live)}`} href={project.links.live} iconRight="arrow-up-right" align="center" /> : null}
            {project.links?.video ? <Button title="Watch demo" href={project.links.video} variant="secondary" icon="play-circle" align="center" /> : null}
            {project.links?.repo ? <Button title="Source code" href={project.links.repo} variant="secondary" icon="github" align="center" /> : null}
            {project.links?.live ? <DemoStatus url={project.links.live} /> : null}
          </View>
        </Reveal>
      </Container>

      <Container width={1120} style={{ marginTop: isSm ? SPACE[8] : SPACE[10] }}>
        <Reveal delay={100}>
          <View style={{ borderRadius: isSm ? RADIUS.lg : RADIUS.xl, overflow: 'hidden' }}>
            <ProjectCover project={project} ratio={isSm ? 4 / 3 : 16 / 8} large />
          </View>
        </Reveal>
        {project.metrics?.length ? (
          <Reveal delay={140}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: isSm ? SPACE[7] : SPACE[9], maxWidth: 980, alignSelf: 'center', width: '100%' }}>
              {project.metrics.map((m, i) => (
                <View key={i} style={{ flexGrow: 1, flexBasis: isSm ? '50%' : 0, paddingVertical: SPACE[3], paddingHorizontal: isSm ? 0 : SPACE[6], borderLeftWidth: !isSm && i ? 1 : 0, borderLeftColor: colors.border, marginBottom: isSm ? SPACE[4] : 0 }}>
                  <T variant="title" style={{ fontVariant: ['tabular-nums'] }}>{m.value}</T>
                  <T variant="small" color="secondary" style={{ marginTop: 2 }}>{m.label}</T>
                </View>
              ))}
            </View>
          </Reveal>
        ) : null}
      </Container>

      <Container width={980} style={{ paddingVertical: isSm ? SPACE[10] : SPACE[12] }}>
        <View style={{ flexDirection: bp === 'lg' ? 'row' : 'column', gap: bp === 'lg' ? SPACE[12] : SPACE[9] }}>
          <View style={{ width: bp === 'lg' ? 260 : '100%', ...(bp === 'lg' ? { position: 'sticky', top: 84, alignSelf: 'flex-start' } : null) }}>
            <Reveal>
              <View style={{ flexDirection: bp === 'lg' ? 'column' : 'row', flexWrap: 'wrap', gap: SPACE[6] }}>
                {meta.map(([k, v]) => (
                  <View key={k} style={{ minWidth: isSm ? '40%' : 140, maxWidth: '100%', flexShrink: 1 }}>
                    <T variant="caption" color="secondary">{k}</T>
                    <T variant="body" weight="500" style={{ marginTop: 2 }}>{v}</T>
                  </View>
                ))}
              </View>
              {project.stack?.length ? (
                <View style={{ marginTop: SPACE[7] }}>
                  <T variant="caption" color="secondary" style={{ marginBottom: SPACE[2] }}>Built with</T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {project.stack.map((s) => <SkillChip key={s} name={s} size="sm" />)}
                  </View>
                </View>
              ) : null}
              {bp === 'lg' && outline.length > 2 ? (
                <View style={{ marginTop: SPACE[7] }}>
                  <T variant="caption" color="secondary" style={{ marginBottom: SPACE[2] }}>On this page</T>
                  {outline.map(([id, label]) => (
                    <Pressable key={id} onPress={() => scrollToId(id)} style={({ hovered }) => ({ paddingVertical: 5, cursor: 'pointer', opacity: hovered ? 1 : 0.7 })}>
                      <T variant="small">{label}</T>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Reveal>
          </View>

          <View style={{ flex: 1 }}>
            <Reveal delay={80}>
              {!sections[0]?.heading ? <T variant="h2" style={{ marginBottom: SPACE[5] }}>Overview</T> : null}
              {sections.map((sec, i) => (
                <View key={i} nativeID={sec.id} style={{ marginTop: sec.heading && i ? SPACE[7] : 0 }}>
                  {sec.heading ? <T variant="h2" style={{ marginBottom: SPACE[4] }}>{sec.heading}</T> : null}
                  {sec.paragraphs.map((t, j) => <T key={j} variant="lead" style={{ marginBottom: SPACE[5] }}>{t}</T>)}
                </View>
              ))}
            </Reveal>
            {project.highlights?.length ? (
              <Reveal delay={120}>
                <T variant="h2" nativeID="sec-highlights" style={{ marginTop: SPACE[7], marginBottom: SPACE[5] }}>Highlights</T>
                <Card>
                  {project.highlights.map((h, i) => (
                    <View key={i}>
                      {i ? <Divider style={{ marginVertical: SPACE[4] }} /> : null}
                      <View style={{ flexDirection: 'row', gap: 14 }}>
                        <Icon name="check" size={18} color="success" style={{ marginTop: 4 }} />
                        <T variant="body" style={{ flex: 1 }}>{h}</T>
                      </View>
                    </View>
                  ))}
                </Card>
              </Reveal>
            ) : null}
          </View>
        </View>
      </Container>

      {project.gallery?.length ? (
        <Container width={1120} style={{ paddingBottom: isSm ? SPACE[10] : SPACE[12] }}>
          <Reveal>
            <T variant="h2" nativeID="sec-gallery" style={{ marginBottom: SPACE[5] }}>Gallery</T>
            <Grid columns={isSm ? 1 : bp === 'md' ? 2 : 3} gap={16}>
              {project.gallery.map((g, i) => (
                <Pressable key={g.url + i} onPress={() => setZoom(i)} accessibilityLabel={g.caption || 'Screenshot ' + (i + 1)} style={({ hovered }) => ({ borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, cursor: 'zoom-in', transform: [{ scale: hovered ? 1.01 : 1 }], transitionProperty: 'transform', transitionDuration: '300ms' })}>
                  <Image source={{ uri: g.url }} resizeMode="cover" style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceMuted }} />
                  {g.caption ? <T variant="caption" color="secondary" style={{ padding: 12 }} numberOfLines={2}>{g.caption}</T> : null}
                </Pressable>
              ))}
            </Grid>
          </Reveal>
          <Lightbox images={project.gallery} index={zoom} onIndex={setZoom} onClose={() => setZoom(null)} />
        </Container>
      ) : null}

      {next && next.id !== project.id ? (
        <View style={{ backgroundColor: colors.pageAlt, paddingVertical: isSm ? SPACE[10] : SPACE[12] }}>
          <Container width={980}>
            <T variant="eyebrow" color="secondary" style={{ marginBottom: SPACE[5] }}>Next project</T>
            <Grid columns={1}><ProjectCard project={next} large={!isSm} /></Grid>
          </Container>
        </View>
      ) : null}
    </View>
  );
}

// Splits a case study into sections. A paragraph becomes heading + text when it starts with
// "## Heading" on its own line, or with a known label sentence such as "The problem."
const LABELS = ['The problem', 'The brief', 'The idea', 'The goal', 'The challenge', 'What I built', 'What we built', 'How it works', 'How it plays', 'My part', 'My role', 'Results', 'The result', 'Impact', 'What I learned', 'Looking back', 'Next steps'];

export function parseBody(body) {
  const sections = [];
  let current = { heading: null, paragraphs: [] };
  const push = () => { if (current.heading || current.paragraphs.length) sections.push(current); };
  for (const raw of String(body || '').split(/\n{2,}/).map((t) => t.trim()).filter(Boolean)) {
    const md = raw.match(/^#{2,3}\s+(.+?)\s*(?:\n([\s\S]*))?$/);
    const label = !md && LABELS.find((l) => raw.startsWith(`${l}. `) || raw.startsWith(`${l}: `));
    if (md || label) {
      push();
      const heading = md ? md[1] : label;
      const text = md ? (md[2] || '').trim() : raw.slice(label.length + 2).trim();
      current = { heading, id: `sec-${slugify(heading)}`, paragraphs: text ? [text] : [] };
    } else current.paragraphs.push(raw);
  }
  push();
  return sections.length ? sections : [{ heading: null, paragraphs: [] }];
}

// Live demo status. Free hosts such as Render sleep when idle; checking the demo also wakes
// it, so by the time a visitor clicks "Visit" it's usually ready.
function DemoStatus({ url }) {
  const { colors } = useTheme();
  const [state, setState] = useState('checking');
  useEffect(() => {
    let alive = true;
    const started = Date.now();
    const check = async () => {
      try {
        const r = await api.ping(url);
        if (!alive) return;
        if (r.up) { setState('online'); return; }
      } catch { /* still waking */ }
      if (!alive) return;
      if (Date.now() - started > 90000) { setState('offline'); return; }
      setState('waking');
      setTimeout(check, 5000);
    };
    check();
    return () => { alive = false; };
  }, [url]);
  const [color, label, busy] = {
    checking: [colors.text3, 'Checking demo…', true],
    waking: [colors.warning, 'Waking up the demo…', true],
    online: [colors.success, 'Demo online', false],
    offline: [colors.text3, 'Demo unreachable right now', false],
  }[state];
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingHorizontal: 12, height: 32, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}>
      {busy ? <ActivityIndicator size="small" color={color} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />}
      <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text2 }}>{label}</Text>
      {state === 'waking' ? <Feather name="moon" size={12} color={colors.text3} /> : null}
    </View>
  );
}
