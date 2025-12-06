// components/MemberForm.jsx
import React, { useState, useEffect } from "react";

export default function MemberForm({ open, onClose, initial = null, onSave }) {
  // initial = null for add, or object { id, name, mobile, gender, relationship }
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        mobile: mobile.trim(),
        gender: gender.trim(),
        relationship: relationship.trim()
      }, initial ? initial.id : null);
      onClose();
    } catch (err) {
      console.error("Member save error:", err);
      alert("Could not save member. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg p-4 w-full max-w-md z-10 shadow-lg"
      >
        <h3 className="text-lg font-bold mb-3">{initial ? "Edit Member" : "Add Member"}</h3>

        <label className="text-sm">Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} required className="w-full border px-3 py-2 rounded mb-3" />

        <label className="text-sm">Mobile</label>
        <input value={mobile} onChange={(e)=>setMobile(e.target.value)} className="w-full border px-3 py-2 rounded mb-3" />

        <label className="text-sm">Gender</label>
        <select value={gender} onChange={(e)=>setGender(e.target.value)} className="w-full border px-3 py-2 rounded mb-3">
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <label className="text-sm">Relationship</label>
        <input value={relationship} onChange={(e)=>setRelationship(e.target.value)} className="w-full border px-3 py-2 rounded mb-4" />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-500 text-white rounded">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
