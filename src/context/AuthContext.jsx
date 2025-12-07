import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  createEmailUser,
  googleAuth
} from "../services/userService";

const AuthContext = createContext();

/* ============================
   PROVIDER
============================ */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* -------- LOGIN -------- */
  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => googleAuth();

  /* -------- REGISTER -------- */
  const registerWithEmail = (name, email, password, mobile) =>
    createEmailUser(name, email, password, mobile);

  const registerWithGoogle = () => googleAuth();

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithEmail,
      loginWithGoogle,
      registerWithEmail,
      registerWithGoogle,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
