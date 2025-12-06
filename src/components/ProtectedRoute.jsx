// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking auth
  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // If user not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated → allow page
  return children;
}
