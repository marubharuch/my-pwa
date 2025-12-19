// src/pages/JoinFamilyPage.jsx

/**
 * 👪 JOIN FAMILY PAGE – FINAL (CLEAN & SAFE)
 *
 * RULES (DO NOT BREAK):
 * ------------------------------------------------
 * ✅ User profile ONLY from AuthContext (userRecord)
 * ✅ No direct /users reads
 * ✅ Optimistic UI via localPending
 * ✅ Uses familyId consistently
 * ✅ Atomic RTDB updates only
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinFamilyPage() {
  const { user, userRecord, loading } = useAuth();
  const navigate = useNavigate();

  /* ---------------- LOCAL STATE ---------------- */
  const [familyIdInput, setFamilyIdInput] = useState("");
  const [familyLabel, setFamilyLabel] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // optimistic pending state
  const [localPending, setLocalPending] = useState(null);

  /* ---------------- DERIVED STATE ---------------- */
  const familyId = userRecord?.familyId;
  const pending = localPending || userRecord?.pendingJoin;

  /* ---------------- LOAD FAMILY LABEL (LIGHT READ) ---------------- */
  useEffect(() => {
    let alive = true;

    if (!pending?.familyId) return;

    get(ref(db, `families/${pending.familyId}/info`)).then((snap) => {
      if (!alive) return;
      if (snap.exists()) {
        const info = snap.val();
        setFamilyLabel(info.currentCity || info.nativeCity || "");
      }
    });

    return () => {
      alive = false;
    };
  }, [pending]);

  /* ---------------- SEND JOIN REQUEST ---------------- */
  const sendRequest = async () => {
    setError("");

    const fid = familyIdInput.trim();
    if (!fid) {
      setError("Please enter Family Number");
      return;
    }

    try {
      setBusy(true);

      // validate family exists
      const famSnap = await get(ref(db, `families/${fid}`));
      if (!famSnap.exists()) {
        setError("Family not found");
        return;
      }

      const uid = user.uid;
      const requestedAt = Date.now();

      // atomic multi-path update
      const updates = {};
      updates[`families/${fid}/pendingRequests/${uid}/requestedAt`] =
        requestedAt;
      updates[`users/${uid}/pendingJoin`] = {
        familyId: fid,
        requestedAt,
      };

      await update(ref(db), updates);

      // optimistic UI
      setLocalPending({ familyId: fid, requestedAt });
      setFamilyIdInput("");
    } catch (err) {
      console.error(err);
      setError("Unable to send join request");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- CANCEL REQUEST ---------------- */
  const cancelRequest = async () => {
    if (!pending) return;

    try {
      setBusy(true);

      const uid = user.uid;
      const fid = pending.familyId;

      const updates = {};
      updates[`users/${uid}/pendingJoin`] = null;
      updates[`families/${fid}/pendingRequests/${uid}`] = null;

      await update(ref(db), updates);

      setLocalPending(null);
      setFamilyLabel("");
    } catch (err) {
      console.error(err);
      setError("Unable to cancel request");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- DISCONNECT FAMILY ---------------- */
  const disconnectFamily = async () => {
    if (!familyId) return;

    const ok = window.confirm(
      "You will leave your current family.\n\n" +
        "• You will be hidden from members\n" +
        "• You can join another family\n\nContinue?"
    );
    if (!ok) return;

    try {
      setBusy(true);

      const uid = user.uid;
      const now = Date.now();

      const updates = {};
      updates[`families/${familyId}/members/${uid}/active`] = false;
      updates[`families/${familyId}/members/${uid}/leftAt`] = now;
      updates[`users/${uid}/familyId`] = null;
      updates[`users/${uid}/role`] =
        userRecord.role === "admin" ? "admin" : "guest";

      await update(ref(db), updates);
    } catch (err) {
      console.error(err);
      setError("Unable to disconnect family");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  if (!user || !userRecord) {
    return <div className="p-6 text-center">Please login</div>;
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4">
          Join Family
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        {/* STATE 1 — ALREADY IN FAMILY */}
        {familyId && !pending && (
          <>
            <p className="text-center text-sm mb-4">
              ✅ You are part of <b>Family #{familyId}</b>
            </p>

            <button
              onClick={() => navigate(`/family/${familyId}`)}
              className="w-full bg-blue-600 text-white py-2 rounded mb-3"
            >
              Go to My Family
            </button>

            <button
              onClick={disconnectFamily}
              className="w-full bg-red-500 text-white py-2 rounded"
              disabled={busy}
            >
              Disconnect & Join Another
            </button>
          </>
        )}

        {/* STATE 2 — PENDING */}
        {!familyId && pending && (
          <>
            <p className="text-center text-sm mb-2">
              ⏳ Join request pending
            </p>

            <p className="text-center text-sm mb-4">
              Family #{pending.familyId}
              {familyLabel && ` – ${familyLabel}`}
            </p>

            <button
              onClick={cancelRequest}
              className="w-full bg-red-500 text-white py-2 rounded"
              disabled={busy}
            >
              Cancel Request
            </button>
          </>
        )}

        {/* STATE 3 — NEW JOIN */}
        {!familyId && !pending && (
          <>
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Family Number"
              value={familyIdInput}
              onChange={(e) => setFamilyIdInput(e.target.value)}
              disabled={busy}
            />

            <button
              onClick={sendRequest}
              className="w-full bg-green-600 text-white py-2 rounded"
              disabled={busy}
            >
              {busy ? "Sending request…" : "Request to Join"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
