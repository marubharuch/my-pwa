// src/pages/LoginPage.jsx

/**
 * 🔐 LOGIN PAGE – AUTH ENTRY POINT
 *
 * FEATURES (DO NOT REMOVE WHEN ADDING NEW CODE):
 * ------------------------------------------------
 * ✅ Email + Password login
 * ✅ Google login (with new-user redirect to Register)
 * ✅ Forgot Password (Firebase reset email)
 * ✅ Forgot Email (lookup via publicUserIndex by Family SrNo)
 *
 * IMPORTANT FOR FUTURE EDITS:
 * ------------------------------------------------
 * - Do NOT remove modal states:
 *   showForgotPassword, showForgotEmail
 * - Forgot Email is NOT authentication – it is public lookup.
 * - Always add features BELOW existing sections, never replace them.
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth,db } from "../firebase";
import { ref, get } from "firebase/database";


export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogleChecked } = useAuth();

  /* ---------------- LOGIN FIELDS ---------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---------------- FORGOT PASSWORD ---------------- */
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  /* ---------------- FORGOT EMAIL (SRNO LOOKUP) ---------------- */
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [srno, setSrno] = useState("");
  const [emailList, setEmailList] = useState([]);

  /* ---------------- UI STATE ---------------- */
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- EMAIL LOGIN ---------------- */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  /* ---------------- GOOGLE LOGIN ---------------- */
  const handleGoogleLogin = async () => {
  setError("");
  setLoading(true);

  try {
    await loginWithGoogleChecked();

    // ✅ ALWAYS go home
    // Home/Register pages decide what happens next
    navigate("/");
  } catch (err) {
    console.error("Google login failed:", err);
    setError("Google login failed");
  }

  setLoading(false);
};


  /* ---------------- FORGOT PASSWORD ACTION ---------------- */
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError("Please enter your email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      alert("Password reset email sent");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch {
      setError("Unable to send reset email");
    }
  };

  /* ---------------- FORGOT EMAIL ACTION ---------------- */
/* ---------------- FORGOT EMAIL ACTION (FIXED) ---------------- */



const findEmailsBySrNo = async () => {
  setError("");
  setEmailList([]);
  setLoading(true);

  if (!srno) {
    setError("Enter Family Serial Number");
    setLoading(false);
    return;
  }

  try {
    const snap = await get(ref(db, `publicUserIndex/${srno}`));

    console.log("Forgot email lookup snapshot:", snap.val());

    if (!snap.exists()) {
      setError("No email records found for this family");
      setLoading(false);
      return;
    }

    const list = Object.values(snap.val()).map((u) => ({
      maskedEmail: u.maskedEmail,
      provider: u.provider,
    }));

    setEmailList(list);
  } catch (err) {
    console.error("Forgot email lookup failed:", err);
    setError("Unable to fetch email list");
  }

  setLoading(false);
};


  /* ============================ */
  /* ============ UI ============ */
  /* ============================ */

  return (
     <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow w-full max-w-sm p-6">

        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          className="w-full h-11 bg-red-500 text-white rounded font-medium mb-4"
        >
          Continue with Google
        </button>

        {/* DIVIDER */}
        <div className="flex items-center mb-4">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="mx-3 text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* EMAIL LOGIN */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2.5"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full border rounded px-3 py-2.5"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600"
            >
              Forgot Password?
            </button>
            <button
              type="button"
              onClick={() => setShowForgotEmail(true)}
              className="text-blue-600"
            >
              Forgot Email?
            </button>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-blue-600 text-white rounded font-medium"
          >
            Login
          </button>
        </form>

    <p className="text-center text-sm mt-5 text-gray-600">
  New user?{" "}
  <Link
    to="/register-email"
    className="text-blue-600 font-medium"
  >
    Create account
  </Link>
</p>


        {/* FORGOT PASSWORD */}
        {showForgotPassword && (
          <div className="mt-6 p-4 bg-gray-50 rounded border space-y-2">
            <input
              className="w-full border rounded px-3 py-2.5"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <button
              onClick={handleForgotPassword}
              className="w-full h-10 bg-blue-600 text-white rounded"
            >
              Send Reset Email
            </button>
            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        {/* FORGOT EMAIL */}
        {showForgotEmail && (
          <div className="mt-6 p-4 bg-gray-50 rounded border space-y-2">
            <input
              className="w-full border rounded px-3 py-2.5"
              placeholder="Family Serial Number"
              value={srno}
              onChange={(e) => setSrno(e.target.value)}
            />
            <button
              onClick={findEmailsBySrNo}
              className="w-full h-10 bg-green-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Searching…" : "Find Email"}
            </button>

            {emailList.length > 0 && (
              <div className="text-sm bg-white border rounded p-2 space-y-1">
                {emailList.map((e, i) => (
                  <div key={i}>📧 {e.maskedEmail} ({e.provider})</div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowForgotEmail(false)}
              className="w-full text-sm text-gray-600"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
