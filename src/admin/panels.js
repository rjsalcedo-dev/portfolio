// src/admin/panels.js
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { Button, Card, T, Tag } from '../components/ui';
import { Field } from '../components/Form';
import { FieldGroup, MiniButton } from './fields';
import { COLLECTIONS, NETACAD_COURSES, NETACAD_ISSUER } from './schemas';
import { api } from '../lib/api';
import { relativeTime, uid } from '../lib/format';
import { normalizeContent } from '../data/defaults';
import { FONT, RADIUS } from '../theme/tokens';

export function PanelHeader({ title, subtitle, action }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <View style={{ flexShrink: 1 }}>
        <T variant="h2">{title}</T>
        {subtitle ? <T variant="small" color="secondary" style={{ marginTop: 4 }}>{subtitle}</T> : null}
      </View>
      {action}
    </View>
  );
}

// ── Form panel (profile, education, now, settings) ──────────────────────────────────
export function FormPanel({ title, subtitle, fields, value, onChange, children }) {
  return (
    <View>
      <PanelHeader title={title} subtitle={subtitle} />
      <Card><FieldGroup fields={fields} value={value} onChange={onChange} /></Card>
      {children}
    </View>
  );
}

// ── List panel: a master list plus a form for the selected item ─────────────────────
export function ListPanel({ name, items, onChange, content, extra, previewHref }) {
  const { colors } = useTheme();
  const { isLg } = useBreakpoint();
  const schema = COLLECTIONS[name];
  const [selectedId, setSelectedId] = useState(isLg ? items[0]?.id : null);
  const index = items.findIndex((x) => x.id === selectedId);
  const selected = items[index];

  useEffect(() => { if (isLg && !selected && items[0]) setSelectedId(items[0].id); }, [isLg, selected, items]);

  const add = () => { const n = schema.newItem(); onChange([n, ...items]); setSelectedId(n.id); };
  const update = (v) => onChange(items.map((x) => (x.id === selected.id ? (schema.beforeSave ? schema.beforeSave(v) : v) : x)));
  const remove = () => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${schema.label(selected)}"? You can still undo by not saving.`)) return;
    onChange(items.filter((x) => x.id !== selected.id));
    setSelectedId(isLg ? items.find((x) => x.id !== selected.id)?.id : null);
  };
  const duplicate = () => { const n = { ...selected, id: uid(name[0]), ...(selected.slug != null ? { slug: '' } : {}), [selected.title != null ? 'title' : 'name']: `${schema.label(selected)} copy` }; onChange([...items.slice(0, index + 1), n, ...items.slice(index + 1)]); setSelectedId(n.id); };
  const move = (i, d) => { const n = [...items]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };

  const list = (
    <View style={{ width: isLg ? 300 : '100%', gap: 4 }}>
      {items.length === 0 ? <T variant="small" color="secondary" style={{ padding: 16 }}>No {schema.title.toLowerCase()} yet.</T> : null}
      {items.map((item, i) => {
        const on = item.id === selectedId;
        const thumb = schema.thumb?.(item);
        return (
          <Pressable
            key={item.id}
            onPress={() => setSelectedId(item.id)}
            style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 12, paddingRight: 4, borderRadius: RADIUS.md, backgroundColor: on ? colors.accentSoft : hovered ? colors.surfaceMuted : 'transparent', cursor: 'pointer' })}
          >
            {thumb ? <Image source={{ uri: thumb }} style={{ width: 32, height: 32, borderRadius: 6 }} resizeMode="contain" /> : null}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 15, fontWeight: '500', color: on ? colors.accentText : colors.text }}>{schema.label(item)}</Text>
              <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 12, color: colors.text2 }}>{schema.sub(item, i) || ' '}</Text>
            </View>
            <MiniButton icon="chevron-up" label="Move up" disabled={i === 0} onPress={() => move(i, -1)} />
            <MiniButton icon="chevron-down" label="Move down" disabled={i === items.length - 1} onPress={() => move(i, 1)} />
          </Pressable>
        );
      })}
    </View>
  );

  const editor = selected ? (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 8, flexWrap: 'wrap' }}>
          {!isLg ? <Button variant="link" size="sm" icon="chevron-left" title={`All ${schema.title.toLowerCase()}`} onPress={() => setSelectedId(null)} /> : <T variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>{schema.label(selected)}</T>}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {previewHref ? <Button align="center" size="sm" variant="secondary" icon="eye" title="Preview" href={previewHref(selected, index)} external /> : null}
            <Button align="center" size="sm" variant="secondary" icon="copy" title="Duplicate" onPress={duplicate} />
            <Button align="center" size="sm" variant="danger" icon="trash-2" title="Delete" onPress={remove} />
          </View>
        </View>
        <FieldGroup key={selected.id} fields={schema.fields} value={selected} onChange={update} context={content} />
      </Card>
    </View>
  ) : null;

  return (
    <View>
      <PanelHeader title={schema.title} subtitle={`${items.length} ${items.length === 1 ? schema.singular : `${schema.singular}s`}. Order here is the order on the site.`} action={<Button icon="plus" title={`New ${schema.singular}`} size="sm" onPress={add} />} />
      {extra}
      {isLg ? (
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>{list}{editor}</View>
      ) : selected ? editor : list}
    </View>
  );
}

