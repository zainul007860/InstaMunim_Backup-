import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let analytics: any = null;

if (typeof window !== "undefined" && firebaseConfig.apiKey) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized successfully!");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
      console.log(`[Firebase Log] Event: ${eventName}`, params);
    } catch (err) {
      console.error("Failed to log Firebase event:", err);
    }
  } else {
    console.log(`[Mock Firebase Log] Event: ${eventName} (Firebase not configured yet)`, params);
  }
};
