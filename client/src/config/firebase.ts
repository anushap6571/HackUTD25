import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Note: These values are loaded from environment variables
// Firebase Client API keys are meant to be public (they're exposed in the browser anyway)
// Security is handled by Firebase Security Rules and Authentication, not by hiding the API key
const firebaseConfig = {
  apiKey: "AIzaSyBLuQlsRACQWdRuymY0beqPce-vye6Axjk",
  authDomain: "hackutd25.firebaseapp.com",
  projectId: "hackutd25",
  storageBucket: "hackutd25.firebasestorage.app",
  messagingSenderId: "881854770607",
  appId: "1:881854770607:web:2d1d64cf2ab491e85e935a",
  measurementId: "G-SBEJN8Q9E0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

