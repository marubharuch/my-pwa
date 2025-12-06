import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { ref, get } from "firebase/database";

export default function DebugPage() {
  const [logs, setLogs] = useState([]);

  const log = (msg, ok = true) => {
    setLogs((l) => [...l, { msg, ok }]);
  };

  useEffect(() => {
    async function runChecks() {
      /* -------------------------------- */
      /* AUTH */
      /* -------------------------------- */
      if (auth.currentUser) {
        log("Auth ✅ Logged in as " + auth.currentUser.email);
      } else {
        log("Auth ❌ Not logged in", false);
      }

      /* -------------------------------- */
      /* USERS READ */
      /* -------------------------------- */
      try {
        await get(ref(db, "users/" + auth.currentUser?.uid));
        log("Users/read ✅ Allowed");
      } catch {
        log("Users/read ❌ Blocked", false);
      }

      /* -------------------------------- */
      /* PUBLIC FAMILIES READ */
      /* -------------------------------- */
      try {
        await get(ref(db, "families"));
        log("Families/read ✅ Public access ok");
      } catch {
        log("Families/read ❌ Failed", false);
      }

      /* -------------------------------- */
      /* MASTER WRITE (should be blocked) */
      /* -------------------------------- */
      try {
        await get(ref(db, "master"));
        log("Master/read ✅");
      } catch {
        log("Master/read ❌", false);
      }
    }

    runChecks();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">System Health Check</h2>

      <div className="space-y-2">
        {logs.map((l, i) => (
          <div
            key={i}
            className={`p-2 rounded text-sm ${
              l.ok ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
