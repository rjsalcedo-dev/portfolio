// src/screens/home/Extras.js
// Home sections: live GitHub activity and the role-fit checker.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../../context/ThemeContext';
import { useContent } from '../../context/ContentContext';
import { api } from '../../lib/api';
import { analyzeRole, SAMPLE_JD } from '../../lib/evidence';
import { relativeTime } from '../../lib/format';
import { scrollToId } from '../../lib/router';
import { track } from '../../lib/track';
import { Button, Card, Reveal, Section, T } from '../../components/ui';
import { Grid, ProgressBar } from '../../components/Cards';
import { Field } from '../../components/Form';
import { SkillChip } from '../../components/SkillSheet';
import { FONT, RADIUS, SPACE } from '../../theme/tokens';

const isWeb = Platform.OS === 'web';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MIN_CONTRIBUTIONS = 10;

const withAlpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Loads GitHub stats once; the section hides itself if there's too little to show.
export function useGithub(enabled) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    api.github().then(setData).catch(() => setData({ error: true }));
  }, [enabled]);
  return data;
}

// ── GitHub activity ─────────────────────────────────────────────────────────────────
export function Activity({ alt, data }) {
  const { colors } = useTheme();
  const { bp, isSm } = useBreakpoint();
  const stats = [
    { label: 'Contributions this year', value: data.total },
    { label: 'Active days', value: data.activeDays },
    { label: 'Longest streak', value: `${data.longest} day${data.longest === 1 ? '' : 's'}` },
    { label: 'Most active on', value: `${WEEKDAYS[data.busiestWeekday]}s` },
  ];
  const langTotal = data.languages.reduce((a, l) => a + l.value, 0) || 1;

  return (
    <Section
      id="activity"
      alt={alt}
      eyebrow="Building in public"
      title="Live from GitHub."
      subtitle="My contribution history, updated automatically every few hours."
      action={<Button variant="link" title="Follow on GitHub" iconRight="arrow-up-right" href={`https://github.com/${data.users[0]}`} />}
    >
      <Reveal>
        <Card>
          <Heatmap days={data.days} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isSm ? SPACE[5] : SPACE[9], marginTop: SPACE[7], paddingTop: SPACE[6], borderTopWidth: 1, borderTopColor: colors.border }}>
            {stats.map((s) => (
              <View key={s.label} style={{ minWidth: isSm ? '40%' : 120 }}>
                <T variant="h2" style={{ fontVariant: ['tabular-nums'] }}>{s.value}</T>
                <T variant="caption" color="secondary">{s.label}</T>
              </View>
            ))}
          </View>
        </Card>
      </Reveal>

      <Grid columns={bp === 'lg' && data.pushes.length ? 2 : 1} style={{ marginTop: SPACE[5] }}>
        {data.languages.length ? (
          <Reveal delay={80} style={{ flex: 1 }}>
            <Card style={{ flex: 1 }}>
              <T variant="label" color="secondary" style={{ marginBottom: SPACE[4] }}>Languages across my repositories</T>
              {data.languages.map((l) => (
                <View key={l.name} style={{ marginBottom: SPACE[3] }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <T variant="small">{l.name}</T>
                    <T variant="small" color="secondary" style={{ fontVariant: ['tabular-nums'] }}>{Math.round((l.value / langTotal) * 100)}%</T>
                  </View>
                  <ProgressBar value={l.value / langTotal} height={6} />
                </View>
              ))}
            </Card>
          </Reveal>
        ) : null}
        {data.pushes.length ? (
          <Reveal delay={140} style={{ flex: 1 }}>
            <Card style={{ flex: 1 }}>
              <T variant="label" color="secondary" style={{ marginBottom: SPACE[3] }}>Recent pushes</T>
              {data.pushes.map((p, i) => (
                <View key={p.at + i} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                  <Feather name="git-commit" size={16} color={colors.text3} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T variant="small" numberOfLines={1}>{p.message || `${p.count} commit${p.count === 1 ? '' : 's'}`}</T>
                    <T variant="caption" color="secondary" numberOfLines={1}>{p.repo} · {relativeTime(p.at)}</T>
                  </View>
                </View>
              ))}
            </Card>
          </Reveal>
        ) : null}
      </Grid>
      <T variant="caption" color="tertiary" style={{ marginTop: SPACE[4] }}>
        {data.users.length > 1 ? `Combined from ${data.users.length} GitHub accounts. ` : ''}Updated {relativeTime(data.fetchedAt)}.
      </T>
    </Section>
  );
}

