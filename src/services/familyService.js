// services/familyService.js
import { ref, get } from "firebase/database";
import { db } from "../firebase";

// Fetch full families tree (only once)
export async function fetchAllFamilies() {
  const snapshot = await get(ref(db, "families"));
  if (!snapshot.exists()) return {};
  return snapshot.val();
}

// Fetch single family by ID
export async function fetchFamilyById(familyId) {
  const snapshot = await get(ref(db, `families/${familyId}`));
  if (!snapshot.exists()) return null;
  return snapshot.val();
}
