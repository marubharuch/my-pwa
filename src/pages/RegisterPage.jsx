// src/pages/RegisterPage.jsx

/**
 * 🧾 REGISTER PAGE – FROZEN VERSION (DO NOT BREAK)
 *
 * PURPOSE:
 * ------------------------------------------------
 * Completes user profile AFTER authentication.
 * This page NEVER authenticates directly.
 *
 * AUTH SOURCES:
 * ------------------------------------------------
 * ✅ Firebase Auth user → comes from AuthContext (`user`)
 * ✅ Profile data       → comes from AuthContext (`userRecord`)
 *
 * CRITICAL RULES (DO NOT VIOLATE):
 * ------------------------------------------------
 * ❌ NEVER read `/users/{uid}` here
 * ❌ NEVER call `get(ref(db, 'users/...'))`
 * ✅ `/users/{uid}` is written EXACTLY ONCE
 *
 * RESPONSIBILITY:
 * ------------------------------------------------
 * - Ask missing details (name, mobile)
 * - Create `/users/{uid}` if missing
 * - Sync AuthContext cache
 * - Redirect to Home
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { ref, set } from "firebase/database";

export default function RegisterPage() {
  const { user, userRecord, loading, updateUserRecordCache } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromGoogle = location.state?.fromGoogle === true;

  /* ---------------- FORM STATE ---------------- */
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------------- AUTH SAFETY ---------------- */
  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (userRecord) {
      navigate("/");
      return;
    }

    if (fromGoogle && user.displayName) {
      setName(user.displayName);
    }
  }, [user, userRecord, loading, fromGoogle, navigate]);

  /* ---------------- CREATE USER PROFILE ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!mobile.trim()) {
      setError("Mobile number is required");
      return;
    }

    if (!user) return;

    try {
      setSaving(true);

      const profile = {
        name: name.trim(),
        email: user.email,
        mobile: mobile.trim(),
        role: "guest",
        familySrno: null,
        createdAt: Date.now(),
        provider: user.providerData?.[0]?.providerId || "password",
      };

      // ✅ WRITE ONCE
      await set(ref(db, `users/${user.uid}`), profile);

      // ✅ SYNC AUTH CONTEXT CACHE (NO RELOAD NEEDED)
      await updateUserRecordCache(profile);

      // ✅ GO HOME
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading || !user || userRecord) {
    return <div className="p-6 text-center">Preparing registration…</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4">
          Complete Registration
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {saving ? "Saving…" : "Finish Registration"}
          </button>
        </form>

        {fromGoogle && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Signed in with Google
          </p>
        )}
      </div>
    </div>
  );
}
  