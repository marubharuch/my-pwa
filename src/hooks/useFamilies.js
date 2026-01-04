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
  /* ================= STATE ================= */
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);   // only for first load
  const [syncing, setSyncing] = useState(false);  // background sync

  const mapObjectToArray = (obj) =>
    Object.entries(obj || {}).map(([id, data]) => ({
      familyId: id,
      ...data,
    }));

  /* ================= EARLY CACHE HYDRATION ================= */
  useEffect(() => {
    let cancelled = false;

    async function hydrateCache() {
      try {
        const cached = await localforage.getItem(LOCAL_KEY);

        if (
          !cancelled &&
          cached &&
          typeof cached === "object" &&
          Object.keys(cached).length > 0
        ) {
          setFamilies(mapObjectToArray(cached));
          setLoading(false); // 🔑 IMPORTANT
        }
      } catch (e) {
        console.error("Cache hydrate failed", e);
      }
    }

    hydrateCache();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= LOAD FIRESTORE SNAPSHOT ================= */
  async function loadSnapshotIfNeeded(force = false) {
    const local = await localforage.getItem(LOCAL_KEY);
    const localVersion = await localforage.getItem(SNAPSHOT_VERSION_KEY);

    try {
      const metaSnap = await getDoc(
        doc(firestore, "familySnapshots", "snapshot_meta")
      );

      if (!metaSnap.exists()) {
        console.warn("⚠️ Snapshot failed, falling back to cache");
return local && Object.keys(local).length ? local : {};

      }

      const { parts, generatedAt, version: serverVersion } =
        metaSnap.data();

      /* ✅ USE CACHE */
      if (
        !force &&
        local &&
        Object.keys(local).length > 0 &&
        localVersion === serverVersion
      ) {
        console.log("🟢 Using cached snapshot (version match)");
        return local;
      }

      console.warn("🔄 Reloading snapshot");

      /* 🧹 CLEAR CACHE */
      await localforage.removeItem(LOCAL_KEY);
      await localforage.removeItem(LAST_SYNC_KEY);
      await localforage.removeItem(SNAPSHOT_VERSION_KEY);

      /* ⬇️ LOAD SNAPSHOT PARTS */
      let merged = {};

      for (let i = 1; i <= parts; i++) {
        const partSnap = await getDoc(
          doc(firestore, "familySnapshots", `snapshot_part_${i}`)
        );

        if (partSnap.exists()) {
          Object.assign(merged, partSnap.data().data);
        }
      }

      /* 💾 SAVE SNAPSHOT */
      await localforage.setItem(LOCAL_KEY, merged);
      await localforage.setItem(LAST_SYNC_KEY, generatedAt);
      await localforage.setItem(SNAPSHOT_VERSION_KEY, serverVersion);

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

      // 🚫 do NOT re-enable loading if data already exists
      setLoading((l) => (families.length === 0 ? true : l));

      const base = await loadSnapshotIfNeeded(force);

      if (Object.keys(base).length) {
        setFamilies(mapObjectToArray(base));
        setLoading(false);
      }

      const lastSync =
        force ? 0 : (await localforage.getItem(LAST_SYNC_KEY)) || 0;

      const updates = await fetchUpdatedFamilies(lastSync);

      if (Object.keys(updates).length) {
        const merged = { ...base, ...updates };

        const latestUpdatedAt = Math.max(
          lastSync,
          ...Object.values(updates).map(
            (f) => f.meta?.updatedAt || 0
          )
        );

        await localforage.setItem(LOCAL_KEY, merged);
        await localforage.setItem(LAST_SYNC_KEY, latestUpdatedAt);

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

  /* ================= API ================= */
  return {
    families,
    loading,
    syncing,
    refresh: () => sync(false),
    forceRefresh: () => sync(true),
  };
}
