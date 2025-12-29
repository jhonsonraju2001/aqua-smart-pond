import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.125a195a138f46b096ee87bfcc54d251',
  appName: 'aqua-smart-pond',
  webDir: 'dist',
  server: {
    url: 'https://125a195a-138f-46b0-96ee-87bfcc54d251.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
