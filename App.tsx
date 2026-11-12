import React, { useCallback, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Moonetix } from '@moonetix/react-native-offerwall';
import { EarnApi } from './src/api';
import { API_URL, MOONETIX_APP_ID } from './src/config';
import { HomeScreen } from './src/HomeScreen';
import { SignInScreen } from './src/SignInScreen';

// Once, when the app starts. The App ID is public; the API key stays on your server.
Moonetix.init(MOONETIX_APP_ID);

const api = new EarnApi(API_URL);

export default function App() {
  const [, setVersion] = useState(0);
  const rerender = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {api.signedIn ? <HomeScreen api={api} onSignedOut={rerender} /> : <SignInScreen api={api} onSignedIn={rerender} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff', paddingTop: 32 },
});
