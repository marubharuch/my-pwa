import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { db, firestore } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { generateFamilySnapshot } from "../services/generateFamilySnapshot";
import { calculateFamilyDelta } from "../services/calculateFamilyDelta";
import FamilyEditForm from "../components/FamilyEditForm";

/**
 * 👑 ADMIN PAGE – FINAL
 *
 * FEATURES:
 * 1️⃣ View users
 * 2️⃣ Change user roles
 * 3️⃣ Create unlimited families (ADMIN)
 * 4️⃣ Generate Firestore snapshot
 * 5️⃣ View RTDB delta
 */

export default function AdminPage() {
  const { userRecord, loading } = useAuth();
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  const [snapshotMeta, setSnapshotMeta] = useState(null);
  const [deltaInfo, setDeltaInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const [showCreateFamily, setShowCreateFamily] = useState(false);

  /* ================= ACCESS CONTROL ================= */
  useEffect(() => {
    if (!loading && userRecord?.role !== "admin") {
      navigate("/");
    }
  }, [loading, userRecord, navigate]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await get(ref(db, "users"));
        if (snap.exists()) {
          const list = Object.entries(snap.val()).map(([uid, u]) => ({
            uid,
            ...u,
          }));
          setUsers(list);
        }
      } catch (err) {
        console.error("Admin: failed to load users", err);
      } finally {
        setUsersLoading(false);
      }
    }

    if (userRecord?.role === "admin") loadUsers();
  }, [userRecord]);

  /* ================= LOAD SNAPSHOT META ================= */
  useEffect(() => {
    async function loadSnapshotMeta() {
      try {
        const snap = await getDoc(
          doc(firestore, "familySnapshots", "snapshot_meta")
        );
        if (snap.exists()) setSnapshotMeta(snap.data());
      } catch (e) {
        console.error("Failed to load snapshot meta", e);
      }
    }

    if (userRecord?.role === "admin") loadSnapshotMeta();
  }, [userRecord]);

  /* ================= LOAD DELTA ================= */
  useEffect(() => {
    async function loadDelta() {
      if (!snapshotMeta?.generatedAt) return;
      try {
        const delta = await calculateFamilyDelta(snapshotMeta.generatedAt);
        setDeltaInfo(delta);
      } catch (e) {
        console.error("Delta calculation failed", e);
      }
    }
    loadDelta();
  }, [snapshotMeta]);

  /* ================= UPDATE USER ROLE ================= */
  const updateUserRole = async (uid, role) => {
    if (!window.confirm(`Change role to ${role}?`)) return;

    try {
      await update(ref(db, `users/${uid}`), { role });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role } : u))
      );
    } catch (err) {
      alert("Failed to update role");
      console.error(err);
    }
  };

  /* ================= SNAPSHOT ================= */
  const handleGenerateSnapshot = async () => {
    if (!window.confirm("Generate full family snapshot now?")) return;

    try {
      setBusy(true);
      const result = await generateFamilySnapshot();
      alert(`Snapshot created with ${result.parts} part(s)`);
      setSnapshotMeta(result);
    } catch (e) {
      alert("Snapshot generation failed");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  /* ================= DERIVED ================= */
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const visibleUsers = showTodayOnly
    ? users.filter((u) => u.createdAt >= todayStart.getTime())
    : users;

  /* ================= UI ================= */
  if (loading || userRecord?.role !== "admin") {
    return <div className="p-6 text-center">Loading admin…</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <button
          onClick={() => setShowCreateFamily(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Create New Family
        </button>
      </div>

      {/* ================= CREATE FAMILY MODAL ================= */}
      {showCreateFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCreateFamily(false)}
          />
          <div className="relative bg-white rounded shadow-lg p-6 w-full max-w-md z-10">
            <h2 className="text-lg font-semibold mb-3">
              Create New Family (Admin)
            </h2>

            <FamilyEditForm
              mode="create"
                linkUser={false} 
              onClose={() => setShowCreateFamily(false)}
            />
          </div>
        </div>
      )}

      {/* ================= USERS ================= */}
      <section className="bg-white rounded shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTodayOnly}
              onChange={(e) => setShowTodayOnly(e.target.checked)}
            />
            Today only
          </label>
        </div>

        {usersLoading ? (
          <p className="text-sm text-gray-500">Loading users…</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Change</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.uid}>
                  <td className="p-2">{u.name || "—"}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2 font-semibold">{u.role}</td>
                  <td className="p-2">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        updateUserRole(u.uid, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="admin">admin</option>
                      <option value="approved">approved</option>
                      <option value="guest">guest</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= SNAPSHOT ================= */}
      <section className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Family Snapshot</h2>

        <div className="text-sm space-y-1 mb-3">
          <div>Last Generated: {snapshotMeta?.generatedAtISO || "—"}</div>
          <div>Total Families: {snapshotMeta?.totalFamilies || "—"}</div>
          <div>Parts: {snapshotMeta?.parts || "—"}</div>
        </div>

        {deltaInfo && (
          <ul className="text-sm list-disc pl-5 mb-4">
            <li>Updated families: {deltaInfo.count}</li>
            <li>Approx size: {deltaInfo.sizeHuman}</li>
          </ul>
        )}

        <button
          onClick={handleGenerateSnapshot}
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate Snapshot"}
        </button>
      </section>
    </div>
  );
}
