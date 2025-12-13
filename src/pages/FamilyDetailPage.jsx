// src/pages/FamilyDetailPage.jsx

/**
 * 👨‍👩‍👧‍👦 FAMILY DETAIL PAGE – MEMBER-SEPARATED (FROZEN)
 *
 * ✅ ARCHITECTURE (DO NOT BREAK):
 * ------------------------------------------------
 * 1️⃣ Family META → /families/{srno}
 *    - city, native, editorEmails, createdBy
 *
 * 2️⃣ Members → /familyMembers/{srno}/{memberId}
 *    - name, mobile, active, updatedAt
 *
 * 3️⃣ User profile → AuthContext.userRecord
 *    ❌ NEVER read /users/{uid} here
 *
 * ✅ WHY THIS EXISTS:
 * ------------------------------------------------
 * - Prevent downloading entire family when 1 member changes
 * - Enable timestamp-based sync & localForage caching
 *
 * ❗ RULES FOR FUTURE EDITS:
 * ------------------------------------------------
 * ❌ DO NOT put members back inside /families
 * ❌ DO NOT re-fetch family after every edit
 * ✅ Update local state after writes
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, set, update, remove, push } from "firebase/database";
import MemberForm from "../components/MemberForm";

export default function FamilyDetailPage() {
  const { srno } = useParams();
  const navigate = useNavigate();
  const { user, userRecord, loading: authLoading } = useAuth();
  const uid = user?.uid;

  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState({});
  const [pendingUsers, setPendingUsers] = useState({});
  const [loading, setLoading] = useState(true);

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [processingUid, setProcessingUid] = useState(null);

  /* ---------------- LOAD FAMILY META ---------------- */
  useEffect(() => {
    async function loadFamily() {
      const snap = await get(ref(db, `families/${srno}`));
      if (snap.exists()) setFamily(snap.val());
      setLoading(false);
    }
    loadFamily();
  }, [srno]);

  /* ---------------- LOAD MEMBERS (SEPARATE NODE) ---------------- */
  useEffect(() => {
    async function loadMembers() {
      const snap = await get(ref(db, `familyMembers/${srno}`));
      if (snap.exists()) setMembers(snap.val());
      else setMembers({});
    }
    loadMembers();
  }, [srno]);

  /* ---------------- PERMISSION ---------------- */
  const isEditor =
    !!userRecord &&
    !!family &&
    (
      userRecord.role === "admin" ||
      family.createdBy === uid ||
      family.editorEmails?.[uid] === true
    );

  /* ---------------- EDIT CITY / NATIVE ---------------- */
  const editField = async (field, label) => {
    if (!isEditor) return;

    const value = window.prompt(`Edit ${label}`, family[field] || "");
    if (value === null || value.trim() === family[field]) return;

    await update(ref(db, `families/${srno}`), {
      [field]: value.trim(),
      updatedAt: Date.now(),
    });

    setFamily((f) => ({ ...f, [field]: value.trim() }));
  };

  /* ---------------- LOAD PENDING REQUESTS ---------------- */
  useEffect(() => {
    if (!isEditor || !family?.pendingRequests) {
      setPendingUsers({});
      return;
    }
    setPendingUsers(family.pendingRequests);
  }, [family, isEditor]);

  /* ---------------- APPROVE JOIN ---------------- */
  const confirmApprove = async (pid, name) => {
    if (!window.confirm(`Approve join request for ${name}?`)) return;

    try {
      setProcessingUid(pid);

      // ✅ Editor access
      await set(ref(db, `families/${srno}/editorEmails/${pid}`), true);

      // ✅ Update user profile
      await update(ref(db, `users/${pid}`), {
        familySrno: srno,
        role: "member",
      });

      // ✅ Remove pending
      await remove(ref(db, `families/${srno}/pendingRequests/${pid}`));
      await remove(ref(db, `users/${pid}/pendingJoin`));

      // ✅ Ask optional member creation
      const add = window.confirm(
        `Add ${name} as family member?\n\nOK = Yes\nCancel = Editor only`
      );

      if (add) {
        const memberId = pid; // ✅ stable ID for joined users
        await set(ref(db, `familyMembers/${srno}/${memberId}`), {
          name,
          active: true,
          addedViaJoin: true,
          updatedAt: Date.now(),
        });

        setMembers((m) => ({
          ...m,
          [memberId]: {
            name,
            active: true,
            addedViaJoin: true,
          },
        }));
      }

      // ✅ Update local pending list
      setFamily((f) => {
        const p = { ...(f.pendingRequests || {}) };
        delete p[pid];
        return { ...f, pendingRequests: p };
      });

    } finally {
      setProcessingUid(null);
    }
  };

  /* ---------------- REJECT JOIN ---------------- */
  const confirmReject = async (pid, name) => {
    if (!window.confirm(`Reject join request for ${name}?`)) return;

    await remove(ref(db, `families/${srno}/pendingRequests/${pid}`));
    await remove(ref(db, `users/${pid}/pendingJoin`));

    setFamily((f) => {
      const p = { ...(f.pendingRequests || {}) };
      delete p[pid];
      return { ...f, pendingRequests: p };
    });
  };

  /* ---------------- LEAVE FAMILY ---------------- */
  const leaveFamily = async () => {
    if (!userRecord || userRecord.familySrno !== srno) return;
    if (!window.confirm("Leave this family? You will be hidden.")) return;

    await update(ref(db, `familyMembers/${srno}/${uid}`), {
      active: false,
      leftAt: Date.now(),
    });

    await remove(ref(db, `families/${srno}/editorEmails/${uid}`));
    await update(ref(db, `users/${uid}`), {
      familySrno: null,
      role: userRecord.role === "admin" ? "admin" : "guest",
    });

    navigate("/join-family");
  };

  /* ---------------- ADD / EDIT MEMBER ---------------- */
  const handleSaveMember = async (data, id = null) => {
    const memberId = id || push(ref(db)).key;

    await update(ref(db, `familyMembers/${srno}/${memberId}`), {
      ...data,
      active: data.active !== false,
      updatedAt: Date.now(),
    });

    setMembers((m) => ({
      ...m,
      [memberId]: {
        ...(m[memberId] || {}),
        ...data,
        active: data.active !== false,
      },
    }));
  };

  /* ---------------- UI STATES ---------------- */
  if (loading || authLoading) return <div className="p-4">Loading…</div>;
  if (!family) return <div className="p-4">Family not found</div>;

  const allMembers = Object.entries(members || {});
  const visibleMembers = isEditor
    ? allMembers
    : allMembers.filter(([_, m]) => m.active !== false);

  return (
    <div className="p-4 max-w-md mx-auto">

      <h2 className="text-xl font-bold mb-4">Family #{srno}</h2>

      {/* CITY / NATIVE */}
      <div className="bg-white p-3 rounded shadow mb-4 space-y-2">
        <div className="flex justify-between">
          <span>Current City: <b>{family.currentCity || "-"}</b></span>
          {isEditor && <button onClick={() => editField("currentCity","Current City")}>✏️</button>}
        </div>
        <div className="flex justify-between">
          <span>Native City: <b>{family.nativeCity || "-"}</b></span>
          {isEditor && <button onClick={() => editField("nativeCity","Native City")}>✏️</button>}
        </div>
      </div>

      {/* MEMBERS */}
      <h3 className="font-bold mb-2">Members</h3>
      {visibleMembers.map(([id, m]) => (
        <div key={id} className="bg-white p-3 rounded shadow mb-2 flex justify-between">
          <div>
            <b>{m.name}</b>
            {m.active === false && <span className="text-xs text-gray-400 ml-2">Hidden</span>}
          </div>

          {isEditor && (
            <button
              onClick={() => {
                setEditMember({ id, ...m });
                setMemberModalOpen(true);
              }}
              className="text-sm text-blue-600"
            >
              Edit
            </button>
          )}
        </div>
      ))}

      {/* ADD MEMBER */}
      {isEditor && (
        <button
          className="mt-4 w-full bg-green-600 text-white py-2 rounded"
          onClick={() => {
            setEditMember(null);
            setMemberModalOpen(true);
          }}
        >
          + Add Member
        </button>
      )}

      {/* LEAVE FAMILY */}
      {userRecord?.familySrno === srno && (
        <button
          onClick={leaveFamily}
          className="mt-6 w-full bg-red-500 text-white py-2 rounded"
        >
          Leave Family
        </button>
      )}

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
