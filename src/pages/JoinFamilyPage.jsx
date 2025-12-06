import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinFamilyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [srno, setSrno] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- JOIN REQUEST ---------------- */
  const requestJoin = async () => {
    setError("");
    setStatus("");
    setLoading(true);

    if (!srno) {
      setError("Please enter Family Serial Number");
      setLoading(false);
      return;
    }

    try {
      // ✅ Check family exists
      const snap = await get(ref(db, `families/${srno}`));
      if (!snap.exists()) {
        setError("Family not found");
        setLoading(false);
        return;
      }

      // ✅ Write join request
      await update(
        ref(db, `families/${srno}/pendingEditorEmails`),
        {
          [user.uid]: true
        }
      );

      setStatus("✅ Join request sent successfully");
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      console.error(err);
      setError("Unable to send join request");
    }

    setLoading(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">

        <h2 className="text-2xl font-bold text-center mb-4">
          Join Family
        </h2>

        <p className="text-sm text-gray-600 mb-4 text-center">
          Enter your Family Serial Number to request joining.
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        {status && (
          <p className="text-green-600 text-sm text-center mb-3">
            {status}
          </p>
        )}

        <input
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Family Serial Number"
          value={srno}
          onChange={(e) => setSrno(e.target.value)}
        />

        <button
          onClick={requestJoin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Sending..." : "Request to Join"}
        </button>

      </div>
    </div>
  );
}
