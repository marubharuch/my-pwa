import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, update, remove } from "firebase/database";

export default function JoinRequestsPanel({ familySrno }) {
  const { user } = useAuth();

  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ----------------------------------------
     LOAD PENDING REQUESTS
  ---------------------------------------- */
  useEffect(() => {
    async function loadRequests() {
      try {
        const snap = await get(
          ref(db, `families/${familySrno}/pendingEditorEmails`)
        );

        if (snap.exists()) {
          setRequests(snap.val());
        }
      } catch (err) {
        setError("Unable to load requests");
      }

      setLoading(false);
    }

    loadRequests();
  }, [familySrno]);

  /* ----------------------------------------
     APPROVE REQUEST
  ---------------------------------------- */
  const approve = async (uid) => {
    try {
      const updates = {};

      // add editor
      updates[`families/${familySrno}/editorEmails/${uid}`] = true;

      // remove pending
      updates[`families/${familySrno}/pendingEditorEmails/${uid}`] = null;

      // link user to family
      updates[`users/${uid}/familySrno`] = familySrno;
      updates[`users/${uid}/role`] = "member";

      await update(ref(db), updates);

      // update UI
      setRequests((prev) => {
        const copy = { ...prev };
        delete copy[uid];
        return copy;
      });
    } catch (err) {
      alert("Approve failed");
    }
  };

  /* ----------------------------------------
     REJECT REQUEST
  ---------------------------------------- */
  const reject = async (uid) => {
    try {
      await remove(
        ref(db, `families/${familySrno}/pendingEditorEmails/${uid}`)
      );

      setRequests((prev) => {
        const copy = { ...prev };
        delete copy[uid];
        return copy;
      });
    } catch {
      alert("Reject failed");
    }
  };

  /* ----------------------------------------
     UI
  ---------------------------------------- */
  if (loading)
    return <div className="p-2 text-sm text-gray-500">Loading requests...</div>;

  const entries = Object.keys(requests || {});

  if (entries.length === 0)
    return <div className="p-2 text-sm text-gray-500">No join requests</div>;

  return (
    <div className="border rounded-lg p-3 mt-4 bg-gray-50">
      <h3 className="font-semibold mb-2 text-sm">
        Pending Join Requests
      </h3>

      <div className="space-y-2">
        {entries.map((uid) => (
          <div
            key={uid}
            className="flex justify-between items-center bg-white p-2 rounded shadow-sm"
          >
            <span className="text-xs text-gray-700">
              UID: {uid.slice(0, 8)}...
            </span>

            <div className="space-x-2">
              <button
                onClick={() => approve(uid)}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded"
              >
                Approve
              </button>

              <button
                onClick={() => reject(uid)}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
