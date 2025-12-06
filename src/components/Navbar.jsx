// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white fixed w-full top-0 shadow-md z-50">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">

        {/* BRAND / LOGO */}
        <Link to="/" className="font-bold text-lg">
          Oswal Directory
        </Link>

        {/* HAMBURGER BUTTON (Mobile) */}
        <button
          className="sm:hidden block text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {/* MENU (Desktop) */}
        <div className="hidden sm:flex space-x-6">

          <Link to="/" className="hover:text-gray-200">
            Home
          </Link>

          <Link to="/families" className="hover:text-gray-200">
            Family List
          </Link>

          <Link to="/create-family" className="hover:text-gray-200">
            Create Family
          </Link>

          {/* My Family (only if user has familySrno) */}
          {user && user.familySrno && (
            <Link
              to={`/family/${user.familySrno}`}
              className="hover:text-gray-200"
            >
              My Family
            </Link>
          )}

          {/* ADMIN ONLY */}
          {user && user.role === "admin" && (
            <Link to="/admin" className="hover:text-gray-200">
              Admin Panel
            </Link>
          )}

          {/* LOGIN / LOGOUT */}
          {user ? (
            <button
              onClick={handleLogout}
              className="hover:text-gray-200"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="hover:text-gray-200">
              Login
            </Link>
          )}

        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="sm:hidden bg-blue-700 text-white px-4 pb-3 space-y-2">

          <Link
            to="/"
            className="block py-2 border-b border-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>

          <Link
            to="/families"
            className="block py-2 border-b border-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            Family List
          </Link>

          <Link
            to="/create-family"
            className="block py-2 border-b border-blue-500"
            onClick={() => setMenuOpen(false)}
          >
            Create Family
          </Link>

          {user && user.familySrno && (
            <Link
              to={`/family/${user.familySrno}`}
              className="block py-2 border-b border-blue-500"
              onClick={() => setMenuOpen(false)}
            >
              My Family
            </Link>
          )}

          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="block py-2 border-b border-blue-500"
              onClick={() => setMenuOpen(false)}
            >
              Admin Panel
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left py-2"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="block py-2"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
