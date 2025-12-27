import React, { useState } from "react";
import { db } from "../../firebase";
import { ref, get, update, remove } from "firebase/database";
import { useAuth } from "../../context/AuthContext";

export default function SuperAdminFamilyDeletePage() {
  const { userRecord } = useAuth();

  const [familyId, setFamilyId] = useState("");
  const [family, setFamily] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(""); // delete-family | unlink-users | delete-all

  /* 🔒 ROLE GUARD */
  if (userRecord?.role !== "superadmin") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied (Superadmin only)
      </div>
    );
  }

  /* ================= SEARCH ================= */
  const searchFamily = async () => {
    if (!familyId.trim()) return;

    setLoading(true);
    setFamily(null);
    setUsers([]);

    const famSnap = await get(ref(db, `families/${familyId}`));
    if (!famSnap.exists()) {
      alert("Family not found");
      setLoading(false);
      return;
    }

    const usersSnap = await get(ref(db, "users"));
    const allUsers = usersSnap.val() || {};

    const linkedUsers = Object.entries(allUsers)
      .filter(([_, u]) => String(u.familyId) === String(familyId))
      .map(([uid, u]) => ({
        uid,
        name: u.name || "",
        email: u.email || "",
        role: u.role || "",
      }));

    setFamily(famSnap.val());
    setUsers(linkedUsers);
    setLoading(false);
  };

  /* ================= EXECUTE ================= */
  const executeAction = async () => {
    if (!action) {
      alert("Select an action");
      return;
    }

    if (
      !window.confirm(
        `⚠️ CONFIRM ACTION:\n${action}\nFamily ID: ${familyId}`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const updates = {};

      /* 🗑️ DELETE FAMILY ONLY */
      if (action === "delete-family") {
        await remove(ref(db, `families/${familyId}`));
      }

      /* 🧹 UNLINK USERS ONLY */
      if (action === "unlink-users") {
        users.forEach((u) => {
          updates[`users/${u.uid}/familyId`] = null;
        });
        await update(ref(db), updates);
      }

      /* 💥 DELETE FAMILY + USERS */
      if (action === "delete-all") {
        users.forEach((u) => {
          updates[`users/${u.uid}`] = null;
        });
        updates[`families/${familyId}`] = null;
        await update(ref(db), updates);
      }

      alert("Action completed successfully");
      setFamily(null);
      setUsers([]);
      setFamilyId("");
      setAction("");
    } catch (e) {
      console.error(e);
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Superadmin – Family Delete Tool</h2>

      <div className="flex gap-2">
        <input
          value={familyId}
          onChange={(e) => setFamilyId(e.target.value)}
          placeholder="Enter Family ID"
          className="border p-2 rounded w-48"
        />
        <button
          onClick={searchFamily}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Search
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* ================= FAMILY PREVIEW ================= */}
      {family && (
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Family Data</h3>
          <pre className="text-xs overflow-auto bg-white p-2 border rounded">
            {JSON.stringify(family, null, 2)}
          </pre>
        </div>
      )}

      {/* ================= USERS ================= */}
      {users.length > 0 && (
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">Linked Users</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">UID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="border p-2">{u.uid}</td>
                  <td className="border p-2">{u.name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ACTION SELECT ================= */}
      {family && (
        <div className="space-y-2">
          <label className="block font-semibold">Select Action</label>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            <option value="delete-family">Delete ONLY family</option>
            <option value="unlink-users">
              Remove familyId from users ONLY
            </option>
            <option value="delete-all">
              Delete family + ALL linked users
            </option>
          </select>

          <button
            onClick={executeAction}
            disabled={loading}
            className="bg-red-700 text-white px-6 py-2 rounded"
          >
            ⚠️ Execute Action
          </button>
        </div>
      )}
    </div>
  );
}
