import React, { useState } from 'react';
import { Button, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ApiError, type EarnApi } from './api';

const MESSAGES: Record<string, string> = {
  wrong_email_or_password: 'Wrong email or password.',
  email_taken: 'An account with this email already exists.',
  invalid_email: 'Enter a valid email address.',
  password_8_to_200_characters: 'Use a password of at least 8 characters.',
  must_be_16_or_older: 'You must be 16 or older to earn rewards.',
  too_many_attempts: 'Too many attempts. Try again in a few minutes.',
};

// Your own account system. The offerwall user ID is the account ID your server
// assigns, never a value the app picks.
export function SignInScreen({ api, onSignedIn }: { api: EarnApi; onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [over16, setOver16] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (creating) {
        await api.register(email.trim(), password, over16);
      } else {
        await api.signIn(email.trim(), password);
      }
      onSignedIn();
    } catch (err) {
      setMessage(err instanceof ApiError ? MESSAGES[err.code] ?? 'Something went wrong. Try again.' : 'The server is not reachable right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{creating ? 'Create account' : 'Sign in'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {creating && (
        <View style={styles.row}>
          <Switch value={over16} onValueChange={setOver16} accessibilityLabel="I am 16 or older" />
          <Text style={styles.rowText}>I am 16 or older</Text>
        </View>
      )}
      <Button title={creating ? 'Create account' : 'Sign in'} onPress={submit} disabled={busy || (creating && !over16)} />
      <Button
        title={creating ? 'I already have an account' : 'Create an account'}
        onPress={() => setCreating(!creating)}
        disabled={busy}
      />
      {message && <Text style={styles.error}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#8a8f98', borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontSize: 16 },
  error: { color: '#b3261e' },
});
