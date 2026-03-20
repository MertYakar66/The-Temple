import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCbDcVRBe7W-IWmermgST9NvZ182HBZ2Ko",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-temple-f195e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-temple-f195e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-temple-f195e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1033735189666",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1033735189666:web:66a872ec49915d6e7f93fb",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
