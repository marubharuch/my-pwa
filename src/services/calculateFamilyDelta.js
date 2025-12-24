/**
 * 📊 RTDB DELTA CALCULATION (ADMIN ONLY)
 * -------------------------------------------------
 * PURPOSE:
 * - Calculate how much family data changed AFTER last snapshot
 * - Show admin whether snapshot regeneration is worth it
 *
 * IMPORTANT:
 * ❌ NO writes
 * ❌ NO auto-run
 * ✅ Manual admin-triggered read
 * ✅ Uses indexed RTDB query (meta/updatedAt)
 */

import { ref, query, orderByChild, startAt, get } from "firebase/database";
import { db } from "../firebase";

/* -------------------------------------------------
 * Helper: calculate JSON byte size
 * ------------------------------------------------- */
function getSizeInBytes(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

/* -------------------------------------------------
 * MAIN DELTA FUNCTION
 * ------------------------------------------------- */
export async function calculateFamilyDelta(lastSnapshotTime) {
  if (!lastSnapshotTime) {
    throw new Error("Snapshot timestamp required");
  }

  /* 1️⃣ Query only UPDATED families */
  const q = query(
    ref(db, "families"),
    orderByChild("meta/updatedAt"),
    startAt(lastSnapshotTime + 1)
  );

  const snap = await get(q);

  if (!snap.exists()) {
    return {
      count: 0,
      sizeBytes: 0,
      sizeHuman: "0 KB",
      oldestUpdate: null,
      newestUpdate: null,
    };
  }

  const families = snap.val();
  const entries = Object.entries(families);

  /* 2️⃣ Calculate stats */
  let totalBytes = 0;
  let oldest = null;
  let newest = null;

  for (const [, family] of entries) {
    totalBytes += getSizeInBytes(family);

    const ts = family.meta?.updatedAt;
    if (ts) {
      if (!oldest || ts < oldest) oldest = ts;
      if (!newest || ts > newest) newest = ts;
    }
  }

  /* 3️⃣ Human readable size */
  const sizeHuman =
    totalBytes > 1024 * 1024
      ? (totalBytes / (1024 * 1024)).toFixed(2) + " MB"
      : (totalBytes / 1024).toFixed(2) + " KB";

  return {
    count: entries.length,
    sizeBytes: totalBytes,
    sizeHuman,
    oldestUpdate: oldest,
    newestUpdate: newest,
  };
}

/* -------------------------------------------------
 * ADMIN PAGE USAGE (example)
 * -------------------------------------------------
 *
 * const delta = await calculateFamilyDelta(snapshotMeta.generatedAt);
 * setDeltaInfo(delta);
 */
