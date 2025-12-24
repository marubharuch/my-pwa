/**
 * 🏠 FAMILY EDIT FORM – UNIFIED (CREATE + EDIT)
 *
 * ✅ Same form for USER & ADMIN
 * ✅ City, Native & Samaj forced to UPPERCASE
 * ✅ Admin-created families tracked
 * ❌ Member creation REMOVED (handled elsewhere)
 */

import React, { useState } from "react";
import { db } from "../firebase";
import { ref, set, update, runTransaction } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/* ---------- HELPERS ---------- */
const toUpper = (v = "") => v.trim().toUpperCase();

export default function FamilyEditForm({
  mode = "create",
  familyData = null,
  linkUser = true, // admin will pass false
  onClose,
}) {
  const { user, userRecord, updateUserRecordCache } = useAuth();
  const navigate = useNavigate();

  console.log("Rendering FamilyEditForm");

  /* ---------------- FAMILY INFO ---------------- */
  const [family, setFamily] = useState({
    currentCity: familyData?.info?.currentCity || "",
    nativeCity: familyData?.info?.nativeCity || "",
    samaj: familyData?.info?.samaj || "",
    address: familyData?.info?.address || "",
  });

  const [saving, setSaving] = useState(false);

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    if (!family.currentCity) return "Current city is required";
   // if (!family.samaj) return "Samaj is required";
    if (!family.address.trim()) return "Family address is required";
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
      /* 1️⃣ GENERATE FAMILY ID (CREATE ONLY) */
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
            samaj: toUpper(family.samaj),
            address: family.address.trim(),
            editorEmails: { [user.uid]: true },
          },
          meta: {
            createdBy: user.uid,
            createdByRole: userRecord.role,
            createdVia: userRecord.role === "admin" ? "admin" : "self",
            createdAt: now,
            updatedAt: now,
          },
          members: {},
        });
      } else {
        await update(ref(db, `families/${familyId}/info`), {
          currentCity: toUpper(family.currentCity),
          nativeCity: toUpper(family.nativeCity),
          samaj: toUpper(family.samaj),
          address: family.address.trim(),
        });

        await update(ref(db, `families/${familyId}/meta`), {
          updatedAt: now,
        });
      }

      /* 3️⃣ LINK USER (ONLY IF ALLOWED) */
      if (mode === "create" && linkUser) {
        await update(ref(db, `users/${user.uid}`), {
          familyId,
          role: "member",
        });

        updateUserRecordCache({ familyId, role: "member" });
      }

      /* 4️⃣ NAVIGATION / CLOSE */
      if (mode === "create") {
        // ✅ BOTH USER & ADMIN GO TO FAMILY PAGE
        navigate(`/family/${familyId}`);
      } else {
        alert("Family updated successfully");
        onClose?.();
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
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">
        {mode === "create" ? "Create Family" : "Edit Family"}
      </h2>

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

      <input
        className="border p-2 w-full"
        placeholder="Samaj *"
        value={family.samaj}
        onChange={(e) =>
          setFamily({ ...family, samaj: toUpper(e.target.value) })
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

      <div className="flex gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border p-2 rounded"
          >
            Cancel
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : mode === "create"
            ? "Create Family"
            : "Update Family"}
        </button>
      </div>
    </div>
  );
}
