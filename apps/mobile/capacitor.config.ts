import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meropasal.app',
  appName: 'MeroPasal',
  webDir: '../web/.svelte-kit/output/client',
  server: {
    // In production, load from the hosted URL
    url: 'https://pasal.surkhet.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body' as const,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light' as const,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
