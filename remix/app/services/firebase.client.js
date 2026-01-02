import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOXLkRsHEwCHkM6rJ4IVdfU5sjWLLiCXw",
  authDomain: "cms-template-3fdbe.firebaseapp.com",
  projectId: "cms-template-3fdbe",
  storageBucket: "cms-template-3fdbe.firebasestorage.app",
  messagingSenderId: "1047223925852",
  appId: "1:1047223925852:web:deadb4dd39aa2a8465fa99"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
