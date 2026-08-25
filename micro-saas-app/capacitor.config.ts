import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.instamunim.partner',
  appName: 'InstaMunim Partner',
  webDir: 'out',
  server: {
    url: 'https://www.instamunim.com/partner',
    cleartext: true
  },
  plugins: {
    AdMob: {
      initializeOnAdvertisingIdentifier: true,
    }
  }
};

export default config;
