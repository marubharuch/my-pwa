import { createContext, useContext, useEffect, useState } from "react";
import { 
  auth 
} from "../firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { db } from "../firebase";
import { ref, set, get } from "firebase/database";

const AuthContext = createContext();
console.log("AuthContext loaded");
// -----------------------------------------------------
// ⭐ PROVIDER
// -----------------------------------------------------
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------
  // 🔥 Persistent Login: This listens to Firebase auth state
  // ---------------------------------------------------
  useEffect(() => {

     console.log("AuthContext: setting up auth listener...");

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
        console.log("Auth state changed:", firebaseUser);

      setUser(firebaseUser || null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ---------------------------------------------------
  // ⭐ GOOGLE LOGIN
  // ---------------------------------------------------
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const uid = result.user.uid;

    // Check if user exists in RTDB
    const snap = await get(ref(db, "users/" + uid));

    if (!snap.exists()) {
      // New Google user → save basic profile
      await set(ref(db, "users/" + uid), {
        name: result.user.displayName || "",
        email: result.user.email,
        mobile: "",
        familySrno: null,
        role: "newUser",
        provider: "google",
         createdAt: Date.now()
      });
    }

    return result.user;
  };

  // ---------------------------------------------------
  // ⭐ EMAIL + PASSWORD LOGIN
  // ---------------------------------------------------
  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ---------------------------------------------------
  // ⭐ EMAIL + PASSWORD REGISTRATION
  // ---------------------------------------------------
  const registerWithEmail = async (name, email, password, mobile, familySrno) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update Firebase auth profile
    await updateProfile(result.user, { displayName: name });

    // Save in RTDB
    await set(ref(db, "users/" + result.user.uid), {
      name,
      email,
      mobile,
      familySrno: familySrno || null,
      role: "newUser",
      provider: "password",
    });

    return result.user;
  };

  // ---------------------------------------------------
  // ⭐ GOOGLE REGISTER (with optional familySrno)
  // ---------------------------------------------------
  const registerWithGoogle = async (familySrno) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    await set(ref(db, "users/" + result.user.uid), {
      name: result.user.displayName,
      email: result.user.email,
      mobile: "",
      familySrno: familySrno || null,
      role: "newUser",
      provider: "google",
    });

    return result.user;
  };

  // ---------------------------------------------------
  // ⭐ LOGOUT
  // ---------------------------------------------------
  const logout = () => {
    return signOut(auth);
  };

  // ---------------------------------------------------
  // ⭐ CONTEXT VALUE
  // ---------------------------------------------------
  const value = {
    user,
    loading,

    // Login methods
    loginWithEmail,
    loginWithGoogle,

    // Register methods
    registerWithEmail,
    registerWithGoogle,

    // Logout
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// -----------------------------------------------------
// ⭐ HOOK for easy access
// -----------------------------------------------------
export function useAuth() {
  return useContext(AuthContext);
}
