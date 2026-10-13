// src/admin/AdminScreen.js
// /admin: edit everything on the site. Changes stay in a local draft until you Save,
// which publishes them instantly (and keeps the previous version in history).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent, PREVIEW_KEY } from '../context/ContentContext';
import { storage } from '../lib/storage';
import { api, getToken } from '../lib/api';
import { relativeTime, slugify } from '../lib/format';
import { normalizeContent } from '../data/defaults';
import { Button, Card, IconButton, T } from '../components/ui';
import { Field } from '../components/Form';
import { ProgressBar } from '../components/Cards';
import { CiscoQuickAdd, CredlyImport, DataPanel, EndorseRequests, FormPanel, InboxPanel, ListPanel, PanelHeader } from './panels';
import { InsightsPanel, LinksPanel } from './insights';
import { refreshShareCards } from './sharecards';
import { EDUCATION_FIELDS, NOW_FIELDS, PROFILE_FIELDS, SETTINGS_FIELDS } from './schemas';
import { FONT, RADIUS } from '../theme/tokens';

const isWeb = Platform.OS === 'web';


// Fill and de-duplicate URL slugs right before publishing.
function finalize(content) {
  const seen = new Set();
  const projects = content.projects.map((p) => {
    let slug = slugify(p.slug || p.title) || p.id;
    let n = 2;
    const base = slug;
    while (seen.has(slug)) slug = `${base}-${n++}`;
    seen.add(slug);
    return { ...p, slug };
  });
  const resumes = content.resumes.map((r) => ({ ...r, slug: slugify(r.slug) }));
  return { ...content, projects, resumes };
}

