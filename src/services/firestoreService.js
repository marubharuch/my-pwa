import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";

/**
 * 🔥 Fetch Firestore family snapshot (chunked)
 *
 * Reads:
 * familySnapshots/snapshot_meta
 * familySnapshots/snapshot_part_*
 *
 * Returns:
 * {
 *   families: { [familyId]: familyData },
 *   lastUpdatedAt: number,
 *   version: string
 * }
 */
export async function fetchFirestoreSnapshot() {
  try {
    /* ================= META ================= */
    const metaRef = doc(firestore, "familySnapshots", "snapshot_meta");
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
      console.warn("Firestore snapshot_meta not found");
      return null;
    }

    const meta = metaSnap.data();
    const { version, generatedAt, parts } = meta;

    if (!version || !parts) {
      console.warn("Invalid snapshot_meta format");
      return null;
    }

    /* ================= PARTS ================= */
    const partsRef = collection(firestore, "familySnapshots");
    const partsSnap = await getDocs(partsRef);

    const families = {};

    partsSnap.forEach((docSnap) => {
      const id = docSnap.id;

      // skip meta document
      if (!id.startsWith("snapshot_part_")) return;

      const partData = docSnap.data();

      if (partData?.data && typeof partData.data === "object") {
        Object.assign(families, partData.data);
      }
    });

    /* ================= DONE ================= */
    return {
      families,
      lastUpdatedAt: generatedAt, // 🔑 baseline timestamp for RTDB delta
      version,
    };
  } catch (err) {
    console.error("Failed to fetch Firestore snapshot", err);
    return null;
  }
}
