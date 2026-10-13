// src/admin/panels.js
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { Button, Card, T, Tag } from '../components/ui';
import { Field, Segmented } from '../components/Form';
import { FieldGroup, MiniButton } from './fields';
import { EmptyState, PanelHeader, SectionTitle, ToolCard, ToolbarButton, splitSections } from './kit';
import { COLLECTIONS, NETACAD_COURSES, NETACAD_ISSUER } from './schemas';
import { api } from '../lib/api';
import { relativeTime, uid } from '../lib/format';
import { normalizeContent } from '../data/defaults';
import { FONT, RADIUS } from '../theme/tokens';

export { PanelHeader };

// ── Form panel (profile, education, now, settings): one card per section ──────────
export function FormPanel({ title, subtitle, fields, value, onChange, children }) {
  const groups = splitSections(fields);
  return (
    <View style={{ maxWidth: 860 }}>
      <PanelHeader title={title} subtitle={subtitle} />
      <View style={{ gap: 16 }}>
        {groups.map((g, i) => (
          <Card key={g.title || i}>
            {g.title ? (
              <View style={{ marginBottom: 20 }}>
                <T variant="body" weight="600">{g.title}</T>
                {g.description ? <T variant="small" color="secondary" style={{ marginTop: 2 }}>{g.description}</T> : null}
              </View>
            ) : null}
            <FieldGroup fields={g.fields} value={value} onChange={onChange} />
          </Card>
        ))}
      </View>
      {children}
    </View>
  );
}

