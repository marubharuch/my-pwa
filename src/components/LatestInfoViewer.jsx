// src/components/LatestInfoViewer.jsx
// PUBLIC VIEWER: DATE-BASED + CYCLIC (NO AUTH REQUIRED)

import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import localforage from "localforage";
import { firestore } from "../firebase";

const DOC_PATH = "latestInfo/main";

export default function LatestInfoViewer() {
  const [dateTopics, setDateTopics] = useState([]);
  const [cyclicTopic, setCyclicTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const snap = await getDoc(doc(firestore, DOC_PATH));
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const topics = snap.data().topics || [];

      /* ---------- DATE-BASED TOPICS ---------- */
      const todaysTopics = topics.filter(
        (t) => t.active && t.useDisplayDate && t.displayDate === today
      );
      setDateTopics(todaysTopics);

      /* ---------- CYCLIC TOPIC ---------- */
      const cyclicTopics = topics
        .filter((t) => t.active && !t.useDisplayDate)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      if (cyclicTopics.length > 0) {
        let index = await localforage.getItem("latestInfoRotationIndex");
        if (index === null || index >= cyclicTopics.length) index = 0;

        setCyclicTopic(cyclicTopics[index]);
        await localforage.setItem(
          "latestInfoRotationIndex",
          (index + 1) % cyclicTopics.length
        );
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) return null;
  if (dateTopics.length === 0 && !cyclicTopic) return null;

  return (
    <section
      className="
        mx-auto w-full
        px-3 py-4 space-y-4
        sm:max-w-xl sm:px-5 sm:space-y-5
        md:max-w-2xl md:px-6 md:space-y-6
      "
    >
      {/* ================= DATE-BASED TOPICS ================= */}
      {dateTopics.map((topic) => (
        <article
          key={topic.id}
          className="
            bg-[#fdfcf8]
            border border-gray-200
            rounded-lg shadow-sm
            p-4 sm:p-5
          "
        >
          <div className="text-xs tracking-widest text-gray-400 mb-1">
            Information
          </div>

          <h2 className="font-serif font-semibold text-gray-900 text-lg sm:text-xl mb-2">
            {topic.title}
          </h2>

          <hr className="border-gray-300 mb-3" />

          <div
            className="
              text-gray-800
              text-[15px]
              leading-relaxed
              whitespace-pre-line
              text-left
              sm:text-justify
            "
          >
            {topic.description}
          </div>
        </article>
      ))}

      {/* ================= CYCLIC TOPIC ================= */}
      {cyclicTopic && (
        <article
          className="
            bg-white
            border border-gray-200
            rounded-lg shadow-sm
            p-4 sm:p-5
          "
        >
          <div className="text-xs tracking-widest text-gray-400 mb-1">
            Information
          </div>

          <h3 className="font-serif font-medium text-gray-900 text-base sm:text-lg mb-2">
            {cyclicTopic.title}
          </h3>

          <hr className="border-gray-200 mb-3" />

          <div
            className="
              text-gray-700
              text-[14px]
              leading-relaxed
              whitespace-pre-line
              text-left
              sm:text-justify
            "
          >
            {cyclicTopic.description}
          </div>
        </article>
      )}
    </section>
  );
}
