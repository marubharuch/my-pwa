/**
 * 👨‍👩‍👧‍👦 FAMILY DETAIL PAGE – CLEAN & FINAL
 *
 * DATA MODEL (DO NOT BREAK):
 * ------------------------------------------------
 * families/{familyId}
 *  ├─ info
 *  │   ├─ currentCity
 *  │   ├─ nativeCity
 *  │   ├─ address (optional)
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
import { db } from "../firebase";
import { ref, get, update, remove } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import MemberForm from "../components/MemberForm";
import { Link } from "react-router-dom";
import { toUpperText } from "../utils/textUtils";

export default function FamilyDetailPage({
  familyId: familyIdProp,
  isModal = false,
}) {
  console.log("Rendering FamilyDetailPage");

  const params = useParams();
  const familyId = familyIdProp ?? params.srno;

  const navigate = useNavigate();
  const { user, userRecord, loading: authLoading } = useAuth();
  const uid = user?.uid;


  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);

  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [orderDraft, setOrderDraft] = useState({});
const [orderSaved, setOrderSaved] = useState({});


  /* ---------------- LOAD FAMILY ---------------- */
  useEffect(() => {
    async function load() {
      const snap = await get(ref(db, `families/${familyId}`));
      if (snap.exists()) setFamily(snap.val());
      setLoading(false);
    }
    load();
  }, [familyId]);

  /* ---------------- LOAD MEMBERS ---------------- */
  useEffect(() => {
    async function loadMembers() {
      const snap = await get(ref(db, `families/${familyId}/members`));
      setMembers(snap.exists() ? snap.val() : {});
    }
    loadMembers();
  }, [familyId]);

  //------------  //
  
useEffect(() => {
  const draft = {};
  Object.entries(members || {}).forEach(([id, m]) => {
    draft[id] = m.displayOrder ?? "";
  });
  setOrderDraft(draft);
}, [members]);


  /* ---------------- PERMISSION ---------------- */
  const isEditor =
    !!userRecord &&
    !!family &&
    (
      userRecord.role === "admin" ||
      family.meta?.createdBy === uid ||
      family.info?.editorEmails?.[uid] === true
    );

    /* ================= MEMBER ORDER UPDATE ================= */
