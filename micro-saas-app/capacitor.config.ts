import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zainul.instamunim',
  appName: 'InstaMunim',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      initializeOnAdvertisingIdentifier: true,
    }
  }
};

export default config;
