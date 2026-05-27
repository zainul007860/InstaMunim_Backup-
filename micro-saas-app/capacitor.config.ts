import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zainul.instamunimpos',
  appName: 'InstaMunim',
  webDir: 'out',
  plugins: {
    AdMob: {
      initializeOnAdvertisingIdentifier: true,
    }
  }
};

export default config;
