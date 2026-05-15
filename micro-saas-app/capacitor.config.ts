import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zainul.smartpos',
  appName: 'InstaMunim',
  webDir: 'out',
  server: {
    url: 'https://instamunimapp.vercel.app',
    cleartext: true
  }
};

export default config;
