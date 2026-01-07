// src/App.jsx
/**
 * 🚦 APPLICATION ROUTER – SINGLE SOURCE OF TRUTH
 *
 * PURPOSE
 * --------------------------------------------------
 * This file defines ALL application routes:
 *
 * 1️⃣ Public routes (login, register)
 * 2️⃣ Authenticated user routes
 * 3️⃣ Admin routes
 * 4️⃣ Super Admin routes (isolated)
 * 5️⃣ Family-related flows
 * 6️⃣ Debug & fallback handling
 *
 * IMPORTANT RULES
 * --------------------------------------------------
 * ❌ DO NOT put business logic here
 * ❌ DO NOT fetch Firebase data here
 * ✅ Only routing + layout wrapping
 *
 * ARCHITECTURE NOTES
 * --------------------------------------------------
 * - MainLayout handles Navbar + padding
 * - ProtectedRoute blocks unauthenticated users
 * - SuperAdmin pages are intentionally OUTSIDE MainLayout
 * - "/" (root) = Family Directory (public view)
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/* ===================== LAYOUT ===================== */
import MainLayout from "./layouts/MainLayout";

/* ===================== PUBLIC PAGES ===================== */
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterEmailPage from "./pages/RegisterEmailPage";

/* ===================== CORE USER PAGES ===================== */
import HomePage from "./pages/HomePage";
import JoinFamilyPage from "./pages/JoinFamilyPage";
import CreateFamilyPage from "./pages/CreateFamilyPage";
import FamilyListPage from "./pages/FamilyListPage";
import FamilyDirectoryPage from "./pages/FamilyDirectoryPage";
import TelDir from "./pages/TelDir.jsx";
import FamilyDetailPage from "./pages/FamilyDetailPage";

/* ===================== REQUESTS ===================== */
import FamilyJoinRequestsPage from "./pages/FamilyJoinRequestsPage";

/* ===================== ADMIN ===================== */
import AdminPage from "./pages/AdminPage";

/* ===================== SUPER ADMIN ===================== */
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import AdminCreateFamilyPage from "./pages/admin/AdminCreateFamilyPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminJoinRequestsPage from "./pages/admin/AdminJoinRequestsPage";
import SuperAdminFamilyDeletePage from "./pages/admin/SuperAdminFamilyDeletePage";
import LatestInfoEditor from "./pages/admin/LatestInfoEditor";
import LatestInfoViewer from "./components/LatestInfoViewer"; 

/* ===================== DEV / DEBUG ===================== */
import DebugPage from "./pages/DebugPage";

/* ===================== ROUTE GUARD ===================== */
import ProtectedRoute from "./components/ProtectedRoute";
import MissingEditorsPage from "./pages/admin/MissingEditorsPage";
import FeedbackBoard from "./components/FeedbackBoard.jsx";
export default function App() {
  console.log("App component rendered");

  return (
    <Router>
      <Routes>

        {/* =====================================================
            🟢 PUBLIC ROUTES (NO LOGIN REQUIRED)
           ===================================================== */}

        {/* Login (Google / Email) */}
        <Route
          path="/login"
          element={
            <MainLayout>
              <LoginPage />
            </MainLayout>
          }
        />

        {/* Email + Password registration (rarely used now) */}
        <Route path="/register" element={<RegisterPage />} />
<Route path="/missingeditors" element={<MainLayout><MissingEditorsPage /></MainLayout>} />
        
        {/* Email registration confirmation */}
        <Route path="/register-email" element={<RegisterEmailPage />} />

        {/* =====================================================
            🧪 DEBUG / DEV ROUTES
           ===================================================== */}
        <Route
          path="/debug"
          element={
            <MainLayout>
              <DebugPage />
            </MainLayout>
          }
        />
/--------------latestinfo editor route added here-----------------/
 <Route
          path="/latest-info-editor"
          element={
            <MainLayout>
              <LatestInfoEditor />
            </MainLayout>
          }
        />
        <Route
          path="/"
          element={
            <MainLayout>
              <LatestInfoViewer />
            </MainLayout>
          }
        />


        {/* =====================================================
            👑 SUPER ADMIN ROUTES
            - NOT wrapped in MainLayout intentionally
            - SuperAdminDashboard controls its own UI
           ===================================================== */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route
          path="/superadmin/create-family"
          element={<AdminCreateFamilyPage />}
        />
        <Route
          path="/superadmin/delete-family"
          element={<SuperAdminFamilyDeletePage />}
        />

        <Route path="/superadmin/users" element={<MainLayout><AdminUsersPage /></MainLayout>} />
        <Route
          path="/superadmin/join-requests"
          element={<MainLayout><AdminJoinRequestsPage /></MainLayout>}
        />

        {/* =====================================================
            🏠 HOME (AUTHENTICATED)
           ===================================================== */}
        <Route
          path="/home"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        {/* =====================================================
            👨‍👩‍👧‍👦 FAMILY FLOWS (PROTECTED)
           ===================================================== */}

        {/* User creates own family */}
        <Route
          path="/create-family"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CreateFamilyPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Join an existing family */}
        <Route
          path="/join-family"
          element={
            <ProtectedRoute>
              <MainLayout>
                <JoinFamilyPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Family join requests (family-level approval) */}
        <Route
          path="/family/:familyId/requests"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FamilyJoinRequestsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* View single family details */}
        <Route
          path="/family/:srno"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FamilyDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            📋 DIRECTORY & LISTING
           ===================================================== */}

        {/* ROOT = FAMILY DIRECTORY (PUBLIC READ) */}
        <Route
          path="/femdir"
          element={
            <MainLayout>
              <FamilyDirectoryPage />
            </MainLayout>
          }
        />

        <Route
          path="/tel"
          element={
            <MainLayout>
              <TelDir />
            </MainLayout>
          }
        />

        {/* Alternative family list (older / admin utility) */}
        <Route
          path="/families"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FamilyListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            🛠 ADMIN (NORMAL ADMIN, NOT SUPER ADMIN)
           ===================================================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin join requests shortcut */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AdminJoinRequestsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/feedback"
         element={

          
              <MainLayout>
                <FeedbackBoard />
              </MainLayout>
            
          }
        />
             

        {/* =====================================================
            ❌ FALLBACK (404)
           ===================================================== */}
        <Route
          path="*"
          element={
            <MainLayout>
              <div className="p-4 text-center text-red-500">
                Page not found
              </div>
            </MainLayout>
          }
        />

      </Routes>
    </Router>
  );
}
