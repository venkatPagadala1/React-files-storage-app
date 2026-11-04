import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredWorkspaceSettings = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
};

function isConfigured(value) {
  return Boolean(value?.trim()) && !/replace-me|your-project-id|your-cloud-run-service-url/i.test(value);
}

export const missingWorkspaceSettings = Object.entries(requiredWorkspaceSettings)
  .filter(([, value]) => !isConfigured(value))
  .map(([name]) => name);

export const isFirebaseAuthEnabled = missingWorkspaceSettings.length === 0;

const firebaseApp = isFirebaseAuthEnabled ? initializeApp(firebaseConfig) : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL;
export const isLocalAuthEmulator = Boolean(authEmulatorUrl);
if (firebaseAuth && authEmulatorUrl) {
  connectAuthEmulator(firebaseAuth, authEmulatorUrl, { disableWarnings: true });
}
