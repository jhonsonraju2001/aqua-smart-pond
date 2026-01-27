import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, signInAnonymously, Auth, onAuthStateChanged, User } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey", // Firebase requires an API key for auth, but anonymous auth works with any valid project
  authDomain: "iot-aquaculture-monitoring.firebaseapp.com",
  databaseURL: "https://iot-aquaculture-monitoring-default-rtdb.firebaseio.com",
  projectId: "iot-aquaculture-monitoring",
};

let app: FirebaseApp;
let database: Database;
let auth: Auth;
let currentUser: User | null = null;
let authReady: Promise<User | null>;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  
  // Create a promise that resolves when auth state is determined
  authReady = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        if (import.meta.env.DEV) {
          console.log("Firebase authenticated:", user.uid);
        }
        resolve(user);
      } else {
        // Sign in anonymously if not authenticated
        signInAnonymously(auth)
          .then((credential) => {
            currentUser = credential.user;
            if (import.meta.env.DEV) {
              console.log("Firebase anonymous auth success:", credential.user.uid);
            }
            resolve(credential.user);
          })
          .catch((error) => {
            console.error("Firebase anonymous auth error:", error);
            resolve(null);
          });
      }
      unsubscribe();
    });
  });

  if (import.meta.env.DEV) {
    console.log("Firebase initialized successfully");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  authReady = Promise.resolve(null);
}

// Helper to ensure auth is ready before operations
export async function ensureAuth(): Promise<User | null> {
  return authReady;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export { app, database, auth };
