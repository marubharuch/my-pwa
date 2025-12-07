// src/components/FamilyEditForm.jsx
import React, { useState } from "react";
import { db } from "../firebase";
import { ref, set, get, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ensurePublicUserIndex } from "../services/publicIndexService";

export default function FamilyEditForm({ mode = "create", familyData }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [family, setFamily] = useState({
    currentCity: familyData?.currentCity || "",
    nativeCity: familyData?.nativeCity || "",
  });

  const [members, setMembers] = useState(
    familyData?.members
      ? Object.values(familyData.members)
      : [{ name: "", mobile: "", gender: "Male" }]
  );

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addMember = () => {
    setMembers([...members, { name: "", mobile: "", gender: "Male" }]);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Login required");
      return;
    }

    const timestamp = Date.now();
    let srno;

    try {
      /* 1️⃣ GET SRNO */
      if (mode === "create") {
        const snap = await get(ref(db, "master/nextFamilySrno"));
        srno = String(snap.val() || 1);
      } else {
        srno = familyData.srno;
      }

      /* 2️⃣ BUILD FAMILY PAYLOAD */
      const familyPayload = {
        currentCity: family.currentCity,
        nativeCity: family.nativeCity,
        updatedAt: timestamp,
        createdBy: mode === "create" ? user.uid : familyData.createdBy,
        editorEmails:
          mode === "create"
            ? { [user.uid]: true }
            : familyData.editorEmails || { [user.uid]: true },
        members: {},
      };

      members.forEach((m) => {
        const id = m.id || timestamp + Math.floor(Math.random() * 100000);
        familyPayload.members[id] = {
          id,
          name: m.name,
          mobile: m.mobile,
          gender: m.gender,
          countryCode: "+91",
          active: m.active !== false,
        };
      });

      /* 3️⃣ WRITE FAMILY */
      await set(ref(db, `families/${srno}`), familyPayload);

      /* 4️⃣ WRITE SUMMARY */
      await set(ref(db, `familyDetails/${srno}`), {
        currentCity: family.currentCity,
        nativeCity: family.nativeCity,
        totalMembers: members.length,
        lastUpdateTimestamp: timestamp,
      });

      /* 5️⃣ IF CREATE – UPDATE MASTER + USER */
      if (mode === "create") {
        await update(ref(db, "master"), {
          nextFamilySrno: Number(srno) + 1,
        });

        await update(ref(db, `users/${user.uid}`), {
          familySrno: srno,
          role: "member",
        });

        /* ✅ PUBLIC INDEX (CRITICAL) */
        await ensurePublicUserIndex({
          uid: user.uid,
          email: user.email,
          familySrno: srno,
          provider: user.providerId || "google",
        });

        navigate(`/family/${srno}`);
      } else {
        alert("Family updated successfully!");
      }
    } catch (err) {
      console.error("❌ Family save failed:", err);
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <input
        className="border p-2 w-full"
        placeholder="Current City"
        value={family.currentCity}
        onChange={(e) => setFamily({ ...family, currentCity: e.target.value })}
      />

      <input
        className="border p-2 w-full"
        placeholder="Native City"
        value={family.nativeCity}
        onChange={(e) => setFamily({ ...family, nativeCity: e.target.value })}
      />

      <h3 className="text-lg font-bold">Members</h3>

      {members.map((m, i) => (
        <div key={i} className="border p-3 rounded space-y-2">
          <input
            className="border p-2 w-full"
            placeholder="Name"
            value={m.name}
            onChange={(e) => updateMember(i, "name", e.target.value)}
          />
          <input
            className="border p-2 w-full"
            placeholder="Mobile"
            value={m.mobile}
            onChange={(e) => updateMember(i, "mobile", e.target.value)}
          />
          <select
            className="border p-2 w-full"
            value={m.gender}
            onChange={(e) => updateMember(i, "gender", e.target.value)}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      ))}

      <button
        onClick={addMember}
        className="bg-gray-400 text-white p-2 rounded w-full"
      >
        + Add Member
      </button>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white p-2 rounded w-full"
      >
        {mode === "create" ? "Create Family" : "Save Changes"}
      </button>
    </div>
  );
}