// ── Credly import ───────────────────────────────────────────────────────────────────
export function CredlyImport({ username, onUsername, credentials, onChange, toast }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const { items } = await api.credly(username);
      const known = new Map(credentials.filter((c) => c.credlyId).map((c) => [c.credlyId, c]));
      let added = 0;
      let updated = 0;
      const next = [...credentials];
      for (const b of items) {
        const existing = known.get(b.credlyId);
        if (existing) {
          // Refresh Credly's fields but keep anything set by hand (pinned, hidden).
          const i = next.findIndex((c) => c.id === existing.id);
          next[i] = { ...existing, ...b, id: existing.id, featured: existing.featured, hidden: existing.hidden };
          updated++;
        } else {
          next.push({ id: uid('c'), featured: false, hidden: false, ...b });
          added++;
        }
      }
      onChange(next);
      toast(items.length ? `${added} added, ${updated} refreshed from Credly. Publish to put them live.` : 'No public badges found on that profile.');
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };
  return (
    <Card style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Feather name="download-cloud" size={18} color={colors.accentText} />
        <T variant="body" weight="600">Import from Credly</T>
      </View>
      <T variant="small" color="secondary" style={{ marginBottom: 14 }}>Pulls every public badge (Cisco NetAcad badges are issued through Credly) with its image and verification link. Running it again refreshes them without making duplicates.</T>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Field value={username} onChange={onUsername} placeholder="credly.com/users/your-name" autoCapitalize="none" style={{ flex: 1, minWidth: 220 }} />
        <Button align="center" title="Import badges" onPress={run} loading={busy} disabled={!username} icon="refresh-cw" />
      </View>
    </Card>
  );
}

