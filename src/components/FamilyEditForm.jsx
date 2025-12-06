// src/components/FamilyEditForm.jsx
import React, { useState } from "react";
import { db } from "../firebase";
import { ref, set, get, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FamilyEditForm({ mode = "create", familyData }) {
  const { user } = useAuth();
const navigate = useNavigate();

  const [family, setFamily] = useState({
    currentCity: familyData?.currentCity || "",
    nativeCity: familyData?.nativeCity || "",
  });

  const [members, setMembers] = useState(
    familyData?.members
      ? Object.values(familyData.members)
      : [{ name: "", mobile: "", gender: "Male" }]
  );

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addMember = () => {
    setMembers([...members, { name: "", mobile: "", gender: "Male" }]);
  };

  const handleSubmit = async () => {
  if (!user) {
    alert("Login required");
    return;
  }

  const timestamp = Date.now();
  let srno;

  try {
    console.log("➡ STEP 1: Getting next family srno...");
    
    // -------------------------------
    // 1️⃣ Get next SrNo
    // -------------------------------
    if (mode === "create") {
      //const snap = await get(ref(db, "master/familyIndex/nextFamilySrno"));
      const snap = await get(ref(db, "master/nextFamilySrno"));

      srno = (snap.val() || 1).toString();
      console.log("✔ Next SrNo =", srno);
    } else {
      srno = familyData.srno;
      console.log("✔ Edit mode for SrNo =", srno);
    }

    // -------------------------------
    // 2️⃣ Build family object
    // -------------------------------
    const familyPayload = {
      currentCity: family.currentCity,
      nativeCity: family.nativeCity,
      updatedAt: timestamp,
      createdBy: user.uid,
      editorEmails: {
        [user.uid]: true,
      },
      members: {},
    };

    members.forEach((m) => {
      const id = m.id || timestamp + Math.floor(Math.random() * 100000);
      familyPayload.members[id] = {
        id,
        name: m.name,
        mobile: m.mobile,
        gender: m.gender,
        countryCode: "+91",
      };
    });

    // -------------------------------
    // 3️⃣ Write family
    // -------------------------------
    console.log("➡ STEP 2: Writing /families/" + srno);
    await set(ref(db, `families/${srno}`), familyPayload);
    console.log("✔ Family saved");

    // -------------------------------
    // 4️⃣ Write summary
    // -------------------------------
    console.log("➡ STEP 3: Writing /familyDetails/" + srno);
    await set(ref(db, `familyDetails/${srno}`), {
      currentCity: family.currentCity,
      nativeCity: family.nativeCity,
      totalMembers: members.length,
      lastUpdateTimestamp: timestamp,
    });
    console.log("✔ Summary saved");

    // -------------------------------
    // 5️⃣ Update nextSrno (IMPORTANT: correct path)
    // -------------------------------
    if (mode === "create") {
      console.log("➡ STEP 4: Updating /master/familyIndex/nextSrno");

      
      await set(ref(db, "master/nextFamilySrno"), Number(srno) + 1);


      console.log("✔ nextSrno updated");

      // -------------------------------
      // 6️⃣ Update user record
      // -------------------------------
      console.log("➡ STEP 5: Updating user profile");
      await update(ref(db, `users/${user.uid}`), {
        familySrno: srno,
        role: "member",
      });

      console.log("✔ User updated");

      alert("Family created successfully!");
      
navigate(`/family/${srno}`);

    } else {
      alert("Family updated successfully!");
    }

  } catch (err) {
    console.error("❌ ERROR during family create/update:", err);
    alert("Failed: " + err.message);
  }
};


  return (
    <div className="space-y-4">

      <input
        type="text"
        placeholder="Current City"
        className="border p-2 w-full"
        value={family.currentCity}
        onChange={(e) =>
          setFamily({ ...family, currentCity: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Native City"
        className="border p-2 w-full"
        value={family.nativeCity}
        onChange={(e) =>
          setFamily({ ...family, nativeCity: e.target.value })
        }
      />

      <h3 className="text-lg font-bold">Members</h3>

      {members.map((m, i) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Name"
            value={m.name}
            onChange={(e) => updateMember(i, "name", e.target.value)}
          />

          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Mobile"
            value={m.mobile}
            onChange={(e) => updateMember(i, "mobile", e.target.value)}
          />

          <select
            className="border p-2 w-full"
            value={m.gender}
            onChange={(e) => updateMember(i, "gender", e.target.value)}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      ))}

      <button
        onClick={addMember}
        className="bg-gray-400 p-2 w-full rounded text-white"
      >
        + Add Member
      </button>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 p-2 w-full rounded text-white"
      >
        {mode === "create" ? "Create Family" : "Save Changes"}
      </button>
    </div>
  );
}
