// src/pages/CreateFamilyPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, get } from "firebase/database";
import FamilyEditForm from "../components/FamilyEditForm";

export default function CreateFamilyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------
  // LOAD USER PROFILE FROM /users/{uid}
  // ---------------------------------------
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const snap = await get(ref(db, "users/" + user.uid));
        if (snap.exists()) {
          setProfile(snap.val());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading user profile in CreateFamilyPage:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // ---------------------------------------
  // DERIVED FLAGS
  // ---------------------------------------
  const isAdmin = profile?.role === "admin";
  const hasFamily = !!profile?.familySrno;

  // ---------------------------------------
  // UI STATES
  // ---------------------------------------
  if (!user && !loading) {
    // not logged in
    return (
      <div className="p-4 max-w-md mx-auto">
        <p className="text-center text-sm">
          Please log in to create a family.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <p>Loading your account...</p>
      </div>
    );
  }

  // Non-admin & already in a family → cannot create another
  if (!isAdmin && hasFamily) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">Create Family</h1>
        <p className="mb-4 text-sm text-gray-700">
          You are already linked to Family #{profile.familySrno}.  
          A user can be member of only one family.
        </p>

        <button
          onClick={() => navigate(`/family/${profile.familySrno}`)}
          className="w-full bg-blue-600 text-white py-2 rounded mb-2"
        >
          Go to My Family
        </button>

        <p className="text-xs text-gray-500">
          If your family number is wrong, please contact an admin to correct it.
        </p>
      </div>
    );
  }

  // Admin OR user without any family → show create form
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Create New Family</h1>

      {isAdmin ? (
        <p className="text-xs text-gray-600 mb-3">
          You are an <b>admin</b>. You can create multiple families.
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
