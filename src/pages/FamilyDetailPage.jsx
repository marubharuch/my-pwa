import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, set, update, remove } from "firebase/database";

export default function FamilyDetailPage() {
  const { srno } = useParams();
  const { user } = useAuth();

  const [family, setFamily] = useState(null);
  const [pendingUsers, setPendingUsers] = useState({});
  const [loading, setLoading] = useState(true);

  const uid = user?.uid;

  /* ---------------------------------------
     LOAD FAMILY
  --------------------------------------- */
  useEffect(() => {
    async function loadFamily() {
      const snap = await get(ref(db, `families/${srno}`));
      if (snap.exists()) {
        setFamily(snap.val());
      }
      setLoading(false);
    }
    loadFamily();
  }, [srno]);

  /* ---------------------------------------
     CHECK EDITOR / ADMIN
  --------------------------------------- */
  const isEditor =
    user &&
    (user.role === "admin" ||
      family?.editorEmails?.[uid] === true);

  /* ---------------------------------------
     LOAD PENDING USERS (OPTION A)
  --------------------------------------- */
  useEffect(() => {
    async function enrichPendingRequests() {
      if (!family?.pendingRequests) {
        setPendingUsers({});
        return;
      }

      const enriched = {};

      for (const pendingUid of Object.keys(family.pendingRequests)) {
        const userSnap = await get(ref(db, `users/${pendingUid}`));
        if (userSnap.exists()) {
          enriched[pendingUid] = {
            ...family.pendingRequests[pendingUid],
            name: userSnap.val().name,
            email: userSnap.val().email,
            mobile: userSnap.val().mobile,
          };
        }
      }

      setPendingUsers(enriched);
    }

    if (family && isEditor) {
      enrichPendingRequests();
    }
  }, [family, isEditor]);

  /* ---------------------------------------
     APPROVE JOIN REQUEST
  --------------------------------------- */
  const approveJoin = async (requesterUid) => {
    if (!isEditor) return;

    const userSnap = await get(ref(db, `users/${requesterUid}`));
    if (!userSnap.exists()) return;

    const userData = userSnap.val();

    // 1️⃣ Add to family members
    await set(ref(db, `families/${srno}/members/${requesterUid}`), {
      name: userData.name,
      mobile: userData.mobile,
      active: true,
      joinedAt: Date.now(),
    });

    // 2️⃣ Update user profile
    await update(ref(db, `users/${requesterUid}`), {
      familySrno: srno,
      role: "member",
    });

    // 3️⃣ Remove pending entries
    await remove(ref(db, `users/${requesterUid}/pendingJoin`));
    await remove(
      ref(db, `families/${srno}/pendingRequests/${requesterUid}`)
    );

    // 4️⃣ Refresh
    const snap = await get(ref(db, `families/${srno}`));
    if (snap.exists()) setFamily(snap.val());
  };

  /* ---------------------------------------
     REJECT JOIN REQUEST
  --------------------------------------- */
  const rejectJoin = async (requesterUid) => {
    if (!isEditor) return;

    await remove(ref(db, `users/${requesterUid}/pendingJoin`));
    await remove(
      ref(db, `families/${srno}/pendingRequests/${requesterUid}`)
    );

    setPendingUsers((prev) => {
      const copy = { ...prev };
      delete copy[requesterUid];
      return copy;
    });
  };

  /* ---------------------------------------
     UI STATES
  --------------------------------------- */
  if (loading) return <div className="p-4">Loading family...</div>;
  if (!family) return <div className="p-4">Family not found</div>;

  const members = family.members
    ? Object.entries(family.members)
    : [];

  return (
    <div className="p-4 max-w-md mx-auto">

      {/* HEADER */}
      <h2 className="text-xl font-bold mb-4">
        Family #{srno}
      </h2>

      {/* ✅ PENDING REQUESTS */}
      {isEditor && Object.keys(pendingUsers).length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">
            Pending Join Requests
          </h3>

          {Object.entries(pendingUsers).map(([pid, req]) => (
            <div
              key={pid}
              className="border rounded p-3 mb-3 flex justify-between"
            >
              <div>
                <p className="font-semibold">{req.name}</p>
                <p className="text-sm">📧 {req.email}</p>
                <p className="text-sm">📱 {req.mobile || "-"}</p>
                <p className="text-xs text-gray-500">
                  Requested on{" "}
                  {new Date(req.requestedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => approveJoin(pid)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectJoin(pid)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ MEMBER LIST */}
      <h3 className="font-bold mb-2">Members</h3>

      <div className="space-y-3">
        {members.map(([id, m]) => (
          <div
            key={id}
            className={`p-3 rounded shadow ${
              m.active ? "bg-white" : "bg-gray-100 opacity-70"
            }`}
          >
            <div className="font-semibold">👤 {m.name}</div>
            <div className="text-sm text-gray-600">
              📱 {m.mobile || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
