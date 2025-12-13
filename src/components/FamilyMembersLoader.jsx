// src/components/FamilyMembersLoader.jsx
import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import localforage from "localforage";

export default function FamilyMembersLoader({ srno }) {
  const LF_KEY = `lf:familyMembers:${srno}`;
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function load() {
      // ✅ Cache first
      const cached = await localforage.getItem(LF_KEY);
      if (cached) setMembers(cached);

      // ✅ Refresh from DB
      const snap = await get(ref(db, `familyMembers/${srno}`));
      if (!snap.exists()) return;

      const list = Object.values(snap.val())
        .filter(m => m.active !== false);

      await localforage.setItem(LF_KEY, list);
      setMembers(list);
    }

    load();
  }, [srno]);

  return (
    <div className="mt-2 space-y-1">
      {members.map((m, i) => (
        <div key={i} className="text-sm">
          {m.name} • {m.mobile}
        </div>
      ))}
    </div>
  );
}
