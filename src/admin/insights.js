// src/admin/insights.js
// Insights (private visit stats) and tracked share links.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { Button, Card, T, Tag } from '../components/ui';
import { Field, Segmented } from '../components/Form';
import { Modal } from '../components/Modal';
import { MiniButton } from './fields';
import { PanelHeader } from './panels';
import { api } from '../lib/api';
import { qrDataUrl, siteUrl } from '../lib/share';
import { relativeTime } from '../lib/format';
import { FONT, RADIUS } from '../theme/tokens';

const EVENT_LABEL = {
  view: 'Viewed', resume: 'Opened résumé', download: 'Downloaded résumé PDF', 'resume-text': 'Copied résumé text',
  contact: 'Sent a message', vcard: 'Saved your contact', credential: 'Opened a credential', certificate: 'Opened a certificate',
  verify: 'Verified a credential', 'link-open': 'Opened your link',
  skill: 'Checked the proof for a skill', rolefit: 'Checked their role fit', brief: 'Read your 30-second brief', endorse: 'Wrote you a testimonial',
};
const EVENT_ICON = { view: 'eye', resume: 'file-text', download: 'download', 'resume-text': 'clipboard', contact: 'mail', vcard: 'user-plus', credential: 'award', certificate: 'file', verify: 'shield', 'link-open': 'link', skill: 'check-square', rolefit: 'target', brief: 'zap', endorse: 'message-square' };

// ── Insights ────────────────────────────────────────────────────────────────────────
export function InsightsPanel({ content, go }) {
  const { colors } = useTheme();
  const { bp } = useBreakpoint();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.insights(days).then(setData).catch((e) => setError(e.message));
  }, [days]);
  useEffect(() => { setData(null); load(); }, [load]);

  const projectTitle = useMemo(() => Object.fromEntries(content.projects.map((p) => [p.slug, p.title])), [content.projects]);

  const kpis = data ? [
    { label: 'Visits', value: data.totals.visits, icon: 'users' },
    { label: 'Page views', value: data.totals.views, icon: 'eye' },
    { label: 'Résumé opens', value: data.totals.resume, icon: 'file-text' },
    { label: 'Downloads', value: data.totals.downloads, icon: 'download' },
    { label: 'Messages', value: data.totals.contacts, icon: 'mail' },
    { label: 'vCards saved', value: data.totals.vcards, icon: 'user-plus' },
  ] : [];

  return (
    <View>
      <PanelHeader
        title="Insights"
        subtitle="Private, cookie-free stats. Your own visits while signed in are never counted."
        action={<Segmented options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }]} value={days} onChange={setDays} />}
      />
      {error ? <Card><T variant="small" style={{ color: colors.danger }}>{error}</T></Card> : null}
      {!data && !error ? <View style={{ paddingVertical: 60 }}><ActivityIndicator color={colors.text2} /></View> : null}
      {data ? (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {kpis.map((k) => (
              <Card key={k.label} style={{ flexGrow: 1, flexBasis: bp === 'sm' ? '40%' : 140, padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name={k.icon} size={13} color={colors.text2} />
                  <T variant="caption" color="secondary">{k.label}</T>
                </View>
                <T variant="title" style={{ marginTop: 6, fontVariant: ['tabular-nums'] }}>{k.value.toLocaleString()}</T>
              </Card>
            ))}
          </View>

          <Card>
            <T variant="body" weight="600">Visits per day</T>
            <T variant="caption" color="secondary" style={{ marginBottom: 16 }}>Hover a bar for details</T>
            <DailyChart daily={data.daily} />
          </Card>

          <View style={{ flexDirection: bp === 'lg' ? 'row' : 'column', gap: 16 }}>
            <RankCard title="Most viewed projects" rows={data.projects.map((r) => ({ ...r, name: projectTitle[r.name] || r.name }))} empty="No project views yet" />
            <RankCard title="Where visitors came from" rows={data.referrers} empty="Direct visits only so far" />
          </View>
          <View style={{ flexDirection: bp === 'lg' ? 'row' : 'column', gap: 16 }}>
            <RankCard title="Countries" rows={data.countries} empty="No location data yet" />
            <RankCard title="Devices" rows={data.devices.map((d) => ({ ...d, name: d.name[0].toUpperCase() + d.name.slice(1) }))} empty="No data yet" />
          </View>

          <Card padded={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 8 }}>
              <T variant="body" weight="600">Recent activity</T>
              <Button size="sm" variant="secondary" icon="refresh-cw" title="Refresh" onPress={load} align="center" />
            </View>
            {data.recent.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, gap: 8 }}>
                <Feather name="activity" size={24} color={colors.text3} />
                <T variant="small" color="secondary">No visits yet. Share your link or a tracked link to get started.</T>
                <Button size="sm" variant="link" title="Create a tracked link" iconRight="chevron-right" onPress={() => go('links')} align="center" />
              </View>
            ) : data.recent.map((e, i) => (
              <View key={e.t + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: e.label ? colors.accentSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={EVENT_ICON[e.type] || 'circle'} size={14} color={e.label ? colors.accentText : colors.text2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 14, color: colors.text }}>
                    {e.label ? <Text style={{ fontWeight: '600' }}>{e.label} </Text> : 'Someone '}
                    {(EVENT_LABEL[e.type] || e.type).replace(/^./, (c) => (e.label ? c.toLowerCase() : c.toLowerCase()))}
                    {e.type === 'view' && e.slug ? ` ${projectTitle[e.slug] || e.slug}` : e.type === 'view' ? ' your portfolio' : ''}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 12, color: colors.text2 }}>{[e.country, e.device, e.referrer && `from ${e.referrer}`].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text3 }}>{relativeTime(e.t)}</Text>
              </View>
            ))}
          </Card>
          {data.truncated ? <T variant="caption" color="tertiary">Showing the most recent 4,000 events in this range.</T> : null}
        </View>
      ) : null}
    </View>
  );
}

