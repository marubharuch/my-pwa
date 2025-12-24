/**
 * 🏠 FAMILY EDIT FORM – UNIFIED (CREATE + EDIT)
 *
 * ✅ Same form for USER & ADMIN
 * ✅ First member mandatory
 * ✅ City & Native forced to UPPERCASE
 * ✅ Admin-created families tracked
 * ✅ User linked ONLY when required
 */

import React, { useState } from "react";
import { db } from "../firebase";
import { ref, set, update, runTransaction } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import MemberForm from "./MemberForm";

/* ---------- HELPERS ---------- */
const toUpper = (v = "") => v.trim().toUpperCase();

export default function FamilyEditForm({
  mode = "create",
  familyData = null,
  linkUser = true, // 👈 IMPORTANT (admin will pass false)
}) {
  const { user, userRecord, updateUserRecordCache } = useAuth();
  const navigate = useNavigate();

  /* ---------------- FAMILY INFO ---------------- */
  const [family, setFamily] = useState({
    currentCity: familyData?.info?.currentCity || "",
    nativeCity: familyData?.info?.nativeCity || "",
    address: familyData?.info?.address || "",
  });

  /* ---------------- FIRST MEMBER ---------------- */
  const [firstMember, setFirstMember] = useState(
    familyData?.members
      ? Object.values(familyData.members)[0]
      : null
  );

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    if (!family.currentCity) return "Current city is required";
    if (!family.address.trim()) return "Family address is required";
    if (!firstMember) return "Please add first member";
    if (!firstMember.name) return "First member name is required";
    return null;
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    if (!user || !userRecord) {
      alert("Login required");
      return;
    }

    setSaving(true);
    const now = Date.now();
    let familyId;

    try {
      /* 1️⃣ GENERATE FAMILY ID (SAFE) */
      if (mode === "create") {
        const result = await runTransaction(
          ref(db, "master/nextFamilySrno"),
          (current) => (current || 1) + 1
        );

        if (!result.committed) {
          throw new Error("Family number generation failed");
        }

        familyId = String(result.snapshot.val() - 1);
      } else {
        familyId = familyData.familyId;
      }

      /* 2️⃣ WRITE FAMILY INFO */
      if (mode === "create") {
        await set(ref(db, `families/${familyId}`), {
          info: {
            currentCity: toUpper(family.currentCity),
            nativeCity: toUpper(family.nativeCity),
            address: family.address.trim(),
            editorEmails: { [user.uid]: true },
          },
          meta: {
            createdBy: user.uid,
            createdByRole: userRecord.role,
            createdVia: userRecord.role === "admin" ? "admin" : "self",
            createdAt: now,
            updatedAt: now,
            membersUpdatedAt: now,
          },
        });
      } else {
        await update(ref(db, `families/${familyId}/info`), {
          currentCity: toUpper(family.currentCity),
          nativeCity: toUpper(family.nativeCity),
          address: family.address.trim(),
        });

        await update(ref(db, `families/${familyId}/meta`), {
          updatedAt: now,
        });
      }

      /* 3️⃣ WRITE FIRST MEMBER (CREATE ONLY) */
      if (mode === "create") {
        const memberId = Date.now();

        await set(ref(db, `families/${familyId}/members/${memberId}`), {
          ...firstMember,
          id: memberId,
          active: true,
          createdAt: now,
          updatedAt: now,
          createdBy: user.uid,
        });

        await update(ref(db, `families/${familyId}/meta`), {
          updatedAt: now,
          membersUpdatedAt: now,
        });
      }

      /* 4️⃣ LINK USER (ONLY IF ALLOWED) */
      if (mode === "create" && linkUser) {
        await update(ref(db, `users/${user.uid}`), {
          familyId,
          role: "member",
        });

        updateUserRecordCache({ familyId, role: "member" });
        navigate(`/family/${familyId}`);
      } else {
        alert(
          mode === "create"
            ? "Family created successfully"
            : "Family updated successfully"
        );
      }
    } catch (e) {
      console.error("Family save failed", e);
      alert("Family save failed");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-4">
      <input
        className="border p-2 w-full"
        placeholder="Current City *"
        value={family.currentCity}
        onChange={(e) =>
          setFamily({ ...family, currentCity: toUpper(e.target.value) })
        }
      />

      <input
        className="border p-2 w-full"
        placeholder="Native City"
        value={family.nativeCity}
        onChange={(e) =>
          setFamily({ ...family, nativeCity: toUpper(e.target.value) })
        }
      />

      <textarea
        className="border p-2 w-full"
        placeholder="Family Address (House no, society, area)"
        value={family.address}
        onChange={(e) =>
          setFamily({ ...family, address: e.target.value })
        }
      />

      {!firstMember && !memberFormOpen && (
        <button
          type="button"
          onClick={() => {
            if (!family.currentCity || !family.address.trim()) {
              alert("Please enter city and address first");
              return;
            }
            setMemberFormOpen(true);
          }}
          className="w-full bg-gray-700 text-white p-2 rounded"
        >
          + Add First Member
        </button>
      )}

      {firstMember && !memberFormOpen && (
        <div className="p-3 border rounded bg-gray-50 flex justify-between">
          <div>
            <b>First Member:</b> {firstMember.name}
          </div>
          <button
            type="button"
            className="text-blue-600 text-sm"
            onClick={() => setMemberFormOpen(true)}
          >
            Edit
          </button>
        </div>
      )}

      <MemberForm
        open={memberFormOpen}
        initial={firstMember}
        onClose={() => setMemberFormOpen(false)}
        onSave={(data) => {
          setFirstMember(data);
          setMemberFormOpen(false);
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={saving || !firstMember}
        className="bg-blue-600 text-white p-2 rounded w-full disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : mode === "create"
          ? "Create Family"
          : "Update Family"}
      </button>
    </div>
  );
}
