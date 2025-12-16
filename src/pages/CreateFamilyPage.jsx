import React, { useState } from "react";
import { db } from "../firebase";
import { ref, runTransaction, set } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateFamilyPage() {
  const { user, updateUserRecordCache } = useAuth();
  const navigate = useNavigate();

  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [address, setAddress] = useState(""); // ✅ NEW
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!currentCity.trim()) {
      alert("Current city is required");
      return;
    }

    if (!user) {
      alert("Login required");
      return;
    }

    setLoading(true);

    try {
      let familyId;
      const now = Date.now();

      /* 1️⃣ Generate family ID */
      await runTransaction(ref(db, "master/nextFamilySrno"), (val) => {
        familyId = String(val || 1);
        return (val || 1) + 1;
      });

      /* 2️⃣ Create family */
      await set(ref(db, `families/${familyId}`), {
        info: {
          currentCity: currentCity.trim(),
          nativeCity: nativeCity.trim(),
          address: address.trim(), // ✅ STORED HERE
          editorEmails: {
            [user.uid]: true,
          },
        },
        meta: {
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        },
        members: {}, // intentionally empty
      });

      /* 3️⃣ Link user */
      await set(ref(db, `users/${user.uid}/familyId`), familyId);

      updateUserRecordCache({ familyId });

      /* 4️⃣ Go to family page */
      navigate(`/family/${familyId}`);
    } catch (e) {
      console.error(e);
      alert("Family creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-bold">Create Family</h1>

      <input
        placeholder="Current City *"
        value={currentCity}
        onChange={(e) => setCurrentCity(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="Native City"
        value={nativeCity}
        onChange={(e) => setNativeCity(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* ✅ ADDRESS */}
      <textarea
        placeholder="Address (House no, society, area)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border p-2 rounded"
        rows={3}
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {loading ? "Creating..." : "Create Family"}
      </button>
    </div>
  );
}