// Single-series bar chart: thin bars, rounded tops, 2px gaps, recessive grid, hover tooltip.
function DailyChart({ daily }) {
  const { colors } = useTheme();
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...daily.map((d) => d.visits || d.views));
  const nice = max <= 5 ? 5 : Math.ceil(max / 5) * 5;
  const H = 160;
  const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const h = hover != null ? daily[hover] : null;
  return (
    <View>
      <View style={{ height: H, flexDirection: 'row' }}>
        <View style={{ width: 28, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
          <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3, marginTop: -6 }}>{nice}</Text>
          <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3, marginBottom: -6 }}>0</Text>
        </View>
        <View style={{ flex: 1, position: 'relative' }}>
          {[0, 0.5, 1].map((p) => <View key={p} style={{ position: 'absolute', left: 0, right: 0, top: H * p, height: 1, backgroundColor: p === 1 ? colors.borderStrong : colors.border }} />)}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
            {daily.map((d, i) => {
              const v = d.visits || d.views;
              return (
                <Pressable key={d.date} onHoverIn={() => setHover(i)} onHoverOut={() => setHover(null)} onPress={() => setHover(i)} accessibilityLabel={`${fmt(d.date)}: ${v} visits`} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                  <View style={{ height: v ? Math.max(3, (v / nice) * H) : 0, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: colors.accent, opacity: hover == null || hover === i ? 1 : 0.45 }} />
                </Pressable>
              );
            })}
          </View>
          {h ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 4, left: `${Math.min(70, Math.max(0, (hover / daily.length) * 100 - 10))}%`, backgroundColor: colors.inverse, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
              <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.onInverse }}>{fmt(h.date)}</Text>
              <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.onInverse }}>{h.visits} visits · {h.views} views · {h.resume} résumé</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 28, marginTop: 6 }}>
        <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3 }}>{fmt(daily[0].date)}</Text>
        <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3 }}>{fmt(daily[daily.length - 1].date)}</Text>
      </View>
    </View>
  );
}

