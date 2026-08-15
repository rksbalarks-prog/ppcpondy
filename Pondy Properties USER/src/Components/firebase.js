 











import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBt_RD5sXnAYwytcvLUAQNN8oesFhIESWw",
  authDomain: "notification-5fb49.firebaseapp.com",
  projectId: "notification-5fb49",
  storageBucket: "notification-5fb49.appspot.com",
  messagingSenderId: "732114127584",
  appId: "1:732114127584:web:3a55e113992d7217199e85",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// firebase.js - Get FCM token and register it with the backend
export const requestForToken = async (phoneNumber) => {
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: "BOv3REaYH0pUof4Ld0jlNJI7nP3fB2fNi4qUBF1ENK8YFBhEnMUE-jcydZ29cJAOOqoKrT1JP1y7hRpWuMrUQgM",
    });
    
    if (token) {
      console.log("FCM Token:", token);

      // Send token + phone number to backend
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/register-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, fcmToken: token }),
        });
        console.log('Token registered successfully with backend');
      } catch (error) {
        console.error('Error registering token with backend:', error);
      }

      return token;
    } else {
      console.log("No token available.");
      return null;
    }
  } catch (err) {
    console.error("Error getting FCM token:", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      resolve(payload);
    });
  });