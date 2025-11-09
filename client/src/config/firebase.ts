import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Note: These values are loaded from environment variables
// Firebase Client API keys are meant to be public (they're exposed in the browser anyway)
// Security is handled by Firebase Security Rules and Authentication, not by hiding the API key
const firebaseConfig = {
  apiKey: "AIzaSyDgUt_pi4-_DCLnGyey6jSYICIESY9hsBg",
  authDomain: "hack25.firebaseapp.com",
  projectId: "hack25-f1f6a",
  storageBucket: "hack25.firebasestorage.app",
  messagingSenderId: "844445990011",
  appId: "1:844445990011:web:b634f9ca816e96672ef6de",
  measurementId: "G-JBS9YRKWSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('irebase client project ID:', app.options.projectId);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

