// src/screens/ProjectScreen.js
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { hostOf } from '../lib/format';
import { Button, Card, Container, Divider, Icon, Reveal, T, Tag } from '../components/ui';
import { Grid, ProjectCard, ProjectCover } from '../components/Cards';
import { RADIUS, SPACE } from '../theme/tokens';
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
  const meta = [
    ['Role', project.role],
    ['Year', project.year],
    ['Status', project.status],
    ['Category', project.category],
  ].filter(([, v]) => v);
  const paragraphs = String(project.body || project.summary || '').split(/\n{2,}/).filter(Boolean);

  return (
    <View style={{ backgroundColor: colors.page }}>
      <Container width={980} style={{ paddingTop: isSm ? SPACE[7] : SPACE[10] }}>
        <Reveal>
          <Button variant="link" title="All work" href="/#work" icon="chevron-left" size="sm" />
          <T variant="eyebrow" color="accent" style={{ marginTop: SPACE[7], marginBottom: SPACE[2] }}>{project.category}</T>
          <T variant="hero" accessibilityRole="header" aria-level={1}>{project.title}</T>
          <T variant="lead" color="secondary" style={{ marginTop: SPACE[4], maxWidth: 720 }}>{project.tagline}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3], marginTop: SPACE[7] }}>
            {project.links?.live ? <Button title={`Visit ${hostOf(project.links.live)}`} href={project.links.live} iconRight="arrow-up-right" /> : null}
            {project.links?.video ? <Button title="Watch demo" href={project.links.video} variant="secondary" icon="play-circle" /> : null}
            {project.links?.repo ? <Button title="Source code" href={project.links.repo} variant="secondary" icon="github" /> : null}
          </View>
        </Reveal>
      </Container>

      <Container width={1120} style={{ marginTop: isSm ? SPACE[8] : SPACE[10] }}>
        <Reveal delay={100}>
          <View style={{ borderRadius: isSm ? RADIUS.lg : RADIUS.xl, overflow: 'hidden' }}>
            <ProjectCover project={project} ratio={isSm ? 4 / 3 : 16 / 8} large />
          </View>
        </Reveal>
      </Container>

      <Container width={980} style={{ paddingVertical: isSm ? SPACE[10] : SPACE[12] }}>
        <View style={{ flexDirection: bp === 'lg' ? 'row' : 'column', gap: bp === 'lg' ? SPACE[12] : SPACE[9] }}>
          <View style={{ width: bp === 'lg' ? 260 : '100%' }}>
            <Reveal>
              <View style={{ flexDirection: bp === 'lg' ? 'column' : 'row', flexWrap: 'wrap', gap: SPACE[6] }}>
                {meta.map(([k, v]) => (
                  <View key={k} style={{ minWidth: isSm ? '40%' : 140 }}>
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
            </Reveal>
          </View>

          <View style={{ flex: 1 }}>
            <Reveal delay={80}>
              <T variant="h2" style={{ marginBottom: SPACE[5] }}>Overview</T>
              {paragraphs.map((p, i) => <T key={i} variant="lead" style={{ marginBottom: SPACE[5] }}>{p}</T>)}
            </Reveal>
            {project.highlights?.length ? (
              <Reveal delay={120}>
                <T variant="h2" style={{ marginTop: SPACE[7], marginBottom: SPACE[5] }}>Highlights</T>
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
            <T variant="h2" style={{ marginBottom: SPACE[5] }}>Gallery</T>
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
