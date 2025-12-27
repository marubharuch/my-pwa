// hooks/useFamilies.js
import { useEffect, useState } from "react";
import localforage from "localforage";
import { fetchUpdatedFamilies } from "../services/familyService";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";

const LOCAL_KEY = "familiesCache";
const LAST_SYNC_KEY = "familiesLastSync";
const SNAPSHOT_VERSION_KEY = "familiesSnapshotVersion";

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
    const localVersion = await localforage.getItem(
      SNAPSHOT_VERSION_KEY
    );

    try {
      const metaSnap = await getDoc(
        doc(firestore, "familySnapshots", "snapshot_meta")
      );

      if (!metaSnap.exists()) return local || {};

      const {
        parts,
        generatedAt,
        version: serverVersion,
      } = metaSnap.data();

      /* ✅ CACHE VALID & VERSION SAME */
      if (
        local &&
        Object.keys(local).length &&
        localVersion === serverVersion
      ) {
        return local;
      }

      console.warn(
        "Snapshot version changed or cache missing. Reloading snapshot…"
      );

      /* 🧹 CLEAR OLD CACHE */
      await localforage.removeItem(LOCAL_KEY);
      await localforage.removeItem(LAST_SYNC_KEY);
      await localforage.removeItem(SNAPSHOT_VERSION_KEY);

      /* ⬇️ LOAD SNAPSHOT PARTS */
      let merged = {};

      for (let i = 1; i <= parts; i++) {
        const partSnap = await getDoc(
          doc(
            firestore,
            "familySnapshots",
            `snapshot_part_${i}`
          )
        );

        if (partSnap.exists()) {
          Object.assign(
            merged,
            partSnap.data().data
          );
        }
      }

      /* 💾 SAVE NEW CACHE */
      await localforage.setItem(LOCAL_KEY, merged);
      await localforage.setItem(LAST_SYNC_KEY, generatedAt);
      await localforage.setItem(
        SNAPSHOT_VERSION_KEY,
        serverVersion
      );

      return merged;
    } catch (e) {
      console.error("Snapshot load failed", e);
      return local || {};
    }
  }

  /* ================= MAIN SYNC ================= */
  async function sync(force = false) {
    try {
      setSyncing(true);

      const base = force ? {} : await loadSnapshotIfNeeded();

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
