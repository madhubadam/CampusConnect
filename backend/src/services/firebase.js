import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore as getFs } from 'firebase-admin/firestore';
import { config } from '../config/index.js';

let firestoreInstance = null;
let isInitialized = false;

export function initializeFirebase() {
  if (isInitialized) return firestoreInstance;

  const projectId = config.FIREBASE_PROJECT_ID;
  const clientEmail = config.FIREBASE_CLIENT_EMAIL;
  let privateKey = config.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.log('[Firebase Admin] Service account credentials not configured in environment. Using authoritative memory store.');
    return null;
  }

  try {
    // Correctly format newline characters in private key
    if (typeof privateKey === 'string') {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const apps = getApps();
    let app;
    if (apps.length === 0) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    } else {
      app = apps[0];
    }

    firestoreInstance = getFs(app);
    try {
      firestoreInstance.settings({ ignoreUndefinedProperties: true });
    } catch (settingErr) {
      // Settings might already be frozen if re-accessed
    }
    isInitialized = true;
    console.log(`[Firebase Admin] Successfully initialized Firestore connection for project: ${projectId}`);
    return firestoreInstance;
  } catch (err) {
    console.warn(`[Firebase Admin] Initialization notice: ${err.message}. Operating in fallback store mode.`);
    firestoreInstance = null;
    isInitialized = false;
    return null;
  }
}

export function getFirestore() {
  if (!isInitialized) {
    return initializeFirebase();
  }
  return firestoreInstance;
}

export function isFirebaseReady() {
  return isInitialized && firestoreInstance !== null;
}
