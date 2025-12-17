import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get, update, remove } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function FamilyJoinRequestsPage() {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;

  const [requests, setRequests] = useState({});
  const [usersCache, setUsersCache] = useState({});
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState(null);

  /* ---------------- DEBUG: AUTH ---------------- */
  useEffect(() => {
    console.log("🔐 Auth UID:", uid);
  }, [uid]);

  /* ---------------- CHECK EDITOR PERMISSION ---------------- */
  useEffect(() => {
    async function checkEditor() {
      if (!uid) return;

      try {
        const snap = await get(
          ref(db, `families/${familyId}/info/editorEmails/${uid}`)
        );

        const editor = snap.exists();
        setIsEditor(editor);

        console.log("✍️ EditorEmails check:", {
          path: `families/${familyId}/info/editorEmails/${uid}`,
          exists: editor
        });

      } catch (err) {
        console.error("❌ EditorEmails read failed:", err.message);
      }
    }
    checkEditor();
  }, [familyId, uid]);

  /* ---------------- LOAD PENDING REQUESTS ---------------- */
  useEffect(() => {
    async function loadRequests() {
      try {
        const snap = await get(
          ref(db, `families/${familyId}/pendingRequests`)
        );

        console.log("📂 pendingRequests read OK:", snap.exists());

        const reqs = snap.exists() ? snap.val() : {};
        setRequests(reqs);

        /* Load requester user info */
        const cache = {};
        for (const ruid of Object.keys(reqs)) {
          try {
            const us = await get(ref(db, `users/${ruid}`));
            if (us.exists()) {
              cache[ruid] = us.val();
              console.log("👤 requester user loaded:", ruid, us.val());
            }
          } catch (e) {
            console.error("❌ requester user read failed:", ruid, e.message);
          }
        }
        setUsersCache(cache);

      } catch (err) {
        console.error("❌ pendingRequests read FAILED:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [familyId]);

  /* ---------------- APPROVE ---------------- */
  const approve = async (reqUid) => {
  if (!window.confirm("Approve join request for this family?")) return;
  setBusyUid(reqUid);

  try {
    /* 1️⃣ Grant editor permission */
    await update(
      ref(db, `families/${familyId}/info/editorEmails`),
      { [reqUid]: true }
    );

    /* 2️⃣ Link user to family */
    await update(ref(db, `users/${reqUid}`), {
      familyId: familyId,
      pendingJoin: null,
    });

    /* 3️⃣ Remove pending request */
    await remove(
      ref(db, `families/${familyId}/pendingRequests/${reqUid}`)
    );

    alert("User approved and linked to family ✅");

    navigate(`/family/${familyId}`, { replace: true });

  } catch (err) {
    console.error(err);
    alert("Approval failed ❌");
  } finally {
    setBusyUid(null);
  }
};



  /* ---------------- REJECT ---------------- */
const reject = async (reqUid) => {
  if (!window.confirm("Reject this request?")) return;
  setBusyUid(reqUid);

  try {
    await remove(
      ref(db, `families/${familyId}/pendingRequests/${reqUid}`)
    );

    await update(ref(db, `users/${reqUid}`), {
      pendingJoin: null,
    });

    alert("Request rejected ❌");

    navigate(`/family/${familyId}`, { replace: true });

  } catch (err) {
    alert("Failed to reject request ❌");
    console.error(err);
  } finally {
    setBusyUid(null);
  }
};

  /* ---------------- UI STATES ---------------- */
  if (loading || authLoading) return <div className="p-4">Loading…</div>;

  console.log("🛂 FINAL UI PERMISSION:", {
    uid,
    isEditor,
    canViewPage: isEditor
  });

  if (!isEditor) return <div className="p-4 text-red-600">Unauthorized</div>;

  const list = Object.entries(requests);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">
        Edit Access Requests ({list.length})
      </h2>

      {list.length === 0 && (
        <div className="text-sm text-gray-500">
          No pending requests
        </div>
      )}

      {list.map(([ruid, r]) => {
        const u = usersCache[ruid] || {};
        return (
          <div key={ruid} className="bg-white shadow rounded p-3 mb-3 text-sm">
            <div className="font-semibold">{u.name || "Unknown User"}</div>
            {u.email && <div>📧 {u.email}</div>}
            {u.mobile && <div>📱 {u.mobile}</div>}

            <div className="text-xs text-gray-400 mt-1">
              Requested on {new Date(r.requestedAt).toLocaleString()}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                disabled={busyUid === ruid}
                onClick={() => approve(ruid)}
                className="flex-1 bg-green-600 text-white py-1 rounded"
              >
                Approve
              </button>
              <button
                disabled={busyUid === ruid}
                onClick={() => reject(ruid)}
                className="flex-1 bg-red-500 text-white py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => navigate(-1)}
        className="mt-4 w-full bg-gray-200 py-2 rounded"
      >
        Back
      </button>
    </div>
  );
}
