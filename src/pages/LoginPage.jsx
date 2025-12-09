import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogleChecked } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [srno, setSrno] = useState("");
  const [emailList, setEmailList] = useState([]);

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

  /* ---------------- GOOGLE LOGIN (CORRECT) ---------------- */
  const handleGoogleLogin = async () => {
    try {
      const { isNewUser } = await loginWithGoogleChecked();

      if (isNewUser) {
        navigate("/register", { state: { fromGoogle: true } });
      } else {
        navigate("/");
      }
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

  /* ---------------- FORGOT EMAIL (PUBLIC INDEX) ---------------- */
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
      // NOTE: keep this public index logic here – this is NOT auth
      const snap = await window.firebase
        .database()
        .ref(`publicUserIndex/${srno}`)
        .get();

      if (!snap.exists()) {
        setError("No emails found for this family");
        setLoading(false);
        return;
      }

      const list = Object.values(snap.val()).map((u) => ({
        maskedEmail: u.maskedEmail,
        provider: u.provider,
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

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded mb-4"
        >
          Continue with Google
        </button>

        {/* DIVIDER */}
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-2 text-gray-500 text-sm">OR</span>
          <div className="flex-grow h-px bg-gray-300" />
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

        <p className="text-center text-sm mt-4">
          New user?{" "}
          <Link to="/register" className="text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