// Contribution calendar: one column per week, one hue from light to dark, with a legend
// and a tooltip on hover or tap.
function Heatmap({ days }) {
  const { colors, scheme } = useTheme();
  const { isSm } = useBreakpoint();
  const [hover, setHover] = useState(null);
  const scroller = useRef(null);
  const CELL = 11;
  const GAP = 3;

  const { weeks, levels, months } = useMemo(() => {
    const nonZero = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
    const q = (p) => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))] || 1;
    const cuts = [q(0.25), q(0.5), q(0.75)];
    const level = (c) => (!c ? 0 : c <= cuts[0] ? 1 : c <= cuts[1] ? 2 : c <= cuts[2] ? 3 : 4);
    const first = new Date(`${days[0].date}T00:00:00`);
    const pad = first.getDay();
    const cells = [...Array(pad).fill(null), ...days];
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    const m = [];
    w.forEach((week, i) => {
      const d = week.find(Boolean);
      if (!d) return;
      const month = new Date(`${d.date}T00:00:00`).getMonth();
      if (!m.length || m[m.length - 1].month !== month) m.push({ month, col: i });
    });
    return { weeks: w, levels: level, months: m };
  }, [days]);

  const scale = [
    scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    withAlpha(colors.accent, 0.28), withAlpha(colors.accent, 0.5), withAlpha(colors.accent, 0.75), colors.accent,
  ];
  const width = weeks.length * (CELL + GAP);
  const total = days.reduce((a, d) => a + d.count, 0);

  const grid = (
    <View style={{ width: width + 28, paddingTop: 18, position: 'relative' }}>
      {months.map((m) => (
        <Text key={`${m.month}-${m.col}`} style={{ position: 'absolute', top: 0, left: 28 + m.col * (CELL + GAP), fontFamily: FONT, fontSize: 11, color: colors.text3 }}>{MONTHS[m.month]}</Text>
      ))}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 28, gap: GAP }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Text key={d} style={{ height: CELL, fontFamily: FONT, fontSize: 10, lineHeight: CELL, color: colors.text3 }}>{d % 2 ? WEEKDAYS[d].slice(0, 3) : ''}</Text>
          ))}
        </View>
        <View accessibilityRole="img" accessibilityLabel={`${total} contributions in the last year`} style={{ flexDirection: 'row', gap: GAP }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: GAP }}>
              {Array.from({ length: 7 }).map((_, di) => {
                const d = week[di];
                if (!d) return <View key={di} style={{ width: CELL, height: CELL }} />;
                const on = hover && hover.date === d.date;
                return (
                  <Pressable
                    key={di}
                    onHoverIn={() => setHover({ ...d, x: wi, y: di })}
                    onHoverOut={() => setHover(null)}
                    onPress={() => setHover({ ...d, x: wi, y: di })}
                    style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: scale[levels(d.count)], outlineStyle: on ? 'solid' : 'none', outlineWidth: 1, outlineColor: colors.text }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
      {hover ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 18 + hover.y * (CELL + GAP) - 38, left: Math.max(0, Math.min(width - 150, 28 + hover.x * (CELL + GAP) - 70)), backgroundColor: colors.inverse, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
          <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.onInverse, whiteSpace: 'nowrap' }}>
            <Text style={{ fontWeight: '600' }}>{hover.count ? `${hover.count} contribution${hover.count === 1 ? '' : 's'}` : 'No contributions'}</Text> on {fmtDay(hover.date)}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View>
      {isSm || width + 28 > 900 ? (
        <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}>
          {grid}
        </ScrollView>
      ) : grid}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
        <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3, marginRight: 4 }}>Less</Text>
        {scale.map((c) => <View key={c} style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: c }} />)}
        <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3, marginLeft: 4 }}>More</Text>
      </View>
    </View>
  );
}

export const githubWorthShowing = (data) => data && !data.error && data.users?.length && data.total >= MIN_CONTRIBUTIONS;

// ── Role fit ────────────────────────────────────────────────────────────────────────
const VERDICT = {
  strong: ['Strong match', 'success'],
  good: ['Good match', 'accent'],
  partial: ['Partial match', 'warning'],
};

