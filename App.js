import React, { Suspense, useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ContentProvider, useContent } from './src/context/ContentContext';
import { RouterProvider, useRouter } from './src/lib/router';
import { PaletteProvider } from './src/components/CommandPalette';
import Nav from './src/components/Nav';
import Footer from './src/components/Footer';
import HomeScreen from './src/screens/HomeScreen';
import ProjectScreen from './src/screens/ProjectScreen';
import ResumeScreen from './src/screens/ResumeScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';
import GoScreen from './src/screens/GoScreen';
import BriefScreen from './src/screens/BriefScreen';
import EndorseScreen from './src/screens/EndorseScreen';
import { SkillSheetProvider } from './src/components/SkillSheet';
import { track } from './src/lib/track';
import { FONT } from './src/theme/tokens';

// The admin is only downloaded by people who open /admin.
const AdminScreen = React.lazy(() => import('./src/admin/AdminScreen'));

function Shell() {
  const { colors, scheme } = useTheme();
  const { content, ready, source } = useContent();
  const { route } = useRouter();

  // One page view per route change (the résumé records its own, richer event).
  useEffect(() => {
    if (!['home', 'project'].includes(route.name)) return;
    track('view', route.name === 'project' ? { slug: route.params.slug } : {});
  }, [route.name, route.params.slug]);

  useEffect(() => {
    if (Platform.OS !== 'web' || ['project', 'resume', 'brief', 'endorse'].includes(route.name)) return;
    document.title = route.name === 'admin' ? 'Admin' : content.settings.siteTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', content.settings.siteDescription);
  }, [route.name, content.settings]);

  const loader = <View style={{ flex: 1, minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}><ActivityIndicator color={colors.text2} /></View>;

  if (route.name === 'admin') {
    return <Suspense fallback={loader}><AdminScreen /></Suspense>;
  }
  if (route.name === 'go') return <GoScreen code={route.params.code} />;
  if (route.name === 'endorse') return <EndorseScreen token={route.params.token} />;
  if (!ready) return <View style={{ flex: 1, minHeight: '100vh', backgroundColor: colors.page }} />;

  let screen;
  switch (route.name) {
    case 'home': screen = <HomeScreen />; break;
    case 'project': screen = <ProjectScreen key={route.params.slug} slug={route.params.slug} />; break;
    case 'resume': screen = <ResumeScreen version={route.params.version} />; break;
    case 'brief': screen = <BriefScreen />; break;
    default: screen = <NotFoundScreen />;
  }

  return (
    <View dataSet={{ printflat: true }} style={{ flex: 1, backgroundColor: colors.page, minHeight: Platform.OS === 'web' ? '100vh' : undefined }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Nav />
      <View style={{ flex: 1 }} accessibilityRole="main">{screen}</View>
      <Footer />
      {source === 'preview' ? <PreviewPill /> : null}
    </View>
  );
}

// Shown while viewing an unpublished admin draft (/?preview=1).
function PreviewPill() {
  const { colors } = useTheme();
  return (
    <View dataSet={{ noprint: true }} style={{ position: 'fixed', bottom: 20, left: 0, right: 0, alignItems: 'center', zIndex: 90, pointerEvents: 'box-none' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.inverse, paddingLeft: 16, paddingRight: 6, height: 40, borderRadius: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning }} />
        <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '500', color: colors.onInverse }}>Preview · not published</Text>
        <Pressable onPress={() => { window.location.href = '/'; }} style={{ paddingHorizontal: 12, height: 28, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(127,127,127,0.25)', cursor: 'pointer' }}>
          <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.onInverse }}>Exit</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <RouterProvider>
          <PaletteProvider>
            <SkillSheetProvider>
              <Shell />
            </SkillSheetProvider>
          </PaletteProvider>
        </RouterProvider>
      </ContentProvider>
    </ThemeProvider>
  );
}
