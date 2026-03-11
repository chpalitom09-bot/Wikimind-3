import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5Yc8ktmg4nHsy2YG15-dpet-OBpLozXc",
  authDomain: "wikimindgo.firebaseapp.com",
  projectId: "wikimindgo",
  storageBucket: "wikimindgo.firebasestorage.app",
  messagingSenderId: "1048829842600",
  appId: "1:1048829842600:web:f6438f3fefd7a50dc0de9d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);