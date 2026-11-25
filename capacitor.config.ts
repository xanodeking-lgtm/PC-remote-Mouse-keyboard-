import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.padbridge.controller',
  appName: 'PadBridge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0D0F12',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
