// src/screens/BriefScreen.js
// /brief: everything a busy recruiter needs on one screen (and one printed page).
import React, { useEffect } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { formatMonth, progressBetween, shortUrl, toDate } from '../lib/format';
import { downloadVCard, qrDataUrl, siteUrl } from '../lib/share';
import { track } from '../lib/track';
import { Button, Card, Container, Divider, StatusDot, T } from '../components/ui';
import { ProgressBar } from '../components/Cards';
import { SkillChip } from '../components/SkillSheet';
import { LocalTime } from './home/Extras';
import { FONT, RADIUS, SPACE } from '../theme/tokens';

const isWeb = Platform.OS === 'web';

export default function BriefScreen() {
  const { colors } = useTheme();
  const { bp, isSm } = useBreakpoint();
  const { content } = useContent();
  const { profile, education, projects, credentials, skills } = content;

  useEffect(() => {
    if (isWeb) document.title = `${profile.name} · 30-second brief`;
    track('brief');
  }, [profile.name]);

  const visible = projects.filter((p) => !p.hidden);
  const best = [...visible.filter((p) => p.featured), ...visible.filter((p) => !p.featured)].slice(0, 3);
  const creds = credentials.filter((c) => !c.hidden);
  const topSkills = skills.flatMap((g) => g.items).slice(0, 12);
  const progress = progressBetween(education.start, education.end);
  const gradYear = toDate(education.end)?.getFullYear();

  const Label = ({ children }) => <T variant="label" color="secondary" style={{ marginBottom: SPACE[3] }}>{children}</T>;

  return (
    <View dataSet={{ printflat: true }} style={{ backgroundColor: colors.pageAlt, paddingVertical: isSm ? SPACE[7] : SPACE[10] }}>
      <Container width={880}>
        <View dataSet={{ noprint: true }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[5], gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="clock" size={15} color={colors.text2} />
            <T variant="small" color="secondary">The 30-second version</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button size="sm" variant="secondary" icon="printer" title="Print" onPress={() => window.print()} align="center" />
            <Button size="sm" variant="secondary" icon="user-plus" title="Save contact" onPress={() => { downloadVCard(profile); track('vcard'); }} align="center" />
          </View>
        </View>

        <Card>
          {/* Who */}
          <View style={{ flexDirection: bp === 'sm' ? 'column' : 'row', gap: SPACE[6], alignItems: bp === 'sm' ? 'flex-start' : 'center' }}>
            {profile.avatar ? <Image source={{ uri: profile.avatar }} style={{ width: 84, height: 84, borderRadius: 42 }} /> : null}
            <View style={{ flex: 1 }}>
              <T variant="title">{profile.name}</T>
              <T variant="lead" color="secondary">{profile.role}</T>
              {profile.status?.label ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <StatusDot color={profile.status.open ? colors.success : colors.text3} pulse={profile.status.open} />
                  <T variant="small" weight="600">{profile.status.label}</T>
                </View>
              ) : null}
            </View>
            {isWeb && !isSm ? (
              <View style={{ alignItems: 'center', gap: 4 }}>
                {React.createElement('img', { src: qrDataUrl(siteUrl('/')), width: 88, height: 88, alt: 'QR code to portfolio', style: { borderRadius: 8 } })}
                <T variant="caption" color="tertiary">Full portfolio</T>
              </View>
            ) : null}
          </View>
          <View style={{ marginTop: SPACE[5] }}><LocalTime /></View>

          <Divider style={{ marginVertical: SPACE[2] }} />

          {/* What + where */}
          <View style={{ flexDirection: bp === 'sm' ? 'column' : 'row', gap: SPACE[7], marginTop: SPACE[5] }}>
            <View style={{ flex: 1.4 }}>
              <Label>In one line</Label>
              <T variant="body">{profile.intro}</T>
            </View>
            <View style={{ flex: 1 }}>
              <Label>Education</Label>
              <T variant="body" weight="600">{education.program}</T>
              <T variant="small" color="secondary">{education.school}{gradYear ? ` · Class of ${gradYear}` : ''}</T>
              <View style={{ marginTop: 10 }}><ProgressBar value={progress} /></View>
              <T variant="caption" color="tertiary" style={{ marginTop: 6 }}>{Math.round(progress * 100)}% complete</T>
            </View>
          </View>

          {/* Best work */}
          <View style={{ marginTop: SPACE[8] }}>
            <Label>Best work</Label>
            <View style={{ gap: SPACE[3] }}>
              {best.map((p) => (
                <Card key={p.id} href={`/projects/${p.slug}`} padded={false} style={{ borderWidth: 1, borderColor: colors.border, boxShadow: 'none' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE[4], padding: SPACE[3] }}>
                    <View style={{ width: 96, height: 60, borderRadius: RADIUS.sm, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
                      {p.cover ? <Image source={{ uri: p.cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T variant="body" weight="600" numberOfLines={1}>{p.title}</T>
                      <T variant="small" color="secondary" numberOfLines={isSm ? 2 : 1}>{p.tagline}</T>
                      {p.role ? <T variant="caption" color="tertiary" numberOfLines={1}>{p.role}</T> : null}
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.text3} />
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* Skills + credentials */}
          <View style={{ flexDirection: bp === 'sm' ? 'column' : 'row', gap: SPACE[7], marginTop: SPACE[8] }}>
            <View style={{ flex: 1.4 }}>
              <Label>Core skills · tap for proof</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {topSkills.map((s) => <SkillChip key={s} name={s} />)}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Label>Credentials</Label>
              {creds.length ? (
                <>
                  <T variant="h2">{creds.length}</T>
                  <T variant="small" color="secondary" style={{ marginBottom: 8 }}>certificates and badges</T>
                  {creds.slice(0, 3).map((c) => <T key={c.id} variant="small" numberOfLines={1}>• {c.title}</T>)}
                </>
              ) : <T variant="small" color="secondary">Coming soon.</T>}
            </View>
          </View>

          {/* Next steps */}
          <View dataSet={{ noprint: true }} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACE[8], paddingTop: SPACE[6], borderTopWidth: 1, borderTopColor: colors.border }}>
            <Button title="Résumé" icon="file-text" href="/resume" align="center" />
            {profile.email ? <Button title="Email" icon="mail" variant="secondary" href={`mailto:${profile.email}`} align="center" /> : null}
            <Button title="Message" icon="send" variant="secondary" href="/#contact" align="center" />
            {profile.socials.slice(0, 2).map((s) => <Button key={s.url} title={s.label} icon={s.icon || 'link'} variant="secondary" href={s.url} align="center" />)}
          </View>
          <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text3, marginTop: SPACE[5] }}>
            {shortUrl(siteUrl('/'))}{content.updatedAt ? ` · Updated ${formatMonth(content.updatedAt.slice(0, 7))}` : ''}
          </Text>
        </Card>
      </Container>
    </View>
  );
}
