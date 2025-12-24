import React, { useState } from "react";
import { ref, get, set, update, runTransaction } from "firebase/database";
import { db } from "../firebase";

/**
 * 👑 ADMIN FAMILY CREATE FORM
 * ----------------------------------------
 * - Admin can create unlimited families
 * - Uses master/nextFamilySrno
 * - Sets admin as editor
 * - Safe with existing RTDB rules
 */

export default function AdminFamilyCreateForm({ adminUid, onCreated }) {
  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= HELPERS ================= */
  const toUpper = (v) => v.trim().toUpperCase();

  /* ================= CREATE FAMILY ================= */
  const createFamily = async () => {
    if (!currentCity || !nativeCity) {
      alert("Current City and Native City are required");
      return;
    }

    setLoading(true);

    try {
      // 🔢 Get next family serial number atomically
      const srnoRef = ref(db, "master/nextFamilySrno");

      const srnoResult = await runTransaction(srnoRef, (current) => {
        return (current || 0) + 1;
      });

      if (!srnoResult.committed) {
        throw new Error("Failed to generate family number");
      }

      const familyId = srnoResult.snapshot.val();
      const now = Date.now();

      /* ================= FAMILY OBJECT ================= */
      const familyData = {
        info: {
          currentCity: toUpper(currentCity),
          nativeCity: toUpper(nativeCity),
          address: address.trim(),
          editorEmails: {
            [adminUid]: true,
          },
        },
        members: {},
        pendingRequests: {},
        meta: {
          createdAt: now,
          createdBy: adminUid,
          updatedAt: now,
        },
      };

      /* ================= WRITE FAMILY ================= */
      await set(ref(db, `families/${familyId}`), familyData);

      alert(`Family #${familyId} created successfully`);

      // reset form
      setCurrentCity("");
      setNativeCity("");
      setAddress("");

      if (onCreated) {
        onCreated(familyId);
      }
    } catch (err) {
      console.error("Family creation failed", err);
      alert("Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="bg-white rounded shadow p-4 space-y-3 max-w-md">
      <h2 className="text-lg font-bold">Create New Family</h2>

      <input
        placeholder="Current City *"
        value={currentCity}
        onChange={(e) => setCurrentCity(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="Native City *"
        value={nativeCity}
        onChange={(e) => setNativeCity(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <textarea
        placeholder="Address (optional)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <button
        disabled={loading}
        onClick={createFamily}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Family"}
      </button>
    </div>
  );
}
