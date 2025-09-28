import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Initialisation de Firebase ---
// Le code d'initialisation a été mis à jour pour utiliser la syntaxe modulaire de Firebase v9+
// pour le déploiement. Il utilise les variables d'environnement.

// FIX: Updated Firebase imports for v9+ modular syntax.
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Configuration Firebase via les variables d'environnement
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
if (firebaseConfig.apiKey) {
    // FIX: Updated Firebase initialization to v9+ modular syntax. The previous v8 syntax was causing errors.
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
