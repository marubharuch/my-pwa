import { db } from "../firebase";
import { ref, get, set, update, remove } from "firebase/database";
import localforage from "localforage";

/* ---------- LOCALFORAGE KEY ---------- */
function lfKey(srno) {
  return `family_${srno}`;
}

/* ---------- READ FAMILY WITH DELTA SYNC ---------- */
export async function loadFamily(srno) {
  const key = lfKey(srno);

  // Load cached data if exists
  const local = await localforage.getItem(key);

  // Check server updatedAt
  const snap = await get(ref(db, `families/${srno}`));
  if (!snap.exists()) return null;

  const server = snap.val();

  // If no local cache → save & return server
  if (!local) {
    await localforage.setItem(key, server);
    return server;
  }

  // If server newer → update local and return server
  if (server.updatedAt > (local.updatedAt || 0)) {
    await localforage.setItem(key, server);
    return server;
  }

  // Local is latest → use local only
  return local;
}

/* ---------- UPDATE LOCAL CACHE ---------- */
async function updateLocal(srno, newData) {
  await localforage.setItem(`family_${srno}`, newData);
}

/* ---------- ADD MEMBER ---------- */
export async function addMember(srno, data) {
  const id = String(Date.now());
  const memberRef = ref(db, `families/${srno}/members/${id}`);

  const payload = { ...data, updatedAt: Date.now() };
  await set(memberRef, payload);

  await update(ref(db, `families/${srno}`), { updatedAt: Date.now() });

  // refresh local cache
  const updated = await loadFamily(srno);
  await updateLocal(srno, updated);

  return id;
}

/* ---------- UPDATE MEMBER ---------- */
export async function updateMember(srno, id, data) {
  const memberRef = ref(db, `families/${srno}/members/${id}`);
  const payload = { ...data, updatedAt: Date.now() };

  await update(memberRef, payload);
  await update(ref(db, `families/${srno}`), { updatedAt: Date.now() });

  const updated = await loadFamily(srno);
  await updateLocal(srno, updated);
}

/* ---------- DELETE MEMBER ---------- */
export async function deleteMember(srno, id) {
  await remove(ref(db, `families/${srno}/members/${id}`));
  await update(ref(db, `families/${srno}`), { updatedAt: Date.now() });

  const updated = await loadFamily(srno);
  await updateLocal(srno, updated);
}

/* ---------- UPDATE FAMILY FIELDS ---------- */
export async function updateFamily(srno, data) {
  const payload = { ...data, updatedAt: Date.now() };

  await update(ref(db, `families/${srno}`), payload);

  const updated = await loadFamily(srno);
  await updateLocal(srno, updated);
}
