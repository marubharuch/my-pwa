// src/components/FamilyEditForm.jsx
/**
 * 🏠 FAMILY EDIT FORM – PHASE 1 (FOUNDATION)
 *
 * 🔒 FROZEN CONTRACT (DO NOT BREAK):
 * ------------------------------------------------
 * ✅ This component ONLY:
 *    - Creates a family (meta)
 *    - Creates initial members
 *    - Updates family meta (city etc.)
 *
 * ✅ MEMBERS ARE STORED SEPARATELY
 *    ❌ DO NOT store members under `families/{srno}/members`
 *    ✅ Use `familyMembers/{srno}/{memberId}`
 *
 * ✅ WHY THIS DESIGN:
 * ------------------------------------------------
 * - Prevents full-family download on single member edit
 * - Enables timestamp-based delta sync later
 * - Keeps billing low
 * - Scales to large families
 *
 * 🔥 IMPORTANT:
 * ------------------------------------------------
 * ❌ Do NOT:
 *    - Read `/users/{uid}` here
 *    - Read existing members here
 *    - Touch join / approval logic
 *    - Modify familyDetailPage now
 *
 * ✅ Later phases will update READ logic only
 */

import React, { useState } from "react";
import { db } from "../firebase";
import {
  ref,
  set,
  update,
  runTransaction,
  push,
} from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FamilyEditForm({ mode = "create", familyData }) {
  const { user, updateUserRecordCache } = useAuth();
  const navigate = useNavigate();

  /* ---------------- FAMILY META ---------------- */
  const [family, setFamily] = useState({
    currentCity: familyData?.currentCity || "",
    nativeCity: familyData?.nativeCity || "",
  });

  /* ---------------- MEMBERS FORM ---------------- */
  const [members, setMembers] = useState(
    familyData?.members
      ? Object.values(familyData.members)
      : [{ id: null, name: "", mobile: "", gender: "Male" }]
  );

  /* ---------------- HELPERS ---------------- */
  const updateMember = (i, field, value) => {
    const copy = [...members];
    copy[i] = { ...copy[i], [field]: value };
    setMembers(copy);
  };

  const addMember = () => {
    setMembers([
      ...members,
      { id: null, name: "", mobile: "", gender: "Male" },
    ]);
  };

  const validate = () => {
    if (!family.currentCity) return "Current city is required";
    if (members.length === 0) return "At least one member required";
    if (!members[0].name) return "First member name is required";
    return null;
  };

  /* ============================
     MAIN SUBMIT
  ============================= */
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    if (!user) {
      alert("Login required");
      return;
    }

    const now = Date.now();
    let srno;

    try {
      /* ---------------------------------
         1️⃣ GENERATE FAMILY SRNO (SAFE)
      --------------------------------- */
      if (mode === "create") {
        await runTransaction(ref(db, "master/nextFamilySrno"), (val) => {
          srno = String(val || 1);
          return (val || 1) + 1;
        });
      } else {
        srno = familyData.srno;
      }

      /* ---------------------------------
         2️⃣ WRITE FAMILY META (NO MEMBERS)
      --------------------------------- */
      if (mode === "create") {
        await set(ref(db, `families/${srno}`), {
          currentCity: family.currentCity,
          nativeCity: family.nativeCity,
          createdBy: user.uid,
          editorEmails: { [user.uid]: true },
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await update(ref(db, `families/${srno}`), {
          currentCity: family.currentCity,
          nativeCity: family.nativeCity,
          updatedAt: now,
        });
      }

      /* ---------------------------------
         3️⃣ WRITE MEMBERS (SEPARATE NODE)
      --------------------------------- */
      const memberWrites = members.map((m) => {
        const id =
          m.id || push(ref(db, `familyMembers/${srno}`)).key;

        return set(ref(db, `familyMembers/${srno}/${id}`), {
          name: m.name,
          mobile: m.mobile,
          gender: m.gender,
          countryCode: "+91",
          active: true,
          createdAt: now,
          updatedAt: now,
          createdBy: user.uid,
        });
      });

      await Promise.all(memberWrites);

      /* ---------------------------------
         4️⃣ LINK USER (CREATE ONLY)
         ✅ NO READ – CACHE UPDATE ONLY
      --------------------------------- */
      if (mode === "create") {
        await update(ref(db, `users/${user.uid}`), {
          familySrno: srno,
          role: "member",
        });

        // ✅ Update AuthContext cache (NO reload required)
        await updateUserRecordCache({
          familySrno: srno,
          role: "member",
        });

        navigate(`/family/${srno}`);
      } else {
        alert("Family updated successfully");
      }
    } catch (e) {
      console.error("Family save failed", e);
      alert("Family save failed");
    }
  };

  /* ============================
     UI
  ============================= */
  return (
    <div className="space-y-4">
      {/* FAMILY INFO */}
      <input
        className="border p-2 w-full"
        placeholder="Current City"
        value={family.currentCity}
        onChange={(e) =>
          setFamily({ ...family, currentCity: e.target.value })
        }
      />

      <input
        className="border p-2 w-full"
        placeholder="Native City"
        value={family.nativeCity}
        onChange={(e) =>
          setFamily({ ...family, nativeCity: e.target.value })
        }
      />

      {/* MEMBERS */}
      <h3 className="text-lg font-bold">Members</h3>

      {members.map((m, i) => (
        <div key={m.id || i} className="border p-3 rounded space-y-2">
          <input
            className="border p-2 w-full"
            placeholder="Name"
            value={m.name}
            onChange={(e) =>
              updateMember(i, "name", e.target.value)
            }
          />
          <input
            className="border p-2 w-full"
            placeholder="Mobile"
            value={m.mobile}
            onChange={(e) =>
              updateMember(i, "mobile", e.target.value)
            }
          />
          <select
            className="border p-2 w-full"
            value={m.gender}
            onChange={(e) =>
              updateMember(i, "gender", e.target.value)
            }
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
