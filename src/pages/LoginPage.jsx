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
  const [useEmailAuth, setUseEmailAuth] = useState(false); // ✅ NEW

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

  /* ---------------- EMAIL REGISTER ---------------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Unable to create account");
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
    } catch {
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

  /* ---------------- FORGOT EMAIL ---------------- */
  const findEmailsBySrNo = async () => {
    setError("");
    setEmailList([]);
    setLoading(true);

    try {
      const snap = await get(
        ref(db, `families/${srno}/info/editorEmails`)
      );

      if (!snap.exists()) {
        setError("No email found for this family number");
        setLoading(false);
        return;
      }

      const uids = Object.keys(snap.val());

      const emails = await Promise.all(
        uids.map(async (uid) => {
          const eSnap = await get(ref(db, `users/${uid}/email`));
          return eSnap.exists() ? eSnap.val() : null;
        })
      );

      setEmailList(
        emails.filter(Boolean).map((email) => ({
          maskedEmail: email.replace(/(.{2}).+(@.+)/, "$1***$2"),
        }))
      );
    } catch {
      setError("Unable to fetch email");
    }

    setLoading(false);
  };

  /* ============================ UI ============================ */

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow w-full max-w-sm p-6">

        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? "Create Account" : "Registration/Sign In"}
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">
            {error}
          </p>
        )}

        {/* ================= GOOGLE MODE ================= */}
        {!useEmailAuth && (
  <>
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full h-11 bg-red-500 text-white rounded font-medium"
    >
      Continue with Google
    </button>

    <button
      onClick={() => setUseEmailAuth(true)}
      className="w-full mt-4 text-sm text-blue-600"
    >
      Use email & password instead
    </button>

    {/* ✅ FORGOT EMAIL */}
    <button
      type="button"
      onClick={() => setShowForgotEmail(true)}
      className="w-full mt-3 text-sm text-blue-600"
    >
      Forgot email?
    </button>
  </>
)}


        {/* ================= EMAIL MODE ================= */}
        {useEmailAuth && (
          <>
            <form
              onSubmit={isRegister ? handleRegister : handleEmailLogin}
              className="space-y-3"
            >
              <input
                className="w-full border rounded px-3 py-2.5"
                placeholder="Email address"
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
                  placeholder="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
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
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotEmail(true)}
                    className="text-blue-600"
                  >
                    Forgot email?
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
                  ? "Create account"
                  : "Sign in"}
              </button>
            </form>

            <p className="text-center text-sm mt-4">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsRegister(false)}
                    className="text-blue-600"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New here?{" "}
                  <button
                    onClick={() => setIsRegister(true)}
                    className="text-blue-600"
                  >
                    Create account
                  </button>
                </>
              )}
            </p>

            <button
              onClick={() => setUseEmailAuth(false)}
              className="w-full mt-4 text-sm text-gray-600"
            >
              Use Google instead
            </button>
          </>
        )}

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
              Send reset email
            </button>
          </div>
        )}

        {/* FORGOT EMAIL */}
        {showForgotEmail && (
          <div className="mt-6 p-4 bg-gray-50 rounded border space-y-2">
            <input
              className="w-full border rounded px-3 py-2.5"
              placeholder="Family serial number"
              value={srno}
              onChange={(e) => setSrno(e.target.value)}
            />
            <button
              onClick={findEmailsBySrNo}
              className="w-full h-10 bg-green-600 text-white rounded"
            >
              Find email
            </button>

            {emailList.map((e, i) => (
              <div key={i} className="text-sm">
                📧 {e.maskedEmail}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
