// src/components/CompleteProfileCard.jsx

import React, { useEffect, useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function CompleteProfileCard() {
  const { user, updateUserRecordCache } = useAuth();

  const isGoogleUser =
    user?.providerData?.[0]?.providerId === "google.com";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ✅ Prefill for Google users */
  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const saveProfile = async () => {
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!mobile.trim()) {
      setError("Mobile number is required");
      return;
    }

    try {
      setSaving(true);

      const profile = {
        name: name.trim(),
        email: user.email, // always from Auth
        mobile: mobile.trim(),
        role: "guest",
        familyId: null,
        createdAt: Date.now(),
        provider: user.providerData?.[0]?.providerId || "password",
      };

      // ✅ WRITE ONCE
      await set(ref(db, `users/${user.uid}`), profile);

      // ✅ Update AuthContext
      await updateUserRecordCache(profile);
    } catch (err) {
      console.error(err);
      setError("Unable to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white p-6 rounded shadow">
      <h3 className="text-xl font-bold text-center mb-2">
        Complete Your Profile
      </h3>

      <p className="text-sm text-gray-500 text-center mb-4">
        {isGoogleUser
          ? "We’ve filled details from your Google account"
          : "Just one step before continuing"}
      </p>

      {error && (
        <p className="text-red-500 text-sm text-center mb-3">
          {error}
        </p>
      )}

      {/* NAME */}
      <input
        className="w-full border px-3 py-2 rounded mb-3"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />

      {/* EMAIL (READ ONLY, GOOGLE CONFIDENCE) */}
      <input
        className="w-full border px-3 py-2 rounded mb-3 bg-gray-100 text-gray-600"
        value={user.email}
        disabled
      />

      {/* MOBILE */}
      <input
        className="w-full border px-3 py-2 rounded mb-4"
        placeholder="Mobile Number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        disabled={saving}
      />

      <button
        onClick={saveProfile}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {saving ? "Saving…" : "Continue"}
      </button>

      {isGoogleUser && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Signed in with Google
        </p>
      )}
    </div>
  );
}
