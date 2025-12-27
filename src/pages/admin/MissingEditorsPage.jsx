import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, get, update } from "firebase/database";
import { useAuth } from "../../context/AuthContext";

export default function MissingEditorsPage() {
  const { userRecord } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewRepair, setPreviewRepair] = useState(false);

  const isAdminUser = ["admin", "superadmin"].includes(userRecord?.role);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!isAdminUser) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);

      const [familiesSnap, usersSnap] = await Promise.all([
        get(ref(db, "families")),
        get(ref(db, "users")),
      ]);

      const families = familiesSnap.val() || {};
      const users = usersSnap.val() || {};

      /* ================= FIND BROKEN LINKS ================= */
      const broken = Object.entries(families)
        .filter(([familyId, f]) => {
          if (!f || !f.info || !f.meta?.createdBy) return false;

          const uid = f.meta.createdBy;
          const user = users[uid];
          const editors = f.info.editorEmails || {};

          const editorMissing = !editors[uid];
          const familyLinkMissing =
            !user || String(user.familyId) !== String(familyId);

          return editorMissing || familyLinkMissing;
        })
        .map(([familyId, f]) => {
          const uid = f.meta.createdBy;
          const user = users[uid];

          const creatorRole = user?.role || "";
          const repairAllowedForRow =
            !["admin", "superadmin"].includes(creatorRole);

          return {
            familyId: String(familyId),
            city: f.info.currentCity || "",
            address: f.info.address || "",

            userId: uid,
            userName: user?.name || "❌ User record missing",
            email: user?.email || "",
            role: creatorRole,

            editorMissing: !f.info.editorEmails?.[uid],
            familyLinkMissing:
              !user || String(user.familyId) !== String(familyId),

            repairAllowedForRow,
          };
        });

      setRows(broken);
      setLoading(false);
    };

    load();
  }, [isAdminUser]);

  /* ================= BULK REPAIR FLOW ================= */

  const startPreview = () => {
    if (!isAdminUser) return;
    setPreviewRepair(true);
  };

  const finishRepair = async () => {
    if (!isAdminUser) return;

    const updates = {};

    rows.forEach((r) => {
      // 🔒 VERY IMPORTANT RULE
      if (!r.repairAllowedForRow) return;

      const uid = r.userId;
      const familyId = r.familyId;

      if (!uid || uid.startsWith("❌")) return;

      if (r.editorMissing) {
        updates[`families/${familyId}/info/editorEmails/${uid}`] = true;
      }

      if (r.familyLinkMissing) {
        updates[`users/${uid}/familyId`] = familyId;
      }
    });

    if (Object.keys(updates).length === 0) {
      alert("No eligible records to repair.");
      return;
    }

    try {
      await update(ref(db), updates);
      alert("Bulk repair completed successfully.");
      window.location.reload();
    } catch (err) {
      console.error("Bulk repair failed", err);
      alert("Bulk repair failed. Check console.");
    }
  };

  /* ================= RENDER ================= */

  if (!isAdminUser) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const repairableCount = rows.filter(
    (r) => r.repairAllowedForRow && (r.editorMissing || r.familyLinkMissing)
  ).length;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Broken Family ↔ User Links
      </h2>

      {!previewRepair && (
        <button
          onClick={startPreview}
          className="mb-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          🔍 Preview Bulk Repair
        </button>
      )}

      {previewRepair && (
        <button
          onClick={finishRepair}
          className="mb-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
        >
          ✅ Finish Repair ({repairableCount})
        </button>
      )}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Family ID</th>
              <th className="border p-2">City</th>
              <th className="border p-2">Address</th>
              <th className="border p-2">User ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Creator Role</th>
              <th className="border p-2">Issues</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`hover:bg-gray-50 ${
                  previewRepair &&
                  r.repairAllowedForRow &&
                  (r.editorMissing || r.familyLinkMissing)
                    ? "bg-green-100"
                    : ""
                }`}
              >
                <td className="border p-2">{r.familyId}</td>
                <td className="border p-2">{r.city}</td>
                <td className="border p-2">{r.address}</td>
                <td className="border p-2">{r.userId}</td>
                <td className="border p-2">{r.userName}</td>
                <td className="border p-2">{r.email}</td>
                <td className="border p-2">{r.role}</td>
                <td className="border p-2 text-red-600 font-semibold">
                  {r.editorMissing && "Editor missing "}
                  {r.editorMissing && r.familyLinkMissing && "| "}
                  {r.familyLinkMissing && "FamilyId not linked"}
                  {!r.repairAllowedForRow && " | Admin-created (skipped)"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Total broken families: <b>{rows.length}</b> <br />
        Repair eligible (non-admin): <b>{repairableCount}</b>
      </div>
    </div>
  );
}
