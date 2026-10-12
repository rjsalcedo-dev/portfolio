// src/screens/NotFoundScreen.js
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button, Container, T } from '../components/ui';
import { SPACE } from '../theme/tokens';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.page, paddingVertical: SPACE[14], minHeight: '70vh', justifyContent: 'center' }}>
      <Container style={{ alignItems: 'center' }}>
        <T variant="eyebrow" color="secondary">404</T>
        <T variant="title" align="center" style={{ marginTop: SPACE[2] }}>This page doesn't exist.</T>
        <T variant="lead" color="secondary" align="center" style={{ marginTop: SPACE[4] }}>It may have moved, or the link has a typo.</T>
        <Button title="Back to home" href="/" style={{ marginTop: SPACE[8], alignSelf: 'center' }} />
      </Container>
    </View>
  );
}
