// src/services/familyService.js
import { ref, get, query, orderByChild, startAt } from "firebase/database";
import { db } from "../firebase";

export async function fetchUpdatedFamilies(lastSync = 0) {
  console.log(`Fetching families updated after...`);
  const q = query(
    ref(db, "families"),
    orderByChild("meta/updatedAt"),
    startAt(lastSync + 1)
  );

  const snapshot = await get(q);

  if (!snapshot.exists()) {
    console.log("RTDB read: 0 KB (no updates)");
    return {};
  }

  return snapshot.val();
}

export async function fetchFamilyById(familyId) {
  const snapshot = await get(ref(db, `families/${familyId}`));
  return snapshot.exists() ? snapshot.val() : null;
}
