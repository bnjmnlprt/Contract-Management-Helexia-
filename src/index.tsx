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
  apiKey: "AIzaSyDtjHwxfrnOQYR-CgsGLipVkqCl8pjtzI6Y",
  authDomain: "contract-management-helexia.firebaseapp.com",
  projectId: "contract-management-helexia",
  storageBucket: "contract-management-helexia.firebasestorage.app",
  messagingSenderId: "66747794080",
  appId: "1:66747794080:web:d23b1f2c704ef1c6457fc5",
  measurementId: "G-FZR8XT3NZ9"
  gemini_API_Key: "AIzaSyAUaWy5xXk4vlIZQGCyEwGcWyjw_nuxTYI"
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
