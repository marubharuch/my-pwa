// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { ref, get } from "firebase/database";

export default function HomePage() {
  const { user, logout } = useAuth();
  const [userRecord, setUserRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadUser() {
      const snap = await get(ref(db, `users/${user.uid}`));
      if (snap.exists()) setUserRecord(snap.val());
      setLoading(false);
    }

    loadUser();
  }, [user]);

  if (!user) {
    return <div className="p-6 text-center">Please login</div>;
  }

  if (loading) {
    return <div className="p-6 text-center">Loading your account…</div>;
  }

  const familySrno = userRecord?.familySrno;
  const pendingJoin = userRecord?.pendingJoin;
  const isAdmin = userRecord?.role === "admin";

  return (
    <div className="p-4 max-w-md mx-auto">

      <h1 className="text-2xl font-bold mb-4 text-center">
        Welcome, {userRecord.name}
      </h1>

      {/* USER INFO */}
      <div className="bg-white shadow rounded p-4 mb-6 text-sm">
        <p><strong>Email:</strong> {userRecord.email}</p>
        <p><strong>Role:</strong> {userRecord.role}</p>
      </div>

      {/* ✅ ✅ ✅ STATE HANDLING */}

      {/* ✅ STATE 3 — APPROVED */}
      {familySrno && (
        <Link
          to={`/family/${familySrno}`}
          className="block w-full bg-blue-600 text-white py-2 rounded text-center mb-4"
        >
          View My Family
        </Link>
      )}

      {/* ✅ STATE 2 — PENDING */}
      {!familySrno && pendingJoin && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mb-4 text-sm text-center">
          <p className="font-semibold mb-1">
            ⏳ Join Request Pending
          </p>
          <p className="mb-3">
            Family #{pendingJoin.familySrno}
          </p>

          <Link
            to="/join-family"
            className="block w-full bg-yellow-600 text-white py-2 rounded"
          >
            View / Cancel Join Request
          </Link>
        </div>
      )}

      {/* ✅ STATE 1 — NO FAMILY */}
      {!familySrno && !pendingJoin && (
        <div className="space-y-3">
          <Link
            to="/join-family"
            className="block w-full bg-green-600 text-white py-2 rounded text-center"
          >
            Join a Family
          </Link>

          <Link
            to="/create-family"
            className="block w-full bg-blue-500 text-white py-2 rounded text-center"
          >
            Create New Family
          </Link>
        </div>
      )}

      {/* ✅ ADMIN */}
      {isAdmin && (
        <Link
          to="/admin"
          className="block w-full bg-purple-600 text-white py-2 rounded text-center mt-4"
        >
          Admin Dashboard
        </Link>
      )}

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="w-full bg-red-500 text-white py-2 rounded mt-4"
      >
        Logout
      </button>

    </div>
  );
}
