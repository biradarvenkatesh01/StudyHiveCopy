// frontend/firebase-auth.js (Final Updated Code for Step 6)
// frontend/firebase-auth.js

// --- ADD THIS LINE AT THE VERY TOP ---
const API_BASE_URL = 'https://studyhivecopy-backend.onrender.com'; // Replace with your actual Render URL
// ------------------------------------

// Paste your copied firebaseConfig object here
const firebaseConfig = {
    apiKey: "AIzaSyAY4pk1GLp-D43iQz-CEdREbewgEC6Lo0g",
    authDomain: "studyhive-7cfcf.firebaseapp.com",
    projectId: "studyhive-7cfcf",
    storageBucket: "studyhive-7cfcf.appspot.com",
    messagingSenderId: "462636260729",
    appId: "1:462636260729:web:9bb601b6f3dc0ef9a363a8",
    measurementId: "G-4M9YW8G2S2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Function to sign in with Google
const signInWithGoogle = async () => {
    try {
        await auth.signInWithPopup(googleProvider);
        // onAuthStateChanged will handle the rest
    } catch (error) {
        console.error("Error signing in with Google:", error);
    }
};

// Function to sign out
const signOut = async () => {
    try {
        await auth.signOut();
        console.log("User signed out successfully.");
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

// Function to send the token to our backend and fetch initial data
// frontend/firebase-auth.js

// --- REPLACE the old verifyUserWithBackend function with this ---
const verifyUserWithBackend = async (user) => {
    if (!user) {
      renderApp(); // Render login page if no user
      return;
    };

    try {
        const token = await user.getIdToken();
        const response = await fetch('${API_BASE_URL}/api/auth/google-signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token }),
        });

        if (!response.ok) throw new Error('Backend verification failed.');

        const backendUser = await response.json();
        
        appState.isAuthenticated = true;
        appState.user = {
            name: backendUser.name,
            email: backendUser.email,
            uid: backendUser.firebaseUid,
            mongoId: backendUser._id
        };

        // User verify hone ke baad, unke study groups fetch karo
        await fetchStudyGroups();
        // Finally, render the app with all the user data and their groups
        renderApp();

    } catch (error) {
        console.error("Error verifying user with backend:", error);
        signOut(); // If verification fails, sign out completely
    }
};

// ... (rest of the firebase-auth.js file remains the same) ...

// Listen for authentication state changes
auth.onAuthStateChanged(user => {
  if (user) {
    verifyUserWithBackend(user);
  } else {
    appState.isAuthenticated = false;
    appState.user = null;
    appState.currentPage = "login";
    renderApp();
  }
});


// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in via Firebase.
        // Now, verify and get user data from OUR backend.
        verifyUserWithBackend(user);
    } else {
        // User is signed out.
        appState.isAuthenticated = false;
        appState.user = null;
        appState.currentPage = "login";
        // Re-render the app to show the login page
        renderApp();
    }
});