const updateMemberOrder = async (memberId, order) => {
  if (!order || order < 1) return;

  try {
    await update(
      ref(db, `families/${familyId}/members/${memberId}`),
      { displayOrder: Number(order) }
    );

    // ✅ show "Saved"
    setOrderSaved((p) => ({ ...p, [memberId]: true }));

    // ⏳ auto-hide after 1.5 sec
    setTimeout(() => {
      setOrderSaved((p) => ({ ...p, [memberId]: false }));
    }, 1500);

  } catch (err) {
    console.error("Failed to update displayOrder", err);
  }
};



  /* ---------------- HIDE / UNHIDE MEMBER ---------------- */
  const toggleMemberVisibility = async (memberId, isActive) => {
    const ok = window.confirm(
      isActive
        ? "Hide this member?\n\n• Member will NOT appear in directory"
        : "Unhide this member?\n\n• Member will appear in directory"
    );

    if (!ok) return;

    const now = Date.now();

    await update(ref(db, `families/${familyId}/members/${memberId}`), {
      active: !isActive,
      updatedAt: now,
    });

    setMembers((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        active: !isActive,
      },
    }));
  };

  /* ---------------- INLINE EDIT ---------------- */
  const startEdit = (field) => {
    if (!isEditor) return;
    setEditingField(field);
    setFieldValue(family.info?.[field] || "");
  };

  const saveEdit = async () => {
    const now = Date.now();

    await update(ref(db, `families/${familyId}/info`), {
      [editingField]:
        ["currentCity", "nativeCity","samaj"].includes(editingField)
          ? toUpperText(fieldValue.trim())
          : fieldValue.trim(),
    });
alert("Family information updated successfully");

    await update(ref(db, `families/${familyId}/meta`), {
      updatedAt: now,
    });

    setFamily((f) => ({
      ...f,
      info: { ...f.info, [editingField]: fieldValue.trim() },
    }));

    setEditingField(null);
  };

  /* ---------------- ADD / EDIT MEMBER ---------------- */
  const handleSaveMember = async (data, id = null) => {
    const memberId = id || Date.now();
    const now = Date.now();

    await update(ref(db, `families/${familyId}/members/${memberId}`), {
      ...data,
      id: memberId,
      active: data.active !== false,
      updatedAt: now,
    });
alert(id ? "Member updated successfully" : "Member added successfully");

    await update(ref(db, `families/${familyId}/meta`), {
      updatedAt: now,
      membersUpdatedAt: now,
    });

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

  /* ---------------- LEAVE FAMILY ---------------- */
  const leaveFamily = async () => {
    if (!window.confirm("Leave this family?")) return;

    await update(ref(db, `families/${familyId}/members/${uid}`), {
      active: false,
      leftAt: Date.now(),
    });

    await remove(ref(db, `families/${familyId}/info/editorEmails/${uid}`));

    await update(ref(db, `users/${uid}`), {
      familyId: null,
      role: userRecord.role === "admin" ? "admin" : "guest",
    });

    navigate("/join-family");
  };

  /* ---------------- UI STATES ---------------- */
  {console.log("Rendering FamilyDetailPage UI states:")}
  if (loading || authLoading) return <div className="p-4">Loading…</div>;
  if (!family) return <div className="p-4">Family not found</div>;

  const visibleMembers = Object.entries(members || {})
  .map(([id, m]) => ({ id, ...m }))
  .filter((m) => isEditor || m.active !== false)
  .sort(
    (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  );


  /* ---------------- RENDER ---------------- */
  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Family #{familyId}</h2>

      {isEditor && family.pendingRequests && (
        <Link
          to={`/family/${familyId}/requests`}
          className="text-sm text-blue-600 underline"
        >
          Edit Requests ({Object.keys(family.pendingRequests).length})
        </Link>
      )}

      {/* FAMILY INFO */}
      <div className="bg-white p-3 rounded shadow mb-4 space-y-2">
        {["samaj","currentCity", "nativeCity", "address"].map((field) => (
          <div key={field} className="flex justify-between items-start">
            <span className="flex-1">
              {field === "currentCity" && "Current City"}
              {field === "nativeCity" && "Native City"}
              {field === "samaj" && "Samaj"}

              {field === "address" && "Address"}:
              <br />

              {editingField === field ? (
                field === "address" ? (
                  <textarea
                    className="w-full border p-2 rounded text-sm"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                  />
                ) : (
                  <input
                    className="w-full border p-2 rounded text-sm"
                    value={fieldValue}
                    onChange={(e) =>
                      setFieldValue(
                        ["currentCity", "nativeCity"].includes(field)
                          ? toUpperText(e.target.value)
                          : e.target.value
                      )
                    }
                  />
                )
              ) : (
               <b className="text-sm">
  {typeof family.info?.[field] === "string"
    ? family.info[field]
    : family.info?.[field]
    ? JSON.stringify(family.info[field])
    : "—"}
</b>
 )}
            </span>

            {isEditor &&
              (editingField === field ? (
                <button onClick={saveEdit} className="ml-2 text-green-600">
                  ✔
                </button>
              ) : (
                <button
                  onClick={() => startEdit(field)}
                  className="ml-2 text-blue-600"
                >
                  ✏️
                </button>
              ))}
          </div>
        ))}
      </div>

      {/* MEMBERS */}
      <h3 className="font-bold mb-2">Members</h3>
{/* ================= MEMBER DISPLAY ORDER ================= */}


      {visibleMembers.map((m) => (
        <div
  key={m.id}
  className={`p-3 rounded shadow mb-2 flex items-center gap-3
    ${
      m.active === false
        ? "bg-gray-100 opacity-70 border border-dashed"
        : "bg-white"
    }`}
>
  {/* ORDER INPUT (EDITOR ONLY) */}
  {isEditor && (
    <input
  type="number"
  min="1"
  inputMode="numeric"
  placeholder="—"
  value={orderDraft[m.id] ?? ""}
  onChange={(e) =>
    setOrderDraft((p) => ({
      ...p,
      [m.id]: e.target.value,
    }))
  }
  onBlur={() =>
    updateMemberOrder(m.id, orderDraft[m.id])
  }
  className="
    w-12 h-8
    border border-gray-300
    rounded-md
    text-center text-sm
  "
/>

  )}

  {/* MEMBER NAME */}
  <div className="flex-1">
    <b>{m.name}</b>
    {orderSaved[m.id] && (
    <span className="text-xs text-green-600 ml-2">
      Saved
    </span>
  )}
    {m.active === false && (
      <span className="text-xs text-gray-400 ml-2">Hidden</span>
    )}
  </div>

  {/* ACTIONS */}
  {isEditor && (
    <div className="flex gap-3 items-center text-sm">
      <button
        onClick={() => {
          setEditMember(m);
          setMemberModalOpen(true);
        }}
        className="text-blue-600"
      >
        Edit
      </button>

      <button
        onClick={() => toggleMemberVisibility(m.id, m.active !== false)}
        className={m.active === false ? "text-green-600" : "text-red-600"}
      >
        {m.active === false ? "Unhide" : "Hide"}
      </button>
    </div>
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

      {!isModal &&
  userRecord?.role !== "admin" &&
  userRecord?.familyId === familyId && (
    <button disabled
      onClick={leaveFamily}
      className="mt-6 w-full bg-red-500 text-white py-2 rounded  "
    >
      visit Home page after adding/editing data
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
