// src/pages/admin/AdminUsersPage.jsx

/**
 * 👥 ADMIN USERS PAGE
 *
 * ROLE BEHAVIOUR
 * ------------------------------------------------
 * 👑 superadmin:
 *  - View users (last 7 days default)
 *  - Search by email
 *  - Change any role
 *  - Cached via localForage
 *
 * 🛡️ admin:
 *  - NO default users shown
 *  - Search by FAMILY ID only
 *  - See users of that family only
 *  - Cannot assign admin/superadmin
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import localforage from "localforage";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

/* ================= CONFIG ================= */
const CACHE_KEY = "superadmin_users_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function AdminUsersPage() {
  const { userRecord, loading } = useAuth();
  const navigate = useNavigate();

  const role = userRecord?.role;

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Superadmin
  const [searchEmail, setSearchEmail] = useState("");
  const [showLast7Days, setShowLast7Days] = useState(true);

  // Admin
  const [familyId, setFamilyId] = useState("");

  /* ================= ACCESS CONTROL ================= */
  useEffect(() => {
    if (!loading && !["admin", "superadmin"].includes(role)) {
      navigate("/");
    }
  }, [loading, role, navigate]);

  /* ================= LOAD USERS (SUPERADMIN) ================= */
  const loadUsers = async (force = false) => {
    if (role !== "superadmin") return;

    setLoadingUsers(true);

    try {
      if (!force) {
        const cached = await localforage.getItem(CACHE_KEY);
        if (cached && Date.now() - cached.time < CACHE_TTL) {
          setUsers(cached.data);
          setLoadingUsers(false);
          return;
        }
      }

      const snap = await get(ref(db, "users"));
      if (!snap.exists()) {
        setUsers([]);
        return;
      }

      const list = Object.entries(snap.val()).map(([uid, u]) => ({
        uid,
        email: u.email || "",
        role: u.role || "guest",
        familyId: u.familyId || "",
        createdAt: u.createdAt || 0,
      }));

      await localforage.setItem(CACHE_KEY, {
        time: Date.now(),
        data: list,
      });

      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (role === "superadmin") {
      loadUsers();
    } else {
      setUsers([]); // admin sees nothing by default
    }
  }, [role]);

  /* ================= ADMIN SEARCH BY FAMILY ================= */
  const searchByFamily = async () => {
    if (!familyId.trim()) {
      alert("Enter Family ID");
      return;
    }

    setLoadingUsers(true);
    setUsers([]);

    try {
      const snap = await get(ref(db, "users"));
      if (!snap.exists()) {
        alert("No users found");
        return;
      }

      const matched = Object.entries(snap.val())
        .filter(([, u]) => String(u.familyId) === familyId.trim())
        .map(([uid, u]) => ({
          uid,
          email: u.email || "",
          role: u.role || "guest",
          familyId: u.familyId,
        }));

      setUsers(matched);
    } catch (e) {
      console.error(e);
      alert("Search failed");
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ================= ROLE CHANGE ================= */
  const changeRole = async (uid, newRole) => {
    if (
      role === "admin" &&
      ["admin", "superadmin"].includes(newRole)
    ) {
      alert("Admin cannot assign admin roles");
      return;
    }

    if (!window.confirm(`Change role to "${newRole}"?`)) return;

    try {
      await update(ref(db, `users/${uid}`), { role: newRole });

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid ? { ...u, role: newRole } : u
        )
      );

      if (role === "superadmin") {
        const cached = await localforage.getItem(CACHE_KEY);
        if (cached) {
          cached.data = cached.data.map((u) =>
            u.uid === uid ? { ...u, role: newRole } : u
          );
          await localforage.setItem(CACHE_KEY, cached);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update role");
    }
  };

  /* ================= FILTER (SUPERADMIN) ================= */
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const visibleUsers =
    role === "superadmin"
      ? users.filter((u) => {
          if (showLast7Days && u.createdAt < sevenDaysAgo)
            return false;
          if (
            searchEmail &&
            !u.email.toLowerCase().includes(searchEmail.toLowerCase())
          )
            return false;
          return true;
        })
      : users;

  /* ================= UI ================= */
  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        {role === "superadmin" ? "Users & Roles" : "Family Users"}
      </h1>

      {/* ================= CONTROLS ================= */}
      {role === "superadmin" ? (
        <div className="flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search by email…"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="border p-2 rounded flex-1 min-w-[200px]"
          />

          <button
            onClick={() => loadUsers(true)}
            disabled={loadingUsers}
            className="border px-4 py-2 rounded text-sm"
          >
            🔄 Refresh
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLast7Days}
              onChange={(e) =>
                setShowLast7Days(e.target.checked)
              }
            />
            Last 7 days
          </label>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            placeholder="Enter Family ID"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={searchByFamily}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Search
          </button>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {loadingUsers ? (
        <p className="text-gray-500">Loading users…</p>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Family</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Change</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.uid} className="border-t">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.familyId || "—"}</td>
                  <td className="p-2 font-semibold">{u.role}</td>
                  <td className="p-2">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        changeRole(u.uid, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="guest">guest</option>
                      <option value="approved">approved</option>
                      <option value="blocked">blocked</option>
                      {role === "superadmin" && (
                        <option value="admin">admin</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}

              {visibleUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
