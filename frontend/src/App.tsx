import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { FIRRegistryPage } from './pages/FIRRegistryPage';
import { PersonsPage } from './pages/PersonsPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MapPage } from './pages/MapPage';
import { GraphPage } from './pages/GraphPage';
import { AISearchPage } from './pages/AISearchPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { EvidencePage } from './pages/EvidencePage';
import { EvidenceDetailPage } from './pages/EvidenceDetailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { CourtPage } from './pages/CourtPage';
import { TasksPage } from './pages/TasksPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { AuditPage } from './pages/AuditPage';
import { UsersAdminPage } from './pages/UsersAdminPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/fir" element={<FIRRegistryPage />} />
            <Route path="/persons" element={<PersonsPage />} />
            <Route path="/persons/:id" element={<PersonDetailPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/ai-search" element={<AISearchPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/evidence/:id" element={<EvidenceDetailPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/court" element={<CourtPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/data-quality" element={<DataQualityPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/admin/users" element={<UsersAdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
