import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zainul.instamunim',
  appName: 'InstaMunim',
  webDir: 'out',
  server: {
    url: 'https://instamunimapp.vercel.app',
    cleartext: true
  },
  plugins: {
    AdMob: {
      initializeOnAdvertisingIdentifier: true,
    }
  }
};

export default config;
