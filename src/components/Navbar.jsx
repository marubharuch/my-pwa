// src/components/Navbar.jsx

/**
 * 🧭 GLOBAL NAVBAR – FINAL
 *
 * RULES (DO NOT BREAK):
 * ------------------------------------------------
 * - Navbar MUST NOT read from Firebase
 * - User & role come ONLY from AuthContext
 * - Directory (/dir) is public home
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePWAInstall from "../hooks/usePWAInstall";
import { APP_VERSION } from "../version";



import {
  HiHome,
  HiUsers,
  HiUserGroup,
  HiLogout,
  HiLogin,
  HiShieldCheck,
} from "react-icons/hi";

export default function Navbar() {
  const { user, userRecord, logout } = useAuth();
  const navigate = useNavigate();

  const familySrno = userRecord?.familySrno;
  const isAdmin = userRecord?.role === "admin";
  const userName = userRecord?.name || user?.displayName || "Profile";
const { canInstall, install } = usePWAInstall();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 fixed top-0 w-full z-50 shadow">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
<div className="flex items-center gap-2">
  {/* HOME ICON */}
  <Link to="/" className="text-white text-2xl">
    <HiHome />
  </Link>

  {/* APP NAME + VERSION */}
  <Link
    to="/"
    className="text-white font-semibold text-base"
  >
    OswalDirectory <span className="text-xs opacity-80 ml-1">
    {APP_VERSION}
  </span>
  </Link>
</div>

        



        


        {/* ================= MOBILE ================= */}
        <div className="flex items-center gap-5 md:hidden text-white text-[11px]">
{canInstall && (
  <button
    onClick={install}
    className="flex flex-col items-center text-white"
  >
    <span className="text-xl">⬇️</span>
    <span>Install</span>
  </button>
)}

         
          {/* MY FAMILY */}
          {familySrno && (
            <Link
              to={`/family/${familySrno}`}
              className="flex flex-col items-center"
            >
              <HiUserGroup className="text-xl" />
              <span>My Family</span>
            </Link>
          )}

          {/* ADMIN */}
          {isAdmin && (
            <Link to="/admin" className="flex flex-col items-center">
              <HiShieldCheck className="text-xl" />
              <span>Admin</span>
            </Link>
          )}

          {/* LOGIN / PROFILE */}
          {!user ? (
            <Link to="/login" className="flex flex-col items-center">
              <HiLogin className="text-xl" />
              <span>Login</span>
            </Link>
          ) : (
            <button
              onClick={() => navigate("/home")}
              className="flex flex-col items-center"
            >
              <span className="text-xs font-semibold truncate max-w-[60px]">
                {userName}
              </span>
            </button>
          )}
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:flex gap-6 text-white text-sm items-center">
         
{canInstall && (
  <button
    onClick={install}
    className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium"
  >
    Install App
  </button>
)}

          {familySrno && (
            <Link to={`/family/${familySrno}`}>
              My Family
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="font-semibold">
              Admin
            </Link>
          )}

          {!user ? (
            <Link to="/login">Login</Link>
          ) : (
            <>
              <button
                onClick={() => navigate("/")}
                className="font-semibold"
              >
                {userName}
              </button>

              <button onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
