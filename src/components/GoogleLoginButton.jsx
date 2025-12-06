import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../firebase";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      // Check if user exists in RTDB
      const snap = await get(ref(db, `users/${user.uid}`));

      if (snap.exists()) {
        // Existing user → go home
        navigate("/");
      } else {
        // New user → go to registration
        navigate("/register");
      }

    } catch (err) {
      console.error(err);
      alert("Google login failed!");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2
                 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}
