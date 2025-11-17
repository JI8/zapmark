// This function is designed to be used on the client-side (in the browser).
// It reads the public Firebase configuration from environment variables.
function getFirebaseConfig() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Basic validation to ensure all required fields are present
  for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value && key !== 'measurementId') { // measurementId is optional
      // Construct the expected environment variable name for a clearer error message
      const envVarName = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      console.error(`Firebase config error: Missing environment variable ${envVarName}. Please check your .env file.`);
      // No longer throwing an error to prevent server crashes, but logging it.
      // In a real app, you might want to handle this more gracefully.
    }
  }

  return firebaseConfig;
}

export const firebaseConfig = getFirebaseConfig();
