import { ref, push, set } from "firebase/database";
import { db } from "../firebase";

export async function logActivity({
  type,
  actor,
  target = {},
  message = "",
  meta = {}
}) {
  if (!actor?.uid) return;

  const logRef = push(ref(db, "activityLogs"));

  await set(logRef, {
    type,
    actorUid: actor.uid,
    actorRole: actor.role || "unknown",

    target,
    message,
    meta,

    createdAt: Date.now()
  });
}
