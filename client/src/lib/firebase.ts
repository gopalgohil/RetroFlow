import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDpHw7j9lBbHv4m8rgc0BuEwIiMFViu1nc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'retroflow-1d442.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'retroflow-1d442',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'retroflow-1d442.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '90825700119',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:90825700119:web:8918ad2dcf4c5b06d6bd52',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-KFM52EY8VY',
};

// Initialize Firebase (singleton pattern prevents re-initialization on hot reload)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request basic profile and email scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Prompt account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
