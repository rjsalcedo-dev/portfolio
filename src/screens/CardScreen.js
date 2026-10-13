// src/screens/CardScreen.js
// /card: a printable business card. The QR code opens the portfolio tagged "card", so
// Insights shows how many people scanned it at a career fair.
// Prints as an A4 sheet of 10 standard cards (3.5 × 2 in): fronts on page 1, backs on page 2
// mirrored for double-sided printing (flip on the long edge).
import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { qrDataUrl, siteUrl } from '../lib/share';
import { shortUrl } from '../lib/format';
import { Button, Container, T } from '../components/ui';
import { FONT, SPACE } from '../theme/tokens';

const isWeb = Platform.OS === 'web';
const INK = '#1d1d1f';
const INK2 = '#6e6e73';

// Everything is sized in inches so screen preview (scaled) and print match exactly.
function CardFace({ side, profile, education, scale = 1 }) {
  const inch = (n) => `${n * scale}in`;
  const pt = (n) => n * scale * 1.333;
  const base = { width: inch(3.5), height: inch(2), backgroundColor: '#fff', overflow: 'hidden', borderWidth: 0.5, borderColor: '#d2d2d7' };
  if (side === 'front') {
    return (
      <View style={[base, { padding: inch(0.22), justifyContent: 'space-between' }]}>
        <View style={{ width: inch(0.34), height: inch(0.34), borderRadius: inch(0.08), backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT, fontSize: pt(9.5), fontWeight: '700', color: '#fff', letterSpacing: -0.3 }}>{profile.initials || 'RJ'}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: FONT, fontSize: pt(17), fontWeight: '700', color: INK, letterSpacing: -0.4 }}>{profile.name}</Text>
          <Text style={{ fontFamily: FONT, fontSize: pt(8.5), color: INK2, marginTop: pt(2) }}>{profile.role}</Text>
          <View style={{ height: 0.75, backgroundColor: '#d2d2d7', marginVertical: pt(7) }} />
          <Text style={{ fontFamily: FONT, fontSize: pt(7), color: INK2 }}>{[education.school, profile.location].filter(Boolean).join('  ·  ')}</Text>
        </View>
      </View>
    );
  }
  const rows = [
    ['globe', shortUrl(siteUrl('/'))],
    profile.email ? ['mail', profile.email] : null,
    ...profile.socials.slice(0, 2).map((s) => [s.icon || 'link', shortUrl(s.url)]),
    profile.location ? ['map-pin', profile.location] : null,
  ].filter(Boolean).slice(0, 4);
  return (
    <View style={[base, { padding: inch(0.2), flexDirection: 'row', alignItems: 'center', gap: inch(0.18) }]}>
      {isWeb ? React.createElement('img', { src: qrDataUrl(siteUrl('/?src=card')), alt: 'QR code to portfolio', style: { width: inch(1.25), height: inch(1.25) } }) : null}
      <View style={{ flex: 1, gap: pt(6) }}>
        <Text style={{ fontFamily: FONT, fontSize: pt(8), fontWeight: '600', color: INK, marginBottom: pt(2) }}>Scan for my portfolio</Text>
        {rows.map(([icon, label]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: pt(5) }}>
            <Feather name={icon} size={pt(7)} color={INK2} />
            <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: pt(7), color: INK, flexShrink: 1 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CardScreen() {
  const { colors } = useTheme();
  const { isSm, width } = useBreakpoint();
  const { content } = useContent();
  const { profile, education } = content;
  useEffect(() => { if (isWeb) document.title = `${profile.name} · Business card`; }, [profile.name]);

  // Preview scale: as large as fits, capped at 1.6×.
  const scale = Math.min(1.6, (Math.min(width, 1100) - 64) / (isSm ? 336 : 700));
  const fronts = (
    <View dataSet={{ cardpage: true }} style={{ width: '7in', flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' }}>
      {Array.from({ length: 10 }, (_, i) => <CardFace key={i} side="front" profile={profile} education={education} />)}
    </View>
  );

  return (
    <View dataSet={{ printflat: true }} style={{ minHeight: '100vh', backgroundColor: colors.pageAlt }}>
      <View dataSet={{ noprint: true }}>
        <Container width={1000} style={{ paddingVertical: isSm ? SPACE[8] : SPACE[11] }}>
          <Button variant="link" size="sm" title="Back to portfolio" icon="chevron-left" href="/" />
          <T variant="title" style={{ marginTop: SPACE[5] }}>Business card</T>
          <T variant="lead" color="secondary" style={{ marginTop: SPACE[3], maxWidth: 640 }}>For career fairs and interviews. The QR code opens your portfolio, and every scan shows up in Insights as “Business card”.</T>
          <View style={{ flexDirection: isSm ? 'column' : 'row', gap: SPACE[6], marginTop: SPACE[8], alignItems: 'center', justifyContent: 'center' }}>
            {['front', 'back'].map((side) => (
              <View key={side} style={{ alignItems: 'center', gap: SPACE[3] }}>
                <View style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.15)', borderRadius: 6, overflow: 'hidden' }}>
                  <CardFace side={side} profile={profile} education={education} scale={scale} />
                </View>
                <T variant="caption" color="secondary">{side === 'front' ? 'Front' : 'Back'}</T>
              </View>
            ))}
          </View>
          <View style={{ alignItems: 'center', marginTop: SPACE[9], gap: SPACE[3] }}>
            <Button title="Print a sheet of 10" icon="printer" size="lg" onPress={() => window.print()} align="center" />
            <T variant="small" color="secondary" align="center" style={{ maxWidth: 520 }}>
              A4, 250–300 gsm card stock, double-sided, flip on the long edge, scale 100%. Cut along the light borders.
            </T>
          </View>
        </Container>
      </View>
      {/* Print-only: fronts, then backs mirrored so they line up when printed double-sided. */}
      <View dataSet={{ printonly: true }}>
        {fronts}
        <View dataSet={{ pagebreak: true }} />
        <View dataSet={{ cardpage: true }} style={{ width: '7in', flexDirection: 'row-reverse', flexWrap: 'wrap', alignSelf: 'center' }}>
          {Array.from({ length: 10 }, (_, i) => <CardFace key={i} side="back" profile={profile} education={education} />)}
        </View>
      </View>
    </View>
  );
}
