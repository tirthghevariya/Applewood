import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKych_AHGGqr-VdSERr4UvUB9iXPw9HVQ",
    authDomain: "applewood-9f7de.firebaseapp.com",
    projectId: "applewood-9f7de",
    storageBucket: "applewood-9f7de.firebasestorage.app",
    messagingSenderId: "535479133386",
    appId: "1:535479133386:web:64a07cc4ea01c89d680033",
    measurementId: "G-CVBZM1EN8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);
