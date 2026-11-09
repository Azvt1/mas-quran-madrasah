import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { AppText, Button, Card, Screen, Segmented, useInputStyle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme-preference';

export function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  return (
    <Screen>
      <AppText variant="title">Profile</AppText>
      <Card>
        <AppText variant="heading">{profile?.full_name ?? '—'}</AppText>
        <AppText variant="caption">{session?.user.email}</AppText>
        <AppText variant="caption" style={{ textTransform: 'capitalize' }}>
          {profile?.role}
        </AppText>
      </Card>
      <Appearance />
      <ChangeEmail current={session?.user.email ?? ''} />
      <ChangePassword />
      <Button
        title="Sign out"
        variant="secondary"
        onPress={() =>
          Alert.alert('Sign out?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: signOut },
          ])
        }
      />
    </Screen>
  );
}

function Appearance() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);

  function change(next: ThemePreference) {
    setPreference(next);
    setThemePreference(next);
  }

  return (
    <Card style={{ gap: Spacing.two }}>
      <AppText variant="heading">Appearance</AppText>
      <AppText variant="caption">Automatic follows your phone’s setting.</AppText>
      <Segmented
        value={preference}
        onChange={change}
        options={[
          { value: 'system', label: 'Automatic' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    </Card>
  );
}

function ChangeEmail({ current }: { current: string }) {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = email.trim().toLowerCase();
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next) && next !== current.toLowerCase();

  async function save() {
    setSaving(true);
    setError(null);
    // Database function (migration 027) changes the caller's own email
    // without a confirmation link, like the website does.
    const { error: rpcError } = await supabase.rpc('update_my_email', { new_email: next });
    if (rpcError) {
      setError(rpcError.message);
      setSaving(false);
      return;
    }
    await supabase.auth.refreshSession(); // pick up the new email in the session
    setSaving(false);
    setEmail('');
    Alert.alert('Email updated', `Sign in with ${next} from now on.`);
  }

  return (
    <Card style={{ gap: Spacing.two }}>
      <AppText variant="heading">Change email</AppText>
      <AppText variant="caption">This is the email you use to sign in.</AppText>
      <TextInput
        style={inputStyle}
        value={email}
        onChangeText={setEmail}
        placeholder="New email address"
        placeholderTextColor={c.textSecondary}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      {error ? (
        <AppText variant="caption" color={c.danger}>
          {error}
        </AppText>
      ) : null}
      <Button title="Save email" onPress={save} loading={saving} disabled={!valid} />
    </Card>
  );
}

function ChangePassword() {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = password.length >= 8 && confirm === password;

  async function save() {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword('');
    setConfirm('');
    Alert.alert('Password updated', 'Use your new password next time you sign in.');
  }

  return (
    <Card style={{ gap: Spacing.two }}>
      <AppText variant="heading">Change password</AppText>
      <TextInput
        style={inputStyle}
        value={password}
        onChangeText={setPassword}
        placeholder="New password (at least 8 characters)"
        placeholderTextColor={c.textSecondary}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <TextInput
        style={inputStyle}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm new password"
        placeholderTextColor={c.textSecondary}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {tooShort || mismatch || error ? (
        <AppText variant="caption" color={c.danger}>
          {error ?? (tooShort ? 'At least 8 characters.' : 'Passwords don’t match.')}
        </AppText>
      ) : null}
      <View>
        <Button title="Save password" onPress={save} loading={saving} disabled={!valid} />
      </View>
    </Card>
  );
}
