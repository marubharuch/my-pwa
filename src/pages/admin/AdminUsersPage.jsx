// src/pages/admin/AdminUsersPage.jsx

/**
 * 👥 ADMIN USERS PAGE – MOBILE FRIENDLY & SAFE
 *
 * FEATURES
 * ------------------------------------------------
 * - Unified search
 * - Call & WhatsApp icons
 * - WhatsApp session stored locally
 * - Visual feedback after WhatsApp click
 * - Admin: fix familyId
 * - Superadmin: role change + delete (with confirmation)
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update, remove } from "firebase/database";
import localforage from "localforage";
import {
  FaPhone,
  FaWhatsapp,
  FaTrash,
} from "react-icons/fa";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

/* ================= CONFIG ================= */
const CACHE_KEY = "superadmin_users_cache";
const WA_SESSION_KEY = "wa_last_contact";

export default function AdminUsersPage() {
  const { userRecord, loading } = useAuth();
  const navigate = useNavigate();
  const role = userRecord?.role;

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [waInfo, setWaInfo] = useState(null);

  /* ================= ACCESS CONTROL ================= */
  useEffect(() => {
    if (!loading && !["admin", "superadmin"].includes(role)) {
      navigate("/");
    }
  }, [loading, role, navigate]);

  /* ================= LOAD WA SESSION ================= */
  useEffect(() => {
    const saved = localStorage.getItem(WA_SESSION_KEY);
    if (saved) setWaInfo(JSON.parse(saved));
  }, []);

  /* ================= SEARCH USERS ================= */
  const searchUsers = async () => {
    if (!searchText.trim()) {
      alert("Enter search text");
      return;
    }

    setLoadingUsers(true);
    setUsers([]);

    try {
      const snap = await get(ref(db, "users"));
      if (!snap.exists()) return;

      const q = searchText.toLowerCase();

      const list = Object.entries(snap.val())
        .filter(([, u]) =>
          u?.email?.toLowerCase().includes(q) ||
          u?.name?.toLowerCase().includes(q) ||
          u?.mobile?.includes(q) ||
          u?.altMobile?.includes(q) ||
          String(u?.familyId || "").includes(q)
        )
        .map(([uid, u]) => ({
          uid,
          email: u.email || "",
          name: u.name || "",
          role: u.role || "guest",
          familyId: u.familyId || "",
          mobile: u.mobile || "",
          altMobile: u.altMobile || "",
        }));

      setUsers(list);
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ================= USERS WITH MISSING FAMILY ================= */
  const showMissingFamilyUsers = async () => {
    setLoadingUsers(true);
    setUsers([]);

    const snap = await get(ref(db, "users"));
    if (!snap.exists()) return;

    const list = Object.entries(snap.val())
      .filter(([, u]) => !u.familyId)
      .map(([uid, u]) => ({
        uid,
        email: u.email || "",
        name: u.name || "",
        role: u.role || "guest",
        familyId: "",
        mobile: u.mobile || "",
        altMobile: u.altMobile || "",
      }));

    setUsers(list);
    setLoadingUsers(false);
  };

  /* ================= UPDATE FAMILY ID ================= */
 const updateFamilyId = async (uid, familyId) => {
  if (!familyId.trim()) return;

  if (!window.confirm("Confirm update Family ID and editor access?")) return;

  // 1️⃣ Update user record
  await update(ref(db, `users/${uid}`), { familyId });

  // 2️⃣ Add editorEmails permission
  await update(
    ref(db, `families/${familyId}/info/editorEmails`),
    { [uid]: true }
  );

  // 3️⃣ Update UI state
  setUsers((p) =>
    p.map((u) =>
      u.uid === uid ? { ...u, familyId } : u
    )
  );
};


  /* ================= DELETE USER (SUPERADMIN ONLY) ================= */
  const deleteUser = async (u) => {
    const msg =
      `⚠️ DELETE USER CONFIRMATION\n\n` +
      `Name: ${u.name || "N/A"}\n` +
      `Email: ${u.email || "N/A"}\n` +
      `Mobile: ${u.mobile || "N/A"}\n\n` +
      `This will PERMANENTLY remove the user record.\n` +
      `This action CANNOT be undone.\n\n` +
      `Do you want to continue?`;

    if (!window.confirm(msg)) return;

    await remove(ref(db, `users/${u.uid}`));

    setUsers((p) => p.filter((x) => x.uid !== u.uid));

    if (role === "superadmin") {
      await localforage.removeItem(CACHE_KEY);
    }
  };

  /* ================= WHATSAPP ================= */
  const openWhatsApp = (u) => {
    if (!u.mobile) return;

    const session = {
      uid: u.uid,
      name: u.name,
      mobile: u.mobile,
      time: Date.now(),
    };

    localStorage.setItem(
      WA_SESSION_KEY,
      JSON.stringify(session)
    );
    setWaInfo(session);

    window.open(
      `https://wa.me/${u.mobile.replace(/\D/g, "")}`,
      "_blank"
    );
  };

  /* ================= UI ================= */
  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">User Management</h1>

      {/* WhatsApp feedback */}
      {waInfo && (
        <div className="text-sm bg-green-100 text-green-800 p-2 rounded">
          WhatsApp opened for <b>{waInfo.name || waInfo.mobile}</b>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="border p-2 rounded flex-1 min-w-[200px]"
          placeholder="Search name / email / phone / family"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <button
          onClick={searchUsers}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Search
        </button>

        <button
          onClick={showMissingFamilyUsers}
          className="border px-3 rounded"
        >
          Missing Family
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">User</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Family</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{u.name || "—"}</div>
                  <div className="text-xs text-gray-500">
                    {u.email}
                  </div>
                </td>

                <td className="p-2 flex gap-3 items-center">
                  <a
                    href={u.mobile ? `tel:${u.mobile}` : undefined}
                    className={`text-blue-600 ${
                      !u.mobile && "opacity-30"
                    }`}
                  >
                    <FaPhone size={18} />
                  </a>

                  <button
                    onClick={() => openWhatsApp(u)}
                    disabled={!u.mobile}
                    className={`text-green-600 ${
                      !u.mobile && "opacity-30"
                    }`}
                  >
                    <FaWhatsapp size={20} />
                  </button>
                </td>

                <td className="p-2">
                  {u.familyId || (
                    <input
                      className="border p-1 w-24"
                      placeholder="Family ID"
                      onBlur={(e) =>
                        updateFamilyId(u.uid, e.target.value)
                      }
                    />
                  )}
                </td>

                <td className="p-2">
                  {role === "superadmin" && (
                    <button
                      onClick={() => deleteUser(u)}
                      className="text-red-600"
                      title="Delete user"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-gray-500"
                >
                  No users loaded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
