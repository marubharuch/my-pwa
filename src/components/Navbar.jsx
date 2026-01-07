// src/components/Navbar.jsx
/**
 * 🧭 GLOBAL NAVBAR – MOBILE-FIRST
 *
 * RULES:
 * - Navbar MUST NOT read from Firebase
 * - User & role come ONLY from AuthContext
 * - Directory (/) is public home
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePWAInstall from "../hooks/usePWAInstall";
import { APP_VERSION } from "../version";

import { FaAddressBook, FaRegCommentDots } from "react-icons/fa";
import { MdFamilyRestroom } from "react-icons/md";
import {
  HiUserGroup,
  HiLogin,
  HiShieldCheck,
  HiLogout,
} from "react-icons/hi";

export default function Navbar() {
  const { user, userRecord, logout } = useAuth();
  const navigate = useNavigate();
  const { canInstall, install } = usePWAInstall();

  const familySrno = userRecord?.familySrno;
  const isAdmin = userRecord?.role === "admin";
  const userName =
    userRecord?.name || user?.displayName || "Profile";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 fixed top-0 w-full z-50 shadow">
      <div className="max-w-4xl mx-auto px-4">

        {/* ================= TITLE ROW (MOBILE + DESKTOP) ================= */}
        <div className="h-12 flex items-center">
          <Link
            to="/"
            className="text-white font-semibold text-base"
          >
            OswalDirectory
            <span className="text-xs opacity-80 ml-1">
              {APP_VERSION}
            </span>
          </Link>
        </div>

        {/* ================= MOBILE ICON ROW ================= */}
        <div className="md:hidden flex justify-between items-center pb-2 text-white text-[11px]">

          <Link to="/tel" className="flex flex-col items-center">
            <FaAddressBook className="text-xl" />
            <span>Tel</span>
          </Link>

          <Link to="/femdir" className="flex flex-col items-center">
            <MdFamilyRestroom className="text-xl" />
            <span>Fem</span>
          </Link>

          <Link to="/feedback" className="flex flex-col items-center">
            <FaRegCommentDots className="text-xl" />
            <span>Feedback</span>
          </Link>

          {canInstall && (
            <button
              onClick={install}
              className="flex flex-col items-center"
            >
              <span className="text-xl">⬇️</span>
              <span>Install</span>
            </button>
          )}

          {familySrno && (
            <Link
              to={`/family/${familySrno}`}
              className="flex flex-col items-center"
            >
              <HiUserGroup className="text-xl" />
              <span>Family</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="flex flex-col items-center"
            >
              <HiShieldCheck className="text-xl" />
              <span>Admin</span>
            </Link>
          )}

          {!user ? (
            <Link
              to="/login"
              className="flex flex-col items-center"
            >
              <HiLogin className="text-xl" />
              <span>Login</span>
            </Link>
          ) : (
            <button
              onClick={() => navigate("/home")}
              className="flex flex-col items-center max-w-[60px]"
            >
              <span className="text-xs font-semibold truncate">
                {userName}
              </span>
            </button>
          )}
        </div>

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:flex items-center gap-6 text-white text-sm pb-3">

          <Link to="/tel">Tel Directory</Link>
          <Link to="/femdir">Fem Dir</Link>
          <Link to="/feedback">Feedback</Link>

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
                onClick={() => navigate("/home")}
                className="font-semibold"
              >
                {userName}
              </button>

              <button onClick={handleLogout}>
                <HiLogout />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
