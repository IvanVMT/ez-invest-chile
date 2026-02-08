// Firebase Configuration
// IMPORTANT: Replace these values with your own project configuration from the Firebase Console
// Go to https://console.firebase.google.com/ > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyD-REPLACE-WITH-YOUR-API-KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:123456acb123"
};

// Initialize Firebase using the global 'firebase' namespace provided by the compat scripts
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

export { auth };