// "entry" → "entries", "role" → "roles".
const plural = (w) => (/[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);

// What each list shows when it's empty.
const EMPTY = {
  projects: ['box', 'No projects yet', 'Add your first project to show it in the Work section.', 'Add a project'],
  credentials: ['award', 'No credentials yet', 'Add Cisco certificates above, import Credly badges, or add one by hand.', 'Add a credential'],
  experience: ['briefcase', 'No experience yet', 'OJT, part-time work, freelance builds and org roles all count.', 'Add a role'],
  achievements: ['star', 'No honors or activities yet', "Dean's list, competitions, seminars, org leadership, volunteering.", 'Add an entry'],
  testimonials: ['message-square', 'No testimonials yet', 'Request one above, or add a quote you already have.', 'Add a testimonial'],
  skills: ['layers', 'No skill groups yet', 'Group skills like Languages, Frameworks and Tools.', 'Add a skill group'],
  resumes: ['file-text', 'No résumé versions yet', 'Create one version per kind of role you apply for.', 'Add a version'],
};

// ── List panel: a list on the left, the selected item's editor on the right ─────────
export function ListPanel({ name, items, onChange, content, extra, previewHref }) {
  const { colors } = useTheme();
  const { isLg } = useBreakpoint();
  const schema = COLLECTIONS[name];
  const [selectedId, setSelectedId] = useState(isLg ? items[0]?.id : null);
  const [query, setQuery] = useState('');
  const index = items.findIndex((x) => x.id === selectedId);
  const selected = items[index];

  useEffect(() => { if (isLg && !selected && items[0]) setSelectedId(items[0].id); }, [isLg, selected, items]);

  const add = () => { const n = schema.newItem(); onChange([n, ...items]); setSelectedId(n.id); };
  const update = (v) => onChange(items.map((x) => (x.id === selected.id ? (schema.beforeSave ? schema.beforeSave(v) : v) : x)));
  const remove = () => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${schema.label(selected)}"? You can undo this with Discard until you publish.`)) return;
    onChange(items.filter((x) => x.id !== selected.id));
    setSelectedId(isLg ? items.find((x) => x.id !== selected.id)?.id : null);
  };
  const duplicate = () => { const n = { ...selected, id: uid(name[0]), ...(selected.slug != null ? { slug: '' } : {}), [selected.title != null ? 'title' : 'name']: `${schema.label(selected)} copy` }; onChange([...items.slice(0, index + 1), n, ...items.slice(index + 1)]); setSelectedId(n.id); };
  const move = (i, d) => { const n = [...items]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };

  const q = query.trim().toLowerCase();
  const shown = items.map((item, i) => ({ item, i })).filter(({ item, i }) => !q || `${schema.label(item)} ${schema.sub(item, i)}`.toLowerCase().includes(q));
  const empty = EMPTY[name] || ['inbox', `No ${schema.title.toLowerCase()} yet`, '', `Add ${schema.singular}`];

  const header = (
    <PanelHeader
      title={schema.title}
      subtitle={`${items.length} ${items.length === 1 ? schema.singular : plural(schema.singular)} · shown on the site in this order`}
      action={<Button icon="plus" title={`New ${schema.singular}`} size="sm" onPress={add} align="center" />}
    />
  );

  if (!items.length) {
    return <View>{header}{extra}<EmptyState icon={empty[0]} title={empty[1]} description={empty[2]} actionTitle={empty[3]} onAction={add} /></View>;
  }

  const list = (
    <Card padded={false} style={{ width: isLg ? 320 : '100%', ...(isLg ? { position: 'sticky', top: 80, alignSelf: 'flex-start' } : null) }}>
      {items.length > 6 ? (
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Field value={query} onChange={setQuery} placeholder={`Search ${schema.title.toLowerCase()}`} inputStyle={{ height: 36, fontSize: 14 }} />
        </View>
      ) : null}
      <ScrollView style={{ maxHeight: isLg ? 'calc(100vh - 220px)' : undefined }}>
        {shown.map(({ item, i }, n) => {
          const on = item.id === selectedId;
          const thumb = schema.thumb?.(item);
          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedId(item.id)}
              style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: 8, borderTopWidth: n ? 1 : 0, borderTopColor: colors.border, backgroundColor: on ? colors.accentSoft : hovered ? colors.surfaceMuted : 'transparent', cursor: 'pointer' })}
            >
              {({ hovered }) => (
                <>
                  <View style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', backgroundColor: on ? colors.surface : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                    {thumb ? <Image source={{ uri: thumb }} style={{ width: 36, height: 36 }} resizeMode="contain" /> : (
                      <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: on ? colors.accentText : colors.text2 }}>{String(schema.label(item)).trim()[0]?.toUpperCase() || '?'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: on ? colors.accentText : colors.text }}>{schema.label(item)}</Text>
                    <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 12, color: colors.text2, marginTop: 1 }}>{schema.sub(item, i) || ' '}</Text>
                  </View>
                  {/* Reorder controls only appear where you're working, to keep the list calm. */}
                  {(hovered || on) && !q ? (
                    <View style={{ flexDirection: 'row' }}>
                      <MiniButton icon="chevron-up" label="Move up" disabled={i === 0} onPress={() => move(i, -1)} />
                      <MiniButton icon="chevron-down" label="Move down" disabled={i === items.length - 1} onPress={() => move(i, 1)} />
                    </View>
                  ) : null}
                </>
              )}
            </Pressable>
          );
        })}
        {!shown.length ? <T variant="small" color="secondary" style={{ padding: 16 }}>No matches.</T> : null}
      </ScrollView>
    </Card>
  );

  const editor = selected ? (
    <Card padded={false} style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {!isLg ? <Button variant="link" size="sm" icon="chevron-left" title={schema.title} onPress={() => setSelectedId(null)} align="center" /> : (
          <View style={{ flex: 1, minWidth: 0 }}>
            <T variant="body" weight="600" numberOfLines={1}>{schema.label(selected)}</T>
            <T variant="caption" color="secondary" numberOfLines={1}>{schema.sub(selected, index) || ' '}</T>
          </View>
        )}
        {!isLg ? <View style={{ flex: 1 }} /> : null}
        {previewHref ? <Button align="center" size="sm" variant="secondary" icon="eye" title="Preview" href={previewHref(selected, index)} external /> : null}
        <ToolbarButton icon="copy" label="Duplicate" onPress={duplicate} />
        <ToolbarButton icon="trash-2" label="Delete" danger onPress={remove} />
      </View>
      <View style={{ padding: 24 }}>
        <FieldGroup key={selected.id} fields={schema.fields} value={selected} onChange={update} context={content} />
      </View>
    </Card>
  ) : null;

  return (
    <View>
      {header}
      {extra}
      {isLg ? (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>{list}{editor}</View>
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
    <ToolCard icon="download-cloud" title="Import from Credly" description="Pulls every public badge with its image and verification link. Running it again refreshes them without duplicates." style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Field value={username} onChange={onUsername} placeholder="credly.com/users/your-name" autoCapitalize="none" style={{ flex: 1, minWidth: 220 }} />
        <Button align="center" title="Import badges" onPress={run} loading={busy} disabled={!username} icon="refresh-cw" />
      </View>
    </ToolCard>
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
    <ToolCard
      icon="globe"
      tint="#049fd9"
      title="Cisco Networking Academy certificates"
      description="Pick the courses you finished, then upload each certificate PDF from netacad.com."
      action={<Button align="center" size="sm" variant={open ? 'secondary' : 'primary'} title={open ? 'Close' : 'Choose courses'} onPress={() => setOpen((o) => !o)} />}
    >
      {open ? (
        <View style={{ gap: 14 }}>
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
    </ToolCard>
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
    <ToolCard icon="send" title="Request a testimonial" description="Send a professor, OJT supervisor or teammate a private link. You approve what they write before it goes live." style={{ marginBottom: 24 }}>
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
    </ToolCard>
  );
}

// ── Inbox ───────────────────────────────────────────────────────────────────────────
export function InboxPanel({ onUnread, toast }) {
  const { colors } = useTheme();
  const { isLg } = useBreakpoint();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { items: list } = await api.listMessages();
      setItems(list);
      onUnread(list.filter((m) => !m.read).length);
      setError('');
    } catch (e) { setError(e.message); }
  }, [onUnread]);
  useEffect(() => { load(); }, [load]);

  const visible = (items || []).filter((m) => filter === 'all' || !m.read);
  const selected = (items || []).find((m) => m.id === selectedId) || null;
  const unread = (items || []).filter((m) => !m.read).length;

  // On desktop, show the newest message right away, like Mail.
  useEffect(() => {
    if (isLg && !selected && visible.length) setSelectedId(visible[0].id);
  }, [isLg, selected, visible]);

  const setRead = useCallback(async (m, read) => {
    setItems((list) => list.map((x) => (x.id === m.id ? { ...x, read } : x)));
    onUnread((items || []).filter((x) => (x.id === m.id ? !read : !x.read)).length);
    try { await api.updateMessage(m.id, { read }); } catch (e) { toast(e.message, 'error'); }
  }, [items, onUnread, toast]);

  const open = useCallback((m) => {
    setSelectedId(m.id);
    if (!m.read) setRead(m, true);
  }, [setRead]);

  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}? This can't be undone.`)) return;
    const idx = visible.findIndex((x) => x.id === m.id);
    const nextSel = visible[idx + 1] || visible[idx - 1] || null;
    setItems((list) => list.filter((x) => x.id !== m.id));
    setSelectedId(isLg && nextSel ? nextSel.id : null);
    try { await api.deleteMessage(m.id); toast('Message deleted.'); load(); } catch (e) { toast(e.message, 'error'); }
  };

  // ↑ / ↓ move between messages on desktop.
  useEffect(() => {
    if (!isLg) return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target?.tagName) || !visible.length) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const i = Math.max(0, visible.findIndex((x) => x.id === selectedId));
      const n = visible[Math.min(visible.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (n) open(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLg, visible, selectedId, open]);

  const header = (
    <PanelHeader
      title="Inbox"
      subtitle={items ? `${items.length} message${items.length === 1 ? '' : 's'}${unread ? ` · ${unread} unread` : ''}` : 'Messages sent through your contact form.'}
      action={(
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Segmented options={[{ value: 'all', label: 'All' }, { value: 'unread', label: `Unread${unread ? ` (${unread})` : ''}` }]} value={filter} onChange={setFilter} />
          <ToolbarButton icon="refresh-cw" label="Refresh" onPress={load} />
        </View>
      )}
    />
  );

  if (error) return <View>{header}<Card><T variant="small" style={{ color: colors.danger }}>{error}</T></Card></View>;
  if (!items) return <View>{header}<View style={{ paddingVertical: 60 }}><ActivityIndicator color={colors.text2} /></View></View>;
  if (!items.length) {
    return (
      <View>
        {header}
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 56, gap: 10 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Feather name="inbox" size={24} color={colors.text3} /></View>
            <T variant="h3">No messages yet</T>
            <T variant="small" color="secondary" align="center">Messages from your contact form will appear here.</T>
          </View>
        </Card>
      </View>
    );
  }

  const list = (
    <View style={{ width: isLg ? 340 : '100%', borderRightWidth: isLg ? 1 : 0, borderRightColor: colors.border }}>
      {visible.length === 0 ? (
        <View style={{ padding: 28, alignItems: 'center' }}><T variant="small" color="secondary">You're all caught up.</T></View>
      ) : (
        <ScrollView style={{ maxHeight: isLg ? 'calc(100vh - 230px)' : undefined }}>
          {visible.map((m, i) => <MessageRow key={m.id} m={m} active={isLg && m.id === selectedId} first={i === 0} onPress={() => open(m)} />)}
        </ScrollView>
      )}
    </View>
  );

  const pane = selected ? (
    <MessagePane
      m={selected}
      onBack={isLg ? null : () => setSelectedId(null)}
      onToggleRead={() => setRead(selected, !selected.read)}
      onDelete={() => remove(selected)}
    />
  ) : (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 }}>
      <Feather name="mail" size={28} color={colors.text3} />
      <T variant="small" color="secondary">Select a message to read it.</T>
    </View>
  );

  return (
    <View>
      {header}
      <Card padded={false}>
        {isLg ? (
          <View style={{ flexDirection: 'row', minHeight: 'min(640px, calc(100vh - 230px))' }}>
            {list}
            <View style={{ flex: 1, minWidth: 0 }}>{pane}</View>
          </View>
        ) : selected ? pane : list}
      </Card>
      {isLg ? <T variant="caption" color="tertiary" style={{ marginTop: 12 }}>Tip: ↑ and ↓ move between messages. Reply opens your email app.</T> : null}
    </View>
  );
}