export default function AdminScreen() {
  const [authed, setAuthed] = useState(null); // null = checking

  useEffect(() => {
    if (!getToken()) { setAuthed(false); return; }
    api.checkSession().then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  if (authed === null) return <Centered><ActivityIndicator /></Centered>;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { api.logout(); setAuthed(false); }} />;
}

function Centered({ children }) {
  const { colors } = useTheme();
  return <View style={{ flex: 1, minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pageAlt, padding: 20 }}>{children}</View>;
}

function Login({ onDone }) {
  const { colors } = useTheme();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!pw) return;
    setBusy(true);
    setError('');
    try { await api.login(pw); onDone(); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Centered>
      <View style={{ width: '100%', maxWidth: 380 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.inverse, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Feather name="lock" size={24} color={colors.onInverse} />
          </View>
          <T variant="h2" align="center">Portfolio admin</T>
          <T variant="small" color="secondary" align="center" style={{ marginTop: 6 }}>Sign in to edit your site.</T>
        </View>
        <Card>
          <Field label="Password" value={pw} onChange={setPw} secureTextEntry autoFocus onSubmitEditing={submit} error={error} autoComplete="current-password" />
          <Button title="Sign in" onPress={submit} loading={busy} disabled={!pw} size="lg" style={{ alignSelf: 'stretch', marginTop: 16 }} />
        </Card>
        <Button variant="link" size="sm" title="Back to site" href="/" icon="chevron-left" style={{ alignSelf: 'center', marginTop: 20 }} />
      </View>
    </Centered>
  );
}

function Toast({ toast }) {
  const { colors } = useTheme();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={{ position: isWeb ? 'fixed' : 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center', zIndex: 200, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: toast.tone === 'error' ? colors.danger : colors.inverse, paddingHorizontal: 18, paddingVertical: 12, borderRadius: RADIUS.pill, maxWidth: 560, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', animationKeyframes: [{ from: { opacity: 0, transform: [{ translateY: 12 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } }], animationDuration: '250ms' }}>
        <Feather name={toast.tone === 'error' ? 'alert-circle' : 'check-circle'} size={16} color={toast.tone === 'error' ? '#fff' : colors.onInverse} />
        <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '500', color: toast.tone === 'error' ? '#fff' : colors.onInverse, flexShrink: 1 }}>{toast.message}</Text>
      </View>
    </View>
  );
}

const DRAFT_KEY = 'rj.admin.draft';

function Dashboard({ onLogout }) {
  const { colors } = useTheme();
  const { isLg, isSm } = useBreakpoint();
  const { content, setContent, source } = useContent();
  const [draft, setDraft] = useState(() => normalizeContent(content));
  const [baseline, setBaseline] = useState(() => JSON.stringify(normalizeContent(content)));
  const [panel, setPanel] = useState(() => (isWeb && window.location.hash.slice(1)) || 'overview');
  const [saving, setSaving] = useState(false);
  const [toastState, setToastState] = useState(null);
  const [unread, setUnread] = useState(0);
  const [restore, setRestore] = useState(() => {
    const saved = storage.get(DRAFT_KEY);
    return saved && JSON.stringify(saved.draft) !== JSON.stringify(normalizeContent(content)) ? saved : null;
  });
  const timer = useRef(null);
  const dirty = useMemo(() => JSON.stringify(draft) !== baseline, [draft, baseline]);

  const toast = useCallback((message, tone = 'ok') => {
    clearTimeout(timer.current);
    setToastState({ message, tone });
    timer.current = setTimeout(() => setToastState(null), tone === 'error' ? 5000 : 3000);
  }, []);

  // Pick up the live copy if it arrives after the admin opened (and nothing is edited yet).
  useEffect(() => {
    if (!dirty) { const n = normalizeContent(content); setDraft(n); setBaseline(JSON.stringify(n)); }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep unsaved work in this browser, so a closed tab or crash never loses edits.
  useEffect(() => {
    const t = setTimeout(() => {
      if (dirty) storage.set(DRAFT_KEY, { draft, at: new Date().toISOString() });
      else if (!restore) storage.remove(DRAFT_KEY);
    }, 500);
    return () => clearTimeout(t);
  }, [draft, dirty, restore]);

  useEffect(() => { api.listMessages().then((r) => setUnread(r.items.filter((m) => !m.read).length)).catch(() => {}); }, []);

  const save = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      // Redraw link-preview images that changed, then publish everything together.
      const { content: withCards } = await refreshShareCards(finalize(draft));
      const { content: saved } = await api.saveContent(withCards);
      const n = normalizeContent(saved);
      setContent(n);
      setDraft(n);
      setBaseline(JSON.stringify(n));
      storage.remove(DRAFT_KEY);
      toast('Published. Your site is updated.');
    } catch (e) {
      toast(e.status === 401 ? 'Session expired. Your edits are kept in this browser; sign in again to publish.' : e.message, 'error');
      if (e.status === 401) setTimeout(onLogout, 2500);
    }
    setSaving(false);
  }, [dirty, saving, draft, setContent, toast, onLogout]);

  const discard = () => {
    if (!window.confirm('Discard all unsaved changes?')) return;
    setDraft(JSON.parse(baseline));
    storage.remove(DRAFT_KEY);
  };

  const preview = () => {
    storage.set(PREVIEW_KEY, finalize(draft));
    window.open('/?preview=1', '_blank', 'noopener');
  };

  useEffect(() => {
    if (!isWeb) return undefined;
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    const onLeave = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('keydown', onKey, true); // capture: inputs don't swallow it
    window.addEventListener('beforeunload', onLeave);
    return () => { window.removeEventListener('keydown', onKey, true); window.removeEventListener('beforeunload', onLeave); };
  }, [save, dirty]);

  const go = (id) => {
    setPanel(id);
    if (isWeb) { window.history.replaceState({}, '', `/admin#${id}`); window.scrollTo(0, 0); }
  };
  const set = (key) => (v) => setDraft((d) => ({ ...d, [key]: v }));

  const body = (() => {
    switch (panel) {
      case 'insights': return <InsightsPanel content={draft} go={go} />;
      case 'links': return <LinksPanel content={draft} toast={toast} />;
      case 'profile': return <FormPanel title="Profile" subtitle="Your name, story, photo and links." fields={PROFILE_FIELDS} value={draft.profile} onChange={set('profile')} />;
      case 'now': return <FormPanel title="Now" subtitle="What you're focused on right now. Keep it fresh: it shows when it was last updated." fields={NOW_FIELDS} value={draft.now} onChange={set('now')} />;
      case 'education': return <FormPanel title="Education" subtitle="The progress bar on your site is calculated from these dates." fields={EDUCATION_FIELDS} value={draft.education} onChange={set('education')} />;
      case 'projects': return <ListPanel name="projects" items={draft.projects} onChange={set('projects')} content={draft} />;
      case 'credentials': return (
        <ListPanel
          name="credentials" items={draft.credentials} onChange={set('credentials')} content={draft}
          extra={(
            <>
              <CiscoQuickAdd credentials={draft.credentials} onChange={set('credentials')} toast={toast} />
              <CredlyImport username={draft.settings.credlyUsername} onUsername={(v) => setDraft((d) => ({ ...d, settings: { ...d.settings, credlyUsername: v } }))} credentials={draft.credentials} onChange={set('credentials')} toast={toast} />
            </>
          )}
        />
      );
      case 'experience': return <ListPanel name="experience" items={draft.experience} onChange={set('experience')} content={draft} />;
      case 'achievements': return <ListPanel name="achievements" items={draft.achievements} onChange={set('achievements')} content={draft} />;
      case 'testimonials': return <ListPanel name="testimonials" items={draft.testimonials} onChange={set('testimonials')} content={draft} extra={<EndorseRequests testimonials={draft.testimonials} onChange={set('testimonials')} toast={toast} />} />;
      case 'skills': return <ListPanel name="skills" items={draft.skills} onChange={set('skills')} content={draft} />;
      case 'resumes': return <ListPanel name="resumes" items={draft.resumes} onChange={set('resumes')} content={draft} previewHref={(r, i) => (i === 0 ? '/resume' : `/resume/${slugify(r.slug) || r.id}`)} />;
      case 'inbox': return <InboxPanel onUnread={setUnread} toast={toast} />;
      case 'settings': return (
        <FormPanel title="Settings" subtitle="Search appearance and site options." fields={SETTINGS_FIELDS} value={draft.settings} onChange={set('settings')}>
          <DataPanel draft={draft} setDraft={setDraft} toast={toast} onRestored={(c) => { const n = normalizeContent(c); setContent(n); setDraft(n); setBaseline(JSON.stringify(n)); }} />
        </FormPanel>
      );
      default: return <Overview draft={draft} unread={unread} go={go} source={source} />;
    }
  })();

  const counts = { inbox: unread };

  return (
    <View style={{ flex: 1, minHeight: '100vh', backgroundColor: colors.pageAlt }}>
      <TopBar
        initials={draft.profile.initials}
        dirty={dirty}
        saving={saving}
        updatedAt={draft.updatedAt}
        onSave={save}
        onDiscard={discard}
        onPreview={preview}
        onLogout={() => { if (!dirty || window.confirm('Sign out? Your unsaved edits stay in this browser.')) onLogout(); }}
      />

      <View style={{ flexDirection: isLg ? 'row' : 'column', flex: 1, width: '100%', maxWidth: 1320, alignSelf: 'center' }}>
        {isLg ? (
          <View style={{ width: 236, paddingHorizontal: 14, paddingVertical: 18, position: 'sticky', top: 56, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)', overflow: 'auto' }}>
            {NAV_GROUPS.map((g) => (
              <View key={g.title || 'main'} style={{ marginBottom: 14 }}>
                {g.title ? <Text style={{ fontFamily: FONT, fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', color: colors.text3, paddingHorizontal: 12, marginBottom: 6 }}>{g.title}</Text> : null}
                {g.items.map((p) => <NavItem key={p.id} item={p} active={p.id === panel} badge={counts[p.id]} onPress={() => go(p.id)} />)}
              </View>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingVertical: 10 }} style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.glass }}>
            {NAV_GROUPS.flatMap((g) => g.items).map((p) => <NavItem key={p.id} item={p} active={p.id === panel} badge={counts[p.id]} onPress={() => go(p.id)} pill />)}
          </ScrollView>
        )}
        <View style={{ flex: 1, padding: isSm ? 16 : 28, paddingBottom: 96, minWidth: 0 }}>
          {restore ? (
            <Card style={{ marginBottom: 20, borderWidth: 1, borderColor: colors.warning, padding: 16 }}>
              <View style={{ flexDirection: isSm ? 'column' : 'row', alignItems: isSm ? 'flex-start' : 'center', gap: 12 }}>
                <Feather name="clock" size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <T variant="small" weight="600">You have unpublished edits from {relativeTime(restore.at)}.</T>
                  <T variant="caption" color="secondary">They were kept in this browser. Restore them to keep working, or discard them.</T>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button size="sm" variant="secondary" title="Discard" align="center" onPress={() => { storage.remove(DRAFT_KEY); setRestore(null); }} />
                  <Button size="sm" title="Restore edits" align="center" onPress={() => { setDraft(normalizeContent(restore.draft)); setRestore(null); toast('Edits restored. Review them, then Publish.'); }} />
                </View>
              </View>
            </Card>
          ) : null}
          {body}
        </View>
      </View>
      <Toast toast={toastState} />
    </View>
  );
}

const NAV_GROUPS = [
  { items: [{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'insights', label: 'Insights', icon: 'bar-chart-2' }] },
  {
    title: 'Content',
    items: [
      { id: 'profile', label: 'Profile', icon: 'user' },
      { id: 'now', label: 'Now', icon: 'clock' },
      { id: 'projects', label: 'Projects', icon: 'box' },
      { id: 'credentials', label: 'Credentials', icon: 'award' },
      { id: 'experience', label: 'Experience', icon: 'briefcase' },
      { id: 'achievements', label: 'Honors', icon: 'star' },
      { id: 'testimonials', label: 'Testimonials', icon: 'message-square' },
      { id: 'education', label: 'Education', icon: 'book-open' },
      { id: 'skills', label: 'Skills', icon: 'layers' },
    ],
  },
  {
    title: 'Career',
    items: [
      { id: 'resumes', label: 'Résumé', icon: 'file-text' },
      { id: 'links', label: 'Share links', icon: 'link' },
      { id: 'inbox', label: 'Inbox', icon: 'inbox' },
    ],
  },
  { title: 'Site', items: [{ id: 'settings', label: 'Settings', icon: 'settings' }] },
];

function NavItem({ item, active, badge, onPress, pill }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ hovered }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 10, height: pill ? 34 : 34, paddingHorizontal: 12,
        borderRadius: pill ? RADIUS.pill : 8,
        backgroundColor: active ? (pill ? colors.inverse : colors.accentSoft) : hovered ? colors.surfaceMuted : 'transparent',
        cursor: 'pointer', marginBottom: pill ? 0 : 2,
      })}
    >
      {!pill ? <Feather name={item.icon} size={16} color={active ? colors.accentText : colors.text2} /> : null}
      <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 14, fontWeight: active ? '600' : '500', color: active ? (pill ? colors.onInverse : colors.accentText) : colors.text, flex: pill ? undefined : 1 }}>{item.label}</Text>
      {badge ? (
        <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ fontFamily: FONT, fontSize: 11, fontWeight: '700', color: '#fff' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// Toolbar: status on the left, actions on the right, every control 34pt tall and centered
// on one line.
function TopBar({ initials, dirty, saving, updatedAt, onSave, onDiscard, onPreview, onLogout }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);

  const status = saving
    ? { icon: null, color: colors.text2, text: 'Publishing…' }
    : dirty
      ? { icon: 'circle', color: colors.warning, text: 'Unsaved changes' }
      : { icon: 'check-circle', color: colors.success, text: updatedAt ? `Published ${relativeTime(updatedAt)}` : 'Up to date' };

  const Divider = () => <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 }} />;

  return (
    <View style={{ position: isWeb ? 'sticky' : 'relative', top: 0, zIndex: 40, height: 56, backgroundColor: colors.glass, backdropFilter: 'saturate(180%) blur(20px)', borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: isSm ? 12 : 20, width: '100%', maxWidth: 1320, alignSelf: 'center' }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.inverse, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT, fontSize: 11, fontWeight: '700', color: colors.onInverse }}>{initials || 'RJ'}</Text>
        </View>
        {!isSm ? <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors.text }}>Admin</Text> : null}
        {!isSm ? <Divider /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 }} accessibilityLiveRegion="polite">
          {saving ? <ActivityIndicator size="small" color={colors.text2} />
            : dirty ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status.color }} />
              : <Feather name={status.icon} size={14} color={status.color} />}
          {!isSm || dirty ? <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 13, color: colors.text2 }}>{isSm ? 'Unsaved' : status.text}</Text> : null}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isSm ? (
            <>
              <IconButton icon="eye" label="Preview unpublished changes" onPress={onPreview} size={34} />
              {dirty ? <IconButton icon="rotate-ccw" label="Discard changes" onPress={onDiscard} size={34} /> : null}
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" icon="eye" title="Preview" onPress={onPreview} align="center" />
              {dirty ? <Button size="sm" variant="secondary" title="Discard" onPress={onDiscard} align="center" /> : null}
            </>
          )}
          <Button size="sm" title="Publish" icon={saving ? 'loader' : 'upload-cloud'} onPress={onSave} disabled={!dirty || saving} align="center" accessibilityLabel="Publish changes (Ctrl+S)" />
          {!isSm ? <Divider /> : null}
          {!isSm ? <IconButton icon="external-link" label="View site" href="/" size={34} /> : null}
          <IconButton icon="log-out" label="Sign out" onPress={onLogout} size={34} />
        </View>
      </View>
    </View>
  );
}

