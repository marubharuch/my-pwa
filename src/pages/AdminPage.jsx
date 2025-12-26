import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-center">
        Super Admin Panel
      </h1>

      <div className="space-y-4">
        <button
          onClick={() => navigate("/superadmin/create-family")}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Create Family
        </button>

        <button
          onClick={() => navigate("/superadmin/users")}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
        >
          Manage Users
        </button>

        <button
          onClick={() => navigate("/superadmin/join-requests")}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
        >
          Join Requests
        </button>
      </div>
    </div>
  );
}
