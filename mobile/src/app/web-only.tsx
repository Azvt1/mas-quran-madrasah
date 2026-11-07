import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

const WEBSITE = 'https://masmadrasa-murex.vercel.app';

// Admin tools stay on the website; the app is for teachers and students.
export default function WebOnly() {
  const { profile, signOut } = useAuth();
  return (
    <Screen>
      <AppText variant="title">Salaam{profile ? `, ${profile.full_name}` : ''}</AppText>
      <Card>
        <AppText variant="heading">Admin tools are on the website</AppText>
        <AppText variant="caption">
          The app is for teachers and students. Manage users, payments and the library on the website.
        </AppText>
      </Card>
      <View style={{ gap: Spacing.two }}>
        <Button title="Open website" onPress={() => WebBrowser.openBrowserAsync(WEBSITE)} />
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
