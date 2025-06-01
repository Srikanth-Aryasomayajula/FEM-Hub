document.addEventListener('DOMContentLoaded', () => {
  if (!window.firebase) {
    console.error("Firebase SDK not loaded!");
    return;
  }
  
  const firebaseConfig = {
    apiKey: "AIzaSyBpTPISNivXTRPqYiB2oO8LJmI6J7DONx0",
    authDomain: "fem-hub-comments.firebaseapp.com",
    projectId: "fem-hub-comments",
    storageBucket: "fem-hub-comments.firebasestorage.app",
    messagingSenderId: "464341647492",
    appId: "1:464341647492:web:60a2f87414b7108f7942d1"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.dispatchEvent(new Event('firebaseReady'));
    console.log("Firebase initialized");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
});
