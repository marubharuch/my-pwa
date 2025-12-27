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

  /* ================= STATE ================= */
  const [snapshotMeta, setSnapshotMeta] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deltaInfo, setDeltaInfo] = useState(null);

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
    const warning =
      "⚠️ Generate FULL RTDB snapshot?\n\n" +
      "• This will read ALL families from RTDB\n" +
      "• Existing Firestore snapshot will be overwritten\n" +
      "• All users will re-download data automatically\n\n" +
      "Do you want to continue?";

    if (!window.confirm(warning)) return;

    try {
      setBusy(true);

      // 🔑 Version bump (simple + safe)
      const newVersion = `v${Date.now()}`;

      const result = await generateFamilySnapshot(newVersion);

      alert(
        `Snapshot generated successfully\n\n` +
          `Version: ${newVersion}\n` +
          `Parts: ${result.parts}`
      );

      setSnapshotMeta(result);
    } catch (e) {
      console.error(e);
      alert("Snapshot generation failed");
    } finally {
      setBusy(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading || userRecord?.role !== "superadmin") {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading Super Admin Dashboard…
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">

      {/* ================= HEADER ================= */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-800">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          System control & maintenance
        </p>
      </div>

      {/* ================= ACTION CARDS ================= */}
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

      {/* ================= SNAPSHOT SUMMARY ================= */}
      <section className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Family Snapshot
        </h2>

        <div className="text-sm text-gray-700 space-y-1">
          <div>
            <b>Version:</b> {snapshotMeta?.version || "—"}
          </div>
          <div>
            <b>Last Generated:</b>{" "}
            {snapshotMeta?.generatedAtISO || "—"}
          </div>
          <div>
            <b>Total Families:</b>{" "}
            {snapshotMeta?.totalFamilies || "—"}
          </div>
          <div>
            <b>Parts:</b> {snapshotMeta?.parts || "—"}
          </div>
        </div>

        {deltaInfo && (
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Updated families: {deltaInfo.count}</li>
            <li>Approx size: {deltaInfo.sizeHuman}</li>
          </ul>
        )}

        <button
          onClick={handleGenerateSnapshot}
          disabled={busy}
          className="w-full mt-2 bg-red-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 active:scale-95 transition"
        >
          {busy ? "Generating Snapshot…" : "Generate Full Snapshot"}
        </button>
      </section>

      {/* ================= HOME ================= */}
      <button
        onClick={() => navigate("/")}
        className="w-full text-center py-3 rounded-lg border border-gray-300 text-gray-700 bg-gray-50 active:scale-95 transition"
      >
        ⬅ Back to Directory
      </button>
    </div>
  );
}
