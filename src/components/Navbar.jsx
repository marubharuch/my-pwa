// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get } from "firebase/database";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      const snap = await get(ref(db, `users/${user.uid}`));
      if (snap.exists()) {
        setProfile(snap.val());
      }
    };

    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white fixed w-full top-0 shadow-md z-50">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold text-lg">
          Oswal Directory
        </Link>

        <button
          className="sm:hidden block text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div className="hidden sm:flex space-x-6">
          <Link to="/">Home</Link>
          <Link to="/families">Family List</Link>
          <Link to="/create-family">Create Family</Link>

          {profile?.familySrno && (
            <Link to={`/family/${profile.familySrno}`}>My Family</Link>
          )}

          {profile?.role === "admin" && (
            <Link to="/admin">Admin Panel</Link>
          )}

          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden bg-blue-700 text-white px-4 pb-3 space-y-2">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/families" onClick={() => setMenuOpen(false)}>Family List</Link>
          <Link to="/create-family" onClick={() => setMenuOpen(false)}>Create Family</Link>

          {profile?.familySrno && (
            <Link
              to={`/family/${profile.familySrno}`}
              onClick={() => setMenuOpen(false)}
            >
              My Family
            </Link>
          )}

          {profile?.role === "admin" && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}>
              Admin Panel
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