const initialsOf = (name) => String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function Avatar({ name, size = 36, highlight }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: highlight ? colors.accentSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONT, fontSize: size * 0.38, fontWeight: '600', color: highlight ? colors.accentText : colors.text2 }}>{initialsOf(name)}</Text>
    </View>
  );
}

const shortTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (now - d < 6 * 864e5) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function MessageRow({ m, active, first, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${m.read ? '' : 'Unread. '}${m.name}: ${m.message.slice(0, 80)}`}
      style={({ hovered }) => ({
        flexDirection: 'row', gap: 12, paddingVertical: 14, paddingLeft: 10, paddingRight: 16,
        borderTopWidth: first ? 0 : 1, borderTopColor: colors.border,
        backgroundColor: active ? colors.accentSoft : hovered ? colors.surfaceMuted : 'transparent', cursor: 'pointer',
      })}
    >
      <View style={{ width: 8, alignItems: 'center', paddingTop: 14 }}>
        {!m.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
      </View>
      <Avatar name={m.name} highlight={!m.read} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT, fontSize: 15, fontWeight: m.read ? '500' : '700', color: colors.text }}>{m.name}</Text>
          <Text style={{ fontFamily: FONT, fontSize: 12, color: !m.read ? colors.accentText : colors.text3, fontVariant: ['tabular-nums'] }}>{shortTime(m.createdAt)}</Text>
        </View>
        <Text numberOfLines={2} style={{ fontFamily: FONT, fontSize: 13, lineHeight: 18, color: colors.text2, marginTop: 3 }}>{m.message}</Text>
      </View>
    </Pressable>
  );
}

function MessagePane({ m, onBack, onToggleRead, onDelete }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const when = new Date(m.createdAt).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const reply = `mailto:${m.email}?subject=${encodeURIComponent('Re: your message on my portfolio')}&body=${encodeURIComponent(`\n\n---\nOn ${when}, ${m.name} wrote:\n> ${m.message.replace(/\n/g, '\n> ')}`)}`;
  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar: every control is 34pt and centered on one line. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: isSm ? 12 : 20, height: 56, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {onBack ? <Button align="center" size="sm" variant="link" icon="chevron-left" title="Inbox" onPress={onBack} /> : null}
        <View style={{ flex: 1 }} />
        <Button align="center" size="sm" icon="corner-up-left" title="Reply" href={reply} external />
        <Button align="center" size="sm" variant="secondary" icon={m.read ? 'mail' : 'check'} title={isSm ? '' : m.read ? 'Mark unread' : 'Mark read'} accessibilityLabel={m.read ? 'Mark unread' : 'Mark read'} onPress={onToggleRead} />
        <ToolbarButton icon="trash-2" label="Delete" danger onPress={onDelete} />
      </View>

      <View style={{ padding: isSm ? 20 : 32, maxWidth: 720 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={m.name} size={48} highlight />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T variant="h3" numberOfLines={1}>{m.name}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <Button variant="link" size="sm" title={m.email} href={`mailto:${m.email}`} external />
              {m.country ? <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text3 }}>· {m.country}</Text> : null}
            </View>
          </View>
        </View>
        <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text3, marginTop: 18 }}>{when}</Text>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 18 }} />
        <Text selectable style={{ fontFamily: FONT, fontSize: 16, lineHeight: 26, color: colors.text, whiteSpace: 'pre-wrap' }}>{m.message}</Text>
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
