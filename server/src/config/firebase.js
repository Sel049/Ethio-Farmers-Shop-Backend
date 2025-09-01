import admin from "firebase-admin";
import "dotenv/config";

// Check if Firebase credentials are available
const hasFirebaseCredentials = process.env.FIREBASE_PROJECT_ID && 
                              process.env.FIREBASE_CLIENT_EMAIL && 
                              process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseCredentials) {
  // Production/development with Firebase
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL
    }),
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
} else {
  // Development without Firebase - use mock app
  console.warn("⚠️  Firebase credentials not found. Running in development mode without Firebase authentication.");
  console.warn("   Create a .env file with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY");
  
  // Initialize with a mock app to prevent errors
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'dev-project',
      credential: admin.credential.applicationDefault(),
    });
  }
}

export default admin;
