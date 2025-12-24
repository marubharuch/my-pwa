// hooks/useFamilies.js
import { useEffect, useState } from "react";
import localforage from "localforage";
import { fetchUpdatedFamilies } from "../services/familyService";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";

const LOCAL_KEY = "familiesCache";
const LAST_SYNC_KEY = "familiesLastSync";

export function useFamilies() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const mapObjectToArray = (obj) =>
    Object.entries(obj || {}).map(([id, data]) => ({
      familyId: id,
      ...data,
    }));

  /* ================= LOAD FIRESTORE SNAPSHOT ================= */
  async function loadSnapshotIfNeeded() {
    const local = await localforage.getItem(LOCAL_KEY);
    if (local && Object.keys(local).length) return local;

    try {
      const metaSnap = await getDoc(
        doc(firestore, "familySnapshots", "snapshot_meta")
      );

      if (!metaSnap.exists()) return {};

      const { parts } = metaSnap.data();
      let merged = {};

      for (let i = 1; i <= parts; i++) {
        const partSnap = await getDoc(
          doc(firestore, "familySnapshots", `snapshot_part_${i}`)
        );

        if (partSnap.exists()) {
          Object.assign(merged, partSnap.data().data);
        }
      }

      await localforage.setItem(LOCAL_KEY, merged);
      await localforage.setItem(
        LAST_SYNC_KEY,
        metaSnap.data().generatedAt
      );

      return merged;
    } catch (e) {
      console.error("Snapshot load failed", e);
      return {};
    }
  }

  /* ================= MAIN SYNC ================= */
  async function sync(force = false) {
    try {
      setSyncing(true);

      const base =
        force ? {} : await loadSnapshotIfNeeded();

      if (Object.keys(base).length) {
        setFamilies(mapObjectToArray(base));
      }

      const lastSync =
        force
          ? 0
          : (await localforage.getItem(LAST_SYNC_KEY)) || 0;

      const updates = await fetchUpdatedFamilies(lastSync);

      if (Object.keys(updates).length) {
        const merged = { ...base, ...updates };

        await localforage.setItem(LOCAL_KEY, merged);
        await localforage.setItem(LAST_SYNC_KEY, Date.now());

        setFamilies(mapObjectToArray(merged));
      }
    } catch (e) {
      console.error("Family sync failed", e);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  /* ================= INIT ================= */
  useEffect(() => {
    sync(false);
  }, []);

  return {
    families,
    loading,
    syncing,
    refresh: () => sync(false),
    forceRefresh: () => sync(true),
  };
}
