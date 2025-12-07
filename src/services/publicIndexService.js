import { db } from "../firebase";
import { ref, set } from "firebase/database";

/* ===============================
   ENSURE PUBLIC USER INDEX
================================ */
export async function ensurePublicUserIndex({
  uid,
  email,
  familySrno,
  provider
}) {
  if (!familySrno || !uid || !email) return;

  const maskedEmail = maskEmail(email);

  await set(ref(db, `publicUserIndex/${familySrno}/${uid}`), {
    maskedEmail,
    provider
  });
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  if (name.length <= 2) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}
