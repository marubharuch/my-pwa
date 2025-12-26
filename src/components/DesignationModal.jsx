import React, { useState } from "react";
import { db } from "../firebase";
import { ref, update, remove } from "firebase/database";

/**
 * ADMIN ONLY
 */
export default function DesignationModal({
  open,
  onClose,
  familyId,
  member,
  masterDesignations = {},
}) {
  const [selected, setSelected] = useState(
    member?.designation?.title || ""
  );
  const [saving, setSaving] = useState(false);

  if (!open || !member) return null;

  const handleSave = async () => {
    setSaving(true);

    try {
      if (!selected) {
        // REMOVE designation
        await remove(
          ref(
            db,
            `families/${familyId}/members/${member.id}/designation`
          )
        );
      } else {
        // ADD / UPDATE designation
        const d = masterDesignations[selected];

        await update(
          ref(
            db,
            `families/${familyId}/members/${member.id}`
          ),
          {
            designation: {
              title: selected,
              srno: d.srno,
            },
          }
        );
      }

      onClose();
    } catch (e) {
      console.error("Designation update failed", e);
      alert("Failed to update designation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-4 space-y-4">
        <h2 className="font-semibold text-lg">
          Assign Designation
        </h2>

        <div className="text-sm text-gray-700">
          <b>{member.name}</b>
        </div>

        <select
          className="w-full border p-2 rounded"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">— No Designation —</option>

          {Object.entries(masterDesignations).map(
            ([key, d]) => (
              <option key={key} value={key}>
                {d.label}
              </option>
            )
          )}
        </select>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded p-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded p-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
