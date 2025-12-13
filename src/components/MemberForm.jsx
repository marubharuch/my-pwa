// src/components/MemberForm.jsx

/**
 * 👤 MEMBER FORM – ADD / EDIT (FROZEN)
 *
 * CONTRACT (DO NOT BREAK):
 * ------------------------------------------------
 * - Parent controls DB writes
 * - onSave(data, id) is REQUIRED
 * - id === null  → add new member
 * - id !== null  → edit existing member
 *
 * RULES:
 * ------------------------------------------------
 * ❌ This component MUST NOT talk to Firebase
 * ❌ This component MUST NOT generate member IDs
 * ✅ Always send normalized member data
 */

import React, { useState, useEffect } from "react";

export default function MemberForm({ open, onClose, initial = null, onSave }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- PREFILL FOR EDIT ---------------- */
  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setMobile(initial.mobile || "");
      setGender(initial.gender || "");
      setRelationship(initial.relationship || "");
    } else {
      setName("");
      setMobile("");
      setGender("");
      setRelationship("");
    }
  }, [initial, open]);

  if (!open) return null;

  /* ---------------- SAVE ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) {
      alert("Name is required");
      return;
    }

    setLoading(true);

    try {
      await onSave(
        {
          name: cleanName,
          mobile: mobile.trim() || "",
          gender: gender || "",
          relationship: relationship.trim() || "",
          active: true,                 // ✅ always explicit
        },
        initial ? initial.id : null
      );

      onClose();
    } catch (err) {
      console.error("Member save error:", err);
      alert("Could not save member. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg p-4 w-full max-w-md z-10 shadow-lg"
      >
        <h3 className="text-lg font-bold mb-3">
          {initial ? "Edit Member" : "Add Member"}
        </h3>

        <label className="text-sm">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded mb-3"
        />

        <label className="text-sm">Mobile</label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        <label className="text-sm">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-3"
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <label className="text-sm">Relationship</label>
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
