import React, { useState, useEffect } from "react";

export default function MemberDesignationForm({
  open,
  onClose,
  existing = {},
  onAdd,
  onRemove,
}) {
  const [title, setTitle] = useState("");
  const [srNo, setSrNo] = useState("");

  useEffect(() => {
    setTitle("");
    setSrNo("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-lg p-4 w-full max-w-md z-10 space-y-4">
        <h3 className="font-bold text-lg">Member Designations</h3>

        {/* EXISTING */}
        {Object.entries(existing).length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm">Existing</div>

            {Object.entries(existing)
              .sort((a, b) => a[1].srNo - b[1].srNo)
              .map(([key, d]) => (
                <div
                  key={key}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <div>
                    <b>{d.title}</b> (#{d.srNo})
                  </div>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove designation "${d.title}"?`
                        )
                      ) {
                        onRemove(key);
                      }
                    }}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* ADD NEW */}
        <div className="border-t pt-3 space-y-2">
          <div className="font-semibold text-sm">Add New</div>

          <input
            placeholder="Designation (e.g. Pramukh)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Display Sr No"
            value={srNo}
            onChange={(e) => setSrNo(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <button
            onClick={() => {
              if (!title || !srNo) {
                alert("Designation & Sr No required");
                return;
              }

              onAdd({
                title: title.trim(),
                srNo: Number(srNo),
              });

              setTitle("");
              setSrNo("");
            }}
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Add Designation
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full border p-2 rounded mt-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
