// src/components/FamilyEditForm.jsx
import React, { useState } from "react";
import { db } from "../firebase";
import {
  ref,
  get,
  set,
  update,
  runTransaction,
  push,
} from "firebase/database";
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
      : [{ id: null, name: "", mobile: "", gender: "Male" }]
  );

  const updateMember = (i, field, value) => {
    const copy = [...members];
    copy[i] = { ...copy[i], [field]: value };
    setMembers(copy);
  };

  const addMember = () => {
    setMembers([...members, { id: null, name: "", mobile: "", gender: "Male" }]);
  };

  const validate = () => {
    if (!family.currentCity) return "Current city is required";
    if (members.length === 0) return "At least one member required";
    if (!members[0].name) return "First member name is required";
    return null;
  };

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

    const timestamp = Date.now();
    let srno;

    try {
      /* ✅ SAFE SRNO GENERATION */
      if (mode === "create") {
        await runTransaction(ref(db, "master/nextFamilySrno"), (val) => {
          srno = String(val || 1);
          return (val || 1) + 1;
        });
      } else {
        srno = familyData.srno;
      }

      /* ✅ BUILD MEMBERS SAFELY */
      const membersPayload = {};
      members.forEach((m) => {
        const id = m.id || push(ref(db)).key;
        membersPayload[id] = {
          id,
          name: m.name,
          mobile: m.mobile,
          gender: m.gender,
          countryCode: "+91",
          active: m.active !== false,
        };
      });

      const familyPayload = {
        currentCity: family.currentCity,
        nativeCity: family.nativeCity,
        updatedAt: timestamp,
        members: membersPayload,
      };

      /* ✅ WRITE FAMILY */
      if (mode === "create") {
        await set(ref(db, `families/${srno}`), {
          ...familyPayload,
          createdAt: timestamp,
          createdBy: user.uid,
          editorEmails: { [user.uid]: true },
        });
      } else {
        await update(ref(db, `families/${srno}`), familyPayload);
      }

      /* ✅ SUMMARY */
      await update(ref(db, `familyDetails/${srno}`), {
        currentCity: family.currentCity,
        nativeCity: family.nativeCity,
        totalMembers: Object.values(membersPayload).filter(m => m.active).length,
        lastUpdateTimestamp: timestamp,
      });

      /* ✅ USER LINK (CREATE ONLY) */
      if (mode === "create") {
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const prevRole = userSnap.val()?.role;

        await update(ref(db, `users/${user.uid}`), {
          familySrno: srno,
          role: prevRole === "admin" ? "admin" : "member",
        });

        await ensurePublicUserIndex({
          uid: user.uid,
          email: user.email,
          familySrno: srno,
          provider: user.providerData?.[0]?.providerId || "google",
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

  return (
    <div className="space-y-4">
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

      <h3 className="text-lg font-bold">Members</h3>

      {members.map((m, i) => (
        <div key={m.id || i} className="border p-3 rounded space-y-2">
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
