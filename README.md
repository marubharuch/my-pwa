📘 Oswal Directory – Architecture & Logic Notes
🔍 Overview

Oswal Directory is a community directory web app built using:

React (frontend)

Firebase Authentication

Firebase Realtime Database (RTDB)

localForage (offline caching & delta sync)

The core idea is to manage families and their members, with:

role-based access (admin / member)

editor permissions

safe onboarding

offline-friendly reads

secure backend rules

🔐 Authentication Model
✅ Firebase Auth (Identity only)

Firebase Auth is used only for identity, not roles or permissions.

Auth user provides:

uid

email

displayName

provider

⚠️ Auth user NEVER contains app data like:

role

familySrno

permissions

✅ App User Profile (RTDB)

Actual user data is stored at:

/users/{uid}


Example:

{
  "familySrno": "123",
  "role": "member"
}


Roles:

admin → full system access

member → family-level access

✅ All permission checks are based on RTDB profile, not Firebase Auth.

🏠 Routing & Access Control
Public Routes

/login

/register

Protected Routes (via ProtectedRoute)

/

/families

/family/:srno

/create-family

/join-family

/admin

ProtectedRoute ensures:

auth state resolved

users redirected to /login if not authenticated

🧭 Main App Flow
1️⃣ Login / Register

User logs in via Email or Google

After login:

App checks /users/{uid}

If user record does not exist → redirect to /register

This prevents:
✅ orphan auth users
✅ skipping onboarding

2️⃣ Registration Logic

On Register:

User may:

create a new family

OR join an existing family (by SrNo)

If creating family:

new SR number generated via transaction

family stored under /families/{srno}

summary stored at /familyDetails/{srno}

user linked to family

public index created (masked email)

👨‍👩‍👧 Family Data Model
/families/{srno} (Main Data)

Contains:

cities

members

editor permissions

Example:

{
  "currentCity": "Vadodara",
  "nativeCity": "Bharuch",
  "createdBy": "uid123",
  "editorEmails": {
    "uid123": true
  },
  "members": {
    "mem1": {
      "name": "Rajesh",
      "mobile": "9xxxx",
      "gender": "Male",
      "active": true
    }
  },
  "updatedAt": 1690000000000
}

/familyDetails/{srno} (Lightweight Summary)

Used for:

fast listings

delta sync

reduced downloads

Example:

{
  "currentCity": "Vadodara",
  "nativeCity": "Bharuch",
  "totalMembers": 4,
  "lastUpdateTimestamp": 1690000000000
}


✅ Always updated when family changes

👥 Members & Editors
Members

Can be active / inactive

Inactive members:

hidden from non-editors

visible to editors & admins

Editors

Stored in:

families/{srno}/editorEmails/{uid}: true


Editors can:

edit family fields

add / edit / deactivate members

Admins can:

edit any family

create multiple families

🔁 Join Family Flow

User enters Family SrNo

App checks:

user has no family

family exists

Join request written to:

families/{srno}/pendingEditorEmails/{uid}


(Admin approval logic can be added later)

⚡ Offline Caching & Delta Sync
localForage

Families are cached locally:

family_{srno}

Delta Sync Logic

App loads /familyDetails/{srno}

Compares lastUpdateTimestamp

Fetches full /families/{srno} only if changed

Updates local cache

✅ Reduces Firebase reads
✅ Improves performance on slow networks

🛠 Service Layer (familyService.js)

All Firebase operations are centralized:

loadFamily

addMember

updateMember

updateFamily

UI components never touch RTDB directly.

✅ Cleaner code
✅ Easier security audits
✅ Future backend migration friendly

🔐 Security Rules Philosophy

Key principles:

Never trust client

Auth ≠ Permission

Editors ≠ Admins

Summary & full data are protected differently

Rules prevent:

self-promoting to admin

creating multiple families

editing other families

data poisoning

unauthorized reads/writes

✅ Why This Architecture Works

✔ Scales well
✔ Secure by design
✔ Easy to extend (invites, approvals, audit logs)
✔ Offline friendly
✔ Clear separation of concerns

🚀 Future Enhancements (Planned)

Admin approval for join requests

Audit logs for edits

Role-based admin dashboard

Supabase migration readiness

Family merge tools

Export (PDF / Excel)

🧠 Final Note

This app is not a tutorial-level project.
It uses real-world patterns suitable for:

community directories

membership systems

family / society management

association registers