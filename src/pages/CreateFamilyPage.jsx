// src/pages/CreateFamilyPage.jsx

/**
 * 🏠 CREATE FAMILY PAGE
 *
 * IMPORTANT REMARKS (DO NOT REMOVE):
 * ------------------------------------------------
 * ✅ This page DOES NOT read RTDB directly anymore
 * ✅ User profile (role, familySrno) MUST come from AuthContext
 * ✅ This avoids repeated `/users/{uid}` reads across pages
 *
 * ACCESS RULES:
 * ------------------------------------------------
 * - Not logged in → redirect to /login
 * - Logged in but no profile yet → redirect to /register
 * - Non-admin + already in family → blocked
 * - Admin OR user without family → allowed
 *
 * ⚠️ When adding new features:
 *    Do NOT add direct `get(ref(db, users/...))` here.
 */

import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import FamilyEditForm from "../components/FamilyEditForm";

export default function CreateFamilyPage() {
  const { user, userRecord, loading } = useAuth();
  const navigate = useNavigate();

  /* ---------------- AUTH SAFETY ---------------- */
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  /* ---------------- PROFILE NOT READY ---------------- */
  useEffect(() => {
    if (!loading && user && userRecord === null) {
      navigate("/register");
    }
  }, [loading, user, userRecord, navigate]);

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <p>Loading your account…</p>
      </div>
    );
  }

  if (!userRecord) {
    return null; // redirected
  }

  const isAdmin = userRecord.role === "admin";
  const hasFamily = !!userRecord.familySrno;

  /* ---------------- BLOCK NON-ADMIN ---------------- */
  if (!isAdmin && hasFamily) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">Create Family</h1>

        <p className="mb-4 text-sm text-gray-700">
          You are already linked to <b>Family #{userRecord.familySrno}</b>.
          A user can belong to only one family.
        </p>

        <button
          onClick={() => navigate(`/family/${userRecord.familySrno}`)}
          className="w-full bg-blue-600 text-white py-2 rounded mb-2"
        >
          Go to My Family
        </button>

        <p className="text-xs text-gray-500">
          If this is incorrect, please contact an admin.
        </p>
      </div>
    );
  }

  /* ---------------- ALLOWED ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Create New Family</h1>

      {isAdmin ? (
        <p className="text-xs text-gray-600 mb-3">
          You are an <b>admin</b>. You may create multiple families.
        </p>
      ) : (
        <p className="text-xs text-gray-600 mb-3">
          After creating this family, your account will be linked to it.
        </p>
      )}

      <FamilyEditForm mode="create" />
    </div>
  );
}
