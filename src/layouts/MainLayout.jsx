// src/layouts/MainLayout.jsx
import React from "react";
import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div>
     { <Navbar />}
      <div className="pt-16 px-4">
        {children}
      </div>
    </div>
  );
}
