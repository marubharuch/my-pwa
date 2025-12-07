import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================
     CREATE FAMILY
  ============================ */
  async function createFamily(user) {
    const snap = await get(ref(db, "master/nextFamilySrno"));
    const srno = String(snap.val() || 1);

    await set(ref(db, `families/${srno}`), {
      currentCity: "",
      nativeCity: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user.uid,
      editorEmails: { [user.uid]: true },
      members: {
        [user.uid]: {
          name: name || user.displayName,
          mobile,
          active: true,
        },
      },
    });

    await update(ref(db, "master"), {
      nextFamilySrno: Number(srno) + 1
    });

    return srno;
  }

  function maskEmail(email) {
    const [n, d] = email.split("@");
    return `${n.slice(0, 2)}***@${d}`;
  }

  /* ============================
     EMAIL REGISTER
  ============================ */
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await registerWithEmail(name, email, password, mobile);

      let finalSrno = familySrno;
      if (!familySrno) finalSrno = await createFamily(user);

      await update(ref(db, `users/${user.uid}`), {
        familySrno: finalSrno,
        role: "member"
      });

      await set(ref(db, `publicUserIndex/${finalSrno}/${user.uid}`), {
        maskedEmail: maskEmail(user.email),
        provider: "password"
      });

      navigate("/");
    } catch (err) {
      setError("Registration failed");
    }

    setLoading(false);
  };

  /* ============================
     GOOGLE REGISTER
  ============================ */
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await registerWithGoogle();
      let finalSrno = familySrno || await createFamily(user);

      await update(ref(db, `users/${user.uid}`), {
        familySrno: finalSrno,
        role: "member"
      });

      await set(ref(db, `publicUserIndex/${finalSrno}/${user.uid}`), {
        maskedEmail: maskEmail(user.email),
        provider: "google"
      });

      navigate("/");
    } catch {
      setError("Google signup failed");
    }

    setLoading(false);
  };

  /* ============================
     UI
  ============================ */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">

        <h2 className="text-xl font-bold text-center mb-4">Create Account</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        <button
          className="w-full bg-red-500 text-white py-2 rounded mb-3"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          Continue with Google
        </button>

        <form onSubmit={handleRegister}>
          <input className="w-full border p-2 mb-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="w-full border p-2 mb-2" placeholder="Mobile" value={mobile} onChange={e=>setMobile(e.target.value)} />
          <input className="w-full border p-2 mb-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="w-full border p-2 mb-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <input className="w-full border p-2 mb-3" placeholder="Family Sr No (optional)" value={familySrno} onChange={e=>setFamilySrno(e.target.value)} />

          <button className="w-full bg-blue-600 text-white py-2 rounded">
            {loading ? "Please wait..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
