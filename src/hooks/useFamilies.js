// hooks/useFamilies.js
import { useEffect, useState } from "react";
import localforage from "localforage";
import { fetchAllFamilies } from "../services/familyService";

export function useFamilies() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  const LOCAL_KEY = "familiesCache";

  // Convert object → array
  const mapObjectToArray = (obj) =>
    Object.entries(obj || {}).map(([id, data]) => ({
      familyId: id,
      ...data,
    }));

  // Load from local first (fast UI)
  async function loadFromLocal() {
    const cached = await localforage.getItem(LOCAL_KEY);
    if (cached) {
      setFamilies(mapObjectToArray(cached));
    }
  }

  // Load from Firebase
  async function loadFromFirebase() {
    const data = await fetchAllFamilies();

    // Save to state
    const familyArray = mapObjectToArray(data);
    setFamilies(familyArray);

    // Store in localForage
    await localforage.setItem(LOCAL_KEY, data);

    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadFromLocal();   // immediate UI
      await loadFromFirebase(); // then sync online
    })();
  }, []);

  return { families, loading };
}
