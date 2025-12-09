// src/pages/RegisterPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { ref, get, set } from "firebase/database";

export default function RegisterPage() {
  const { registerWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ true only when redirected after Google login
  const fromGoogle = location.state?.fromGoogle === true;

  const [name, setName] = useState(user?.displayName || "");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [familySrno, setFamilySrno] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     BLOCK WRONG ACCESS
  =============================== */
  useEffect(() => {
    // ❌ logged-in user cannot open register again
    if (user && !fromGoogle) {
      navigate("/");
    }
  }, [user, fromGoogle, navigate]);

  /* ===============================
     SAVE USER PROFILE ONLY
  =============================== */
  async function saveUserProfile(uid, data) {
    await set(ref(db, `users/${uid}`), {
      name: data.name,
      email: data.email,
      mobile: data.mobile || "",
      role: "member",
      createdAt: Date.now(),
      ...(data.familySrno ? { pendingFamilySrno: data.familySrno } : {})
    });
  }

  /* ===============================
     EMAIL + PASSWORD REGISTER
  =============================== */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Create auth user
      const newUser = await registerWithEmail(name, email, password);

      // ✅ Create /users/{uid}
      await saveUserProfile(newUser.uid, {
        name,
        email,
        mobile,
        familySrno: familySrno || null
      });

      // ✅ Redirect based on choice
      navigate("/")
    } catch (err) {
      console.error(err);
      setError("Registration failed");
    }

    setLoading(false);
  };

  /* ===============================
     GOOGLE CONTINUE (NO AUTH HERE)
  =============================== */
  const handleGoogleContinue = async () => {
    if (!user) return;

    setError("");
    setLoading(true);

    try {
      const userSnap = await get(ref(db, `users/${user.uid}`));

      if (!userSnap.exists()) {
        // ✅ Create /users/{uid} only once
        await saveUserProfile(user.uid, {
          name,
          email: user.email,
          mobile,
          familySrno: familySrno || null
        });
      }

      
        navigate("/")       
    } catch (err) {
      console.error(err);
      setError("Google registration failed");
    }

    setLoading(false);
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">

        <h2 className="text-xl font-bold text-center mb-4">
          Complete Registration
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-2">{error}</p>
        )}

        {/* ✅ GOOGLE CONTINUE */}
        {fromGoogle && (
          <button
            onClick={handleGoogleContinue}
            className="w-full bg-red-500 text-white py-2 rounded mb-3"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Continue"}
          </button>
        )}

        {/* ✅ COMMON FORM */}
        <form onSubmit={handleRegister}>
          <input
            className="w-full border p-2 mb-2"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="w-full border p-2 mb-2"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />

          <input
            className="w-full border p-2 mb-2"
            placeholder="Email"
            type="email"
            value={email}
            disabled={fromGoogle}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!fromGoogle && (
            <input
              className="w-full border p-2 mb-2"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

       {/*   <input
            className="w-full border p-2 mb-3"
            placeholder="Family Sr No (optional)"
            value={familySrno}
            onChange={(e) => setFamilySrno(e.target.value)}
          />
*/}
          {!fromGoogle && (
            <button
              className="w-full bg-blue-600 text-white py-2 rounded"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Register"}
            </button>
          )}
        </form>

        {!fromGoogle && (
          <p className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600">
              Login
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}
