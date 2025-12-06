import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, get, set, update } from "firebase/database";

export default function RegisterPage() {
  const { registerWithEmail, registerWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familySrno, setFamilySrno] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* --------------------------------------------------
     EMAIL + PASSWORD REGISTER
  -------------------------------------------------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Create auth + /users entry
      const user = await registerWithEmail(
        name,
        email,
        password,
        mobile,
        familySrno || null
      );

      let finalFamilySrno = familySrno;

      // 2️⃣ If NO familySrno → CREATE NEW FAMILY NUMBER
      if (!familySrno) {
        const snap = await get(ref(db, "master/nextFamilySrno"));
        finalFamilySrno = String(snap.val() || 1);

        await update(ref(db, "master"), {
          nextFamilySrno: Number(finalFamilySrno) + 1
        });

        // Update user's own record with familySrno
        await update(ref(db, `users/${user.uid}`), {
          familySrno: finalFamilySrno,
          role: "member"
        });
      }

      // 3️⃣ ✅ WRITE PUBLIC EMAIL INDEX (CRITICAL PART)
      await set(ref(db, `publicUserIndex/${finalFamilySrno}/${user.uid}`), {
        maskedEmail: maskEmail(email),
        provider: "password"
      });

      navigate("/");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered.");
      } else {
        setError("Registration failed. Try again.");
      }
    }

    setLoading(false);
  };

  /* --------------------------------------------------
     GOOGLE REGISTER
  -------------------------------------------------- */
  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      const user = await registerWithGoogle(familySrno || null);

      let finalFamilySrno = familySrno;

      if (!familySrno) {
        const snap = await get(ref(db, "master/nextFamilySrno"));
        finalFamilySrno = String(snap.val() || 1);

        await update(ref(db, "master"), {
          nextFamilySrno: Number(finalFamilySrno) + 1
        });

        await update(ref(db, `users/${user.uid}`), {
          familySrno: finalFamilySrno,
          role: "member"
        });
      }

      await set(ref(db, `publicUserIndex/${finalFamilySrno}/${user.uid}`), {
        maskedEmail: maskEmail(user.email),
        provider: "google"
      });

      navigate("/");
    } catch (err) {
      setError("Google sign-in failed.");
    }

    setLoading(false);
  };

  /* --------------------------------------------------
     MASK EMAIL (utility)
  -------------------------------------------------- */
  function maskEmail(email) {
    const [name, domain] = email.split("@");
    if (name.length <= 2) return email;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">

        <h2 className="text-2xl font-bold text-center mb-5">
          Create Account
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        {/* GOOGLE */}
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full bg-red-500 text-white py-2 rounded mb-4"
        >
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-2 text-gray-500 text-sm">OR</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>

        {/* FORM */}
        <form onSubmit={handleRegister}>
          <input
            className="w-full border px-3 py-2 rounded mb-3"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="w-full border px-3 py-2 rounded mb-3"
            placeholder="Mobile (optional)"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />

          <input
            className="w-full border px-3 py-2 rounded mb-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full border px-3 py-2 rounded mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            className="w-full border px-3 py-2 rounded mb-1"
            placeholder="Family Serial No. (optional)"
            value={familySrno}
            onChange={(e) => setFamilySrno(e.target.value)}
          />

          <p className="text-xs text-gray-500 mb-4">
            If you know your Family Serial Number, enter it to join.
            Leave empty to create a new family.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
