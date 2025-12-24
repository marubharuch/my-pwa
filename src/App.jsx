// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinFamilyPage from "./pages/JoinFamilyPage";
import CreateFamilyPage from "./pages/CreateFamilyPage";
import FamilyListPage from "./pages/FamilyListPage";
import FamilyDetailPage from "./pages/FamilyDetailPage";
import RegisterEmailPage from "./pages/RegisterEmailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import FamilyDirectoryPage from "./pages/FamilyDirectoryPage";
import FamilyJoinRequestsPage from "./pages/FamilyJoinRequestsPage";
import DebugPage from "./pages/DebugPage";
import AdminPage from "./pages/AdminPage";
export default function App() {
  console.log("App component rendered");
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-email" element={<RegisterEmailPage />} />


<Route
  path="/debug"
  element={
    <MainLayout>
      <DebugPage />
    </MainLayout>
  }
/>



        {/* HOME WITH LAYOUT */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

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
<Route
          path="/dir"
          element={
            
              <MainLayout>
                <FamilyDirectoryPage/>
              </MainLayout>
            
          }
        />

<Route 
path="/family/:familyId/requests"
 element={

<ProtectedRoute>
      <MainLayout>
        <FamilyJoinRequestsPage />
      </MainLayout>
    </ProtectedRoute>   
 
 
 } />


        {/* PROTECTED ROUTES */}
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

        {/* ADMIN PAGE (protected, empty placeholder) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <MainLayout>
                Admin dashboard coming soon...
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* FALLBACK ROUTE */}
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
