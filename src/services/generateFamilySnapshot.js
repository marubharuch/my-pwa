import { ref, get } from "firebase/database";
import { doc, writeBatch } from "firebase/firestore";
import { db, firestore } from "../firebase";

/**
 * 📦 Generate Family Snapshot
 * ------------------------------------------------
 * - Reads ALL families from RTDB
 * - Splits data into <= 0.95 MB chunks
 * - Saves chunks to Firestore
 * - Saves snapshot_meta document WITH VERSION
 *
 * Firestore structure:
 * familySnapshots/
 *   ├─ snapshot_meta
 *   ├─ snapshot_part_1
 *   ├─ snapshot_part_2
 *   └─ ...
 */

const MAX_DOC_SIZE_BYTES = 950 * 1024; // 0.95 MB safety limit

/**
 * @param {string} version - snapshot version (required)
 */
export async function generateFamilySnapshot(version) {
  if (!version) {
    throw new Error("Snapshot version is required");
  }

  console.log("generateFamilySnapshot started", version);

  /* ================= LOAD RTDB DATA ================= */
  const snap = await get(ref(db, "families"));

  if (!snap.exists()) {
    throw new Error("No families found in RTDB");
  }

  const familiesObj = snap.val();
  const familyEntries = Object.entries(familiesObj);

  /* ================= SPLIT INTO PARTS ================= */
  const parts = [];
  let currentPart = {};
  let currentSize = 0;

  for (const [familyId, familyData] of familyEntries) {
    const wrapped = { [familyId]: familyData };
    const size = JSON.stringify(wrapped).length;

    // If single family is too large (very rare)
    if (size > MAX_DOC_SIZE_BYTES) {
      throw new Error(`Family ${familyId} exceeds snapshot size limit`);
    }

    // Start new part if limit exceeded
    if (currentSize + size > MAX_DOC_SIZE_BYTES) {
      parts.push(currentPart);
      currentPart = {};
      currentSize = 0;
    }

    currentPart[familyId] = familyData;
    currentSize += size;
  }

  if (Object.keys(currentPart).length > 0) {
    parts.push(currentPart);
  }

  /* ================= WRITE TO FIRESTORE ================= */
  const batch = writeBatch(firestore);
  const generatedAt = Date.now();

  parts.forEach((data, index) => {
    const partRef = doc(
      firestore,
      "familySnapshots",
      `snapshot_part_${index + 1}`
    );

    batch.set(partRef, {
      data,
      part: index + 1,
      generatedAt,
      version, // 🔑 keep version with each part (optional but useful)
    });
  });

  /* ================= SNAPSHOT META ================= */
  const metaRef = doc(firestore, "familySnapshots", "snapshot_meta");

  const meta = {
    version, // 🔑 CRITICAL FOR CACHE INVALIDATION
    generatedAt,
    generatedAtISO: new Date(generatedAt).toISOString(),
    totalFamilies: familyEntries.length,
    parts: parts.length,
  };

  batch.set(metaRef, meta);

  await batch.commit();

  return meta;
}
