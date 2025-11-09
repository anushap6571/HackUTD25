import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Note: These values are loaded from environment variables
// Firebase Client API keys are meant to be public (they're exposed in the browser anyway)
// Security is handled by Firebase Security Rules and Authentication, not by hiding the API key
const firebaseConfig = {
  apiKey: "AIzaSyBBvmM7IYDLNaB0SyVNLE4UXEvwtEHF5AY",
  authDomain: "carcents.firebaseapp.com",
  projectId: "carcents",
  storageBucket: "carcents.firebasestorage.app",
  messagingSenderId: "686047908431",
  appId: "1:686047908431:web:ef54c13f69e1afb78d903a",
  measurementId: "G-L0BT0CLHTS"
};

// Initialize Firebase (only if not already initialized)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase client initialized, project ID:', app.options.projectId);
} else {
  app = getApps()[0];
  console.log('✅ Firebase client already initialized, project ID:', app.options.projectId);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