export function RoleFit({ alt }) {
  const { colors } = useTheme();
  const { bp, isSm } = useBreakpoint();
  const { content } = useContent();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const run = (jd = text) => {
    if (!jd.trim()) return;
    const r = analyzeRole(jd, content);
    setResult(r);
    track('rolefit', { id: `${Math.round(r.score * 100)}` });
    if (isWeb) setTimeout(() => scrollToId('fit-result'), 50);
  };

  const message = () => {
    const proven = result.results.filter((r) => r.status === 'proven').map((r) => r.skill);
    const first = content.profile.name.split(' ')[0];
    const detail = `Hi ${first.length > 1 ? first : content.profile.initials || first}, I'm hiring for a role that needs ${result.results.slice(0, 6).map((r) => r.skill).join(', ')}. Your portfolio shows ${proven.slice(0, 4).join(', ')}. Are you available to talk?`;
    if (isWeb) window.dispatchEvent(new CustomEvent('rj:prefill', { detail }));
    scrollToId('contact');
  };

  const groups = result ? [
    ['proven', 'Proven with real work', 'check-circle', colors.success],
    ['listed', 'In my toolkit', 'circle', colors.accentText],
    ['gap', 'Not in my portfolio yet', 'minus-circle', colors.text3],
  ].map(([status, title, icon, color]) => ({ status, title, icon, color, items: result.results.filter((r) => r.status === status) })).filter((g) => g.items.length) : [];

  return (
    <Section
      id="fit"
      alt={alt}
      eyebrow="For recruiters"
      title="Does my experience fit your role?"
      subtitle="Paste a job description. You'll see which requirements I can prove with real projects, and which I can't yet. It runs in your browser; nothing is saved."
    >
      <Reveal>
        <Card>
          <Field value={text} onChange={setText} multiline rows={isSm ? 6 : 7} placeholder="Paste the job description or requirements here…" accessibilityLabel="Job description" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4] }}>
            <Button title="Check fit" icon="target" onPress={() => run()} disabled={!text.trim()} align="center" />
            <Button variant="secondary" title="Try a sample posting" onPress={() => { setText(SAMPLE_JD); run(SAMPLE_JD); }} align="center" />
            {text ? <Button variant="link" size="sm" title="Clear" onPress={() => { setText(''); setResult(null); }} align="center" /> : null}
          </View>
        </Card>
      </Reveal>

      {result ? (
        <View nativeID="fit-result" ref={resultRef} style={{ marginTop: SPACE[5] }}>
          {result.total === 0 ? (
            <Card><T variant="body" color="secondary">I couldn't find specific skills in that text. Try pasting the requirements or qualifications part of the posting.</T></Card>
          ) : (
            <Card>
              <View style={{ flexDirection: bp === 'sm' ? 'column' : 'row', gap: SPACE[7] }}>
                <View style={{ width: bp === 'sm' ? '100%' : 240 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <T variant="hero" style={{ fontVariant: ['tabular-nums'] }}>{Math.round(result.score * 100)}</T>
                    <T variant="h3" color="secondary">%</T>
                  </View>
                  <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors[VERDICT[result.verdict][1]] || colors.text, marginBottom: 10 }}>{VERDICT[result.verdict][0]}</Text>
                  <ProgressBar value={result.score} height={8} />
                  <T variant="small" color="secondary" style={{ marginTop: 12 }}>
                    {result.proven} of {result.total} skills in this posting are backed by projects or credentials{result.listed ? `; ${result.listed} more are in my toolkit` : ''}.
                  </T>
                  <View style={{ gap: 10, marginTop: SPACE[6] }}>
                    <Button title="Open the best-fit résumé" icon="file-text" href={result.resumeHref} align="stretch" />
                    <Button title="Discuss this role" icon="send" variant="secondary" onPress={message} align="stretch" />
                  </View>
                </View>
                <View style={{ flex: 1, gap: SPACE[6] }}>
                  {groups.map((g) => (
                    <View key={g.status}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Feather name={g.icon} size={15} color={g.color} />
                        <T variant="label">{g.title}</T>
                        <T variant="caption" color="tertiary">{g.items.length}</T>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {g.items.map((r) => (g.status === 'gap' ? (
                          <View key={r.skill} style={{ paddingHorizontal: 12, height: 32, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong }}>
                            <Text style={{ fontFamily: FONT, fontSize: 14, color: colors.text3 }}>{r.skill}</Text>
                          </View>
                        ) : <SkillChip key={r.skill} name={r.skill} />))}
                      </View>
                    </View>
                  ))}
                  <T variant="caption" color="tertiary">Tap a skill to see the projects and credentials behind it.</T>
                </View>
              </View>
            </Card>
          )}
        </View>
      ) : null}
    </Section>
  );
}

// ── Local time + reply expectation (Contact) ────────────────────────────────────────
export function LocalTime() {
  const { colors } = useTheme();
  const { content } = useContent();
  const { timezone, city, replyTime } = content.settings;
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  let time = '';
  try { time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone || 'Asia/Manila' }); } catch {}
  const Chip = ({ icon, children }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <Feather name={icon} size={13} color={colors.text2} />
      <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text }}>{children}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACE[7] }}>
      {time ? <Chip icon="clock">{time} in {city || 'Baguio'}</Chip> : null}
      {replyTime ? <Chip icon="message-circle">Usually replies {replyTime}</Chip> : null}
    </View>
  );
}
