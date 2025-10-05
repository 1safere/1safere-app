// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJg_KBrPdFe-UnUnsRnXeOzR_R-SyIEHM",
  authDomain: "safere-72352.firebaseapp.com",
  projectId: "safere-72352",
  storageBucket: "safere-72352.firebasestorage.app",
  messagingSenderId: "149257113385",
  appId: "1:149257113385:web:92f1fc35c98e0f04c6f138",
  measurementId: "G-5ZLCHFDCZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export async function registerUser(name, email, password, plan) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const userId = userCredential.user.uid;
  
  // Create user document
  await setDoc(doc(db, 'users', userId), {
    name: name,
    email: email,
    plan: plan,
    contacts: [],
    createdAt: new Date().toISOString()
  });
  
  return userCredential.user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// User data functions
export async function getUserData(userId) {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function addContact(userId, contact) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    contacts: arrayUnion(contact)
  });
}

export async function removeContact(userId, contact) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    contacts: arrayRemove(contact)
  });
}

export async function upgradeToPro(userId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    plan: 'pro'
  });
}

export async function saveCheckIn(userId, location, address) {
  const checkInRef = doc(db, 'checkins', `${userId}_${Date.now()}`);
  await setDoc(checkInRef, {
    userId: userId,
    location: location,
    address: address,
    checkedInAt: new Date().toISOString(),
    checkedOutAt: null,
    sosTriggered: false
  });
}
