// src/components/Navbar.jsx

/**
 * 🧭 GLOBAL NAVBAR – MOBILE FIRST (READ-OPTIMIZED)
 *
 * ✅ IMPORTANT RULES (DO NOT BREAK):
 * ------------------------------------------------
 * - Navbar MUST NOT read from Firebase database
 * - User profile (familySrno, role) comes ONLY from AuthContext
 * - AuthContext is the SINGLE source of truth
 *
 * ✅ Allowed:
 * - useAuth().user
 * - useAuth().userRecord
 *
 * ❌ Forbidden:
 * - get(ref(db, `users/...`))
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  HiHome,
  HiUsers,
  HiUserGroup,
  HiLogout,
} from "react-icons/hi";

export default function Navbar() {
  const { user, userRecord, logout } = useAuth();
  const navigate = useNavigate();

  const familySrno = userRecord?.familySrno;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 fixed top-0 w-full z-50 shadow">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* HOME ICON */}
        <Link to="/" className="text-white text-2xl">
          <HiHome />
        </Link>

        {/* LOGO */}
        <Link to="/" className="text-white font-semibold">
          Oswal Directory
        </Link>

        {/* ================= MOBILE ================= */}
        <div className="flex items-center gap-5 md:hidden text-white text-[11px]">

          <Link to="/dir" className="flex flex-col items-center">
            <HiUsers className="text-xl" />
            <span>Directory</span>
          </Link>

          {/* ✅ MY FAMILY */}
          {familySrno && (
            <Link
              to={`/family/${familySrno}`}
              className="flex flex-col items-center"
            >
              <HiUserGroup className="text-xl" />
              <span>My Family</span>
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center"
            >
              <HiLogout className="text-xl" />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:flex gap-6 text-white text-sm items-center">
          <Link to="/">Home</Link>
          <Link to="/dir">Family List</Link>

          {familySrno && (
            <Link to={`/family/${familySrno}`}>
              My Family
            </Link>
          )}

          {user && (
            <button onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
