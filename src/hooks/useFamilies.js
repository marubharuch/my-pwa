// hooks/useFamilies.js
import { useEffect, useState } from "react";
import localforage from "localforage";
import { fetchUpdatedFamilies } from "../services/familyService";

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

  async function sync(force = false) {
    try {
      setSyncing(true);

      const local = (await localforage.getItem(LOCAL_KEY)) || {};
      const lastSync = force
        ? 0
        : (await localforage.getItem(LAST_SYNC_KEY)) || 0;

      if (Object.keys(local).length) {
        setFamilies(mapObjectToArray(local));
      }

      const updates = await fetchUpdatedFamilies(lastSync);

      if (Object.keys(updates).length) {
        const merged = force ? updates : { ...local, ...updates };

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

  useEffect(() => {
    sync(false); // automatic incremental sync
  }, []);

  return {
    families,
    loading,
    syncing,
    refresh: () => sync(false),   // incremental refresh
    forceRefresh: () => sync(true) // full refresh (rare)
  };
}
