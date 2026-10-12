// src/components/Sheets.js
// Credential detail and Share sheets.
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { Modal, Lightbox } from './Modal';
import { Button, Icon, T, Tag } from './ui';
import { formatMonth } from '../lib/format';
import { downloadVCard, qrDataUrl, siteUrl } from '../lib/share';
import { track } from '../lib/track';
import { FONT, RADIUS } from '../theme/tokens';

const isExpired = (d) => d && new Date(d) < new Date();

export function CredentialSheet({ item, onClose }) {
  const { colors } = useTheme();
  const [zoom, setZoom] = useState(null);
  if (!item) return null;
  const isPdf = /\.pdf($|\?)/i.test(item.file || '');
  const preview = item.kind === 'certificate' && item.image ? item.image : null;
  const meta = [
    ['Issued by', item.issuer],
    ['Issued', formatMonth(item.issued)],
    item.expires ? [isExpired(item.expires) ? 'Expired' : 'Expires', formatMonth(item.expires)] : null,
    item.credentialId ? ['Credential ID', item.credentialId] : null,
  ].filter((x) => x && x[1]);

  return (
    <>
      <Modal
        visible
        onClose={onClose}
        title={item.kind === 'certificate' ? 'Certificate' : 'Badge'}
        width={600}
        footer={item.verifyUrl || item.file ? (
          <>
            {item.verifyUrl ? <Button title="Verify" icon="shield" href={item.verifyUrl} external align="center" onPress={() => track('verify', { id: item.id })} /> : null}
            {item.file ? <Button title={isPdf ? 'Open PDF' : 'View certificate'} icon="file-text" variant="secondary" href={item.file} external align="center" onPress={() => track('certificate', { id: item.id })} /> : null}
          </>
        ) : null}
      >
        {preview ? (
          <Pressable accessibilityLabel='Enlarge certificate' onPress={() => setZoom(0)} style={{ borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 20, cursor: 'zoom-in' }}>
            <Image source={{ uri: preview }} resizeMode="contain" style={{ width: '100%', aspectRatio: 1.414, backgroundColor: '#fff' }} accessibilityLabel={`${item.title} certificate`} />
          </Pressable>
        ) : (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {item.image ? <Image source={{ uri: item.image }} resizeMode="contain" style={{ width: 160, height: 160 }} accessibilityLabel={`${item.title} badge`} /> : <Icon name="award" size={64} color="accent" />}
          </View>
        )}
        <T variant="h2" align={preview ? undefined : 'center'}>{item.title}</T>
        {item.verifyUrl ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: preview ? 'flex-start' : 'center' }}>
            <Feather name="check-circle" size={14} color={colors.success} />
            <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '500', color: colors.success }}>Verifiable at the source</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          {meta.map(([k, v]) => (
            <View key={k} style={{ minWidth: 120 }}>
              <T variant="caption" color="secondary">{k}</T>
              <T variant="small" weight="500" selectable>{v}</T>
            </View>
          ))}
        </View>
        {item.description ? <T variant="small" color="secondary" style={{ marginTop: 16 }}>{item.description}</T> : null}
        {item.skills?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {item.skills.map((s) => <Tag key={s}>{s}</Tag>)}
          </View>
        ) : null}
      </Modal>
      <Lightbox images={preview ? [{ url: preview, caption: item.title }] : []} index={zoom} onIndex={setZoom} onClose={() => setZoom(null)} />
    </>
  );
}

export function ShareSheet({ visible, onClose, path = '/' }) {
  const { colors } = useTheme();
  const { content } = useContent();
  const [copied, setCopied] = useState(false);
  if (!visible) return null;
  const url = siteUrl(path);
  const copy = () => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const nativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Modal visible onClose={onClose} title="Share" width={420}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ padding: 14, borderRadius: RADIUS.lg, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border }}>
          <Image source={{ uri: qrDataUrl(url) }} style={{ width: 196, height: 196 }} accessibilityLabel={`QR code for ${url}`} />
        </View>
        <T variant="small" color="secondary" align="center" style={{ marginTop: 12 }}>Scan to open on another device</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, alignSelf: 'stretch', backgroundColor: colors.surfaceMuted, borderRadius: RADIUS.md, paddingLeft: 14, paddingRight: 4, height: 44 }}>
          <Text numberOfLines={1} selectable style={{ flex: 1, fontFamily: FONT, fontSize: 14, color: colors.text }}>{url.replace(/^https?:\/\//, '')}</Text>
          <Button size="sm" title={copied ? 'Copied' : 'Copy'} icon={copied ? 'check' : 'copy'} variant={copied ? 'secondary' : 'primary'} onPress={copy} align="center" />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14, justifyContent: 'center' }}>
          <Button title="Save contact" icon="user-plus" variant="secondary" onPress={() => { downloadVCard(content.profile); track('vcard'); }} />
          {nativeShare ? <Button title="More…" icon="share" variant="secondary" onPress={() => navigator.share({ title: content.profile.name, url }).catch(() => {})} /> : null}
        </View>
      </View>
    </Modal>
  );
}
