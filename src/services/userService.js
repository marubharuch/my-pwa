// src/services/userService.js
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { ref, set, get } from "firebase/database";

const provider = new GoogleAuthProvider();

/* ============================
   REGISTER WITH EMAIL
============================ */
export async function createEmailUser(name, email, password, mobile) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await updateProfile(user, { displayName: name });

  await set(ref(db, `users/${user.uid}`), {
    name,
    email,
    mobile: mobile || "",
    familySrno: null,
    role: "newUser",
    provider: "password",
    createdAt: Date.now(),
  });

  return user;
}

/* ============================
   GOOGLE AUTH (LOGIN / REGISTER)
============================ */
export async function googleAuth() {
  const res = await signInWithPopup(auth, provider);
  const user = res.user;

  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    await set(userRef, {
      name: user.displayName || "",
      email: user.email || "",
      mobile: "",
      familySrno: null,
      role: "newUser",
      provider: "google",
      createdAt: Date.now(),
    });
  }

  return user;
}
