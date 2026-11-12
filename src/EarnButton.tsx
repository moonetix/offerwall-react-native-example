import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'react-native';
import { Moonetix } from '@moonetix/react-native-offerwall';
import type { EarnApi } from './api';

// Opens the Moonetix offerwall with a fresh single-use token from your server.
// Rewards never come through here: your server credits them from postbacks.
// onClosed: load the user's balance from your server.
export function EarnButton({ api, onClosed }: { api: EarnApi; onClosed: () => void }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const closed = Moonetix.addListener('closed', onClosed);
    const failed = Moonetix.addListener('error', (error) => {
      console.warn(`Moonetix: ${error.code}: ${error.message}`);
      Alert.alert(
        error.code === 'NETWORK'
          ? 'No connection. Try again when you are back online.'
          : 'The offerwall is not available right now. Try again.',
      );
    });
    return () => {
      closed.remove();
      failed.remove();
    };
  }, [onClosed]);

  async function openOfferwall() {
    setBusy(true);
    try {
      // A new token on every tap. Tokens work once and for 10 minutes.
      Moonetix.open(await api.fetchMoonetixToken(), { title: 'Earn coins' });
    } catch {
      Alert.alert('The offerwall is not available right now.');
    } finally {
      setBusy(false);
    }
  }

  // False on web and in Expo Go, which cannot load native code. Use a development build.
  if (!Moonetix.isSupported) {
    return null;
  }

  return <Button title="Earn coins" onPress={openOfferwall} disabled={busy} />;
}
