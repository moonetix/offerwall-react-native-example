import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Button, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ApiError, type Account, type EarnApi } from './api';
import { EarnButton } from './EarnButton';

export function HomeScreen({ api, onSignedOut }: { api: EarnApi; onSignedOut: () => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // The balance always comes from your server, which credits it from postbacks.
  const refreshBalance = useCallback(async () => {
    try {
      setAccount(await api.me());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.signedOut) return onSignedOut();
      setError('Balance not available right now.');
    }
  }, [api, onSignedOut]);

  useEffect(() => {
    refreshBalance();
    // Offers can credit minutes or days later, so also reload when the app comes back.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshBalance();
    });
    return () => sub.remove();
  }, [refreshBalance]);

  async function signOut() {
    await api.signOut().catch(() => undefined);
    onSignedOut();
  }

  async function pullToRefresh() {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  }

  return (
    <FlatList
      contentContainerStyle={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} />}
      data={account?.history ?? []}
      keyExtractor={(item, index) => `${index}-${item.at}`}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.label}>Your balance</Text>
          <Text style={styles.balance}>{account ? `${account.balance} ${account.currency}` : error ?? '...'}</Text>
          <EarnButton api={api} onClosed={refreshBalance} />
          <Text style={styles.note}>
            Offers come from third-party advertisers. Some rewards arrive after a review. VPNs and proxies are not
            supported.
          </Text>
          {account && account.history.length > 0 && <Text style={styles.section}>Recent rewards</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.itemText}>
            <Text>{item.offer}</Text>
            <Text style={styles.note}>{item.at}</Text>
          </View>
          <Text>{item.status === 'reversed' ? `Reversed ${item.reward}` : `+${item.reward}`}</Text>
        </View>
      )}
      ListFooterComponent={<Button title="Sign out" onPress={signOut} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { padding: 24, paddingTop: 64, gap: 8 },
  header: { gap: 12 },
  label: { fontSize: 14, color: '#4a4f57' },
  balance: { fontSize: 32, fontWeight: '600' },
  note: { fontSize: 12, color: '#4a4f57' },
  section: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  itemText: { flex: 1 },
});
