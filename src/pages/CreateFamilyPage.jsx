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

  // LOAD USER PROFILE
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const snap = await get(ref(db, `users/${user.uid}`));
        if (snap.exists()) {
          setProfile(snap.val());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // AUTH SAFETY
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // FIRST-TIME USER → REGISTER
  useEffect(() => {
    if (!loading && user && profile === null) {
      navigate("/register");
    }
  }, [loading, user, profile, navigate]);

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <p>Loading your account...</p>
      </div>
    );
  }

  if (!profile) {
    return null; // redirected
  }

  const isAdmin = profile.role === "admin";
  const hasFamily = !!profile.familySrno;

  // Non-admin & already has family
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
          If this is incorrect, please contact an admin.
        </p>
      </div>
    );
  }

  // ADMIN OR USER WITHOUT FAMILY
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
