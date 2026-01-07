// src/components/FeedbackBoard.jsx
// FEEDBACK + USER RATINGS (OPTIMISTIC UI)

import React, { useEffect, useState } from "react";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  get,
  push,
  runTransaction,
} from "firebase/database";
import localforage from "localforage";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;
const CACHE_KEY = "feedback_cache_v3";

export default function FeedbackBoard() {
  const { user } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  /* ================= LOAD FEEDBACK ================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // 1️⃣ Load cache first
      const cached = await localforage.getItem(CACHE_KEY);
      if (cached && mounted) {
        setFeedbacks(cached);
        setLoading(false);
      }

      // 2️⃣ Load from RTDB
      const q = query(
        ref(db, "feedback"),
        orderByChild("createdAt"),
        limitToLast(limit)
      );

      const snap = await get(q);
      if (snap.exists() && mounted) {
        const list = Object.entries(snap.val()).map(
          ([id, v]) => ({ id, ...v })
        );

        list.sort((a, b) => b.createdAt - a.createdAt);

        setFeedbacks(list);
        await localforage.setItem(CACHE_KEY, list);
      }

      if (mounted) setLoading(false);
    };

    load();
    return () => (mounted = false);
  }, [limit, reloadKey]);

  /* ================= SUBMIT FEEDBACK ================= */

  const submitFeedback = async () => {
    if (!user || !message.trim()) return;

    const payload = {
      uid: user.uid,
      name: user.displayName || "Anonymous",
      message: message.trim(),
      createdAt: Date.now(),
      ratingStats: { avg: 0, count: 0 },
    };

    await push(ref(db, "feedback"), payload);

    await localforage.removeItem(CACHE_KEY);

    setMessage("");
    setShowModal(false);
    setLoading(true);
    setReloadKey((v) => v + 1);
  };

  /* ================= OPTIMISTIC RATING ================= */

  const rateFeedback = async (feedbackId, value) => {
    if (!user) return;

    // 🔹 1️⃣ OPTIMISTIC UI UPDATE
    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id !== feedbackId) return f;

        const prevRating = f.ratings?.[user.uid];
        const count = f.ratingStats?.count || 0;
        const avg = f.ratingStats?.avg || 0;

        let newCount = count;
        let total = avg * count;

        if (prevRating) {
          total = total - prevRating + value;
        } else {
          total += value;
          newCount += 1;
        }

        return {
          ...f,
          ratings: {
            ...(f.ratings || {}),
            [user.uid]: value,
          },
          ratingStats: {
            count: newCount,
            avg: total / newCount,
          },
        };
      })
    );

    // 🔹 2️⃣ BACKGROUND DB UPDATE
    const ratingRef = ref(db, `feedback/${feedbackId}`);

    await runTransaction(ratingRef, (current) => {
      if (!current) return current;

      current.ratings = current.ratings || {};
      current.ratingStats = current.ratingStats || {
        avg: 0,
        count: 0,
      };

      const previous = current.ratings[user.uid];
      current.ratings[user.uid] = value;

      let total =
        current.ratingStats.avg *
        current.ratingStats.count;

      if (previous) {
        total = total - previous + value;
      } else {
        total += value;
        current.ratingStats.count += 1;
      }

      current.ratingStats.avg =
        total / current.ratingStats.count;

      return current;
    });

    await localforage.removeItem(CACHE_KEY);
    setReloadKey((v) => v + 1);
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="text-center text-sm text-gray-400 py-6">
        Loading feedback…
      </div>
    );
  }

  return (
    <section className="mx-auto w-full px-3 py-6 sm:max-w-xl md:max-w-2xl space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Community Feedback
        </h2>

        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded"
          >
            ➕ Add Feedback
          </button>
        )}
      </div>

      {/* FEEDBACK LIST */}
      {feedbacks.map((f) => {
        const userRating =
          user && f.ratings?.[user.uid];

        return (
          <article
            key={f.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">
                {f.name}
              </span>

              <span className="text-yellow-500 text-sm">
                {"★".repeat(Math.round(f.ratingStats?.avg || 0))}
                <span className="text-gray-400 ml-1">
                  ({f.ratingStats?.count || 0})
                </span>
              </span>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {f.message}
            </p>

            {/* RATE */}
            {user && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => rateFeedback(f.id, n)}
                    className={`text-lg ${
                      userRating >= n
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-400 mt-2">
              {new Date(f.createdAt).toLocaleString()}
            </div>
          </article>
        );
      })}

      {/* LOAD MORE */}
      {feedbacks.length >= limit && (
        <button
          onClick={() => setLimit((v) => v + PAGE_SIZE)}
          className="text-sm text-blue-600 underline"
        >
          Load more feedback
        </button>
      )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-[90%] max-w-sm space-y-4">
            <h3 className="font-semibold text-lg">
              Add Feedback
            </h3>

            <textarea
              rows={4}
              placeholder="Write your feedback..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={submitFeedback}
                className="text-sm px-4 py-1 bg-green-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
