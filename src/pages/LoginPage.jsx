import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, get } from "firebase/database";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [srno, setSrno] = useState("");
  const [emailList, setEmailList] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- LOGIN ---------------- */
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

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch {
      setError("Google login failed");
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError("Please enter email");
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

  /* ---------------- FORGOT EMAIL (CORRECT & SAFE) ---------------- */
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

      if (!snap.exists()) {
        setError("No emails found for this family");
        setLoading(false);
        return;
      }

      const list = Object.values(snap.val()).map((u) => ({
        maskedEmail: u.maskedEmail,
        provider: u.provider
      }));

      setEmailList(list);
    } catch {
      setError("Unable to fetch email list");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm relative">

        <h2 className="text-2xl font-bold text-center mb-5">Login</h2>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded mb-4"
        >
          Continue with Google
        </button>

        {/* DIVIDER */}
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="mx-2 text-gray-500 text-sm">OR</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* EMAIL LOGIN */}
        <form onSubmit={handleEmailLogin}>
          <input
            className="w-full border px-3 py-2 rounded mb-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full border px-3 py-2 rounded mb-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div
            onClick={() => setShowForgotPassword(true)}
            className="text-right text-blue-600 text-sm mb-4 cursor-pointer"
          >
            Forgot Password?
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Login
          </button>
        </form>

        {/* REGISTER */}
        <p className="text-center text-sm mt-4">
          New user?{" "}
          <Link to="/register" className="text-blue-500">
            Register here
          </Link>
        </p>

        {/* FORGOT EMAIL LINK */}
        <div
          className="text-center text-sm text-gray-600 mt-5 cursor-pointer"
          onClick={() => setShowForgotEmail(true)}
        >
          Forgot email?
        </div>

        {/* ---------------- FORGOT PASSWORD MODAL ---------------- */}
        {showForgotPassword && (
          <div className="absolute inset-0 bg-white p-6 rounded shadow">
            <h3 className="text-lg font-bold mb-3">Reset Password</h3>

            <input
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />

            <button
              onClick={handleForgotPassword}
              className="w-full bg-blue-500 text-white py-2 rounded mb-2"
            >
              Send Reset Link
            </button>

            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ---------------- FORGOT EMAIL BOTTOM PANEL ---------------- */}
        {showForgotEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end">
            <div className="bg-white w-full rounded-t-xl p-5 max-h-[70vh] overflow-auto">

              <h3 className="text-lg font-bold mb-3">Find Email by Family No</h3>

              <input
                className="w-full border px-3 py-2 rounded mb-3"
                placeholder="Family Serial Number"
                value={srno}
                onChange={(e) => setSrno(e.target.value)}
              />

              <button
                onClick={findEmailsBySrNo}
                className="w-full bg-gray-800 text-white py-2 rounded mb-3"
                disabled={loading}
              >
                {loading ? "Searching..." : "Find Emails"}
              </button>

              {emailList.length > 0 && (
                <div className="bg-gray-100 rounded p-3 text-sm">
                  {emailList.map((e, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>{e.maskedEmail}</span>
                      <span className="text-gray-500 text-xs">
                        {e.provider}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowForgotEmail(false)}
                className="w-full mt-4 text-gray-600 text-sm"
              >
                Close
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
