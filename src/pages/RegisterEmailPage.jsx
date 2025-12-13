// src/pages/RegisterEmailPage.jsx

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function RegisterEmailPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Auth user created
      // ✅ AuthContext will detect login
      // ✅ RegisterPage will handle profile
      navigate("/register");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-4">
          Create Account
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-3">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
