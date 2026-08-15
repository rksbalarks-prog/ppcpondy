import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAcVBmlPWNa8YR1VNfSNJ6l3sPtdjEAbqs",
  authDomain: "ppc-2-a4437.firebaseapp.com",
  projectId: "ppc-2-a4437",
  storageBucket: "ppc-2-a4437.appspot.com",
  messagingSenderId: "965611487671",
  appId: "1:965611487671:web:1ecd3e0124e6b1781fe832",
  measurementId: "G-MHDSQCTZ3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use this if you're running in a testing environment
auth.settings.appVerificationDisabledForTesting = true;

// Export auth for use elsewhere
export { auth };

// Setup recaptcha function
const setupRecaptcha = (phoneNumber) => {
  const recaptchaVerifier = new RecaptchaVerifier(
    "recaptcha-container", // This is the ID of the element where the reCAPTCHA will be rendered
    {
      size: "invisible", // Invisible reCAPTCHA
      callback: (response) => {
      },
      "expired-callback": () => {
      },
    },
    auth
  );

  return recaptchaVerifier.render().then(() => {
    // After reCAPTCHA has been rendered, initiate phone number authentication
    return auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        return confirmationResult; // Return the confirmation result to handle the OTP verification
      })
      .catch((error) => {
      });
  });
};

export { setupRecaptcha };








