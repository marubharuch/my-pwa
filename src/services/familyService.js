// services/familyService.js
import { ref, get, query, orderByChild, startAt } from "firebase/database";
import { db } from "../firebase";

/**
 * Fetch only families updated after last sync
 */
export async function fetchUpdatedFamilies(lastSync = 0) {
  const q = query(
    ref(db, "families"),
    orderByChild("meta/updatedAt"),
    startAt(lastSync + 1)
  );

  const snapshot = await get(q);
  return snapshot.exists() ? snapshot.val() : {};
}


/**
 * Fetch single family (edit / detail use)
 */
export async function fetchFamilyById(familyId) {
  const snapshot = await get(ref(db, `families/${familyId}`));
  return snapshot.exists() ? snapshot.val() : null;
}
