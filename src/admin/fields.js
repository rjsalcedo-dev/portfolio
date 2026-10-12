// src/admin/fields.js
// Schema-driven form fields. Each editor describes its fields as data; FieldRenderer turns
// a field description into the right control.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { Checkbox, Field, FieldLabel, Segmented, Toggle } from '../components/Form';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { compressImage, pdfPreview } from '../lib/media';
import { FONT, RADIUS } from '../theme/tokens';

export const getIn = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
export const setIn = (obj, path, value) => {
  const [k, ...rest] = path.split('.');
  const base = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  base[k] = rest.length ? setIn(base[k], rest.join('.'), value) : value;
  return base;
};

// Opens the browser's file picker. Resolves with the chosen File(s), or null if cancelled.
export function pickFiles(accept = 'image/*', multiple = false) {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web') { reject(new Error('Uploads work in the browser.')); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve(input.files?.length ? [...input.files] : null);
    input.click();
  });
}

// Shrinks photos, uploads, and resolves with the hosted URL.
export const uploadFile = async (file) => (await api.upload(await compressImage(file))).url;

export async function pickAndUpload(accept = 'image/*') {
  const files = await pickFiles(accept);
  return files ? uploadFile(files[0]) : null;
}

// Text that maps to an array: comma-separated tags, or one item per line.
function DelimitedField({ value, onChange, separator, ...rest }) {
  const join = (arr) => (arr || []).join(separator === ',' ? ', ' : '\n');
  const parse = (t) => t.split(separator === ',' ? ',' : '\n').map((s) => s.trim()).filter(Boolean);
  const [raw, setRaw] = useState(join(value));
  useEffect(() => {
    if (JSON.stringify(parse(raw)) !== JSON.stringify(value || [])) setRaw(join(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Field {...rest} value={raw} onChange={(t) => { setRaw(t); onChange(parse(t)); }} />;
}

function ImageField({ label, hint, value, onChange, accept }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async () => {
    setError('');
    setBusy(true);
    try { const url = await pickAndUpload(accept); if (url) onChange(url); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const isPdf = /\.pdf$/i.test(value || '');
  return (
    <View>
      <FieldLabel label={label} hint={hint} />
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: colors.surfaceMuted, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {busy ? <ActivityIndicator color={colors.text2} /> : value && !isPdf ? <Image source={{ uri: value }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Feather name={isPdf ? 'file-text' : 'image'} size={22} color={colors.text3} />}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" icon="upload" title={value ? 'Replace' : 'Upload'} onPress={upload} disabled={busy} />
            {value ? <Button size="sm" variant="danger" title="Remove" onPress={() => onChange('')} /> : null}
          </View>
          <Field value={value} onChange={onChange} placeholder="…or paste an image URL" autoCapitalize="none" inputStyle={{ height: 36, fontSize: 13 }} />
        </View>
      </View>
      {error ? <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.danger, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}

// A certificate file (PDF or image). PDFs get a page-1 preview rendered in the browser,
// which becomes the card image on the site. onChange receives { file, preview }.
function DocumentField({ label, hint, value, onChange }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const upload = async () => {
    setError('');
    try {
      const files = await pickFiles('application/pdf,image/*');
      if (!files) return;
      const file = files[0];
      if (file.type === 'application/pdf') {
        setBusy('Creating preview…');
        let preview = null;
        try { preview = await uploadFile(await pdfPreview(file)); } catch { /* the PDF still uploads without a preview */ }
        setBusy('Uploading PDF…');
        onChange({ file: await uploadFile(file), preview });
      } else {
        setBusy('Uploading…');
        const url = await uploadFile(file);
        onChange({ file: url, preview: url });
      }
    } catch (e) { setError(e.message); }
    setBusy('');
  };
  const name = value ? decodeURIComponent(value.split('/').pop()).replace(/^[a-z0-9]+-/, '') : '';
  return (
    <View>
      <FieldLabel label={label} hint={hint} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: value ? 'solid' : 'dashed', borderColor: colors.borderStrong, borderRadius: RADIUS.md, padding: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          {busy ? <ActivityIndicator color={colors.accentText} size="small" /> : <Feather name={value ? 'file-text' : 'upload-cloud'} size={18} color={colors.accentText} />}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 14, fontWeight: '500', color: colors.text }}>{busy || name || 'No file yet'}</Text>
          <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text2 }}>{value ? 'Visitors can open it from the credential' : 'Upload the PDF from netacad.com → Learning → Certificates'}</Text>
        </View>
        {value ? <Button size="sm" variant="secondary" title="Open" href={value} external align="center" /> : null}
        <Button size="sm" variant={value ? 'secondary' : 'primary'} title={value ? 'Replace' : 'Upload'} onPress={upload} disabled={!!busy} align="center" />
        {value ? <MiniButton icon="x" label="Remove file" onPress={() => onChange({ file: '', preview: null })} /> : null}
      </View>
      {error ? <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.danger, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}

// Screenshot gallery: multi-upload, captions, reorder.
function GalleryField({ label, hint, value, onChange }) {
  const { colors } = useTheme();
  const items = value || [];
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState('');
  const add = async () => {
    setError('');
    try {
      const files = await pickFiles('image/*', true);
      if (!files) return;
      setBusy(files.length);
      const added = [];
      for (const f of files) { added.push({ url: await uploadFile(f), caption: '' }); setBusy((n) => n - 1); }
      onChange([...items, ...added]);
    } catch (e) { setError(e.message); }
    setBusy(0);
  };
  const update = (i, patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i, d) => { const n = [...items]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
  return (
    <View>
      <FieldLabel label={label} hint={hint} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {items.map((g, i) => (
          <View key={g.url + i} style={{ width: 200, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, overflow: 'hidden' }}>
            <Image source={{ uri: g.url }} style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceMuted }} resizeMode="cover" />
            <View style={{ padding: 8, gap: 6 }}>
              <Field value={g.caption} onChange={(v) => update(i, { caption: v })} placeholder="Caption (optional)" inputStyle={{ height: 32, fontSize: 13, paddingHorizontal: 10 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <MiniButton icon="arrow-left" label="Move left" disabled={i === 0} onPress={() => move(i, -1)} />
                <MiniButton icon="arrow-right" label="Move right" disabled={i === items.length - 1} onPress={() => move(i, 1)} />
                <MiniButton icon="trash-2" label="Remove" danger onPress={() => onChange(items.filter((_, j) => j !== i))} />
              </View>
            </View>
          </View>
        ))}
        <Pressable onPress={add} disabled={!!busy} style={({ hovered }) => ({ width: 200, minHeight: 125, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: hovered ? colors.surfaceMuted : 'transparent', cursor: 'pointer' })}>
          {busy ? <ActivityIndicator color={colors.text2} /> : <Feather name="plus" size={20} color={colors.text2} />}
          <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text2 }}>{busy ? `Uploading ${busy}…` : 'Add screenshots'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.danger, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}

// Small inline repeater for lists of objects (social links, "Now" items).
function ListField({ label, hint, value, onChange, fields, newItem }) {
  const { colors } = useTheme();
  const items = value || [];
  const update = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  const move = (i, d) => { const n = [...items]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
  return (
    <View>
      <FieldLabel label={label} hint={hint} />
      <View style={{ gap: 10 }}>
        {items.map((item, i) => (
          <View key={i} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {fields.map((f) => (
                <View key={f.key} style={{ flex: f.flex || 1, minWidth: 140 }}>
                  <FieldRenderer field={{ ...f, label: i === 0 ? f.label : undefined }} value={getIn(item, f.key)} onChange={(v) => update(i, setIn(item, f.key, v))} />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'flex-end' }}>
              <MiniButton icon="arrow-up" label="Move up" disabled={i === 0} onPress={() => move(i, -1)} />
              <MiniButton icon="arrow-down" label="Move down" disabled={i === items.length - 1} onPress={() => move(i, 1)} />
              <MiniButton icon="trash-2" label="Remove" danger onPress={() => onChange(items.filter((_, j) => j !== i))} />
            </View>
          </View>
        ))}
        <Button size="sm" variant="secondary" icon="plus" title="Add" onPress={() => onChange([...items, newItem ? newItem() : {}])} />
      </View>
    </View>
  );
}

export function MiniButton({ icon, label, onPress, disabled, danger }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={({ hovered }) => ({ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered && !disabled ? colors.surfaceMuted : 'transparent', opacity: disabled ? 0.3 : 1, cursor: disabled ? 'default' : 'pointer' })}>
      <Feather name={icon} size={15} color={danger ? colors.danger : colors.text2} />
    </Pressable>
  );
}

function PickField({ label, hint, value, onChange, options }) {
  const { colors } = useTheme();
  const selected = value || [];
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <View>
      <FieldLabel label={label} hint={hint || `${selected.length} selected`} right={options.length ? (
        <Pressable onPress={() => onChange(selected.length === options.length ? [] : options.map((o) => o.id))}>
          <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.accentText }}>{selected.length === options.length ? 'Clear' : 'Select all'}</Text>
        </Pressable>
      ) : null} />
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 4, maxHeight: 300, overflow: 'auto' }}>
        {options.length ? options.map((o) => <Checkbox key={o.id} checked={selected.includes(o.id)} label={o.label} sub={o.sub} onChange={() => toggle(o.id)} />)
          : <Text style={{ fontFamily: FONT, fontSize: 14, color: colors.text3, padding: 12 }}>Nothing to pick yet.</Text>}
      </View>
    </View>
  );
}

export function FieldRenderer({ field, value, onChange, context }) {
  const common = { label: field.label, hint: field.hint, placeholder: field.placeholder };
  switch (field.type) {
    case 'textarea': return <Field {...common} value={value} onChange={onChange} multiline rows={field.rows || 4} />;
    case 'url': return <Field {...common} value={value} onChange={onChange} autoCapitalize="none" keyboardType="url" placeholder={field.placeholder || 'https://'} />;
    case 'month': return <Field {...common} value={value} onChange={onChange} placeholder={field.placeholder || 'YYYY-MM'} hint={field.hint || 'YYYY-MM'} />;
    case 'toggle': return <Toggle label={field.label} hint={field.hint} value={!!value} onChange={onChange} />;
    case 'select': return <Segmented label={field.label} options={field.options} value={value} onChange={onChange} />;
    case 'tags': return <DelimitedField {...common} value={value} onChange={onChange} separator="," hint={field.hint || 'comma separated'} />;
    case 'lines': return <DelimitedField {...common} value={value} onChange={onChange} separator={'\n'} multiline rows={field.rows || 5} hint={field.hint || 'one per line'} />;
    case 'document': return <DocumentField {...common} value={value} onChange={onChange} />;
    case 'gallery': return <GalleryField {...common} value={value} onChange={onChange} />;
    case 'image': return <ImageField {...common} value={value} onChange={onChange} accept={field.accept} />;
    case 'list': return <ListField {...common} value={value} onChange={onChange} fields={field.fields} newItem={field.newItem} />;
    case 'pick': return <PickField {...common} value={value} onChange={onChange} options={field.options(context)} />;
    default: return <Field {...common} value={value} onChange={onChange} autoCapitalize={field.autoCapitalize} />;
  }
}

export function FieldGroup({ fields, value, onChange, context }) {
  // A document upload also fills the preview image, unless one was set by hand.
  const setField = (f, v) => {
    if (f.type === 'document') {
      const next = setIn(value, f.key, v.file);
      const keepImage = value.image && value.image !== value.previewOf;
      onChange(v.preview && !keepImage ? { ...next, image: v.preview, previewOf: v.preview } : next);
    } else onChange(setIn(value, f.key, v));
  };
  return (
    <View style={{ gap: 20 }}>
      {fields.map((f) => (f.row ? (
        <View key={f.row.map((x) => x.key).join()} style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          {f.row.map((x) => (
            <View key={x.key} style={{ flex: 1, minWidth: 160 }}>
              <FieldRenderer field={x} value={getIn(value, x.key)} onChange={(v) => setField(x, v)} context={context} />
            </View>
          ))}
        </View>
      ) : (
        <FieldRenderer key={f.key} field={f} value={getIn(value, f.key)} onChange={(v) => setField(f, v)} context={context} />
      )))}
    </View>
  );
}
