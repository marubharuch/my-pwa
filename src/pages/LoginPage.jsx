// src/pages/LoginPage.jsx

/**
 * 🔐 LOGIN + REGISTER (MERGED) – FINAL
 *
 * FEATURES:
 * ------------------------------------------------
 * ✅ Email + Password login
 * ✅ Email + Password + Confirm Password registration
 * ✅ Auto-login after registration
 * ✅ Google login
 * ✅ Forgot Password
 * ✅ Forgot Email (Family SrNo lookup)
 *
 * IMPORTANT:
 * ------------------------------------------------
 * ❌ NO /users writes here
 * ❌ Auth only
 * ✅ Profile completion handled on HomePage
 */

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, get } from "firebase/database";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogleChecked } = useAuth();

  /* ---------------- MODE ---------------- */
  const [isRegister, setIsRegister] = useState(false);

  /* ---------------- FIELDS ---------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ---------------- UI STATE ---------------- */
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- FORGOT PASSWORD ---------------- */
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  /* ---------------- FORGOT EMAIL ---------------- */
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [srno, setSrno] = useState("");
  const [emailList, setEmailList] = useState([]);

  /* ---------------- EMAIL LOGIN ---------------- */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EMAIL REGISTER (AUTO LOGIN) ---------------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ Creates user AND logs in automatically
      await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Go home – profile completion handled there
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- GOOGLE LOGIN ---------------- */
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogleChecked();
      navigate("/");
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */
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

  /* ---------------- FORGOT EMAIL (SRNO LOOKUP) ---------------- */
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
    // 1️⃣ Get editor UIDs
    const editorsSnap = await get(
      ref(db, `families/${srno}/info/editorEmails`)
    );

    if (!editorsSnap.exists()) {
      setError("No editor found for this family");
      setLoading(false);
      return;
    }

    const editorUids = Object.keys(editorsSnap.val());

    // 2️⃣ Fetch editor emails from users
    const emailPromises = editorUids.map(async (uid) => {
      const emailSnap = await get(ref(db, `users/${uid}/email`));
      return emailSnap.exists() ? emailSnap.val() : null;
    });

    const emails = (await Promise.all(emailPromises)).filter(Boolean);

    if (emails.length === 0) {
      setError("No email available");
      setLoading(false);
      return;
    }

    // 3️⃣ Mask emails for display
    const list = emails.map((email) => ({
      maskedEmail: email.replace(/(.{2}).+(@.+)/, "$1***$2"),
      provider: "family editor",
    }));

    setEmailList(list);
  } catch (err) {
    console.error(err);
    setError("Unable to fetch email");
  }

  setLoading(false);
};



  /* ============================ */
  /* ============ UI ============ */
  /* ============================ */

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow w-full max-w-sm p-6">

        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? "Create Account" : "Login"}
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">
            {error}
          </p>
        )}

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
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

        {/* LOGIN / REGISTER FORM */}
        <form
          onSubmit={isRegister ? handleRegister : handleEmailLogin}
          className="space-y-3"
        >
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

          {isRegister && (
            <input
              className="w-full border rounded px-3 py-2.5"
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {!isRegister && (
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 text-white rounded font-medium"
          >
            {loading
              ? "Please wait…"
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        {/* TOGGLE MODE */}
        <p className="text-center text-sm mt-5 text-gray-600">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-blue-600 font-medium"
              >
                Login
              </button>
            </>
          ) : (
            <>
              New user?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-blue-600 font-medium"
              >
                Create account
              </button>
            </>
          )}
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
              disabled={loading}
              className="w-full h-10 bg-green-600 text-white rounded"
            >
              {loading ? "Searching…" : "Find Email"}
            </button>

            {emailList.length > 0 && (
              <div className="text-sm bg-white border rounded p-2 space-y-1">
                {emailList.map((e, i) => (
                  <div key={i}>
                    📧 {e.maskedEmail} ({e.provider})
                  </div>
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
