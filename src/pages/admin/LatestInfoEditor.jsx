// src/pages/admin/LatestInfoEditor.jsx

import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const DOC_PATH = "latestInfo/main";

export default function LatestInfoEditor() {
  /* ================= HOOKS (ALWAYS FIRST) ================= */
  const { userRecord, loading: authLoading } = useAuth();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!userRecord) return;

    const load = async () => {
      const ref = doc(firestore, DOC_PATH);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setTopics(snap.data().topics || []);
      } else {
        await setDoc(ref, {
          version: 1,
          topics: [],
          updatedAt: serverTimestamp(),
        });
        setTopics([]);
      }
      setLoading(false);
    };

    load();
  }, [userRecord]);

  /* ================= UI STATES ================= */

  if (authLoading || loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!["admin", "superadmin"].includes(userRecord?.role)) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied
      </div>
    );
  }

  /* ================= HELPERS ================= */

  const addNewTopic = () => {
    setTopics((prev) => [
      {
        id: `v${Date.now()}`,
        title: "",
        description: "",
        active: true,
        useDisplayDate: false,
        displayDate: "",
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const updateTopic = (index, field, value) => {
    const copy = [...topics];
    copy[index][field] = value;
    setTopics(copy);
  };

  const toggleActive = (index) => {
    const copy = [...topics];
    copy[index].active = !copy[index].active;
    setTopics(copy);
  };

  const saveAll = async () => {
    for (const t of topics) {
      if (t.useDisplayDate && !t.displayDate) {
        alert("Please select display date for scheduled topics");
        return;
      }
    }

    setSaving(true);
    try {
      await updateDoc(doc(firestore, DOC_PATH), {
        topics,
        updatedAt: serverTimestamp(),
      });
      alert("Latest information saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save data");
    }
    setSaving(false);
  };

  /* ================= MAIN UI ================= */

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        📢 Latest Information Editor
      </h1>

      {/* 🔝 TOP ACTION BAR */}
      <div className="flex gap-3 mb-4 sticky top-0 bg-white z-10 py-2">
        <button
          onClick={addNewTopic}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ➕ Add Topic
        </button>

        <button
          onClick={saveAll}
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          💾 {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {/* 🔄 REVERSED DISPLAY (INDEX SAFE) */}
      {[...topics].reverse().map((t, displayIndex) => {
        const i = topics.length - 1 - displayIndex;

        return (
          <div
            key={t.id}
            className="border rounded-lg p-4 mb-4 bg-white shadow-sm"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">
                Topic ID: {t.id}
              </span>

              <button
                onClick={() => toggleActive(i)}
                className={`px-3 py-1 text-sm rounded ${
                  t.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {t.active ? "Active" : "Disabled"}
              </button>
            </div>

            {/* TITLE */}
            <input
              type="text"
              placeholder="Title"
              value={t.title}
              onChange={(e) =>
                updateTopic(i, "title", e.target.value)
              }
              className="w-full border p-2 rounded mb-2"
            />

            {/* DESCRIPTION */}
            <textarea
              placeholder="Description"
              value={t.description}
              onChange={(e) =>
                updateTopic(i, "description", e.target.value)
              }
              rows={4}
              className="w-full border p-2 rounded"
            />

            {/* DISPLAY DATE */}
            <div className="mt-3 border rounded p-2 bg-gray-50">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={t.useDisplayDate || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateTopic(i, "useDisplayDate", checked);
                    if (!checked) {
                      updateTopic(i, "displayDate", "");
                    }
                  }}
                />
                Display on specific date
              </label>

              {t.useDisplayDate && (
                <div className="mt-2">
                  <input
                    type="date"
                    value={t.displayDate || ""}
                    onChange={(e) =>
                      updateTopic(i, "displayDate", e.target.value)
                    }
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
