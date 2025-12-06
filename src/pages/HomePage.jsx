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

  // ✅ LOAD USER RECORD FROM RTDB
  useEffect(() => {
    if (!user) return;

    const loadUser = async () => {
      const snap = await get(ref(db, "users/" + user.uid));
      if (snap.exists()) {
        setUserRecord(snap.val());
      }
      setLoading(false);
    };

    loadUser();
  }, [user]);

  // ✅ AUTH CHECK
  if (!user) {
    return <div className="p-6 text-center">Please login</div>;
  }

  // ✅ FIRST-TIME USER SETUP MESSAGE (SHORT)
  if (loading) {
    return <div className="p-6 text-center">Setting up your account…</div>;
  }

  if (!userRecord) {
    return (
      <div className="p-6 text-center text-red-500">
        User record not found. Please refresh.
      </div>
    );
  }

  const hasFamily = !!userRecord.familySrno;
  const isAdmin = userRecord.role === "admin";

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4 text-center">
        Welcome, {userRecord.name}
      </h1>

      {/* USER INFO */}
      <div className="bg-white shadow rounded p-4 mb-6 text-sm">
        <p><strong>Email:</strong> {userRecord.email}</p>
        <p>
          <strong>Family SrNo:</strong>{" "}
          {userRecord.familySrno || "Not Assigned"}
        </p>
        <p>
          <strong>Role:</strong>{" "}
          <span className="uppercase">{userRecord.role}</span>
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-3">

        {/* ✅ NEW USER */}
        {!hasFamily && (
          <>
            <Link
              to="/join-family"
              className="block w-full bg-green-500 text-white py-2 rounded text-center"
            >
              Join a Family
            </Link>

            <Link
              to="/create-family"
              className="block w-full bg-blue-500 text-white py-2 rounded text-center"
            >
              Create New Family
            </Link>
          </>
        )}

        {/* ✅ EXISTING FAMILY */}
        {hasFamily && (
          <Link
            to={`/family/${userRecord.familySrno}`}
            className="block w-full bg-blue-600 text-white py-2 rounded text-center"
          >
            View My Family
          </Link>
        )}

        {/* ✅ ADMIN */}
        {isAdmin && (
          <Link
            to="/admin"
            className="block w-full bg-purple-600 text-white py-2 rounded text-center"
          >
            Admin Dashboard
          </Link>
        )}

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
