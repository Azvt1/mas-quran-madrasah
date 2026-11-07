import { Image } from 'expo-image';
import { useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const c = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  async function submit() {
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    // On success the root navigator swaps to the right section automatically.
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
            <AppText variant="title" style={styles.center}>
              Masjid As-Salaam
            </AppText>
            <AppText variant="caption" style={styles.center}>
              Quran Madrasa
            </AppText>
          </View>

          <View style={styles.form}>
            <AppText variant="label">Email</AppText>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={c.textSecondary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <AppText variant="label" style={{ marginTop: Spacing.two }}>
              Password
            </AppText>
            <TextInput
              ref={passwordRef}
              style={inputStyle}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={c.textSecondary}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {error ? (
              <AppText variant="caption" color={c.danger}>
                {error}
              </AppText>
            ) : null}

            <View style={{ marginTop: Spacing.three }}>
              <Button title="Sign in" onPress={submit} loading={loading} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.five },
  header: { alignItems: 'center', gap: Spacing.one },
  logo: { width: 120, height: 120, marginBottom: Spacing.two },
  center: { textAlign: 'center' },
  form: { gap: Spacing.two },
  input: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: Spacing.three, fontSize: 17 },
});
