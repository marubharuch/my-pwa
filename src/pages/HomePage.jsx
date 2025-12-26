// src/pages/HomePage.jsx

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import CompleteProfileCard from "../components/CompleteProfileCard";

export default function HomePage() {
  const { user, userRecord, loading, logout } = useAuth();

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  /* ---------------- AUTH GATE ---------------- */
  if (!user) {
    return <div className="p-6 text-center">Please login</div>;
  }

  /* ---------------- PROFILE COMPLETION ---------------- */
  if (!userRecord) {
    return <CompleteProfileCard />;
  }

  /* ---------------- DERIVED STATE ---------------- */
  const familyId = userRecord.familyId;
  const pendingJoin = userRecord.pendingJoin;
  const isAdmin = userRecord.role === "admin";
    const isSuparAdmin = userRecord.role === "superadmin";
  /* ---------------- HOME UI ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Welcome, {userRecord.name}
      </h1>

      <div className="bg-white shadow rounded p-4 mb-6 text-sm">
        <p><strong>Email:</strong> {userRecord.email}</p>
        <p><strong>Role:</strong> {userRecord.role}</p>
      </div>

      {/* AFTER PROFILE → FORCE FAMILY CHOICE */}
      {!familyId && !pendingJoin && (
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

      {/* JOIN PENDING */}
      {!familyId && pendingJoin && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mb-4 text-sm text-center">
          <p className="font-semibold mb-1">⏳ Join Request Pending</p>
          <p className="mb-3">Family #{pendingJoin.familyId}</p>

          <Link
            to="/join-family"
            className="block w-full bg-yellow-600 text-white py-2 rounded"
          >
            View / Cancel Join Request
          </Link>
        </div>
      )}

      {/* FAMILY LINKED */}
      {familyId && (
        <Link
          to={`/family/${familyId}`}
          className="block w-full bg-blue-600 text-white py-2 rounded text-center mt-4"
        >
          View My Family
        </Link>
      )}

      {/* ADMIN */}
      {isAdmin && (
        <Link
          to="/admin"
          className="block w-full bg-purple-600 text-white py-2 rounded text-center mt-4"
        >
          Admin Dashboard
        </Link>
      )}
{isSuparAdmin && (
        <Link
          to="/superadmin"
          className="block w-full bg-purple-600 text-white py-2 rounded text-center mt-4"
        >
          Super Admin Dashboard
        </Link>
      )}

      <button
        onClick={logout}
        className="w-full bg-red-500 text-white py-2 rounded mt-6"
      >
        Logout
      </button>
    </div>
  );
}
