import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 請將以下設定替換為您自己的 Firebase 專案設定
// 您可以在 Firebase Console 的「專案設定」>「一般」>「您的應用程式」中找到這些資訊
const firebaseConfig = {

  apiKey: "AIzaSyB_3xeVDJwg-YTH3SMxqGl8fLgb6Gny6ZQ",

  authDomain: "karzan-alliance-manager.firebaseapp.com",

  projectId: "karzan-alliance-manager",

  storageBucket: "karzan-alliance-manager.firebasestorage.app",

  messagingSenderId: "617140778642",

  appId: "1:617140778642:web:8809b70b6e6e26544a984b",

  measurementId: "G-PZRRELFWN1"

};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
