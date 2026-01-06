import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  databaseURL: "https://iot-aquaculture-monitoring-default-rtdb.firebaseio.com",
};

let app: FirebaseApp;
let database: Database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, database };
