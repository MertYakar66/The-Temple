import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCbDcVRBe7W-IWmermgST9NvZ182HBZ2Ko",
  authDomain: "the-temple-f195e.firebaseapp.com",
  projectId: "the-temple-f195e",
  storageBucket: "the-temple-f195e.firebasestorage.app",
  messagingSenderId: "1033735189666",
  appId: "1:1033735189666:web:66a872ec49915d6e7f93fb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
