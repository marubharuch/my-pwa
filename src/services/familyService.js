// src/services/familyService.js
import { db } from "../firebase";
import {
  ref,
  get,
  set,
  update,
  remove,
  push,
} from "firebase/database";
import localforage from "localforage";

/* ---------- LOCALFORAGE KEY ---------- */
const lfKey = (srno) => `family_${srno}`;

/* ---------- LOAD FAMILY (DELTA SAFE) ---------- */
export async function loadFamily(srno) {
  const cacheKey = lfKey(srno);

  const local = await localforage.getItem(cacheKey);

  // lightweight check
  const detailSnap = await get(ref(db, `familyDetails/${srno}`));
  if (!detailSnap.exists()) return null;

  const { lastUpdateTimestamp } = detailSnap.val();

  // serve from cache if same
  if (local && local.updatedAt === lastUpdateTimestamp) {
    return local;
  }

  // fetch full family
  const snap = await get(ref(db, `families/${srno}`));
  if (!snap.exists()) return null;

  const server = snap.val();

  // normalize
  server.updatedAt = lastUpdateTimestamp;

  await localforage.setItem(cacheKey, server);
  return server;
}

/* ---------- SAFE LOCAL UPDATE ---------- */
async function updateLocal(srno) {
  const fresh = await get(ref(db, `families/${srno}`));
  if (!fresh.exists()) return;

  const server = fresh.val();
  await localforage.setItem(lfKey(srno), server);
}

/* ---------- ADD MEMBER ---------- */
export async function addMember(srno, data) {
  const id = push(ref(db, `families/${srno}/members`)).key;

  const payload = {
    ...data,
    createdAt: Date.now(),
    active: data.active !== false,
  };

  await update(ref(db, `families/${srno}/members/${id}`), payload);

  const ts = Date.now();
  await update(ref(db, `families/${srno}`), { updatedAt: ts });
  await update(ref(db, `familyDetails/${srno}`), {
    lastUpdateTimestamp: ts,
  });

  await updateLocal(srno);
  return id;
}

/* ---------- UPDATE MEMBER ---------- */
export async function updateMember(srno, id, data) {
  const ts = Date.now();

  await update(ref(db, `families/${srno}/members/${id}`), {
    ...data,
    updatedAt: ts,
  });

  await update(ref(db, `families/${srno}`), { updatedAt: ts });
  await update(ref(db, `familyDetails/${srno}`), {
    lastUpdateTimestamp: ts,
  });

  await updateLocal(srno);
}

/* ---------- DELETE MEMBER ---------- */
export async function deleteMember(srno, id) {
  await remove(ref(db, `families/${srno}/members/${id}`));

  const ts = Date.now();
  await update(ref(db, `families/${srno}`), { updatedAt: ts });
  await update(ref(db, `familyDetails/${srno}`), {
    lastUpdateTimestamp: ts,
  });

  await updateLocal(srno);
}

/* ---------- UPDATE FAMILY CORE ---------- */
export async function updateFamily(srno, data) {
  const ts = Date.now();

  await update(ref(db, `families/${srno}`), {
    ...data,
    updatedAt: ts,
  });

  await update(ref(db, `familyDetails/${srno}`), {
    lastUpdateTimestamp: ts,
  });

  await updateLocal(srno);
}