// ── Cisco NetAcad quick add ─────────────────────────────────────────────────────────
export function CiscoQuickAdd({ credentials, onChange, toast }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState([]);
  const [date, setDate] = useState('');
  const have = new Set(credentials.map((c) => c.title.toLowerCase()));
  const q = query.trim().toLowerCase();
  const courses = NETACAD_COURSES.filter((c) => !q || c.title.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  const groups = [...new Set(courses.map((c) => c.group))];
  const toggle = (t) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const add = () => {
    const added = picked.map((title) => {
      const course = NETACAD_COURSES.find((c) => c.title === title);
      return { id: uid('c'), title, issuer: NETACAD_ISSUER, kind: 'certificate', issued: date, expires: '', image: '', file: '', credentialId: '', verifyUrl: '', description: '', skills: course.skills, featured: false, hidden: false };
    });
    onChange([...added, ...credentials]);
    toast(`${added.length} Cisco certificate${added.length > 1 ? 's' : ''} added. Upload each PDF, then Publish.`);
    setPicked([]);
    setOpen(false);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#049fd9', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="globe" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 220 }}>
          <T variant="body" weight="600">Cisco Networking Academy certificates</T>
          <T variant="small" color="secondary">Pick the courses you finished; then upload each certificate PDF from netacad.com.</T>
        </View>
        <Button align="center" size="sm" variant={open ? 'secondary' : 'primary'} title={open ? 'Close' : 'Choose courses'} onPress={() => setOpen((o) => !o)} />
      </View>
      {open ? (
        <View style={{ marginTop: 16, gap: 14 }}>
          <Field value={query} onChange={setQuery} placeholder="Search courses (CCNA, Python, Cybersecurity…)" />
          {groups.map((g) => (
            <View key={g}>
              <T variant="caption" weight="600" color="secondary" style={{ marginBottom: 8 }}>{g}</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {courses.filter((c) => c.group === g).map((c) => {
                  const owned = have.has(c.title.toLowerCase());
                  const on = picked.includes(c.title);
                  return (
                    <Pressable
                      key={c.title}
                      disabled={owned}
                      onPress={() => toggle(c.title)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on, disabled: owned }}
                      style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 999, borderWidth: 1, borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.accentSoft : hovered && !owned ? colors.surfaceMuted : 'transparent', opacity: owned ? 0.45 : 1, cursor: owned ? 'default' : 'pointer' })}
                    >
                      <Feather name={owned ? 'check' : on ? 'check-circle' : 'plus'} size={13} color={on ? colors.accentText : colors.text2} />
                      <Text style={{ fontFamily: FONT, fontSize: 13, color: on ? colors.accentText : colors.text }}>{c.title}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Field label="Completed" hint="YYYY-MM, optional" value={date} onChange={setDate} placeholder="2026-05" style={{ width: 240 }} />
            <View style={{ flex: 1 }} />
            <Button title={picked.length ? `Add ${picked.length} certificate${picked.length > 1 ? 's' : ''}` : 'Select courses'} icon="plus" onPress={add} disabled={!picked.length} align="center" />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

// ── Testimonial requests ────────────────────────────────────────────────────────────
const REQUEST_STATUS = {
  open: ['Waiting', 'neutral'],
  submitted: ['Ready to review', 'accent'],
  approved: ['Approved', 'success'],
  declined: ['Declined', 'neutral'],
};

export function EndorseRequests({ testimonials, onChange, toast }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [busy, setBusy] = useState(false);
  const link = (t) => `${window.location.origin}/endorse/${t}`;

  const load = useCallback(() => api.listEndorse().then((r) => setItems(r.items)).catch((e) => { toast(e.message, 'error'); setItems([]); }), [toast]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const { item } = await api.createEndorse({ name, relationship });
      setItems((l) => [item, ...(l || [])]);
      navigator.clipboard?.writeText(link(item.token));
      toast(`Link for ${item.name} created and copied. Send it to them.`);
      setName('');
      setRelationship('');
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };

  const review = async (item, status) => {
    try {
      await api.reviewEndorse(item.token, status);
      if (status === 'approved') {
        const s = item.submission;
        onChange([{ id: uid('t'), name: s.name, role: s.role, org: s.org, quote: s.quote, link: s.link, photo: '', hidden: false }, ...testimonials]);
        toast(`${s.name}'s testimonial added. Publish to put it live.`);
      }
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete the request for ${item.name}? The link will stop working.`)) return;
    setItems((l) => l.filter((x) => x.token !== item.token));
    try { await api.deleteEndorse(item.token); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Feather name="send" size={17} color={colors.accentText} />
        <T variant="body" weight="600">Request a testimonial</T>
      </View>
      <T variant="small" color="secondary" style={{ marginBottom: 14 }}>Send a professor, OJT supervisor or teammate a private link. They write a few sentences, and you approve it here before it goes live.</T>
      <View style={{ flexDirection: isSm ? 'column' : 'row', gap: 10, alignItems: isSm ? 'stretch' : 'flex-end' }}>
        <Field label="Their name" value={name} onChange={setName} placeholder="Prof. Santos" style={{ flex: 1 }} />
        <Field label="They are your…" value={relationship} onChange={setRelationship} placeholder="Capstone adviser" style={{ flex: 1 }} onSubmitEditing={create} />
        <Button title="Create link" icon="link" onPress={create} loading={busy} disabled={!name.trim()} align={isSm ? 'start' : 'center'} />
      </View>

      {items && items.length ? (
        <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: colors.border }}>
          {items.map((item) => {
            const [label, tone] = REQUEST_STATUS[item.status] || REQUEST_STATUS.open;
            return (
              <View key={item.token} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <T variant="body" weight="600">{item.name}</T>
                      <Tag tone={tone}>{label}</Tag>
                    </View>
                    <T variant="caption" color="secondary">{[item.relationship, `asked ${relativeTime(item.createdAt)}`].filter(Boolean).join(' · ')}</T>
                  </View>
                  {item.status === 'open' ? <Button align="center" size="sm" variant="secondary" icon="copy" title="Copy link" onPress={() => { navigator.clipboard?.writeText(link(item.token)); toast('Link copied.'); }} /> : null}
                  {item.status === 'submitted' ? (
                    <>
                      <Button align="center" size="sm" variant="secondary" title="Decline" onPress={() => review(item, 'declined')} />
                      <Button align="center" size="sm" icon="check" title="Approve" onPress={() => review(item, 'approved')} />
                    </>
                  ) : null}
                  <MiniButton icon="trash-2" label="Delete request" danger onPress={() => remove(item)} />
                </View>
                {item.submission ? (
                  <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: RADIUS.md, padding: 14 }}>
                    <T variant="small" style={{ fontStyle: 'italic' }}>“{item.submission.quote}”</T>
                    <T variant="caption" color="secondary" style={{ marginTop: 6 }}>{[item.submission.name, item.submission.role, item.submission.org].filter(Boolean).join(' · ')}</T>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

// ── Inbox ───────────────────────────────────────────────────────────────────────────
export function InboxPanel({ onUnread, toast }) {
  const { colors } = useTheme();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { items: list } = await api.listMessages();
      setItems(list);
      onUnread(list.filter((m) => !m.read).length);
    } catch (e) { setError(e.message); }
  }, [onUnread]);
  useEffect(() => { load(); }, [load]);

  const setRead = async (m, read) => {
    setItems((list) => list.map((x) => (x.id === m.id ? { ...x, read } : x)));
    try { await api.updateMessage(m.id, { read }); load(); } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    setItems((list) => list.filter((x) => x.id !== m.id));
    try { await api.deleteMessage(m.id); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <View>
      <PanelHeader title="Inbox" subtitle="Messages sent through the contact form." action={<Button align="center" size="sm" variant="secondary" icon="refresh-cw" title="Refresh" onPress={load} />} />
      {error ? <T variant="small" style={{ color: colors.danger }}>{error}</T> : null}
      {!items && !error ? <ActivityIndicator color={colors.text2} /> : null}
      {items && items.length === 0 ? (
        <Card><View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}><Feather name="inbox" size={28} color={colors.text3} /><T variant="body" color="secondary">No messages yet.</T></View></Card>
      ) : null}
      <View style={{ gap: 12 }}>
        {(items || []).map((m) => (
          <Card key={m.id} style={{ borderLeftWidth: m.read ? 0 : 3, borderLeftColor: colors.accent }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <View style={{ flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <T variant="body" weight="600">{m.name}</T>
                  {!m.read ? <Tag tone="accent">New</Tag> : null}
                </View>
                <T variant="small" color="secondary">{m.email} · {relativeTime(m.createdAt)}{m.country ? ` · ${m.country}` : ''}</T>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Button align="center" size="sm" icon="corner-up-left" title="Reply" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`} onPress={() => !m.read && setRead(m, true)} />
                <Button align="center" size="sm" variant="secondary" title={m.read ? 'Mark unread' : 'Mark read'} onPress={() => setRead(m, !m.read)} />
                <MiniButton icon="trash-2" label="Delete" danger onPress={() => remove(m)} />
              </View>
            </View>
            <T variant="body" style={{ marginTop: 14 }} selectable>{m.message}</T>
          </Card>
        ))}
      </View>
    </View>
  );
}

// ── Backup and version history ──────────────────────────────────────────────────────
export function DataPanel({ draft, setDraft, onRestored, toast }) {
  const { colors } = useTheme();
  const [history, setHistory] = useState(null);

  const loadHistory = useCallback(() => api.listHistory().then((r) => setHistory(r.items)).catch((e) => toast(e.message, 'error')), [toast]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      try {
        const data = JSON.parse(await input.files[0].text());
        if (!data.profile) throw new Error('That file is not a portfolio backup.');
        setDraft(normalizeContent(data));
        toast('Backup loaded. Review it, then Publish.');
      } catch (e) { toast(e.message, 'error'); }
    };
    input.click();
  };
  const restore = async (item) => {
    if (!window.confirm(`Restore the version saved ${relativeTime(item.savedAt)}? The current live version is kept in history.`)) return;
    try {
      const { content } = await api.restoreHistory(item.key);
      onRestored(content);
      loadHistory();
      toast('Version restored and published.');
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <View style={{ marginTop: 32 }}>
      <PanelHeader title="Backup & history" subtitle="Every save keeps the previous version. The last 30 are kept." />
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Button align="center" size="sm" variant="secondary" icon="download" title="Export JSON backup" onPress={exportJson} />
          <Button align="center" size="sm" variant="secondary" icon="upload" title="Import backup" onPress={importJson} />
        </View>
      </Card>
      <Card padded={false}>
        {!history ? <View style={{ padding: 24 }}><ActivityIndicator color={colors.text2} /></View> : null}
        {history && history.length === 0 ? <T variant="small" color="secondary" style={{ padding: 24 }}>No earlier versions yet. They appear after your second save.</T> : null}
        {(history || []).map((h, i) => (
          <View key={h.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
            <View>
              <T variant="small" weight="500">{new Date(h.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</T>
              <T variant="caption" color="secondary">{relativeTime(h.savedAt)}</T>
            </View>
            <Button align="center" size="sm" variant="secondary" icon="rotate-ccw" title="Restore" onPress={() => restore(h)} />
          </View>
        ))}
      </Card>
    </View>
  );
}
