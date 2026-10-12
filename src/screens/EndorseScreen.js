// src/screens/EndorseScreen.js
// /endorse/<token>: the page a professor, supervisor or teammate opens from a private
// testimonial request. Submissions wait for approval in the admin before going public.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { api } from '../lib/api';
import { Button, Card, Container, T } from '../components/ui';
import { Checkbox, Field } from '../components/Form';
import { FONT, SPACE } from '../theme/tokens';

const MIN = 40;
const MAX = 700;

export default function EndorseScreen({ token }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', role: '', org: '', quote: '', link: '', consent: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Write a testimonial';
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex';
      document.head.appendChild(meta);
    }
    api.endorseInfo(token)
      .then((r) => { setInfo(r); setForm((f) => ({ ...f, name: r.name || '' })); })
      .catch((e) => setError(e.message));
  }, [token]);

  const submit = async () => {
    setFormError('');
    if (!form.name.trim()) return setFormError('Please add your name.');
    if (form.quote.trim().length < MIN) return setFormError('A few more sentences would help.');
    if (!form.consent) return setFormError('Please confirm it can be shown publicly.');
    setBusy(true);
    try { await api.endorseSubmit({ token, ...form }); setDone(true); } catch (e) { setFormError(e.message); }
    setBusy(false);
  };

  const owner = info?.owner || 'R J Salcedo';
  const first = owner.split(' ')[0].length > 1 ? owner.split(' ')[0] : 'RJ';

  return (
    <View style={{ minHeight: '100vh', backgroundColor: colors.pageAlt, paddingVertical: isSm ? SPACE[8] : SPACE[12] }}>
      <Container width={620}>
        {!info && !error ? <ActivityIndicator color={colors.text2} style={{ marginTop: 80 }} /> : null}
        {error ? (
          <Card style={{ alignItems: 'center', paddingVertical: SPACE[10] }}>
            <Feather name="link-2" size={28} color={colors.text3} />
            <T variant="h3" align="center" style={{ marginTop: 12 }}>{error}</T>
            <Button variant="link" title="Visit the portfolio" href="/" iconRight="chevron-right" style={{ alignSelf: 'center', marginTop: 12 }} />
          </Card>
        ) : null}
        {info && done ? (
          <Card style={{ alignItems: 'center', paddingVertical: SPACE[10] }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="check" size={28} color={colors.success} />
            </View>
            <T variant="h2" align="center" style={{ marginTop: 16 }}>Thank you!</T>
            <T variant="body" color="secondary" align="center" style={{ marginTop: 8, maxWidth: 420 }}>{first} will review your testimonial before it appears on the portfolio.</T>
            <Button variant="link" title={`See ${first}'s portfolio`} href="/" iconRight="chevron-right" style={{ alignSelf: 'center', marginTop: 16 }} />
          </Card>
        ) : null}
        {info && !done ? (
          <>
            <T variant="eyebrow" color="accent">Testimonial request</T>
            <T variant="title" style={{ marginTop: 6 }}>{owner} asked for a few words from you.</T>
            <T variant="lead" color="secondary" style={{ marginTop: 12, marginBottom: SPACE[7] }}>
              Two or three sentences about working with {first}{info.relationship ? ` as their ${info.relationship.toLowerCase()}` : ''}. It takes about two minutes.
            </T>
            <Card>
              <View style={{ gap: SPACE[5] }}>
                <Field label="Your testimonial" value={form.quote} onChange={(v) => set('quote')(v.slice(0, MAX))} multiline rows={6}
                  placeholder={`What did you work on with ${first}? What stood out about their work or how they work with others?`} />
                <Text style={{ fontFamily: FONT, fontSize: 12, color: form.quote.length < MIN ? colors.text3 : colors.success, marginTop: -SPACE[4], textAlign: 'right' }}>
                  {form.quote.length < MIN ? `${MIN - form.quote.length} more characters` : `${form.quote.length} / ${MAX}`}
                </Text>
                <View style={{ flexDirection: isSm ? 'column' : 'row', gap: SPACE[4] }}>
                  <Field style={{ flex: 1 }} label="Your name" value={form.name} onChange={set('name')} autoComplete="name" />
                  <Field style={{ flex: 1 }} label="Your role" value={form.role} onChange={set('role')} placeholder="Professor, OJT Supervisor…" />
                </View>
                <Field label="Organization" value={form.org} onChange={set('org')} placeholder="University of Baguio" />
                <Field label="LinkedIn or profile link" hint="optional" value={form.link} onChange={set('link')} autoCapitalize="none" keyboardType="url" placeholder="https://" />
                <Checkbox checked={form.consent} onChange={set('consent')} label="It can be shown publicly on the portfolio" sub="With your name, role and organization" />
                {formError ? <T variant="small" style={{ color: colors.danger }}>{formError}</T> : null}
                <Button title="Send testimonial" icon="send" size="lg" onPress={submit} loading={busy} align="stretch" />
              </View>
            </Card>
            <T variant="caption" color="tertiary" align="center" style={{ marginTop: SPACE[5] }}>Nothing is published until {first} approves it. This link works once.</T>
          </>
        ) : null}
      </Container>
    </View>
  );
}
