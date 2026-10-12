/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ItemRegistryPage } from './pages/ItemRegistryPage';
import { ReportItemPage } from './pages/ReportItemPage';
import { CollectionHubsPage } from './pages/CollectionHubsPage';
import { ClaimsVerificationPage } from './pages/ClaimsVerificationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuthPage } from './pages/AuthPage';

const ProtectedWorkspace: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="text-sm font-semibold text-indigo-700">
          Loading Campus Portal...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WorkspaceLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/items" element={<ItemRegistryPage />} />
        <Route path="/report" element={<ReportItemPage />} />
        <Route path="/hubs" element={<CollectionHubsPage />} />
        <Route path="/claims" element={<ClaimsVerificationPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkspaceLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*" element={<ProtectedWorkspace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
