/**
 * 🔐 AUTH CONTEXT – FROZEN + CACHED
 *
 * SINGLE SOURCE OF TRUTH:
 * --------------------------------
 * ✅ Firebase Auth user
 * ✅ RTDB user profile (/users/{uid})
 * ✅ localForage cache
 *
 * RULES (DO NOT BREAK):
 * --------------------------------
 * ❌ No component reads /users/{uid}
 * ❌ Do not re-fetch profile outside this file
 * ✅ Use userRecord everywhere
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from "firebase/auth";

import { auth, db } from "../firebase";
import { ref, get } from "firebase/database";
import localforage from "localforage";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRecord, setUserRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD PROFILE (CACHE FIRST) ---------------- */
  const loadUserProfile = async (uid) => {
    const cacheKey = `userProfile:${uid}`;

    // ✅ 1️⃣ Try localForage first
    const cached = await localforage.getItem(cacheKey);
    if (cached) {
      setUserRecord(cached);
      setLoading(false);

      // ✅ Silent background refresh
      refreshFromDB(uid, cacheKey);
      return;
    }

    // ✅ 2️⃣ No cache → DB read
    await refreshFromDB(uid, cacheKey);
  };

  const refreshFromDB = async (uid, cacheKey) => {
    try {
      const snap = await get(ref(db, `users/${uid}`));
      if (snap.exists()) {
        const data = snap.val();
        setUserRecord(data);
        await localforage.setItem(cacheKey, data);
      } else {
        setUserRecord(null);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setUserRecord(null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- AUTH LISTENER ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setUserRecord(null);
        setLoading(false);
        return;
      }

      setUser(u);
      setLoading(true);
      await loadUserProfile(u.uid);
    });

    return () => unsub();
  }, []);

  /* ---------------- LOGIN / LOGOUT ---------------- */
  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = async () => {
    if (user?.uid) {
      await localforage.removeItem(`userProfile:${user.uid}`);
    }
    await signOut(auth);
    setUser(null);
    setUserRecord(null);
  };

/* ---------------- GOOGLE LOGIN ---------------- */
const loginWithGoogleChecked = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  const info = getAdditionalUserInfo(result);

  return {
    user: result.user,
    isNewUser: info?.isNewUser === true,
  };
};




  /* ---------------- UPDATE CACHE (IMPORTANT) ---------------- */
  const updateUserRecordCache = async (newData) => {
    if (!user?.uid) return;

    const cacheKey = `userProfile:${user.uid}`;
    const merged = { ...userRecord, ...newData };

    setUserRecord(merged);
    await localforage.setItem(cacheKey, merged);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRecord,
        loading,
        loginWithEmail,
        logout,
         loginWithGoogleChecked,
        updateUserRecordCache, // ✅ VERY IMPORTANT
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
