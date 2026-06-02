import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "voice-9dd3a.firebaseapp.com",
  projectId: "voice-9dd3a",
  storageBucket: "voice-9dd3a.firebasestorage.app",
  messagingSenderId: "745664105508",
  appId: "1:745664105508:web:26b1a71697b06c2b6fdcb1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export {auth , provider}

