// src/pages/JoinFamilyPage.jsx

/**
 * 👪 JOIN FAMILY PAGE – READ OPTIMIZED
 *
 * IMPORTANT ARCHITECTURE RULES (DO NOT BREAK):
 * ------------------------------------------------
 * ✅ User profile MUST come from AuthContext (`userRecord`)
 * ✅ This page must NOT read `/users/{uid}` again
 * ✅ `pendingJoin` is derived from `userRecord`
 *
 * WHY:
 * - Avoid duplicate DB reads
 * - Keep billing low
 * - Single source of truth
 *
 * UI STATES (DO NOT REMOVE):
 * ------------------------------------------------
 * 1️⃣ Already in a family (disconnect option)
 * 2️⃣ Pending join request (cancel option)
 * 3️⃣ Fresh join request form
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, set, update, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinFamilyPage() {
  const { user, userRecord, loading } = useAuth();
  const navigate = useNavigate();

  /* ---------------- LOCAL UI STATE ---------------- */
  const [srno, setSrno] = useState("");
  const [familyLabel, setFamilyLabel] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = userRecord?.pendingJoin;
  const familySrno = userRecord?.familySrno;

  /* ---------------- LOAD FAMILY LABEL ONLY (OPTIONAL) ---------------- */
  useEffect(() => {
    if (!pending?.familySrno) return;

    get(ref(db, `families/${pending.familySrno}`)).then((snap) => {
      if (snap.exists()) {
        setFamilyLabel(
          snap.val().currentCity || snap.val().nativeCity || ""
        );
      }
    });
  }, [pending]);

  /* ---------------- SEND JOIN REQUEST ---------------- */
  const sendRequest = async () => {
    setError("");
    if (!srno) {
      setError("Please enter Family Serial Number");
      return;
    }

    try {
      setBusy(true);

      const famSnap = await get(ref(db, `families/${srno}`));
      if (!famSnap.exists()) {
        setError("Family not found");
        setBusy(false);
        return;
      }

      const payload = {
        familySrno: srno,
        requestedAt: Date.now(),
      };

      await set(ref(db, `users/${user.uid}/pendingJoin`), payload);
      await set(
        ref(db, `families/${srno}/pendingRequests/${user.uid}`),
        { requestedAt: Date.now() }
      );

    } catch (err) {
      console.error(err);
      setError("Unable to send join request");
    }

    setBusy(false);
  };

  /* ---------------- CANCEL JOIN REQUEST ---------------- */
  const cancelRequest = async () => {
    if (!pending) return;

    try {
      setBusy(true);

      await remove(ref(db, `users/${user.uid}/pendingJoin`));
      await remove(
        ref(db, `families/${pending.familySrno}/pendingRequests/${user.uid}`)
      );

    } catch (err) {
      console.error(err);
      setError("Unable to cancel request");
    }

    setBusy(false);
  };

  /* ---------------- DISCONNECT FROM CURRENT FAMILY ---------------- */
  const disconnectFamily = async () => {
    if (!familySrno) return;

    const ok = window.confirm(
      "You will leave your current family.\n\n" +
      "• You will be hidden from members\n" +
      "• You can request to join another family\n\n" +
      "Continue?"
    );
    if (!ok) return;

    try {
      setBusy(true);

      await update(ref(db, `families/${familySrno}/members/${user.uid}`), {
        active: false,
        leftAt: Date.now(),
      });

      await update(ref(db, `users/${user.uid}`), {
        familySrno: null,
        role: userRecord.role === "admin" ? "admin" : "guest",
      });

    } catch (err) {
      console.error(err);
      setError("Unable to disconnect family");
    }

    setBusy(false);
  };

  /* ---------------- GLOBAL LOADING ---------------- */
  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  /* ---------------- AUTH SAFETY ---------------- */
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
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        {/* ✅ STATE 1 — ALREADY IN FAMILY */}
        {familySrno && !pending && (
          <>
            <p className="text-center text-sm mb-4">
              ✅ You are already part of <b>Family #{familySrno}</b>
            </p>

            <button
              onClick={() => navigate(`/family/${familySrno}`)}
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

        {/* ✅ STATE 2 — PENDING */}
        {!familySrno && pending && (
          <>
            <p className="text-center text-sm mb-2">
              ⏳ Join request pending
            </p>

            <p className="text-center text-sm mb-4">
              Family #{pending.familySrno}
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

        {/* ✅ STATE 3 — NEW JOIN */}
        {!familySrno && !pending && (
          <>
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Family Serial Number"
              value={srno}
              onChange={(e) => setSrno(e.target.value)}
            />

            <button
              onClick={sendRequest}
              className="w-full bg-green-600 text-white py-2 rounded"
              disabled={busy}
            >
              Request to Join
            </button>
          </>
        )}
      </div>
    </div>
  );
}
