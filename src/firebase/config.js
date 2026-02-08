import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Save user email to Firestore
 * @param {string} email - User's email address
 */
export const saveUserEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    await addDoc(usersRef, {
      email,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
    console.log('User email saved successfully');
  } catch (error) {
    console.error('Error saving user email:', error);
    throw error;
  }
};