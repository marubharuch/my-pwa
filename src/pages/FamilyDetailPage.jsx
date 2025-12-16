// src/pages/FamilyDetailPage.jsx

/**
 * 👨‍👩‍👧‍👦 FAMILY DETAIL PAGE – FINAL STRUCTURE (FROZEN)
 *
 * DATA MODEL (DO NOT BREAK):
 * ------------------------------------------------
 * families/{familyId}
 *  ├─ info
 *  │   ├─ currentCity
 *  │   ├─ nativeCity
 *  │   └─ editorEmails
 *  ├─ members/{memberId = timestamp}
 *  ├─ pendingRequests
 *  └─ meta
 *
 * ❌ DO NOT use /familyMembers
 * ❌ DO NOT read /users here
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, get, set, update, remove } from "firebase/database";
import MemberForm from "../components/MemberForm";

export default function FamilyDetailPage() {
  const { srno: familyId } = useParams();

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

  /* ---------------- LOAD FAMILY ---------------- */
  useEffect(() => {
    async function loadFamily() {
      const snap = await get(ref(db, `families/${familyId}`));
      if (snap.exists()) {
        setFamily(snap.val());
      }
      setLoading(false);
    }
    loadFamily();
  }, [familyId]);

  /* ---------------- LOAD MEMBERS ---------------- */
  useEffect(() => {
    async function loadMembers() {
      const snap = await get(
        ref(db, `families/${familyId}/members`)
      );
      setMembers(snap.exists() ? snap.val() : {});
    }
    loadMembers();
  }, [familyId]);

  /* ---------------- PERMISSION ---------------- */
  const isEditor =
    !!userRecord &&
    !!family &&
    (
      userRecord.role === "admin" ||
      family.meta?.createdBy === uid ||
      family.info?.editorEmails?.[uid] === true
    );

  /* ---------------- EDIT CITY / NATIVE ---------------- */
  const editField = async (field, label) => {
    if (!isEditor) return;

    const value = window.prompt(
      `Edit ${label}`,
      family.info?.[field] || ""
    );
    if (value === null) return;

    await update(ref(db, `families/${familyId}/info`), {
      [field]: value.trim(),
    });

    await update(ref(db, `families/${familyId}/meta`), {
      updatedAt: Date.now(),
    });

    setFamily((f) => ({
      ...f,
      info: { ...f.info, [field]: value.trim() },
    }));
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

      await set(
        ref(db, `families/${familyId}/info/editorEmails/${pid}`),
        true
      );

      await update(ref(db, `users/${pid}`), {
        familyId,
        role: "member",
      });

      await remove(
        ref(db, `families/${familyId}/pendingRequests/${pid}`)
      );

      const add = window.confirm(
        `Add ${name} as family member?\n\nOK = Yes\nCancel = Editor only`
      );

      if (add) {
        const memberId = Date.now();
        await set(
          ref(db, `families/${familyId}/members/${memberId}`),
          {
            id: memberId,
            name,
            active: true,
            addedViaJoin: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        );

        setMembers((m) => ({
          ...m,
          [memberId]: {
            id: memberId,
            name,
            active: true,
            addedViaJoin: true,
          },
        }));
      }

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

    await remove(
      ref(db, `families/${familyId}/pendingRequests/${pid}`)
    );

    setFamily((f) => {
      const p = { ...(f.pendingRequests || {}) };
      delete p[pid];
      return { ...f, pendingRequests: p };
    });
  };

  /* ---------------- LEAVE FAMILY ---------------- */
  const leaveFamily = async () => {
    if (!userRecord || userRecord.familyId !== familyId) return;
    if (!window.confirm("Leave this family? You will be hidden.")) return;

    await update(
      ref(db, `families/${familyId}/members/${uid}`),
      {
        active: false,
        leftAt: Date.now(),
      }
    );

    await remove(
      ref(db, `families/${familyId}/info/editorEmails/${uid}`)
    );

    await update(ref(db, `users/${uid}`), {
      familyId: null,
      role: userRecord.role === "admin" ? "admin" : "guest",
    });

    navigate("/join-family");
  };

  /* ---------------- ADD / EDIT MEMBER ---------------- */
  const handleSaveMember = async (data, id = null) => {
  const memberId = id || Date.now();
  const now = Date.now();

  // 1️⃣ Save / update member
  await update(
    ref(db, `families/${familyId}/members/${memberId}`),
    {
      ...data,
      id: memberId,
      active: data.active !== false,
      updatedAt: now,
    }
  );

  // 2️⃣ 🔥 CRITICAL: update family meta
  await update(
    ref(db, `families/${familyId}/meta`),
    {
      updatedAt: now,           // directory + cache trigger
      membersUpdatedAt: now,    // optional but recommended
    }
  );

  // 3️⃣ Update local state
  setMembers((m) => ({
    ...m,
    [memberId]: {
      ...(m[memberId] || {}),
      ...data,
      id: memberId,
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
      <h2 className="text-xl font-bold mb-4">
        Family #{familyId}
      </h2>

      {/* CITY / NATIVE */}
      {/* CITY / NATIVE */}
<div className="bg-white p-3 rounded shadow mb-4 space-y-2">
  <div className="flex justify-between">
    <span>
      Current City: <b>{family.info?.currentCity || "-"}</b>
    </span>
    {isEditor && (
      <button onClick={() => editField("currentCity", "Current City")}>
        ✏️
      </button>
    )}
  </div>

  <div className="flex justify-between">
    <span>
      Native City: <b>{family.info?.nativeCity || "-"}</b>
    </span>
    {isEditor && (
      <button onClick={() => editField("nativeCity", "Native City")}>
        ✏️
      </button>
    )}
  </div>

  {/* ADDRESS */}
  <div className="flex justify-between items-start">
    <span className="flex-1">
      Address:
      <br />
      <b className="text-sm">
        {family.info?.address || "—"}
      </b>
    </span>

    {isEditor && (
      <button
        onClick={() => editField("address", "Address")}
        className="ml-2 text-blue-600"
        title="Edit Address"
      >
        ✏️
      </button>
    )}
  </div>
</div>


      {/* MEMBERS */}
      <h3 className="font-bold mb-2">Members</h3>
      {visibleMembers.map(([id, m]) => (
        <div
          key={id}
          className="bg-white p-3 rounded shadow mb-2 flex justify-between"
        >
          <div>
            <b>{m.name}</b>
            {m.active === false && (
              <span className="text-xs text-gray-400 ml-2">
                Hidden
              </span>
            )}
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

      {userRecord?.familyId === familyId && (
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