function RankCard({ title, rows, empty }) {
  const { colors } = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card style={{ flex: 1 }}>
      <T variant="body" weight="600" style={{ marginBottom: 14 }}>{title}</T>
      {rows.length === 0 ? <T variant="small" color="tertiary">{empty}</T> : rows.map((r) => (
        <View key={r.name} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: colors.text }}>{r.name}</Text>
            <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] }}>{r.value}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted }}>
            <View style={{ width: `${(r.value / max) * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
          </View>
        </View>
      ))}
    </Card>
  );
}

// ── Tracked share links ─────────────────────────────────────────────────────────────
export function LinksPanel({ content, toast }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const [items, setItems] = useState(null);
  const [stats, setStats] = useState({});
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('/resume');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(null);

  const targets = [
    { value: '/', label: 'Portfolio' },
    ...content.resumes.map((r, i) => ({ value: i === 0 ? '/resume' : `/resume/${r.slug || r.id}`, label: content.resumes.length > 1 ? `Résumé · ${r.name}` : 'Résumé' })),
  ];

  const load = useCallback(async () => {
    try {
      const [{ items: list }, insight] = await Promise.all([api.listLinks(), api.insights(90).catch(() => null)]);
      setItems(list);
      if (insight) setStats(Object.fromEntries(insight.links.map((l) => [l.code, l])));
    } catch (e) { toast(e.message, 'error'); setItems([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try {
      const { item } = await api.createLink({ label, target });
      setItems((l) => [item, ...(l || [])]);
      setLabel('');
      navigator.clipboard?.writeText(siteUrl(`/r/${item.code}`));
      toast(`Link for ${item.label} created and copied.`);
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };
  const remove = async (l) => {
    if (!window.confirm(`Delete the link for ${l.label}? It will just open your homepage afterwards.`)) return;
    setItems((list) => list.filter((x) => x.code !== l.code));
    try { await api.deleteLink(l.code); } catch (e) { toast(e.message, 'error'); }
  };
  const copy = (l) => { navigator.clipboard?.writeText(siteUrl(`/r/${l.code}`)); toast('Link copied.'); };

  return (
    <View>
      <PanelHeader title="Share links" subtitle="Give each company or recruiter its own link, then see in Insights when they open your portfolio or résumé." />
      <Card style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: isSm ? 'column' : 'row', gap: 14, alignItems: isSm ? 'stretch' : 'flex-end' }}>
          <Field label="Who is it for?" value={label} onChange={setLabel} placeholder="e.g. Accenture: OJT application" style={{ flex: 1 }} onSubmitEditing={create} />
          <Segmented label="Opens" options={targets} value={target} onChange={setTarget} />
          <Button title="Create link" icon="plus" onPress={create} loading={busy} disabled={!label.trim()} align={isSm ? 'start' : 'center'} />
        </View>
        <T variant="caption" color="tertiary" style={{ marginTop: 12 }}>Links are private: they're stored outside your public site content, so no one else can see which companies you applied to.</T>
      </Card>

      {!items ? <ActivityIndicator color={colors.text2} /> : items.length === 0 ? (
        <Card><View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}><Feather name="link" size={24} color={colors.text3} /><T variant="small" color="secondary">No links yet. Create one for your next application.</T></View></Card>
      ) : (
        <Card padded={false}>
          {items.map((l, i) => {
            const s = stats[l.code];
            return (
              <View key={l.code} style={{ flexDirection: isSm ? 'column' : 'row', alignItems: isSm ? 'stretch' : 'center', gap: 12, padding: 16, paddingHorizontal: 20, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T variant="body" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>{l.label}</T>
                    {s?.opens ? <Tag tone="success">Opened {s.opens}×</Tag> : <Tag>Not opened yet</Tag>}
                  </View>
                  <Text numberOfLines={1} selectable style={{ fontFamily: FONT, fontSize: 13, color: colors.text2, marginTop: 2 }}>
                    {siteUrl(`/r/${l.code}`).replace(/^https?:\/\//, '')} → {targets.find((t) => t.value === l.target)?.label || l.target}
                    {s ? ` · last ${relativeTime(s.last)}` : ` · created ${relativeTime(l.createdAt)}`}
                    {s?.downloads ? ` · ${s.downloads} download${s.downloads > 1 ? 's' : ''}` : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Button size="sm" variant="secondary" icon="copy" title="Copy" onPress={() => copy(l)} align="center" />
                  <Button size="sm" variant="secondary" icon="grid" title="QR" onPress={() => setQr(l)} align="center" />
                  <MiniButton icon="trash-2" label="Delete" danger onPress={() => remove(l)} />
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <Modal visible={!!qr} onClose={() => setQr(null)} title={qr ? `QR · ${qr.label}` : ''} width={380}>
        {qr ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: RADIUS.lg }}>
              <Image source={{ uri: qrDataUrl(siteUrl(`/r/${qr.code}`)) }} style={{ width: 220, height: 220 }} />
            </View>
            <T variant="small" color="secondary" align="center">Print it on a cover letter or show it at a career fair. Scans are tracked under this link.</T>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}
