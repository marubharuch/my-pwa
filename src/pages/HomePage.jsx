import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function HomePage() {
  const { user, userRecord, loading, logout } = useAuth();
  const navigate = useNavigate();

  // ❗ ALL HOOKS MUST BE AT THE TOP
  useEffect(() => {
    if (!loading && user && !userRecord) {
      navigate("/register", { replace: true });
    }
  }, [loading, user, userRecord, navigate]);

  /* ---------------- AUTH GATE ---------------- */
  if (!user) {
    return <div className="p-6 text-center">Please login</div>;
  }

  /* ---------------- GLOBAL LOADING ---------------- */
  if (loading) {
    return <div className="p-6 text-center">Loading your account…</div>;
  }

  /* ---------------- SAFETY: USER RECORD MISSING ---------------- */
  if (!userRecord) {
    // the redirect happens in useEffect → SAFE
    return <div className="p-6 text-center">Setting up your account…</div>;
  }

  /* ---------------- UI CONTENT ---------------- */
  const familySrno = userRecord.familyId; // FIXED
  const pendingJoin = userRecord.pendingJoin;
  const isAdmin = userRecord.role === "admin";

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Welcome, {userRecord.name}
      </h1>

      <div className="bg-white shadow rounded p-4 mb-6 text-sm">
        <p><strong>Email:</strong> {userRecord.email}</p>
        <p><strong>Role:</strong> {userRecord.role}</p>
      </div>

      {/* STATE A: FAMILY LINKED */}
      {familySrno && (
        <Link
          to={`/family/${familySrno}`}
          className="block w-full bg-blue-600 text-white py-2 rounded text-center mb-4"
        >
          View My Family
        </Link>
      )}

      {/* STATE B: JOIN PENDING */}
      {!familySrno && pendingJoin && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mb-4 text-sm text-center">
          <p className="font-semibold mb-1">⏳ Join Request Pending</p>
          <p className="mb-3">Family #{pendingJoin.familySrno}</p>

          <Link
            to="/join-family"
            className="block w-full bg-yellow-600 text-white py-2 rounded"
          >
            View / Cancel Join Request
          </Link>
        </div>
      )}

      {/* STATE C: NO FAMILY */}
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

      {isAdmin && (
        <Link
          to="/admin"
          className="block w-full bg-purple-600 text-white py-2 rounded text-center mt-4"
        >
          Admin Dashboard
        </Link>
      )}

      <button
        onClick={logout}
        className="w-full bg-red-500 text-white py-2 rounded mt-4"
      >
        Logout
      </button>
    </div>
  );
}
