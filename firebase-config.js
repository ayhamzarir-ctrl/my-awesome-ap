// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmmejjnhpknA5WGd11EyEGyIOjU7BY1K8",
  authDomain: "arami-love.firebaseapp.com",
  projectId: "arami-love",
  storageBucket: "arami-love.firebasestorage.app",
  messagingSenderId: "642731625163",
  appId: "1:642731625163:web:43c30c416648f5ab37a94e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);