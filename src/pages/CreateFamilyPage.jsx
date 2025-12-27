import React, { useState } from "react";
import { db } from "../firebase";
import { ref, runTransaction, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toUpperText } from "../utils/textUtils";

export default function CreateFamilyPage() {
  const { user, updateUserRecordCache } = useAuth();
  const navigate = useNavigate();

  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [samaj, setSamaj] = useState("");
  const [address, setAddress] = useState("");
  const [isMarriedOutside, setIsMarriedOutside] = useState(false); // default NO
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
  if (!currentCity.trim()) {
    alert("Current city is required");
    return;
  }

  if (isMarriedOutside && !samaj.trim()) {
    alert("Please enter Samaj name");
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

    /* 2️⃣ ATOMIC WRITE (FIX) */
    const updates = {};

    updates[`families/${familyId}`] = {
      info: {
        currentCity: toUpperText(currentCity.trim()),
        nativeCity: toUpperText(nativeCity.trim()),
        samaj: isMarriedOutside ? toUpperText(samaj.trim()) : "",
        address: address.trim(),
        editorEmails: {
          [user.uid]: true,
        },
      },
      meta: {
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
      },
      members: {},
    };

    updates[`users/${user.uid}/familyId`] = familyId;

    await update(ref(db), updates);

    /* 3️⃣ Cache + navigation */
    updateUserRecordCache({ familyId });
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
        onChange={(e) => setCurrentCity(toUpperText(e.target.value))}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="Native City"
        value={nativeCity}
        onChange={(e) => setNativeCity(toUpperText(e.target.value))}
        className="w-full border p-2 rounded"
      />

      {/* ✅ OUTSIDE DAUGHTER / SAMAJ SECTION */}
      <div className="p-3 border rounded bg-blue-50 space-y-3">
        <label className="block text-sm font-semibold">
          Are you a daughter married outside the VISA OSWAL – BVPV?
        </label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="marriedOutside"
              checked={isMarriedOutside === true}
              onChange={() => setIsMarriedOutside(true)}
            />
            Yes
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="marriedOutside"
              checked={isMarriedOutside === false}
              onChange={() => {
                setIsMarriedOutside(false);
                setSamaj("");
              }}
            />
            No
          </label>
        </div>

        {isMarriedOutside && (
          <div className="mt-2">
            <input
              placeholder="Enter Samaj Name *"
              value={samaj}
              onChange={(e) => setSamaj(toUpperText(e.target.value))}
              className="w-full border p-2 rounded bg-white border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-600 mt-1 italic">
              Please specify the community name.
            </p>
          </div>
        )}
      </div>

      {/* ADDRESS */}
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
