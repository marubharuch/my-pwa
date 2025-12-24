import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import FamilyEditForm from "../components/FamilyEditForm";

export default function AdminFamilyEditPage() {
  const { familyId } = useParams();
  const { userRecord, loading } = useAuth();
  const navigate = useNavigate();

  const [familyData, setFamilyData] = useState(null);

  useEffect(() => {
    if (!loading && userRecord?.role !== "admin") {
      navigate("/");
    }
  }, [loading, userRecord, navigate]);

  useEffect(() => {
    async function load() {
      const snap = await get(ref(db, `families/${familyId}`));
      if (snap.exists()) {
        setFamilyData({ familyId, ...snap.val() });
      }
    }
    load();
  }, [familyId]);

  if (!familyData) return <div className="p-4">Loading family…</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Edit Family #{familyId}
      </h1>

      <FamilyEditForm
        mode="edit"
        familyData={familyData}
      />
    </div>
  );
}
