// src/screens/GoScreen.js
// /r/<code>: a tracked link made in Admin → Share links. Records the open (so you can see
// e.g. "Accenture opened your résumé"), tags the rest of the visit, then forwards.
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from '../lib/router';
import { api } from '../lib/api';
import { setRefCode } from '../lib/track';

export default function GoScreen({ code }) {
  const { colors } = useTheme();
  const { navigate } = useRouter();
  useEffect(() => {
    let alive = true;
    api.resolveLink(code)
      .then(({ target }) => { if (!alive) return; setRefCode(code); navigate(target || '/', { replace: true }); })
      .catch(() => alive && navigate('/', { replace: true }));
    return () => { alive = false; };
  }, [code, navigate]);
  return <View style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}><ActivityIndicator color={colors.text2} /></View>;
}
