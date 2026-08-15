importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBt_RD5sXnAYwytcvLUAQNN8oesFhIESWw",
  authDomain: "notification-5fb49.firebaseapp.com",
  projectId: "notification-5fb49",
  storageBucket: "notification-5fb49.firebasestorage.app",
  messagingSenderId: "732114127584",
  appId: "1:732114127584:web:3a55e113992d7217199e85",
  measurementId: "G-09MP7H16W5"
});

const messaging = firebase.messaging();


messaging.onBackgroundMessage(function (payload) {
  console.log("📩 Received background message ", payload);

  self.registration.showNotification(
    payload.notification.title,
    { body: payload.notification.body, icon: "/logo192.png" }
  );
});
