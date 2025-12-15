import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.koinonia.app',
  appName: 'Koinonia',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK'
    }
  },
  android: {
    backgroundColor: '#ffffff'
  },
  server: {
    // Use HTTP instead of HTTPS to allow ws:// connections for local dev
    androidScheme: 'http'
  }
};

export default config;
