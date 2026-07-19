import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ATENCIÓN: Este es el "Package Name". 
  // Debe coincidir EXACTAMENTE con el que registraste en Firebase para Android junto a tu firma SHA-1.
  appId: 'com.elyami3030.reactexample', 
  appName: 'INTECA Campus',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Permite conexiones HTTP locales si estás depurando
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Este ID debe ser tu "ID de cliente web" (Web Client ID) exacto de la consola de Google Cloud
      serverClientId: '266892587219-mm3og84lqca9kakskks3jehlm7e01a3t.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;