import { ref, runTransaction, set, update } from "firebase/database";
import { db } from "../firebase";

/**
 * Shared family creation engine
 *
 * @param {Object} params
 * @param {string} params.currentCity
 * @param {string} params.nativeCity
 * @param {string} params.address
 * @param {string} params.createdBy        uid
 * @param {boolean} params.linkUser        auto link user?
 * @param {Object} params.editors          { uid: true }
 */
export async function createFamily({
  currentCity,
  nativeCity = "",
  address = "",
  createdBy,
  linkUser = false,
  editors = {},
}) {
  if (!currentCity?.trim()) {
    throw new Error("Current city required");
  }
  if (!createdBy) {
    throw new Error("createdBy missing");
  }

  let familyId;
  const now = Date.now();

  /* 1️⃣ Generate family ID */
  await runTransaction(ref(db, "master/nextFamilySrno"), (val) => {
    familyId = String(val || 1);
    return (val || 1) + 1;
  });

  /* 2️⃣ Create family */
  await set(ref(db, `families/${familyId}`), {
    info: {
      currentCity: currentCity.trim(),
      nativeCity: nativeCity.trim(),
      address: address.trim(),
      editorEmails: editors,
    },
    meta: {
      createdBy,
      createdAt: now,
      updatedAt: now,
    },
    members: {},
  });

  /* 3️⃣ Optional: link user */
  if (linkUser) {
    await update(ref(db, `users/${createdBy}`), {
      familyId,
    });
  }

  return familyId;
}
