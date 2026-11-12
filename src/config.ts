// Build-time settings, read from .env by Expo. Only EXPO_PUBLIC_ values reach the app,
// and they are public: never put the API key or the postback key here.

// The App ID from the top of your offerwall's settings page. Public.
export const MOONETIX_APP_ID = process.env.EXPO_PUBLIC_MOONETIX_APP_ID ?? '';

// Your own server (the one in server/). Use https in production.
// 10.0.2.2 is your computer as seen from the Android emulator.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';
