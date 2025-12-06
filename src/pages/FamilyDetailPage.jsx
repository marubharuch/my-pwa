import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MemberForm from "../components/MemberForm";

import {
  loadFamily,
  addMember,
  updateMember,
  updateFamily
} from "../services/familyService";

export default function FamilyDetailPage() {
  const { srno } = useParams();
  const { user } = useAuth();

  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const uid = user?.uid;

  /* ---------------- LOAD FAMILY ---------------- */
  useEffect(() => {
    async function fetchData() {
      const data = await loadFamily(srno);
      setFamily(data);
      setLoading(false);
    }
    fetchData();
  }, [srno]);

  /* ---------------- PERMISSION ---------------- */
  const isEditor =
    user &&
    (user.role === "admin" || family?.editorEmails?.[uid] === true);

  /* ---------------- EDIT CITY / NATIVE (POPUP) ---------------- */
  const editField = async (field, label) => {
    if (!isEditor) return;

    const current = family[field] || "";
    const value = window.prompt(`Edit ${label}`, current);

    if (value === null || value.trim() === current) return;

    await updateFamily(srno, { [field]: value.trim() });
    setFamily(await loadFamily(srno));
  };

  /* ---------------- ADD / EDIT MEMBER ---------------- */
  const handleSaveMember = async (memberData, memberId = null) => {
    if (!isEditor) return alert("Not allowed");

    const payload = {
      ...memberData,
      active: memberData.active !== false
    };

    if (memberId) {
      await updateMember(srno, memberId, payload);
    } else {
      await addMember(srno, payload);
    }

    setFamily(await loadFamily(srno));
  };

  /* ---------------- ACTIVATE / DEACTIVATE ---------------- */
  const toggleActive = async (id, active) => {
    if (!isEditor) return;

    const ok = window.confirm(
      active
        ? "Deactivate this member?"
        : "Activate this member?"
    );
    if (!ok) return;

    await updateMember(srno, id, { active: !active });
    setFamily(await loadFamily(srno));
  };

  if (loading) return <div className="p-4">Loading family...</div>;
  if (!family) return <div className="p-4">Family not found</div>;

  const members = family.members
    ? Object.entries(family.members)
    : [];

  return (
    <div className="p-4 max-w-md mx-auto">

      {/* HEADER */}
      <h2 className="text-xl font-bold mb-3">Family #{srno}</h2>

      {/* CITY / NATIVE AS LABELS */}
      <div className="bg-white p-3 rounded shadow mb-4 space-y-2">

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Current City: <strong>{family.currentCity || "-"}</strong>
          </span>
          {isEditor && (
            <button
              onClick={() => editField("currentCity", "Current City")}
              className="text-blue-600"
            >
              ✏️
            </button>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Native City: <strong>{family.nativeCity || "-"}</strong>
          </span>
          {isEditor && (
            <button
              onClick={() => editField("nativeCity", "Native City")}
              className="text-blue-600"
            >
              ✏️
            </button>
          )}
        </div>

      </div>

      {/* MEMBER LIST */}
      <div className="space-y-3">
        {members.map(([id, m]) => {
          if (!m.active && !isEditor) return null;

          return (
            <div
              key={id}
              className={`p-3 rounded shadow flex justify-between ${
                m.active ? "bg-white" : "bg-gray-100 opacity-70"
              }`}
            >
              <div>
                <div className="font-semibold">
                  👤 {m.name}
                  {!m.active && (
                    <span className="text-xs text-red-500"> (Inactive)</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  📱 {m.mobile || "-"} | ⚧ {m.gender || "-"}
                </div>
              </div>

              {isEditor && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setEditMember({ id, ...m });
                      setMemberModalOpen(true);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleActive(id, m.active)}
                    className={`px-2 py-1 text-white rounded text-sm ${
                      m.active ? "bg-red-500" : "bg-green-600"
                    }`}
                  >
                    {m.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD MEMBER (AFTER MEMBERS) */}
      {isEditor && (
        <button
          onClick={() => {
            setEditMember(null);
            setMemberModalOpen(true);
          }}
          className="mt-4 w-full bg-green-600 text-white py-2 rounded"
        >
          + Add Member
        </button>
      )}

      {/* MEMBER MODAL */}
      <MemberForm
        open={memberModalOpen}
        initial={editMember}
        onClose={() => {
          setMemberModalOpen(false);
          setEditMember(null);
        }}
        onSave={handleSaveMember}
      />
    </div>
  );
}