function Overview({ draft, unread, go, source }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const [week, setWeek] = useState(null);
  useEffect(() => { api.insights(7).then(setWeek).catch(() => {}); }, []);

  const nowAge = draft.now.updated ? (Date.now() - new Date(`${draft.now.updated}-01`).getTime()) / 864e5 : 999;
  const stats = [
    { label: 'Visits this week', value: week ? week.totals.visits : '–', panel: 'insights', icon: 'users' },
    { label: 'Résumé opens this week', value: week ? week.totals.resume : '–', panel: 'insights', icon: 'file-text' },
    { label: 'Credentials', value: draft.credentials.length, panel: 'credentials', icon: 'award' },
    { label: 'Unread messages', value: unread, panel: 'inbox', icon: 'inbox' },
  ];
  const checklist = [
    { done: !!draft.profile.avatar, label: 'Add a profile photo', panel: 'profile' },
    { done: !!draft.profile.email || draft.profile.socials.length > 1, label: 'Add an email or LinkedIn so recruiters can reach you', panel: 'profile' },
    { done: draft.credentials.some((c) => c.issuer === 'Cisco Networking Academy' && c.file), label: 'Add your Cisco NetAcad certificates (PDF)', panel: 'credentials' },
    { done: draft.credentials.some((c) => c.credlyId), label: 'Import your Credly badges', panel: 'credentials' },
    { done: draft.projects.some((p) => p.cover || p.gallery?.length), label: 'Upload screenshots for a featured project', panel: 'projects' },
    { done: draft.projects.some((p) => p.body), label: 'Write a full case study for your best project', panel: 'projects' },
    { done: draft.experience.length > 0, label: 'Add experience (OJT, freelance, org roles)', panel: 'experience' },
    { done: draft.achievements.length > 0, label: "Add honors or activities (Dean's list, orgs, hackathons)", panel: 'achievements' },
    { done: draft.resumes.length > 1, label: 'Create a tailored résumé (e.g. Networking vs. Development)', panel: 'resumes' },
    { done: nowAge < 60, label: 'Refresh your "Now" section (older than 2 months)', panel: 'now' },
  ];
  const left = checklist.filter((c) => !c.done).length;
  const name = (draft.profile.name.split(' ')[0] || '').length > 1 ? draft.profile.name.split(' ')[0] : draft.profile.initials || 'there';

  return (
    <View>
      <PanelHeader
        title={`Hi, ${name}.`}
        subtitle={source === 'live' ? `Your site was last published ${draft.updatedAt ? relativeTime(draft.updatedAt) : 'never'}.` : 'Showing starter content. Publish once to put it live.'}
        action={(
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button size="sm" variant="secondary" icon="credit-card" title="Business card" href="/card" external align="center" />
            <Button size="sm" variant="secondary" icon="link" title="New share link" onPress={() => go('links')} align="center" />
            <Button size="sm" variant="secondary" icon="file-text" title="Résumé" href="/resume" external align="center" />
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        {stats.map((s) => (
          <Card key={s.label} onPress={() => go(s.panel)} style={{ flexGrow: 1, flexBasis: isSm ? '40%' : 160 }}>
            <Feather name={s.icon} size={18} color={colors.accentText} />
            <T variant="title" style={{ marginTop: 12, fontVariant: ['tabular-nums'] }}>{s.value}</T>
            <T variant="small" color="secondary">{s.label}</T>
          </Card>
        ))}
      </View>
      <Card padded={false}>
        <View style={{ padding: 20, paddingBottom: 8 }}>
          <T variant="h3">{left ? `Polish your portfolio · ${left} to go` : 'Your portfolio is complete'}</T>
          <T variant="small" color="secondary" style={{ marginTop: 4 }}>Small things that make the biggest difference to recruiters.</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <View style={{ flex: 1 }}><ProgressBar value={(checklist.length - left) / checklist.length} /></View>
            <T variant="caption" color="secondary" style={{ fontVariant: ['tabular-nums'] }}>{checklist.length - left} of {checklist.length}</T>
          </View>
        </View>
        {checklist.map((c, i) => (
          <Pressable key={c.label} onPress={() => go(c.panel)} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, backgroundColor: hovered ? colors.surfaceMuted : 'transparent', cursor: 'pointer' })}>
            <Feather name={c.done ? 'check-circle' : 'circle'} size={18} color={c.done ? colors.success : colors.text3} />
            <Text style={{ flex: 1, fontFamily: FONT, fontSize: 15, color: c.done ? colors.text3 : colors.text, textDecorationLine: c.done ? 'line-through' : 'none' }}>{c.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.text3} />
          </Pressable>
        ))}
      </Card>
      <T variant="caption" color="tertiary" style={{ marginTop: 20 }}>Tip: {isWeb && /Mac/.test(navigator.platform) ? '⌘S' : 'Ctrl+S'} publishes from anywhere. Unpublished edits are kept in this browser automatically.</T>
    </View>
  );
}
