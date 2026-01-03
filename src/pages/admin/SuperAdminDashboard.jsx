// src/pages/admin/SuperAdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { generateFamilySnapshot } from "../../services/generateFamilySnapshot";
import { calculateFamilyDelta } from "../../services/calculateFamilyDelta";

export default function SuperAdminDashboard() {
  const { userRecord, loading } = useAuth();
  const navigate = useNavigate();

  const [snapshotMeta, setSnapshotMeta] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deltaInfo, setDeltaInfo] = useState(null);
  const [snapshotMode, setSnapshotMode] = useState("hard");

  /* ================= ACCESS CONTROL ================= */
  useEffect(() => {
    if (!loading && userRecord?.role !== "superadmin") {
      navigate("/");
    }
  }, [loading, userRecord, navigate]);

  /* ================= LOAD SNAPSHOT META ================= */
  useEffect(() => {
    async function loadMeta() {
      try {
        const snap = await getDoc(
          doc(firestore, "familySnapshots", "snapshot_meta")
        );
        if (snap.exists()) {
          setSnapshotMeta(snap.data());
          setSnapshotMode("soft"); // allow soft once exists
        }
      } catch (e) {
        console.error("Failed to load snapshot meta", e);
      }
    }

    if (userRecord?.role === "superadmin") {
      loadMeta();
    }
  }, [userRecord]);

  /* ================= LOAD DELTA ================= */
  useEffect(() => {
    async function loadDelta() {
      if (!snapshotMeta?.generatedAt) return;

      try {
        const delta = await calculateFamilyDelta(snapshotMeta.generatedAt);
        setDeltaInfo(delta);
      } catch (e) {
        console.error("Delta calculation failed", e);
      }
    }

    loadDelta();
  }, [snapshotMeta]);

  /* ================= SNAPSHOT GENERATE ================= */
  const handleGenerateSnapshot = async () => {
    if (!snapshotMeta && snapshotMode === "soft") {
      alert("First snapshot must be HARD");
      return;
    }

    const isHard = snapshotMode === "hard";

    if (
      !window.confirm(
        isHard
          ? "Generate HARD snapshot? All users will reload."
          : "Generate SOFT snapshot? Only new users affected."
      )
    ) {
      return;
    }

    try {
      setBusy(true);

      const version = isHard
        ? `v${Date.now()}`
        : snapshotMeta.version;

      const result = await generateFamilySnapshot({
        version,
        reason: isHard ? "hard-regenerate" : "soft-regenerate",
        triggeredBy: userRecord?.uid || "superadmin",
      });

      alert(`Snapshot generated\nVersion: ${result.version}`);
      setSnapshotMeta(result);
    } catch (e) {
      console.error(e);
      alert(e.message || "Snapshot generation failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || userRecord?.role !== "superadmin") {
    return <div className="p-6 text-center">Loading…</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Super Admin Dashboard</h1>
 <p className="text-sm text-gray-500">
        System control & maintenance
      </p>
{/* ================= ACTION BUTTONS ================= */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <button
        onClick={() => navigate("/superadmin/create-family")}
        className="rounded-xl bg-green-600 text-white py-4 font-semibold shadow active:scale-95 transition"
      >
        ➕ Create Family
      </button>

      <button
        onClick={() => navigate("/superadmin/users")}
        className="rounded-xl bg-blue-600 text-white py-4 font-semibold shadow active:scale-95 transition"
      >
        👥 Users & Roles
      </button>

      <button
        onClick={() => navigate("/missingeditors")}
        className="rounded-xl bg-blue-600 text-white py-4 font-semibold shadow active:scale-95 transition"
      >
        👥 Broken Link Repairing
      </button>

      <button
        onClick={() => navigate("/superadmin/delete-family")}
        className="rounded-xl bg-red-600 text-white py-4 font-semibold shadow active:scale-95 transition"
      >
        🗑️ Delete Family
      </button>

      <button
        onClick={() => navigate("/superadmin/join-requests")}
        className="rounded-xl bg-purple-600 text-white py-4 font-semibold shadow active:scale-95 transition"
      >
        📨 Join Requests
      </button>


    </div>
      <section className="bg-white rounded shadow p-4 space-y-3">
        <div><b>Version:</b> {snapshotMeta?.version || "—"}</div>
        <div><b>Families:</b> {snapshotMeta?.totalFamilies || "—"}</div>
        <div><b>Parts:</b> {snapshotMeta?.parts || "—"}</div>

        {deltaInfo && (
          <div>Updated since snapshot: {deltaInfo.count}</div>
        )}

        <label>
          <input
            type="radio"
            checked={snapshotMode === "soft"}
            disabled={!snapshotMeta}
            onChange={() => setSnapshotMode("soft")}
          /> Soft
        </label>

        <label>
          <input
            type="radio"
            checked={snapshotMode === "hard"}
            onChange={() => setSnapshotMode("hard")}
          /> Hard
        </label>

        <button
          disabled={busy}
          onClick={handleGenerateSnapshot}
          className="w-full py-2 bg-red-600 text-white rounded"
        >
          {busy ? "Generating…" : "Generate Snapshot"}
        </button>
      </section>
    </div>
  );
}
