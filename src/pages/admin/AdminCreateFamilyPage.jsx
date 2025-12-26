// src/pages/admin/AdminCreateFamilyPage.jsx

/**
 * 👑 ADMIN – CREATE FAMILY PAGE
 *
 * PURPOSE:
 * --------------------------------------------------
 * ✅ Allows ADMIN / SUPERADMIN to create unlimited families
 * ❌ Admin is NOT auto-linked to the family
 * ✅ Uses SAME FamilyEditForm used by normal users
 * ✅ No duplication of logic
 *
 * FLOW:
 * --------------------------------------------------
 * - Admin fills family details
 * - Family is created in RTDB
 * - Admin is NOT added as member
 * - Admin is redirected back to SuperAdmin dashboard
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FamilyEditForm from "../../components/FamilyEditForm";

export default function AdminCreateFamilyPage() {
  const navigate = useNavigate();
  const { userRecord } = useAuth();

  // 🔐 Safety: only admin / superadmin allowed
  if (userRecord?.role !== "admin" && userRecord?.role !== "superadmin") {
    return (
      <div className="p-6 text-center text-red-600">
        Access denied
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">
          Create Family (Admin)
        </h1>

        <button
          onClick={() => navigate("/superadmin")}
          className="text-sm text-blue-600"
        >
          ← Back
        </button>
      </div>

      {/* FORM */}
      <div className="bg-white p-4 rounded shadow">
        <FamilyEditForm
          mode="create"
          linkUser={false}        // 🔑 IMPORTANT: admin not linked
          onClose={() => navigate("/superadmin")}
        />
      </div>
    </div>
  );
}
