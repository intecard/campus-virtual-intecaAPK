import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elyami3030.reactexample',
  appName: 'INTECA Campus',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '266892587219-mm3og84lqca9kakskks3jehlm7e01a3t.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;