import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zainul.instamunimpos',
  appName: 'InstaMunim',
  webDir: 'out',
  server: {
    url: 'https://www.instamunim.com',
    cleartext: true
  },
  plugins: {
    AdMob: {
      initializeOnAdvertisingIdentifier: true,
    }
  }
};

export default config;
