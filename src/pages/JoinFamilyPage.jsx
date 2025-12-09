// src/pages/JoinFamilyPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, set, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function JoinFamilyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [srno, setSrno] = useState("");
  const [pending, setPending] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------
     LOAD EXISTING PENDING REQUEST (IF ANY)
  --------------------------------------- */
  useEffect(() => {
    if (!user) return;

    async function loadPending() {
      try {
        const snap = await get(ref(db, `users/${user.uid}/pendingJoin`));
        if (snap.exists()) {
          const data = snap.val();
          setPending(data);
          setSrno(data.familySrno);

          // Optional: fetch family name / city
          const famSnap = await get(ref(db, `families/${data.familySrno}`));
          if (famSnap.exists()) {
            setFamilyName(
              famSnap.val().currentCity ||
              famSnap.val().nativeCity ||
              ""
            );
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    loadPending();
  }, [user]);

  /* ---------------------------------------
     SEND JOIN REQUEST
  --------------------------------------- */
  const sendRequest = async () => {
    setError("");

    if (!srno) {
      setError("Please enter Family Serial Number");
      return;
    }

    try {
      setLoading(true);

      // ✅ Verify family exists
      const famSnap = await get(ref(db, `families/${srno}`));
      if (!famSnap.exists()) {
        setError("Family not found");
        setLoading(false);
        return;
      }

      const payload = {
        familySrno: srno,
        requestedAt: Date.now(),
      };

      // ✅ Write user pending state
      await set(ref(db, `users/${user.uid}/pendingJoin`), payload);

      // ✅ Write family pending request
      await set(ref(db, `families/${srno}/pendingRequests/${user.uid}`), {
        name: user.displayName || user.email,
        requestedAt: Date.now(),
      });

      setPending(payload);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Unable to send join request");
      setLoading(false);
    }
  };

  /* ---------------------------------------
     CANCEL JOIN REQUEST
  --------------------------------------- */
  const cancelRequest = async () => {
    if (!pending) return;

    try {
      setLoading(true);

      await remove(ref(db, `users/${user.uid}/pendingJoin`));
      await remove(
        ref(db, `families/${pending.familySrno}/pendingRequests/${user.uid}`)
      );

      setPending(null);
      setSrno("");
      setFamilyName("");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Unable to cancel request");
      setLoading(false);
    }
  };

  /* ---------------------------------------
     UI STATES
  --------------------------------------- */
  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  // ✅ Already approved → redirect
  if (user?.familySrno) {
    navigate(`/family/${user.familySrno}`);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">

        <h2 className="text-2xl font-bold text-center mb-4">
          Join Family
        </h2>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        {/* ✅ PENDING STATE */}
        {pending ? (
          <>
            <p className="text-center text-sm text-gray-700 mb-2">
              ⏳ Join request pending
            </p>

            <p className="text-center text-sm mb-3">
              Family #{pending.familySrno}
              {familyName && ` – ${familyName}`}
            </p>

            <button
              onClick={cancelRequest}
              className="w-full bg-red-500 text-white py-2 rounded"
              disabled={loading}
            >
              Cancel Request
            </button>
          </>
        ) : (
          <>
            {/* ✅ INPUT */}
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Family Serial Number"
              value={srno}
              onChange={(e) => setSrno(e.target.value)}
            />

            <button
              onClick={sendRequest}
              className="w-full bg-blue-600 text-white py-2 rounded"
              disabled={loading}
            >
              Request to Join
            </button>
          </>
        )}
      </div>
    </div>
  );
}
