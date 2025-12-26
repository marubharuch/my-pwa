import React, { useState } from "react";
import { db } from "../../firebase";
import { ref, get, update, remove } from "firebase/database";
import { useAuth } from "../../context/AuthContext";

export default function AdminFamilyEditorRequestsPage() {
  console.log("Rendering AdminFamilyEditorRequestsPage");
  const { userRecord } = useAuth();

  const [familyId, setFamilyId] = useState("");
  const [familyInfo, setFamilyInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ================= SEARCH ================= */
  const searchFamily = async () => {
    if (!familyId) return;

    setLoading(true);
    setMessage("");
    setFamilyInfo(null);
    setRequests([]);

    try {
      const famSnap = await get(ref(db, `families/${familyId}`));
      if (!famSnap.exists()) {
        setMessage("Family not found");
        return;
      }

      const fam = famSnap.val();
      const pending = fam.pendingRequests || {};
      const userIds = Object.keys(pending);

      if (userIds.length === 0) {
        setFamilyInfo(fam.info);
        setMessage("No pending requests for this family");
        return;
      }

      const users = await Promise.all(
        userIds.map(async (uid) => {
          const uSnap = await get(ref(db, `users/${uid}`));
          if (!uSnap.exists()) return null;
          return { uid, ...uSnap.val() };
        })
      );

      setFamilyInfo(fam.info);
      setRequests(users.filter(Boolean));
    } catch (e) {
      console.error(e);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= APPROVE ================= */
  const approve = async (userId) => {
    try {
      // Give editor right in family
      await update(ref(db, `families/${familyId}/info/editorEmails`), {
        [userId]: true,
      });

      // Update user record
      await update(ref(db, `users/${userId}`), {
        role: "editor",
        [`editorFamilies/${familyId}`]: true,
      });

      // Remove pending request
      await remove(ref(db, `families/${familyId}/pendingRequests/${userId}`));

      setRequests((prev) => prev.filter((u) => u.uid !== userId));
      alert("Editor access granted");
    } catch (e) {
      console.error(e);
      alert("Approval failed");
    }
  };

  /* ================= REJECT ================= */
  const reject = async (userId) => {
    if (!window.confirm("Reject this request?")) return;

    try {
      await remove(ref(db, `families/${familyId}/pendingRequests/${userId}`));
      setRequests((prev) => prev.filter((u) => u.uid !== userId));
    } catch (e) {
      alert("Reject failed");
    }
  };

  /* ================= SECURITY ================= */
  if (userRecord?.role !== "admin") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Family Editor Requests (Admin)
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          value={familyId}
          onChange={(e) => setFamilyId(e.target.value)}
          placeholder="Enter Family ID"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={searchFamily}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {message && <div className="text-gray-600 mb-3">{message}</div>}

      {familyInfo && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div><b>Current City:</b> {familyInfo.currentCity}</div>
          <div><b>Native City:</b> {familyInfo.nativeCity}</div>
          <div><b>Address:</b> {familyInfo.address}</div>
        </div>
      )}

      {requests.map((u) => (
        <div
          key={u.uid}
          className="flex justify-between items-center border p-3 rounded mb-2 bg-white"
        >
          <div>
            <div className="font-semibold">{u.name}</div>
            <div className="text-sm text-gray-600">{u.mobile}</div>
            <div className="text-xs text-gray-500">{u.email}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => approve(u.uid)}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => reject(u.uid)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      {familyInfo && requests.length === 0 && !message && (
        <div className="text-gray-500">No pending editor requests</div>
      )}
    </div>
  );
}
