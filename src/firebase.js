import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCS6j5km_NyvABIZE17nhUuZqTCpDm1-w",
  authDomain: "bling-81b07.firebaseapp.com",
  projectId: "bling-81b07",
  storageBucket: "bling-81b07.appspot.com",
  messagingSenderId: "338334468265",
  appId: "1:338334468265:web:07f67160d17553a60741b8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };